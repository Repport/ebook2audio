
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

interface TermsDialogProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const TermsDialog = ({ open, onClose, onAccept }: TermsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
          <DialogDescription>
            Please read these terms carefully before accepting
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            <section>
              <h3 className="text-lg font-semibold">1. Acceptance of Terms</h3>
              <p className="text-sm text-muted-foreground">
                By accessing and using our services, you agree to be bound by these Terms and Conditions, our Privacy Policy, and any additional terms and conditions that may apply.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">2. User Responsibilities</h3>
              <p className="text-sm text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">3. Intellectual Property Rights</h3>
              <p className="text-sm text-muted-foreground">
                All content, including but not limited to text, graphics, logos, and software, is the property of our company and is protected by intellectual property laws. You may not use, reproduce, or distribute any content without our explicit permission.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">4. Service Usage</h3>
              <p className="text-sm text-muted-foreground">
                Our text-to-speech conversion service is provided "as is." You agree to use the service only for lawful purposes and in accordance with these terms. Any abuse or excessive use of the service may result in temporary or permanent suspension of your account.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">5. Data Privacy</h3>
              <p className="text-sm text-muted-foreground">
                We collect and process your data in accordance with our Privacy Policy. By using our service, you consent to such processing and you warrant that all data provided by you is accurate.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">6. Limitations of Liability</h3>
              <p className="text-sm text-muted-foreground">
                We shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">7. Modifications to Service</h3>
              <p className="text-sm text-muted-foreground">
                We reserve the right to modify or discontinue, temporarily or permanently, the service with or without notice. We shall not be liable to you or to any third party for any modification, suspension, or discontinuance of the service.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">8. Governing Law</h3>
              <p className="text-sm text-muted-foreground">
                These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which our company operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">9. Changes to Terms</h3>
              <p className="text-sm text-muted-foreground">
                We reserve the right to update these terms at any time. We will notify you of any changes by posting the new terms on this site. Continued use of the service after such modifications constitutes your acceptance of the modified terms.
              </p>
            </section>
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onAccept}>Accept Terms</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsDialog;

