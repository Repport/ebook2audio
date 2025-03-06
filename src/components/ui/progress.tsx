
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"
import { useProgressValue } from "@/hooks/useProgressValue"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  status?: "idle" | "converting" | "error" | "success";
  showPercentage?: boolean;
}

const Progress = React.memo(React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, status = "idle", showPercentage = true, ...props }, ref) => {
  // Use our hook for smooth animations
  const { displayValue } = useProgressValue({
    value: value as number,
    status,
    animationDuration: 300
  });

  // Define status-based styling
  const statusClasses = {
    idle: "bg-primary",
    converting: "bg-blue-500",
    error: "bg-destructive",
    success: "bg-green-500",
  };

  // For converting status, add shimmer effect
  const shimmerEffect = status === 'converting' 
    ? "relative overflow-hidden before:absolute before:inset-0 before:translate-x-[-100%] before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent"
    : "";

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 transition-transform duration-300 ease-out",
          statusClasses[status],
          shimmerEffect
        )}
        style={{ 
          transform: `translateX(-${100 - (status === 'error' ? 100 : displayValue)}%)` 
        }}
      />
      {showPercentage && (
        <span 
          className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white"
          style={{ 
            textShadow: "0 1px 1px rgba(0,0,0,0.5)"
          }}
        >
          {status === 'error' ? 'Error' : `${Math.round(displayValue)}%`}
        </span>
      )}
    </ProgressPrimitive.Root>
  );
}));

Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
