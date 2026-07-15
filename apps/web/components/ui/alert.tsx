import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export const alertVariants = cva("flex flex-col gap-sm rounded-md border p-md text-sm", {
  variants: {
    variant: {
      default: "border-border bg-card text-card-foreground",
      success: "border-success bg-success/10 text-success",
      warning: "border-warning bg-warning/10 text-warning",
      destructive: "border-destructive bg-destructive/10 text-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type AlertProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>;

export const Alert = forwardRef<HTMLDivElement, AlertProps>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = "Alert";

export const AlertTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("font-semibold leading-none", className)} {...props} />
  ),
);
AlertTitle.displayName = "AlertTitle";

export const AlertDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn("opacity-90", className)} {...props} />,
);
AlertDescription.displayName = "AlertDescription";
