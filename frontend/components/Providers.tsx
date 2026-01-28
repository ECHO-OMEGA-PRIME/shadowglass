'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { AuthProvider } from '@/lib/AuthContext';
import { ErrorBoundary } from './ErrorBoundary';
import { PageLoading } from './LoadingSpinner';
import { isEnvironmentReady, logValidationResults, validateEnvironment } from '@/lib/env-validation';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Create QueryClient with proper configuration
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data considered fresh for 1 minute
            staleTime: 60 * 1000,
            // Cache data for 5 minutes
            gcTime: 5 * 60 * 1000,
            // Retry failed queries up to 3 times
            retry: 3,
            // Exponential backoff
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Don't refetch on window focus in development
            refetchOnWindowFocus: process.env.NODE_ENV === 'production',
          },
          mutations: {
            // Retry mutations once
            retry: 1,
          },
        },
      })
  );

  // Validate environment on mount
  useEffect(() => {
    const init = async () => {
      try {
        const result = validateEnvironment();
        logValidationResults(result);

        if (!result.valid) {
          setInitError(result.errors.join(', '));
          return;
        }

        setIsReady(true);
      } catch (error) {
        console.error('Initialization error:', error);
        setInitError(error instanceof Error ? error.message : 'Initialization failed');
      }
    };

    init();
  }, []);

  // Show loading state while initializing
  if (!isReady && !initError) {
    return <PageLoading />;
  }

  // Show error state if initialization failed
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-100 p-6">
        <div className="max-w-md w-full bg-dark-200 rounded-lg p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-600/20 mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Configuration Error
            </h1>
            <p className="text-gray-400 mb-4">{initError}</p>
            <p className="text-gray-500 text-sm">
              Please check your environment configuration and try again.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
