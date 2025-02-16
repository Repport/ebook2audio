
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
import { supabase } from "@/integrations/supabase/client";

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
        .from('terms_acceptance_logs')
        .insert({
          ip_address: 'anonymous', // Por privacidad, no registramos la IP real
          file_name: fileName,
          file_type: fileType,
          retention_period_accepted: true,
          user_agent: navigator.userAgent
        });

      if (error) {
        console.error('Error al registrar aceptación de términos:', error);
        return;
      }

      onAccept();
    } catch (error) {
      console.error('Error al procesar aceptación de términos:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-none">
          <DialogTitle>{translations.termsTitle}</DialogTitle>
          <DialogDescription className="text-sm">
            {translations.termsDescription}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 my-4 max-h-[50vh] pr-4">
          <div className="space-y-4">
            <section>
              <h3 className="text-base font-semibold mb-2">{translations.userResponsibility}</h3>
              <p className="text-sm text-muted-foreground">
                {translations.userResponsibilityDesc}
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-2">{translations.copyrightCompliance}</h3>
              <p className="text-sm text-muted-foreground">
                {translations.copyrightComplianceDesc}
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-2">{translations.fileRetention}</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li>{translations.fileRetentionDesc1}</li>
                <li>{translations.fileRetentionDesc2}</li>
              </ul>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-2">{translations.privacySection}</h3>
              <p className="text-sm text-muted-foreground">
                {translations.privacyDesc}
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
              {translations.acceptTerms}
            </label>
          </div>
        
          <DialogFooter className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 sm:flex-none"
            >
              {translations.cancel}
            </Button>
            <Button 
              onClick={handleAccept}
              disabled={!accepted}
              className="flex-1 sm:flex-none"
            >
              {translations.acceptAndContinue}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermsDialog;
