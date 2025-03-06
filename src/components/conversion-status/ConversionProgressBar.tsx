
import React, { useMemo } from 'react';
import { useConversionStore } from '@/store/conversionStore';
import { Progress } from "@/components/ui/progress";
import WarningsAndErrors from './WarningsAndErrors';

interface ConversionProgressBarProps {
  message: string;
  showPercentage?: boolean;
}

const ConversionProgressBar = ({
  message,
  showPercentage = true
}: ConversionProgressBarProps) => {
  // Use selectors para minimizar re-renders
  const progress = useConversionStore(state => state.progress);
  const warnings = useConversionStore(state => state.warnings);
  const errors = useConversionStore(state => state.errors);
  const status = useConversionStore(state => state.status);
  const time = useConversionStore(state => state.time);
  
  const isConverting = useMemo(() => 
    status === 'converting' || status === 'processing',
  [status]);
  
  // Memoizar el mensaje de tiempo para evitar cálculos innecesarios
  const timeMessage = useMemo(() => {
    if (time.elapsed <= 0) return null;
    
    if (time.remaining) {
      return `${Math.ceil(time.remaining)}s restantes`;
    } else {
      return `${Math.floor(time.elapsed)}s transcurridos`;
    }
  }, [time.elapsed, time.remaining]);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-1">
        <div className="font-medium">{message}</div>
        {timeMessage && (
          <div className="text-sm text-muted-foreground">
            {timeMessage}
          </div>
        )}
      </div>
      
      <Progress 
        value={progress} 
        status={status === 'error' ? 'error' : 'converting'} 
        showPercentage={showPercentage}
      />
      
      {/* Acordión de advertencias y errores */}
      <WarningsAndErrors 
        warnings={warnings}
        errors={errors}
        isConverting={isConverting}
        expanded={errors.length > 0} // Expandir automáticamente si hay errores
      />
    </div>
  );
};

export default React.memo(ConversionProgressBar);
