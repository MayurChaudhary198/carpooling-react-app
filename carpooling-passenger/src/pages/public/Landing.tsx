import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  CarFront,
  ChevronRight,
  Clock3,
  CreditCard,
  Fingerprint,
  MapPinned,
  MoveRight,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import PullCordThemeToggle from "@/components/common/PullCordThemeToggle";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { SEO } from "@carpooling/common";

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Live rides", href: "#live-rides" },
  { label: "Safety", href: "#safety" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const heroStats = [
  { label: "Average booking confirmation", value: "14 min" },
  { label: "Verified driver profiles", value: "100%" },
  { label: "Trips with boarding OTP", value: "Live" },
];

const rideExamples = [
  {
    route: "Gandhinagar → Palanpur",
    time: "Today · 4:00 PM",
    price: "₹5/km",
    seats: "2 seats left",
    driver: "Mayur Chaudhary",
    car: "Toyota Fortuner",
    rating: "4.9",
    status: "Scheduled",
    highlight: true,
  },
  {
    route: "Ahmedabad → Vadodara",
    time: "Today · 6:15 PM",
    price: "₹6/km",
    seats: "3 seats left",
    driver: "Ritika Shah",
    car: "Hyundai Verna",
    rating: "4.8",
    status: "Live",
  },
  {
    route: "Pune → Mumbai",
    time: "Tomorrow · 7:30 AM",
    price: "₹8/km",
    seats: "1 seat left",
    driver: "Arjun Mehta",
    car: "Honda City",
    rating: "5.0",
    status: "Booked",
  },
];

const popularRoutes = [
  {
    route: "Ahmedabad · Vadodara corridor",
    rides: "284 rides this month",
    pace: "Fast morning departures",
  },
  {
    route: "Gandhinagar · Palanpur belt",
    rides: "146 rides this month",
    pace: "Strong weekday demand",
  },
  {
    route: "Pune · Mumbai express",
    rides: "398 rides this month",
    pace: "High weekend fill rate",
  },
  {
    route: "Bengaluru · Mysuru route",
    rides: "221 rides this month",
    pace: "Best for same-day booking",
  },
];

const reasons = [
  {
    title: "Trust built into every ride",
    description:
      "Verified profiles, route previews, driver documents, and boarding OTPs keep the experience grounded and predictable.",
    icon: ShieldCheck,
  },
  {
    title: "Designed for real movement",
    description:
      "Route timelines, pickup stops, and pricing by kilometer help passengers understand the ride before they book.",
    icon: MapPinned,
  },
  {
    title: "Payments with fewer surprises",
    description:
      "COD stays available, while advance payments use Razorpay order verification and refund tracking.",
    icon: CreditCard,
  },
  {
    title: "Community that feels curated",
    description:
      "Drivers, passengers, and trip history are organized around familiar routes, not anonymous listings.",
    icon: Users,
  },
];

const safetyItems = [
  "Driver documents reviewed before listing.",
  "Boarding OTP for every passenger pickup.",
  "Payment verification before checkout completion.",
  "Trip timeline and route history for every booking.",
  "Refund status surfaced directly in the booking flow.",
];

const testimonials = [
  {
    quote:
      "It feels more like a premium commute tool than a marketplace. I can understand the trip in under ten seconds.",
    name: "Ananya Rao",
    role: "Passenger, weekday commuter",
  },
  {
    quote:
      "The route previews and boarding OTPs give passengers confidence. It’s the first carpool app that feels deliberate.",
    name: "Kabir Sethi",
    role: "Driver, intercity routes",
  },
  {
    quote:
      "The pricing is clear, the design is calm, and booking feels as reliable as a transport app should.",
    name: "Meera Iyer",
    role: "Passenger, frequent traveler",
  },
];

const faqs = [
  {
    question: "How does booking work?",
    answer:
      "Choose a route, set your pickup and dropoff, pick seats, and select COD or advance payment. The driver confirms and you’re ready to travel.",
  },
  {
    question: "What happens after I book?",
    answer:
      "You’ll see booking status updates in the app. Accepted bookings can be paid online, and drivers can send boarding OTPs during pickup.",
  },
  {
    question: "Can I pay cash?",
    answer:
      "Yes. Cash on Delivery remains available by default, and advance payment is shown only when Razorpay is enabled.",
  },
  {
    question: "How are passengers boarded?",
    answer:
      "Drivers send a one-time boarding OTP to the passenger’s email and verify it at pickup, which keeps the process simple and secure.",
  },
  {
    question: "What if I need a refund?",
    answer:
      "Refunds are handled through the payment status card inside bookings, following the backend’s refund rules for the trip.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl"
      }
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0F766E]">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#111827] md:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-[#4B5563]">{description}</p>
    </div>
  );
}

