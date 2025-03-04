
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  status?: "idle" | "converting" | "error" | "success";
  showPercentage?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, status = "idle", showPercentage = true, ...props }, ref) => {
  // Visible value with smooth transition
  const [displayValue, setDisplayValue] = React.useState(1);
  
  // Track last incoming value
  const lastValueRef = React.useRef<number | undefined>(undefined);
  
  // Visual pulsing effect during conversion
  const [isPulsing, setIsPulsing] = React.useState(false);
  
  // Log extra info for debugging
  React.useEffect(() => {
    console.log(`Progress component received value: ${value}, status: ${status}`);
  }, [value, status]);
  
  // Update value with smooth transition when it changes
  React.useEffect(() => {
    if (typeof value === 'number' && !isNaN(value) && value >= 0) {
      // Ensure a minimum of 1% for visibility
      const newValue = Math.max(1, Math.min(100, value));
      
      // Log when value changes significantly (more than 2%)
      if (lastValueRef.current === undefined || Math.abs(newValue - lastValueRef.current) > 2) {
        console.log(`Progress component value update: ${lastValueRef.current || 0}% -> ${newValue}% (status: ${status})`);
      }
      
      // Update ref
      lastValueRef.current = newValue;
      
      // Always update the display value when the value changes
      setDisplayValue(newValue);
    }
  }, [value, status]);

  // Effect to activate pulsing periodically during conversion
  React.useEffect(() => {
    if (status === 'converting') {
      // Initial pulse
      setIsPulsing(true);
      
      // Toggle pulsing every 3 seconds for visual feedback
      const intervalId = setInterval(() => {
        setIsPulsing(prev => !prev);
      }, 3000);
      
      return () => clearInterval(intervalId);
    } else {
      setIsPulsing(false);
    }
  }, [status]);

  const statusColors = {
    idle: "bg-primary",
    converting: "bg-blue-500",
    error: "bg-destructive",
    success: "bg-green-500",
  };

  // Add a pulsing effect when converting
  const pulseEffect = isPulsing && status === 'converting' ? "animate-pulse" : "";

  // Enhanced shimmer effect for better visibility
  const shimmerEffect = status === 'converting' 
    ? "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent " +
      "before:animate-[shimmer_1.5s_infinite] before:content-['']"
    : "";

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        shimmerEffect,
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 transition-transform duration-300 ease-out",
          statusColors[status],
          pulseEffect
        )}
        style={{ 
          transform: `translateX(-${100 - displayValue}%)` 
        }}
      />
      {showPercentage && (
        <span 
          className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white mix-blend-difference"
          style={{ 
            textShadow: "0 1px 2px rgba(0,0,0,0.3)"
          }}
        >
          {Math.round(displayValue)}%
        </span>
      )}
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
