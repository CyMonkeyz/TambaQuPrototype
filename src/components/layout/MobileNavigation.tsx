import { Menu } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  mobileMoreNavigation,
  mobilePrimaryNavigation,
} from "../../constants/navigation";
import { cn } from "../../utils/cn";
import { Dialog } from "../ui/Overlay";

export function MobileNavigation() {
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
          className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-foreground-muted"
          aria-label="Buka menu lainnya"
        >
          <Menu size={20} />
          Lainnya
        </button>
      </nav>
      <Dialog
        open={moreOpen}
        onOpenChange={setMoreOpen}
        title="Menu lainnya"
        description="Akses laporan, perangkat, dan pengaturan TambaQu."
      >
        <div className="grid gap-2">
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
        </div>
      </Dialog>
    </>
  );
}
