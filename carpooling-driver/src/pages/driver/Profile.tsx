import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/services/api";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { setCredentials } from "@/store/slices/authSlice";
import { API_ENDPOINTS, STORAGE_KEYS } from "@/constants";
import {
  unwrapApiData,
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Separator,
  SEO,
} from "@carpooling/common";
import type { User } from "@/types";
import {
  User as UserIcon,
  Loader2,
  Save,
  ShieldCheck,
  Calendar,
  KeyRound,
} from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{10,15}$/, "Enter a valid 10-15 digit phone number")
    .optional()
    .or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

const updateProfile = async (data: FormData): Promise<User> => {
  const res = await api.put(API_ENDPOINTS.user.profile, data);
  return unwrapApiData<User>(res.data);
};

export default function Profile() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  useEffect(() => {
    if (user) reset({ name: user.name, email: user.email, phone: user.phone });
  }, [user, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      dispatch(
        setCredentials({
          user: data,
          token: localStorage.getItem(STORAGE_KEYS.token) || "",
        })
      );
      toast.success("Profile updated!");
      reset({ name: data.name, email: data.email, phone: data.phone });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err?.response?.data?.message || "Failed to update profile."
      );
    },
  });

  const onSubmit = (data: FormData) => mutate(data);

  return (
    <div className="max-w-3xl space-y-6">
      <SEO
        title="Driver Profile"
        description="Manage your RideShare driver account details, contact information, and license details."
      />
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono font-medium text-foreground/80 mb-2">
          <span>DRIVER ACCOUNT PROFILE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Profile Settings
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Manage your driver credentials, phone number, and account details.
        </p>
      </div>

      {/* Driver Identity Card */}
      <Card className="rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-xs">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-black/10 dark:border-white/15 bg-primary text-3xl font-extrabold text-primary-foreground shadow-xs">
              {user?.name?.charAt(0)?.toUpperCase() || "D"}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold font-display text-foreground">{user?.name}</p>
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant="outline" className="rounded-xl border border-black/10 dark:border-white/10 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Verified Driver Partner
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Card */}
      <Card className="rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <UserIcon className="h-4 w-4 text-primary" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...register("name")} className="rounded-xl shadow-xs" />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name?.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" {...register("email")} className="rounded-xl shadow-xs" />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email?.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" {...register("phone")} className="rounded-xl shadow-xs" />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone?.message}</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isPending || !isDirty}
                className="gap-2 rounded-xl font-semibold shadow-xs"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Info Details */}
      <Card className="rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            Account Overview
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 divide-y divide-border text-sm">
          <div className="flex items-center justify-between py-3">
            <span className="text-muted-foreground text-xs font-semibold">User Reference ID</span>
            <span className="font-mono text-xs font-semibold text-foreground bg-muted px-2.5 py-1 rounded-xl border border-black/10 dark:border-white/10">
              {user?.id}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-muted-foreground text-xs font-semibold">System Role</span>
            <span className="text-xs font-bold text-foreground">Driver</span>
          </div>
          {user?.createdAt && (
            <div className="flex items-center justify-between py-3">
              <span className="text-muted-foreground text-xs font-semibold">Member Since</span>
              <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {new Date(user.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
