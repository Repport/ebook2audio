
import React from 'react';
import { Info } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ConversionStatusIdleProps {
  message: string;
}

const ConversionStatusIdle = ({ message }: ConversionStatusIdleProps) => {
  return (
    <Alert>
      <Info className="h-5 w-5" />
      <AlertDescription className="ml-2">
        {message}
      </AlertDescription>
    </Alert>
  );
};

export default ConversionStatusIdle;
