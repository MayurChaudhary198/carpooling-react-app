import { useDriverTracking } from "@/context/DriverTrackingContext";
import { Button } from "@carpooling/common";
import { Radio, CheckCircle2 } from "lucide-react";

export default function ActiveTripTrackingBanner() {
  const { isTracking, activeSession, lastTrackingData, stopTracking } =
    useDriverTracking();

  if (!isTracking || !activeSession) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border border-primary/20 bg-card p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary"></span>
          </div>
          <div>
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-primary animate-pulse" />
              Live GPS Streaming
            </p>
            <p className="text-[10px] text-muted-foreground">
              {lastTrackingData?.speed !== null && lastTrackingData?.speed !== undefined
                ? `${Math.round(lastTrackingData.speed * 3.6)} km/h`
                : "Active"}{" "}
              · Trip #{activeSession.tripId.slice(-6)}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => stopTracking("COMPLETED")}
          className="h-8 text-xs font-medium border-border"
        >
          <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-600" />
          End Stream
        </Button>
      </div>
    </div>
  );
}
