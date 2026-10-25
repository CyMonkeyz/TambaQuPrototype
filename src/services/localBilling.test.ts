// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { LocalBilling, calculateTotal, invoiceText } from './localBilling';

const instances: LocalBilling[] = [];
const make = (name = `billing-test-${crypto.randomUUID()}`) => { const service = new LocalBilling(name); instances.push(service); return service; };
const selection = { modules: ['monitoring', 'aeration'], cycle: 'monthly', units: 2 } as const;
afterEach(async () => { for (const service of instances.splice(0)) await service.close(); });

describe('illustrative HaaS quote', () => {
  it('calculates modular monthly total in integer rupiah', () => {
    expect(calculateTotal(selection)).toMatchObject({ monthly: 500000, subtotal: 500000, discount: 0, total: 500000, months: 1 });
  });
  it('applies 10 percent discount to annual prepaid period', () => {
    expect(calculateTotal({ ...selection, cycle: 'annual' })).toMatchObject({ subtotal: 6000000, discount: 600000, total: 5400000, months: 12 });
  });
  it.each([
    { ...selection, units: 0 }, { ...selection, units: 1.5 }, { ...selection, units: 101 },
    { ...selection, modules: [] }, { ...selection, modules: ['unknown'] },
    { ...selection, modules: ['monitoring', 'monitoring'] }, { ...selection, cycle: 'weekly' },
  ])('rejects invalid input %#', (input) => { expect(() => calculateTotal(input as never)).toThrow(); });
});

describe('local account billing ledger', () => {
  it('persists successful payments and immutable invoice totals after reopening', async () => {
    const name = `billing-test-${crypto.randomUUID()}`;
    const service = make(name);
    const order = await service.checkout('alice', selection, 'success', 'request-1');
    expect(order.status).toBe('active');
    expect(invoiceText(order)).toContain('DEMO');
    expect(invoiceText(order)).toContain('500.000');
    await service.close();
    const reopened = make(name);
    expect(await reopened.list('alice')).toEqual([order]);
    expect(await reopened.list('bob')).toEqual([]);
  });
  it('deduplicates simultaneous checkout clicks and prevents a second live subscription', async () => {
    const service = make();
    const orders = await Promise.all([service.checkout('alice', selection, 'success', 'same'), service.checkout('alice', selection, 'success', 'same')]);
    expect(orders[0].id).toBe(orders[1].id);
    expect(await service.list('alice')).toHaveLength(1);
    await expect(service.checkout('alice', selection, 'success', 'another')).rejects.toThrow(/aktif|menunggu/);
  });
  it('records failure without activation and permits a new checkout', async () => {
    const service = make();
    expect((await service.checkout('alice', selection, 'failure', 'fail')).status).toBe('failed');
    expect((await service.checkout('alice', selection, 'success', 'retry')).status).toBe('active');
  });
  it('keeps pending payment inactive until explicit simulated resolution', async () => {
    const service = make();
    const order = await service.checkout('alice', selection, 'pending', 'pending');
    expect(order.status).toBe('pending');
    expect((await service.resolve('alice', order.id, 'success')).status).toBe('active');
    await expect(service.resolve('alice', order.id, 'failure')).rejects.toThrow();
  });
  it('requires cancellation confirmation, isolates accounts, and preserves history', async () => {
    const service = make();
    const order = await service.checkout('alice', selection, 'success', 'buy');
    await expect(service.cancel('alice', order.id, false)).rejects.toThrow(/konfirmasi/i);
    await expect(service.cancel('bob', order.id, true)).rejects.toThrow();
    await expect(service.resolve('bob', order.id, 'success')).rejects.toThrow();
    expect((await service.cancel('alice', order.id, true)).status).toBe('cancelled');
    expect((await service.list('alice'))[0].payment).toBe('success');
    expect((await service.checkout('alice', selection, 'pending', 'new')).status).toBe('pending');
  });
  it('persists cancellation across reloads and can resolve pending as failed', async () => {
    const name = `billing-test-${crypto.randomUUID()}`;
    const service = make(name);
    const order = await service.checkout('alice', selection, 'pending', 'pending-fail');
    expect((await service.resolve('alice', order.id, 'failure')).status).toBe('failed');
    const active = await service.checkout('alice', selection, 'success', 'active');
    await service.cancel('alice', active.id, true);
    await service.close();
    const reopened = make(name);
    expect((await reopened.list('alice')).find(item => item.id === active.id)?.status).toBe('cancelled');
    expect(await reopened.list('bob')).toHaveLength(0);
  });
  it('deduplicates failed checkout attempts without creating more history', async () => {
    const service = make();
    const first = await service.checkout('alice', selection, 'failure', 'failed-once');
    expect((await service.checkout('alice', selection, 'success', 'failed-once')).id).toBe(first.id);
    expect(await service.list('alice')).toHaveLength(1);
    expect((await service.list('alice'))[0].status).toBe('failed');
  });
  it('validates account, request id and simulated outcome', async () => {
    const service = make();
    await expect(service.checkout('', selection, 'success', 'x')).rejects.toThrow();
    await expect(service.checkout('alice', selection, 'success', '')).rejects.toThrow();
    await expect(service.checkout('alice', selection, 'real' as never, 'x')).rejects.toThrow();
  });
});
