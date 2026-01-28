/**
 * SHADOWGLASS Environment Validation
 * Validates required environment variables at startup
 */

interface EnvConfig {
  // Required
  apiUrl: string;

  // Optional with defaults
  sessionTimeoutMs: number;
  maxRetries: number;
  requestTimeoutMs: number;
}

interface ValidationResult {
  valid: boolean;
  config: EnvConfig | null;
  errors: string[];
  warnings: string[];
}

// Default values
const DEFAULTS = {
  sessionTimeoutMs: 30 * 60 * 1000, // 30 minutes
  maxRetries: 3,
  requestTimeoutMs: 30 * 1000, // 30 seconds
};

/**
 * Validate environment variables and return configuration
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get API URL from environment
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Validate required variables
  if (!apiUrl) {
    // In development, allow fallback to /api
    if (process.env.NODE_ENV === 'development') {
      warnings.push('NEXT_PUBLIC_API_URL not set, using /api fallback');
    } else {
      errors.push('NEXT_PUBLIC_API_URL is required in production');
    }
  }

  // Parse optional numeric values
  let sessionTimeoutMs = DEFAULTS.sessionTimeoutMs;
  if (process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MS) {
    const parsed = parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MS, 10);
    if (isNaN(parsed) || parsed < 60000) {
      warnings.push('NEXT_PUBLIC_SESSION_TIMEOUT_MS must be at least 60000 (1 minute), using default');
    } else {
      sessionTimeoutMs = parsed;
    }
  }

  let maxRetries = DEFAULTS.maxRetries;
  if (process.env.NEXT_PUBLIC_MAX_RETRIES) {
    const parsed = parseInt(process.env.NEXT_PUBLIC_MAX_RETRIES, 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 10) {
      warnings.push('NEXT_PUBLIC_MAX_RETRIES must be between 0 and 10, using default');
    } else {
      maxRetries = parsed;
    }
  }

  let requestTimeoutMs = DEFAULTS.requestTimeoutMs;
  if (process.env.NEXT_PUBLIC_REQUEST_TIMEOUT_MS) {
    const parsed = parseInt(process.env.NEXT_PUBLIC_REQUEST_TIMEOUT_MS, 10);
    if (isNaN(parsed) || parsed < 5000) {
      warnings.push('NEXT_PUBLIC_REQUEST_TIMEOUT_MS must be at least 5000 (5 seconds), using default');
    } else {
      requestTimeoutMs = parsed;
    }
  }

  // Build config if valid
  const valid = errors.length === 0;
  const config: EnvConfig | null = valid
    ? {
        apiUrl: apiUrl || '/api',
        sessionTimeoutMs,
        maxRetries,
        requestTimeoutMs,
      }
    : null;

  return { valid, config, errors, warnings };
}

/**
 * Log validation results to console
 */
export function logValidationResults(result: ValidationResult): void {
  if (result.warnings.length > 0) {
    console.warn('[SHADOWGLASS] Environment warnings:');
    result.warnings.forEach((w) => console.warn(`  - ${w}`));
  }

  if (!result.valid) {
    console.error('[SHADOWGLASS] Environment validation failed:');
    result.errors.forEach((e) => console.error(`  - ${e}`));
    throw new Error('Environment validation failed. Check console for details.');
  }

  if (process.env.NODE_ENV === 'development') {
    console.info('[SHADOWGLASS] Environment validated:', result.config);
  }
}

/**
 * Get validated environment config
 */
let cachedConfig: EnvConfig | null = null;

export function getEnvConfig(): EnvConfig {
  if (cachedConfig) return cachedConfig;

  const result = validateEnvironment();
  logValidationResults(result);

  if (!result.config) {
    throw new Error('Invalid environment configuration');
  }

  cachedConfig = result.config;
  return cachedConfig;
}

/**
 * Check if required environment is configured
 */
export function isEnvironmentReady(): boolean {
  const result = validateEnvironment();
  return result.valid;
}
