'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // TODO: Log to error tracking service (e.g., Sentry)
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-dark-100 p-6">
          <div className="max-w-md w-full bg-dark-200 rounded-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-600/20 rounded-full">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-400 mb-6">
              An unexpected error occurred. Please try again or contact support
              if the problem persists.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-dark-300 rounded-lg text-left overflow-auto max-h-48">
                <p className="text-red-400 font-mono text-sm">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="text-gray-500 font-mono text-xs mt-2 whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center px-4 py-3 bg-dark-300 text-white rounded-lg hover:bg-dark-400 transition-colors"
              >
                <Home className="h-5 w-5 mr-2" />
                Go Home
              </button>
            </div>

            <p className="text-gray-500 text-sm mt-6">
              Error ID: {Date.now().toString(36)}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional component wrapper for ErrorBoundary
 */
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ErrorBoundaryWrapper({
  children,
  fallback,
}: ErrorBoundaryWrapperProps): JSX.Element {
  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
}

/**
 * Hook-friendly error boundary using suspense-like pattern
 */
export function useErrorHandler(): (error: Error) => void {
  return (error: Error) => {
    throw error;
  };
}
