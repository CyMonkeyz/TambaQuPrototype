import { Menu, LogOut } from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "../../store/app-store";
import { logoutLocal } from "../../services/localAuth";
import {
  mobileMoreNavigation,
  mobilePrimaryNavigation,
} from "../../constants/navigation";
import { cn } from "../../utils/cn";
import { Dialog } from "../ui/Overlay";

export function MobileNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const moreActive = mobileMoreNavigation.some(
    (item) => location.pathname === item.href,
  );
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-white px-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Navigasi mobile"
      >
        {mobilePrimaryNavigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold",
                isActive ? "text-primary" : "text-foreground-muted",
              )
            }
          >
            <item.icon size={20} aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold",
            moreActive ? "text-primary" : "text-foreground-muted",
          )}
          aria-label="Buka menu lainnya"
          aria-expanded={moreOpen}
          aria-current={moreActive ? "page" : undefined}
        >
          <Menu size={20} />
          Lainnya
        </button>
      </nav>
      <Dialog
        open={moreOpen}
        onOpenChange={setMoreOpen}
        title="Menu lainnya"
        description="Budidaya, layanan, perangkat, dan pengaturan."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {mobileMoreNavigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold",
                  isActive
                    ? "bg-[#dff3f0] text-primary"
                    : "bg-surface-muted text-foreground",
                )
              }
            >
              <item.icon size={19} />
              {item.label}
            </NavLink>
          ))}
          <button
            className="flex min-h-12 items-center gap-3 rounded-xl border border-border px-3 text-sm font-semibold"
            onClick={async () => {
              await logoutLocal();
              setMoreOpen(false);
              useAppStore.getState().leaveSession();
              navigate("/login", { replace: true });
            }}
          >
            <LogOut size={19} />
            Keluar
          </button>
        </div>
      </Dialog>
    </>
  );
}
