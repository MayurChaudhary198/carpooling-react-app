import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/hooks/useAppDispatch";
import api from "@/services/api";
import { API_ENDPOINTS, ROUTES, TRIP_STATUS } from "@/constants";
import type { Trip, TripLocationValue } from "@/types";
import { useDriverTracking } from "@/context/DriverTrackingContext";
import {
  unwrapApiListData,
  Button,
  Separator,
  StatusBadge,
  SEO,
} from "@carpooling/common";
import { formatLocationName } from "@/lib/utils";
import {
  Car,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Route,
  ShieldCheck,
  Wallet,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
  Users,
  Navigation,
  Calendar,
  CalendarCheck2,
} from "lucide-react";

const getMyTrips = async (): Promise<Trip[]> => {
  const res = await api.get(API_ENDPOINTS.trip.list);
  return unwrapApiListData<Trip>(res.data);
};

const loc = (value?: TripLocationValue) => (value ? formatLocationName(value) : "—");

function formatTripDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

const dispatchPresets = [
  { label: "Daily Office Commute", sub: "Regular morning corridor", icon: Car },
  { label: "Intercity Highway Split", sub: "Weekend intercity transit", icon: Route },
  { label: "Airport Highway Express", sub: "Terminal dropoff & return", icon: Navigation },
  { label: "Metro Station Feeder", sub: "Frequent commuter hub", icon: MapPin },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const { checkStartableTrips } = useDriverTracking();

  useEffect(() => {
    checkStartableTrips();
  }, [checkStartableTrips]);

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["driver-trips"],
    queryFn: getMyTrips,
  });

  const scheduledTrips = trips.filter((trip) => trip.status === TRIP_STATUS.scheduled);
  const ongoingTrips = trips.filter((trip) => trip.status === TRIP_STATUS.ongoing);
  const completedTrips = trips.filter((trip) => trip.status === TRIP_STATUS.completed);

  const totalBookingsCount = trips.reduce(
    (sum, trip) => sum + (Array.isArray(trip.bookings) ? trip.bookings.length : 0),
    0
  );

  const stats = {
    total: trips.length,
    active: ongoingTrips.length + scheduledTrips.length,
    ongoing: ongoingTrips.length,
    scheduled: scheduledTrips.length,
    completed: completedTrips.length,
    bookingsCount: totalBookingsCount,
  };

  const recent = [...trips]
    .sort(
      (a, b) =>
        new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime()
    )
    .slice(0, 4);

  const nextTrip = [...trips]
    .filter((trip) =>
      [TRIP_STATUS.ongoing, TRIP_STATUS.scheduled].includes(trip.status as any)
    )
    .sort(
      (a, b) =>
        new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
    )[0];

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-6xl px-3.5 py-4 sm:px-6 sm:py-8 md:px-8">
      <SEO
        title="Driver Dashboard"
        description="Daily commute dispatch, published trips, and live passenger boarding controls."
      />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.18fr_0.82fr]">
        {/* Main Driver Operations Hero Card */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 bg-card dark:bg-[#111216] p-4.5 sm:p-6 md:p-8 shadow-xs dark:shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
          {/* Subtle top edge specular definition */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/20 to-transparent" />

          {/* Top telemetry status strip */}
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono font-medium text-foreground/80">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>DRIVER DISPATCH ACTIVE</span>
            </div>

            <div className="text-[11px] font-mono text-muted-foreground hidden sm:block">
              {nextTrip?.status === TRIP_STATUS.ongoing
                ? "STATUS: COMMUTE EN ROUTE"
                : nextTrip
                ? "STATUS: DEPARTURE SCHEDULED"
                : "STATUS: READY TO PUBLISH"}
            </div>
          </div>

          {/* Salutation & Headline */}
          <div className="mt-4 sm:mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {greeting}, {user?.name?.split(" ")[0] || "Driver"}
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-4xl md:text-[2.6rem] font-black tracking-tight text-foreground leading-tight">
              Where are you driving today?
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
              Publish empty seats on your daily route, accept passenger reservations, and split travel fuel expenses with verified community members.
            </p>
          </div>

          {/* Interactive Route Dispatch Trigger Box */}
          <div className="mt-5 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-2.5 sm:p-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div
                onClick={() => navigate(ROUTES.driver.trips)}
                className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-black/5 dark:border-white/10 bg-card dark:bg-[#16171d] cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-all text-xs sm:text-sm group"
              >
                <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-[11px] font-semibold text-foreground/80">From:</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[85px] sm:max-w-none">Departure origin</span>
                </div>

                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />

                <div className="flex items-center gap-1.5 text-muted-foreground min-w-0 flex-1">
                  <span className="h-2 w-2 rounded-full bg-foreground/60 shrink-0" />
                  <span className="text-[11px] font-semibold text-foreground/80">To:</span>
                  <span className="text-xs text-muted-foreground truncate">Dropoff destination...</span>
                </div>
              </div>

              <Button
                onClick={() => navigate(ROUTES.driver.trips)}
                className="h-10 sm:h-11 px-5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm shadow-xs hover:opacity-90 active:scale-[0.98] transition-all shrink-0 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4 mr-1.5" />
                Publish Route
              </Button>
            </div>

            {/* Quick Frequent Transit Nodes */}
            <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground mr-1">
                Frequent Corridors:
              </span>
              {[
                "Tech Park ↔ Downtown",
                "Metro Interchange ↔ Campus",
                "Airport Highway",
                "Intercity Express",
              ].map((spot) => (
                <button
                  key={spot}
                  type="button"
                  onClick={() => navigate(ROUTES.driver.trips)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-black/5 dark:border-white/10 bg-card dark:bg-[#16171d] text-foreground/80 hover:text-foreground hover:border-black/20 dark:hover:border-white/25 transition-all cursor-pointer"
                >
                  {spot}
                </button>
              ))}
            </div>
          </div>

          {/* Commute Integrity / Driver Trust Pillars */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 border-t border-black/5 dark:border-white/5 pt-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] text-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-xs leading-tight truncate">OTP Boarding</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">Passenger verification handshake</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] text-foreground">
                <Wallet className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-xs leading-tight truncate">Fair Expense Share</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">Split fuel & toll per seat</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] text-foreground">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-xs leading-tight truncate">Live GPS Telemetry</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">Real-time rider coordination</p>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Telemetry Metric Cards (Right Column) - Architectural Monochrome */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3.5">
          {[
            {
              label: "Published Trips",
              value: stats.total,
              subtext: "Lifetime scheduled journeys",
              tag: "All Time",
              icon: Car,
            },
            {
              label: "Active Dispatches",
              value: stats.active,
              subtext:
                stats.ongoing > 0
                  ? "Trip currently in transit"
                  : stats.scheduled > 0
                  ? `${stats.scheduled} upcoming departures`
                  : "No trips currently active",
              tag: stats.ongoing > 0 ? "In Transit" : stats.scheduled > 0 ? "Scheduled" : "Standby",
              icon: Clock,
            },
            {
              label: "Completed Trips",
              value: stats.completed,
              subtext: "Safely fulfilled arrivals",
              tag: "100% Rate",
              icon: CheckCircle2,
            },
            {
              label: "Rider Reservations",
              value: stats.bookingsCount,
              subtext: "Total passenger seats booked",
              tag: "Riders Split",
              icon: Users,
            },
          ].map(({ label, value, subtext, tag, icon: Icon }) => (
            <div
              key={label}
              className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-black/10 dark:border-white/10 bg-card dark:bg-[#111216] p-3.5 sm:p-4.5 shadow-xs transition-all duration-200 hover:border-black/20 dark:hover:border-white/20 group"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/15 to-transparent" />

              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] text-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-mono font-medium uppercase tracking-wider text-muted-foreground truncate">
                      {label}
                    </p>
                    <p className="mt-0.5 font-mono text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground truncate">
                      {isLoading ? "—" : value}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-md border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-2 py-0.5 text-[9px] sm:text-[10px] font-mono text-muted-foreground">
                  {tag}
                </span>
              </div>

              <div className="mt-2.5 sm:mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground">
                <span className="truncate">{subtext}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Middle Split: "Your Next Move" & "Recent Trips" */}
      <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        {/* Your Next Move Card */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 bg-gradient-to-br from-card via-card/95 to-card/90 dark:from-white/[0.08] dark:via-white/[0.03] dark:to-transparent p-4 sm:p-6 backdrop-blur-xl shadow-md dark:shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.14)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/20 to-transparent" />
          <div className="pb-3 sm:pb-4">
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Your next move
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Direct dispatch and live telemetry controls for your immediate trip.
            </p>
          </div>

          <div className="space-y-3">
            {nextTrip ? (
              <>
                <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] p-3.5 sm:p-4.5 backdrop-blur-md shadow-xs dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      {nextTrip.status === TRIP_STATUS.ongoing ? "Active Trip In Transit" : "Next Scheduled Departure"}
                    </span>
                    <StatusBadge status={nextTrip.status} />
                  </div>

                  {/* Connected Route Visual */}
                  <div className="flex items-stretch gap-3 py-0.5">
                    {/* Centered Route Spine */}
                    <div className="flex flex-col items-center py-1 shrink-0 w-3.5">
                      <div className="relative flex h-3.5 w-3.5 items-center justify-center shrink-0">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                      </div>
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-emerald-500 to-amber-500 my-1 rounded-full" />
                      <div className="relative flex h-3.5 w-3.5 items-center justify-center shrink-0">
                        <span className="h-2 w-2 rounded-full bg-amber-500 ring-4 ring-amber-500/20" />
                      </div>
                    </div>

                    {/* Stops text */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Departure point</p>
                        <p className="text-xs sm:text-sm font-semibold text-foreground truncate" title={loc(nextTrip.origin)}>
                          {loc(nextTrip.origin)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dropoff destination</p>
                        <p className="text-xs sm:text-sm font-semibold text-foreground truncate" title={loc(nextTrip.destination ?? nextTrip.destinationLocation)}>
                          {loc(nextTrip.destination ?? nextTrip.destinationLocation)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-2.5 sm:mt-4 sm:pt-3 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-foreground" />
                      {formatTripDate(nextTrip.departureTime)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{nextTrip.availableSeats} seats left</span>
                      <span>•</span>
                      <span className="font-semibold text-foreground">
                        ₹{nextTrip.pricePerKm ?? nextTrip.price}/km
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-2.5 pt-1">
                  <Button
                    className="flex-1 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-sm text-xs sm:text-sm h-9 sm:h-10 cursor-pointer"
                    onClick={() => navigate(ROUTES.driver.tripDetails(nextTrip.id))}
                  >
                    <Navigation className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {nextTrip.status === TRIP_STATUS.ongoing ? "Boarding & OTP Controls" : "Dispatch Controls"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-black/15 dark:border-white/20 bg-card/60 dark:bg-white/[0.05] text-xs sm:text-sm h-9 sm:h-10 cursor-pointer"
                    onClick={() => navigate(ROUTES.driver.bookings)}
                  >
                    <CalendarCheck2 className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Review Reservations
                  </Button>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.03] p-6 sm:p-8 text-center text-xs sm:text-sm text-muted-foreground">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.03] dark:bg-white/[0.08]">
                  <Route className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground">No active trips scheduled</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Publish a new route and we’ll place your live departure and boarding OTP controls here.
                </p>
                <Button
                  className="mt-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-sm text-xs cursor-pointer"
                  onClick={() => navigate(ROUTES.driver.trips)}
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                  Publish First Route
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Trips Card */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 bg-gradient-to-br from-card via-card/95 to-card/90 dark:from-white/[0.08] dark:via-white/[0.03] dark:to-transparent p-4 sm:p-6 backdrop-blur-xl shadow-md dark:shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.14)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/20 to-transparent" />
          <div className="flex flex-row items-center justify-between pb-3 sm:pb-4">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Recent trips
              </h2>
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">
                Your latest published routes, departures, and seat statuses.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(ROUTES.driver.trips)}
              className="gap-1 rounded-xl text-xs sm:text-sm font-semibold text-foreground hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Separator className="opacity-50" />
          <div className="pt-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-foreground" />
              </div>
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 sm:py-14 text-center">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 dark:border-white/15 bg-black/[0.03] dark:bg-white/[0.08]">
                  <Car className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground text-sm">No trips published yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create your first trip to start accepting passengers.
                </p>
                <Button
                  className="mt-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-sm text-xs cursor-pointer"
                  onClick={() => navigate(ROUTES.driver.trips)}
                >
                  Publish a trip
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-black/5 dark:divide-white/5">
                {recent.map((trip) => (
                  <div
                    key={trip.id}
                    onClick={() => navigate(ROUTES.driver.tripDetails(trip.id))}
                    className="grid gap-2 sm:gap-3 py-3 md:grid-cols-[1fr_auto] md:items-center hover:bg-black/[0.02] dark:hover:bg-white/[0.03] px-2.5 sm:px-3 rounded-xl sm:rounded-2xl transition-all duration-200 border border-transparent hover:border-black/5 dark:hover:border-white/5 cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-1.5 sm:gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-foreground" />
                        <p className="truncate text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {loc(trip.origin)} → {loc(trip.destination ?? trip.destinationLocation)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2.5 text-[11px] sm:text-xs text-muted-foreground">
                        <span>{formatTripDate(trip.departureTime)}</span>
                        <span>•</span>
                        <span>{trip.availableSeats} seats remaining</span>
                        <span>•</span>
                        <span className="font-semibold text-foreground">
                          ₹{trip.pricePerKm ?? trip.price}/km
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-2">
                      <StatusBadge status={trip.status} />
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Dispatch Presets */}
      <div className="mt-6 relative overflow-hidden rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 bg-gradient-to-br from-card via-card/95 to-card/90 dark:from-white/[0.08] dark:via-white/[0.03] dark:to-transparent p-4 sm:p-6 backdrop-blur-xl shadow-md dark:shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.14)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/20 to-transparent" />
        <div className="pb-3">
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Quick dispatch presets
          </h2>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">
            Common driver routes to help you publish and accept passengers faster.
          </p>
        </div>
        <Separator className="opacity-50" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-3 sm:pt-4">
          {dispatchPresets.map(({ label, sub, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate(ROUTES.driver.trips)}
              className="rounded-xl sm:rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-3 sm:p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-black/25 dark:hover:border-white/30 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] hover:shadow-sm dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] group cursor-pointer"
            >
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.03] dark:bg-white/[0.08] text-foreground group-hover:scale-105 transition-transform">
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{label}</p>
              </div>
              <p className="mt-2 text-[11px] sm:text-xs leading-relaxed text-muted-foreground flex items-center justify-between">
                <span className="truncate">{sub}</span>
                <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all hidden sm:inline-block" />
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
