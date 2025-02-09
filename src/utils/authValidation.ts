
import { useToast } from "@/hooks/use-toast";

export const validateEmailFormat = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateSignInForm = (email: string, password: string, toast: ReturnType<typeof useToast>['toast']) => {
  if (!email || !password) {
    toast({
      title: "Missing fields",
      description: "Please fill in both email and password fields.",
      variant: "destructive",
    });
    return false;
  }
  
  if (!validateEmailFormat(email)) {
    toast({
      title: "Invalid email",
      description: "Please enter a valid email address.",
      variant: "destructive",
    });
    return false;
  }

  return true;
};
