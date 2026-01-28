'use client';

import { Suspense, useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { findings } from '@/lib/api';

interface FindingFormData {
  assessment_id: string;
  title: string;
  severity: string;
  category: string;
  affected_component: string;
  description: string;
  impact: string;
  remediation: string;
  cvss_score: string;
  cwe_id: string;
  references: string;
}

const severities = [
  { id: 'critical', name: 'Critical', color: 'bg-red-600' },
  { id: 'high', name: 'High', color: 'bg-orange-600' },
  { id: 'medium', name: 'Medium', color: 'bg-yellow-600' },
  { id: 'low', name: 'Low', color: 'bg-blue-600' },
  { id: 'info', name: 'Informational', color: 'bg-gray-600' },
];

const categories = [
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
  'Other',
];

function NewFindingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAssessmentId = searchParams.get('assessment') || '';

  const [formData, setFormData] = useState<FindingFormData>({
    assessment_id: '',
    title: '',
    severity: 'medium',
    category: categories[0],
    affected_component: '',
    description: '',
    impact: '',
    remediation: '',
    cvss_score: '',
    cwe_id: '',
    references: '',
  });

  useEffect(() => {
    if (initialAssessmentId) {
      setFormData((prev) => ({ ...prev, assessment_id: initialAssessmentId }));
    }
  }, [initialAssessmentId]);

  const createMutation = useMutation({
    mutationFn: (data: FindingFormData) => {
      const payload = {
        ...data,
        cvss_score: data.cvss_score ? parseFloat(data.cvss_score) : undefined,
        references: data.references ? data.references.split('\n').filter(Boolean) : [],
      };
      return findings.create(payload);
    },
    onSuccess: () => {
      if (formData.assessment_id) {
        router.push(`/assessments/${formData.assessment_id}`);
      } else {
        router.push('/findings');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.assessment_id) return;
    createMutation.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/findings"
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Report Finding</h1>
          <p className="text-gray-400">Document a security vulnerability</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Assessment */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Assessment</h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Assessment ID *
            </label>
            <input
              type="text"
              name="assessment_id"
              value={formData.assessment_id}
              onChange={handleChange}
              placeholder="Enter Assessment ID"
              required
              className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {/* Basic Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Finding Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., SQL Injection in Login Form"
                required
                className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Affected Component
              </label>
              <input
                type="text"
                name="affected_component"
                value={formData.affected_component}
                onChange={handleChange}
                placeholder="e.g., /api/login, UserController.php"
                className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Severity */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Severity</h2>
          <div className="flex space-x-3">
            {severities.map((sev) => (
              <button
                key={sev.id}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, severity: sev.id }))}
                className={`flex-1 py-3 rounded-lg text-center font-medium transition-all ${
                  formData.severity === sev.id
                    ? `${sev.color} ring-2 ring-white text-white`
                    : 'bg-dark-200 text-gray-300 hover:bg-dark-100'
                }`}
              >
                {sev.name}
              </button>
            ))}
          </div>
        </div>

        {/* Category & Scoring */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Classification</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                OWASP Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                CVSS Score (0.0 - 10.0)
              </label>
              <input
                type="number"
                name="cvss_score"
                value={formData.cvss_score}
                onChange={handleChange}
                placeholder="e.g., 7.5"
                step="0.1"
                min="0"
                max="10"
                className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                CWE ID
              </label>
              <input
                type="text"
                name="cwe_id"
                value={formData.cwe_id}
                onChange={handleChange}
                placeholder="e.g., CWE-89"
                className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Description</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Technical Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe the vulnerability, including how it was discovered and technical details..."
                className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Business Impact
              </label>
              <textarea
                name="impact"
                value={formData.impact}
                onChange={handleChange}
                rows={3}
                placeholder="Describe the potential business impact if this vulnerability is exploited..."
                className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Remediation
              </label>
              <textarea
                name="remediation"
                value={formData.remediation}
                onChange={handleChange}
                rows={3}
                placeholder="Provide specific steps to fix this vulnerability..."
                className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* References */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">References</h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reference URLs (one per line)
            </label>
            <textarea
              name="references"
              value={formData.references}
              onChange={handleChange}
              rows={3}
              placeholder={"https://owasp.org/...\nhttps://cve.mitre.org/..."}
              className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none font-mono text-sm"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex space-x-4">
          <Link
            href="/findings"
            className="flex-1 py-3 text-center text-gray-300 bg-dark-200 rounded-lg hover:bg-dark-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!formData.title || !formData.assessment_id || createMutation.isPending}
            className="flex-1 flex items-center justify-center py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 mr-2" />
                Report Finding
              </>
            )}
          </button>
        </div>

        {createMutation.isError && (
          <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
            Failed to create finding. Please try again.
          </div>
        )}
      </form>
    </div>
  );
}

export default function NewFindingPage() {
  return (
    <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
      <NewFindingForm />
    </Suspense>
  );
}
