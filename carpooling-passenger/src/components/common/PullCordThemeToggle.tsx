import { Moon, Sun } from "lucide-react";
import { PullCord } from "pullcord";
import "pullcord/pullcord.css";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

type PullCordThemeToggleProps = {
  compact?: boolean;
  threadOnly?: boolean;
};

const pullCordConfig = {
  gravity: 1250,
  damping: 0.94,
  iterations: 20,
  stretchMax: 26,
};

export default function PullCordThemeToggle({
  compact = false,
  threadOnly = false,
}: PullCordThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  if (threadOnly) {
    return (
      <PullCord
        onPull={toggleTheme}
        pulled={isDark}
        ariaLabel="Toggle theme"
        config={pullCordConfig}
        className="passenger-pullcord"
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      onClick={toggleTheme}
      className={cn(
        "group relative flex items-center overflow-hidden rounded-lg border border-border bg-card text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md active:translate-y-0.5",
        compact ? "h-10 w-10 justify-center" : "w-full gap-3 px-3 py-3"
      )}
    >
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-primary transition-transform group-active:scale-95">
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </span>

      {!compact && (
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-foreground">
            {isDark ? "Night rides" : "Day rides"}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            Switch theme
          </span>
        </span>
      )}
    </button>
  );
}
