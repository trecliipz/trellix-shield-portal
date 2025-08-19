import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Bug, Home } from 'lucide-react';
import { logClientError } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `boundary-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || `boundary-${Date.now()}`;
    
    // Log to our centralized error system
    logClientError('error', `React Error Boundary: ${error.message}`, 'ErrorBoundary', {
      errorId,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });

    // Log additional context
    console.error('ErrorBoundary caught an error:', {
      error,
      errorInfo,
      errorId,
      location: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    this.setState({
      error,
      errorInfo,
      errorId
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <CardDescription className="text-base">
                We encountered an unexpected error. Our team has been notified and is working on a fix.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error ID for support */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Bug className="h-4 w-4" />
                  <span className="font-medium">Error ID:</span>
                </div>
                <code className="text-sm font-mono">{this.state.errorId}</code>
                <p className="text-sm text-muted-foreground mt-2">
                  Please include this ID when contacting support.
                </p>
              </div>

              {/* Development error details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-destructive/10 p-4 rounded-lg">
                  <summary className="cursor-pointer font-medium text-destructive mb-2">
                    Developer Information (Click to expand)
                  </summary>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Error:</strong>
                      <pre className="whitespace-pre-wrap mt-1 text-xs">
                        {this.state.error.message}
                      </pre>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="whitespace-pre-wrap mt-1 text-xs font-mono overflow-auto max-h-40">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1 text-xs font-mono overflow-auto max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={this.handleRetry} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Home
                </Button>
                <Button onClick={this.handleReload} variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
              </div>

              {/* Additional help */}
              <div className="text-center text-sm text-muted-foreground">
                <p>If this problem persists, please contact our support team.</p>
                <p className="mt-1">
                  <a 
                    href="mailto:support@trellix.com" 
                    className="text-primary hover:underline"
                  >
                    support@trellix.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default ErrorBoundary;