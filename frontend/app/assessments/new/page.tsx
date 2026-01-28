'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { assessments } from '@/lib/api';

interface AssessmentFormData {
  name: string;
  client_name: string;
  methodology: string;
  scope_description: string;
  start_date: string;
  end_date: string;
}

const methodologies = [
  { id: 'PTES', name: 'PTES', description: 'Penetration Testing Execution Standard' },
  { id: 'OWASP', name: 'OWASP', description: 'OWASP Testing Guide v4.2' },
  { id: 'NIST', name: 'NIST', description: 'NIST SP 800-115' },
  { id: 'CUSTOM', name: 'Custom', description: 'Custom methodology' },
];

export default function NewAssessmentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<AssessmentFormData>({
    name: '',
    client_name: '',
    methodology: 'PTES',
    scope_description: '',
    start_date: '',
    end_date: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: AssessmentFormData) => assessments.create(data),
    onSuccess: (result) => {
      router.push(`/assessments/${result.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.client_name) return;
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/assessments"
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">New Assessment</h1>
          <p className="text-gray-400">Create a new security assessment engagement</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Assessment Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Q1 2026 Web Application Pentest"
                required
                className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client Name *
              </label>
              <input
                type="text"
                name="client_name"
                value={formData.client_name}
                onChange={handleChange}
                placeholder="e.g., Acme Corporation"
                required
                className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Methodology */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Methodology</h2>
          <div className="grid grid-cols-2 gap-4">
            {methodologies.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, methodology: method.id }))}
                className={`p-4 rounded-lg text-left transition-all ${
                  formData.methodology === method.id
                    ? 'bg-primary-600 ring-2 ring-primary-400'
                    : 'bg-dark-200 hover:bg-dark-100'
                }`}
              >
                <p className="font-medium text-white">{method.name}</p>
                <p className="text-sm text-gray-400 mt-1">{method.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Scope */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Scope Definition</h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Scope Description
            </label>
            <textarea
              name="scope_description"
              value={formData.scope_description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe the scope of this assessment, including target systems, testing boundaries, and any exclusions..."
              className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
            />
          </div>
        </div>

        {/* Schedule */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Schedule</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Authorization Notice */}
        <div className="card bg-primary-900/20 border-primary-700">
          <div className="flex items-start">
            <Shield className="h-6 w-6 text-primary-500 mr-3 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white">Authorization Reminder</h3>
              <p className="text-gray-300 text-sm mt-1">
                Ensure you have a signed Statement of Work (SOW) and Rules of Engagement (ROE)
                before beginning any testing activities. All targets must be explicitly authorized
                before scanning or exploitation.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex space-x-4">
          <Link
            href="/assessments"
            className="flex-1 py-3 text-center text-gray-300 bg-dark-200 rounded-lg hover:bg-dark-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!formData.name || !formData.client_name || createMutation.isPending}
            className="flex-1 flex items-center justify-center py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 mr-2" />
                Create Assessment
              </>
            )}
          </button>
        </div>

        {createMutation.isError && (
          <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
            Failed to create assessment. Please try again.
          </div>
        )}
      </form>
    </div>
  );
}
