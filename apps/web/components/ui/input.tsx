import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export const inputVariants = cva(
  "flex h-10 w-full rounded-md border bg-input px-md py-sm text-sm text-foreground placeholder:text-text-tertiary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      state: {
        default: "border-border-default focus-visible:ring-ring",
        success: "border-success focus-visible:ring-success",
        warning: "border-warning focus-visible:ring-warning",
        error: "border-destructive focus-visible:ring-destructive",
      },
    },
    defaultVariants: {
      state: "default",
    },
  },
);

export type InputProps = InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof inputVariants> & {
    loading?: boolean;
  };

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, state, loading = false, disabled, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          ref={ref}
          className={cn(inputVariants({ state }), loading && "pr-8", className)}
          disabled={disabled || loading}
          aria-busy={loading || undefined}
          aria-invalid={state === "error" || undefined}
          {...props}
        />
        {loading ? (
          <Loader2
            className="absolute right-sm top-1/2 size-4 -translate-y-1/2 animate-spin text-text-tertiary"
            aria-hidden="true"
          />
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
