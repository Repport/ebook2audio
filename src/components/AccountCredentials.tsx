
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

const AccountCredentials = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { translations } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast({
        title: translations.passwordsDontMatch,
        description: translations.passwordsMatchError,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: translations.success,
        description: translations.passwordUpdated,
      });
      
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error: any) {
      toast({
        title: translations.errorUpdatingPassword,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      // Record email change in history
      const { error: historyError } = await supabase
        .from('email_change_history')
        .insert({
          user_id: user?.id,
          old_email: user?.email,
          new_email: newEmail
        });

      if (historyError) throw historyError;

      toast({
        title: translations.emailVerificationSent,
        description: translations.checkEmail,
      });
      
      // Clear form
      setNewEmail("");
    } catch (error: any) {
      toast({
        title: translations.errorUpdatingEmail,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{translations.changePassword}</h2>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">{translations.newPassword}</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{translations.confirmNewPassword}</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? translations.updating : translations.updatePassword}
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{translations.changeEmail}</h2>
        <form onSubmit={handleUpdateEmail} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-email">{translations.currentEmail}</Label>
            <Input
              id="current-email"
              type="email"
              value={user?.email}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-email">{translations.newEmail}</Label>
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? translations.updating : translations.updateEmail}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AccountCredentials;
