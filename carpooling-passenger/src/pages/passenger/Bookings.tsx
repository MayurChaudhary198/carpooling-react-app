import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  BookOpen,
  CreditCard,
  Loader2,
  MessageCircle,
  RefreshCcw,
  X,
  ShieldCheck,
  Clock3,
  Navigation,
  Search,
  ArrowUpDown,
  RotateCcw,
  Calendar,
  CheckCircle2,
  XCircle,
  Filter,
  ArrowRight,
} from "lucide-react";
import LiveTripTrackingModal from "@/components/common/LiveTripTrackingModal";
import StatusBadge from "@/components/common/StatusBadge";
import { format } from "date-fns";
import api from "@/services/api";
import {
  getPassengerBookings,
  getPaymentDetails,
  refundPayment,
} from "@/services/passengerService";
import { createChat } from "@/services/chatService";
import { formatLocationName } from "@/lib/locations";
import { getApiErrorMessage } from "@/lib/errors";
import type { Booking, PaymentDetails } from "@/types";
import { SEO } from "@carpooling/common";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRazorpayPayment } from "@/hooks/useRazorpayPayment";

const cancelBooking = async (id: string) => {
  const res = await api.put(`/passenger/bookings/${id}/cancel`);
  return res.data;
};

const STATUS_COPY: Record<Booking["status"], string> = {
  PENDING: "Waiting for driver confirmation",
  ACCEPTED: "Booking confirmed!",
  REJECTED: "Booking rejected",
  CANCELLED: "Booking cancelled",
  COMPLETED: "Trip completed!",
};

