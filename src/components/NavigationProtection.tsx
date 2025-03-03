
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NavigationProtectionProps {
  isActive: boolean;
  message?: string;
}

/**
 * Prevents accidental navigation away from the page during critical operations
 */
const NavigationProtection = ({ isActive, message = "You have an active operation in progress. Are you sure you want to leave this page?" }: NavigationProtectionProps) => {
  const { toast } = useToast();
  
  useEffect(() => {
    if (!isActive) return;
    
    // Show warning toast when protection is activated
    toast({
      title: "Navigation Protection",
      description: "Please don't refresh the page during conversion",
      variant: "warning", // Changed back to "warning" now that we've added it to the toast variants
      duration: 3000,
    });
    
    // Handle beforeunload event
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    // Add event listener
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isActive, message, toast]);

  // No visual rendering needed
  return null;
};

export default NavigationProtection;
