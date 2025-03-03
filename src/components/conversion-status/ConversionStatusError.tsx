
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ConversionStatusErrorProps {
  message: string;
}

const ConversionStatusError = ({ message }: ConversionStatusErrorProps) => {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-5 w-5" />
      <AlertDescription className="ml-2">
        {message}
      </AlertDescription>
    </Alert>
  );
};

export default ConversionStatusError;
