import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import toast from "react-hot-toast";
import { Car, Eye, EyeOff, Loader2 } from "lucide-react";
import { GrainGradient } from "@paper-design/shaders-react";
import { loginApi } from "@/services/authService";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { setCredentials } from "@/store/slices/authSlice";
import { getApiErrorMessage } from "@/lib/errors";
import { SEO } from "@carpooling/common";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const email = watch("email");
  const password = watch("password");

  const { mutate, isPending } = useMutation({
    mutationFn: ({ email, password }: FormData) => loginApi(email, password),
    onSuccess: (data) => {
      const user =
        data?.user ??
        (data as { data?: { user?: { role?: string; name?: string } } })?.data
          ?.user;
      const tokens =
        data?.tokens ??
        (data as { data?: { tokens?: { accessToken?: string; refreshToken?: string } } })?.data
          ?.tokens;

      if (!user || !tokens?.accessToken) {
        toast.error("Unexpected login response. Please try again.");
        return;
      }

      if (user.role !== "PASSENGER") {
        toast.error("Access denied. This panel is for passengers only.");
        return;
      }

      dispatch(
        setCredentials({
          user,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        })
      );
      toast.success(`Welcome back, ${user.name}!`);
      navigate("/passenger/dashboard");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Invalid email or password"));
    },
  });

  const onSubmit = (data: FormData) => mutate(data);

  return (
    <section className="min-h-screen bg-background p-3 text-foreground antialiased [font-synthesis:none]">
      <SEO
        title="Sign In"
        description="Sign in to your RideShare passenger account to book rides, view trips, and track drivers."
      />
      <div className="grid min-h-[calc(100vh-1.5rem)] gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        {/* Left Form Column */}
        <div className="flex min-h-[760px] items-center rounded-2xl border border-black/15 bg-card px-6 py-10 sm:px-10 dark:border-white/10 lg:min-h-0 lg:px-14 lg:py-16 xl:px-20 shadow-xs">
          <div className="mx-auto w-full max-w-[590px]">
            <div>
              <div className="flex items-center gap-2.5 mb-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Car className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold tracking-tight">RideShare</span>
              </div>

              <h1 className="text-3xl font-medium tracking-[-0.04em] sm:text-4xl lg:text-[42px] lg:leading-[1.05] xl:text-[48px] text-foreground">
                Passenger Sign in
              </h1>
              <p className="mt-2 text-base sm:text-lg text-muted-foreground">
                Welcome back! Enter your details below.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
              {/* Email Field */}
              <div>
                <FieldBox
                  label="Email"
                  value={email}
                  onChange={(val) => setValue("email", val, { shouldValidate: true })}
                  type="email"
                  placeholder="harshitlog@gmail.com"
                  required
                />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1.5 px-1 font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <FieldBox
                  label="Password"
                  value={password}
                  onChange={(val) => setValue("password", val, { shouldValidate: true })}
                  type={showPassword ? "text" : "password"}
                  placeholder="•••••••••••••"
                  required
                  rightAddon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                />
                {errors.password && (
                  <p className="text-xs text-destructive mt-1.5 px-1 font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className="mt-6 flex h-13 w-full items-center justify-center rounded-[10px] border border-primary/20 bg-primary text-lg font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.99] cursor-pointer"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>

              <div className="pt-4 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  to="/auth/register"
                  className="font-semibold text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                >
                  Create one
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Right Animated Shader Column */}
        <div className="relative flex min-h-[720px] overflow-hidden rounded-2xl bg-black p-8 text-white sm:p-12 lg:min-h-0 shadow-lg">
          <GrainGradient
            speed={1}
            scale={1}
            rotation={0}
            offsetX={0}
            offsetY={0}
            softness={0.5}
            intensity={0.5}
            noise={0.25}
            shape="corners"
            frame={2854.5}
            colors={["#FFFFFF", "#FC7819", "#FC7819", "#FFFFFF"]}
            colorBack="#00000000"
            className="absolute inset-0 bg-black"
          />

          <div className="relative z-10 flex h-full w-full flex-col justify-between">
            <h2 className="max-w-[620px] pt-0 text-5xl font-medium tracking-[-0.05em] text-white sm:text-6xl lg:pt-16 lg:text-[64px] lg:leading-[0.98] xl:text-[70px]">
              Ride together,
              <br />
              Travel smarter
            </h2>

            <div className="mb-4 inline-flex h-12 max-w-full items-center gap-3 rounded-[10px] border border-white/25 px-5 text-sm sm:text-base font-medium text-white/85 backdrop-blur-sm transition-colors hover:border-white/45 hover:text-white">
              <Car className="size-5 shrink-0 text-[#FC7819]" />
              <span className="truncate whitespace-nowrap">
                RideShare Carpooling Network
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FieldBox({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  maxLength,
  rightAddon,
}: {
  label: string;
  value: string;
  onChange?: (val: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  rightAddon?: React.ReactNode;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <label className="flex h-14 items-center justify-between gap-3 rounded-[10px] border border-black/20 bg-background px-4 sm:px-5 text-base leading-none transition-all focus-within:border-black dark:focus-within:border-white dark:border-white/15 dark:bg-card shadow-xs cursor-text">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        aria-label={label}
        className="min-w-0 flex-1 truncate bg-transparent text-foreground outline-none placeholder:text-muted-foreground/50 text-sm sm:text-base"
      />
      <div className="flex items-center gap-2 shrink-0">
        {rightAddon}
        <span
          className={`shrink-0 text-xs sm:text-sm font-medium transition-colors select-none ${
            isFocused ? "text-foreground font-semibold" : "text-muted-foreground"
          }`}
        >
          {label}
        </span>
      </div>
    </label>
  );
}

