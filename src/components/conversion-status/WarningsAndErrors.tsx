
import React, { useState } from 'react';
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
  
  if ((warnings.length === 0 && errors.length === 0) || !isConverting) {
    return null;
  }

  return (
    <Accordion 
      type="single" 
      collapsible 
      className="w-full"
      defaultValue={expanded ? "integrity-warnings" : undefined}
    >
      <AccordionItem value="integrity-warnings">
        <AccordionTrigger className="flex items-center text-amber-500">
          <AlertTriangle className="w-4 h-4 mr-2" />
          <span>
            {warnings.length > 0 ? `${warnings.length} advertencias` : `${errors.length} errores`}
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm">
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
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default WarningsAndErrors;
