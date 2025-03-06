
import React, { useMemo } from 'react';
import { useConversionStore } from '@/store/conversionStore';
import { Progress } from "@/components/ui/progress";
import WarningsAndErrors from './WarningsAndErrors';
import { formatTimeRemaining } from '@/utils/timeFormatting';

interface ConversionProgressBarProps {
  message: string;
  showPercentage?: boolean;
}

const ConversionProgressBar = ({
  message,
  showPercentage = true
}: ConversionProgressBarProps) => {
  // Use selectors to minimize re-renders
  const progress = useConversionStore(state => state.progress);
  const warnings = useConversionStore(state => state.warnings);
  const errors = useConversionStore(state => state.errors);
  const status = useConversionStore(state => state.status);
  const time = useConversionStore(state => state.time);
  
  const isConverting = useMemo(() => 
    status === 'converting' || status === 'processing',
  [status]);
  
  // Memoize the time message to avoid unnecessary calculations
  const timeMessage = useMemo(() => {
    if (time.elapsed <= 0) return null;
    
    if (time.remaining) {
      return formatTimeRemaining(time.remaining);
    } else {
      return formatTimeRemaining(time.elapsed);
    }
  }, [time.elapsed, time.remaining]);
  
  // Map conversion status to progress component status
  const progressStatus = useMemo(() => {
    switch (status) {
      case 'error': return 'error';
      case 'completed': return 'success';
      case 'converting':
      case 'processing': return 'converting';
      default: return 'idle';
    }
  }, [status]);
  
  console.log('ConversionProgressBar rendering with:', {
    progress,
    status,
    progressStatus,
    errorsCount: errors.length
  });
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-1">
        <div className="font-medium">{status === 'error' ? 'Error en la conversión' : message}</div>
        {timeMessage && status !== 'error' && (
          <div className="text-sm text-muted-foreground">
            {timeMessage}
          </div>
        )}
      </div>
      
      <Progress 
        value={progress} 
        status={progressStatus}
        showPercentage={showPercentage}
      />
      
      {/* Warnings and errors accordion - always expand on error */}
      <WarningsAndErrors 
        warnings={warnings}
        errors={errors}
        isConverting={isConverting}
        expanded={errors.length > 0} // Auto-expand if there are errors
      />
    </div>
  );
};

export default React.memo(ConversionProgressBar);
