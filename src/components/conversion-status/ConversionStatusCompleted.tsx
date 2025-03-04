
import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import WarningsAndErrors from './WarningsAndErrors';

interface ConversionStatusCompletedProps {
  message: string;
  warnings: string[];
  errors: string[];
}

const ConversionStatusCompleted = ({ message, warnings, errors }: ConversionStatusCompletedProps) => {
  // Use state to control when to show warnings/errors to avoid render loops
  const [showIssues, setShowIssues] = useState(false);
  
  // Set showIssues after initial render to avoid render loops
  useEffect(() => {
    if (warnings.length > 0 || errors.length > 0) {
      setShowIssues(true);
    }
  }, []);

  return (
    <div className="space-y-2">
      <Alert variant="success">
        <CheckCircle className="h-5 w-5" />
        <AlertDescription className="ml-2">
          {message}
        </AlertDescription>
      </Alert>
      
      {/* Only show if there are issues and showIssues is true */}
      {showIssues && (warnings.length > 0 || errors.length > 0) && (
        <WarningsAndErrors 
          warnings={warnings}
          errors={errors}
          isConverting={false} // Set to false in completed state
          expanded={errors.length > 0} // Auto-expand if there are errors
        />
      )}
    </div>
  );
};

export default ConversionStatusCompleted;
