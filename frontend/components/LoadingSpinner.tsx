'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export function LoadingSpinner({
  size = 'md',
  text,
  fullScreen = false,
  className = '',
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-primary-500 animate-spin`} />
      {text && <p className="mt-2 text-gray-400 text-sm">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-dark-100/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * Full page loading state for route transitions
 */
export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="xl" text="Loading..." />
    </div>
  );
}

/**
 * Card skeleton for loading states
 */
export function CardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 bg-dark-200 rounded w-3/4 mb-4" />
      <div className="h-3 bg-dark-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-dark-200 rounded w-2/3" />
    </div>
  );
}

/**
 * Table row skeleton for loading states
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-dark-200 rounded" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Skeleton grid for card layouts
 */
export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
