// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppRouter } from './index';
import { useAppStore } from '../../store/app-store';
import { demoFarm, demoUser } from '../../data/mock/fixtures';
vi.mock('../../services/localAuth', () => ({ useLocalSession: () => ({ session: null, loading: false }), loginLocal: vi.fn(), registerLocal: vi.fn() }));
afterEach(cleanup);
describe('registered account access boundary', () => {
  it.each(['/demo', '/expo', '/app/dashboard', '/pilot'])('rejects stale local demo session on %s', async path => {
    useAppStore.setState({ activeUser: demoUser, activeFarm: demoFarm, demoMode: true });
    render(<MemoryRouter initialEntries={[path]}><AppRouter /></MemoryRouter>);
    expect(await screen.findByRole('heading', {name:'Masuk ke TambaQu'}, {timeout:10000})).toBeTruthy();
    expect(screen.queryByRole('button',{name:'Coba Demo'})).toBeNull();
  });
});
