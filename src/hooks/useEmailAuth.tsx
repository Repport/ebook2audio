
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useEmailAuth = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleEmailSignIn = async (email: string, password: string) => {
    setLoading(true);
    try {
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
        } else if (error.message.includes("captcha verification")) {
          toast({
            title: "Captcha Verification Required",
            description: "Please disable captcha in your Supabase authentication settings for development.",
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

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (signUpError) {
        if (signUpError.message.includes("captcha verification")) {
          toast({
            title: "Captcha Verification Required",
            description: "Please disable captcha in your Supabase authentication settings for development.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error signing up",
            description: signUpError.message,
            variant: "destructive",
          });
        }
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
