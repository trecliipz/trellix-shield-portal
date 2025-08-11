
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logClientError } from '@/lib/logger';

interface ErrorState {
  hasError: boolean;
  errorMessage: string;
  retryCount: number;
}

export const useErrorHandling = () => {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    errorMessage: '',
    retryCount: 0
  });
  const { toast } = useToast();

  const handleError = useCallback((error: any, customMessage?: string) => {
    const errorMessage = customMessage || 
      (error instanceof Error ? error.message : 'An unexpected error occurred');
    
    console.error('Error occurred:', error);

    // Persist to centralized logger
    try {
      const details = {
        name: error?.name,
        stack: error?.stack,
        raw: String(error)
      };
      logClientError('error', errorMessage, 'useErrorHandling', details);
    } catch {}
    
    setErrorState(prev => ({
      hasError: true,
      errorMessage,
      retryCount: prev.retryCount + 1
    }));

    // Show user-friendly toast
    if (errorMessage.includes('Failed to load user data')) {
      toast({
        title: "Connection Issue",
        description: "Unable to load user data. Retrying automatically...",
        variant: "destructive",
      });
    } else if (errorMessage.includes('database connection lost')) {
      toast({
        title: "Database Connection Lost",
        description: "Reconnecting to database. Please wait...",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  const retryOperation = useCallback(async (operation: () => Promise<any>, maxRetries: number = 3) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await operation();
        setErrorState({ hasError: false, errorMessage: '', retryCount: 0 });
        return result;
      } catch (error) {
        lastError = error;
        console.log(`Retry attempt ${i + 1}/${maxRetries} failed:`, error);
        
        // Wait before retrying (exponential backoff)
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    
    handleError(lastError, `Operation failed after ${maxRetries} attempts`);
    throw lastError;
  }, [handleError]);

  const clearError = useCallback(() => {
    setErrorState({ hasError: false, errorMessage: '', retryCount: 0 });
  }, []);

  return {
    errorState,
    handleError,
    retryOperation,
    clearError
  };
};
