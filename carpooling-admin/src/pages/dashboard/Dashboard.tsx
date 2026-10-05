import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Car,
  Users,
  MapPin,
  BookOpen,
  ShieldAlert,
  BadgeCheck,
  Activity,
} from "lucide-react";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { getApiErrorMessage } from "@/lib/errors";
import {
  fetchAdminStats,
  type AdminStatsResponse,
} from "@/services/adminStatsService";

export default function Dashboard() {
  const { user } = useAppSelector((s) => s.auth);
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const response = await fetchAdminStats();
        if (isMounted) {
          setStats(response);
        }
      } catch (error: unknown) {
        toast.error(getApiErrorMessage(error, "Failed to load dashboard stats."));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const cards = useMemo(
    () => [
      {
        label: "Total Users",
        value: stats?.totalUsers ?? "0",
        icon: Users,
        accent: "bg-primary/10 text-primary",
        desc: "Registered platform users",
      },
      {
        label: "Drivers",
        value: stats?.totalDrivers ?? "0",
        icon: Car,
        accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        desc: "Approved & active drivers",
      },
      {
        label: "Passengers",
        value: stats?.totalPassengers ?? stats?.totalPassanger ?? "0",
        icon: Users,
        accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        desc: "Active commuters",
      },
      {
        label: "Total Rides",
        value: stats?.totalRides ?? "0",
        icon: MapPin,
        accent: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
        desc: "Created transit routes",
      },
      {
        label: "Total Bookings",
        value: stats?.totalBookings ?? "0",
        icon: BookOpen,
        accent: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
        desc: "Seats reserved",
      },
      {
        label: "Pending Docs",
        value: stats?.pendingDocuments ?? "0",
        icon: ShieldAlert,
        accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        desc: "Awaiting verification",
      },
      {
        label: "Completed Rides",
        value: stats?.completedRides ?? "0",
        icon: BadgeCheck,
        accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        desc: "Successfully fulfilled",
      },
      {
        label: "Scheduled Rides",
        value: stats?.scheduledRides ?? stats?.sheduledRides ?? "0",
        icon: Activity,
        accent: "bg-primary/10 text-primary",
        desc: "Upcoming departure slots",
      },
    ],
    [stats]
  );

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 bg-card p-6 md:p-8 shadow-xs dark:shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono font-medium text-foreground/80 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>ADMIN CENTRAL TELEMETRY</span>
            </div>
            <h1 className="mt-2 font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {greeting}, {user?.name?.split(" ")[0] || "Admin"}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Centralized monitoring platform for drivers, passenger bookings, vehicle documents, and active rides.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live System: Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-black/10 dark:border-white/10 bg-card p-5 shadow-xs hover:border-foreground/20 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${stat.accent}`}
              >
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
                {loading ? "—" : stat.value}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">{stat.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
