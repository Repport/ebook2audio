
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TermsCheckbox from "@/components/TermsCheckbox";
import FormFields from "./FormFields";

interface EmailSignUpFormProps {
  email: string;
  password: string;
}

const EmailSignUpForm = ({ email, password }: EmailSignUpFormProps) => {
  const [localEmail, setLocalEmail] = useState(email);
  const [localPassword, setLocalPassword] = useState(password);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handleEmailSignUp = async () => {
    if (!localEmail || !localPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in both email and password.",
        variant: "destructive",
      });
      return;
    }

    if (!termsAccepted) {
      toast({
        title: "Terms not accepted",
        description: "Please accept the terms and conditions to continue.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user: newUser }, error } = await supabase.auth.signUp({
        email: localEmail,
        password: localPassword,
        options: {
          data: {
            email: localEmail,
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString()
          }
        }
      });
      
      if (error) {
        if (error.message.includes("User already registered")) {
          toast({
            title: "Account exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }
      
      if (newUser) {
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

  return (
    <div className="space-y-4">
      <FormFields
        email={localEmail}
        password={localPassword}
        onEmailChange={setLocalEmail}
        onPasswordChange={setLocalPassword}
        disabled={loading}
      />
      <TermsCheckbox
        accepted={termsAccepted}
        isVerifying={isVerifying}
        onCheckedChange={setTermsAccepted}
      />
      <Button
        type="button"
        onClick={handleEmailSignUp}
        variant="outline"
        className="w-full"
        disabled={loading}
      >
        {loading ? "Creating account..." : "Sign up"}
      </Button>
    </div>
  );
};

export default EmailSignUpForm;
