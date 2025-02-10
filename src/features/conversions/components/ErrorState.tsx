
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  onRetry: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="text-center py-8 space-y-4">
      <p className="text-red-500">There was an error loading your conversions</p>
      <Button onClick={onRetry} className="gap-2">
        Try Again
      </Button>
    </div>
  );
}

