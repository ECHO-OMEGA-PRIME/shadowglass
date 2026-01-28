/**
 * SHADOWGLASS API Client
 * Secure API communication with proper authentication and error handling
 */

import {
  getValidAccessToken,
  getUser,
  logout,
  shouldRefreshToken,
  refreshAccessToken,
} from './auth';

// API configuration from environment
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Error types for better handling
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_REQUIRED');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'ACCESS_DENIED');
    this.name = 'AuthorizationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
  }
}

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  retries?: number;
  timeout?: number;
}

interface RequestConfig {
  method: string;
  headers: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Build request headers with authentication
 */
async function buildHeaders(options: ApiOptions = {}): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Skip auth for public endpoints
  if (options.skipAuth) {
    return headers;
  }

  // Get valid access token (will refresh if needed)
  const token = await getValidAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add user context headers
  const user = getUser();
  if (user) {
    headers['X-Trust-Level'] = String(user.trustLevel);
    headers['X-User-Id'] = user.id;
  }

  return headers;
}

/**
 * Handle API response errors
 */
async function handleResponseError(response: Response): Promise<never> {
  let errorMessage = `API error: ${response.status}`;
  let errorCode: string | undefined;
  let errorDetails: unknown;

  try {
    const errorData = await response.json();
    errorMessage = errorData.message || errorData.detail || errorMessage;
    errorCode = errorData.code;
    errorDetails = errorData.details || errorData;
  } catch {
    // Response wasn't JSON
  }

  switch (response.status) {
    case 401:
      // Clear auth and redirect to login
      await logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login?reason=unauthorized';
      }
      throw new AuthenticationError(errorMessage);

    case 403:
      throw new AuthorizationError(errorMessage);

    default:
      throw new ApiError(errorMessage, response.status, errorCode, errorDetails);
  }
}

/**
 * Execute API request with retry logic
 */
async function executeRequest<T>(
  endpoint: string,
  config: RequestConfig,
  retries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);

      if (!response.ok) {
        // Don't retry auth errors
        if (response.status === 401 || response.status === 403) {
          await handleResponseError(response);
        }

        // Retry on server errors
        if (response.status >= 500 && attempt < retries) {
          await sleep(RETRY_DELAY_MS * Math.pow(2, attempt));
          continue;
        }

        await handleResponseError(response);
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;

      // Don't retry auth/authorization errors
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        throw error;
      }

      // Retry network errors
      if (error instanceof TypeError && error.message.includes('fetch') && attempt < retries) {
        await sleep(RETRY_DELAY_MS * Math.pow(2, attempt));
        continue;
      }

      // Non-retryable error
      if (attempt >= retries) {
        throw error;
      }
    }
  }

  throw lastError || new NetworkError('Request failed after retries');
}

