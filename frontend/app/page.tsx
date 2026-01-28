'use client';

import { useQuery } from '@tanstack/react-query';
import { Shield, Target, AlertTriangle, FileText, Radio } from 'lucide-react';
import Link from 'next/link';

interface ApiStats {
  total_techniques: number;
  search_engines: string[];
  api_version: string;
  capabilities: string[];
}

async function fetchStats(): Promise<ApiStats> {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

function StatCard({
  title,
  value,
  icon: Icon,
  href,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  href: string;
  color: string;
}) {
  return (
    <Link href={href} className="card card-hover">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Security Assessment Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Professional Penetration Testing Toolkit | McWilliams Security Consulting
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Assessments"
          value="0"
          icon={Shield}
          href="/assessments"
          color="bg-green-600"
        />
        <StatCard
          title="In-Scope Targets"
          value="0"
          icon={Target}
          href="/targets"
          color="bg-blue-600"
        />
        <StatCard
          title="Findings"
          value="0"
          icon={AlertTriangle}
          href="/findings"
          color="bg-yellow-600"
        />
        <StatCard
          title="Reports"
          value="0"
          icon={FileText}
          href="/reports"
          color="bg-purple-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/assessments/new"
            className="flex items-center p-4 bg-dark-200 rounded-lg hover:bg-dark-300 transition-colors"
          >
            <Shield className="h-8 w-8 text-primary-500 mr-3" />
            <div>
              <p className="font-medium text-white">New Assessment</p>
              <p className="text-sm text-gray-400">Start a new pentest engagement</p>
            </div>
          </Link>

          <Link
            href="/osint"
            className="flex items-center p-4 bg-dark-200 rounded-lg hover:bg-dark-300 transition-colors"
          >
            <Radio className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="font-medium text-white">OSINT Research</p>
              <p className="text-sm text-gray-400">Email, phone, username lookup</p>
            </div>
          </Link>

          <Link
            href="/findings/new"
            className="flex items-center p-4 bg-dark-200 rounded-lg hover:bg-dark-300 transition-colors"
          >
            <AlertTriangle className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="font-medium text-white">Report Finding</p>
              <p className="text-sm text-gray-400">Document a vulnerability</p>
            </div>
          </Link>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Status */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">API Status</h2>
          {isLoading ? (
            <p className="text-gray-400">Loading...</p>
          ) : stats ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Version</span>
                <span className="text-white">{stats.api_version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Evasion Techniques</span>
                <span className="text-white">{stats.total_techniques}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Search Engines</span>
                <span className="text-white">{stats.search_engines.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className="text-green-400">Operational</span>
              </div>
            </div>
          ) : (
            <p className="text-red-400">Failed to connect to API</p>
          )}
        </div>

        {/* Compliance Frameworks */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Compliance Frameworks</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
              <span className="text-white">PTES - Penetration Testing Execution Standard</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
              <span className="text-white">OWASP Testing Guide v4.2</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
              <span className="text-white">NIST SP 800-115</span>
            </div>
          </div>
        </div>
      </div>

      {/* Authorization Notice */}
      <div className="card bg-primary-900/20 border-primary-700">
        <div className="flex items-start">
          <Shield className="h-6 w-6 text-primary-500 mr-3 mt-0.5" />
          <div>
            <h3 className="font-semibold text-white">Authorization Required</h3>
            <p className="text-gray-300 text-sm mt-1">
              This toolkit is for <strong>AUTHORIZED</strong> security assessments only.
              All testing activities must be covered by a signed Statement of Work (SOW)
              and Rules of Engagement (ROE). Unauthorized testing is prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
