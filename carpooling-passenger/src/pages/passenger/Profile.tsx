import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { SEO } from "@carpooling/common";
import api from "@/services/api";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { setCredentials } from "@/store/slices/authSlice";
import { unwrapApiData } from "@/lib/apiResponse";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User as UserIcon, Loader2, Save } from "lucide-react";

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

const updateProfile = async (data: FormData) => {
  const res = await api.put("/user/profile", data);
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
      dispatch(setCredentials({ user: data, token: localStorage.getItem("token") || "" }));
      toast.success("Profile updated!");
      reset({ name: data.name, email: data.email, phone: data.phone });
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || "Failed to update profile."),
  });

  const onSubmit = (data: FormData) => mutate(data);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <SEO
        title="My Profile"
        description="Manage your RideShare account information and contact details."
      />
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Account
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Profile
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Manage your account information and keep your contact details current.
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-3xl font-bold text-foreground">
          {user?.name?.charAt(0)?.toUpperCase() || "P"}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-semibold text-foreground">{user?.name}</p>
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge>Passenger</Badge>
            <Link
              to="/passenger/preferences"
              className="inline-flex text-sm font-medium text-foreground hover:underline"
            >
              Manage notification preferences
            </Link>
          </div>
        </div>
      </div>

      <Card className="mt-6 border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-foreground">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {[
              { name: "name" as const, label: "Full Name", type: "text" },
              { name: "email" as const, label: "Email", type: "email" },
              { name: "phone" as const, label: "Phone Number", type: "tel" },
            ].map((field) => (
              <div key={field.name} className="space-y-1.5">
                <Label htmlFor={field.name}>{field.label}</Label>
                <Input
                  id={field.name}
                  {...register(field.name)}
                  type={field.type}
                  className="rounded-lg border-input bg-background text-foreground"
                />
                {errors[field.name] && (
                  <p className="text-xs text-destructive">{errors[field.name]?.message}</p>
                )}
              </div>
            ))}

            <Button
              type="submit"
              disabled={isPending || !isDirty}
              className="gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6 border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-foreground">Account Details</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <div className="space-y-0">
            {[
              { label: "User ID", value: <span className="font-mono text-xs text-foreground">{user?.id}</span> },
              { label: "Role", value: "Passenger" },
              ...(user?.createdAt
                ? [
                    {
                      label: "Member Since",
                      value: new Date(user.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }),
                    },
                  ]
                : []),
            ].map(({ label, value }, index, list) => (
              <div key={label}>
                <div className="flex items-center justify-between py-3 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="max-w-[200px] truncate text-right text-foreground font-medium">
                    {value}
                  </span>
                </div>
                {index < list.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
