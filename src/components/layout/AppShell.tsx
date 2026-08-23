import { MapPin, Presentation } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAppStore } from "../../store/app-store";
import { useSimulationStore } from "../../store/simulation-store";
import { AppLogo } from "../common/AppLogo";
import { Avatar } from "../ui/Avatar";
import { MobileNavigation } from "./MobileNavigation";
import { Sidebar } from "./Sidebar";
import { DemoStatusBar } from "../simulation/DemoStatusBar";
import { Button } from "../ui/Button";
import { ConnectivityIndicator, OfflineBanner } from "../offline/ConnectivityStatus";

export function AppShell() {
  const user = useAppStore((state) => state.activeUser);
  const farm = useAppStore((state) => state.activeFarm);
  const presentationMode = useSimulationStore((state) => state.presentationMode);
  const togglePresentationMode = useSimulationStore((state) => state.togglePresentationMode);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    mainRef.current?.focus();
  }, [location.pathname]);
  if (presentationMode) {
    return (
      <div className="min-h-screen">
        <header className="no-print flex h-14 items-center justify-between border-b border-border bg-white px-5 lg:px-8">
          <AppLogo />
          <nav className="flex items-center gap-3 text-xs font-semibold">
            <Link className="text-primary" to="/app/dashboard">Beranda</Link>
            <Link className="hidden text-primary sm:inline" to="/app/demo-control">Kontrol Demo</Link>
            <Button className="min-h-9 px-3" variant="secondary" leadingIcon={<Presentation size={15} />} onClick={togglePresentationMode}>Keluar</Button>
            <ConnectivityIndicator />
          </nav>
        </header>
        <DemoStatusBar />
        <OfflineBanner />
        <main ref={mainRef} tabIndex={-1} className="mx-auto max-w-[1800px] p-4 outline-none lg:p-7"><Outlet /></main>
      </div>
    );
  }
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1 pb-20 lg:pb-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-white/95 px-5 backdrop-blur lg:px-8">
          <div className="lg:hidden">
            <AppLogo />
          </div>
          <div className="hidden items-center gap-2 text-sm text-foreground-muted lg:flex">
            <MapPin size={15} aria-hidden="true" />
            <span>
              {farm?.name} · {farm?.location}
            </span>
          </div>
          <div className="flex items-center gap-1"><ConnectivityIndicator /><Avatar name={user?.name ?? "Pengguna TambaQu"} /></div>
        </header>
        <DemoStatusBar />
        <OfflineBanner />
        <main ref={mainRef} tabIndex={-1} className="mx-auto max-w-[1600px] p-5 outline-none lg:p-8">
          <Outlet />
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}
