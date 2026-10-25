import Dexie, { type Table } from 'dexie';

/** DEMO only. Illustrative prices, no gateway, tax collection or real contract. */
export const BILLING_MODULES = [
  { id: 'monitoring', name: 'Monitoring air', description: 'Sensor kualitas air & dasbor kondisi kolam.', price: 150000 },
  { id: 'aeration', name: 'Kontrol aerasi', description: 'Simulasi kontrol aerator & jadwal operasional.', price: 100000 },
  { id: 'assistance', name: 'Pendampingan', description: 'Ilustrasi dukungan Pondivator & evaluasi budidaya.', price: 75000 },
] as const;
export type ModuleId = typeof BILLING_MODULES[number]['id'];
export type BillingCycle = 'monthly' | 'annual';
export type PaymentOutcome = 'success' | 'failure' | 'pending';
export type OrderStatus = 'active' | 'failed' | 'pending' | 'cancelled';
export interface BillingSelection { modules: readonly ModuleId[]; cycle: BillingCycle; units: number }
export interface BillingQuote { monthly: number; months: number; subtotal: number; discount: number; total: number }
export interface BillingOrder extends BillingSelection {
  id: string; userId: string; requestId: string; invoiceNumber: string;
  quote: BillingQuote; payment: PaymentOutcome; status: OrderStatus;
  createdAt: number; updatedAt: number;
}
export const rupiah = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
export function calculateTotal(selection: BillingSelection): BillingQuote {
  if (!selection || !['monthly', 'annual'].includes(selection.cycle)) throw new Error('Pilih periode bulanan atau tahunan.');
  if (!Number.isInteger(selection.units) || selection.units < 1 || selection.units > 100) throw new Error('Jumlah kolam harus bilangan bulat 1–100.');
  if (!Array.isArray(selection.modules) || !selection.modules.length || new Set(selection.modules).size !== selection.modules.length || selection.modules.some(id => !BILLING_MODULES.some(module => module.id === id))) throw new Error('Pilih minimal satu modul yang valid, tanpa duplikat.');
  const monthly = selection.modules.reduce((sum, id) => sum + BILLING_MODULES.find(module => module.id === id)!.price, 0) * selection.units;
  const months = selection.cycle === 'annual' ? 12 : 1;
  const subtotal = monthly * months;
  const discount = selection.cycle === 'annual' ? Math.round(subtotal * 0.1) : 0;
  return { monthly, months, subtotal, discount, total: subtotal - discount };
}
const validateId = (value: string) => { if (typeof value !== 'string' || !value.trim() || value.length > 200) throw new Error('Identitas akun atau permintaan tidak valid.'); };
const validateOutcome = (value: PaymentOutcome) => { if (!['success', 'failure', 'pending'].includes(value)) throw new Error('Pilih hasil pembayaran simulasi yang valid.'); };
const statusFor = (outcome: PaymentOutcome): OrderStatus => outcome === 'success' ? 'active' : outcome === 'failure' ? 'failed' : 'pending';

export class LocalBilling {
  private db: Dexie;
  private orders: Table<BillingOrder, string>;
  constructor(name = 'tambaqu-demo-billing-v1') {
    this.db = new Dexie(name);
    this.db.version(1).stores({ orders: 'id,userId,&[userId+requestId]' });
    this.orders = this.db.table('orders');
  }
  async list(userId: string): Promise<BillingOrder[]> {
    validateId(userId);
    return (await this.orders.where('userId').equals(userId).toArray()).sort((a, b) => b.createdAt - a.createdAt);
  }
  async checkout(userId: string, selection: BillingSelection, payment: PaymentOutcome, requestId: string): Promise<BillingOrder> {
    validateId(userId); validateId(requestId); validateOutcome(payment);
    const quote = calculateTotal(selection);
    return this.db.transaction('rw', this.orders, async () => {
      const existing = await this.orders.where('[userId+requestId]').equals([userId, requestId]).first();
      if (existing) return existing;
      if ((await this.list(userId)).some(order => order.status === 'active' || order.status === 'pending')) throw new Error('Akun memiliki langganan aktif atau pembayaran menunggu. Batalkan terlebih dahulu.');
      const id = crypto.randomUUID();
      const now = Date.now();
      const order: BillingOrder = { ...selection, modules: [...selection.modules], quote, id, userId, requestId, payment, status: statusFor(payment), invoiceNumber: `DEMO-${id.toUpperCase()}`, createdAt: now, updatedAt: now };
      await this.orders.add(order);
      return order;
    });
  }
  async resolve(userId: string, orderId: string, payment: Exclude<PaymentOutcome, 'pending'>): Promise<BillingOrder> {
    validateOutcome(payment);
    if (payment !== 'success' && payment !== 'failure') throw new Error('Pilih berhasil atau gagal.');
    return this.change(userId, orderId, order => {
      if (order.status !== 'pending') throw new Error('Hanya pembayaran menunggu yang dapat diselesaikan.');
      return { ...order, payment, status: statusFor(payment), updatedAt: Date.now() };
    });
  }
  async cancel(userId: string, orderId: string, confirmed: boolean): Promise<BillingOrder> {
    if (confirmed !== true) throw new Error('Konfirmasi pembatalan diperlukan.');
    return this.change(userId, orderId, order => {
      if (order.status !== 'active' && order.status !== 'pending') throw new Error('Langganan ini tidak dapat dibatalkan.');
      return { ...order, status: 'cancelled', updatedAt: Date.now() };
    });
  }
  private async change(userId: string, orderId: string, update: (order: BillingOrder) => BillingOrder) {
    validateId(userId); validateId(orderId);
    return this.db.transaction('rw', this.orders, async () => {
      const order = await this.orders.get(orderId);
      if (!order || order.userId !== userId) throw new Error('Tagihan tidak ditemukan untuk akun ini.');
      const next = update(order);
      await this.orders.put(next);
      return next;
    });
  }
  async close() { this.db.close(); }
}
export const localBilling = new LocalBilling();
export const BILLING_STATUS: Record<OrderStatus, string> = { active: 'Aktif', pending: 'Menunggu pembayaran', failed: 'Pembayaran gagal', cancelled: 'Dibatalkan' };
export function invoiceText(order: BillingOrder) {
  return [
    'TambaQu — INVOICE DEMO / BUKAN BUKTI PEMBAYARAN NYATA', order.invoiceNumber,
    `Tanggal: ${new Date(order.createdAt).toLocaleDateString('id-ID')}`,
    `Akun lokal: ${order.userId}`, `Status: ${BILLING_STATUS[order.status]}`,
    `Hasil simulasi: ${order.payment}`, `Periode: ${order.quote.months} bulan; ${order.units} kolam`,
    ...order.modules.map(id => `Modul: ${BILLING_MODULES.find(module => module.id === id)?.name ?? id}`),
    `Subtotal: ${rupiah(order.quote.subtotal)}`, `Diskon ilustratif: ${rupiah(order.quote.discount)}`,
    `Total: ${rupiah(order.quote.total)}`,
    'Harga ilustratif, bukan penawaran komersial. Tidak ada uang ditarik, pajak dipungut, perangkat dikirim, atau perpanjangan otomatis.',
    'Data hanya tersimpan di browser ini. Pembatalan demo berlaku langsung tanpa pengembalian dana nyata.',
  ].join('\n');
}
