
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
  
  // Log de actualizaciones para debugging
  React.useEffect(() => {
    console.log(`Progress component received value: ${value}%, current display: ${displayValue}%`);
    
    // Solo actualizar si value es un número válido
    if (typeof value === 'number' && !isNaN(value)) {
      // Garantizar un valor mínimo de 1% para visibilidad
      const newValue = Math.max(1, Math.min(100, value));
      
      // Solo actualizar si el nuevo valor es diferente del actual
      if (newValue !== prevValueRef.current) {
        console.log(`Progress bar updating from ${prevValueRef.current}% to ${newValue}%`);
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
          transform: `translateX(-${100 - displayValue}%)`,
          transitionProperty: "transform",
        }}
      />
      {showPercentage && (
        <span 
          className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white mix-blend-difference"
          style={{ 
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
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