/**
 * Main API request function
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = 'GET', body, timeout = 30000, retries = MAX_RETRIES } = options;

  // Build headers with authentication
  const headers = await buildHeaders(options);

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const config: RequestConfig = {
    method,
    headers,
    signal: controller.signal,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    return await executeRequest<T>(endpoint, config, retries);
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================================
// Assessment APIs
// ============================================================================
export const assessments = {
  list: () => apiRequest<Assessment[]>('/assessments'),

  get: (id: string) => apiRequest<Assessment>(`/assessments/${id}`),

  create: (data: CreateAssessmentRequest) =>
    apiRequest<Assessment>('/assessments', { method: 'POST', body: data }),

  update: (id: string, data: UpdateAssessmentRequest) =>
    apiRequest<Assessment>(`/assessments/${id}`, { method: 'PATCH', body: data }),

  delete: (id: string) =>
    apiRequest<void>(`/assessments/${id}`, { method: 'DELETE' }),

  activate: (id: string) =>
    apiRequest<Assessment>(`/assessments/${id}/activate`, { method: 'POST' }),

  pause: (id: string) =>
    apiRequest<Assessment>(`/assessments/${id}/pause`, { method: 'POST' }),

  complete: (id: string) =>
    apiRequest<Assessment>(`/assessments/${id}/complete`, { method: 'POST' }),

  stats: (id: string) => apiRequest<AssessmentStats>(`/assessments/${id}/stats`),
};

// ============================================================================
// Target APIs
// ============================================================================
export const targets = {
  list: (assessmentId: string) =>
    apiRequest<Target[]>(`/targets/assessment/${assessmentId}`),

  get: (id: string) => apiRequest<Target>(`/targets/${id}`),

  create: (data: CreateTargetRequest) =>
    apiRequest<Target>('/targets', { method: 'POST', body: data }),

  update: (id: string, data: UpdateTargetRequest) =>
    apiRequest<Target>(`/targets/${id}`, { method: 'PATCH', body: data }),

  delete: (id: string) =>
    apiRequest<void>(`/targets/${id}`, { method: 'DELETE' }),

  validate: (assessmentId: string, target: string) =>
    apiRequest<TargetValidation>(
      `/targets/validate?assessment_id=${encodeURIComponent(assessmentId)}&target_value=${encodeURIComponent(target)}`,
      { method: 'POST' }
    ),

  scopeSummary: (assessmentId: string) =>
    apiRequest<ScopeSummary>(`/targets/assessment/${assessmentId}/scope-summary`),
};

// ============================================================================
// Finding APIs
// ============================================================================
export const findings = {
  list: (assessmentId: string) =>
    apiRequest<Finding[]>(`/findings/assessment/${assessmentId}`),

  get: (id: string) => apiRequest<Finding>(`/findings/${id}`),

  create: (data: CreateFindingRequest) =>
    apiRequest<Finding>('/findings', { method: 'POST', body: data }),

  update: (id: string, data: UpdateFindingRequest) =>
    apiRequest<Finding>(`/findings/${id}`, { method: 'PATCH', body: data }),

  delete: (id: string) =>
    apiRequest<void>(`/findings/${id}`, { method: 'DELETE' }),

  confirm: (id: string) =>
    apiRequest<Finding>(`/findings/${id}/confirm`, { method: 'POST' }),

  falsePositive: (id: string) =>
    apiRequest<Finding>(`/findings/${id}/false-positive`, { method: 'POST' }),

  summary: (assessmentId: string) =>
    apiRequest<FindingSummary>(`/findings/assessment/${assessmentId}/summary`),
};

// ============================================================================
// Evidence APIs
// ============================================================================
export const evidence = {
  list: (assessmentId: string) =>
    apiRequest<Evidence[]>(`/evidence/assessment/${assessmentId}`),

  get: (id: string) => apiRequest<Evidence>(`/evidence/${id}`),

  create: (data: CreateEvidenceRequest) =>
    apiRequest<Evidence>('/evidence', { method: 'POST', body: data }),

  delete: (id: string) =>
    apiRequest<void>(`/evidence/${id}`, { method: 'DELETE' }),

  forFinding: (findingId: string) =>
    apiRequest<Evidence[]>(`/evidence/finding/${findingId}`),
};

// ============================================================================
// Report APIs
// ============================================================================
export const reports = {
  generate: (assessmentId: string, format: string = 'markdown') =>
    apiRequest<Report>(
      `/reports/${assessmentId}/generate?format=${encodeURIComponent(format)}`
    ),

  executive: (assessmentId: string) =>
    apiRequest<Report>(`/reports/${assessmentId}/executive-summary`),

  findings: (assessmentId: string) =>
    apiRequest<Report>(`/reports/${assessmentId}/findings-table`),

  compliance: (assessmentId: string, framework: string = 'OWASP') =>
    apiRequest<Report>(
      `/reports/${assessmentId}/compliance-checklist?framework=${encodeURIComponent(framework)}`
    ),
};

// ============================================================================
// Prometheus OSINT APIs
// ============================================================================
export const prometheus = {
  health: () => apiRequest<PrometheusHealth>('/prometheus/health'),

  capabilities: () => apiRequest<PrometheusCapabilities>('/prometheus/capabilities'),

  email: {
    holehe: (assessmentId: string, target: string) =>
      apiRequest<OsintResult>('/prometheus/osint/email/holehe', {
        method: 'POST',
        body: { assessment_id: assessmentId, target },
      }),

    hunter: (assessmentId: string, target: string) =>
      apiRequest<OsintResult>('/prometheus/osint/email/hunter', {
        method: 'POST',
        body: { assessment_id: assessmentId, target },
      }),
  },

  phone: (assessmentId: string, target: string) =>
    apiRequest<OsintResult>('/prometheus/osint/phone', {
      method: 'POST',
      body: { assessment_id: assessmentId, target },
    }),

  username: {
    sherlock: (assessmentId: string, target: string) =>
      apiRequest<OsintResult>('/prometheus/osint/username/sherlock', {
        method: 'POST',
        body: { assessment_id: assessmentId, target },
      }),

    maigret: (assessmentId: string, target: string) =>
      apiRequest<OsintResult>('/prometheus/osint/username/maigret', {
        method: 'POST',
        body: { assessment_id: assessmentId, target },
      }),
  },

  recon: {
    subdomains: (assessmentId: string, target: string) =>
      apiRequest<OsintResult>('/prometheus/recon/subdomains', {
        method: 'POST',
        body: { assessment_id: assessmentId, target },
      }),

    dns: (assessmentId: string, target: string, recordType: string = 'A') =>
      apiRequest<OsintResult>(
        `/prometheus/recon/dns?record_type=${encodeURIComponent(recordType)}`,
        {
          method: 'POST',
          body: { assessment_id: assessmentId, target },
        }
      ),

    whois: (assessmentId: string, target: string) =>
      apiRequest<OsintResult>('/prometheus/recon/whois', {
        method: 'POST',
        body: { assessment_id: assessmentId, target },
      }),
  },

  scan: {
    ports: (assessmentId: string, target: string, ports?: string) =>
      apiRequest<OsintResult>('/prometheus/scan/ports', {
        method: 'POST',
        body: { assessment_id: assessmentId, target, ports },
      }),

    nuclei: (assessmentId: string, target: string, templates?: string[]) =>
      apiRequest<OsintResult>('/prometheus/scan/nuclei', {
        method: 'POST',
        body: { assessment_id: assessmentId, target, templates },
      }),
  },
};

// ============================================================================
// Type Definitions
// ============================================================================

export interface Assessment {
  id: string;
  name: string;
  client_name: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  methodology: string;
  scope_description: string;
  start_date: string | null;
  end_date: string | null;
  target_count: number;
  finding_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAssessmentRequest {
  name: string;
  client_name: string;
  methodology?: string;
  scope_description?: string;
  start_date?: string;
  end_date?: string;
}

export interface UpdateAssessmentRequest {
  name?: string;
  client_name?: string;
  methodology?: string;
  scope_description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
}

export interface AssessmentStats {
  target_count: number;
  finding_count: number;
  severity_breakdown: Record<string, number>;
  status_breakdown: Record<string, number>;
}

export interface Target {
  id: string;
  assessment_id: string;
  target_type: 'domain' | 'ip' | 'url' | 'email' | 'phone' | 'username' | 'cidr';
  value: string;
  scope_status: 'in_scope' | 'out_of_scope' | 'pending';
  validation_notes: string;
  created_at: string;
}

export interface CreateTargetRequest {
  assessment_id: string;
  target_type: string;
  value: string;
  scope_status?: string;
}

export interface UpdateTargetRequest {
  target_type?: string;
  value?: string;
  scope_status?: string;
  validation_notes?: string;
}

export interface TargetValidation {
  valid: boolean;
  target_type: string;
  normalized_value: string;
  warnings: string[];
}

export interface ScopeSummary {
  total: number;
  in_scope: number;
  out_of_scope: number;
  pending: number;
  by_type: Record<string, number>;
}

export interface Finding {
  id: string;
  assessment_id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  status: 'identified' | 'confirmed' | 'false_positive' | 'remediated';
  cvss_score: number | null;
  cwe_id: string | null;
  affected_component: string;
  description: string;
  impact: string;
  remediation: string;
  references: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateFindingRequest {
  assessment_id: string;
  title: string;
  severity: string;
  category?: string;
  affected_component?: string;
  description?: string;
  impact?: string;
  remediation?: string;
  cvss_score?: number;
  cwe_id?: string;
  references?: string[];
}

export interface UpdateFindingRequest {
  title?: string;
  severity?: string;
  category?: string;
  status?: string;
  affected_component?: string;
  description?: string;
  impact?: string;
  remediation?: string;
  cvss_score?: number;
  cwe_id?: string;
  references?: string[];
}

export interface FindingSummary {
  total: number;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
}

export interface Evidence {
  id: string;
  assessment_id: string;
  finding_id: string | null;
  evidence_type: string;
  title: string;
  description: string;
  content: string;
  created_at: string;
}

export interface CreateEvidenceRequest {
  assessment_id: string;
  finding_id?: string;
  evidence_type: string;
  title: string;
  description?: string;
  content: string;
}

export interface Report {
  format: string;
  content: string;
  generated_at: string;
}

export interface PrometheusHealth {
  status: string;
  version: string;
  uptime: number;
}

export interface PrometheusCapabilities {
  osint: string[];
  recon: string[];
  scanning: string[];
}

export interface OsintResult {
  success: boolean;
  results?: unknown;
  error?: string;
  timestamp: string;
}
