
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface EmailPreferences {
  marketing_emails: boolean;
  notification_emails: boolean;
  newsletter: boolean;
}

const AccountSettings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["emailPreferences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_preferences")
        .select("*")
        .single();

      if (error) throw error;
      return data as EmailPreferences;
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<EmailPreferences>) => {
      const { error } = await supabase
        .from("email_preferences")
        .update(newPreferences)
        .not("id", "is", null);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailPreferences"] });
      toast({
        title: "Preferences updated",
        description: "Your email preferences have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating preferences",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      const { error } = await supabase.auth.admin.deleteUser(
        (await supabase.auth.getUser()).data.user?.id ?? ""
      );
      if (error) throw error;

      await supabase.auth.signOut();
      navigate("/auth");
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting account",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Email Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notification_emails">Notification emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive emails about your account activity
              </p>
            </div>
            <Switch
              id="notification_emails"
              checked={preferences?.notification_emails}
              onCheckedChange={(checked) =>
                updatePreferencesMutation.mutate({ notification_emails: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing_emails">Marketing emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive emails about new features and updates
              </p>
            </div>
            <Switch
              id="marketing_emails"
              checked={preferences?.marketing_emails}
              onCheckedChange={(checked) =>
                updatePreferencesMutation.mutate({ marketing_emails: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="newsletter">Newsletter</Label>
              <p className="text-sm text-muted-foreground">
                Subscribe to our monthly newsletter
              </p>
            </div>
            <Switch
              id="newsletter"
              checked={preferences?.newsletter}
              onCheckedChange={(checked) =>
                updatePreferencesMutation.mutate({ newsletter: checked })
              }
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-destructive">Danger Zone</h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete Account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove all your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AccountSettings;
