
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import FormFields from "./FormFields";

interface EmailSignInFormProps {
  onSuccess: () => void;
  onSwitchToSignUp?: () => void;  // Added to handle switching to signup
}

const EmailSignInForm = ({ onSuccess, onSwitchToSignUp }: EmailSignInFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validateForm = () => {
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please fill in both email and password fields.",
        variant: "destructive",
      });
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return false;
    }

    // Basic password validation
    if (password.length < 6) {
      toast({
        title: "Invalid password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Account not found",
            description: (
              <div className="space-y-2">
                <p>No account found with these credentials.</p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => onSwitchToSignUp?.()}
                >
                  Create an account
                </Button>
              </div>
            ),
            variant: "destructive",
          });
        } else {
          console.error("Auth error:", error);
          toast({
            title: "Error signing in",
            description: "An unexpected error occurred. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error signing in",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleEmailSignIn} className="space-y-4">
      <FormFields
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        disabled={loading}
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
};

export default EmailSignInForm;
