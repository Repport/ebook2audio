
import React from 'react';
import { Loader2, type LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Spinner = ({ className, size = 'md', ...props }: SpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8',
  };

  return (
    <Loader2 
      className={cn("animate-spin", sizeClasses[size], className)} 
      aria-hidden="true"
    />
  );
};

// For backward compatibility
export const LoadingSpinner = Spinner;
