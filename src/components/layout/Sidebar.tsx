import type { ComponentType } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  LogOut,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { navigationGroups } from "../../constants/navigation";
import { logoutLocal } from "../../services/localAuth";
import { useAppStore } from "../../store/app-store";
import { AppLogo } from "../common/AppLogo";
import { cn } from "../../utils/cn";
export interface NavigationItem {
  label: string;
  href: string;
  icon: ComponentType<{
    size?: number;
    className?: string;
    "aria-hidden"?: boolean;
  }>;
}
export function WorkspaceSidebar({
  groups,
  collapsed,
  onToggle,
  onLogout,
  demo = false,
}: {
  groups: { label: string; items: NavigationItem[] }[];
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
  demo?: boolean;
}) {
  return (
    <aside
      className={cn(
        "workspace-sidebar sticky top-0 hidden h-screen shrink-0 flex-col py-6 lg:flex",
        collapsed ? "w-[88px] px-3" : "w-[248px] px-4",
      )}
    >
      <Link
        to={groups[0]?.items[0]?.href ?? "/"}
        aria-label="Beranda TambaQu"
        className={cn(
          "mx-1 flex min-h-14 items-center rounded-2xl bg-white",
          collapsed ? "justify-center p-2" : "px-3",
        )}
      >
        <AppLogo compact={collapsed} />
      </Link>
      <button
        type="button"
        className="sidebar-toggle mt-5 flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs"
        onClick={onToggle}
        aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
        aria-expanded={!collapsed}
      >
        {collapsed ? (
          <ChevronsRight size={17} />
        ) : (
          <>
            <ChevronsLeft size={17} />
            Ciutkan menu
          </>
        )}
      </button>
      <nav className="mt-4 flex-1 overflow-y-auto" aria-label="Navigasi utama">
        {groups.map((group) => (
          <div key={group.label} className="mb-6">
            <p
              className={cn(
                "sidebar-group mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.16em]",
                collapsed && "sr-only",
              )}
            >
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                  className={({ isActive }) =>
                    cn(
                      "sidebar-link flex min-h-11 items-center rounded-xl text-[13px] font-medium",
                      collapsed ? "justify-center" : "gap-3 px-3",
                      isActive && "is-active",
                    )
                  }
                >
                  <item.icon size={18} aria-hidden />
                  {!collapsed && item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="space-y-2 border-t border-white/10 pt-4">
        {!collapsed && (
          <div className="rounded-xl bg-white/5 px-3 py-3">
            <p className="text-xs font-semibold text-white">
              {demo ? "Ruang simulasi" : "Ruang tim tambak"}
            </p>
            <p className="mt-1 text-[10px] leading-5 text-slate-300">
              {demo
                ? "Data sintetis · bukan sensor langsung"
                : "Akses sesuai penugasan tim"}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={onLogout}
          className={cn(
            "sidebar-link flex min-h-11 w-full items-center rounded-xl text-xs",
            collapsed ? "justify-center" : "gap-3 px-3",
          )}
          aria-label="Keluar"
        >
          <LogOut size={17} />
          {!collapsed && "Keluar"}
        </button>
      </div>
    </aside>
  );
}
export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggle = useAppStore((s) => s.toggleSidebar);
  const leave = useAppStore((s) => s.leaveSession);
  const navigate = useNavigate();
  return (
    <WorkspaceSidebar
      groups={navigationGroups}
      collapsed={collapsed}
      onToggle={toggle}
      onLogout={async () => {
        await logoutLocal();
        leave();
        navigate("/login", { replace: true });
      }}
      demo
    />
  );
}
