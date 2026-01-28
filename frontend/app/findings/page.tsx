'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { findings } from '@/lib/api';

interface Finding {
  id: string;
  assessment_id: string;
  title: string;
  severity: string;
  category: string;
  status: string;
  cvss_score: number | null;
  affected_component: string;
  description: string;
  created_at: string;
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-600',
  high: 'bg-orange-600',
  medium: 'bg-yellow-600',
  low: 'bg-blue-600',
  info: 'bg-gray-600',
};

const statusColors: Record<string, string> = {
  identified: 'bg-yellow-600',
  confirmed: 'bg-green-600',
  false_positive: 'bg-gray-600',
  remediated: 'bg-blue-600',
};

export default function FindingsPage() {
  const [selectedAssessment, setSelectedAssessment] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: findingsList = [], isLoading } = useQuery({
    queryKey: ['findings', selectedAssessment],
    queryFn: () => selectedAssessment ? findings.list(selectedAssessment) : Promise.resolve([]),
    enabled: !!selectedAssessment,
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => findings.confirm(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['findings'] }),
  });

  const fpMutation = useMutation({
    mutationFn: (id: string) => findings.falsePositive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['findings'] }),
  });

  const filteredFindings = findingsList.filter((f: Finding) =>
    severityFilter === 'all' || f.severity === severityFilter
  );

  const severityCounts = findingsList.reduce((acc: Record<string, number>, f: Finding) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Findings</h1>
          <p className="text-gray-400 mt-1">Document and track vulnerabilities</p>
        </div>
        <Link
          href="/findings/new"
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Finding
        </Link>
      </div>

      {/* Assessment Selector */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Assessment
        </label>
        <input
          type="text"
          placeholder="Enter Assessment ID"
          value={selectedAssessment}
          onChange={(e) => setSelectedAssessment(e.target.value)}
          className="w-full px-4 py-2 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
        />
      </div>

      {/* Severity Summary */}
      {selectedAssessment && findingsList.length > 0 && (
        <div className="grid grid-cols-5 gap-4">
          {['critical', 'high', 'medium', 'low', 'info'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(severityFilter === sev ? 'all' : sev)}
              className={`p-4 rounded-lg text-center transition-all ${
                severityFilter === sev
                  ? `${severityColors[sev]} ring-2 ring-white`
                  : 'bg-dark-200 hover:bg-dark-100'
              }`}
            >
              <p className="text-2xl font-bold text-white">{severityCounts[sev] || 0}</p>
              <p className="text-sm text-gray-300 capitalize">{sev}</p>
            </button>
          ))}
        </div>
      )}

      {/* Findings List */}
      {!selectedAssessment ? (
        <div className="card text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Select an Assessment</h3>
          <p className="text-gray-400">
            Enter an assessment ID above to view its findings.
          </p>
        </div>
      ) : isLoading ? (
        <div className="text-gray-400">Loading findings...</div>
      ) : filteredFindings.length === 0 ? (
        <div className="card text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Findings</h3>
          <p className="text-gray-400 mb-4">
            {severityFilter !== 'all'
              ? `No ${severityFilter} severity findings found.`
              : 'Document vulnerabilities as you discover them.'}
          </p>
          <Link
            href="/findings/new"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Report Finding
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding: Finding) => (
            <div key={finding.id} className="card card-hover">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${severityColors[finding.severity]}`}>
                    {finding.severity.toUpperCase()}
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">{finding.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {finding.category} | {finding.affected_component}
                    </p>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {finding.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {finding.cvss_score !== null && (
                    <span className="text-sm text-gray-400">
                      CVSS: {finding.cvss_score}
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded text-xs font-medium text-white ${statusColors[finding.status]}`}>
                    {finding.status.replace('_', ' ')}
                  </span>
                  {finding.status === 'identified' && (
                    <>
                      <button
                        onClick={() => confirmMutation.mutate(finding.id)}
                        className="p-2 text-green-400 hover:bg-green-400/20 rounded transition-colors"
                        title="Confirm finding"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => fpMutation.mutate(finding.id)}
                        className="p-2 text-red-400 hover:bg-red-400/20 rounded transition-colors"
                        title="Mark as false positive"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OWASP Categories Reference */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">OWASP Top 10 Categories</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            'A01:2021 - Broken Access Control',
            'A02:2021 - Cryptographic Failures',
            'A03:2021 - Injection',
            'A04:2021 - Insecure Design',
            'A05:2021 - Security Misconfiguration',
            'A06:2021 - Vulnerable Components',
            'A07:2021 - Auth Failures',
            'A08:2021 - Integrity Failures',
            'A09:2021 - Logging Failures',
            'A10:2021 - SSRF',
          ].map((cat) => (
            <div key={cat} className="text-gray-400">{cat}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
