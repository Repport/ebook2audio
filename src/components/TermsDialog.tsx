
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

  const handleAccept = async () => {
    if (!accepted) return;

    try {
      // Registrar la aceptación de términos
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
      onClose();
    } catch (error) {
      console.error('Error al procesar aceptación de términos:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col sm:max-w-xl md:max-w-2xl">
        <DialogHeader className="flex-none">
          <DialogTitle>{translations.termsTitle}</DialogTitle>
          <DialogDescription className="text-sm">
            {translations.termsDescription}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 my-2">
          <div className="space-y-4">
            <section>
              <h3 className="text-base font-semibold mb-1">{translations.userResponsibility}</h3>
              <p className="text-sm text-muted-foreground">
                {translations.userResponsibilityDesc}
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-1">{translations.copyrightCompliance}</h3>
              <p className="text-sm text-muted-foreground">
                {translations.copyrightComplianceDesc}
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-1">{translations.fileRetention}</h3>
              <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                <li>{translations.fileRetentionDesc1}</li>
                <li>{translations.fileRetentionDesc2}</li>
              </ul>
            </section>

            <section>
              <h3 className="text-base font-semibold mb-1">{translations.privacySection}</h3>
              <p className="text-sm text-muted-foreground">
                {translations.privacyDesc}
              </p>
            </section>
          </div>
        </ScrollArea>

        <div className="flex-none border-t pt-3">
          <div className="flex items-start space-x-2 mb-3">
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
        </div>
        
        <DialogFooter className="flex-none sm:flex sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {translations.cancel}
          </Button>
          <Button 
            onClick={handleAccept}
            disabled={!accepted}
            className="w-full sm:w-auto"
          >
            {translations.acceptAndContinue}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsDialog;
