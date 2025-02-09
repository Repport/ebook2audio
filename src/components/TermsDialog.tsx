
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";

// Add type definition for Google reCAPTCHA
declare global {
  interface Window {
    grecaptcha: {
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      ready: (callback: () => void) => void;
    };
  }
}

interface TermsDialogProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
  fileName?: string;
  fileType?: string;
}

const TermsDialog = ({ open, onClose, onAccept, fileName, fileType }: TermsDialogProps) => {
  const [accepted, setAccepted] = React.useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationPassed, setVerificationPassed] = useState(false);
  const { toast } = useToast();
  const { translations } = useLanguage();

  const { data: reCaptchaKey, isError } = useQuery({
    queryKey: ['recaptcha-site-key'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'recaptcha_site_key')
        .maybeSingle();

      if (error) {
        console.error('Error fetching reCAPTCHA site key:', error);
        throw error;
      }

      if (!data) {
        throw new Error('ReCAPTCHA site key not found in configuration');
      }

      return data.value;
    }
  });

  useEffect(() => {
    if (reCaptchaKey && open) {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${reCaptchaKey}`;
      script.async = true;
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    }
  }, [reCaptchaKey, open]);

  const executeRecaptcha = async () => {
    if (!window.grecaptcha) {
      console.error('reCAPTCHA not loaded');
      return null;
    }

    try {
      const token = await window.grecaptcha.execute(reCaptchaKey, { action: 'terms_acceptance' });
      console.log('reCAPTCHA token generated');
      return token;
    } catch (error) {
      console.error('Error executing reCAPTCHA:', error);
      return null;
    }
  };

  const verifyRecaptcha = async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-recaptcha', {
        body: { token, expectedAction: 'terms_acceptance' }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error verifying reCAPTCHA:', error);
      return null;
    }
  };

  const handleCheckboxChange = async (checked: boolean) => {
    setAccepted(checked);
    if (checked) {
      setIsVerifying(true);
      try {
        const token = await executeRecaptcha();
        if (!token) {
          toast({
            title: "Verification Failed",
            description: "Could not complete security verification. Please try again.",
            variant: "destructive",
          });
          setAccepted(false);
          return;
        }

        const verification = await verifyRecaptcha(token);
        if (!verification || !verification.success) {
          toast({
            title: "Verification Failed",
            description: "Security verification failed. Please try again later.",
            variant: "destructive",
          });
          setAccepted(false);
          return;
        }

        setVerificationPassed(true);
        toast({
          title: "Verification Successful",
          description: "You can now proceed with accepting the terms.",
        });
      } catch (error) {
        console.error('Error in verification process:', error);
        toast({
          title: "Error",
          description: "An error occurred during verification. Please try again.",
          variant: "destructive",
        });
        setAccepted(false);
      } finally {
        setIsVerifying(false);
      }
    } else {
      setVerificationPassed(false);
    }
  };

  const logAcceptance = async (token: string, score: number) => {
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      
      const { error } = await supabase
        .from('terms_acceptance_logs')
        .insert([
          {
            ip_address: ipData.ip,
            user_agent: navigator.userAgent,
            file_name: fileName,
            file_type: fileType,
            captcha_token: token,
            recaptcha_score: score,
            retention_period_accepted: true
          }
        ]);

      if (error) {
        console.error('Error logging terms acceptance:', error);
        toast({
          title: "Warning",
          description: "Proceeded with conversion but failed to log acceptance",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error getting IP or logging acceptance:', error);
      toast({
        title: "Warning",
        description: "Proceeded with conversion but failed to log acceptance",
        variant: "destructive",
      });
    }
  };

  const handleAccept = async () => {
    if (!accepted || !verificationPassed) {
      toast({
        title: "Verification Required",
        description: "Please accept the terms and complete the verification to continue",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = await executeRecaptcha();
      if (!token) {
        toast({
          title: "Verification Failed",
          description: "Could not complete security verification. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const verification = await verifyRecaptcha(token);
      if (!verification || !verification.success) {
        toast({
          title: "Verification Failed",
          description: "Security verification failed. Please try again later.",
          variant: "destructive",
        });
        return;
      }

      await logAcceptance(token, verification.score);
      onAccept();
      onClose();
    } catch (error) {
      console.error('Error in acceptance process:', error);
      toast({
        title: "Error",
        description: "An error occurred. Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Notice and Terms of Use</DialogTitle>
          <DialogDescription>
            Before proceeding with the conversion of your file to audio, you must accept the following terms:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 my-6 text-left">
          <ol className="list-decimal list-inside space-y-2">
            <li className="text-sm">
              <span className="font-semibold">User Responsibility:</span> You declare and guarantee that you have the legal rights to use, process, and convert the content of the file you are uploading.
            </li>
            <li className="text-sm">
              <span className="font-semibold">Copyright Compliance:</span> Uploading copyrighted content without explicit authorization from the rights holder is strictly prohibited. The user is solely responsible for any infringement.
            </li>
            <li className="text-sm">
              <span className="font-semibold">{translations.liabilityDisclaimer}</span>
            </li>
            <li className="text-sm">
              <span className="font-semibold">Data Retention:</span> {translations.dataRetentionDesc}
            </li>
            <li className="text-sm">
              <span className="font-semibold">Privacy Policy:</span> Please refer to our <Link to="/privacy" className="text-blue-600 hover:underline" target="_blank">privacy policy</Link> for more details about data handling and retention.
            </li>
            <li className="text-sm">
              <span className="font-semibold">Terms of Use:</span> We reserve the right to suspend or terminate access to this service in case of misuse or violation of these terms.
            </li>
          </ol>
        </div>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="terms" 
              checked={accepted}
              disabled={isVerifying}
              onCheckedChange={handleCheckboxChange}
            />
            <label 
              htmlFor="terms" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I accept the terms and conditions, including the 30-day data retention period, and confirm that I have the legal rights to the content of the uploaded file.
            </label>
          </div>
          {isVerifying && (
            <div className="text-sm text-blue-600 text-center">
              Verifying...
            </div>
          )}
          {isError && (
            <div className="text-red-500 text-sm text-center">
              Error loading security verification. Please try again later.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleAccept}
            disabled={!accepted || !verificationPassed || !reCaptchaKey || isError}
          >
            Accept and Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsDialog;
