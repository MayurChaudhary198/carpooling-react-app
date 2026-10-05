import React, { useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { GrainGradient } from "@paper-design/shaders-react";
import { Eye, EyeOff, Loader2, Car, ShieldCheck } from "lucide-react";

export interface AuthSectionOneProps {
  title?: string;
  subtitle?: string;
  bannerTitle?: ReactNode;
  bannerSubtitle?: string;
  isSubmitting?: boolean;
  onSubmit?: (e: React.FormEvent) => void;
  // Field values and setters for fields we already use
  firstName?: string;
  onFirstNameChange?: (val: string) => void;
  lastName?: string;
  onLastNameChange?: (val: string) => void;
  email?: string;
  onEmailChange?: (val: string) => void;
  phone?: string;
  onPhoneChange?: (val: string) => void;
  password?: string;
  onPasswordChange?: (val: string) => void;
  otp?: string;
  onOtpChange?: (val: string) => void;
  showOtpStep?: boolean;
  onResendOtp?: () => void;
  otpCooldown?: number;
  otpSentMessage?: string;
  termsAccepted?: boolean;
  onTermsAcceptedChange?: (checked: boolean) => void;
  errorMessage?: string;
  submitButtonText?: string;
  loginUrl?: string;
}

export default function AuthSectionOne({
  title = "Create an account",
  subtitle = "Carpooling with route clarity and trusted drivers",
  bannerTitle = (
    <>
      Ride together,
      <br />
      Travel smarter
    </>
  ),
  bannerSubtitle = "RideShare Carpooling Network",
  isSubmitting = false,
  onSubmit,
  firstName = "",
  onFirstNameChange,
  lastName = "",
  onLastNameChange,
  email = "",
  onEmailChange,
  phone = "",
  onPhoneChange,
  password = "",
  onPasswordChange,
  otp = "",
  onOtpChange,
  showOtpStep = false,
  onResendOtp,
  otpCooldown = 0,
  otpSentMessage = "",
  termsAccepted = true,
  onTermsAcceptedChange,
  errorMessage = "",
  submitButtonText,
  loginUrl = "/auth/login",
}: AuthSectionOneProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
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
                {title}
              </h1>
              <p className="mt-2.5 text-base sm:text-lg text-muted-foreground">
                {subtitle}
              </p>
            </div>

            {errorMessage && (
              <div className="mt-8 mb-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className={`${errorMessage ? "mt-4" : "mt-8"} space-y-4`}>
              {!showOtpStep ? (
                <>
                  {/* Name fields (First Name + Last Name) */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldBox
                      label="First Name"
                      value={firstName}
                      onChange={onFirstNameChange}
                      type="text"
                      placeholder="e.g. Rahul"
                      required
                    />
                    <FieldBox
                      label="Last Name"
                      value={lastName}
                      onChange={onLastNameChange}
                      type="text"
                      placeholder="e.g. Sharma"
                      required
                    />
                  </div>

                  {/* Email field */}
                  <FieldBox
                    label="Email"
                    value={email}
                    onChange={onEmailChange}
                    type="email"
                    placeholder="name@example.com"
                    required
                  />

                  {/* Phone field */}
                  <FieldBox
                    label="Phone"
                    value={phone}
                    onChange={onPhoneChange}
                    type="tel"
                    placeholder="+91 9876543210"
                    required
                  />

                  {/* Password field */}
                  <FieldBox
                    label="Password"
                    value={password}
                    onChange={onPasswordChange}
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
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
                </>
              ) : (
                /* OTP Verification Step */
                <div className="space-y-4">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground space-y-1">
                    <p className="font-semibold text-primary flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      Verification Code Sent
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {otpSentMessage ||
                        `We have sent a 6-digit verification code to ${email}.`}
                    </p>
                  </div>

                  <FieldBox
                    label="6-Digit OTP"
                    value={otp}
                    onChange={onOtpChange}
                    type="text"
                    placeholder="Enter code"
                    maxLength={6}
                    required
                  />

                  {onResendOtp && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span>Didn't receive the code?</span>
                      <button
                        type="button"
                        onClick={onResendOtp}
                        disabled={otpCooldown > 0}
                        className="font-semibold text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {otpCooldown > 0
                          ? `Resend in ${otpCooldown}s`
                          : "Resend Code"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Checkboxes */}
              <div className="space-y-3 pt-2 text-sm leading-5 text-muted-foreground sm:text-[14px]">
                <CheckboxLine
                  checked={termsAccepted}
                  onChange={(c) => onTermsAcceptedChange && onTermsAcceptedChange(c)}
                >
                  {termsText}
                </CheckboxLine>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 flex h-13 w-full items-center justify-center rounded-[10px] border border-primary/20 bg-primary text-lg font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.99] cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Please wait...
                  </span>
                ) : (
                  submitButtonText || (showOtpStep ? "Verify & Create Account" : "Continue to Verification")
                )}
              </button>

              <div className="pt-4 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to={loginUrl}
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
              {bannerTitle}
            </h2>

            <div className="mb-4 inline-flex h-12 max-w-full items-center gap-3 rounded-[10px] border border-white/25 px-5 text-sm sm:text-base font-medium text-white/85 backdrop-blur-sm transition-colors hover:border-white/45 hover:text-white">
              <Car className="size-5 shrink-0 text-[#FC7819]" />
              <span className="truncate whitespace-nowrap">
                {bannerSubtitle}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface FieldBoxProps {
  label: string;
  value: string;
  onChange?: (val: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  rightAddon?: ReactNode;
}

export function FieldBox({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  maxLength,
  rightAddon,
}: FieldBoxProps) {
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
        className="min-w-0 flex-1 truncate bg-transparent text-foreground outline-none placeholder:text-muted-foreground/60 text-sm sm:text-base"
      />
      <div className="flex items-center gap-2 shrink-0">
        {rightAddon}
        <span
          className={`shrink-0 text-xs sm:text-sm font-medium transition-colors select-none ${
            isFocused
              ? "text-primary dark:text-white"
              : "text-muted-foreground"
          }`}
        >
          {label}
        </span>
      </div>
    </label>
  );
}

function CheckboxLine({
  children,
  checked = true,
  onChange,
}: {
  children: ReactNode;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <span className="relative mt-0.5 size-4 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange && onChange(e.target.checked)}
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
      <span className="text-xs sm:text-sm">{children}</span>
    </label>
  );
}

