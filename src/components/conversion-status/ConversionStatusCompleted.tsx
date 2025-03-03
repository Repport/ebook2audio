
import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ConversionStatusCompletedProps {
  message: string;
  warnings: string[];
  errors: string[];
}

const ConversionStatusCompleted = ({ message, warnings, errors }: ConversionStatusCompletedProps) => {
  const [showWarnings, setShowWarnings] = useState(false);
  
  return (
    <div className="w-full flex flex-col items-center justify-center gap-3">
      <CheckCircle2 className="w-12 h-12 text-green-500" />
      <p className="text-lg font-medium text-green-600 text-center">
        {message}
      </p>
      
      {(warnings.length > 0 || errors.length > 0) && (
        <Alert variant={errors.length > 0 ? "destructive" : "warning"} className="mt-4">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription className="ml-2">
            La conversión se completó con {warnings.length} advertencias y {errors.length} errores.
            <button className="block underline mt-1 text-sm" onClick={() => setShowWarnings(!showWarnings)}>
              {showWarnings ? 'Ocultar detalles' : 'Mostrar detalles'}
            </button>
          </AlertDescription>
          
          {showWarnings && (
            <div className="mt-2 space-y-2 text-sm">
              {warnings.map((warning, index) => (
                <div key={`warning-${index}`} className="flex items-start p-2 bg-amber-50 dark:bg-amber-950 rounded-md">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{warning}</span>
                </div>
              ))}
              
              {errors.map((error, index) => (
                <div key={`error-${index}`} className="flex items-start p-2 bg-red-50 dark:bg-red-950 rounded-md">
                  <X className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}
        </Alert>
      )}
    </div>
  );
};

export default ConversionStatusCompleted;
