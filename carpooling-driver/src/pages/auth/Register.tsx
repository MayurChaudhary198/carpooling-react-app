import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import toast from "react-hot-toast";
import { Car, Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { GrainGradient } from "@paper-design/shaders-react";
import { sendRegistrationOtpApi, registerApi } from "@/services/authService";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { setCredentials } from "@/store/slices/authSlice";
import { ROUTES, USER_ROLES } from "@/constants";
import { getApiErrorMessage } from "@/lib/errors";
import { SEO } from "@carpooling/common";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email address"),
  otp: z.string().optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[^A-Za-z0-9]/, "Include at least one special character")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, "Enter a valid 10-15 digit phone number")
    .optional()
    .or(z.literal("")),
  terms: z.boolean().refine((val) => val === true, "You must accept terms"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const OTP_RESEND_SECONDS = 45;
const OTP_EXPIRES_SECONDS = 600;

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [cooldown, setCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(OTP_EXPIRES_SECONDS);
  const [otpSentMessage, setOtpSentMessage] = useState("");

  const {
    handleSubmit,
    trigger,
    watch,
    setValue,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      otp: "",
      terms: true,
    },
  });

  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const email = watch("email");
  const phone = watch("phone") ?? "";
  const password = watch("password") ?? "";
  const otp = watch("otp") ?? "";
  const terms = watch("terms");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((val) => Math.max(val - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (expiresIn <= 0) return;
    const timer = window.setInterval(() => {
      setExpiresIn((val) => Math.max(val - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expiresIn]);

  const passwordStrength = useMemo(() => {
    if (!password) return "";
    const score = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;

    if (score === 3) return "Strong password";
    if (score === 2) return "Good password (add symbol for strong)";
    return "Password needs uppercase & symbol";
  }, [password]);

  const sendOtp = useMutation({
    mutationFn: async () => {
      const fullName = `${getValues("firstName")} ${getValues("lastName")}`.trim();
      return sendRegistrationOtpApi(fullName, getValues("email"));
    },
    onSuccess: (data) => {
      setStep(2);
      setCooldown(OTP_RESEND_SECONDS);
      setExpiresIn(OTP_EXPIRES_SECONDS);
      setOtpSentMessage(data.message || "Registration OTP sent successfully");
      toast.success("OTP sent. Please check your email.");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to send OTP."));
    },
  });

  const registerUser = useMutation({
    mutationFn: (values: RegisterFormData) => {
      const fullName = `${values.firstName} ${values.lastName}`.trim();
      if (!values.otp || !/^\d{6}$/.test(values.otp)) {
        throw new Error("Please enter the 6-digit OTP sent to your email");
      }
      if (!values.password || values.password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
      if (!values.phone) {
        throw new Error("Phone number is required");
      }
      return registerApi({
        name: fullName,
        email: values.email,
        otp: values.otp,
        password: values.password,
        phone: values.phone,
        role: USER_ROLES.driver,
      });
    },
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
        toast.error("Unexpected registration response. Please try again.");
        return;
      }

      dispatch(
        setCredentials({
          user,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        })
      );
      toast.success("Driver account created successfully!");
      navigate(ROUTES.driver.documents);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Registration failed. Please try again."));
    },
  });

  const handleSendOtp = async () => {
    const valid = await trigger(["firstName", "lastName", "email"]);
    if (!valid) return;
    sendOtp.mutate();
  };

  const onSubmit = (values: RegisterFormData) => {
    if (step === 1) {
      handleSendOtp();
    } else {
      let hasStep2Error = false;
      if (!values.otp || !/^\d{6}$/.test(values.otp.trim())) {
        setError("otp", { message: "Please enter the 6-digit verification code" });
        hasStep2Error = true;
      }
      if (!values.phone || !/^\+?[0-9]{10,15}$/.test(values.phone.replace(/[\s-]/g, ""))) {
        setError("phone", { message: "Enter a valid 10-15 digit phone number" });
        hasStep2Error = true;
      }
      if (!values.password || values.password.length < 8) {
        setError("password", { message: "Password must be at least 8 characters" });
        hasStep2Error = true;
      }
      if (hasStep2Error) return;
      registerUser.mutate(values);
    }
  };

  const termsText = (
    <>
      By creating an account, you agree to our{" "}
      <a
        href="#"
        onClick={(e) => e.preventDefault()}
        className="font-medium text-black/60 underline underline-offset-2 hover:text-black dark:text-white/60 dark:hover:text-white"
      >
        Terms and Services
      </a>{" "}
      and{" "}
      <a
        href="#"
        onClick={(e) => e.preventDefault()}
        className="font-medium text-black/60 underline underline-offset-2 hover:text-black dark:text-white/60 dark:hover:text-white"
      >
        Privacy Policy
      </a>
    </>
  );

  return (
    <section className="min-h-screen bg-background p-3 text-foreground antialiased [font-synthesis:none]">
      <SEO
        title="Create Driver Account"
        description="Sign up for RideShare driver partner portal to offer rides, manage bookings, and start earning."
      />
      <div className="grid min-h-[calc(100vh-1.5rem)] gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        {/* Left Form Column */}
        <div className="flex min-h-[760px] items-center rounded-2xl border border-black/15 bg-card px-6 py-10 sm:px-10 dark:border-white/10 lg:min-h-0 lg:px-14 lg:py-14 xl:px-20 shadow-xs">
          <div className="mx-auto w-full max-w-[590px]">
            <div>
              <div className="flex items-center gap-2.5 mb-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Car className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold tracking-tight">RideShare</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    DRIVER
                  </span>
                </div>
              </div>

              <h1 className="text-3xl font-medium tracking-[-0.04em] sm:text-4xl lg:text-[42px] lg:leading-[1.05] xl:text-[48px] text-foreground">
                Create an account
              </h1>
              <p className="mt-2 text-base sm:text-lg text-muted-foreground">
                Drive together, earn smarter.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
              {step === 1 ? (
                <>
                  {/* First Name & Last Name */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldBox
                        label="First Name"
                        value={firstName}
                        onChange={(val) => setValue("firstName", val, { shouldValidate: true })}
                        placeholder="John"
                        required
                      />
                      {errors.firstName && (
                        <p className="text-xs text-destructive mt-1 px-1">
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <FieldBox
                        label="Last Name"
                        value={lastName}
                        onChange={(val) => setValue("lastName", val, { shouldValidate: true })}
                        placeholder="Doe"
                        required
                      />
                      {errors.lastName && (
                        <p className="text-xs text-destructive mt-1 px-1">
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <FieldBox
                      label="Email"
                      value={email}
                      onChange={(val) => setValue("email", val, { shouldValidate: true })}
                      type="email"
                      placeholder="driver@example.com"
                      required
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive mt-1 px-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                /* Step 2: OTP, Phone & Password */
                <>
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-primary flex items-center gap-1.5 text-xs sm:text-sm">
                        <ShieldCheck className="h-4 w-4" />
                        Verification Code Sent
                      </p>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        Edit email
                      </button>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {otpSentMessage || `We sent a 6-digit verification code to ${email}`}
                    </p>
                  </div>

                  {/* 6-Digit OTP */}
                  <div>
                    <FieldBox
                      label="Verification Code"
                      value={otp}
                      onChange={(val) => setValue("otp", val, { shouldValidate: true })}
                      placeholder="6-digit OTP"
                      maxLength={6}
                      required
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1.5 px-1">
                      <span>Expires in {Math.ceil(expiresIn / 60)} min</span>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={cooldown > 0 || sendOtp.isPending}
                        className="font-semibold text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                      </button>
                    </div>
                    {errors.otp && (
                      <p className="text-xs text-destructive mt-1 px-1">
                        {errors.otp.message}
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <FieldBox
                      label="Phone"
                      value={phone}
                      onChange={(val) => setValue("phone", val, { shouldValidate: true })}
                      type="tel"
                      placeholder="+91 98765 43210"
                      required
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive mt-1 px-1">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
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
                    {password && (
                      <p className="text-xs text-muted-foreground mt-1 px-1">
                        {passwordStrength}
                      </p>
                    )}
                    {errors.password && (
                      <p className="text-xs text-destructive mt-1 px-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Checkboxes */}
              <div className="space-y-3 pt-2 text-sm leading-5 text-muted-foreground sm:text-[14px]">
                <label className="flex items-start gap-3 cursor-pointer">
                  <span className="relative mt-0.5 size-4 shrink-0">
                    <input
                      type="checkbox"
                      checked={terms}
                      onChange={(e) =>
                        setValue("terms", e.target.checked, { shouldValidate: true })
                      }
                      className="peer size-full appearance-none rounded-[3px] border border-black/30 bg-background checked:border-black checked:bg-black dark:border-white/30 dark:bg-card dark:checked:border-white dark:checked:bg-white transition-colors"
                    />
                    <svg
                      viewBox="0 0 12 12"
                      className="pointer-events-none absolute inset-0 hidden size-full p-0.5 text-white peer-checked:block dark:text-black"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 6.2 5 8.1 9 3.9"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="text-xs sm:text-sm">{termsText}</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={sendOtp.isPending || registerUser.isPending || isSubmitting}
                className="mt-6 flex h-13 w-full items-center justify-center rounded-[10px] border border-primary/20 bg-primary text-lg font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.99] cursor-pointer"
              >
                {sendOtp.isPending || registerUser.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {sendOtp.isPending ? "Sending OTP..." : "Creating account..."}
                  </span>
                ) : step === 1 ? (
                  "Continue to Verification"
                ) : (
                  "Submit"
                )}
              </button>

              <div className="pt-4 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to={ROUTES.auth.login}
                  className="font-semibold text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                >
                  Sign in
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
              Drive together,
              <br />
              Earn smarter
            </h2>

            <div className="mb-4 inline-flex h-12 max-w-full items-center gap-3 rounded-[10px] border border-white/25 px-5 text-sm sm:text-base font-medium text-white/85 backdrop-blur-sm transition-colors hover:border-white/45 hover:text-white">
              <Car className="size-5 shrink-0 text-[#FC7819]" />
              <span className="truncate whitespace-nowrap">
                RideShare Driver Partner Network
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
