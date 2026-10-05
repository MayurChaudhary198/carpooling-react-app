import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@carpooling/common";
import { useDriverTracking } from "@/context/DriverTrackingContext";
import { formatLocationName } from "@/lib/utils";
import { Calendar, Users, Loader2, Navigation } from "lucide-react";

export default function StartTripModal() {
  const {
    activeStartableModalTrip,
    dismissStartableModal,
    handleStartTrip,
  } = useDriverTracking();

  const [isStarting, setIsStarting] = useState(false);

  if (!activeStartableModalTrip) return null;

  const tripId =
    activeStartableModalTrip.id || (activeStartableModalTrip as any)._id;

  const originName = formatLocationName(activeStartableModalTrip.origin as any);
  const destName = formatLocationName(
    (activeStartableModalTrip.destinationLocation ||
      (activeStartableModalTrip as any).destination) as any
  );

  const acceptedBookingsCount = Array.isArray(activeStartableModalTrip.bookings)
    ? activeStartableModalTrip.bookings.filter((b) => b.status === "ACCEPTED")
        .length
    : 0;

  const onConfirmStart = async () => {
    if (!tripId) return;
    setIsStarting(true);
    try {
      await handleStartTrip(tripId);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Dialog open={Boolean(activeStartableModalTrip)} onOpenChange={(open: boolean) => !open && dismissStartableModal()}>
      <DialogContent className="max-w-md rounded-2xl border-black/10 bg-card p-6 shadow-xl">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Navigation className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Ready for departure</span>
          </div>
          <DialogTitle className="font-display text-xl font-bold text-foreground">
            Your trip is ready to start
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Departure time is here. Start the trip to begin sharing live GPS with your passengers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3">
          {/* Origin & Destination Card */}
          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
              <div>
                <span className="text-muted-foreground">Origin: </span>
                <span className="font-semibold text-foreground">{originName}</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="mt-1 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
              <div>
                <span className="text-muted-foreground">Destination: </span>
                <span className="font-semibold text-foreground">{destName}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-3">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Departure</p>
                <p className="font-semibold text-foreground">
                  {activeStartableModalTrip.departureTime
                    ? format(new Date(activeStartableModalTrip.departureTime), "h:mm a")
                    : "Now"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-3">
              <Users className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Passengers</p>
                <p className="font-semibold text-foreground">
                  {acceptedBookingsCount} Accepted
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-end gap-3 pt-3">
          <Button
            variant="outline"
            onClick={dismissStartableModal}
            disabled={isStarting}
            className="rounded-xl px-4 text-xs font-medium border-border"
          >
            Later
          </Button>
          <Button
            onClick={onConfirmStart}
            disabled={isStarting}
            className="rounded-xl px-4 text-xs font-semibold shadow-xs"
          >
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Starting trip...
              </>
            ) : (
              "Start Trip"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
