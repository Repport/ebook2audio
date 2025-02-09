
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormFieldsProps {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  disabled?: boolean;
}

const FormFields = ({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  disabled = false,
}: FormFieldsProps) => {
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
      </div>
    </>
  );
};

export default FormFields;
