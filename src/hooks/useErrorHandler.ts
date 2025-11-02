import { useToast } from "@/hooks/use-toast";

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = (error: any, customMessage?: string) => {
    console.error('Error:', error);
    
    const message = customMessage || 
      error?.message || 
      'An unexpected error occurred. Please try again.';

    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  };

  const handleSuccess = (message: string, description?: string) => {
    toast({
      title: message,
      description,
    });
  };

  return {
    handleError,
    handleSuccess,
  };
};
