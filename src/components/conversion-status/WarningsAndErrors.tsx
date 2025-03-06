
import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface WarningsAndErrorsProps {
  warnings: string[];
  errors: string[];
  isConverting: boolean;
  expanded?: boolean;
}

const WarningsAndErrors = ({ warnings, errors, isConverting, expanded = false }: WarningsAndErrorsProps) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  
  // Update expanded state when prop changes or when errors are added
  useEffect(() => {
    if (expanded || errors.length > 0) {
      setIsExpanded(true);
    }
  }, [expanded, errors.length]);
  
  // Don't render if there are no warnings or errors, or if not converting
  if ((warnings.length === 0 && errors.length === 0) || !isConverting) {
    return null;
  }

  console.log('Rendering WarningsAndErrors with:', {
    warningsCount: warnings.length,
    errorsCount: errors.length,
    isExpanded
  });

  return (
    <Accordion 
      type="single" 
      collapsible 
      className="w-full"
      defaultValue={isExpanded ? "integrity-warnings" : undefined}
      value={isExpanded ? "integrity-warnings" : undefined}
      onValueChange={(value) => setIsExpanded(!!value)}
    >
      <AccordionItem value="integrity-warnings">
        <AccordionTrigger className="flex items-center text-amber-500">
          <AlertTriangle className="w-4 h-4 mr-2" />
          <span>
            {errors.length > 0 
              ? `${errors.length} ${errors.length === 1 ? 'error' : 'errores'}`
              : `${warnings.length} ${warnings.length === 1 ? 'advertencia' : 'advertencias'}`}
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm">
            {errors.map((error, index) => (
              <div key={`error-${index}`} className="flex items-start p-2 bg-red-50 dark:bg-red-950 rounded-md">
                <X className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-red-800 dark:text-red-200">{error}</span>
              </div>
            ))}
            
            {warnings.map((warning, index) => (
              <div key={`warning-${index}`} className="flex items-start p-2 bg-amber-50 dark:bg-amber-950 rounded-md">
                <AlertTriangle className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-amber-800 dark:text-amber-200">{warning}</span>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default React.memo(WarningsAndErrors);
