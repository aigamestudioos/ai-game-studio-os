import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

export type SpinnerProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const SIZE_CLASSES = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
} as const;

export function Spinner({ className, size = "md" }: SpinnerProps) {
  return (
    <Loader2
      role="status"
      aria-label="Carregando"
      className={cn("animate-spin text-text-tertiary", SIZE_CLASSES[size], className)}
    />
  );
}
