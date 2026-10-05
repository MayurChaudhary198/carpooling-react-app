import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  IndianRupee,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@carpooling/common";
import { getApiErrorMessage } from "@/lib/errors";
import { fetchAdminTrips } from "@/services/adminUsersService";

export interface AdminBookingRecord {
  id: string;
  tripId: string;
  tripcode?: string;
  passengerId: string;
  passengerName?: string;
  passengerEmail?: string;
  seats: number;
  price: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "COMPLETED";
  pickupLocation: string;
  dropoffLocation: string;
  paymentMode?: string;
  paymentStatus?: string;
  createdAt: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function Bookings() {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(false);
  const [allBookings, setAllBookings] = useState<AdminBookingRecord[]>([]);
  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState<string>("ALL");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      // Admin bookings are aggregated from system trips
      const res = await fetchAdminTrips({
        pagination: { page: 1, limit: 100 },
        sort: { field: "createdAt", order: "desc" },
      });

      const extracted: AdminBookingRecord[] = [];
      const trips = (res?.data ?? []) as any[];

      trips.forEach((trip) => {
        const bookingsList = Array.isArray(trip.bookings)
          ? trip.bookings
          : Array.isArray(trip.booking)
          ? trip.booking
          : [];

        bookingsList.forEach((b: any) => {
          extracted.push({
            id: b.id || `b-${Math.random().toString(36).slice(2, 8)}`,
            tripId: trip.id,
            tripcode: trip.tripcode,
            passengerId: b.passengerId || b.userId || "—",
            passengerName: b.passenger?.name || b.user?.name || b.passengerName || "Passenger",
            passengerEmail: b.passenger?.email || b.user?.email || b.passengerEmail || "—",
            seats: b.seatBooked ?? b.seats ?? b.seatCount ?? 1,
            price: Number(b.price) || (Number(trip.pricePerKm) || 0) * 10,
            status: (b.status || "PENDING").toUpperCase(),
            pickupLocation:
              typeof b.pickupLocation === "string"
                ? b.pickupLocation
                : b.pickupLocation?.name || trip.origin || "Pickup Stop",
            dropoffLocation:
              typeof b.dropoffLocation === "string"
                ? b.dropoffLocation
                : b.dropoffLocation?.name || trip.destinationLocation || "Dropoff Stop",
            paymentMode: b.paymentMode || "COD",
            paymentStatus: b.paymentStatus || (b.paymentMode === "ADVANCE" ? "PAID" : "PENDING"),
            createdAt: b.createdAt || trip.createdAt || new Date().toISOString(),
          });
        });
      });

      setAllBookings(extracted);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to load bookings."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const filteredBookings = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allBookings.filter((b) => {
      const matchesStatus =
        statusTab === "ALL" || b.status.toUpperCase() === statusTab;

      const matchesSearch =
        !q ||
        b.id.toLowerCase().includes(q) ||
        (b.tripcode && b.tripcode.toLowerCase().includes(q)) ||
        (b.passengerName && b.passengerName.toLowerCase().includes(q)) ||
        (b.passengerEmail && b.passengerEmail.toLowerCase().includes(q)) ||
        b.pickupLocation.toLowerCase().includes(q) ||
        b.dropoffLocation.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [allBookings, query, statusTab]);

  const paginated = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredBookings.slice(start, start + limit);
  }, [filteredBookings, page, limit]);

  const totalPages = Math.ceil(filteredBookings.length / limit) || 1;

  const stats = useMemo(() => {
    const total = allBookings.length;
    const pending = allBookings.filter((b) => b.status === "PENDING").length;
    const accepted = allBookings.filter((b) => b.status === "ACCEPTED").length;
    const completed = allBookings.filter((b) => b.status === "COMPLETED").length;
    const revenue = allBookings
      .filter((b) => ["ACCEPTED", "COMPLETED"].includes(b.status))
      .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

    return { total, pending, accepted, completed, revenue };
  }, [allBookings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono font-medium text-foreground/80 mb-2">
            <span>ADMIN RESERVATIONS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Bookings</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Monitor and manage passenger ride bookings across all published trips.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadBookings()}
          disabled={loading}
          className="rounded-xl border-border gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-foreground/20 hover:shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Bookings
            </p>
            <p className="mt-1 text-2xl font-bold font-display text-foreground">{stats.total}</p>
          </div>
          <div className="h-10 w-10 rounded-xl border border-black/10 dark:border-white/15 bg-primary/10 text-primary flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-foreground/20 hover:shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pending
            </p>
            <p className="mt-1 text-2xl font-bold font-display text-amber-600 dark:text-amber-400">
              {stats.pending}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl border border-black/10 dark:border-white/15 bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-foreground/20 hover:shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Completed
            </p>
            <p className="mt-1 text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
              {stats.completed}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl border border-black/10 dark:border-white/15 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-foreground/20 hover:shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Trip Revenue
            </p>
            <p className="mt-1 text-2xl font-bold font-display text-primary">
              ₹{stats.revenue.toLocaleString()}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl border border-black/10 dark:border-white/15 bg-primary/10 text-primary flex items-center justify-center">
            <IndianRupee className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] w-fit">
          {[
            { id: "ALL", label: "All" },
            { id: "PENDING", label: "Pending" },
            { id: "ACCEPTED", label: "Accepted" },
            { id: "COMPLETED", label: "Completed" },
            { id: "CANCELLED", label: "Cancelled" },
            { id: "REJECTED", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusTab(tab.id);
                setPage(1);
              }}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                statusTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search passenger, route, ID..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9 rounded-xl border-border bg-background"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">
                  Booking Details
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">
                  Passenger
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">
                  Route
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">
                  Seats
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">
                  Booked On
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground text-sm" colSpan={8}>
                    Loading bookings...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td className="px-4 py-12 text-center text-muted-foreground text-sm" colSpan={8}>
                    <p className="font-semibold text-foreground">No bookings found</p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      {query || statusTab !== "ALL"
                        ? "Try clearing filters or search query."
                        : "There are currently no passenger bookings recorded in the system."}
                    </p>
                  </td>
                </tr>
              ) : (
                paginated.map((booking) => (
                  <tr key={booking.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-foreground truncate max-w-[140px]">
                        {booking.tripcode || "TRIP"}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                        {booking.id}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-foreground">{booking.passengerName}</div>
                      <div className="text-xs text-muted-foreground">{booking.passengerEmail}</div>
                    </td>
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <div className="font-medium truncate text-foreground">
                        {booking.pickupLocation}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        to {booking.dropoffLocation}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-foreground">
                      {booking.seats}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-foreground">
                      ₹{booking.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase">
                        <CreditCard className="h-3.5 w-3.5" />
                        {booking.paymentMode || "COD"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(booking.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card">
            <span className="text-xs text-muted-foreground">
              Showing {(page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, filteredBookings.length)} of{" "}
              {filteredBookings.length} bookings
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-xs h-8 rounded-xl border-border"
              >
                Previous
              </Button>
              <span className="text-xs font-medium">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="text-xs h-8 rounded-xl border-border"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}