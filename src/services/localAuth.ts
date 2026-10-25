import Dexie, { type Table } from 'dexie';
import { useEffect, useState } from 'react';
export interface LocalUser { id: string; email: string; name: string }
export interface LocalSession { user: LocalUser; expiresAt: number }
interface Account extends LocalUser { salt: string; hash: string; iterations: number }
interface StoredSession { tokenHash: string; userId: string; expiresAt: number }
class AuthDatabase extends Dexie {
  accounts!: Table<Account, string>;
  sessions!: Table<StoredSession, string>;
  constructor() { super('tambaqu-expo-auth'); this.version(1).stores({accounts:'id,&email',sessions:'tokenHash,userId,expiresAt'}); }
}
export const authDb = new AuthDatabase();
const KEY = 'tambaqu-expo-access';
const EVENT = 'tambaqu-auth-changed';
const ITERATIONS = 210000;
const TTL = 12 * 60 * 60 * 1000;
function bytesToHex(bytes: ArrayBuffer | Uint8Array) { return Array.from(new Uint8Array(bytes)).map(v=>v.toString(16).padStart(2,'0')).join(''); }
function hexBytes(hex: string) { return Uint8Array.from(hex.match(/.{2}/g) ?? [], v=>parseInt(v,16)); }
async function derive(password: string, salt: string, iterations: number) {
  if (!crypto.subtle) throw new Error('Buka aplikasi melalui HTTPS atau localhost untuk mengaktifkan akun demo.');
  const material = await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  return bytesToHex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:hexBytes(salt),iterations,hash:'SHA-256'},material,256));
}
async function tokenDigest(token: string) { return bytesToHex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))); }
function notify() { window.dispatchEvent(new Event(EVENT)); }
function publicUser(account: Account): LocalUser { return {id:account.id,email:account.email,name:account.name}; }
async function startSession(account: Account): Promise<LocalSession> {
  await logoutLocal();
  const token = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
  const expiresAt = Date.now()+TTL;
  const tokenHash = await tokenDigest(token);
  await authDb.sessions.add({tokenHash,userId:account.id,expiresAt});
  try { sessionStorage.setItem(KEY, token); } catch { await authDb.sessions.delete(tokenHash); throw new Error('Penyimpanan browser tidak tersedia. Izinkan penyimpanan situs lalu coba lagi.'); }
  notify();
  return {user:publicUser(account),expiresAt};
}
export async function registerLocal(email: string, password: string, name: string): Promise<LocalSession> {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length>254) throw new Error('Isi alamat email yang valid.');
  if (password.length<10 || password.length>128) throw new Error('Gunakan kata sandi khusus demo sepanjang 10–128 karakter.');
  if (!name.trim() || name.trim().length>80) throw new Error('Isi nama sepanjang 1–80 karakter.');
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const account: Account = {id:crypto.randomUUID(),email:normalized,name:name.trim(),salt,hash:await derive(password,salt,ITERATIONS),iterations:ITERATIONS};
  try { await authDb.accounts.add(account); }
  catch (error) { if (error instanceof Error && error.name==='ConstraintError') throw new Error('Email sudah terdaftar di browser ini. Silakan masuk.'); throw error; }
  return startSession(account);
}
export async function loginLocal(email: string, password: string): Promise<LocalSession> {
  const account = await authDb.accounts.where('email').equals(email.trim().toLowerCase()).first();
  const hash = await derive(password,account?.salt ?? '00000000000000000000000000000000',account?.iterations ?? ITERATIONS);
  if (!account || hash!==account.hash) throw new Error('Email atau kata sandi salah. Pastikan akun sudah didaftarkan di browser ini.');
  return startSession(account);
}
export async function readLocalSession(): Promise<LocalSession | null> {
  const token = sessionStorage.getItem(KEY);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const tokenHash = await tokenDigest(token);
  const stored = await authDb.sessions.get(tokenHash);
  if (!stored || stored.expiresAt<=Date.now()) { sessionStorage.removeItem(KEY); if(stored) await authDb.sessions.delete(tokenHash); return null; }
  const account = await authDb.accounts.get(stored.userId);
  return account ? {user:publicUser(account),expiresAt:stored.expiresAt} : null;
}
export async function logoutLocal() {
  const token = sessionStorage.getItem(KEY);
  sessionStorage.removeItem(KEY);
  notify();
  if (token) await authDb.sessions.delete(await tokenDigest(token));
}
export function useLocalSession() {
  const [state,setState] = useState<{session:LocalSession|null;loading:boolean}>({session:null,loading:true});
  useEffect(()=> {
    let active=true, revision=0;
    const update=()=> {
      const request=++revision;
      void readLocalSession().then(session=>{if(active&&request===revision)setState({session,loading:false});}).catch(()=>{if(active&&request===revision)setState({session:null,loading:false});});
    };
    update();
    window.addEventListener(EVENT,update);
    window.addEventListener('focus',update);
    const interval=window.setInterval(update,30000);
    return ()=>{active=false;window.removeEventListener(EVENT,update);window.removeEventListener('focus',update);window.clearInterval(interval);};
  },[]);
  return state;
}