function PaymentStatusCard({ booking }: { booking: Booking }) {
  const queryClient = useQueryClient();
  const [refundTarget, setRefundTarget] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const { payNow, isLoadingSdk, isProcessing } = useRazorpayPayment({
    onVerified: async () => {
      setPaymentNotice(null);
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
      await queryClient.invalidateQueries({ queryKey: ["payment", booking.id] });
    },
    onDismiss: () => {
      setPaymentNotice("Payment window was closed. You can try again anytime.");
    },
    onError: (message) => {
      setPaymentNotice(message);
    },
  });

  const {
    data: payment,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["payment", booking.id],
    queryFn: () => getPaymentDetails(booking.id),
    enabled: booking.paymentMode === "ADVANCE",
  });

  const refundMutation = useMutation({
    mutationFn: () => refundPayment(booking.id),
    onSuccess: async (data) => {
      toast.success(data.message || "Refund initiated.");
      setRefundTarget(false);
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
      await queryClient.invalidateQueries({ queryKey: ["payment", booking.id] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to refund payment."));
    },
  });

  const paymentStatus: PaymentDetails["status"] =
    payment?.status ?? booking.paymentStatus ?? "PENDING";

  const paymentStatusBadgeVariant =
    paymentStatus === "PAID"
      ? "default"
      : paymentStatus === "REFUNDED"
      ? "secondary"
      : paymentStatus === "PARTIALLY_REFUNDED"
      ? "outline"
      : paymentStatus === "FAILED"
      ? "destructive"
      : "outline";

  if (booking.paymentMode !== "ADVANCE") {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.03] p-3.5 text-xs text-muted-foreground flex items-center gap-2">
        <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span>Cash on Delivery selected. Pay cash to the driver at pickup.</span>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] p-4 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Advance Payment</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              ₹{(booking.paymentAmount ?? booking.price).toLocaleString()}
              {booking.paymentCurrency ? ` · ${booking.paymentCurrency}` : ""}
            </p>
          </div>
          <Badge variant={paymentStatusBadgeVariant}>{paymentStatus}</Badge>
        </div>

        {isLoading ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground" />
            Loading payment details...
          </div>
        ) : isError ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
            <span>Failed to load payment details.</span>
            <Button size="sm" variant="outline" onClick={() => refetch()} className="h-7 text-xs rounded-lg">
              Retry
            </Button>
          </div>
        ) : null}

        {paymentNotice && (
          <div className="mt-3 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-300">
            <div className="flex items-start justify-between gap-3">
              <p>{paymentNotice}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => payNow(booking.id)}
                disabled={isLoadingSdk || isProcessing}
                className="h-7 text-xs rounded-lg border-amber-300 dark:border-amber-700"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {booking.status === "ACCEPTED" && paymentStatus !== "PAID" && (
            <Button
              size="sm"
              onClick={() => payNow(booking.id)}
              disabled={isLoadingSdk || isProcessing}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs shadow-sm"
            >
              {isLoadingSdk || isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Opening checkout...
                </>
              ) : (
                <>
                  <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                  Pay now
                </>
              )}
            </Button>
          )}
          {paymentStatus === "PAID" && booking.status === "CANCELLED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefundTarget(true)}
              className="rounded-xl border-black/15 dark:border-white/20 text-xs"
            >
              <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
              Request refund
            </Button>
          )}
        </div>

        {payment?.refundId && (
          <p className="mt-3 text-[11px] text-muted-foreground">Refund ID: {payment.refundId}</p>
        )}
      </div>

      <Dialog open={refundTarget} onOpenChange={setRefundTarget}>
        <DialogContent className="max-w-sm rounded-2xl border-black/10 dark:border-white/15 bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Refund payment?</DialogTitle>
            <DialogDescription>
              This will request a refund for booking {booking.id}. Confirm only if the trip
              allows it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRefundTarget(false)}
              disabled={refundMutation.isPending}
              className="rounded-xl"
            >
              Keep payment
            </Button>
            <Button
              variant="destructive"
              onClick={() => refundMutation.mutate()}
              disabled={refundMutation.isPending}
              className="rounded-xl"
            >
              {refundMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Refunding...
                </>
              ) : (
                "Confirm refund"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Bookings() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [trackingBooking, setTrackingBooking] = useState<Booking | null>(null);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("newest");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: getPassengerBookings,
  });

  const { mutate: cancel, isPending: isCancelling } = useMutation({
    mutationFn: cancelBooking,
    onSuccess: async () => {
      toast.success("Booking cancelled.");
      setCancelTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to cancel booking."));
    },
  });

  const { mutate: openChat, isPending: isOpeningChat } = useMutation({
    mutationFn: createChat,
    onSuccess: (chat) => {
      toast.success("Chat opened.");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      navigate(`/passenger/chat/${chat.id}`, { state: { chat } });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to open chat."));
    },
  });

  const summary = {
    total: bookings.length,
    active: bookings.filter((booking) => ["PENDING", "ACCEPTED"].includes(booking.status)).length,
    completed: bookings.filter((booking) => booking.status === "COMPLETED").length,
    cancelled: bookings.filter((booking) => booking.status === "CANCELLED").length,
  };

  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
  const acceptedCount = bookings.filter((b) => b.status === "ACCEPTED").length;
  const isFiltered =
    statusFilter !== "ALL" ||
    searchQuery.trim() !== "" ||
    paymentFilter !== "ALL" ||
    sortBy !== "newest";

  const resetFilters = () => {
    setStatusFilter("ALL");
    setSearchQuery("");
    setPaymentFilter("ALL");
    setSortBy("newest");
  };

  const filteredBookings = useMemo(() => {
    return bookings
      .filter((booking) => {
        // Status filter
        if (statusFilter === "ACTIVE") {
          if (!["PENDING", "ACCEPTED"].includes(booking.status)) return false;
        } else if (statusFilter !== "ALL") {
          if (booking.status !== statusFilter) return false;
        }

        // Payment mode filter
        if (paymentFilter !== "ALL") {
          const mode = booking.paymentMode || "COD";
          if (mode !== paymentFilter) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const pickup = formatLocationName(booking.pickupLocation).toLowerCase();
          const dropoff = formatLocationName(booking.dropoffLocation).toLowerCase();
          const id = (booking.id || "").toLowerCase();
          const driver = (
            (booking.ride as any)?.driver?.name ||
            (booking as any)?.driver?.name ||
            ""
          ).toLowerCase();
          const passenger = (booking.passengerName || "").toLowerCase();

          const matches =
            pickup.includes(q) ||
            dropoff.includes(q) ||
            id.includes(q) ||
            driver.includes(q) ||
            passenger.includes(q);

          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "price_high") {
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        }
        if (sortBy === "price_low") {
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        }
        return 0;
      });
  }, [bookings, statusFilter, paymentFilter, searchQuery, sortBy]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-3.5 py-4 sm:px-6 sm:py-8 md:px-8">
      <SEO
        title="My Bookings"
        description="Track your reserved carpooling trips, boarding OTPs, payment status, and driver details."
      />

      {/* Header Hero Card */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 bg-card dark:bg-[#111216] p-4 sm:p-6 md:p-8 shadow-xs dark:shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/20 to-transparent" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono font-medium text-foreground/80">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>COMMUTE DISPATCH LOG</span>
            </div>
            <h1 className="mt-3 sm:mt-4 font-display text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              My Bookings
            </h1>
            <p className="mt-1.5 sm:mt-2.5 max-w-2xl text-xs sm:text-base text-muted-foreground leading-relaxed">
              Track request status, driver confirmations, boarding OTPs, and ride tracking in real time.
            </p>
          </div>

          <Button
            onClick={() => navigate("/passenger/search")}
            className="w-full sm:w-auto rounded-xl bg-primary text-primary-foreground font-semibold px-4 sm:px-5 py-2.5 text-xs sm:text-sm shadow-xs hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Search className="h-4 w-4 mr-1.5" />
            Book a new ride
          </Button>
        </div>
      </div>

      {/* 4 Interactive Stat Cards (Click to Filter) */}
      <div className="mt-5 sm:mt-6 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {[
          {
            label: "Total Bookings",
            filterKey: "ALL",
            value: summary.total,
            icon: BookOpen,
            subtext: "All ride requests",
          },
          {
            label: "Active Rides",
            filterKey: "ACTIVE",
            value: summary.active,
            icon: Clock3,
            subtext: "Pending & confirmed",
          },
          {
            label: "Completed",
            filterKey: "COMPLETED",
            value: summary.completed,
            icon: ShieldCheck,
            subtext: "Fulfilled trips",
          },
          {
            label: "Cancelled",
            filterKey: "CANCELLED",
            value: summary.cancelled,
            icon: XCircle,
            subtext: "Cancelled bookings",
          },
        ].map(({ label, filterKey, value, icon: Icon, subtext }) => {
          const isSelected = statusFilter === filterKey;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setStatusFilter(isSelected && filterKey !== "ALL" ? "ALL" : filterKey)}
              className={`relative overflow-hidden rounded-xl sm:rounded-2xl border text-left p-3.5 sm:p-4.5 transition-all duration-200 group cursor-pointer ${
                isSelected
                  ? "border-primary dark:border-white bg-black/[0.04] dark:bg-white/[0.08] shadow-xs"
                  : "border-black/10 dark:border-white/10 bg-card dark:bg-[#111216] shadow-xs hover:border-black/20 dark:hover:border-white/20"
              }`}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/15 to-transparent" />

              <div className="relative z-10 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] text-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-mono font-medium uppercase tracking-wider text-muted-foreground truncate">
                      {label}
                    </p>
                    <p className="mt-0.5 font-mono text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground truncate">
                      {value}
                    </p>
                  </div>
                </div>

                {isSelected ? (
                  <span className="shrink-0 rounded-md bg-primary text-primary-foreground px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider">
                    Filtered
                  </span>
                ) : (
                  <span className="hidden sm:inline-block shrink-0 rounded-md border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                    Filter
                  </span>
                )}
              </div>

              <div className="mt-2.5 sm:mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground">
                <span className="truncate">{subtext}</span>
                <span className="text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center gap-1">
                  Filter <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Comprehensive Filter & Search Bar */}
      <div className="mt-5 sm:mt-6 relative overflow-hidden rounded-xl sm:rounded-2xl border border-black/10 dark:border-white/10 bg-gradient-to-br from-card via-card/95 to-card/90 dark:from-white/[0.08] dark:via-white/[0.03] dark:to-transparent p-3.5 sm:p-4 md:p-5 backdrop-blur-xl shadow-md dark:shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.14)] space-y-3 sm:space-y-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/20 to-transparent" />

        {/* Top Filter Controls: Search, Payment Mode, Sort, and Reset */}
        <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pickup, destination, driver, or ID..."
              className="pl-9 pr-8 rounded-xl border-black/10 dark:border-white/15 bg-card/60 dark:bg-white/[0.04] text-xs sm:text-sm h-9 sm:h-10 font-medium placeholder:text-muted-foreground/60"
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

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5 w-full sm:w-auto">
            {/* Payment Filter */}
            <div className="flex items-center gap-1.5 min-w-0">
              <CreditCard className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:inline-block" />
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="h-9 sm:h-10 w-full sm:w-[145px] rounded-xl border-black/10 dark:border-white/15 bg-card/60 dark:bg-white/[0.04] text-xs font-semibold">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Payments</SelectItem>
                  <SelectItem value="COD">Cash on Delivery</SelectItem>
                  <SelectItem value="ADVANCE">Online Advance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-1.5 min-w-0">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:inline-block" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9 sm:h-10 w-full sm:w-[145px] rounded-xl border-black/10 dark:border-white/15 bg-card/60 dark:bg-white/[0.04] text-xs font-semibold">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters Button */}
            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="col-span-2 sm:col-span-1 h-9 sm:h-10 rounded-xl border-black/15 dark:border-white/20 bg-card/60 dark:bg-white/[0.05] text-xs font-semibold gap-1.5 hover:bg-muted dark:hover:bg-white/10"
              >
                <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Bottom Row: Quick Status Tabs & Results Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-black/5 dark:border-white/5">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            {[
              { key: "ALL", label: "All", count: summary.total },
              { key: "ACTIVE", label: "Active", count: summary.active },
              { key: "ACCEPTED", label: "Confirmed", count: acceptedCount },
              { key: "PENDING", label: "Pending", count: pendingCount },
              { key: "COMPLETED", label: "Completed", count: summary.completed },
              { key: "CANCELLED", label: "Cancelled", count: summary.cancelled },
            ].map(({ key, label, count }) => {
              const isActive = statusFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs font-medium text-muted-foreground shrink-0">
            Showing <span className="font-bold text-foreground">{filteredBookings.length}</span> of{" "}
            <span className="font-bold text-foreground">{bookings.length}</span> bookings
          </div>
        </div>
      </div>

      {/* Bookings List Content */}
      {filteredBookings.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.03] p-12 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-black/10 dark:border-white/15 bg-black/[0.03] dark:bg-white/[0.08]">
            <Filter className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-display text-lg font-bold text-foreground">
            {bookings.length === 0 ? "No bookings found" : "No bookings match your filter criteria"}
          </p>
          <p className="mt-1.5 max-w-sm mx-auto text-xs text-muted-foreground">
            {bookings.length === 0
              ? "Start by exploring available rides and reserving your seat."
              : "Try adjusting your search query, status tab, or payment mode filter."}
          </p>
          {isFiltered && bookings.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="mt-4 rounded-xl border-black/15 dark:border-white/20 bg-card/60 dark:bg-white/[0.05]"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset all filters
            </Button>
          ) : (
            <Button
              className="mt-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-sm"
              onClick={() => navigate("/passenger/search")}
            >
              Search trips
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-5 sm:mt-6 space-y-3.5 sm:space-y-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 bg-gradient-to-br from-card via-card/95 to-card/90 dark:from-white/[0.08] dark:via-white/[0.03] dark:to-transparent p-4 sm:p-5 md:p-6 backdrop-blur-xl shadow-md dark:shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.14)] space-y-3.5 sm:space-y-4 transition-all duration-300 hover:border-black/20 dark:hover:border-white/25 hover:shadow-lg"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/20 to-transparent" />

              <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
                    <StatusBadge status={booking.status} />
                    <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground font-mono">
                      #{booking.id?.slice(-8) || "BOOKING"}
                    </span>
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                    {STATUS_COPY[booking.status] || "Booking details"}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-foreground" />
                    {format(new Date(booking.createdAt), "dd MMM yyyy · h:mm a")}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-display text-xl sm:text-2xl font-extrabold text-foreground">
                    ₹{(Number(booking.price) || 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {booking.paymentMode || "COD"}
                  </p>
                </div>
              </div>

              {/* Connected Route & Trip Details Grid */}
              <div className="grid gap-3 sm:gap-3.5 md:grid-cols-[1.2fr_0.8fr]">
                {/* Route Visual Path */}
                <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] p-3.5 sm:p-4 backdrop-blur-md">
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2.5 sm:mb-3">
                    Travel Route
                  </p>
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
                    <div className="flex-1 min-w-0 space-y-2.5">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pickup</p>
                        <p className="text-sm font-semibold text-foreground line-clamp-1" title={formatLocationName(booking.pickupLocation)}>
                          {formatLocationName(booking.pickupLocation)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dropoff</p>
                        <p className="text-sm font-semibold text-foreground line-clamp-1" title={formatLocationName(booking.dropoffLocation)}>
                          {formatLocationName(booking.dropoffLocation)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trip Details Ticket */}
                <div className="relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] p-4 backdrop-blur-md flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2.5">
                      Booking Summary
                    </p>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Reserved Seats:</span>
                        <span className="font-semibold text-foreground">
                          {(booking as any).seatBooked ?? booking.seats ?? (booking as any).seatCount ?? 1} seat
                          {((booking as any).seatBooked ?? booking.seats ?? (booking as any).seatCount ?? 1) > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Payment Preference:</span>
                        <span className="font-semibold text-foreground">
                          {booking.paymentMode === "ADVANCE" ? "Online Advance" : "Cash on Delivery"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Passenger Name:</span>
                        <span className="font-semibold text-foreground truncate max-w-[150px]">
                          {booking.passengerName || "You"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {((booking.ride as any)?.driver?.name || (booking as any)?.driver?.name) && (
                    <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 flex items-center gap-2 text-xs">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                        {((booking.ride as any)?.driver?.name || (booking as any)?.driver?.name || "D").charAt(0)}
                      </div>
                      <span className="text-muted-foreground">Driver:</span>
                      <span className="font-semibold text-foreground">
                        {(booking.ride as any)?.driver?.name || (booking as any)?.driver?.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <PaymentStatusCard booking={booking} />

              {/* Action Buttons Row */}
              {booking.status === "PENDING" && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelTarget(booking)}
                    className="rounded-xl border-black/10 dark:border-white/15 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 font-medium"
                  >
                    <X className="mr-1.5 h-4 w-4" />
                    Cancel booking
                  </Button>
                </div>
              )}

              {booking.status === "ACCEPTED" && (
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-2.5 pt-1">
                  <Button
                    size="sm"
                    onClick={() => setTrackingBooking(booking)}
                    className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm text-xs sm:text-sm h-9 sm:h-10"
                  >
                    <Navigation className="mr-1.5 h-3.5 w-3.5" />
                    Live Tracking
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isOpeningChat}
                    onClick={() => openChat(booking.id)}
                    className="rounded-xl border-black/15 dark:border-white/20 bg-card/60 dark:bg-white/[0.05] font-medium text-xs sm:text-sm h-9 sm:h-10"
                  >
                    <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                    Message driver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelTarget(booking)}
                    className="col-span-2 sm:col-span-1 rounded-xl border-black/10 dark:border-white/15 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 font-medium text-xs sm:text-sm h-9 sm:h-10"
                  >
                    <X className="mr-1.5 h-4 w-4" />
                    Cancel booking
                  </Button>
                </div>
              )}

              {booking.status === "REJECTED" && (
                <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.03] p-4 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
                  <span>Booking was rejected by driver. Search another ride to continue your journey.</span>
                  <Button
                    size="sm"
                    className="rounded-xl bg-primary text-primary-foreground font-semibold text-xs"
                    onClick={() => navigate("/passenger/search")}
                  >
                    Search other trips
                  </Button>
                </div>
              )}

              {booking.status === "COMPLETED" && (
                <div className="rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/5 p-4 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Trip completed safely! Thank you for traveling with RideShare.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={!!cancelTarget}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
      >
        <DialogContent className="max-w-sm rounded-2xl border-black/10 dark:border-white/15 bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Cancel booking?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This booking will be marked as cancelled and any eligible refund will follow system policy.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelTarget(null)}
              disabled={isCancelling}
              className="rounded-xl"
            >
              Keep booking
            </Button>
            <Button
              variant="destructive"
              disabled={isCancelling}
              className="rounded-xl"
              onClick={() => cancelTarget && cancel(cancelTarget.id)}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Cancelling...
                </>
              ) : (
                "Confirm cancel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Live Trip Tracking Modal */}
      <LiveTripTrackingModal
        isOpen={Boolean(trackingBooking)}
        onClose={() => setTrackingBooking(null)}
        tripId={
          trackingBooking
            ? trackingBooking.tripId ||
              (trackingBooking.ride as any)?.id ||
              (trackingBooking as any)?.trip?._id ||
              (trackingBooking as any)?.trip?.id ||
              ""
            : null
        }
        tripcode={
          (trackingBooking?.ride as any)?.tripcode ||
          (trackingBooking as any)?.trip?.tripcode
        }
        pickupLocation={{
          name:
            typeof trackingBooking?.pickupLocation === "object"
              ? (trackingBooking.pickupLocation as any)?.name || ""
              : typeof trackingBooking?.pickupLocation === "string"
              ? trackingBooking.pickupLocation
              : (trackingBooking?.ride as any)?.origin?.name || "Pickup",
          lat:
            (typeof trackingBooking?.pickupLocation === "object" &&
              (trackingBooking.pickupLocation as any)?.lat) ||
            (trackingBooking?.ride as any)?.originLat ||
            (trackingBooking?.ride as any)?.origin?.lat ||
            (trackingBooking?.ride as any)?.pickupLocations?.[0]?.lat ||
            (trackingBooking as any)?.trip?.originLat ||
            (trackingBooking as any)?.trip?.pickupLocations?.[0]?.lat ||
            0,
          lon:
            (typeof trackingBooking?.pickupLocation === "object" &&
              (trackingBooking.pickupLocation as any)?.lon) ||
            (trackingBooking?.ride as any)?.originLon ||
            (trackingBooking?.ride as any)?.origin?.lon ||
            (trackingBooking?.ride as any)?.pickupLocations?.[0]?.lon ||
            (trackingBooking as any)?.trip?.originLon ||
            (trackingBooking as any)?.trip?.pickupLocations?.[0]?.lon ||
            0,
        }}
        dropoffLocation={{
          name:
            typeof trackingBooking?.dropoffLocation === "object"
              ? (trackingBooking.dropoffLocation as any)?.name || ""
              : typeof trackingBooking?.dropoffLocation === "string"
              ? trackingBooking.dropoffLocation
              : (trackingBooking?.ride as any)?.destinationLocation?.name ||
                "Destination",
          lat:
            (typeof trackingBooking?.dropoffLocation === "object" &&
              (trackingBooking.dropoffLocation as any)?.lat) ||
            (trackingBooking?.ride as any)?.destinationLat ||
            (trackingBooking?.ride as any)?.destinationLocation?.lat ||
            (trackingBooking?.ride as any)?.pickupLocations?.[
              ((trackingBooking?.ride as any)?.pickupLocations?.length || 1) - 1
            ]?.lat ||
            (trackingBooking as any)?.trip?.destinationLat ||
            0,
          lon:
            (typeof trackingBooking?.dropoffLocation === "object" &&
              (trackingBooking.dropoffLocation as any)?.lon) ||
            (trackingBooking?.ride as any)?.destinationLon ||
            (trackingBooking?.ride as any)?.destinationLocation?.lon ||
            (trackingBooking?.ride as any)?.pickupLocations?.[
              ((trackingBooking?.ride as any)?.pickupLocations?.length || 1) - 1
            ]?.lon ||
            (trackingBooking as any)?.trip?.destinationLon ||
            0,
        }}
      />
    </div>
  );
}
