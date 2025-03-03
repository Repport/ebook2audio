
import React from 'react';

interface ConversionStatusIdleProps {
  message: string;
}

const ConversionStatusIdle = ({ message }: ConversionStatusIdleProps) => {
  return (
    <p className="text-base font-medium text-center text-gray-600 dark:text-gray-300">
      {message}
    </p>
  );
};

export default ConversionStatusIdle;
