import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "@/services/api";
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  SEO,
  getApiErrorMessage,
} from "@carpooling/common";
import { API_ENDPOINTS, ROUTES } from "@/constants";
import { Loader2 } from "lucide-react";

const currentYear = new Date().getFullYear();

const carSchema = z.object({
  make: z.string().trim().min(1, "Make is required"),
  model: z.string().trim().min(1, "Model is required"),
  year: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Year must be a 4-digit number")
    .refine((val) => {
      const y = parseInt(val, 10);
      return y >= 1990 && y <= currentYear + 1;
    }, `Year must be between 1990 and ${currentYear + 1}`),
  color: z.string().trim().min(1, "Color is required"),
  seater: z
    .string()
    .trim()
    .regex(/^\d+$/, "Seater must be a number")
    .refine((val) => {
      const s = parseInt(val, 10);
      return s >= 1 && s <= 20;
    }, "Seater must be between 1 and 20"),
  rcNumber: z.string().trim().min(1, "RC number is required"),
  licensePlate: z.string().trim().min(1, "License plate is required"),
});

type CarFormData = z.infer<typeof carSchema>;

export default function CarSetup() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CarFormData>({
    resolver: zodResolver(carSchema),
  });

  const onSubmit = async (data: CarFormData) => {
    try {
      await api.post(API_ENDPOINTS.car.add, {
        make: data.make,
        model: data.model,
        year: parseInt(data.year),
        color: data.color,
        seater: parseInt(data.seater),
        rcNumber: data.rcNumber,
        licensePlate: data.licensePlate,
      });

      toast.success("Car added successfully!");
      navigate(ROUTES.driver.dashboard);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to add car. Please try again."));
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-4 sm:py-6 space-y-6">
      <SEO
        title="Vehicle Setup"
        description="Register and manage your car specifications to begin accepting rides."
      />

      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono font-medium text-foreground/80 mb-2">
            <span>DRIVER VEHICLE PROFILE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Vehicle Information
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Add your car details and seating capacity to start accepting passenger trips.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(ROUTES.driver.car)}
          className="rounded-xl text-xs"
        >
          Cancel
        </Button>
      </div>

      <Card className="rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-xs">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="make">Make</Label>
                <Input id="make" placeholder="Toyota" {...register("make")} />
                {errors.make && (
                  <p className="text-sm text-red-500">{errors.make.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="model">Model</Label>
                <Input id="model" placeholder="Fortuner" {...register("model")} />
                {errors.model && (
                  <p className="text-sm text-red-500">{errors.model.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  min="1990"
                  max={currentYear + 1}
                  placeholder="2022"
                  {...register("year")}
                />
                {errors.year && (
                  <p className="text-sm text-red-500">{errors.year.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="color">Color</Label>
                <Input id="color" placeholder="White" {...register("color")} />
                {errors.color && (
                  <p className="text-sm text-red-500">{errors.color.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="seater">Seater</Label>
                <Input
                  id="seater"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="6"
                  {...register("seater")}
                />
                {errors.seater && (
                  <p className="text-sm text-red-500">{errors.seater.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="rcNumber">RC Number</Label>
                <Input id="rcNumber" placeholder="GJ01RC5234" {...register("rcNumber")} />
                {errors.rcNumber && (
                  <p className="text-sm text-red-500">{errors.rcNumber.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="licensePlate">License Plate</Label>
              <Input id="licensePlate" placeholder="GJ01AB1934" {...register("licensePlate")} />
              {errors.licensePlate && (
                <p className="text-sm text-red-500">{errors.licensePlate.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full gap-2 rounded-xl font-semibold shadow-sm" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Saving Vehicle Details...
                </>
              ) : (
                "Save & Continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
