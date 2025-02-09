
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import FormFields from "./FormFields";
import PasswordRecovery from "./PasswordRecovery";
import { validateSignInForm } from "@/utils/authValidation";

interface EmailSignInFormProps {
  onSuccess: () => void;
  onSwitchToSignUp?: () => void;
}

const EmailSignInForm = ({ onSuccess, onSwitchToSignUp }: EmailSignInFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSignInForm(email, password, toast)) {
      return;
    }

    setLoading(true);
    try {
      console.log("Attempting sign in with:", { email: email.trim() });
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("Auth error details:", error);
        
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Account not found",
            description: (
              <div className="space-y-2">
                <p>No account exists with this email address or the password is incorrect.</p>
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
          toast({
            title: "Error signing in",
            description: error.message || "An unexpected error occurred. Please try again.",
            variant: "destructive",
          });
        }
      } else if (data.user) {
        console.log("Sign in successful");
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
      <PasswordRecovery email={email} />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
};

export default EmailSignInForm;

