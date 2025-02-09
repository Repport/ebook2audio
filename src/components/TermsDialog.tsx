
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

interface TermsDialogProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
  fileName?: string;
  fileType?: string;
}

const TermsDialog = ({ open, onClose, onAccept, fileName, fileType }: TermsDialogProps) => {
  const [accepted, setAccepted] = React.useState(false);

  const handleAccept = () => {
    if (accepted) {
      onAccept();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Notice and Terms of Use</DialogTitle>
          <DialogDescription>
            Before proceeding with the conversion of your file to audio, you must accept the following terms
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-2">1. User Responsibility</h3>
              <p className="text-sm text-muted-foreground">
                You declare and guarantee that you have the legal rights to use, process, and convert the content of the file you are uploading.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">2. Copyright Compliance</h3>
              <p className="text-sm text-muted-foreground">
                Uploading copyrighted content without explicit authorization from the rights holder is strictly prohibited. 
                The user is solely responsible for any infringement.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">3. Liability Disclaimer</h3>
              <p className="text-sm text-muted-foreground">
                Our service does not review or monitor the content of uploaded files. We assume no responsibility 
                for the misuse of the service or any legal claims arising from the processed content.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">4. File Retention Policy</h3>
              <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                <li>The uploaded files and generated audio will be retained for 30 days for support and claim purposes.</li>
                <li>After this period, all files will be automatically deleted and will no longer be accessible.</li>
                <li>Users can request early deletion by contacting our support team.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">5. Privacy Policy</h3>
              <p className="text-sm text-muted-foreground">
                Your files are stored securely and are not shared with third parties. Please refer to our privacy 
                policy for more details.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">6. Terms of Use</h3>
              <p className="text-sm text-muted-foreground">
                We reserve the right to suspend or terminate access to this service in case of misuse or violation 
                of these terms.
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
                I accept the terms and conditions and confirm that I have the legal rights to the content of the uploaded file.
              </label>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleAccept}
            disabled={!accepted}
          >
            Accept and Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsDialog;
