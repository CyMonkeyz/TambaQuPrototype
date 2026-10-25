// @vitest-environment jsdom
/// <reference types="node" />
import 'fake-indexeddb/auto';
import { webcrypto } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authDb, registerLocal, loginLocal, readLocalSession, logoutLocal } from './localAuth';
vi.stubGlobal('crypto', webcrypto);
beforeEach(async () => {
  sessionStorage.clear();
  await authDb.sessions.clear();
  await authDb.accounts.clear();
});
describe('browser-local expo authentication', () => {
  it('registers without storing plaintext and normalizes email', async () => {
    await registerLocal('  Expo@Example.test ', 'expo-test-Only123', 'Wildan');
    const account = await authDb.accounts.toCollection().first();
    expect(account?.email).toBe('expo@example.test');
    expect(JSON.stringify(account)).not.toContain('expo-test-Only123');
    expect(account?.salt.length).toBeGreaterThan(20);
    expect((await readLocalSession())?.user.name).toBe('Wildan');
  });
  it('rejects wrong credentials and requires real registration', async () => {
    await expect(loginLocal('absent@example.test', 'expo-test-Only123')).rejects.toThrow();
    await registerLocal('expo@example.test', 'expo-test-Only123', 'Expo');
    await logoutLocal();
    await expect(loginLocal('expo@example.test', 'incorrect-password')).rejects.toThrow();
    expect(await readLocalSession()).toBeNull();
    await loginLocal('EXPO@example.test', 'expo-test-Only123');
    expect((await readLocalSession())?.user.email).toBe('expo@example.test');
  });
  it('rejects duplicate accounts and weak passwords', async () => {
    await expect(registerLocal('invalid', 'short', 'Expo')).rejects.toThrow();
    await registerLocal('expo@example.test', 'expo-test-Only123', 'Expo');
    await expect(registerLocal('EXPO@example.test', 'another-password123', 'Expo')).rejects.toThrow();
  });
  it('invalidates logout, expired sessions, and forged local state', async () => {
    localStorage.setItem('tambaqu-session', JSON.stringify({activeUser:{id:'forged'}}));
    expect(await readLocalSession()).toBeNull();
    await registerLocal('expo@example.test', 'expo-test-Only123', 'Expo');
    await authDb.sessions.toCollection().modify({expiresAt: Date.now()-1});
    expect(await readLocalSession()).toBeNull();
    await loginLocal('expo@example.test', 'expo-test-Only123');
    await logoutLocal();
    expect(await readLocalSession()).toBeNull();
    expect(await authDb.sessions.count()).toBe(0);
  });
});
