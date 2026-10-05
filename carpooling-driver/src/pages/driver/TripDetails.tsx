import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import toast from "react-hot-toast";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  OtpInput,
  StatusBadge,
  PageLoading,
  RouteMap,
  unwrapApiData,
  getApiErrorMessage,
  SEO,
} from "@carpooling/common";
import {
  API_ENDPOINTS,
  BOOKING_STATUS,
  ROUTES,
} from "@/constants";
import { createChat } from "@/services/chatService";
import { sendPickupOtp, verifyPickupOtp } from "@/services/tripService";
import { useDriverTracking } from "@/context/DriverTrackingContext";

import { formatLocationName } from "@/lib/utils";
import type { Booking, Trip } from "@/types";
import {
  ChevronLeft,
  MapPin,
  Clock,
  Users,
  IndianRupee,
  Car,
  Hash,
  Loader2,
  Send,
  BadgeCheck,
  Clock3,
} from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";


const getTripById = async (id: string): Promise<Trip> => {
  const response = await api.get(API_ENDPOINTS.trip.details(id));
  return unwrapApiData<Trip>(response.data);
};

const updateBookingStatus = async ({
  bookingId,
  status,
}: {
  bookingId: string;
  status: string;
}) => {
  const res = await api.put(API_ENDPOINTS.booking.updateStatus(bookingId, status));
  return unwrapApiData(res.data);
};

