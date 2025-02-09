
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useEmailAuth = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const errors = [];
    if (password.length < minLength) errors.push(`at least ${minLength} characters`);
    if (!hasUpperCase) errors.push("an uppercase letter");
    if (!hasLowerCase) errors.push("a lowercase letter");
    if (!hasNumbers) errors.push("a number");
    if (!hasSpecialChar) errors.push("a special character");

    return errors;
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data: existingUser, error: queryError } = await supabase
        .from('email_preferences')
        .select('clear_email')
        .eq('clear_email', email)
        .maybeSingle();

      if (queryError) {
        toast({
          title: "Error checking email",
          description: "Please try again later.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // If user doesn't exist, show sign up message
      if (!existingUser) {
        toast({
          title: "Account not found",
          description: "This account doesn't exist. Please sign up.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Proceed with sign in if user exists
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Invalid credentials",
            description: "Please check your email and password and try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error signing in",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (email: string, password: string) => {
    if (!email || !password) {
      toast({
        title: "Missing credentials",
        description: "Please provide both email and password.",
        variant: "destructive",
      });
      return;
    }

    // Validate password
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      toast({
        title: "Invalid password",
        description: `Password must contain ${passwordErrors.join(", ")}.`,
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const { data: existingUser, error: queryError } = await supabase
        .from('email_preferences')
        .select('clear_email')
        .eq('clear_email', email)
        .maybeSingle();

      if (queryError) {
        toast({
          title: "Error checking email",
          description: "Please try again later.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (existingUser) {
        toast({
          title: "Account exists",
          description: "An account with this email already exists. Please sign in instead.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      
      if (signUpError) {
        toast({
          title: "Error signing up",
          description: signUpError.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Check your email for the confirmation link.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error signing up",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleEmailSignIn,
    handleEmailSignUp
  };
};
