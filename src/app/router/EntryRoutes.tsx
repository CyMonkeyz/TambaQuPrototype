import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useLocalSession } from '../../services/localAuth';
import { useAppStore } from '../../store/app-store';
import { getDemoSession } from '../../services/demoSession';
import { LoadingSkeleton } from '../../components/ui/Feedback';
export function RegisteredGuard() {
  const {session,loading}=useLocalSession();
  const activeId=useAppStore(s=>s.activeUser?.id);
  const farm=useAppStore(s=>s.activeFarm);
  if(loading)return <LoadingSkeleton rows={3} label='Memeriksa sesi akun'/>;
  if(!session)return <Navigate to='/login' replace/>;
  if(activeId!==session.user.id||!farm)return <Navigate to='/demo' replace/>;
  return <Outlet/>;
}
export function EntryRoute() {
  const {session,loading}=useLocalSession();
  if(loading)return <LoadingSkeleton rows={3} label='Memeriksa sesi akun'/>;
  return <Navigate to={session?'/demo':'/login'} replace/>;
}
export function DemoEntry() {
  const {session,loading}=useLocalSession();
  const activeId=useAppStore(s=>s.activeUser?.id);
  const farmId=useAppStore(s=>s.activeFarm?.id);
  const ready=Boolean(session && activeId===session.user.id && farmId);
  useEffect(()=>{
    if(!loading&&session&&!ready){
      const {user,farm}=getDemoSession();
      useAppStore.getState().enterDemo({...user,...session.user,farmIds:[farm.id]},farm);
    }
  },[loading,session,ready]);
  if(loading)return <LoadingSkeleton rows={3} label='Memeriksa sesi akun'/>;
  if(!session)return <Navigate to='/login' replace/>;
  return ready?<Navigate to='/app/dashboard' replace/>:<LoadingSkeleton rows={3} label='Menyiapkan simulasi tambak'/>;
}
