import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { logout } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import PullCordThemeToggle from "@/components/common/PullCordThemeToggle";
import { connectChatSocket, disconnectChatSocket } from "@/lib/chatSocket";
import {
  LayoutDashboard, Search, BookOpen, MessageCircle,
  User, LogOut, Menu, Car, Settings2, Sun, Moon,
} from "lucide-react";
import { useTheme } from "@/lib/theme";

const navItems = [
  { to: "/passenger/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/passenger/search",    icon: Search,          label: "Search Trips" },
  { to: "/passenger/bookings",  icon: BookOpen,        label: "My Bookings" },
  { to: "/passenger/chat",      icon: MessageCircle,   label: "Messages" },
  { to: "/passenger/preferences", icon: Settings2,    label: "Preferences" },
  { to: "/passenger/profile",   icon: User,            label: "Profile" },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/auth/login");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_15px_rgba(255,255,255,0.15)]">
          <Car className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-foreground leading-none">RideShare</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Passenger Panel</p>
        </div>
      </div>

      <Separator className="opacity-40" />

      {/* Tactile Frosted User Profile Card */}
      <div className="px-3 py-3">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] p-3 backdrop-blur-md shadow-xs dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 dark:border-white/15 bg-primary text-primary-foreground text-sm font-bold shadow-xs">
              {user?.name?.charAt(0)?.toUpperCase() || "P"}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground leading-tight">{user?.name || "Passenger"}</p>
              <p className="truncate text-[11px] text-muted-foreground mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <Separator className="opacity-40" />

      {/* Nav */}
      <nav className="scrollbar-none flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-[0_2px_12px_rgba(0,0,0,0.2)]"
                  : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/[0.06] hover:text-foreground"
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <Separator className="opacity-40" />

      {/* Logout */}
      <div className="p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export default function PassengerLayout() {
  const token = useAppSelector((state) => state.auth.token);
  const { user } = useAppSelector((s) => s.auth);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    if (!token) {
      disconnectChatSocket();
      return;
    }

    connectChatSocket(token);

    return () => {
      disconnectChatSocket();
    };
  }, [token]);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-black/10 dark:border-white/10 bg-card/90 dark:bg-[#0d0d11]/85 backdrop-blur-2xl shadow-sm">
        <SidebarNav />
      </aside>

      {/* Main */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Desktop Pull Cord Theme Toggle */}
        <div className="hidden lg:block">
          <PullCordThemeToggle threadOnly />
        </div>

        {/* Mobile Top Bar */}
        <header className="flex items-center justify-between border-b border-border bg-background/95 px-3.5 py-2.5 backdrop-blur lg:hidden z-20">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <SidebarNav />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                <Car className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">RideShare</p>
                <p className="text-[10px] text-muted-foreground leading-none">Passenger</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle theme"
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </Button>

            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.04] dark:bg-white/[0.08] text-xs font-bold text-foreground shadow-xs">
              {user?.name?.charAt(0)?.toUpperCase() || "P"}
            </div>
          </div>
        </header>

        <main className="scrollbar-none flex-1 overflow-y-auto bg-background">
          <div className="min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
