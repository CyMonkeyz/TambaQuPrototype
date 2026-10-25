import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, ShieldCheck, Waves, Database } from 'lucide-react';
import { AppLogo } from '../../components/common/AppLogo';
import { Button } from '../../components/ui/Button';
import { loginLocal, registerLocal, useLocalSession } from '../../services/localAuth';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
export function LoginPage() {
  useDocumentTitle('Masuk');
  const {session,loading}=useLocalSession();
  const navigate=useNavigate();
  const [mode,setMode]=useState<'login'|'signup'>('login');
  const [name,setName]=useState(''), [email,setEmail]=useState(''), [password,setPassword]=useState(''), [confirmation,setConfirmation]=useState('');
  const [visible,setVisible]=useState(false), [busy,setBusy]=useState(false), [error,setError]=useState(''), [help,setHelp]=useState(false);
  async function submit(event:FormEvent) {
    event.preventDefault(); if(busy)return; setError('');
    if(mode==='signup' && password!==confirmation){setError('Konfirmasi kata sandi belum sama.');return;}
    setBusy(true);
    try {
      if(mode==='signup') await registerLocal(email,password,name);
      else await loginLocal(email,password);
      setPassword('');setConfirmation('');navigate('/demo',{replace:true});
    }catch(e){setError(e instanceof Error ? e.message : 'Penyimpanan akun belum tersedia. Coba lagi.');}
    finally{setBusy(false);}
  }
  if(session&&!loading)return <Navigate to='/demo' replace/>;
  return <main className='login-page min-h-screen bg-background lg:grid lg:grid-cols-[1.05fr_1fr]'>
    <section className='relative hidden flex-col justify-between overflow-hidden bg-[#083F55] p-12 text-white lg:flex'>
      <div className='z-10 w-fit rounded-2xl bg-white p-4'><AppLogo/></div>
      <div className='relative z-10 my-12 max-w-xl'>
        <span className='inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-teal-200'><Waves size={16}/> Budidaya lebih terukur</span>
        <h1 className='mt-6 text-5xl font-semibold leading-tight tracking-tight'>Dari kondisi air,<br/>ke keputusan yang lebih baik.</h1>
        <p className='mt-6 max-w-md text-lg leading-8 text-white/75'>Satu ruang untuk memantau kolam, mencatat budidaya, dan merencanakan layanan TambaQu.</p>
        <div className='mt-9 grid grid-cols-3 gap-3'>{[['PondBrain','Analitik budidaya'],['PondHub','Sensor terhubung'],['Pondivator','Pendampingan']].map(([title,description])=><div key={title} className='rounded-2xl border border-white/15 bg-white/5 p-4'><p className='text-sm font-semibold'>{title}</p><p className='mt-2 text-xs leading-5 text-white/60'>{description}</p></div>)}</div>
      </div>
      <p className='relative z-10 flex items-center gap-2 text-xs leading-5 text-white/65'><Database size={16}/> Expo interaktif · data simulasi · tersimpan di perangkat ini</p>
      <div className='pointer-events-none absolute -right-44 top-24 size-[550px] rounded-full border-[80px] border-teal-300/10'/>
    </section>
    <section className='flex items-center justify-center px-5 py-10 sm:px-10'><div className='w-full max-w-md'>
      <div className='mb-8 lg:hidden'><AppLogo/></div>
      <p className='text-xs font-semibold uppercase tracking-[.16em] text-primary'>Ruang kerja TambaQu</p>
      <h1 className='mt-3 text-3xl font-semibold tracking-tight'>{mode==='signup'?'Buat akun TambaQu':'Masuk ke TambaQu'}</h1>
      <p className='mb-6 mt-3 text-sm leading-6 text-foreground-muted'>{mode==='signup'?'Daftar sekali untuk menjelajahi seluruh pengalaman expo.':'Gunakan email dan kata sandi akun yang kamu daftarkan di browser ini.'}</p>
      <div className='mb-6 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-xs leading-5 text-teal-900'><p className='mb-1 flex items-center gap-2 font-semibold'><ShieldCheck size={16}/> Akun lokal khusus demo</p>Tidak terhubung ke email atau server. Akun tidak tersinkron antarperangkat. Gunakan kata sandi khusus demo, bukan kata sandi pribadi.</div>
      <form onSubmit={submit} className='space-y-4' aria-label={mode==='signup'?'Pendaftaran akun demo':'Masuk akun demo'}>
        {mode==='signup'&&<label className='pilot-label'>Nama lengkap<input className='pilot-input mt-2' autoComplete='name' required maxLength={80} value={name} onChange={e=>setName(e.target.value)} disabled={busy}/></label>}
        <label className='pilot-label'>Email<input className='pilot-input mt-2' type='email' autoComplete='email' required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder='nama@email.com' disabled={busy}/></label>
        <label className='pilot-label'>Kata sandi<div className='relative mt-2'><input className='pilot-input pr-14' type={visible?'text':'password'} required minLength={mode==='signup'?10:1} maxLength={128} autoComplete={mode==='signup'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/><button type='button' className='absolute right-1 top-1 grid size-10 place-items-center' aria-label={visible?'Sembunyikan kata sandi':'Tampilkan kata sandi'} aria-pressed={visible} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
        {mode==='signup'&&<label className='pilot-label'>Konfirmasi kata sandi<input className='pilot-input mt-2' type='password' autoComplete='new-password' required minLength={10} maxLength={128} value={confirmation} onChange={e=>setConfirmation(e.target.value)} disabled={busy}/><span className='mt-1 block text-xs font-normal text-foreground-muted'>Minimal 10 karakter. Email tidak diverifikasi pada demo ini.</span></label>}
        {error&&<p role='alert' className='rounded-xl bg-red-50 p-3 text-sm text-red-700'>{error}</p>}
        <Button className='w-full' isLoading={busy} disabled={busy||loading} type='submit'>{mode==='signup'?'Daftar & masuk':'Masuk'}<ArrowRight size={17}/></Button>
      </form>
      <div className='mt-4 flex flex-wrap items-center justify-between gap-2'><button type='button' className='min-h-11 text-sm font-semibold text-primary' disabled={busy} onClick={()=>{setMode(mode==='login'?'signup':'login');setError('');setPassword('');setConfirmation('');}}>{mode==='signup'?'Sudah punya akun? Masuk':'Belum punya akun? Daftar'}</button><button type='button' className='min-h-11 text-xs text-foreground-muted underline' onClick={()=>setHelp(!help)} aria-expanded={help}>Bantuan masuk</button></div>
      {help&&<p role='status' className='mt-3 rounded-xl bg-surface-muted p-4 text-xs leading-6 text-foreground-muted'>Akun hanya ada di browser tempat mendaftar. Tidak ada pengiriman tautan reset melalui email. Jika lupa kata sandi, buat akun demo baru dengan email lain. Menghapus data situs juga menghapus akun dan data demo.</p>}
      <p className='mt-7 border-t border-border pt-5 text-center text-xs leading-5 text-foreground-muted'>Seluruh sensor, rekomendasi, langganan, dan pembayaran di ruang expo merupakan simulasi. Tidak ada penagihan uang sungguhan.</p>
    </div></section>
  </main>;
}
