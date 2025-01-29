import { cn } from "@/lib/utils";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function LoadingSpinner({ className, ...props }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center", className)} {...props}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
} 