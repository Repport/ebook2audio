
import { CheckCircle2, XCircle } from "lucide-react";

interface Requirement {
  met: boolean;
  text: string;
}

interface PasswordRequirementsProps {
  password: string;
}

export const PasswordRequirements = ({ password }: PasswordRequirementsProps) => {
  const requirements: Requirement[] = [
    { met: password.length >= 8, text: "At least 8 characters" },
    { met: /[A-Z]/.test(password), text: "One uppercase letter" },
    { met: /[a-z]/.test(password), text: "One lowercase letter" },
    { met: /\d/.test(password), text: "One number" },
    { 
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), 
      text: "One special character" 
    },
  ];

  if (!password) return null;

  return (
    <div className="space-y-2 text-sm">
      {requirements.map((req, index) => (
        <div key={index} className="flex items-center space-x-2">
          {req.met ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <span className={req.met ? "text-green-500" : "text-red-500"}>
            {req.text}
          </span>
        </div>
      ))}
    </div>
  );
};
