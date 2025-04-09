
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ConversionStatusErrorProps {
  message: string;
}

const ConversionStatusError = ({ message }: ConversionStatusErrorProps) => {
  // Determinar si el error tiene que ver con problemas de conectividad
  const isConnectivityError = message.includes('network') || 
                             message.includes('conexión') || 
                             message.includes('timeout') ||
                             message.includes('connection');
                             
  // Determinar si el error está relacionado con el servicio
  const isServiceError = message.includes('servicio') || 
                        message.includes('service') || 
                        message.includes('servidor') ||
                        message.includes('server');
                        
  // Ofrecer soluciones dependiendo del tipo de error
  let helpText = '';
  
  if (isConnectivityError) {
    helpText = 'Por favor, verifica tu conexión a internet e intenta nuevamente.';
  } else if (isServiceError) {
    helpText = 'Nuestros servidores podrían estar experimentando problemas. Por favor, intenta más tarde.';
  } else {
    helpText = 'Si el problema persiste, intenta con un texto más corto o contacta a soporte.';
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold">Error de conversión</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">{message}</p>
        <p className="text-sm">{helpText}</p>
      </AlertDescription>
    </Alert>
  );
};

export default ConversionStatusError;
