import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from '@/integrations/supabase/client';

interface TermsDialogProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
  fileName?: string;
  fileType?: string;
}

const TermsDialog = ({ open, onClose, onAccept, fileName, fileType }: TermsDialogProps) => {
  const [accepted, setAccepted] = React.useState(false);
  const { translations } = useLanguage();

  console.log('TermsDialog render:', { open, fileName, fileType }); // Debugging log

  const handleAccept = async () => {
    if (!accepted) return;

    try {
      console.log('Registering terms acceptance...'); // Debugging log
      
      const { error } = await supabase
        .from('user_consents')
        .insert({
          ip_address: 'anonymous', 
          terms_accepted: true,
          privacy_accepted: true,
          file_name: fileName,
          file_type: fileType,
          user_agent: navigator.userAgent,
          accepted_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error al registrar aceptación de términos:', error);
      }

      // Call onAccept regardless of Supabase error (don't block the flow)
      onAccept();
    } catch (error) {
      console.error('Error al procesar aceptación de términos:', error);
      // Still call onAccept to allow the flow to continue
      onAccept();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-none">
          <DialogTitle>{translations?.termsTitle || 'Terms of Service'}</DialogTitle>
          <DialogDescription className="text-sm">
            {translations?.termsDescription || 'Please read and accept our terms before continuing.'}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 my-4 h-[60vh] pr-4">
          <div className="space-y-6">
            <section>
              <h3 className="text-base font-semibold mb-3">{translations?.userResponsibility || 'User Responsibility'}</h3>
              <p className="text-sm text-muted-foreground">
                {translations?.userResponsibilityDesc || 'You are responsible for ensuring that you have the right to convert this content.'}
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-3">{translations?.copyrightCompliance || 'Copyright Compliance'}</h3>
              <p className="text-sm text-muted-foreground">
                {translations?.copyrightComplianceDesc || 'Uploading content protected by copyright without permission is prohibited.'}
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-3">{translations?.fileRetention || 'File Retention'}</h3>
              <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                <li>{translations?.fileRetentionDesc1 || 'Uploaded files are temporarily stored for processing.'}</li>
                <li>{translations?.fileRetentionDesc2 || 'Files are automatically deleted after the conversion is complete.'}</li>
              </ul>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-3">{translations?.privacySection || 'Privacy'}</h3>
              <p className="text-sm text-muted-foreground">
                {translations?.privacyDesc || 'We respect your privacy and only use your data for the requested conversion process.'}
              </p>
            </section>
          </div>
        </ScrollArea>

        <div className="flex-none pt-4 border-t">
          <div className="flex items-start space-x-2 mb-4">
            <Checkbox 
              id="terms" 
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked as boolean)}
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {translations?.acceptTerms || 'I accept the terms and conditions'}
            </label>
          </div>
        
          <DialogFooter className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 sm:flex-none"
            >
              {translations?.cancel || 'Cancel'}
            </Button>
            <Button 
              onClick={handleAccept}
              disabled={!accepted}
              className="flex-1 sm:flex-none"
            >
              {translations?.acceptAndContinue || 'Accept & Continue'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermsDialog;
