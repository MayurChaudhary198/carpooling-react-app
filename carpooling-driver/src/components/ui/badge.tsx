import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-white",
        outline: "text-foreground",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800",
        warning:
          "border-transparent bg-amber-500/15 text-amber-800 dark:text-amber-300 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800",
        info: "border-transparent bg-blue-500/15 text-blue-800 dark:text-blue-300 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800",
        muted: "border-transparent bg-muted text-muted-foreground border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
