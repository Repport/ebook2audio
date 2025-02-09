
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";

interface FormFieldsProps {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  disabled?: boolean;
  showPasswordRequirements?: boolean;
}

export const validatePassword = (password: string) => {
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
    minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar,
  };
};

const FormFields = ({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  disabled = false,
  showPasswordRequirements = false,
}: FormFieldsProps) => {
  const passwordValidation = validatePassword(password);

  return (
    <>
      <div>
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required
          disabled={disabled}
          className="w-full"
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          required
          disabled={disabled}
          className="w-full"
        />
        {showPasswordRequirements && (
          <div className="mt-2 text-sm space-y-1">
            <p className="text-muted-foreground flex items-center gap-1">
              <Info className="h-4 w-4" /> Password requirements:
            </p>
            <ul className="space-y-1 text-sm pl-5">
              <li className={passwordValidation.minLength ? "text-green-500" : "text-red-500"}>
                At least 8 characters long
              </li>
              <li className={passwordValidation.hasUpperCase ? "text-green-500" : "text-red-500"}>
                At least one uppercase letter
              </li>
              <li className={passwordValidation.hasLowerCase ? "text-green-500" : "text-red-500"}>
                At least one lowercase letter
              </li>
              <li className={passwordValidation.hasNumbers ? "text-green-500" : "text-red-500"}>
                At least one number
              </li>
              <li className={passwordValidation.hasSpecialChar ? "text-green-500" : "text-red-500"}>
                At least one special character
              </li>
            </ul>
          </div>
        )}
      </div>
    </>
  );
};

export default FormFields;
