
import React from 'react';
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
  const progress = useConversionStore(state => state.progress);
  const warnings = useConversionStore(state => state.warnings);
  const errors = useConversionStore(state => state.errors);
  const status = useConversionStore(state => state.status);
  
  // Calculate remaining time or show elapsed time
  const { time } = useConversionStore(state => ({
    time: state.time
  }));
  
  const isConverting = status === 'converting' || status === 'processing';
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-1">
        <div className="font-medium">{message}</div>
        {time.elapsed > 0 && (
          <div className="text-sm text-muted-foreground">
            {time.remaining ? `${Math.ceil(time.remaining)}s restantes` : `${Math.floor(time.elapsed)}s transcurridos`}
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
        expanded={errors.length > 0} // Auto expand if there are errors
      />
    </div>
  );
};

export default ConversionProgressBar;
