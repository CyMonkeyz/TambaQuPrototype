import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { desktopNavigation } from "../../constants/navigation";
import { useAppStore } from "../../store/app-store";
import { cn } from "../../utils/cn";
import { AppLogo } from "../common/AppLogo";
import { IconButton } from "../ui/IconButton";
import { Tooltip } from "../ui/Overlay";

export function Sidebar() {
  const collapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const leaveSession = useAppStore((state) => state.leaveSession);
  const navigate = useNavigate();
  const logout = () => {
    leaveSession();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-[#fbfdfd] py-6 transition-[width] lg:flex",
        collapsed ? "w-[82px] px-3" : "w-[232px] px-4",
      )}
    >
      <div className="flex items-center justify-between px-2">
        <AppLogo compact={collapsed} />
        {!collapsed && (
          <Tooltip label="Ciutkan sidebar">
            <IconButton
              label="Ciutkan sidebar"
              className="size-9"
              onClick={toggleSidebar}
            >
              <ChevronsLeft size={18} />
            </IconButton>
          </Tooltip>
        )}
      </div>
      {collapsed && (
        <Tooltip label="Perluas sidebar">
          <IconButton
            label="Perluas sidebar"
            className="mx-auto mt-3 size-9"
            onClick={toggleSidebar}
          >
            <ChevronsRight size={18} />
          </IconButton>
        </Tooltip>
      )}
      <nav className="mt-8 space-y-1" aria-label="Navigasi utama">
        {desktopNavigation.map((item) => (
          <Tooltip key={item.href} label={collapsed ? item.label : ""}>
            <NavLink
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex min-h-11 items-center rounded-xl text-sm font-medium transition-colors",
                  collapsed ? "justify-center px-2" : "gap-3 px-3",
                  isActive
                    ? "bg-[#dff3f0] font-semibold text-primary"
                    : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
                )
              }
            >
              <item.icon size={19} aria-hidden="true" />
              {!collapsed && item.label}
            </NavLink>
          </Tooltip>
        ))}
      </nav>
      <div className="mt-auto">
        <div
          className={cn(
            "mb-2 rounded-xl bg-surface-muted text-xs leading-5 text-foreground-muted",
            collapsed ? "p-2 text-center" : "p-3",
          )}
        >
          <strong className="block text-foreground">Demo</strong>
          {!collapsed && "Data simulasi, bukan hasil lapangan."}
        </div>
        <button
          onClick={logout}
          className={cn(
            "flex min-h-11 w-full items-center rounded-xl text-sm font-medium text-foreground-muted hover:bg-surface-muted hover:text-foreground",
            collapsed ? "justify-center" : "gap-3 px-3",
          )}
          aria-label="Keluar dari sesi demo"
        >
          <LogOut size={18} />
          {!collapsed && "Keluar"}
        </button>
      </div>
    </aside>
  );
}
