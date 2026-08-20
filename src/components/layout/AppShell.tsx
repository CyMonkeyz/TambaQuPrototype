import { MapPin } from "lucide-react";
import { Outlet } from "react-router-dom";
import { useAppStore } from "../../store/app-store";
import { AppLogo } from "../common/AppLogo";
import { Avatar } from "../ui/Avatar";
import { MobileNavigation } from "./MobileNavigation";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const user = useAppStore((state) => state.activeUser);
  const farm = useAppStore((state) => state.activeFarm);
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
          <Avatar name={user?.name ?? "Pengguna TambaQu"} />
        </header>
        <main className="mx-auto max-w-[1360px] p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}
