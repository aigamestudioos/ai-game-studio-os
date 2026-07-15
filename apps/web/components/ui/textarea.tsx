import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export const textareaVariants = cva(
  "flex min-h-24 w-full rounded-md border bg-input px-md py-sm text-sm text-foreground placeholder:text-text-tertiary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> &
  VariantProps<typeof textareaVariants>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, state, disabled, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(textareaVariants({ state }), className)}
        disabled={disabled}
        aria-invalid={state === "error" || undefined}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