function RouteMapPreview({
  activeRide,
  onSelectRide,
}: {
  activeRide: number;
  onSelectRide: (index: number) => void;
}) {
  const currentRide = rideExamples[activeRide];

  return (
    <div className="relative overflow-hidden rounded-lg border border-black/10 bg-[#F8F2E7] p-4 shadow-[0_18px_50px_rgba(17,24,39,0.08)]">
      <div
        className="absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,118,110,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(11,19,43,0.08) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
      <div className="absolute inset-x-10 top-10 h-px bg-[#0B132B]/16" />
      <div className="absolute inset-y-14 right-14 w-px bg-[#0B132B]/16" />

      <svg
        viewBox="0 0 640 460"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-100"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0F766E" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        <path
          d="M110 360 C170 300, 215 250, 290 228 S430 180, 515 130"
          fill="none"
          stroke="url(#routeGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="12 10"
          className="animate-route-dash"
        />
        <path
          d="M96 106 H260"
          fill="none"
          stroke="#0B132B"
          strokeOpacity="0.18"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M364 318 H522"
          fill="none"
          stroke="#0B132B"
          strokeOpacity="0.18"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx="116" cy="358" r="10" fill="#0F766E" />
        <circle cx="516" cy="128" r="10" fill="#F59E0B" />
        <circle cx="292" cy="226" r="7" fill="#111827" opacity="0.8" />
      </svg>

      <div className="relative z-10 flex min-h-[560px] flex-col justify-between">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-[260px] rounded-lg border border-black/10 bg-white/25 px-4 py-3 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0F766E]">
              <Sparkles className="h-3.5 w-3.5" />
              Live route
            </div>
            <p className="mt-2 text-sm font-semibold text-[#111827]">
              {currentRide.route}
            </p>
            <p className="mt-1 text-xs leading-5 text-[#4B5563]">
              {currentRide.seats}, {currentRide.driver}, boarding OTP ready.
            </p>
          </div>

          <div className="rounded-lg border border-black/10 bg-white/25 px-3 py-2 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#111827]">
              <BadgeCheck className="h-4 w-4 text-[#10B981]" />
              Verified route
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.25fr_0.85fr]">
          <div className="rounded-lg border border-black/10 bg-white/25 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0F766E]">
                  Driver on this ride
                </p>
                <p className="mt-1 text-lg font-semibold text-[#111827]">
                  {currentRide.driver}
                </p>
                <p className="text-sm text-[#4B5563]">
                  {currentRide.car} · {currentRide.rating} rating
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0F766E]/10 text-sm font-bold text-[#0F766E]">
                {currentRide.driver
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4 text-sm">
              <div>
                <p className="text-[#4B5563]">Departure</p>
                <p className="font-semibold text-[#111827]">
                  {currentRide.time}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[#4B5563]">Fare</p>
                <p className="font-semibold text-[#111827]">
                  {currentRide.price}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-lg border border-black/10 bg-[#0B132B]/35 p-4 text-white shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                  Pickup point
                </p>
                <Clock3 className="h-4 w-4 text-[#F59E0B]" />
              </div>
              <p className="mt-2 text-base font-semibold">GH-5 Circle</p>
              <p className="mt-1 text-sm text-white/70">
                OTP sent to passenger email before pickup.
              </p>
            </div>
            <div className="rounded-lg border border-black/10 bg-white/25 p-4 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0F766E]">
                Booking state
              </p>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#111827]">
                    2 / 3 boarded
                  </p>
                  <p className="text-xs text-[#4B5563]">
                    Passenger verified, trip ongoing
                  </p>
                </div>
                <div className="rounded-full bg-[#10B981]/10 px-3 py-1 text-xs font-semibold text-[#10B981]">
                  Live
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {rideExamples.map((ride, index) => {
            const isActive = index === activeRide;
            return (
              <button
                key={ride.route}
                type="button"
                onClick={() => onSelectRide(index)}
                className={`rounded-lg border p-3 text-left transition duration-200 ${
                  isActive
                    ? "border-[#0F766E] bg-white/30 shadow-sm backdrop-blur-sm"
                    : "border-black/10 bg-white/15 backdrop-blur-sm hover:-translate-y-0.5 hover:bg-white/30"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0F766E]">
                    Route {index + 1}
                  </p>
                  {isActive && (
                    <span className="rounded-full bg-[#0F766E]/10 px-2 py-1 text-[10px] font-semibold text-[#0F766E]">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm font-semibold text-[#111827]">
                  {ride.route}
                </p>
                <p className="mt-1 text-xs text-[#4B5563]">
                  {ride.time} · {ride.price}
                </p>
              </button>
            );
          })}
        </div>

        <div className="absolute bottom-6 right-6 flex items-center gap-2 rounded-lg border border-black/10 bg-white/25 px-3 py-2 shadow-sm backdrop-blur-sm animate-car-slide">
          <CarFront className="h-4 w-4 text-[#0F766E]" />
          <span className="text-xs font-semibold text-[#111827]">
            Route preview in motion
          </span>
        </div>
      </div>
    </div>
  );
}

function LiveRideCard({
  ride,
}: {
  ride: (typeof rideExamples)[number];
  compact?: boolean;
}) {
  return (
    <Card className="group h-full border-black/10 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(17,24,39,0.08)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#0F766E]">
              <span className="h-2 w-2 rounded-full bg-[#10B981]" />
              {ride.status}
            </div>
            <p className="mt-3 font-display text-xl font-bold text-[#111827]">
              {ride.route}
            </p>
            <p className="mt-2 text-sm text-[#4B5563]">{ride.time}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-bold text-[#0B132B]">
              {ride.price}
            </p>
            <p className="text-xs text-[#4B5563]">Per km</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 border-t border-black/5 pt-4 text-sm text-[#4B5563] sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#0F766E]">
              Driver
            </p>
            <p className="mt-1 font-semibold text-[#111827]">{ride.driver}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#0F766E]">
              Vehicle
            </p>
            <p className="mt-1 font-semibold text-[#111827]">{ride.car}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#0F766E]">
              Seats
            </p>
            <p className="mt-1 font-semibold text-[#111827]">{ride.seats}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#0F766E]">
              Rating
            </p>
            <p className="mt-1 flex items-center gap-1 font-semibold text-[#111827]">
              <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
              {ride.rating}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <Badge
            variant="secondary"
            className="rounded-full bg-[#0F766E]/10 text-[#0F766E]"
          >
            Boarding OTP
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg px-0 text-[#0F766E] hover:bg-transparent hover:text-[#0B132B]"
            asChild
          >
            <Link to="/auth/register">
              Reserve seat
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { user, token } = useAppSelector((state) => state.auth);
  const isAuthenticated = Boolean(token && user);
  const [scrolled, setScrolled] = useState(false);
  const [activeRide, setActiveRide] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const faqItems = useMemo(() => faqs, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Smart Community Carpooling"
        description="RideShare connects verified drivers and passengers for affordable, safe, and eco-friendly daily commutes."
      />
      <header
        className={`sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur transition-all duration-200 ${
          scrolled ? "shadow-[0_8px_30px_rgba(17,24,39,0.04)]" : ""
        }`}
      >
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-4 md:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card">
              <CarFront className="h-5 w-5 text-[#0F766E]" />
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-tight text-foreground">
                RideShare
              </p>
              <p className="text-xs text-muted-foreground">
                Carpooling with route clarity
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <PullCordThemeToggle compact />
            {isAuthenticated ? (
              <InteractiveHoverButton
                text="Dashboard"
                onClick={() => navigate("/passenger/dashboard")}
                className="h-10 w-36 rounded-lg border-[#0F766E] bg-card text-sm text-foreground"
              />
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="rounded-lg px-4 text-foreground"
                  asChild
                >
                  <Link to="/auth/login">Sign in</Link>
                </Button>
                <InteractiveHoverButton
                  text="Get started"
                  onClick={() => navigate("/auth/register")}
                  className="h-10 w-36 rounded-lg border-[#0F766E] bg-card text-sm text-foreground"
                />
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-[1280px] px-4 pb-24 pt-12 md:px-6 lg:px-8 lg:pb-32 lg:pt-16">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-2xl">
              <Badge
                variant="secondary"
                className="rounded-full border border-[#0F766E]/15 bg-[#0F766E]/10 px-3 py-1 text-[#0F766E]"
              >
                Built for daily routes, not hype.
              </Badge>

              <h1 className="mt-6 max-w-xl font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-[#0B132B] md:text-6xl lg:text-7xl">
                Carpooling that feels like a premium transit network.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-[#4B5563] md:text-xl">
                Clear routes, verified drivers, live boarding OTPs, and pricing
                by kilometer. Built to help people move together with
                confidence.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <InteractiveHoverButton
                  text={isAuthenticated ? "Go to Dashboard" : "Create account"}
                  onClick={() =>
                    navigate(isAuthenticated ? "/passenger/dashboard" : "/auth/register")
                  }
                  className="h-10 w-44 rounded-lg border-[#0F766E] bg-card text-sm text-foreground"
                />
                <Button
                  variant="outline"
                  className="rounded-lg border-border bg-card px-6 text-foreground hover:bg-accent"
                  asChild
                >
                  <a href="#live-rides">View live rides</a>
                </Button>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {heroStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-black/8 bg-white px-4 py-4 shadow-[0_10px_30px_rgba(17,24,39,0.04)]"
                  >
                    <p className="font-display text-2xl font-bold text-[#0B132B]">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-sm text-[#4B5563]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <RouteMapPreview
              activeRide={activeRide}
              onSelectRide={setActiveRide}
            />
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-24 border-t border-black/5 bg-white"
        >
          <div className="mx-auto max-w-[1280px] px-4 py-24 md:px-6 lg:px-8 lg:py-32">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <SectionHeading
                eyebrow="How it works"
                title="A simple booking flow, designed around real travel moments."
                description="From route discovery to pickup OTP, every step is laid out so passengers and drivers know exactly what happens next."
              />

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: "Choose a route",
                    body: "Search origin, destination, time, and seats. The trip list stays focused on viable rides.",
                    icon: MapPinned,
                  },
                  {
                    title: "Book with clarity",
                    body: "Pick COD or advance payment, then confirm with the details you actually need.",
                    icon: Wallet,
                  },
                  {
                    title: "Board with OTP",
                    body: "Drivers send a boarding OTP at pickup, turning a handoff into a clean verification step.",
                    icon: Fingerprint,
                  },
                ].map((step, index) => (
                  <Card
                    key={step.title}
                    className="group h-full border-black/10 bg-[#FAFAF8] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(17,24,39,0.06)]"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0F766E]/10">
                          <step.icon className="h-5 w-5 text-[#0F766E]" />
                        </div>
                        <span className="text-3xl font-bold text-[#0B132B]/20">
                          0{index + 1}
                        </span>
                      </div>
                      <h3 className="mt-5 font-display text-xl font-bold text-[#111827]">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[#4B5563]">
                        {step.body}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="live-rides" className="scroll-mt-24 bg-[#FAFAF8]">
          <div className="mx-auto max-w-[1280px] px-4 py-24 md:px-6 lg:px-8 lg:py-32">
            <SectionHeading
              eyebrow="Live ride examples"
              title="Real trip cards with route context, pricing, and trust indicators."
              description="The layout keeps the important details visible first: route, departure time, fare, driver identity, and seats remaining."
            />

            <div className="mt-12 grid gap-5 lg:grid-cols-12 lg:items-stretch">
              <div className="lg:col-span-7">
                <LiveRideCard ride={rideExamples[0]} />
              </div>
              <div className="grid gap-5 lg:col-span-5">
                <LiveRideCard ride={rideExamples[1]} compact />
                <LiveRideCard ride={rideExamples[2]} compact />
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-black/5 bg-white">
          <div className="mx-auto max-w-[1280px] px-4 py-24 md:px-6 lg:px-8 lg:py-32">
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
              <SectionHeading
                eyebrow="Popular routes"
                title="Routes people actually repeat every week."
                description="Route demand is surfaced with plain language, so riders know where the network is strongest before booking."
              />
              <div className="grid gap-4 md:grid-cols-2">
                {popularRoutes.map((route) => (
                  <div
                    key={route.route}
                    className="rounded-lg border border-black/10 bg-[#FAFAF8] p-5 transition-transform duration-200 hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-display text-xl font-bold text-[#111827]">
                          {route.route}
                        </p>
                        <p className="mt-2 text-sm text-[#4B5563]">
                          {route.pace}
                        </p>
                      </div>
                      <MoveRight className="h-5 w-5 text-[#F59E0B]" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-[#0F766E]">
                      {route.rides}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#FAFAF8]">
          <div className="mx-auto max-w-[1280px] px-4 py-24 md:px-6 lg:px-8 lg:py-32">
            <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-start">
              <div>
                <SectionHeading
                  eyebrow="Why choose us"
                  title="An operating system for intercity carpooling."
                  description="Every pattern in the UI is built to make real-world travel easier to understand, faster to trust, and calmer to use."
                />

                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                  {reasons.map((reason) => (
                    <Card
                      key={reason.title}
                      className="h-full border-black/10 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(17,24,39,0.06)]"
                    >
                      <CardContent className="p-5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0F766E]/10">
                          <reason.icon className="h-5 w-5 text-[#0F766E]" />
                        </div>
                        <h3 className="mt-5 font-display text-lg font-bold text-[#111827]">
                          {reason.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[#4B5563]">
                          {reason.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-black/10 bg-[#0B132B] p-6 text-white shadow-[0_18px_50px_rgba(11,19,43,0.24)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                  Trust layer
                </p>
                <h3 className="mt-3 font-display text-3xl font-bold tracking-tight">
                  Safety is not a banner. It’s a workflow.
                </h3>
                <div className="mt-8 space-y-4">
                  {safetyItems.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <BadgeCheck className="mt-0.5 h-5 w-5 text-[#10B981]" />
                      <p className="text-sm leading-6 text-white/85">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                        Live trust score
                      </p>
                      <p className="mt-2 text-4xl font-bold">98.4</p>
                    </div>
                    <div className="h-16 w-16 rounded-full border-8 border-[#10B981]/20 border-t-[#10B981]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="safety"
          className="scroll-mt-24 border-y border-black/5 bg-white"
        >
          <div className="mx-auto max-w-[1280px] px-4 py-24 md:px-6 lg:px-8 lg:py-32">
            <SectionHeading
              eyebrow="Safety"
              title="Built-in reassurance at every stage of the trip."
              description="From documents to boarding to payment completion, the interface keeps passengers and drivers aligned without adding noise."
            />

            <div className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="border-black/10 bg-[#FAFAF8]">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-[#0F766E]/10 text-[#0F766E]"
                    >
                      Boarding OTP
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-[#F59E0B]/10 text-[#A16207]"
                    >
                      Driver verified
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-[#10B981]/10 text-[#047857]"
                    >
                      Payment tracked
                    </Badge>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {[
                      {
                        title: "Identity",
                        value: "Verified profiles",
                        copy: "Driver and passenger identity is surfaced clearly before every ride.",
                      },
                      {
                        title: "Pickup",
                        value: "OTP on boarding",
                        copy: "Each accepted passenger gets a unique pickup OTP sent by email.",
                      },
                      {
                        title: "Payments",
                        value: "Verified checkout",
                        copy: "Advance payments confirm only after Razorpay verification succeeds.",
                      },
                      {
                        title: "Record",
                        value: "Trip history",
                        copy: "Completed trips and payment outcomes remain visible after the ride.",
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="rounded-lg border border-black/10 bg-white p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0F766E]">
                          {item.title}
                        </p>
                        <p className="mt-2 font-display text-lg font-bold text-[#111827]">
                          {item.value}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#4B5563]">
                          {item.copy}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-black/10 bg-[#0B132B] text-white">
                <CardContent className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                    In-ride timeline
                  </p>
                  <div className="mt-5 space-y-4">
                    {[
                      "Booking confirmed by driver",
                      "Advance payment verified or COD selected",
                      "Pickup OTP sent before boarding",
                      "Trip starts when the driver begins the ride",
                      "Completion and refund history remain visible",
                    ].map((line, index) => (
                      <div key={line} className="flex items-start gap-3">
                        <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs font-semibold">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-6 text-white/80">
                          {line}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-[#FAFAF8]">
          <div className="mx-auto max-w-[1280px] px-4 py-24 md:px-6 lg:px-8 lg:py-32">
            <SectionHeading
              eyebrow="Testimonials"
              title="People should feel the design before they notice the interface."
              description="These cards are intentionally calm and editorial — closer to a premium transport brand than a noisy web marketplace."
              align="center"
            />

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {testimonials.map((item, index) => (
                <Card
                  key={item.name}
                  className={`border-black/10 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(17,24,39,0.06)] ${
                    index === 1 ? "lg:mt-10" : ""
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 text-[#F59E0B]">
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                    </div>
                    <p className="mt-5 text-base leading-7 text-[#111827]">
                      “{item.quote}”
                    </p>
                    <div className="mt-6 flex items-center gap-3 border-t border-black/5 pt-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0F766E]/10 font-semibold text-[#0F766E]">
                        {item.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#111827]">
                          {item.name}
                        </p>
                        <p className="text-sm text-[#4B5563]">{item.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section
          id="pricing"
          className="scroll-mt-24 border-y border-black/5 bg-white"
        >
          <div className="mx-auto max-w-[1280px] px-4 py-24 md:px-6 lg:px-8 lg:py-32">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <SectionHeading
                eyebrow="Pricing"
                title="Simple fares. No decorative pricing theater."
                description="For a carpooling platform, pricing should be understandable at a glance: kilometer rate, payment mode, and the result after verification."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="h-full border-black/10 bg-[#FAFAF8]">
                  <CardContent className="p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0F766E]">
                      Passenger fare
                    </p>
                    <p className="mt-4 font-display text-4xl font-bold text-[#0B132B]">
                      ₹5/km
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#4B5563]">
                      Pricing is shown by route and per kilometer, making it
                      easier to compare trips.
                    </p>
                    <div className="mt-5 space-y-2 text-sm text-[#4B5563]">
                      <div className="flex items-center justify-between">
                        <span>Payment modes</span>
                        <span className="font-semibold text-[#111827]">
                          COD · Advance
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Refund flow</span>
                        <span className="font-semibold text-[#111827]">
                          Backend controlled
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="h-full border-black/10 bg-[#0B132B] text-white">
                  <CardContent className="p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                      Driver earnings
                    </p>
                    <p className="mt-4 font-display text-4xl font-bold">
                      Transparent
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      The trip card makes the fare visible before booking, and
                      the platform keeps the payment state synchronized once the
                      backend confirms it.
                    </p>
                    <div className="mt-5 rounded-lg border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-semibold text-white">
                        Operational view
                      </p>
                      <p className="mt-2 text-sm text-white/70">
                        One source of truth for booking, payment, and refund
                        status.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 bg-[#FAFAF8]">
          <div className="mx-auto max-w-[1280px] px-4 py-24 md:px-6 lg:px-8 lg:py-32">
            <SectionHeading
              eyebrow="FAQ"
              title="Clear answers, no feature marketing fog."
              description="These collapsible answers keep the page calm while still covering the questions people ask before they book."
              align="center"
            />

            <div className="mx-auto mt-12 max-w-4xl divide-y divide-black/8 rounded-lg border border-black/10 bg-white">
              {faqItems.map((item) => (
                <details key={item.question} className="group p-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-semibold text-[#111827]">
                    <span>{item.question}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[#4B5563]">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/5 bg-[#0B132B] text-white">
        <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="font-display text-2xl font-bold">RideShare</p>
              <p className="mt-3 max-w-lg text-sm leading-7 text-white/70">
                A premium carpooling platform for people who want a calmer,
                clearer, more trustworthy way to travel together.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {isAuthenticated ? (
                <InteractiveHoverButton
                  text="Go to Dashboard"
                  onClick={() => navigate("/passenger/dashboard")}
                  className="h-10 w-44 rounded-lg border-border bg-card text-sm text-foreground"
                />
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="rounded-lg border-border bg-card text-foreground hover:bg-card/80"
                    asChild
                  >
                    <Link to="/auth/login">Sign in</Link>
                  </Button>
                  <InteractiveHoverButton
                    text="Get started"
                    onClick={() => navigate("/auth/register")}
                    className="h-10 w-36 rounded-lg border-border bg-card text-sm text-foreground"
                  />
                </>
              )}
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
            <p>© 2026 RideShare. Built for better shared travel.</p>
            <div className="flex flex-wrap gap-6">
              <a
                href="#how-it-works"
                className="transition-colors hover:text-white"
              >
                How it works
              </a>
              <a href="#pricing" className="transition-colors hover:text-white">
                Pricing
              </a>
              <a href="#faq" className="transition-colors hover:text-white">
                FAQ
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
