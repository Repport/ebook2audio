
import React from 'react';
import { cn } from '@/lib/utils';
import { Check, FileText, Settings, Upload } from 'lucide-react';

export type Step = {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
};

interface StepsProgressBarProps {
  steps: Step[];
  currentStep: number;
}

const StepsProgressBar = ({ steps, currentStep }: StepsProgressBarProps) => {
  return (
    <div className="flex justify-center items-center space-x-4 md:space-x-8">
      {steps.map((step) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div 
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-200",
                currentStep === step.id
                  ? "border-primary bg-primary text-white dark:border-white dark:bg-white dark:text-gray-900"
                  : currentStep > step.id
                  ? "border-primary bg-primary/10 text-primary dark:border-white dark:bg-white/10 dark:text-white"
                  : "border-gray-300 text-gray-400 dark:border-gray-600 dark:text-gray-400"
              )}
            >
              {currentStep > step.id ? (
                <Check className="w-5 h-5" />
              ) : (
                <step.icon className="w-5 h-5 m-auto" />
              )}
            </div>
            <div className="mt-2 text-center">
              <p className="text-sm font-medium dark:text-white">{step.title}</p>
              <p className="text-xs text-gray-500 hidden md:block dark:text-gray-400">{step.description}</p>
            </div>
          </div>
          {step.id !== steps.length && (
            <div 
              className={cn(
                "flex-1 h-0.5 transition-colors duration-200",
                currentStep > step.id
                  ? "bg-primary dark:bg-white"
                  : "bg-gray-300 dark:bg-gray-600"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StepsProgressBar;
