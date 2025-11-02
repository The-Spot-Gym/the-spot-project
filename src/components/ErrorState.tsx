import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorState = ({ 
  title = "Something went wrong",
  message = "An error occurred. Please try again.",
  onRetry,
  retryLabel = "Try Again"
}: ErrorStateProps) => {
  return (
    <Card className="p-8 text-center">
      <CardContent>
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            {retryLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
