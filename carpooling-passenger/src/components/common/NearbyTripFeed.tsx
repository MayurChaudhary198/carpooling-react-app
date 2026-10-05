import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  Compass,
  MapPin,
  Users,
  Star,
  Calendar,
  Loader2,
  Search,
  AlertCircle,
  RefreshCw,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getNearbyTripFeed, bookTrip } from "@/services/passengerService";
import type { TripFeedItem, PaginationMeta } from "@carpooling/common";

interface CurrentCoordinates {
  lat: number;
  lon: number;
}

interface QuickBookingState {
  trip: TripFeedItem;
  seats: string;
  paymentMode: "COD" | "ADVANCE";
}

export default function NearbyTripFeed() {
  const navigate = useNavigate();
  const [coords, setCoords] = useState<CurrentCoordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "prompt" | "requesting" | "granted" | "denied" | "unsupported"
  >("prompt");
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [seats, setSeats] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [trips, setTrips] = useState<TripFeedItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [quickBooking, setQuickBooking] = useState<QuickBookingState | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      return;
    }

    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        setLocationStatus("granted");
      },
      (err) => {
        console.warn("Geolocation denied/unavailable:", err.message);
        setLocationStatus("denied");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  // Request location on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Fetch feed trips when coordinates, radius, or seats change
  const fetchFeed = useCallback(
    async (currentPage: number, append = false) => {
      if (!coords) return;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await getNearbyTripFeed({
          currentLocation: {
            name: "Current Location",
            lat: coords.lat,
            lon: coords.lon,
          },
          radiusKm,
          seats,
          pagination: {
            page: currentPage,
            limit: 10,
          },
        });

        if (append) {
          setTrips((prev) => [...prev, ...response.data]);
        } else {
          setTrips(response.data);
        }

        if (response.meta) {
          setMeta(response.meta);
        }
      } catch (err: any) {
        console.warn("Failed to load nearby trips:", err);
        if (!append) {
          toast.error("Could not load nearby rides.");
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [coords, radiusKm, seats]
  );

  useEffect(() => {
    if (locationStatus === "granted" && coords) {
      setPage(1);
      fetchFeed(1, false);
    }
  }, [locationStatus, coords, radiusKm, seats, fetchFeed]);

  const handleLoadMore = () => {
    if (!meta?.hasNext || isLoadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeed(nextPage, true);
  };

  const { mutate: performBook, isPending: isBooking } = useMutation({
    mutationFn: ({
      tripId,
      ...body
    }: { tripId: string } & Parameters<typeof bookTrip>[1]) =>
      bookTrip(tripId, body),
    onSuccess: () => {
      toast.success("Ride booked! Waiting for driver confirmation.");
      setQuickBooking(null);
      navigate("/passenger/bookings");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Booking failed. Try again.";
      toast.error(msg);
    },
  });

  const getTripId = (trip: TripFeedItem) => trip._id || trip.id || "";

  const getPlaceName = (place: any): string => {
    if (!place) return "Location";
    if (typeof place === "string") return place;
    return place.name || "Location";
  };

  const handleConfirmBooking = () => {
    if (!quickBooking) return;
    const trip = quickBooking.trip;
    const tripId = getTripId(trip);
    if (!tripId) {
      toast.error("Invalid trip identifier.");
      return;
    }

    const originName = getPlaceName(trip.origin);
    const destName = getPlaceName(trip.destination || trip.destinationLocation);

    // Resolve pickup / origin coordinates
    let originLat =
      typeof trip.origin === "object" && trip.origin?.lat
        ? Number(trip.origin.lat)
        : trip.originLat;
    let originLon =
      typeof trip.origin === "object" && trip.origin?.lon
        ? Number(trip.origin.lon)
        : trip.originLon;

    if ((!originLat || !originLon) && coords?.lat && coords?.lon) {
      originLat = coords.lat;
      originLon = coords.lon;
    }

    // Resolve dropoff / destination coordinates
    const destObj = trip.destination || trip.destinationLocation;
    let destLat =
      typeof destObj === "object" && destObj?.lat
        ? Number(destObj.lat)
        : trip.destinationLat;
    let destLon =
      typeof destObj === "object" && destObj?.lon
        ? Number(destObj.lon)
        : trip.destinationLon;

    // Fallback: check pickupLocations array from route
    if (
      (!destLat || !destLon) &&
      Array.isArray(trip.pickupLocations) &&
      trip.pickupLocations.length > 0
    ) {
      const lastPoint = trip.pickupLocations[trip.pickupLocations.length - 1];
      destLat = lastPoint.lat;
      destLon = lastPoint.lon;
    }

    performBook({
      tripId,
      pickupLocation: {
        name: originName,
        lat: Number(originLat || 0),
        lon: Number(originLon || 0),
      },
      dropoffLocation: {
        name: destName,
        lat: Number(destLat || 0),
        lon: Number(destLon || 0),
      },
      seats: Number(quickBooking.seats),
      paymentMode: quickBooking.paymentMode,
    });
  };

  // Fallback state if location denied or unsupported
  if (locationStatus === "denied" || locationStatus === "unsupported") {
    return (
      <Card className="border-black/10 bg-white shadow-sm overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-[#0B132B]">
                  Location access disabled
                </h3>
                <p className="mt-1 text-sm text-[#4B5563] max-w-xl">
                  Enable browser location permission to automatically see rides departing near your current position. In the meantime, you can search for trips by origin and destination.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={requestLocation}
                className="gap-2 border-black/10 bg-white"
              >
                <RefreshCw className="h-4 w-4" />
                Retry location
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/passenger/search")}
                className="gap-2 bg-[#0F766E] text-white hover:bg-[#0B615D]"
              >
                <Search className="h-4 w-4" />
                Search rides manually
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls & Filter Bar */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-black/10 dark:border-white/10 bg-gradient-to-br from-card via-card/95 to-card/90 dark:from-white/[0.08] dark:via-white/[0.03] dark:to-transparent p-4.5 backdrop-blur-xl shadow-md dark:shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.14)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/20 to-transparent" />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.03] dark:bg-white/[0.08] text-foreground shadow-xs">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-foreground">
                Rides Near You
              </h2>
              {locationStatus === "granted" && (
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {locationStatus === "requesting"
                ? "Detecting your location..."
                : `Showing available carpools around you`}
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Radius:</span>
            <Select
              value={String(radiusKm)}
              onValueChange={(val) => setRadiusKm(Number(val))}
            >
              <SelectTrigger className="h-9 w-24 rounded-xl border-black/10 dark:border-white/15 bg-card/60 dark:bg-white/[0.05] text-xs font-medium text-foreground">
                <SelectValue placeholder="5 km" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 km</SelectItem>
                <SelectItem value="5">5 km</SelectItem>
                <SelectItem value="10">10 km</SelectItem>
                <SelectItem value="15">15 km</SelectItem>
                <SelectItem value="25">25 km</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Seats:</span>
            <Select
              value={String(seats)}
              onValueChange={(val) => setSeats(Number(val))}
            >
              <SelectTrigger className="h-9 w-24 rounded-xl border-black/10 dark:border-white/15 bg-card/60 dark:bg-white/[0.05] text-xs font-medium text-foreground">
                <SelectValue placeholder="1 seat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 seat</SelectItem>
                <SelectItem value="2">2 seats</SelectItem>
                <SelectItem value="3">3 seats</SelectItem>
                <SelectItem value="4">4 seats</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchFeed(1, false)}
            disabled={isLoading || locationStatus === "requesting"}
            className="h-9 px-2.5 rounded-xl text-foreground hover:bg-black/5 dark:hover:bg-white/10"
            title="Refresh feed"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Feed List Content */}
      {isLoading ? (
        <Card className="rounded-2xl border-black/10 dark:border-white/10 bg-card/60 dark:bg-white/[0.03] py-16 backdrop-blur-md shadow-sm">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-foreground" />
            <p className="mt-3 text-sm font-semibold text-foreground">
              Finding nearby rides...
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Scanning for departures within {radiusKm} km
            </p>
          </div>
        </Card>
      ) : trips.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.03] py-12 shadow-sm">
          <div className="flex flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 dark:border-white/15 bg-black/[0.03] dark:bg-white/[0.08]">
              <Navigation className="h-6 w-6 text-muted-foreground" />
            </div>
            <h4 className="font-display text-base font-bold text-foreground">
              No rides found within {radiusKm} km
            </h4>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Drivers haven't posted trips near your current location yet. Try increasing the search radius or enter a custom route.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRadiusKm(15)}
                className="text-xs rounded-xl border-black/10 dark:border-white/20 bg-card/60 dark:bg-white/[0.05]"
              >
                Expand to 15 km
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/passenger/search")}
                className="bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-primary/90 shadow-sm"
              >
                Search all routes
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => {
            const tripId = getTripId(trip);
            const originName = getPlaceName(trip.origin);
            const destName = getPlaceName(trip.destination || trip.destinationLocation);
            const distance =
              typeof trip.distanceFromCurrentLocationKm === "number"
                ? `${trip.distanceFromCurrentLocationKm.toFixed(1)} km away`
                : null;

            return (
              <Card
                key={tripId || Math.random()}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-gradient-to-br from-card via-card/95 to-card/90 dark:from-white/[0.08] dark:via-white/[0.03] dark:to-transparent shadow-sm dark:shadow-[0_12px_36px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)] hover:border-black/20 dark:hover:border-white/25 hover:shadow-md dark:hover:shadow-[0_16px_44px_rgba(0,0,0,0.6)] hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/20 to-transparent" />
                <div className="p-5">
                  {/* Card Header: Distance & Price */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {distance ? (
                      <Badge className="bg-primary/10 text-foreground border-0 font-medium text-xs">
                        <MapPin className="mr-1 h-3 w-3" />
                        {distance}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Nearby
                      </Badge>
                    )}

                    <div className="text-right">
                      <span className="font-display text-lg font-bold text-foreground">
                        ₹{trip.price || (trip.pricePerKm ? `${trip.pricePerKm}/km` : "—")}
                      </span>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <p className="font-medium text-foreground line-clamp-1" title={originName}>
                        {originName}
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="mt-1 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                      <p className="font-medium text-foreground line-clamp-1" title={destName}>
                        {destName}
                      </p>
                    </div>
                  </div>

                  {/* Trip details */}
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-3 border-t border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-foreground" />
                      <span>
                        {trip.departureTime
                          ? format(new Date(trip.departureTime), "h:mm a · dd MMM")
                          : "Scheduled"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-foreground" />
                      <span>{trip.availableSeats} seat{trip.availableSeats > 1 ? "s" : ""} left</span>
                    </div>
                  </div>

                  {/* Driver info */}
                  {trip.driver && (
                    <div className="mt-3 flex items-center justify-between rounded-xl border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] p-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[11px] font-bold text-primary-foreground uppercase shadow-xs">
                          {trip.driver.name?.charAt(0) || "D"}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground leading-tight">
                            {trip.driver.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {trip.car?.make ? `${trip.car.make} ${trip.car.model || ""}` : "Verified Driver"}
                          </p>
                        </div>
                      </div>

                      {trip.driver.rating ? (
                        <div className="flex items-center gap-0.5 text-amber-500 font-semibold">
                          <Star className="h-3 w-3 fill-amber-500" />
                          <span>{trip.driver.rating.toFixed(1)}</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Card footer CTA */}
                <div className="p-4 pt-0">
                  <Button
                    onClick={() =>
                      setQuickBooking({
                        trip,
                        seats: "1",
                        paymentMode: "COD",
                      })
                    }
                    className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-9 font-semibold shadow-sm transition-all"
                  >
                    Book Ride
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination / Load more */}
      {meta?.hasNext && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="rounded-lg border-black/10 bg-white px-6 text-xs text-[#0F766E] hover:bg-[#FAFAF8]"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Loading more rides...
              </>
            ) : (
              "Load more rides"
            )}
          </Button>
        </div>
      )}

      {/* Quick Booking Modal */}
      <Dialog
        open={Boolean(quickBooking)}
        onOpenChange={(open) => !open && setQuickBooking(null)}
      >
        <DialogContent className="max-w-md rounded-2xl border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-foreground">
              Confirm ride booking
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Review departure route and select payment preference.
            </DialogDescription>
          </DialogHeader>

          {quickBooking && (
            <div className="space-y-4 py-2">
              {/* Route Summary */}
              <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground">Pickup: </span>
                    <span className="text-muted-foreground">
                      {getPlaceName(quickBooking.trip.origin)}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground">Destination: </span>
                    <span className="text-muted-foreground">
                      {getPlaceName(
                        quickBooking.trip.destination ||
                          quickBooking.trip.destinationLocation
                      )}
                    </span>
                  </div>
                </div>
                {quickBooking.trip.distanceFromCurrentLocationKm && (
                  <p className="pt-2 text-[11px] text-primary font-medium border-t border-border">
                    Departure point is {quickBooking.trip.distanceFromCurrentLocationKm.toFixed(1)} km from your current location
                  </p>
                )}
              </div>

              {/* Seats selector */}
              <div>
                <Label className="text-xs font-semibold text-foreground">
                  Number of seats
                </Label>
                <Select
                  value={quickBooking.seats}
                  onValueChange={(val) =>
                    setQuickBooking({ ...quickBooking, seats: val })
                  }
                >
                  <SelectTrigger className="mt-1.5 h-10 border-border bg-background text-xs text-foreground">
                    <SelectValue placeholder="Select seats" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      { length: Math.min(quickBooking.trip.availableSeats || 1, 6) },
                      (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {i + 1} seat{i > 0 ? "s" : ""}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Mode */}
              <div>
                <Label className="text-xs font-semibold text-foreground">
                  Payment method
                </Label>
                <div className="mt-1.5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setQuickBooking({ ...quickBooking, paymentMode: "COD" })
                    }
                    className={`rounded-xl border p-3 text-left transition cursor-pointer ${
                      quickBooking.paymentMode === "COD"
                        ? "border-primary bg-primary/10 font-semibold text-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    <p className="text-xs font-medium">Cash on Delivery</p>
                    <p className="text-[10px] text-muted-foreground font-normal">Pay at pickup</p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setQuickBooking({ ...quickBooking, paymentMode: "ADVANCE" })
                    }
                    className={`rounded-xl border p-3 text-left transition cursor-pointer ${
                      quickBooking.paymentMode === "ADVANCE"
                        ? "border-primary bg-primary/10 font-semibold text-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    <p className="text-xs font-medium">Advance Payment</p>
                    <p className="text-[10px] text-muted-foreground font-normal">Pay online</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setQuickBooking(null)}
              disabled={isBooking}
              className="text-xs rounded-xl border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmBooking}
              disabled={isBooking}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium rounded-xl"
            >
              {isBooking ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Sending request...
                </>
              ) : (
                "Confirm & Book"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
