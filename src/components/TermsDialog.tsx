
import React from 'react';
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

interface TermsDialogProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const TermsDialog = ({ open, onClose, onAccept }: TermsDialogProps) => {
  const [accepted, setAccepted] = React.useState(false);

  const handleAccept = () => {
    if (accepted) {
      onAccept();
      onClose();
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
              <span className="font-semibold">Liability Disclaimer:</span> Our service does not store, review, or monitor the content of uploaded files. We assume no responsibility for the misuse of the service or any legal claims arising from the processed content.
            </li>
            <li className="text-sm">
              <span className="font-semibold">Privacy Policy:</span> Uploaded files and generated audio may be automatically deleted after a set period. Please refer to our <Link to="/privacy" className="text-blue-600 hover:underline" target="_blank">privacy policy</Link> for more details.
            </li>
            <li className="text-sm">
              <span className="font-semibold">Terms of Use:</span> We reserve the right to suspend or terminate access to this service in case of misuse or violation of these terms.
            </li>
          </ol>
        </div>
        <div className="flex items-center space-x-2">
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
        <DialogFooter>
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
