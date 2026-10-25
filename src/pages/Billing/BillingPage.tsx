import { useEffect, useRef, useState } from 'react';
import { Check, Download, Layers3, Receipt, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Dialog } from '../../components/ui/Overlay';
import { toast } from '../../components/ui/toast-api';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { BILLING_MODULES, BILLING_STATUS, calculateTotal, invoiceText, localBilling, rupiah, type BillingCycle, type BillingOrder, type ModuleId, type PaymentOutcome } from '../../services/localBilling';

/** Parent must pass the authenticated local session user id. No shared/demo fallback account. */
export function BillingPage({ userId }: { userId: string }) {
  useDocumentTitle('Langganan & Tagihan');
  return <BillingWorkspace key={userId} userId={userId} />;
}

function BillingWorkspace({ userId }: { userId: string }) {
  const [modules, setModules] = useState<ModuleId[]>(['monitoring']);
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [units, setUnits] = useState('1');
  const [orders, setOrders] = useState<BillingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const alive = useRef(true);
  const requestId = useRef('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [outcome, setOutcome] = useState<PaymentOutcome>('success');
  const [cancelOrder, setCancelOrder] = useState<BillingOrder | null>(null);
  const [invoice, setInvoice] = useState<BillingOrder | null>(null);
  const selection = { modules, cycle, units: Number(units) };
  let validation = '';
  let quote: ReturnType<typeof calculateTotal> | null = null;
  try { quote = calculateTotal(selection); } catch (error) { validation = (error as Error).message; }
  const liveOrder = orders.find(order => order.status === 'active' || order.status === 'pending');

  async function refresh() {
    const next = await localBilling.list(userId);
    if (alive.current) { setOrders(next); setLoadError(''); }
  }
  useEffect(() => {
    alive.current = true;
    void refresh().catch(() => {
      if (alive.current) setLoadError('Penyimpanan tagihan tidak tersedia. Izinkan IndexedDB di browser lalu coba lagi.');
    }).finally(() => { if (alive.current) setLoading(false); });
    return () => { alive.current = false; };
    // The keyed workspace remounts on account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function act(operation: () => Promise<unknown>, message: string) {
    if (locked.current) return;
    locked.current = true; setBusy(true);
    try {
      await operation();
      await refresh();
      if (alive.current) { setCheckoutOpen(false); setCancelOrder(null); toast.success(message); }
    } catch (error) {
      if (alive.current) toast.error(error instanceof Error ? error.message : 'Perubahan belum tersimpan. Coba lagi.');
    } finally {
      locked.current = false;
      if (alive.current) setBusy(false);
    }
  }

  function download(order: BillingOrder) {
    try {
      const url = URL.createObjectURL(new Blob([invoiceText(order)], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url; link.download = `${order.invoiceNumber}.txt`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('Invoice demo disiapkan untuk diunduh.');
    } catch { toast.error('Unduhan tidak tersedia. Salin isi invoice dari tampilan ini.'); }
  }

  return <div className="space-y-6">
    <PageHeader eyebrow="Layanan modular · HaaS" title="Langganan & Tagihan" description="Rancang kebutuhan tambak, lihat estimasi biaya, dan coba alur pembayaran tanpa transaksi nyata." />
    <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-6">
      <ShieldCheck className="mt-1 shrink-0 text-primary" size={22} />
      <div><strong className="text-primary">DEMO · Harga ilustratif, bukan penawaran komersial.</strong><p className="text-foreground-muted">Tidak ada uang ditarik, data kartu diminta, atau perangkat dikirim. Data hanya tersimpan di browser ini, terpisah per akun lokal; bukan sistem penagihan produksi.</p></div>
    </div>
    {loading ? <Card className="p-6" role="status">Memuat tagihan lokal…</Card> : loadError ? <Card className="p-6"><p role="alert">{loadError}</p><Button className="mt-4" variant="secondary" isLoading={busy} onClick={() => void act(refresh, 'Tagihan lokal berhasil dimuat.')}>Coba lagi</Button></Card> : <>
      {liveOrder && <Card className="flex flex-col justify-between gap-4 border-primary/30 p-5 sm:flex-row sm:items-center">
        <div><p className="text-xs font-bold uppercase tracking-wider text-primary">Langganan demo</p><h2 className="mt-2 text-lg font-semibold">{BILLING_STATUS[liveOrder.status]}</h2><p className="mt-1 text-sm text-foreground-muted">{liveOrder.units} kolam · {liveOrder.quote.months} bulan · {rupiah(liveOrder.quote.total)} · Tanpa perpanjangan otomatis</p></div>
        <div className="flex flex-wrap gap-2">
          {liveOrder.status === 'pending' && <><Button isLoading={busy} onClick={() => void act(() => localBilling.resolve(userId, liveOrder.id, 'success'), 'Simulasi berhasil. Langganan demo aktif.')}>Simulasikan berhasil</Button><Button variant="secondary" disabled={busy} onClick={() => void act(() => localBilling.resolve(userId, liveOrder.id, 'failure'), 'Simulasi gagal dicatat. Anda dapat mencoba checkout baru.')}>Simulasikan gagal</Button></>}
          <Button variant="secondary" disabled={busy} onClick={() => setCancelOrder(liveOrder)}>Batalkan langganan</Button>
        </div>
      </Card>}
      <div className="grid items-start gap-5 xl:grid-cols-[1fr_340px]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3"><Layers3 className="text-primary" size={23} /><h2 className="text-lg font-semibold">Sesuaikan paket tambakmu</h2></div>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">Pilih modul yang dibutuhkan. Harga sewa ilustratif dihitung per kolam, per bulan.</p>
          <fieldset className="mt-6"><legend className="mb-3 text-sm font-semibold">1. Periode langganan</legend><div className="grid grid-cols-2 gap-3">{(['monthly', 'annual'] as const).map(value => <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${cycle === value ? 'border-primary bg-primary/5' : 'border-border'}`}><input type="radio" name="billing-cycle" value={value} checked={cycle === value} onChange={() => setCycle(value)} className="accent-primary" /><span className="font-semibold">{value === 'monthly' ? 'Bulanan' : 'Tahunan'}{value === 'annual' && <span className="mt-1 block text-xs font-normal text-primary">Hemat ilustratif 10%</span>}</span></label>)}</div></fieldset>
          <fieldset className="mt-6"><legend className="mb-3 text-sm font-semibold">2. Pilih modul HaaS</legend><div className="space-y-3">{BILLING_MODULES.map(module => <label key={module.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${modules.includes(module.id) ? 'border-primary bg-primary/5' : 'border-border hover:bg-surface-muted'}`}><input type="checkbox" className="mt-1 size-4 accent-primary" checked={modules.includes(module.id)} onChange={() => setModules(current => current.includes(module.id) ? current.filter(id => id !== module.id) : [...current, module.id])} /><span className="min-w-0 flex-1"><span className="flex flex-wrap justify-between gap-2 font-semibold"><span>{module.name}</span><span className="text-primary">{rupiah(module.price)}<span className="text-xs font-normal text-foreground-muted"> / bulan</span></span></span><span className="mt-2 block text-sm leading-6 text-foreground-muted">{module.description}</span></span></label>)}</div></fieldset>
          <div className="mt-6"><label htmlFor="billing-units" className="block text-sm font-semibold">Jumlah kolam</label><input id="billing-units" type="number" min={1} max={100} step={1} value={units} aria-invalid={!!validation} aria-describedby="billing-validation" onChange={event => setUnits(event.target.value)} className="mt-3 min-h-11 w-full rounded-xl border border-border bg-surface px-4 sm:w-40" /><p className="mt-2 text-xs text-foreground-muted">1–100 kolam. Tidak termasuk instalasi, pajak, atau logistik; semuanya di luar simulasi ini.</p></div>
          {validation && <p role="alert" id="billing-validation" className="mt-3 text-sm text-risk-critical">{validation}</p>}
        </Card>
        <Card className="p-5 sm:p-6 xl:sticky xl:top-6"><p className="text-xs font-bold uppercase tracking-wider text-primary">Estimasi ilustratif</p><h2 className="mt-2 text-lg font-semibold">Ringkasan pesanan</h2><div className="my-5 space-y-3 text-sm">{modules.map(id => <div className="flex justify-between gap-3" key={id}><span>{BILLING_MODULES.find(module => module.id === id)?.name}</span><Check size={16} className="text-primary" /></div>)}<p className="text-foreground-muted">{units || '0'} kolam · {cycle === 'annual' ? '12 bulan, dibayar di muka' : '1 bulan'}</p></div><dl className="space-y-3 border-t border-border pt-4 text-sm"><div className="flex justify-between"><dt>Subtotal periode</dt><dd>{quote ? rupiah(quote.subtotal) : '—'}</dd></div><div className="flex justify-between"><dt>Diskon tahunan (10%)</dt><dd>{quote ? rupiah(quote.discount) : '—'}</dd></div><div className="flex justify-between border-t border-border pt-4 font-semibold"><dt>Total simulasi</dt><dd className="text-lg text-primary">{quote ? rupiah(quote.total) : '—'}</dd></div></dl><Button className="mt-6 w-full" disabled={!quote || !!liveOrder || busy} onClick={() => { requestId.current = crypto.randomUUID(); setAccepted(false); setOutcome('success'); setCheckoutOpen(true); }}>Lanjut ke konfirmasi</Button><p className="mt-3 text-xs leading-5 text-foreground-muted">{liveOrder ? 'Batalkan langganan aktif atau pembayaran menunggu sebelum membuat pesanan baru.' : 'Anda akan memilih hasil pembayaran simulasi pada langkah berikutnya.'}</p></Card>
      </div>
      <Card className="p-5 sm:p-6"><div className="flex items-center gap-3"><Receipt size={22} className="text-primary" /><h2 className="text-lg font-semibold">Riwayat & invoice demo</h2></div>{orders.length === 0 ? <div className="py-10 text-center"><Receipt size={32} className="mx-auto text-foreground-muted" /><p className="mt-3 font-semibold">Belum ada tagihan</p><p className="mt-2 text-sm text-foreground-muted">Pesanan simulasi pertama akan muncul di sini.</p></div> : <ul className="mt-5 divide-y divide-border">{orders.map(order => <li key={order.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"><div className="min-w-0"><p className="text-sm font-semibold">{BILLING_STATUS[order.status]} · {rupiah(order.quote.total)}</p><p className="mt-1 break-all text-xs leading-5 text-foreground-muted">{new Date(order.createdAt).toLocaleDateString('id-ID')} · {order.units} kolam · {order.quote.months} bulan<br />{order.invoiceNumber}</p></div><Button variant="secondary" onClick={() => setInvoice(order)} aria-label={`Lihat invoice ${order.invoiceNumber}`}>Lihat invoice</Button></li>)}</ul>}</Card>
    </>}
    <Dialog open={checkoutOpen} onOpenChange={open => { if (!busy) setCheckoutOpen(open); }} title="Konfirmasi pesanan demo" description="Tidak terhubung ke bank atau payment gateway. Pilih hasil simulasi untuk mencoba alur tagihan.">
      <div className="rounded-xl bg-surface-muted p-4"><p className="text-sm">{modules.map(id => BILLING_MODULES.find(module => module.id === id)?.name).join(' + ')}</p><p className="mt-2 text-sm text-foreground-muted">{units} kolam · {quote?.months} bulan</p><p className="mt-3 text-xl font-semibold text-primary">{quote && rupiah(quote.total)}</p></div>
      <fieldset className="mt-5" disabled={busy}><legend className="mb-3 text-sm font-semibold">Hasil pembayaran simulasi</legend><div className="flex flex-wrap gap-4">{([{ id: 'success', label: 'Berhasil' }, { id: 'failure', label: 'Gagal' }, { id: 'pending', label: 'Menunggu' }] as const).map(option => <label key={option.id} className="flex min-h-11 items-center gap-2 text-sm"><input type="radio" name="payment-outcome" checked={outcome === option.id} onChange={() => setOutcome(option.id)} className="accent-primary" />{option.label}</label>)}</div></fieldset>
      <label className="my-4 flex items-start gap-3 text-sm leading-6"><input type="checkbox" className="mt-1 size-4 shrink-0 accent-primary" checked={accepted} disabled={busy} onChange={event => setAccepted(event.target.checked)} /><span>Saya memahami ini hanya demo, harga ilustratif, tanpa pembayaran dan perpanjangan otomatis.</span></label>
      <Button className="w-full" isLoading={busy} disabled={!accepted || !quote} onClick={() => void act(() => localBilling.checkout(userId, selection, outcome, requestId.current), outcome === 'success' ? 'Pembayaran simulasi berhasil. Langganan demo aktif.' : outcome === 'failure' ? 'Simulasi pembayaran gagal dicatat. Tidak ada uang ditarik; coba pesanan baru.' : 'Pembayaran demo menunggu. Pilih hasil akhir pada kartu langganan.')}>Simulasikan pembayaran</Button>
    </Dialog>
    <Dialog open={!!cancelOrder} onOpenChange={open => { if (!busy && !open) setCancelOrder(null); }} title="Batalkan langganan demo?" description="Pembatalan berlaku langsung di demo. Riwayat dan invoice tetap tersimpan. Tidak ada tagihan berikutnya atau pengembalian dana nyata."><div className="flex flex-wrap justify-end gap-2"><Button variant="secondary" disabled={busy} onClick={() => setCancelOrder(null)}>Tetap berlangganan</Button><Button variant="danger" isLoading={busy} onClick={() => cancelOrder && void act(() => localBilling.cancel(userId, cancelOrder.id, true), 'Langganan demo dibatalkan. Riwayat tetap tersimpan.')}>Ya, batalkan demo</Button></div></Dialog>
    <Dialog open={!!invoice} onOpenChange={open => { if (!open) setInvoice(null); }} title="Invoice demo" description="Dokumen simulasi lokal, bukan kuitansi atau faktur pajak.">{invoice && <><pre className="whitespace-pre-wrap break-all rounded-xl bg-surface-muted p-4 font-sans text-sm leading-6">{invoiceText(invoice)}</pre><Button className="mt-4 w-full" leadingIcon={<Download size={17} />} onClick={() => download(invoice)}>Unduh invoice (.txt)</Button></>}</Dialog>
  </div>;
}
export default BillingPage;
