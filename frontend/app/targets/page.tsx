'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Target, Plus, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { targets } from '@/lib/api';

interface TargetItem {
  id: string;
  assessment_id: string;
  target_type: string;
  value: string;
  scope_status: string;
  validation_notes: string;
  created_at: string;
}

const scopeColors: Record<string, string> = {
  in_scope: 'bg-green-600',
  out_of_scope: 'bg-red-600',
  pending: 'bg-yellow-600',
};

const scopeIcons: Record<string, React.ElementType> = {
  in_scope: CheckCircle,
  out_of_scope: XCircle,
  pending: Clock,
};

export default function TargetsPage() {
  const [selectedAssessment, setSelectedAssessment] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: targetList = [], isLoading } = useQuery({
    queryKey: ['targets', selectedAssessment],
    queryFn: () => selectedAssessment ? targets.list(selectedAssessment) : Promise.resolve([]),
    enabled: !!selectedAssessment,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => targets.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Targets</h1>
          <p className="text-gray-400 mt-1">Manage in-scope targets for assessments</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <Plus className="h-5 w-5 mr-2" />
          Add Target
        </button>
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

      {/* Scope Legend */}
      <div className="flex space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-600 mr-2"></div>
          <span className="text-gray-400 text-sm">In Scope</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-600 mr-2"></div>
          <span className="text-gray-400 text-sm">Out of Scope</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-yellow-600 mr-2"></div>
          <span className="text-gray-400 text-sm">Pending Validation</span>
        </div>
      </div>

      {/* Targets List */}
      {!selectedAssessment ? (
        <div className="card text-center py-12">
          <Target className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Select an Assessment</h3>
          <p className="text-gray-400">
            Enter an assessment ID above to view its targets.
          </p>
        </div>
      ) : isLoading ? (
        <div className="text-gray-400">Loading targets...</div>
      ) : targetList.length === 0 ? (
        <div className="card text-center py-12">
          <Target className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Targets</h3>
          <p className="text-gray-400 mb-4">
            Add targets to define the scope of this assessment.
          </p>
          <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Plus className="h-5 w-5 mr-2" />
            Add First Target
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {targetList.map((target: TargetItem) => {
            const ScopeIcon = scopeIcons[target.scope_status] || Clock;
            return (
              <div key={target.id} className="card card-hover">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${scopeColors[target.scope_status] || 'bg-gray-600'}`}>
                      <ScopeIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-mono text-white">{target.value}</p>
                      <p className="text-sm text-gray-400">
                        Type: {target.target_type} | {target.scope_status.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {target.validation_notes && (
                      <span className="text-sm text-gray-400">{target.validation_notes}</span>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(target.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scope Validation Warning */}
      <div className="card bg-yellow-900/20 border-yellow-700">
        <div className="flex items-start">
          <Target className="h-6 w-6 text-yellow-500 mr-3 mt-0.5" />
          <div>
            <h3 className="font-semibold text-white">Scope Enforcement</h3>
            <p className="text-gray-300 text-sm mt-1">
              All scanning and reconnaissance operations are restricted to <strong>in-scope targets only</strong>.
              Attempting to scan out-of-scope targets will be blocked and logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
