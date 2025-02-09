
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FcGoogle } from "react-icons/fc";
import { useEmailAuth } from "@/hooks/useEmailAuth";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { PasswordRequirements } from "./PasswordRequirements";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export const AuthForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { loading, handleEmailSignIn, handleEmailSignUp } = useEmailAuth();
  const { handleGoogleSignIn } = useGoogleAuth();
  const { toast } = useToast();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && !acceptedTerms) {
      toast({
        title: "Terms and Conditions",
        description: "Please accept the terms and conditions to continue.",
        variant: "destructive",
      });
      return;
    }
    
    if (isSignUp) {
      handleEmailSignUp(email, password);
    } else {
      handleEmailSignIn(email, password);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={onSubmit}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full"
          />
          {isSignUp && <PasswordRequirements password={password} />}
        </div>
        {isSignUp && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
            />
            <label
              htmlFor="terms"
              className="text-sm text-muted-foreground"
            >
              I accept the terms and conditions
            </label>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Button
          type="submit"
          className="w-full"
          disabled={loading || (isSignUp && !acceptedTerms)}
        >
          {loading ? "Processing..." : (isSignUp ? "Sign up" : "Sign in")}
        </Button>
        <Button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setAcceptedTerms(false);
          }}
          variant="outline"
          className="w-full"
          disabled={loading}
        >
          {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          className="w-full"
          disabled={loading}
        >
          <FcGoogle className="mr-2 h-4 w-4" />
          Google
        </Button>
      </div>
    </form>
  );
};
