import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "@/services/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  StatusBadge,
  PageLoading,
  unwrapApiData,
  unwrapApiListData,
  getApiErrorMessage,
  SEO,
} from "@carpooling/common";
import { API_ENDPOINTS, BOOKING_STATUS, ROUTES } from "@/constants";
import { createChat } from "@/services/chatService";
import { formatLocationName } from "@/lib/utils";
import type { Booking, Trip } from "@/types";
import {
  Users,
  MapPin,
  Phone,
  Mail,
  Check,
  X,
  MessageCircle,
  CalendarCheck,
} from "lucide-react";

const getMyBookings = async (): Promise<Booking[]> => {
  try {
    const res = await api.get(API_ENDPOINTS.booking.list);
    const data = unwrapApiListData<Booking>(res.data);
    if (Array.isArray(data) && data.length > 0) return data;
  } catch (err: any) {
    if (err?.response?.status !== 404) {
      console.warn("Direct booking endpoint error:", err);
    }
  }

  // Fallback: On the backend, driver bookings are linked to the driver's trips (/api/trip)
  try {
    const tripsRes = await api.get(API_ENDPOINTS.trip.list);
    const trips = unwrapApiListData<Trip>(tripsRes.data);
    const allBookings: Booking[] = [];
    trips.forEach((trip) => {
      if (Array.isArray(trip.bookings)) {
        trip.bookings.forEach((b) => {
          allBookings.push({
            ...b,
            trip: b.trip || trip,
          });
        });
      }
    });
    return allBookings;
  } catch (tripErr) {
    console.error("Failed to load driver bookings from trips:", tripErr);
    return [];
  }
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

export default function Bookings() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: bookings = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["driver-bookings"],
    queryFn: getMyBookings,
  });

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: updateBookingStatus,
    onSuccess: (_, variables) => {
      if (variables.status === BOOKING_STATUS.accepted) {
        toast.success("Booking accepted! Passenger has been notified.");
      } else if (variables.status === BOOKING_STATUS.rejected) {
        toast.success("Booking rejected.");
      } else {
        toast.success("Booking status updated!");
      }
      queryClient.invalidateQueries({ queryKey: ["driver-bookings"] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to update booking."));
    },
  });

  const { mutate: openChat, isPending: isOpeningChat } = useMutation({
    mutationFn: createChat,
    onSuccess: (chat) => {
      toast.success("Chat opened.");
      queryClient.invalidateQueries({ queryKey: ["driver-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      navigate(ROUTES.driver.chatRoom(chat.id), { state: { chat } });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to open chat."));
    },
  });

  if (isLoading) return <PageLoading message="Loading booking requests..." />;

  if (isError) {
    return <p className="text-destructive font-medium">Failed to load bookings.</p>;
  }

  const pendingBookings = bookings.filter(
    (b) => b.status === BOOKING_STATUS.pending
  );
  const otherBookings = bookings.filter(
    (b) => b.status !== BOOKING_STATUS.pending
  );

  return (
    <div className="space-y-8">
      <SEO
        title="Booking Requests"
        description="Review and manage passenger booking requests, seat confirmations, and trip reservations."
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono font-medium text-foreground/80 mb-2">
            <span>DRIVER RESERVATIONS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Booking Requests
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Review passenger reservation requests and manage seat confirmations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-xs">
            {bookings.length} Total Bookings
          </span>
        </div>
      </div>

      {/* Pending Requests Section */}
      {pendingBookings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-amber-500/10 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {pendingBookings.length}
            </span>
            <h2 className="text-lg font-bold text-foreground">
              Action Required ({pendingBookings.length} Pending)
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {pendingBookings.map((booking) => (
              <Card
                key={booking.id}
                className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-xs hover:border-foreground/20 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 dark:border-white/15 bg-primary/10 text-sm font-bold text-primary">
                        {booking.passenger?.name?.charAt(0)?.toUpperCase() || "P"}
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-foreground">
                          {booking.passenger?.name || "Passenger"}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {booking.seatBooked ?? (booking as any).seats ?? (booking as any).seatCount ?? 1} seat(s) • ₹{(Number(booking.price) || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {/* Route Timeline */}
                  <div className="rounded-xl bg-muted/50 p-3 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">Pickup:</span>
                      <strong className="text-foreground truncate">
                        {formatLocationName(booking.pickupLocation)}
                      </strong>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">Dropoff:</span>
                      <strong className="text-foreground truncate">
                        {formatLocationName(booking.dropoffLocation)}
                      </strong>
                    </div>
                  </div>

                  {/* Contact Chips */}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {booking.passenger?.phone && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 dark:border-white/10 px-2.5 py-1 bg-black/[0.02] dark:bg-white/[0.04]">
                        <Phone className="h-3 w-3 text-primary" />
                        {booking.passenger.phone}
                      </span>
                    )}
                    {booking.passenger?.email && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 dark:border-white/10 px-2.5 py-1 bg-black/[0.02] dark:bg-white/[0.04] truncate max-w-[200px]">
                        <Mail className="h-3 w-3 text-primary" />
                        {booking.passenger.email}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2.5 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5 rounded-xl font-semibold shadow-xs"
                      disabled={isPending}
                      onClick={() =>
                        updateStatus({
                          bookingId: booking.id,
                          status: BOOKING_STATUS.accepted,
                        })
                      }
                    >
                      <Check className="h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 gap-1.5 rounded-xl font-semibold shadow-xs"
                      disabled={isPending}
                      onClick={() =>
                        updateStatus({
                          bookingId: booking.id,
                          status: BOOKING_STATUS.rejected,
                        })
                      }
                    >
                      <X className="h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All / Past Bookings */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">
          {pendingBookings.length > 0 ? "Past & Confirmed Bookings" : "All Bookings"}
        </h2>

        {otherBookings.length === 0 && pendingBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 dark:border-white/15 bg-black/[0.01] dark:bg-white/[0.02] py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 dark:border-white/10 bg-muted/60 text-muted-foreground mb-3">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <p className="font-bold text-foreground">No bookings recorded yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              When passengers book seats on your published trips, they will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherBookings.map((booking) => (
              <Card
                key={booking.id}
                className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-xs hover:border-foreground/20 hover:shadow-md transition-all"
              >
                <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-foreground text-sm truncate">
                        {booking.passenger?.name || "Passenger"}
                      </p>
                      <StatusBadge status={booking.status} />
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="truncate">
                        {formatLocationName(booking.pickupLocation)} →{" "}
                        {formatLocationName(booking.dropoffLocation)}
                      </p>
                      <div className="flex items-center gap-3 pt-1">
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <Users className="h-3 w-3" />
                          {booking.seatBooked ?? (booking as any).seats ?? (booking as any).seatCount ?? 1} seat(s)
                        </span>
                        <span>•</span>
                        <span className="font-bold text-foreground">₹{(Number(booking.price) || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {booking.status === BOOKING_STATUS.accepted && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-1.5 rounded-xl border-border font-semibold hover:bg-accent"
                      disabled={isOpeningChat}
                      onClick={() => openChat(booking.id)}
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-primary" />
                      Chat with Passenger
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
