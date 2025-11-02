import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingState = ({ 
  message = "Loading...",
  fullScreen = false 
}: LoadingStateProps) => {
  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-8 text-center">
      <CardContent>
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
};
