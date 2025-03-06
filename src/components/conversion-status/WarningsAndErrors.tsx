
import React, { useState, useEffect } from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WarningsAndErrorsProps {
  warnings: string[];
  errors: string[];
  isConverting: boolean;
  expanded?: boolean;
  maxHeight?: number;
}

const WarningsAndErrors = ({ 
  warnings, 
  errors, 
  isConverting, 
  expanded = false,
  maxHeight = 200 
}: WarningsAndErrorsProps) => {
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

  // Deduplicate warnings and errors to prevent repeats
  const uniqueWarnings = [...new Set(warnings)];
  const uniqueErrors = [...new Set(errors)];

  return (
    <Accordion
      type="single"
      collapsible
      value={isExpanded ? "warnings-errors" : undefined}
      onValueChange={(value) => setIsExpanded(value === "warnings-errors")}
      className="mt-2 text-sm border rounded-md overflow-hidden"
    >
      <AccordionItem value="warnings-errors" className="border-none">
        <AccordionTrigger className="py-2 px-3 text-xs font-medium flex items-center bg-muted/30">
          {uniqueErrors.length > 0 ? (
            <XCircle className="h-3.5 w-3.5 mr-1.5 text-destructive" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
          )}
          
          {uniqueErrors.length > 0 ? (
            <span className="text-destructive">
              {uniqueErrors.length === 1 ? "1 Error" : `${uniqueErrors.length} Errors`}
              {uniqueWarnings.length > 0 && ` y ${uniqueWarnings.length} advertencias`}
            </span>
          ) : uniqueWarnings.length > 0 ? (
            <span className="text-amber-500">
              {uniqueWarnings.length === 1 ? "1 Advertencia" : `${uniqueWarnings.length} Advertencias`}
            </span>
          ) : null}
        </AccordionTrigger>
        
        <AccordionContent className="pt-2 text-xs px-3 pb-3">
          <ScrollArea className={`pr-3 ${maxHeight ? `max-h-[${maxHeight}px]` : ""}`}>
            <div className="space-y-3">
              {uniqueErrors.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="font-medium text-destructive">Errores:</h4>
                  <ul className="ml-4 list-disc space-y-1 text-destructive">
                    {uniqueErrors.map((error, i) => (
                      <li key={`error-${i}`} className="break-words">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {uniqueWarnings.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="font-medium text-amber-500">Advertencias:</h4>
                  <ul className="ml-4 list-disc space-y-1 text-amber-500">
                    {uniqueWarnings.map((warning, i) => (
                      <li key={`warning-${i}`} className="break-words">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </ScrollArea>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default React.memo(WarningsAndErrors);
