import api from "@/services/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  StatusBadge,
  getApiErrorMessage,
  unwrapApiData,
  unwrapApiListData,
  PageLoading,
  SEO,
} from "@carpooling/common";
import { API_ENDPOINTS, ROUTES } from "@/constants";

import LocationSearch from "@/components/common/LocationSearch";
import TripDatePicker from "@/components/common/TripDatePicker";
import RouteMap from "@/components/common/RouteMap";
import { formatLocationName } from "@/lib/utils";

import type { LocationResult, Trip } from "@/types";

import {
  History,
  MapPin,
  Loader2,
  X,
  ChevronDown,
  ChevronRight,
  Clock,
  Users,
  IndianRupee,
  Search,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────
const tripSchema = z.object({
  pricePerKm: z
    .number({ message: "Price per km must be a valid number" })
    .min(0.01, "Price per km must be greater than 0"),
  availableSeats: z
    .number({ message: "Must have at least 1 seat" })
    .int("Seats must be a whole number")
    .min(1, "Must have at least 1 seat")
    .max(20, "Maximum seats is 20"),
});

type TripFormData = z.infer<typeof tripSchema>;

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface LocationPayload {
  name: string;
  lat: number;
  lon: number;
}

interface CreateTripPayload {
  origin: LocationPayload;
  destination: LocationPayload;
  departureTime: string;
  endTime: string;
  pricePerKm: number;
  availableSeats: number;
  pickupLocations: LocationPayload[];
}

type RoutePointsResponse =
  | LocationResult[]
  | {
      data?: LocationResult[] | { routePoints?: LocationResult[]; pickupLocations?: LocationResult[]; points?: LocationResult[] };
      routePoints?: LocationResult[];
      pickupLocations?: LocationResult[];
      points?: LocationResult[];
    };

// ─────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────
const getMyTrips = async (): Promise<Trip[]> => {
  const res = await api.get(API_ENDPOINTS.trip.list);
  return unwrapApiListData<Trip>(res.data);
};

const handleCreateTrip = async (trip: CreateTripPayload) => {
  const res = await api.post(API_ENDPOINTS.trip.list, trip);
  return unwrapApiData(res.data);
};

const getRoutePickupPoints = async (
  start: LocationResult,
  end: LocationResult
): Promise<LocationResult[]> => {
  const res = await api.post(API_ENDPOINTS.location.route, {
    start,
    end,
  });

  const payload = unwrapApiData<RoutePointsResponse>(res.data);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload.data && !Array.isArray(payload.data)) {
    if (Array.isArray((payload.data as { routePoints?: LocationResult[] }).routePoints)) {
      return (payload.data as { routePoints?: LocationResult[] }).routePoints ?? [];
    }
    if (Array.isArray((payload.data as { pickupLocations?: LocationResult[] }).pickupLocations)) {
      return (payload.data as { pickupLocations?: LocationResult[] }).pickupLocations ?? [];
    }
    if (Array.isArray((payload.data as { points?: LocationResult[] }).points)) {
      return (payload.data as { points?: LocationResult[] }).points ?? [];
    }
  }

  if (Array.isArray(payload.routePoints)) {
    return payload.routePoints;
  }

  if (Array.isArray(payload.pickupLocations)) {
    return payload.pickupLocations;
  }

  if (Array.isArray(payload.points)) {
    return payload.points;
  }

  return [];
};



// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function Trips() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const showHistoryFromNavigation = (
    location.state as { showHistory?: boolean } | null
  )?.showHistory;

  // ───────────────────────────────────────────────────────────
  // State
  // ───────────────────────────────────────────────────────────
  const [showHistory, setShowHistory] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [formKey, setFormKey] = useState(0);

  const [originLocation, setOriginLocation] = useState<LocationResult | null>(
    null
  );

  const [destinationLocation, setDestinationLocation] =
    useState<LocationResult | null>(null);

  const [departureTime, setDepartureTime] = useState<Date | null>(null);

  const [endTime, setEndTime] = useState<Date | null>(null);

  const [pickupLocations, setPickupLocations] = useState<string[]>([]);

  const [showPickupDropdown, setShowPickupDropdown] = useState(false);

  const [routePoints, setRoutePoints] = useState<LocationResult[]>([]);

  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    if (showHistoryFromNavigation) {
      setShowHistory(true);
    }
  }, [showHistoryFromNavigation]);

  // ───────────────────────────────────────────────────────────
  // Form
  // ───────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      pricePerKm: undefined,
      availableSeats: undefined,
    },
  });

  // ───────────────────────────────────────────────────────────
  // Queries
  // ───────────────────────────────────────────────────────────
  const {
    data: trips,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["trips"],
    queryFn: getMyTrips,
  });

  // ───────────────────────────────────────────────────────────
  // Mutations
  // ───────────────────────────────────────────────────────────
  const { mutate: createTrip, isPending } = useMutation({
    mutationFn: handleCreateTrip,

    onSuccess: () => {
      toast.success("Trip created successfully!");

      queryClient.invalidateQueries({
        queryKey: ["trips"],
      });

      reset();

      setFormKey((k) => k + 1);

      setOriginLocation(null);
      setDestinationLocation(null);

      setDepartureTime(null);
      setEndTime(null);

      setPickupLocations([]);
      setRoutePoints([]);
    },

    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, "Failed to create trip.");

      if (message.toLowerCase().includes("overlapping")) {
        toast.error(
          "You already have a trip at this time. Please choose a different time."
        );
      } else {
        toast.error(message);
      }
    },
  });

  // ───────────────────────────────────────────────────────────
  // Helpers
  // ───────────────────────────────────────────────────────────
  const fetchRoutePoints = async (
    start: LocationResult,
    end: LocationResult
  ) => {
    try {
      setLoadingRoute(true);
      setShowPickupDropdown(false);

      const points = await getRoutePickupPoints(start, end);

      setRoutePoints(points);
      if (points.length > 0) {
        setShowPickupDropdown(true);
      }
    } catch {
      toast.error("Failed to load pickup points");
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleOriginSelect = async (loc: LocationResult) => {
    setOriginLocation(loc);
    setShowPickupDropdown(false);

    setPickupLocations([]);
    setRoutePoints([]);

    if (destinationLocation) {
      fetchRoutePoints(loc, destinationLocation);
    }
  };

  const handleDestinationSelect = async (loc: LocationResult) => {
    setDestinationLocation(loc);
    setShowPickupDropdown(false);

    setPickupLocations([]);
    setRoutePoints([]);

    if (originLocation) {
      fetchRoutePoints(originLocation, loc);
    }
  };

  const togglePickupLocation = (name: string) => {
    setPickupLocations((current) =>
      current.includes(name)
        ? current.filter((location) => location !== name)
        : [...current, name]
    );
  };

  // ───────────────────────────────────────────────────────────
  // Submit
  // ───────────────────────────────────────────────────────────
  const onSubmit = (data: TripFormData) => {
    if (!originLocation) {
      toast.error("Please select origin");
      return;
    }

    if (!destinationLocation) {
      toast.error("Please select destination");
      return;
    }

    if (!departureTime) {
      toast.error("Please select departure time");
      return;
    }

    if (departureTime.getTime() < Date.now() - 60000) {
      toast.error("Departure time must be in the future");
      return;
    }

    if (!endTime) {
      toast.error("Please select end time");
      return;
    }

    if (endTime <= departureTime) {
      toast.error("End time must be after departure time");
      return;
    }

    createTrip({
      origin: {
        name: originLocation.name,
        lat: Number(originLocation.lat),
        lon: Number(originLocation.lon),
      },

      destination: {
        name: destinationLocation.name,
        lat: Number(destinationLocation.lat),
        lon: Number(destinationLocation.lon),
      },

      departureTime: departureTime.toISOString(),

      endTime: endTime.toISOString(),

      pricePerKm: data.pricePerKm,

      availableSeats: data.availableSeats,

      pickupLocations: routePoints
        .filter((point) => pickupLocations.includes(point.name))
        .map((point) => ({
          name: point.name,
          lat: Number(point.lat),
          lon: Number(point.lon),
        })),
    });
  };

  // ───────────────────────────────────────────────────────────
  // Early Returns
  // ───────────────────────────────────────────────────────────
  if (isLoading) return <PageLoading message="Loading trips & routes..." />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-bold text-destructive text-base">Failed to load trips</p>
        <p className="mt-1 text-xs text-muted-foreground">Please check your connection and try again.</p>
      </div>
    );
  }

  // Selected pickup points with coordinates
  const selectedPickupPoints = routePoints.filter((p) =>
    pickupLocations.includes(p.name)
  );
  const isPickupRouteReady = Boolean(originLocation && destinationLocation);
  const isPickupRouteLoading = isPickupRouteReady && loadingRoute;

  // Filtered trips for history view
  const filteredTrips = (trips || []).filter((trip) => {
    const matchesStatus =
      statusFilter === "ALL" ||
      trip.status?.toUpperCase() === statusFilter;

    const originName = formatLocationName(trip.origin).toLowerCase();
    const destName = formatLocationName(
      trip.destination ?? trip.destinationLocation
    ).toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query || originName.includes(query) || destName.includes(query);

    return matchesStatus && matchesSearch;
  });

  const tripCounts = {
    ALL: trips?.length || 0,
    SCHEDULED: trips?.filter((t) => t.status?.toUpperCase() === "SCHEDULED").length || 0,
    ONGOING: trips?.filter((t) => t.status?.toUpperCase() === "ONGOING").length || 0,
    COMPLETED: trips?.filter((t) => t.status?.toUpperCase() === "COMPLETED").length || 0,
    CANCELLED: trips?.filter((t) => t.status?.toUpperCase() === "CANCELLED").length || 0,
  };

  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────
  return (
    <div className="w-full min-w-0 flex flex-col gap-6">
      <SEO
        title={showHistory ? "My Trips & Routes" : "Create New Trip"}
        description="Publish and manage your carpooling routes, scheduled trips, and passenger bookings."
      />
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <h1 className="text-2xl font-bold tracking-tight">Trips</h1>

        <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
          <History className="mr-2 h-4 w-4" />

          {showHistory ? "Create Trip" : "Trip History"}
        </Button>
      </div>

      {/* Create Trip Form */}
      {!showHistory && (
        <div className="grid w-full grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Form */}
          <Card className="overflow-visible border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Create New Trip</CardTitle>
            </CardHeader>

            <CardContent className="overflow-visible">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                {/* Origin & Destination */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label>Origin</Label>

                    <LocationSearch
                      key={`origin-${formKey}`}
                      placeholder="Ahmedabad"
                      onSelect={handleOriginSelect}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label>Destination</Label>

                    <LocationSearch
                      key={`dest-${formKey}`}
                      placeholder="Surat"
                      onSelect={handleDestinationSelect}
                    />
                  </div>
                </div>

                {/* Departure & End Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label>Departure Time</Label>

                    <TripDatePicker
                      selected={departureTime}
                      onChange={(date) => {
                        setDepartureTime(date);

                        if (endTime && date && endTime <= date) {
                          setEndTime(null);
                        }
                      }}
                      existingTrips={trips || []}
                      placeholder="Select departure"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label>End Time</Label>

                    <TripDatePicker
                      selected={endTime}
                      onChange={(date) => setEndTime(date)}
                      existingTrips={trips || []}
                      placeholder="Select end time"
                      minDate={departureTime || new Date()}
                    />
                  </div>
                </div>

                {/* Price & Seats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="pricePerKm">Price per km (₹)</Label>

                    <Input
                      id="pricePerKm"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="10.00"
                      {...register("pricePerKm", {
                        valueAsNumber: true,
                      })}
                    />

                    {errors.pricePerKm && (
                      <p className="text-sm text-red-500">
                        {errors.pricePerKm.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label htmlFor="availableSeats">Available Seats</Label>

                    <Input
                      id="availableSeats"
                      type="number"
                      min="1"
                      max="10"
                      placeholder="3"
                      {...register("availableSeats", {
                        valueAsNumber: true,
                      })}
                    />

                    {errors.availableSeats && (
                      <p className="text-sm text-red-500">
                        {errors.availableSeats.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Pickup Locations */}
                <div className="relative flex flex-col gap-2">
                  <Label>Pickup Locations</Label>

                  {!originLocation || !destinationLocation ? (
                    <p className="text-sm text-muted-foreground">
                      Select origin and destination first
                    </p>
                  ) : isPickupRouteLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Loading pickup points...
                    </p>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={!isPickupRouteReady}
                        onClick={() =>
                          setShowPickupDropdown(!showPickupDropdown)
                        }
                        className="flex w-full items-center justify-between rounded-xl border border-input bg-background px-3.5 py-2 text-sm text-foreground shadow-xs transition hover:border-primary/40 focus:border-primary"
                      >
                        <span className="text-muted-foreground">
                          {pickupLocations.length > 0
                            ? `${pickupLocations.length} location(s) selected`
                            : "Select pickup points"}
                        </span>

                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </button>

                      {showPickupDropdown && isPickupRouteReady && (
                        <div className="absolute left-0 top-full z-[100] max-h-48 w-full overflow-y-auto rounded-lg border bg-background shadow-lg">
                          {routePoints.length === 0 ? (
                            <p className="p-3 text-sm text-muted-foreground">
                              No pickup points found
                            </p>
                          ) : (
                            routePoints.map((point, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => togglePickupLocation(point.name)}
                                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted ${
                                  pickupLocations.includes(point.name)
                                    ? "bg-primary/10"
                                    : ""
                                }`}
                              >
                                <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />

                                <span className="truncate">{point.name}</span>

                                {pickupLocations.includes(point.name) && (
                                  <span className="ml-auto text-xs text-primary">
                                    ✓
                                  </span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {pickupLocations.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {pickupLocations.map((loc) => (
                        <div
                          key={loc}
                          className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm"
                        >
                          <span className="max-w-[150px] truncate">{loc}</span>

                          <button
                            type="button"
                            onClick={() => togglePickupLocation(loc)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full gap-2 rounded-xl font-semibold shadow-sm" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Publishing Trip...
                    </>
                  ) : (
                    "Create Trip"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Map */}
          <div className="sticky top-4 h-full">
            {originLocation && destinationLocation ? (
              <RouteMap
                origin={originLocation}
                destination={destinationLocation}
                pickupPoints={selectedPickupPoints}
              />
            ) : (
              <div className="flex h-full min-h-[500px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted bg-muted/20">
                <MapPin className="h-10 w-10 text-muted-foreground/50" />

                <p className="px-4 text-center text-sm text-muted-foreground">
                  Select origin and destination
                  <br />
                  to preview route on map
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trip History */}
      {showHistory && (
        <div className="flex flex-col gap-4 w-full min-w-0">
          {/* Top Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border shadow-xs w-full min-w-0">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              {[
                { id: "ALL", label: "All" },
                { id: "SCHEDULED", label: "Scheduled" },
                { id: "ONGOING", label: "Ongoing" },
                { id: "COMPLETED", label: "Completed" },
                { id: "CANCELLED", label: "Cancelled" },
              ].map((tab) => {
                const count = tripCounts[tab.id as keyof typeof tripCounts] || 0;
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-background text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                        isActive
                          ? "bg-primary-foreground/15 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Search */}
            <div className="relative max-w-xs w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search route or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8.5 pr-8 h-8.5 text-xs rounded-full border-border bg-background"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Trip List */}
          {filteredTrips.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border bg-muted/20 w-full">
              <p className="font-semibold text-foreground text-sm">No trips match your filter.</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery || statusFilter !== "ALL"
                  ? "Try resetting your search or selecting a different status filter."
                  : "You haven't created any trips yet."}
              </p>
              {(searchQuery || statusFilter !== "ALL") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("ALL");
                    setSearchQuery("");
                  }}
                  className="mt-3 text-xs rounded-full"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 w-full min-w-0">
              {filteredTrips.map((trip) => {
                const originFull = typeof trip.origin === "string" ? trip.origin : (trip.origin as any)?.name || (trip.origin as any)?.address || "";
                const destObj = trip.destination ?? (trip as any).destinationLocation;
                const destFull = typeof destObj === "string" ? destObj : destObj?.name || destObj?.address || "";
                return (
                  <Card
                    key={trip.id}
                    className="w-full cursor-pointer transition-all hover:bg-muted/40 hover:border-primary/30 hover:shadow-sm overflow-hidden"
                    onClick={() => navigate(ROUTES.driver.tripDetails(trip.id))}
                  >
                    <CardContent className="flex items-center justify-between p-4 sm:p-5 gap-3 min-w-0">
                      <div className="flex flex-col gap-2 min-w-0 flex-1 overflow-hidden">
                        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                          <MapPin className="h-4 w-4 text-primary shrink-0" />
                          <span
                            className="font-semibold text-sm sm:text-base text-foreground truncate min-w-0 block"
                            title={`${originFull} → ${destFull}`}
                          >
                            {formatLocationName(trip.origin)} →{" "}
                            {formatLocationName(
                              trip.destination ?? trip.destinationLocation
                            )}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(trip.departureTime).toLocaleString()}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            {trip.availableSeats} seat{trip.availableSeats > 1 ? "s" : ""}
                          </div>

                          <div className="flex items-center gap-0.5 font-semibold text-foreground">
                            <IndianRupee className="h-3.5 w-3.5 shrink-0" />
                            <span>{trip.pricePerKm ?? trip.price}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <StatusBadge status={trip.status} />
                        <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
