
import React from 'react';
import ErrorBoundary from '../ErrorBoundary';

interface ErrorHandlerProps {
  children: React.ReactNode;
  onReset: () => void;
}

const ErrorHandler: React.FC<ErrorHandlerProps> = ({ children, onReset }) => {
  return (
    <ErrorBoundary onReset={onReset}>
      {children}
    </ErrorBoundary>
  );
};

export default ErrorHandler;
