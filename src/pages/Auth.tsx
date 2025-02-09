
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import EmailSignInForm from "./auth/components/EmailSignInForm";
import EmailSignUpForm from "./auth/components/EmailSignUpForm";
import GoogleSignInButton from "./auth/components/GoogleSignInButton";
import { Button } from "@/components/ui/button";

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            {mode === 'signin' ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {mode === 'signin' 
              ? "Sign in to your account to continue" 
              : "Sign up for a new account"}
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          {mode === 'signin' ? (
            <>
              <EmailSignInForm onSuccess={() => navigate("/")} />
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Button
                  variant="link"
                  className="font-medium text-primary hover:text-primary/90 p-0"
                  onClick={() => setMode('signup')}
                >
                  Sign up
                </Button>
              </p>
            </>
          ) : (
            <>
              <EmailSignUpForm email="" password="" />
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Button
                  variant="link"
                  className="font-medium text-primary hover:text-primary/90 p-0"
                  onClick={() => setMode('signin')}
                >
                  Sign in
                </Button>
              </p>
            </>
          )}
          
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
          
          <GoogleSignInButton />
        </div>
      </div>
    </div>
  );
};

export default Auth;
