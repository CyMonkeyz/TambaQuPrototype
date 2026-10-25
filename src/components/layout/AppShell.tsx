import { MapPin } from "lucide-react";
import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAppStore } from "../../store/app-store";
import { AppLogo } from "../common/AppLogo";
import { Avatar } from "../ui/Avatar";
import { MobileNavigation } from "./MobileNavigation";
import { Sidebar } from "./Sidebar";
import { DemoStatusBar } from "../simulation/DemoStatusBar";
import {
  ConnectivityIndicator,
  OfflineBanner,
} from "../offline/ConnectivityStatus";

export function AppShell() {
  const user = useAppStore((state) => state.activeUser);
  const farm = useAppStore((state) => state.activeFarm);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    mainRef.current?.focus({preventScroll:true});
  }, [location.pathname]);

  return (
    <div className="workspace-shell min-h-screen lg:flex">
      <a
        href="#workspace-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-primary"
      >
        Lewati ke isi
      </a>
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
          <div className="flex items-center gap-1">
            <ConnectivityIndicator />
            <Avatar name={user?.name ?? "Pengguna TambaQu"} />
          </div>
        </header>
        <DemoStatusBar />
        <OfflineBanner />
        <main
          id="workspace-content"
          ref={mainRef}
          tabIndex={-1}
          className="workspace-main mx-auto max-w-[1600px] p-4 outline-none sm:p-6 lg:p-8"
        >
          <Outlet />
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}
