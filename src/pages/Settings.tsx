
import AccountSettings from "@/components/AccountSettings";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      navigate("/auth", { state: { from: location } });
    }
  }, [user, navigate, location]);

  if (!user) {
    return null;
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
      <AccountSettings />
    </div>
  );
};

export default Settings;
