import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Trip } from "@/types";
import { bookTrip, joinWaitlist, searchTrips } from "@/services/passengerService";
import {
  LocationInput,
  formatLocationName,
  toTripLocation,
} from "@/lib/locations";
import LocationSearch from "@/components/common/LocationSearch";
import StatusBadge from "@/components/common/StatusBadge";
import { SEO } from "@carpooling/common";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MapPin,
  Users,
  Car,
  Star,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronUp,
  Route,
  ShieldCheck,
  BellRing,
} from "lucide-react";

interface BookingFormState {
  tripId: string;
  seats: string;
  paymentMode: "COD" | "ADVANCE";
}

export default function SearchTrips() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState<LocationInput | null>(null);
  const [destination, setDestination] = useState<LocationInput | null>(null);
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [seats, setSeats] = useState("1");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingFormState | null>(null);
  const razorpayEnabled =
    String(import.meta.env.VITE_RAZORPAY_ENABLED ?? "false") === "true";

  const { mutate: search, isPending: isSearching } = useMutation({
    mutationFn: searchTrips,
    onSuccess: (data) => {
      const normalizedTrips = Array.isArray(data)
        ? data
        : Array.isArray((data as { data?: Trip[] })?.data)
        ? ((data as { data?: Trip[] }).data ?? [])
        : [];

      setTrips(normalizedTrips);
      setHasSearched(true);
    },
    onError: () => toast.error("Failed to search trips. Try again."),
  });

  const { mutate: book, isPending: isBooking } = useMutation({
    mutationFn: ({
      tripId,
      ...body
    }: { tripId: string } & Parameters<typeof bookTrip>[1]) =>
      bookTrip(tripId, body),
    onSuccess: () => {
      toast.success("Booking request sent! Driver will be notified via email.");
      setBookingForm(null);
      navigate("/passenger/bookings");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message;
      toast.error(
        typeof msg === "string"
          ? msg
          : "Booking failed. Please check your route and try again."
      );
    },
  });

  const { mutate: waitlist, isPending: isJoiningWaitlist } = useMutation({
    mutationFn: joinWaitlist,
    onSuccess: (entry) => {
      toast.success(`Added to waitlist — position #${entry.position}`);
    },
    onError: (error: { response?: { data?: { message?: string } } }) =>
      toast.error(error?.response?.data?.message || "Failed to join waitlist."),
  });

  const handleSearch = () => {
    if (!origin || !destination) {
      toast.error("Please select origin and destination.");
      return;
    }

    search({
      origin: toTripLocation(origin),
      destination: toTripLocation(destination),
      dateAndTime: (dateTime ?? new Date()).toISOString(),
      seats: Number(seats),
    });
  };

  const handleBook = () => {
    if (!bookingForm) return;
    if (!origin || !destination) {
      toast.error("Search origin and destination are required to book.");
      return;
    }

    book({
      tripId: bookingForm.tripId,
      pickupLocation: toTripLocation(origin),
      dropoffLocation: toTripLocation(destination),
      seats: Number(bookingForm.seats),
      paymentMode: bookingForm.paymentMode,
    });
  };

  const openBookingForm = (trip: Trip) => {
    setBookingForm({
      tripId: trip.id,
      seats: "1",
      paymentMode: "COD",
    });
  };

  const dateTimePickerClass =
    "h-10 w-full rounded-lg border border-border bg-background text-foreground pl-9 pr-4 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";

  const helperCards = [
    {
      title: "Plan quickly",
      copy: "Pick your route, seats, and time in one calm flow.",
      icon: Route,
    },
    {
      title: "Travel safely",
      copy: "Boarding OTPs and email updates keep trips accountable.",
      icon: ShieldCheck,
    },
    {
      title: "Stay informed",
      copy: "Booking and payment changes appear in your inbox automatically.",
      icon: BellRing,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <SEO
        title="Find a Ride"
        description="Search available carpooling trips, compare routes and prices, and book seats with verified drivers."
      />
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Passenger search
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Search Trips
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Find available rides by origin, destination, and time.
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {helperCards.map(({ title, copy, icon: Icon }) => (
          <Card key={title} className="border-border bg-card shadow-sm">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-border bg-card shadow-sm">
        <CardContent className="p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label>From</Label>
              <LocationSearch placeholder="Origin" onSelect={(loc) => setOrigin(loc)} />
            </div>
            <div className="space-y-1.5">
              <Label>To</Label>
              <LocationSearch
                placeholder="Destination"
                onSelect={(loc) => setDestination(loc)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Seats</Label>
              <Select value={seats} onValueChange={setSeats}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} seat{n > 1 ? "s" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
              <Label>Date & time</Label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <DatePicker
                  selected={dateTime}
                  onChange={(d) => setDateTime(d)}
                  showTimeSelect
                  timeIntervals={15}
                  timeCaption="Time"
                  minDate={new Date()}
                  placeholderText="Select date and time"
                  className={dateTimePickerClass}
                  calendarClassName="passenger-datetime-picker"
                  popperClassName="passenger-datetime-popper"
                  dateFormat="dd MMM yyyy · h:mm aa"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Use the search button when your route is ready. We’ll show live trip cards below.
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="gap-2 rounded-lg bg-primary px-5 text-primary-foreground shadow-sm hover:opacity-90"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasSearched && (
        <div className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#4B5563]">
              {trips.length === 0
                ? "No trips found"
                : `${trips.length} trip${trips.length > 1 ? "s" : ""} found`}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-black/10 bg-white text-[#4B5563]">
                Fast updates
              </Badge>
              <Badge variant="outline" className="border-black/10 bg-white text-[#4B5563]">
                OTP boarding
              </Badge>
            </div>
          </div>

          {trips.length === 0 ? (
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-12">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-border bg-muted/30 p-6">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <Search className="h-6 w-6 text-primary" />
                    </div>
                    <p className="mt-4 text-center font-medium text-foreground">
                      No trips available
                    </p>
                    <p className="mt-1 text-center text-sm text-muted-foreground">
                      Try a different date, time, or route.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {[
                      "Try nearby pickup points",
                      "Reduce seats if the car is full",
                      "Search a slightly different departure time",
                      "Check again later for new trips",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {trips.map((trip) => (
                <Card key={trip.id} className="border-border bg-card shadow-sm">
                  <CardContent className="p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex shrink-0 flex-col items-center gap-1">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <div className="h-8 w-0.5 bg-border" />
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">
                          {formatLocationName(trip.origin)}
                        </p>
                        <p className="my-2 text-xs text-muted-foreground">
                          {format(new Date(trip.departureTime), "dd MMM yyyy · h:mm a")}
                        </p>
                        <p className="font-semibold text-foreground">
                          {formatLocationName(trip.destinationLocation)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">
                          ₹{trip.pricePerKm != null ? trip.pricePerKm : trip.price}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {trip.pricePerKm != null ? "per km" : "per seat"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {trip.availableSeats} seats left
                      </span>
                      {trip.car && (
                        <span className="flex items-center gap-1">
                          <Car className="h-3.5 w-3.5" />
                          {trip.car.make} {trip.car.model} · {trip.car.color}
                        </span>
                      )}
                      {trip.driver && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-500" />
                          {trip.driver.name}
                        </span>
                      )}
                      <StatusBadge status={trip.status} />
                    </div>

                    <Separator className="my-4" />

                    <div className="flex items-center justify-between gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedTrip(expandedTrip === trip.id ? null : trip.id)
                        }
                        className="gap-1 text-muted-foreground"
                      >
                        {expandedTrip === trip.id ? (
                          <>
                            <ChevronUp className="h-3.5 w-3.5" />
                            Hide details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3.5 w-3.5" />
                            View details
                          </>
                        )}
                      </Button>

                      {trip.status === "SCHEDULED" &&
                        (trip.availableSeats > 0 ? (
                          <Button
                            onClick={() => openBookingForm(trip)}
                            className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            Book Seat
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            disabled={isJoiningWaitlist}
                            onClick={() => waitlist(trip.id)}
                            className="rounded-lg border-border"
                          >
                            {isJoiningWaitlist ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Join Waitlist"
                            )}
                          </Button>
                        ))}
                    </div>

                    {expandedTrip === trip.id && (
                      <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                        <div>
                          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Pickup Stops
                          </p>
                          {trip.pickupLocations.map((loc, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-foreground">
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                              {formatLocationName(loc)}
                            </div>
                          ))}
                        </div>
                        {trip.car && (
                          <div>
                            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Vehicle
                            </p>
                            <p className="text-sm text-foreground">
                              {trip.car.year} {trip.car.make} {trip.car.model} ·{" "}
                              {trip.car.color}
                              {trip.car.licensePlate ? ` · ${trip.car.licensePlate}` : ""}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog
        open={!!bookingForm}
        onOpenChange={(open) => {
          if (!open) setBookingForm(null);
        }}
      >
        <DialogContent className="max-w-md rounded-xl border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-foreground">Confirm Booking</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Review your route and choose how many seats to book.
            </DialogDescription>
          </DialogHeader>

          {bookingForm && (
            <div className="space-y-4 py-2">
              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <div className="h-6 w-0.5 bg-border" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  </div>
                  <div className="min-w-0 space-y-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Pickup</p>
                      <p className="font-medium text-foreground">{origin?.name ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Dropoff</p>
                      <p className="font-medium text-foreground">{destination?.name ?? "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Seats</Label>
                <Select
                  value={bookingForm.seats}
                  onValueChange={(value) =>
                    setBookingForm({ ...bookingForm, seats: value })
                  }
                >
                  <SelectTrigger className="border-border bg-background text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} seat{n > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      value: "COD" as const,
                      title: "Cash on Delivery",
                      description: "Pay cash to driver at pickup.",
                      disabled: false,
                    },
                    {
                      value: "ADVANCE" as const,
                      title: "Advance Payment",
                      description: razorpayEnabled
                        ? "Pay securely with Razorpay."
                        : "Coming soon in this environment.",
                      disabled: !razorpayEnabled,
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={option.disabled}
                      onClick={() =>
                        setBookingForm({ ...bookingForm, paymentMode: option.value })
                      }
                      className={`rounded-lg border p-4 text-left transition cursor-pointer ${
                        bookingForm.paymentMode === option.value
                          ? "border-primary bg-primary/10 text-foreground font-semibold"
                          : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                      } ${option.disabled ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-foreground">{option.title}</p>
                        {option.disabled && (
                          <Badge variant="secondary">Coming Soon</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                title: "1. Choose route",
                copy: "Set your pickup and destination from the search form.",
              },
              {
                title: "2. Pick seats",
                copy: "Select the number of seats before you confirm.",
              },
              {
                title: "3. Track status",
                copy: "We’ll move your booking into bookings and chat for follow-up.",
              },
            ].map((step) => (
              <div key={step.title} className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.copy}</p>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setBookingForm(null)} disabled={isBooking} className="border-border">
              Cancel
            </Button>
            <Button
              onClick={handleBook}
              disabled={isBooking}
              className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isBooking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Booking...
                </>
              ) : (
                "Confirm Booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
