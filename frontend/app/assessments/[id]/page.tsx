'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  Shield, Target, AlertTriangle, FileText, Play, Pause, CheckCircle,
  ArrowLeft, Trash2, Plus, Radio
} from 'lucide-react';
import Link from 'next/link';
import { assessments, targets, findings } from '@/lib/api';

interface Assessment {
  id: string;
  name: string;
  client_name: string;
  status: string;
  methodology: string;
  scope_description: string;
  start_date: string | null;
  end_date: string | null;
  target_count: number;
  finding_count: number;
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-600',
  active: 'bg-green-600',
  paused: 'bg-yellow-600',
  completed: 'bg-blue-600',
  archived: 'bg-gray-500',
};

const severityColors: Record<string, string> = {
  critical: 'bg-red-600',
  high: 'bg-orange-600',
  medium: 'bg-yellow-600',
  low: 'bg-blue-600',
  info: 'bg-gray-600',
};

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const assessmentId = params.id as string;

  const { data: assessment, isLoading } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => assessments.get(assessmentId),
  });

  const { data: targetList = [] } = useQuery({
    queryKey: ['targets', assessmentId],
    queryFn: () => targets.list(assessmentId),
  });

  const { data: findingsList = [] } = useQuery({
    queryKey: ['findings', assessmentId],
    queryFn: () => findings.list(assessmentId),
  });

  const { data: stats } = useQuery({
    queryKey: ['assessment-stats', assessmentId],
    queryFn: () => assessments.stats(assessmentId),
  });

  const activateMutation = useMutation({
    mutationFn: () => assessments.activate(assessmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assessment'] }),
  });

  const pauseMutation = useMutation({
    mutationFn: () => assessments.pause(assessmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assessment'] }),
  });

  const completeMutation = useMutation({
    mutationFn: () => assessments.complete(assessmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assessment'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => assessments.delete(assessmentId),
    onSuccess: () => router.push('/assessments'),
  });

  if (isLoading) {
    return <div className="text-gray-400">Loading assessment...</div>;
  }

  if (!assessment) {
    return (
      <div className="card text-center py-12">
        <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Assessment Not Found</h3>
        <Link href="/assessments" className="text-primary-500 hover:underline">
          Back to Assessments
        </Link>
      </div>
    );
  }

  const severityCounts = findingsList.reduce((acc: Record<string, number>, f: any) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/assessments"
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{assessment.name}</h1>
            <p className="text-gray-400">{assessment.client_name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${statusColors[assessment.status]}`}>
            {assessment.status.toUpperCase()}
          </span>
          {assessment.status === 'draft' && (
            <button
              onClick={() => activateMutation.mutate()}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Play className="h-4 w-4 mr-2" />
              Activate
            </button>
          )}
          {assessment.status === 'active' && (
            <>
              <button
                onClick={() => pauseMutation.mutate()}
                className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </button>
              <button
                onClick={() => completeMutation.mutate()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete
              </button>
            </>
          )}
          {assessment.status === 'paused' && (
            <button
              onClick={() => activateMutation.mutate()}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Play className="h-4 w-4 mr-2" />
              Resume
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-white">{targetList.length}</p>
              <p className="text-gray-400">Targets</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-white">{findingsList.length}</p>
              <p className="text-gray-400">Findings</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-white">{severityCounts.critical || 0}</p>
              <p className="text-gray-400">Critical</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-primary-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-white">{assessment.methodology}</p>
              <p className="text-gray-400">Methodology</p>
            </div>
          </div>
        </div>
      </div>

      {/* Severity Breakdown */}
      {findingsList.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Findings by Severity</h2>
          <div className="flex space-x-4">
            {['critical', 'high', 'medium', 'low', 'info'].map((sev) => (
              <div key={sev} className="flex-1 text-center">
                <div className={`h-2 rounded-full ${severityColors[sev]} mb-2`} />
                <p className="text-2xl font-bold text-white">{severityCounts[sev] || 0}</p>
                <p className="text-sm text-gray-400 capitalize">{sev}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href={`/osint?assessment=${assessmentId}`}
          className="card card-hover flex items-center"
        >
          <Radio className="h-8 w-8 text-blue-500 mr-4" />
          <div>
            <p className="font-medium text-white">OSINT Research</p>
            <p className="text-sm text-gray-400">Run recon via Prometheus</p>
          </div>
        </Link>
        <Link
          href="/findings/new"
          className="card card-hover flex items-center"
        >
          <Plus className="h-8 w-8 text-yellow-500 mr-4" />
          <div>
            <p className="font-medium text-white">New Finding</p>
            <p className="text-sm text-gray-400">Document a vulnerability</p>
          </div>
        </Link>
        <Link
          href={`/reports?assessment=${assessmentId}`}
          className="card card-hover flex items-center"
        >
          <FileText className="h-8 w-8 text-primary-500 mr-4" />
          <div>
            <p className="font-medium text-white">Generate Report</p>
            <p className="text-sm text-gray-400">Export findings</p>
          </div>
        </Link>
      </div>

      {/* Assessment Details */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Assessment Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400">Created</p>
            <p className="text-white">{new Date(assessment.created_at).toLocaleDateString()}</p>
          </div>
          {assessment.start_date && (
            <div>
              <p className="text-sm text-gray-400">Start Date</p>
              <p className="text-white">{new Date(assessment.start_date).toLocaleDateString()}</p>
            </div>
          )}
          {assessment.end_date && (
            <div>
              <p className="text-sm text-gray-400">End Date</p>
              <p className="text-white">{new Date(assessment.end_date).toLocaleDateString()}</p>
            </div>
          )}
          <div className="col-span-2">
            <p className="text-sm text-gray-400">Scope Description</p>
            <p className="text-white">{assessment.scope_description || 'No scope description provided.'}</p>
          </div>
        </div>
      </div>

      {/* Recent Targets */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Targets</h2>
          <Link
            href={`/targets?assessment=${assessmentId}`}
            className="text-primary-500 hover:underline text-sm"
          >
            View All
          </Link>
        </div>
        {targetList.length === 0 ? (
          <p className="text-gray-400">No targets added yet.</p>
        ) : (
          <div className="space-y-2">
            {targetList.slice(0, 5).map((target: any) => (
              <div key={target.id} className="flex items-center justify-between p-3 bg-dark-200 rounded-lg">
                <span className="font-mono text-white">{target.value}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
                  target.scope_status === 'in_scope' ? 'bg-green-600' :
                  target.scope_status === 'out_of_scope' ? 'bg-red-600' : 'bg-yellow-600'
                }`}>
                  {target.scope_status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Findings */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Findings</h2>
          <Link
            href={`/findings?assessment=${assessmentId}`}
            className="text-primary-500 hover:underline text-sm"
          >
            View All
          </Link>
        </div>
        {findingsList.length === 0 ? (
          <p className="text-gray-400">No findings reported yet.</p>
        ) : (
          <div className="space-y-2">
            {findingsList.slice(0, 5).map((finding: any) => (
              <div key={finding.id} className="flex items-center justify-between p-3 bg-dark-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium text-white ${severityColors[finding.severity]}`}>
                    {finding.severity.toUpperCase()}
                  </span>
                  <span className="text-white">{finding.title}</span>
                </div>
                <span className="text-gray-400 text-sm">{finding.category}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="card border-red-700">
        <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white">Delete Assessment</p>
            <p className="text-sm text-gray-400">This action cannot be undone.</p>
          </div>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this assessment?')) {
                deleteMutation.mutate();
              }
            }}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
