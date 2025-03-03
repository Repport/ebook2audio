
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
  // Valor visible actual (con transición suave)
  const [displayValue, setDisplayValue] = React.useState(1);
  
  // Referencia al valor anterior para comparación
  const prevValueRef = React.useRef<number>(1);
  
  // Actualizar valor de forma suave cuando cambia
  React.useEffect(() => {
    if (typeof value === 'number' && !isNaN(value) && value >= 0) {
      // Garantizar un valor mínimo de 1% para visibilidad
      const newValue = Math.max(1, Math.min(100, value));
      
      // Actualizar siempre cuando estamos convirtiendo, esto es clave
      if (status === 'converting' || Math.abs(newValue - prevValueRef.current) >= 0.5 || newValue === 100) {
        setDisplayValue(newValue);
        prevValueRef.current = newValue;
        
        // Log para depuración
        console.log(`Progress updated: ${newValue}% (status: ${status})`);
      }
    }
  }, [value, status]);

  const statusColors = {
    idle: "bg-primary",
    converting: "bg-blue-500",
    error: "bg-destructive",
    success: "bg-green-500",
  };

  // Añadimos un efecto pulsante para cuando está en proceso de conversión
  const pulseEffect = status === 'converting' ? "animate-pulse" : "";

  // Mejoramos el efecto shimmer para que sea más visible
  const shimmerEffect = 
    "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent " +
    "before:animate-[shimmer_1.5s_infinite] before:content-['']";

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        status === 'converting' && shimmerEffect,
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 transition-transform duration-300 ease-out",
          statusColors[status],
          status === 'converting' && pulseEffect
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
