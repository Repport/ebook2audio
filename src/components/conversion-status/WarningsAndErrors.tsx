
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

  return (
    <Accordion
      type="single"
      collapsible
      value={isExpanded ? "warnings-errors" : undefined}
      onValueChange={(value) => setIsExpanded(value === "warnings-errors")}
      className="mt-2 text-sm"
    >
      <AccordionItem value="warnings-errors" className="border-none">
        <AccordionTrigger className="py-1 text-xs font-medium flex items-center">
          <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
          {errors.length > 0 ? (
            <span className="text-destructive">
              {errors.length === 1 ? "1 Error" : `${errors.length} Errors`}
            </span>
          ) : warnings.length > 0 ? (
            <span className="text-amber-500">
              {warnings.length === 1 ? "1 Warning" : `${warnings.length} Warnings`}
            </span>
          ) : null}
        </AccordionTrigger>
        <AccordionContent className="pt-2 text-xs">
          <div className="space-y-2">
            {errors.length > 0 && (
              <div className="space-y-1">
                <h4 className="font-medium text-destructive">Errors:</h4>
                <ul className="ml-4 list-disc text-destructive">
                  {errors.map((error, i) => (
                    <li key={`error-${i}`}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {warnings.length > 0 && (
              <div className="space-y-1">
                <h4 className="font-medium text-amber-500">Warnings:</h4>
                <ul className="ml-4 list-disc text-amber-500">
                  {warnings.map((warning, i) => (
                    <li key={`warning-${i}`}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default React.memo(WarningsAndErrors);
