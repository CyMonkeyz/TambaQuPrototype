// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { BillingPage } from './BillingPage';
import { localBilling } from '../../services/localBilling';
afterEach(cleanup);

it('confirms a pending demo checkout, resolves it, displays invoice, and confirms cancellation', async () => {
  const userId = crypto.randomUUID();
  render(<BillingPage userId={userId} />);
  await screen.findByRole('button', { name: 'Lanjut ke konfirmasi' });
  fireEvent.click(screen.getByRole('button', { name: 'Lanjut ke konfirmasi' }));
  const confirmation = await screen.findByRole('dialog');
  fireEvent.click(within(confirmation).getByLabelText('Menunggu'));
  fireEvent.click(within(confirmation).getByLabelText(/Saya memahami/));
  fireEvent.click(within(confirmation).getByRole('button', { name: 'Simulasikan pembayaran' }));
  await screen.findByRole('button', { name: 'Simulasikan berhasil' });
  expect((await localBilling.list(userId))[0].status).toBe('pending');
  fireEvent.click(screen.getByRole('button', { name: 'Simulasikan berhasil' }));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Simulasikan berhasil' })).toBeNull());
  fireEvent.click(screen.getByRole('button', { name: /Lihat invoice/ }));
  expect(within(await screen.findByRole('dialog')).getByText(/BUKAN BUKTI PEMBAYARAN NYATA/)).toBeTruthy();
  const createUrl = vi.fn(() => 'blob:demo-invoice');
  const revokeUrl = vi.fn();
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: revokeUrl }));
  const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  fireEvent.click(screen.getByRole('button', { name: 'Unduh invoice (.txt)' }));
  expect(createUrl.mock.calls).toHaveLength(1);
  expect(anchorClick).toHaveBeenCalledOnce();
  const anchor = anchorClick.mock.instances[0] as HTMLAnchorElement;
  expect(anchor.download).toMatch(/^DEMO-.*\.txt$/);
  anchorClick.mockRestore();
  vi.unstubAllGlobals();
  fireEvent.click(screen.getByRole('button', { name: 'Tutup dialog' }));
  fireEvent.click(screen.getByRole('button', { name: 'Batalkan langganan' }));
  expect((await localBilling.list(userId))[0].status).toBe('active');
  fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Ya, batalkan demo' }));
  await waitFor(async () => expect((await localBilling.list(userId))[0].status).toBe('cancelled'));
});

it('prevents invalid checkout and does not expose another account history', async () => {
  const account = crypto.randomUUID();
  await localBilling.checkout(account, { modules: ['monitoring'], cycle: 'monthly', units: 1 }, 'success', 'seed');
  const view = render(<BillingPage userId={account} />);
  await screen.findByRole('button', { name: 'Batalkan langganan' });
  view.rerender(<BillingPage userId={crypto.randomUUID()} />);
  await screen.findByRole('button', { name: 'Lanjut ke konfirmasi' });
  expect(screen.queryByRole('button', { name: /Lihat invoice/ })).toBeNull();
  fireEvent.change(screen.getByLabelText('Jumlah kolam'), { target: { value: '0' } });
  expect(screen.getByRole('alert').textContent).toContain('1–100');
  expect((screen.getByRole('button', { name: 'Lanjut ke konfirmasi' }) as HTMLButtonElement).disabled).toBe(true);
});
