
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
  // Valor visible actual (con transición suave)
  const [displayValue, setDisplayValue] = React.useState(1);
  
  // Referencia al valor anterior para comparación
  const prevValueRef = React.useRef<number>(1);
  
  // Actualizar valor de forma suave cuando cambia
  React.useEffect(() => {
    if (typeof value === 'number' && !isNaN(value) && value >= 0) {
      // Garantizar un valor mínimo de 1% para visibilidad
      const newValue = Math.max(1, Math.min(100, value));
      
      // Solo actualizar si es un cambio significativo (al menos 1%)
      // o es el valor final (100%)
      if (Math.abs(newValue - prevValueRef.current) >= 1 || newValue === 100) {
        setDisplayValue(newValue);
        prevValueRef.current = newValue;
      }
    }
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
          "h-full w-full flex-1 transition-transform duration-300 ease-out",
          statusColors[status]
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
