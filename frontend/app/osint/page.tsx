'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Search, Mail, Phone, User, Globe, Radio, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { prometheus, OsintResult } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';

type OsintType = 'email' | 'phone' | 'username' | 'subdomain';

interface SearchType {
  id: OsintType;
  name: string;
  icon: React.ElementType;
  placeholder: string;
}

const searchTypes: SearchType[] = [
  { id: 'email', name: 'Email', icon: Mail, placeholder: 'user@example.com' },
  { id: 'phone', name: 'Phone', icon: Phone, placeholder: '+1234567890' },
  { id: 'username', name: 'Username', icon: User, placeholder: 'johndoe' },
  { id: 'subdomain', name: 'Subdomain', icon: Globe, placeholder: 'example.com' },
];

export default function OsintPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [searchType, setSearchType] = useState<OsintType>('email');
  const [target, setTarget] = useState('');
  const [results, setResults] = useState<OsintResult | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?reason=required&returnUrl=/osint');
    }
  }, [authLoading, isAuthenticated, router]);

  const mutation = useMutation({
    mutationFn: async (): Promise<OsintResult> => {
      // Map search type to API call
      switch (searchType) {
        case 'email':
          return prometheus.email.holehe('', target);
        case 'phone':
          return prometheus.phone('', target);
        case 'username':
          return prometheus.username.sherlock('', target);
        case 'subdomain':
          return prometheus.recon.subdomains('', target);
        default:
          throw new Error('Invalid search type');
      }
    },
    onSuccess: (data) => setResults(data),
    onError: (error) => {
      setResults({
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
        timestamp: new Date().toISOString(),
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim()) return;
    mutation.mutate();
  };

  const currentType = searchTypes.find((t) => t.id === searchType) || searchTypes[0];

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
      <div>
        <h1 className="text-3xl font-bold text-white">OSINT Research</h1>
        <p className="text-gray-400 mt-1">
          Open Source Intelligence via Prometheus Prime
        </p>
      </div>

      {/* Search Form */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Search Target</h2>

        {/* Search Type Tabs */}
        <div className="flex space-x-2 mb-4">
          {searchTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setSearchType(type.id);
                setTarget('');
                setResults(null);
              }}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchType === type.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-200 text-gray-300 hover:bg-dark-300'
              }`}
            >
              <type.icon className="h-4 w-4 mr-2" />
              {type.name}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={currentType.placeholder}
              className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={mutation.isPending || !target.trim()}
            className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Search
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results */}
      {results && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Results</h2>
            <span className="text-sm text-gray-400">{results.timestamp}</span>
          </div>

          {results.success ? (
            <div className="space-y-4">
              {results.results ? (
                <pre className="p-4 bg-dark-200 rounded-lg overflow-auto max-h-96 text-sm text-gray-300">
                  {JSON.stringify(results.results, null, 2)}
                </pre>
              ) : (
                <div className="flex items-center text-green-400">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Search completed - no results found
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center text-red-400">
              <AlertCircle className="h-5 w-5 mr-2" />
              {results.error || 'Search failed'}
            </div>
          )}
        </div>
      )}

      {/* Prometheus Status */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Radio className="h-5 w-5 text-primary-500 mr-3" />
            <div>
              <h3 className="font-medium text-white">Prometheus Prime</h3>
              <p className="text-sm text-gray-400">192.168.1.202:8370</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
            Connected
          </span>
        </div>
      </div>

      {/* Available Tools */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Available OSINT Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-dark-200 rounded-lg">
            <h3 className="font-medium text-white">Holehe</h3>
            <p className="text-sm text-gray-400">Check email across 100+ services</p>
          </div>
          <div className="p-4 bg-dark-200 rounded-lg">
            <h3 className="font-medium text-white">PhoneInfoga</h3>
            <p className="text-sm text-gray-400">Phone number reconnaissance</p>
          </div>
          <div className="p-4 bg-dark-200 rounded-lg">
            <h3 className="font-medium text-white">Sherlock</h3>
            <p className="text-sm text-gray-400">Username search across 300+ sites</p>
          </div>
          <div className="p-4 bg-dark-200 rounded-lg">
            <h3 className="font-medium text-white">Maigret</h3>
            <p className="text-sm text-gray-400">Advanced username enumeration</p>
          </div>
          <div className="p-4 bg-dark-200 rounded-lg">
            <h3 className="font-medium text-white">Subfinder</h3>
            <p className="text-sm text-gray-400">Subdomain discovery</p>
          </div>
          <div className="p-4 bg-dark-200 rounded-lg">
            <h3 className="font-medium text-white">Nuclei</h3>
            <p className="text-sm text-gray-400">Vulnerability scanning</p>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="card bg-yellow-900/20 border-yellow-700">
        <div className="flex items-start">
          <AlertCircle className="h-6 w-6 text-yellow-500 mr-3 mt-0.5" />
          <div>
            <h3 className="font-semibold text-white">Scope Validation</h3>
            <p className="text-gray-300 text-sm mt-1">
              Domain reconnaissance and scanning tools require scope validation.
              Ensure targets are authorized in an active assessment before scanning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
