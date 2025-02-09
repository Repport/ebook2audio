
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import TermsContent from './TermsContent';
import TermsCheckbox from './TermsCheckbox';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import { useRecaptchaVerification } from '@/hooks/useRecaptchaVerification';
import { logTermsAcceptance } from '@/utils/termsLogger';

interface TermsDialogProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
  fileName?: string;
  fileType?: string;
}

const TermsDialog = ({ open, onClose, onAccept, fileName, fileType }: TermsDialogProps) => {
  const [accepted, setAccepted] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationPassed, setVerificationPassed] = useState(false);
  const { toast } = useToast();
  const { reCaptchaKey, isError, executeRecaptcha } = useRecaptcha(open);
  const { verifyRecaptcha } = useRecaptchaVerification();

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

      const { error } = await logTermsAcceptance({
        token,
        score: verification.score,
        fileName,
        fileType
      });
      
      if (error) {
        toast({
          title: "Warning",
          description: "Proceeded with conversion but failed to log acceptance",
          variant: "destructive",
        });
      }

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
          <TermsContent />
        </div>
        <div className="flex flex-col space-y-4">
          <TermsCheckbox 
            accepted={accepted}
            isVerifying={isVerifying}
            onCheckedChange={handleCheckboxChange}
          />
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
