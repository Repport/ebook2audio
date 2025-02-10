
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function EmptyState() {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-8 space-y-4">
      <p className="text-gray-500">You haven't converted any files yet</p>
      <Button onClick={() => navigate("/")} className="gap-2">
        Create Your First Conversion
      </Button>
    </div>
  );
}

