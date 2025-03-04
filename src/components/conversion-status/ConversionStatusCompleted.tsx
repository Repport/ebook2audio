
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import WarningsAndErrors from './WarningsAndErrors';

interface ConversionStatusCompletedProps {
  message: string;
  warnings: string[];
  errors: string[];
}

const ConversionStatusCompleted = ({ message, warnings, errors }: ConversionStatusCompletedProps) => {
  return (
    <div className="space-y-2">
      <Alert variant="success">
        <CheckCircle className="h-5 w-5" />
        <AlertDescription className="ml-2">
          {message}
        </AlertDescription>
      </Alert>
      
      {/* Show warnings if any */}
      {(warnings.length > 0 || errors.length > 0) && (
        <WarningsAndErrors 
          warnings={warnings}
          errors={errors}
          isConverting={true} // Always show in completed state if there are warnings
          expanded={false}
        />
      )}
    </div>
  );
};

export default ConversionStatusCompleted;
