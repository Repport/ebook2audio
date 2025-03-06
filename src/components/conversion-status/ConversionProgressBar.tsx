
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
      
      {/* Warnings and errors accordion */}
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
