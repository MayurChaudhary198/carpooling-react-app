import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import {
  unwrapApiData,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  PageLoading,
  SEO,
} from "@carpooling/common";
import { API_ENDPOINTS, ROUTES } from "@/constants";
import type { Car } from "@/types";
import {
  Car as CarIcon,
  Hash,
  Palette,
  Users,
  FileText,
  Calendar,
  ShieldCheck,
  PlusCircle,
} from "lucide-react";

const getCarInfo = async (): Promise<Car | null> => {
  const response = await api.get(API_ENDPOINTS.car.myCars);
  const payload = unwrapApiData<any>(response.data);
  if (Array.isArray(payload)) {
    return payload[0] ?? null;
  }
  if (payload && Array.isArray(payload.cars)) {
    return payload.cars[0] ?? null;
  }
  if (payload && Array.isArray(payload.data)) {
    return payload.data[0] ?? null;
  }
  return payload ?? null;
};

export default function CarPage() {
  const navigate = useNavigate();
  const { data: rawData, isLoading, isError } = useQuery({
    queryKey: ["my-car"],
    queryFn: getCarInfo,
  });

  const data = (Array.isArray(rawData) ? rawData[0] : rawData) as Car | null;

  if (isLoading) return <PageLoading message="Loading vehicle specifications..." />;

  if (isError) {
    return <p className="text-destructive font-medium">Failed to load vehicle info.</p>;
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono font-medium text-foreground/80 mb-2">
            <span>DRIVER VEHICLE PROFILE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            My Vehicle
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Register and manage your car specifications for rideshare listings.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 dark:border-white/15 bg-black/[0.01] dark:bg-white/[0.02] p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-black/10 dark:border-white/10 bg-primary/10 text-primary mb-4">
            <CarIcon className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-foreground">No vehicle registered yet</h2>
          <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-muted-foreground">
            Complete vehicle setup with your vehicle model, license plate, and seating capacity to start publishing trips.
          </p>
          <Button
            className="mt-6 gap-2 rounded-xl font-semibold shadow-xs"
            onClick={() => navigate(ROUTES.driver.carSetup)}
          >
            <PlusCircle className="h-4 w-4" />
            Add Vehicle Details
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SEO
        title="Vehicle Details"
        description="View and manage your registered car information, seating capacity, and plate details."
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono font-medium text-foreground/80 mb-2">
            <span>DRIVER VEHICLE PROFILE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            My Vehicle
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Active car details verified for driver trips and passenger capacity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            Active Vehicle
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Card */}
        <Card className="rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-xs md:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-black/10 dark:border-white/15 bg-primary/10 text-primary">
                  <CarIcon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold font-display text-foreground">
                    {data.make} {data.model}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Model Year {data.year}
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold uppercase rounded-xl bg-muted px-2.5 py-1 text-foreground border border-black/10 dark:border-white/10">
                {data.licensePlate}
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span>Manufacturing Year</span>
                </div>
                <p className="text-base font-bold text-foreground">{data.year}</p>
              </div>

              <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
                  <Palette className="h-3.5 w-3.5 text-primary" />
                  <span>Vehicle Color</span>
                </div>
                <p className="text-base font-bold text-foreground capitalize">{data.color}</p>
              </div>

              <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span>Seating Capacity</span>
                </div>
                <p className="text-base font-bold text-foreground">{data.seater} Persons</p>
              </div>

              <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
                  <Hash className="h-3.5 w-3.5 text-primary" />
                  <span>License Plate</span>
                </div>
                <p className="text-sm font-mono font-bold text-foreground">{data.licensePlate}</p>
              </div>

              {data.rcNumber && (
                <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] p-3.5 space-y-1 sm:col-span-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <span>Registration Certificate (RC)</span>
                  </div>
                  <p className="text-sm font-mono font-bold text-foreground">{data.rcNumber}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status / Quick Notice */}
        <Card className="rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-xs flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold">Vehicle Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-muted-foreground">
            <p>
              Keep your vehicle clean and well-maintained. Ensure valid insurance and emission certificate before publishing interstate trips.
            </p>
            <div className="rounded-xl bg-primary/5 border border-primary/15 p-3 text-foreground">
              <p className="font-semibold text-primary">Document Verification</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Your driving license and RC book verification status can be reviewed under the Documents tab.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full rounded-xl border-border font-semibold text-xs hover:bg-accent"
              onClick={() => navigate(ROUTES.driver.documentsView)}
            >
              View Document Status
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
