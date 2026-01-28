'use client';

import { useQuery } from '@tanstack/react-query';
import { Shield, Plus } from 'lucide-react';
import Link from 'next/link';
import { assessments, Assessment } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { LoadingSpinner, CardSkeleton } from '@/components/LoadingSpinner';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-600',
  active: 'bg-green-600',
  paused: 'bg-yellow-600',
  completed: 'bg-blue-600',
  archived: 'bg-gray-500',
};

export default function AssessmentsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?reason=required&returnUrl=/assessments');
    }
  }, [authLoading, isAuthenticated, router]);

  const { data: assessmentsList = [], isLoading, error } = useQuery({
    queryKey: ['assessments'],
    queryFn: assessments.list,
    enabled: isAuthenticated, // Only fetch when authenticated
  });

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    );
  }

  // Don't render content if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Assessments</h1>
          <p className="text-gray-400 mt-1">Manage security assessment engagements</p>
        </div>
        <Link
          href="/assessments/new"
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Assessment
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-400">
            Failed to load assessments: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}

      {/* Assessments List */}
      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : assessmentsList.length === 0 ? (
        <div className="card text-center py-12">
          <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Assessments Yet</h3>
          <p className="text-gray-400 mb-4">
            Create your first security assessment to get started.
          </p>
          <Link
            href="/assessments/new"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Assessment
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {assessmentsList.map((assessment: Assessment) => (
            <Link
              key={assessment.id}
              href={`/assessments/${assessment.id}`}
              className="card card-hover"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-dark-200 rounded-lg">
                    <Shield className="h-6 w-6 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{assessment.name}</h3>
                    <p className="text-sm text-gray-400">{assessment.client_name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Targets</p>
                    <p className="font-medium text-white">{assessment.target_count}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Findings</p>
                    <p className="font-medium text-white">{assessment.finding_count}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Methodology</p>
                    <p className="font-medium text-white">{assessment.methodology}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusColors[assessment.status] || 'bg-gray-600'}`}
                  >
                    {assessment.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