const BookingStatusBadge = StatusBadge;

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [otpModalKey, setOtpModalKey] = useState(0);
  const [otpError, setOtpError] = useState("");
  const [otpCooldowns, setOtpCooldowns] = useState<Record<string, number>>({});

  useEffect(() => {
    const timer = window.setInterval(() => {
      setOtpCooldowns((current) => {
        let changed = false;
        const next = { ...current };
        for (const [bookingId, value] of Object.entries(current)) {
          if (value <= 1) {
            delete next[bookingId];
            changed = true;
          } else {
            next[bookingId] = value - 1;
            changed = true;
          }
        }
        return changed ? next : current;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const {
    data: trip,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["trip", id],
    queryFn: () => getTripById(id!),
  });

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: updateBookingStatus,
    onSuccess: (_, variables) => {
      if (variables.status === BOOKING_STATUS.accepted) {
        toast.success("Booking accepted! Passenger has been notified via email.");
      } else if (variables.status === BOOKING_STATUS.rejected) {
        toast.success("Booking rejected! Passenger has been notified via email.");
      } else {
        toast.success("Booking updated!");
      }
      queryClient.invalidateQueries({ queryKey: ["trip", id] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to update booking."));
    },
  });

  const { mutate: openChat, isPending: isOpeningChat } = useMutation({
    mutationFn: createChat,
    onSuccess: (chat) => {
      toast.success("Chat opened.");
      queryClient.invalidateQueries({ queryKey: ["trip", id] });
      navigate(ROUTES.driver.chatRoom(chat.id), { state: { chat } });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to open chat."));
    },
  });

  const { handleStartTrip, stopTracking } = useDriverTracking();
  const [isStartingTrip, setIsStartingTrip] = useState(false);
  const [isCompletingTrip, setIsCompletingTrip] = useState(false);

  const beginTrip = async (tripId: string) => {
    setIsStartingTrip(true);
    try {
      const ok = await handleStartTrip(tripId);
      if (ok) {
        queryClient.invalidateQueries({ queryKey: ["trip", id] });
      }
    } finally {
      setIsStartingTrip(false);
    }
  };

  const handleFinishTrip = async () => {
    setIsCompletingTrip(true);
    try {
      await stopTracking("COMPLETED");
      toast.success("Trip marked as completed! GPS tracking stopped.");
      queryClient.invalidateQueries({ queryKey: ["trip", id] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    } catch {
      toast.error("Failed to complete trip.");
    } finally {
      setIsCompletingTrip(false);
    }
  };

  const { mutate: dispatchOtp, isPending: isSendingOtp } = useMutation({
    mutationFn: ({
      bookingId,
    }: {
      bookingId: string;
    }) => sendPickupOtp(id!, bookingId),
    onSuccess: (_, variables) => {
      setOtpCooldowns((current) => ({ ...current, [variables.bookingId]: 60 }));
      toast.success("OTP sent to passenger's email. Ask them to check their inbox.");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to send OTP."));
    },
  });

  const { mutate: confirmOtp, isPending: isVerifyingOtp } = useMutation({
    mutationFn: ({ bookingId, otp }: { bookingId: string; otp: string }) =>
      verifyPickupOtp(id!, bookingId, otp),
    onSuccess: () => {
      toast.success("Passenger boarded successfully! ✅");
      setOtpError("");
      setSelectedBooking(null);
      setOtpModalKey((value) => value + 1);
      queryClient.invalidateQueries({ queryKey: ["trip", id] });
    },
    onError: (error: unknown) => {
      setOtpError(getApiErrorMessage(error, "Invalid or expired OTP."));
      setOtpModalKey((value) => value + 1);
    },
  });

  const acceptedBookings = trip?.bookings?.filter(
    (booking) => booking.status === BOOKING_STATUS.accepted
  ) ?? [];
  const boardedCount = acceptedBookings.filter((booking) => booking.boarded).length;

  if (isLoading) return <PageLoading message="Loading live trip details..." />;

  if (isError || !trip) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-bold text-destructive text-base">
          {isError ? "Failed to load trip" : "Trip not found"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          The requested trip may have been removed or is unavailable.
        </p>
        <Button
          variant="outline"
          className="mt-4 rounded-xl font-semibold"
          onClick={() => navigate(ROUTES.driver.trips)}
        >
          Back to Trips
        </Button>
      </div>
    );
  }

  const toLocationResult = (
    loc: any
  ): { name: string; lat: number | string; lon: number | string } | null => {
    if (!loc) return null;
    if (typeof loc === "object" && loc.lat != null && loc.lon != null) {
      return {
        name: loc.name || "Location",
        lat: loc.lat,
        lon: loc.lon,
      };
    }
    return null;
  };

  const originLocation = toLocationResult(trip.origin);
  const destLocation = toLocationResult(
    trip.destinationLocation ?? trip.destination
  );
  const pickupLocations = (trip.pickupLocations ?? [])
    .map(toLocationResult)
    .filter(
      (
        l
      ): l is { name: string; lat: number | string; lon: number | string } =>
        l !== null
    );

  return (
    <div className="mx-auto max-w-5xl py-4 sm:py-6 space-y-6">
      <SEO
        title={`${formatLocationName(trip.origin)} to ${formatLocationName(trip.destinationLocation ?? trip.destination)}`}
        description={`Trip details, route map, and passenger boarding for ride from ${formatLocationName(trip.origin)} to ${formatLocationName(trip.destinationLocation ?? trip.destination)}.`}
      />
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              onClick={() =>
                navigate(ROUTES.driver.trips, { state: { showHistory: true } })
              }
              className="cursor-pointer text-xs font-medium"
            >
              Trips History
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-xs font-semibold">Trip Detail</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono font-medium text-foreground/80 mb-2">
            <span>DRIVER DISPATCH TELEMETRY</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-border"
              onClick={() =>
                navigate(ROUTES.driver.trips, { state: { showHistory: true } })
              }
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display">
              {formatLocationName(trip.origin)} →{" "}
              {formatLocationName(trip.destinationLocation ?? trip.destination)}
            </h1>
          </div>
        </div>
        <StatusBadge status={trip.status} />
      </div>

      <Card className="rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-xs">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Trip status
            </p>
            <p className="text-lg font-semibold">{trip.status}</p>
            <p className="text-sm text-muted-foreground">
              {acceptedBookings.length} accepted booking
              {acceptedBookings.length === 1 ? "" : "s"} · {boardedCount}/
              {acceptedBookings.length} boarded
            </p>
          </div>

          {trip.status === "SCHEDULED" && (
            <Button
              onClick={() => beginTrip(trip.id)}
              disabled={isStartingTrip}
              className="gap-2 rounded-xl font-semibold shadow-xs"
            >
              {isStartingTrip ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting trip...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Start Trip
                </>
              )}
            </Button>
          )}

          {trip.status === "ONGOING" && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="rounded-xl border border-black/10 dark:border-white/10 bg-muted/40 px-4 py-3 text-sm text-muted-foreground flex-1">
                {acceptedBookings.length > 0 && boardedCount === acceptedBookings.length
                  ? "All passengers boarded."
                  : "Send OTP to each passenger and verify it when they board."}
              </div>
              <Button
                variant="destructive"
                onClick={handleFinishTrip}
                disabled={isCompletingTrip}
                className="gap-2 shrink-0 rounded-xl font-semibold shadow-xs"
              >
                {isCompletingTrip ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <BadgeCheck className="h-4 w-4" />
                    Complete Trip
                  </>
                )}
              </Button>
            </div>
          )}

          {trip.status === "COMPLETED" && (
            <div className="rounded-xl border border-black/10 dark:border-white/10 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              Trip completed.
            </div>
          )}

          {trip.status === "CANCELLED" && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Trip cancelled.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Route Map Preview */}
      {originLocation && destLocation && (
        <Card className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Live Route Preview
              </span>
              <span className="text-xs text-muted-foreground font-normal">
                {formatLocationName(trip.origin)} →{" "}
                {formatLocationName(
                  trip.destinationLocation ?? trip.destination
                )}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <RouteMap
              origin={originLocation}
              destination={destLocation}
              pickupPoints={pickupLocations}
              height="350px"
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Trip Info */}
        <Card className="rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Trip Info
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Trip Code</p>
              <p className="font-medium">{trip.tripcode}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Departure</p>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <p className="font-medium">
                  {new Date(trip.departureTime).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">End Time</p>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <p className="font-medium">
                  {new Date(trip.endTime).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Price</p>
              <div className="flex items-center gap-1.5">
                <IndianRupee className="h-4 w-4" />
                <p className="font-medium">{trip.pricePerKm ?? trip.price}</p>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Available Seats</p>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <p className="font-medium">{trip.availableSeats}</p>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Pickup Locations</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {trip.pickupLocations.map((loc, index) => (
                  <span
                    key={`${formatLocationName(loc)}-${index}`}
                    className="rounded-xl border border-black/10 dark:border-white/10 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                  >
                    {formatLocationName(loc)}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Car Info */}
        <Card className="rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Car Info
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Vehicle</p>
              <p className="font-semibold text-foreground">
              {trip.car
                ? `${trip.car.make} ${trip.car.model} (${trip.car.year})`
                : "Car Info"}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Color</p>
              <p className="font-medium capitalize">{trip.car?.color || "Not available"}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">License Plate</p>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <p className="font-mono font-bold text-foreground">
                  {trip.car?.licensePlate || "Not available"}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Seater</p>
              <p className="font-medium">{trip.car?.seater || "Not available"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Bookings */}
        <Card className="rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-xs md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Bookings ({trip.bookings?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {trip.bookings?.length === 0 ? (
              <p className="text-muted-foreground">No bookings yet.</p>
            ) : (
              trip.bookings?.map((booking: Booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-black/10 dark:border-white/10 p-4 hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <p className="font-bold text-foreground">{booking.passenger?.name}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{booking.passenger?.email}</span>
                      {booking.passenger?.phone && <span>• {booking.passenger?.phone}</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs mt-2 text-muted-foreground">
                      <span>
                        Pickup:{" "}
                        <strong className="text-foreground">
                          {formatLocationName(booking.pickupLocation)}
                        </strong>
                      </span>
                      <span>→</span>
                      <span>
                        Dropoff:{" "}
                        <strong className="text-foreground">
                          {formatLocationName(booking.dropoffLocation)}
                        </strong>
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-foreground">{(booking.seatBooked ?? (booking as any).seats ?? (booking as any).seatCount ?? 1)} seat(s)</span>
                      <span>•</span>
                      <span className="font-bold text-foreground">₹{(Number(booking.price) || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2 shrink-0">
                    <BookingStatusBadge status={booking.status} />
                    {trip.status === "ONGOING" && booking.status === BOOKING_STATUS.accepted && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold ${
                          booking.boarded
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {booking.boarded ? (
                          <>
                            <BadgeCheck className="h-3.5 w-3.5" />
                            Boarded
                          </>
                        ) : (
                          <>
                            <Clock3 className="h-3.5 w-3.5" />
                            Not boarded
                          </>
                        )}
                      </span>
                    )}
                    {booking.status === BOOKING_STATUS.pending && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="rounded-xl shadow-xs"
                          disabled={isPending}
                          onClick={() =>
                            updateStatus({
                              bookingId: booking.id,
                              status: BOOKING_STATUS.accepted,
                            })
                          }
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-xl shadow-xs"
                          disabled={isPending}
                          onClick={() =>
                            updateStatus({
                              bookingId: booking.id,
                              status: BOOKING_STATUS.rejected,
                            })
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    {trip.status === "ONGOING" &&
                      booking.status === BOOKING_STATUS.accepted &&
                      !booking.boarded && (
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl border-border"
                            disabled={isSendingOtp || Boolean(otpCooldowns[booking.id])}
                            onClick={() =>
                              dispatchOtp({ bookingId: booking.id })
                            }
                          >
                            <Send className="h-4 w-4 mr-1" />
                            {otpCooldowns[booking.id]
                              ? `Resend in ${otpCooldowns[booking.id]}s`
                              : "Send OTP"}
                          </Button>
                          <Button
                            size="sm"
                            className="rounded-xl shadow-xs"
                            disabled={isOpeningChat}
                            onClick={() => {
                              setOtpError("");
                              setSelectedBooking(booking);
                              setOtpModalKey((value) => value + 1);
                            }}
                          >
                            Enter OTP
                          </Button>
                        </div>
                      )}
                    {booking.status === BOOKING_STATUS.accepted && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-border hover:bg-accent"
                        disabled={isOpeningChat}
                        onClick={() => openChat(booking.id)}
                      >
                        Message
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={Boolean(selectedBooking)}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setSelectedBooking(null);
            setOtpError("");
            setOtpModalKey((value) => value + 1);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-display text-foreground">Verify boarding OTP</DialogTitle>
            <DialogDescription>
              Ask {selectedBooking?.passenger?.name || "the passenger"} to read the
              6-digit code from their email. Never show the OTP on screen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-black/10 dark:border-white/10 bg-muted/40 p-4 text-sm">
              <p className="font-semibold text-foreground">Passenger</p>
              <p className="text-muted-foreground">{selectedBooking?.passenger?.email}</p>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-foreground">Enter OTP</p>
              <OtpInput
                key={otpModalKey}
                length={6}
                disabled={isVerifyingOtp}
                onComplete={(otp) => {
                  if (!selectedBooking) return;
                  confirmOtp({ bookingId: selectedBooking.id, otp });
                }}
              />
              <p className="text-xs text-muted-foreground">
                Invalid or expired codes can be resent from the passenger row.
              </p>
            </div>

            {otpError && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {otpError}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-xl border-border"
              onClick={() => {
                setSelectedBooking(null);
                setOtpError("");
                setOtpModalKey((value) => value + 1);
              }}
              disabled={isVerifyingOtp}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl shadow-xs"
              onClick={() => {
                if (!selectedBooking) return;
                const otpInput = document.querySelector<HTMLInputElement>(
                  '[autocomplete="one-time-code"]'
                );
                otpInput?.focus();
              }}
              variant="secondary"
            >
              Focus OTP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
