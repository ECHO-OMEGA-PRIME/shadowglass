'use client';

import { useQuery } from '@tanstack/react-query';
import { Radio, CheckCircle, XCircle, Zap, Shield, Globe, Lock } from 'lucide-react';
import Link from 'next/link';
import { prometheus } from '@/lib/api';

interface PrometheusHealth {
  status: string;
  version: string;
  uptime: number;
}

interface PrometheusCapabilities {
  osint: string[];
  recon: string[];
  scanning: string[];
}

export default function PrometheusPage() {
  const { data: health, isLoading: healthLoading, error: healthError } = useQuery({
    queryKey: ['prometheus-health'],
    queryFn: prometheus.health,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: capabilities } = useQuery({
    queryKey: ['prometheus-capabilities'],
    queryFn: prometheus.capabilities,
  });

  const isOnline = health?.status === 'healthy';

  const toolCategories = [
    {
      name: 'Email Intelligence',
      icon: Globe,
      tools: [
        { name: 'Holehe', description: 'Check email across 100+ services' },
        { name: 'Hunter.io', description: 'Find emails associated with domain' },
      ],
    },
    {
      name: 'Username Search',
      icon: Shield,
      tools: [
        { name: 'Sherlock', description: 'Search 300+ social networks' },
        { name: 'Maigret', description: 'Advanced username enumeration' },
      ],
    },
    {
      name: 'Domain Recon',
      icon: Globe,
      tools: [
        { name: 'Subfinder', description: 'Subdomain discovery' },
        { name: 'DNS Lookup', description: 'A, MX, TXT, NS records' },
        { name: 'WHOIS', description: 'Domain registration info' },
      ],
    },
    {
      name: 'Network Scanning',
      icon: Zap,
      tools: [
        { name: 'Port Scanner', description: 'TCP/UDP port scanning' },
        { name: 'Nuclei', description: 'Vulnerability templates' },
      ],
    },
    {
      name: 'Phone Intelligence',
      icon: Lock,
      tools: [
        { name: 'PhoneInfoga', description: 'Phone number reconnaissance' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Prometheus Prime</h1>
          <p className="text-gray-400 mt-1">OSINT & Reconnaissance Platform</p>
        </div>
        <Link
          href="/osint"
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Radio className="h-5 w-5 mr-2" />
          Launch OSINT
        </Link>
      </div>

      {/* Connection Status */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg mr-4 ${isOnline ? 'bg-green-600/20' : 'bg-red-600/20'}`}>
              <Radio className={`h-6 w-6 ${isOnline ? 'text-green-400' : 'text-red-400'}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Connection Status</h2>
              <p className="text-gray-400">192.168.1.202:8370</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {healthLoading ? (
              <span className="text-gray-400">Checking...</span>
            ) : healthError ? (
              <div className="flex items-center text-red-400">
                <XCircle className="h-5 w-5 mr-2" />
                Offline
              </div>
            ) : (
              <>
                <div className="flex items-center text-green-400">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Online
                </div>
                {health?.version && (
                  <span className="text-gray-400">v{health.version}</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {capabilities && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-3xl font-bold text-white">
              {capabilities.osint?.length || 0}
            </p>
            <p className="text-gray-400">OSINT Tools</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-white">
              {capabilities.recon?.length || 0}
            </p>
            <p className="text-gray-400">Recon Tools</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-white">
              {capabilities.scanning?.length || 0}
            </p>
            <p className="text-gray-400">Scan Tools</p>
          </div>
        </div>
      )}

      {/* Tool Categories */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Available Tools</h2>
        {toolCategories.map((category) => (
          <div key={category.name} className="card">
            <div className="flex items-center mb-4">
              <category.icon className="h-5 w-5 text-primary-500 mr-3" />
              <h3 className="font-semibold text-white">{category.name}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {category.tools.map((tool) => (
                <div
                  key={tool.name}
                  className="p-3 bg-dark-200 rounded-lg"
                >
                  <p className="font-medium text-white">{tool.name}</p>
                  <p className="text-sm text-gray-400">{tool.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* API Documentation */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">API Documentation</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-dark-200 rounded-lg">
            <div>
              <p className="font-medium text-white">Interactive Docs</p>
              <p className="text-sm text-gray-400">Swagger UI documentation</p>
            </div>
            <a
              href="http://192.168.1.202:8370/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Open Docs
            </a>
          </div>
          <div className="flex items-center justify-between p-3 bg-dark-200 rounded-lg">
            <div>
              <p className="font-medium text-white">ReDoc</p>
              <p className="text-sm text-gray-400">Alternative documentation</p>
            </div>
            <a
              href="http://192.168.1.202:8370/redoc"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-dark-100 text-white rounded-lg hover:bg-dark-300 transition-colors"
            >
              Open ReDoc
            </a>
          </div>
        </div>
      </div>

      {/* Authorization Warning */}
      <div className="card bg-red-900/20 border-red-700">
        <div className="flex items-start">
          <Shield className="h-6 w-6 text-red-500 mr-3 mt-0.5" />
          <div>
            <h3 className="font-semibold text-white">Scope Enforcement Active</h3>
            <p className="text-gray-300 text-sm mt-1">
              All reconnaissance and scanning operations require targets to be
              <strong className="text-white"> explicitly in-scope</strong> for an active assessment.
              Unauthorized scanning attempts are blocked and logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
