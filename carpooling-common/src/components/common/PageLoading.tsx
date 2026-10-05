import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

export interface CarLoadingProps {
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function CarLoading({ size = "default", className }: CarLoadingProps) {
  const scaleMap = {
    sm: "scale-75",
    default: "scale-100",
    lg: "scale-125",
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center select-none py-2",
        scaleMap[size],
        className
      )}
    >
      <style>{`
        @keyframes carBounceAnimation {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2.5px); }
        }
        @keyframes roadDashAnimation {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -36; }
        }
        @keyframes wheelSpinAnimation {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes headlightGlow {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.85; }
        }
        @keyframes speedLine {
          0% { transform: translateX(20px); opacity: 0; }
          50% { opacity: 0.7; }
          100% { transform: translateX(-35px); opacity: 0; }
        }
      `}</style>

      <div className="relative flex items-center justify-center w-[210px] h-[95px]">
        <svg
          width="210"
          height="95"
          viewBox="0 0 210 95"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          <defs>
            {/* Forward Headlight Beam Gradient */}
            <linearGradient id="headlightBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#2DD4BF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
            </linearGradient>

            {/* Car Roof Gradient */}
            <linearGradient id="carRoofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14B8A6" />
              <stop offset="100%" stopColor="#0F766E" />
            </linearGradient>

            {/* Car Body Gradient */}
            <linearGradient id="carBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0F766E" />
              <stop offset="50%" stopColor="#115E59" />
              <stop offset="100%" stopColor="#0D9488" />
            </linearGradient>
          </defs>

          {/* Speed Wind Streaks */}
          <line
            x1="45"
            y1="22"
            x2="15"
            y2="22"
            stroke="#0D9488"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.45"
            style={{ animation: "speedLine 0.9s ease-out infinite" }}
          />
          <line
            x1="35"
            y1="30"
            x2="10"
            y2="30"
            stroke="#0D9488"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.35"
            style={{ animation: "speedLine 0.7s 0.2s ease-out infinite" }}
          />

          {/* Headlight Beam Cone */}
          <polygon
            points="148,44 205,32 205,62 148,50"
            fill="url(#headlightBeamGrad)"
            style={{ animation: "headlightGlow 1.4s ease-in-out infinite" }}
          />

          {/* Road Track (Base Track + Fast Moving Dashes) */}
          <line
            x1="5"
            y1="72"
            x2="205"
            y2="72"
            stroke="var(--color-border, #E2E8F0)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="5"
            y1="72"
            x2="205"
            y2="72"
            stroke="var(--color-primary, #0F766E)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="12 10"
            style={{ animation: "roadDashAnimation 0.45s linear infinite" }}
          />

          {/* Bouncing Car Chassis Group */}
          <g style={{ animation: "carBounceAnimation 0.5s ease-in-out infinite" }}>
            {/* Ground Shadow */}
            <ellipse
              cx="86"
              cy="70"
              rx="60"
              ry="4"
              fill="rgba(15,23,42,0.18)"
            />

            {/* Car Upper Cabin / Roof */}
            <path
              d="M50 40 L65 20 C68 17 73 16 78 16 L106 16 C111 16 116 18 119 22 L132 40 Z"
              fill="url(#carRoofGrad)"
            />

            {/* Front & Rear Windows */}
            <path
              d="M67 38 L75 20 L87 20 L87 38 Z"
              fill="#E6FFFA"
              opacity="0.9"
            />
            <path
              d="M91 38 L91 20 L105 20 L118 38 Z"
              fill="#E6FFFA"
              opacity="0.9"
            />

            {/* Car Lower Main Body */}
            <path
              d="M26 44 C26 40 29 38 33 38 L51 38 L131 38 C136 38 140 40 143 43 L149 48 C151 50 152 52 152 54 L152 58 C152 60 150 61 148 61 L133 61 C133 54 127 49 120 49 C113 49 107 54 107 61 L67 61 C67 54 61 49 54 49 C47 49 41 54 41 61 L29 61 C27 61 26 60 26 58 Z"
              fill="url(#carBodyGrad)"
            />

            {/* Headlight Lamp */}
            <path
              d="M149 48 L152 50 L152 54 L148 53 Z"
              fill="#FDE047"
            />

            {/* Taillight Lamp */}
            <rect
              x="26"
              y="44"
              width="4"
              height="8"
              rx="1.5"
              fill="#EF4444"
            />

            {/* Door Handle Accents */}
            <rect x="76" y="42" width="6" height="1.5" rx="0.75" fill="#E6FFFA" opacity="0.8" />
            <rect x="100" y="42" width="6" height="1.5" rx="0.75" fill="#E6FFFA" opacity="0.8" />

            {/* Front Wheel (Rotating) */}
            <g
              style={{
                transformOrigin: "54px 59px",
                animation: "wheelSpinAnimation 0.5s linear infinite",
              }}
            >
              <circle
                cx="54"
                cy="59"
                r="11"
                fill="#1E293B"
                stroke="#0F172A"
                strokeWidth="1.5"
              />
              <circle cx="54" cy="59" r="6.5" fill="#F1F5F9" />
              <circle cx="54" cy="59" r="3" fill="#0F766E" />
              <line x1="54" y1="53" x2="54" y2="65" stroke="#64748B" strokeWidth="1.5" />
              <line x1="48" y1="59" x2="60" y2="59" stroke="#64748B" strokeWidth="1.5" />
            </g>

            {/* Rear Wheel (Rotating) */}
            <g
              style={{
                transformOrigin: "120px 59px",
                animation: "wheelSpinAnimation 0.5s linear infinite",
              }}
            >
              <circle
                cx="120"
                cy="59"
                r="11"
                fill="#1E293B"
                stroke="#0F172A"
                strokeWidth="1.5"
              />
              <circle cx="120" cy="59" r="6.5" fill="#F1F5F9" />
              <circle cx="120" cy="59" r="3" fill="#0F766E" />
              <line x1="120" y1="53" x2="120" y2="65" stroke="#64748B" strokeWidth="1.5" />
              <line x1="114" y1="59" x2="126" y2="59" stroke="#64748B" strokeWidth="1.5" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}

export interface PageLoadingProps {
  message?: string;
  className?: string;
}

export function PageLoading({
  message = "Cruising along...",
  className,
}: PageLoadingProps) {
  return (
    <div
      className={cn(
        "flex min-h-[360px] w-full flex-col items-center justify-center gap-2 p-8 text-center",
        className
      )}
    >
      <CarLoading size="default" />
      {message && (
        <div className="flex flex-col items-center gap-1 mt-2">
          <p className="text-sm font-bold text-foreground tracking-tight">
            {message}
          </p>
          <span className="text-[11px] font-semibold text-primary uppercase tracking-widest animate-pulse">
            RideShare Driver
          </span>
        </div>
      )}
    </div>
  );
}

export function LoadingSpinner({
  size = "default",
  className,
}: {
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const sizeMap = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2
      className={cn("animate-spin text-primary shrink-0", sizeMap[size], className)}
    />
  );
}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-muted/60", className)}
      {...props}
    />
  );
}
