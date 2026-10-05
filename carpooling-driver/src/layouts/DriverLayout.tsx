import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { logout } from "@/store/slices/authSlice";
import { ROUTES } from "@/constants";
import {
  Button,
  Separator,
  Sheet,
  SheetContent,
  SheetTrigger,
  PullCordThemeToggle,
  useTheme,
} from "@carpooling/common";
import { connectChatSocket, disconnectChatSocket } from "@/lib/chatSocket";
import { DriverTrackingProvider } from "@/context/DriverTrackingContext";
import StartTripModal from "@/components/common/StartTripModal";
import ActiveTripTrackingBanner from "@/components/common/ActiveTripTrackingBanner";
import {
  LayoutDashboard,
  CalendarCheck2,
  Route,
  Car,
  FileText,
  MessageCircle,
  User,
  LogOut,
  Menu,
  Sun,
  Moon,
} from "lucide-react";

const navItems = [
  { to: ROUTES.driver.dashboard, icon: LayoutDashboard, label: "Dashboard" },
  { to: ROUTES.driver.bookings, icon: CalendarCheck2, label: "Bookings" },
  { to: ROUTES.driver.trips, icon: Route, label: "My Trips" },
  { to: ROUTES.driver.car, icon: Car, label: "My Vehicle" },
  { to: ROUTES.driver.documentsView, icon: FileText, label: "Documents" },
  { to: ROUTES.driver.chat, icon: MessageCircle, label: "Messages" },
  { to: ROUTES.driver.profile, icon: User, label: "Profile" },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate(ROUTES.auth.login);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_15px_rgba(255,255,255,0.15)]">
          <Car className="h-4.5 w-4.5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-foreground leading-none">
              RideShare
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              DRIVER
            </span>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Driver Operations</p>
        </div>
      </div>

      <Separator className="opacity-40" />

      {/* Tactile Frosted Driver Profile Card */}
      <div className="px-3 py-3">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] p-3 backdrop-blur-md shadow-xs dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 dark:border-white/15 bg-primary text-primary-foreground text-sm font-bold shadow-xs">
              {user?.name?.charAt(0)?.toUpperCase() || "D"}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground leading-tight">
                {user?.name || "Driver"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                {user?.email || "driver@rideshare.com"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Separator className="opacity-40" />

      {/* Navigation List */}
      <nav className="scrollbar-none flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === ROUTES.driver.chat}
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

      {/* Footer Controls: Logout */}
      <div className="p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
}

export default function DriverLayout() {
  const token = useAppSelector((state) => state.auth.token);
  const { user } = useAppSelector((state) => state.auth);
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
    <DriverTrackingProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-black/10 dark:border-white/10 bg-card/90 dark:bg-[#0d0d11]/85 backdrop-blur-2xl shadow-sm">
          <SidebarNav />
        </aside>

        {/* Main Content Area */}
        <div className="relative flex flex-1 flex-col overflow-hidden min-w-0">
          {/* Desktop Pull Cord Theme Toggle */}
          <div className="hidden lg:block">
            <PullCordThemeToggle threadOnly />
          </div>

          {/* Mobile Header */}
          <header className="flex items-center justify-between border-b border-border bg-background/95 px-3.5 py-2.5 backdrop-blur lg:hidden z-20">
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                  <SidebarNav />
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                  <Car className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold leading-tight">RideShare</span>
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                      DRIVER
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-none">Operations</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                {user?.name?.charAt(0)?.toUpperCase() || "D"}
              </div>
            </div>
          </header>

          {/* Page Content Viewport */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background p-3.5 sm:p-6 lg:p-8 min-w-0">
            <div className="mx-auto max-w-7xl min-h-full min-w-0 w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <StartTripModal />
      <ActiveTripTrackingBanner />
    </DriverTrackingProvider>
  );
}
