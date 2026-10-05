import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { MoreVertical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@carpooling/common";
import { getApiErrorMessage } from "@/lib/errors";
import {
  fetchAdminTrips,
  type AdminListResponse,
  type AdminTrip,
} from "@/services/adminUsersService";

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

export default function Trips() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdminListResponse<AdminTrip> | null>(null);
  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState<"ALL" | AdminTrip["status"]>(
    "ALL"
  );
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    try {
      const search = query.trim();
      const res = await fetchAdminTrips({
        pagination: { page, limit },
        sort: { field: "departureTime", order: "desc" },
        filters: {
          ...(statusTab !== "ALL" ? { status: statusTab } : {}),
          ...(search ? { search } : {}),
        },
      });
      setData(res);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to load trips."));
    } finally {
      setLoading(false);
    }
  }, [limit, page, query, statusTab]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  useEffect(() => {
    if (!openMenuFor) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (menuRef.current && target && menuRef.current.contains(target)) return;
      setOpenMenuFor(null);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [openMenuFor]);

  const trips = data?.data ?? [];
  const filteredTrips = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trips;
    return trips.filter((trip) => {
      const pickupNames = trip.pickupLocations.map((location) =>
        location.name.toLowerCase()
      );
      return (
        trip.id.toLowerCase().includes(q) ||
        trip.tripcode.toLowerCase().includes(q) ||
        trip.driverId.toLowerCase().includes(q) ||
        trip.origin.toLowerCase().includes(q) ||
        trip.destinationLocation.toLowerCase().includes(q) ||
        pickupNames.some((name) => name.includes(q))
      );
    });
  }, [query, trips]);

  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono font-medium text-foreground/80 mb-2">
            <span>ADMIN DISPATCH</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Trips</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {meta ? `${meta.total} total trips recorded` : "—"}
          </p>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-2">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tripcode/origin/destination..."
              className="pl-9 rounded-xl border-border bg-background"
            />
          </div>
          <Button
            variant="outline"
            className="rounded-xl border-border"
            onClick={() => {
              setQuery("");
              setStatusTab("ALL");
              setPage(1);
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] w-fit">
        {[
          { key: "ALL", label: "All Trips" },
          { key: "SCHEDULED", label: "Scheduled" },
          { key: "ONGOING", label: "Ongoing" },
          { key: "COMPLETED", label: "Completed" },
          { key: "CANCELLED", label: "Cancelled" },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setStatusTab(key as any);
              setPage(1);
            }}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              statusTab === key
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Trip</th>
                <th className="px-4 py-3 font-medium">Driver</th>
                <th className="px-4 py-3 font-medium">Route</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Seats</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Departure</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={8}>
                    Loading...
                  </td>
                </tr>
              ) : filteredTrips.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={8}>
                    No trips found.
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => (
                  <tr key={trip.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{trip.tripcode}</div>
                      <div className="text-xs text-muted-foreground break-all font-mono">
                        {trip.id}
                      </div>
                    </td>
                    <td className="px-4 py-3 break-all font-mono text-xs text-muted-foreground">{trip.driverId}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{trip.origin}</div>
                      <div className="text-xs text-muted-foreground">
                        to {trip.destinationLocation}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">₹{trip.pricePerKm}</td>
                    <td className="px-4 py-3">{trip.availableSeats}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={trip.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(trip.departureTime)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div
                        className="relative inline-block"
                        ref={openMenuFor === trip.id ? menuRef : undefined}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl h-8 w-8"
                          onClick={() =>
                            setOpenMenuFor((current) =>
                              current === trip.id ? null : trip.id
                            )
                          }
                          aria-label="Trip actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>

                        {openMenuFor === trip.id && (
                          <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-xl overflow-hidden text-left p-1">
                            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border uppercase tracking-wider">
                              Pickup points
                            </div>
                            <div className="max-h-48 overflow-auto p-1 space-y-1">
                              {trip.pickupLocations.map((location, index) => (
                                <div
                                  key={`${trip.id}-${index}`}
                                  className="px-2.5 py-1.5 rounded-xl hover:bg-muted/50 transition-colors text-sm"
                                >
                                  <div className="font-medium text-foreground">
                                    {location.name}
                                  </div>
                                  <div className="text-xs font-mono text-muted-foreground">
                                    {location.lat}, {location.lon}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border p-4">
          <div className="text-sm text-muted-foreground">
            Page {meta?.page ?? page} of {meta?.totalPages ?? "—"}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Rows</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="h-9 rounded-xl border border-input bg-background px-3 text-sm shadow-xs"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              className="rounded-xl border-border"
              disabled={loading || (meta ? !meta.hasPrev : page <= 1)}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-border"
              disabled={loading || (meta ? !meta.hasNext : true)}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
