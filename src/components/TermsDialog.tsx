
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

  const handleAccept = () => {
    if (accepted) {
      onAccept();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{translations.termsTitle}</DialogTitle>
          <DialogDescription>
            {translations.termsDescription}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-2">{translations.userResponsibility}</h3>
              <p className="text-sm text-muted-foreground">
                {translations.userResponsibilityDesc}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">{translations.copyrightCompliance}</h3>
              <p className="text-sm text-muted-foreground">
                {translations.copyrightComplianceDesc}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">{translations.liabilityDisclaimer}</h3>
              <p className="text-sm text-muted-foreground">
                {translations.liabilityDisclaimerDesc}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">{translations.fileRetention}</h3>
              <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                <li>{translations.fileRetentionDesc1}</li>
                <li>{translations.fileRetentionDesc2}</li>
                <li>{translations.fileRetentionDesc3}</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">{translations.privacySection}</h3>
              <p className="text-sm text-muted-foreground">
                {translations.privacyDesc}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">{translations.termsSection}</h3>
              <p className="text-sm text-muted-foreground">
                {translations.termsDesc}
              </p>
            </section>

            <div className="flex items-start space-x-2 pt-4">
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
        </ScrollArea>
        
        <DialogFooter className="flex space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            {translations.cancel}
          </Button>
          <Button 
            onClick={handleAccept}
            disabled={!accepted}
          >
            {translations.acceptAndContinue}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsDialog;
