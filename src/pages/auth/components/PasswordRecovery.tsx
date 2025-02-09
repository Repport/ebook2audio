
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validateEmailFormat } from "@/utils/authValidation";

interface PasswordRecoveryProps {
  email: string;
}

const PasswordRecovery = ({ email }: PasswordRecoveryProps) => {
  const [isRecovering, setIsRecovering] = useState(false);
  const { toast } = useToast();

  const handlePasswordRecovery = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address to reset your password.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmailFormat(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsRecovering(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Recovery email sent",
        description: "Check your email for the password reset link.",
      });
    } catch (error: any) {
      console.error("Password recovery error:", error);
      toast({
        title: "Error",
        description: "Failed to send recovery email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="flex justify-end">
      <Button
        type="button"
        variant="link"
        className="px-0 font-normal text-sm"
        onClick={handlePasswordRecovery}
        disabled={isRecovering}
      >
        {isRecovering ? "Sending recovery email..." : "Forgot password?"}
      </Button>
    </div>
  );
};

export default PasswordRecovery;

