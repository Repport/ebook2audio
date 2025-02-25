
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  status?: "idle" | "error" | "success";
  showPercentage?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, status = "idle", showPercentage = true, ...props }, ref) => {
  // Usamos estado local para animar suavemente los cambios de valor
  const [displayValue, setDisplayValue] = React.useState(0); // Siempre comenzar desde 0

  React.useEffect(() => {
    // Actualizamos el valor mostrado de forma suave
    const timer = setTimeout(() => {
      if (typeof value === 'number') {
        setDisplayValue(value);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [value]);

  const statusColors = {
    idle: "bg-primary",
    error: "bg-destructive",
    success: "bg-green-500",
  };

  const shimmerEffect = 
    "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent " +
    "before:animate-[shimmer_2s_infinite] before:content-['']";

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
          "h-full w-full flex-1 transition-transform ease-out duration-300 will-change-transform",
          statusColors[status]
        )}
        style={{ transform: `translateX(-${100 - (displayValue || 0)}%)` }}
      />
      {showPercentage && (
        <span 
          className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white mix-blend-difference"
          style={{ 
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            transform: "translateZ(0)" // Mejora el rendimiento del texto
          }}
        >
          {Math.round(displayValue || 0)}%
        </span>
      )}
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
