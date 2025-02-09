
import { Checkbox } from "@/components/ui/checkbox";

interface TermsCheckboxProps {
  accepted: boolean;
  isVerifying: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const TermsCheckbox = ({ accepted, isVerifying, onCheckedChange }: TermsCheckboxProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox 
        id="terms" 
        checked={accepted}
        disabled={isVerifying}
        onCheckedChange={onCheckedChange}
      />
      <label 
        htmlFor="terms" 
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        I accept the terms and conditions, including the 30-day data retention period, and confirm that I have the legal rights to the content of the uploaded file.
      </label>
    </div>
  );
};

export default TermsCheckbox;
