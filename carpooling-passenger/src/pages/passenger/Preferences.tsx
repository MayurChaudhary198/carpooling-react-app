import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  BellRing,
  Mail,
  MailCheck,
  Megaphone,
  ShieldCheck,
  TimerReset,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from "@carpooling/common";
import { useAppSelector } from "@/hooks/useAppDispatch";
import type { NotificationPreferences } from "@/types";

const STORAGE_KEY = "passenger.notification-preferences";

const defaultPreferences: NotificationPreferences = {
  bookingRequests: true,
  bookingConfirmations: true,
  tripReminders: true,
  otpEmails: true,
  promotionalEmails: false,
};

export default function Preferences() {
  const { user } = useAppSelector((state) => state.auth);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    defaultPreferences
  );

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      setPreferences({ ...defaultPreferences, ...JSON.parse(stored) });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const savePreferences = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    toast.success("Preferences saved locally.");
  };

  const items = [
    {
      key: "bookingRequests" as const,
      label: "Booking requests",
      description: "Driver booking emails and immediate request updates.",
      icon: MailCheck,
    },
    {
      key: "bookingConfirmations" as const,
      label: "Booking confirmations",
      description: "Accepted or rejected booking notifications.",
      icon: ShieldCheck,
    },
    {
      key: "tripReminders" as const,
      label: "Trip reminders",
      description: "Upcoming trip reminders before departure.",
      icon: TimerReset,
    },
    {
      key: "otpEmails" as const,
      label: "OTP emails",
      description: "Registration and boarding verification emails.",
      icon: BellRing,
    },
    {
      key: "promotionalEmails" as const,
      label: "Promotional emails",
      description: "Product announcements and offers.",
      icon: Megaphone,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <SEO
        title="Notification Preferences"
        description="Customize your RideShare notification settings and email alerts."
      />
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Notifications
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Preferences
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Fine-tune which emails you want to receive. These settings are stored locally for now.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6 border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-foreground">Email connected</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-medium text-foreground">{user?.email || "No email found"}</p>
            <p className="text-sm text-muted-foreground">
              All notifications will be routed to this address.
            </p>
          </div>
          <Mail className="h-5 w-5 text-muted-foreground" />
        </CardContent>
      </Card>

      <Card className="mt-6 border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-foreground">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map(({ key, label, description, icon: Icon }) => (
            <div
              key={key}
              className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-muted p-2 text-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences[key]}
                onClick={() =>
                  setPreferences((current) => ({
                    ...current,
                    [key]: !current[key],
                  }))
                }
                className={`relative h-7 w-12 rounded-full transition cursor-pointer ${
                  preferences[key] ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-background shadow transition ${
                    preferences[key] ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          ))}

          <div className="flex justify-end">
            <Button
              onClick={savePreferences}
              className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
