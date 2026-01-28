'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FileText, Download, Eye, Loader2 } from 'lucide-react';
import { reports } from '@/lib/api';

type ReportFormat = 'markdown' | 'json' | 'executive' | 'technical';

interface ReportResult {
  format: string;
  content: string;
  generated_at: string;
}

export default function ReportsPage() {
  const [assessmentId, setAssessmentId] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('markdown');
  const [framework, setFramework] = useState('OWASP');
  const [generatedReport, setGeneratedReport] = useState<ReportResult | null>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (selectedFormat === 'executive') {
        return reports.executive(assessmentId);
      } else if (selectedFormat === 'technical') {
        return reports.findings(assessmentId);
      } else {
        return reports.generate(assessmentId, selectedFormat);
      }
    },
    onSuccess: (data) => setGeneratedReport(data),
  });

  const complianceMutation = useMutation({
    mutationFn: () => reports.compliance(assessmentId, framework),
    onSuccess: (data) => setGeneratedReport(data),
  });

  const handleDownload = () => {
    if (!generatedReport) return;

    const blob = new Blob([
      typeof generatedReport.content === 'string'
        ? generatedReport.content
        : JSON.stringify(generatedReport.content, null, 2)
    ], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${assessmentId}-${selectedFormat}.${selectedFormat === 'json' ? 'json' : 'md'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reportFormats = [
    { id: 'markdown', name: 'Markdown', description: 'Full report in Markdown format' },
    { id: 'json', name: 'JSON', description: 'Machine-readable JSON format' },
    { id: 'executive', name: 'Executive Summary', description: 'High-level overview for stakeholders' },
    { id: 'technical', name: 'Technical Details', description: 'Detailed findings table' },
  ];

  const frameworks = ['OWASP', 'PTES', 'NIST', 'PCI-DSS'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Reports</h1>
        <p className="text-gray-400 mt-1">Generate assessment reports and compliance checklists</p>
      </div>

      {/* Assessment Selection */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Assessment ID
        </label>
        <input
          type="text"
          placeholder="Enter Assessment ID"
          value={assessmentId}
          onChange={(e) => setAssessmentId(e.target.value)}
          className="w-full px-4 py-2 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
        />
      </div>

      {/* Report Format Selection */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Report Format</h2>
        <div className="grid grid-cols-2 gap-4">
          {reportFormats.map((format) => (
            <button
              key={format.id}
              onClick={() => setSelectedFormat(format.id as ReportFormat)}
              className={`p-4 rounded-lg text-left transition-all ${
                selectedFormat === format.id
                  ? 'bg-primary-600 ring-2 ring-primary-400'
                  : 'bg-dark-200 hover:bg-dark-100'
              }`}
            >
              <p className="font-medium text-white">{format.name}</p>
              <p className="text-sm text-gray-400 mt-1">{format.description}</p>
            </button>
          ))}
        </div>

        <button
          onClick={() => generateMutation.mutate()}
          disabled={!assessmentId || generateMutation.isPending}
          className="mt-4 w-full flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="h-5 w-5 mr-2" />
              Generate Report
            </>
          )}
        </button>
      </div>

      {/* Compliance Checklist */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Compliance Checklist</h2>
        <div className="flex space-x-4 mb-4">
          {frameworks.map((fw) => (
            <button
              key={fw}
              onClick={() => setFramework(fw)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                framework === fw
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-200 text-gray-300 hover:bg-dark-300'
              }`}
            >
              {fw}
            </button>
          ))}
        </div>
        <button
          onClick={() => complianceMutation.mutate()}
          disabled={!assessmentId || complianceMutation.isPending}
          className="w-full flex items-center justify-center px-4 py-3 bg-dark-200 text-white rounded-lg hover:bg-dark-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {complianceMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="h-5 w-5 mr-2" />
              Generate {framework} Checklist
            </>
          )}
        </button>
      </div>

      {/* Generated Report Preview */}
      {generatedReport && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Generated Report</h2>
            <div className="flex space-x-2">
              <button
                onClick={handleDownload}
                className="flex items-center px-3 py-2 bg-dark-200 text-white rounded-lg hover:bg-dark-100 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
            </div>
          </div>
          <div className="bg-dark-200 rounded-lg p-4 max-h-96 overflow-auto">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
              {typeof generatedReport.content === 'string'
                ? generatedReport.content
                : JSON.stringify(generatedReport.content, null, 2)}
            </pre>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Generated: {generatedReport.generated_at}
          </p>
        </div>
      )}

      {/* Report Templates Info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Report Templates</h2>
        <div className="space-y-3">
          <div className="p-3 bg-dark-200 rounded-lg">
            <h3 className="font-medium text-white">Executive Summary</h3>
            <p className="text-sm text-gray-400">
              High-level overview with risk ratings, key findings, and recommendations for leadership.
            </p>
          </div>
          <div className="p-3 bg-dark-200 rounded-lg">
            <h3 className="font-medium text-white">Technical Report</h3>
            <p className="text-sm text-gray-400">
              Detailed technical findings with reproduction steps, evidence, and remediation guidance.
            </p>
          </div>
          <div className="p-3 bg-dark-200 rounded-lg">
            <h3 className="font-medium text-white">Compliance Report</h3>
            <p className="text-sm text-gray-400">
              Mapping findings to compliance frameworks (OWASP, PTES, NIST, PCI-DSS).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
