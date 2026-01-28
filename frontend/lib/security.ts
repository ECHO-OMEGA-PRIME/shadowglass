/**
 * SHADOWGLASS Security Utilities
 * Input sanitization, XSS protection, and security helpers
 */

/**
 * HTML entities for escaping
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }
  return input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize a string for safe display
 * Removes potentially dangerous patterns
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Remove script tags and event handlers
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*(['"])[^'"]*\1/gi, '');

  // Remove javascript: and data: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');

  // Remove HTML comments
  sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '');

  return sanitized.trim();
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): { valid: boolean; sanitized: string } {
  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  return {
    valid: emailRegex.test(sanitized),
    sanitized,
  };
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): { valid: boolean; sanitized: string } {
  const sanitized = url.trim();

  // Only allow http, https, and mailto protocols
  const allowedProtocols = ['http:', 'https:', 'mailto:'];

  try {
    const parsed = new URL(sanitized);
    if (!allowedProtocols.includes(parsed.protocol)) {
      return { valid: false, sanitized: '' };
    }
    return { valid: true, sanitized: parsed.href };
  } catch {
    return { valid: false, sanitized: '' };
  }
}

/**
 * Sanitize phone number (keep only digits and allowed characters)
 */
export function sanitizePhone(phone: string): { valid: boolean; sanitized: string } {
  // Remove all non-digit characters except + at the start
  let sanitized = phone.trim();
  const hasPlus = sanitized.startsWith('+');
  sanitized = sanitized.replace(/\D/g, '');

  if (hasPlus) {
    sanitized = '+' + sanitized;
  }

  // Basic validation (10-15 digits)
  const valid = sanitized.replace(/\D/g, '').length >= 10 && sanitized.replace(/\D/g, '').length <= 15;

  return { valid, sanitized };
}

/**
 * Sanitize username (alphanumeric and common separators)
 */
export function sanitizeUsername(username: string): { valid: boolean; sanitized: string } {
  const sanitized = username.trim().toLowerCase();
  // Only allow alphanumeric, underscore, hyphen, and dot
  const usernameRegex = /^[a-z0-9._-]+$/;
  const valid = usernameRegex.test(sanitized) && sanitized.length >= 2 && sanitized.length <= 64;

  return { valid, sanitized: valid ? sanitized : '' };
}

/**
 * Sanitize domain name
 */
export function sanitizeDomain(domain: string): { valid: boolean; sanitized: string } {
  let sanitized = domain.trim().toLowerCase();

  // Remove protocol if present
  sanitized = sanitized.replace(/^https?:\/\//, '');

  // Remove trailing slash and path
  sanitized = sanitized.split('/')[0];

  // Basic domain validation
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
  const valid = domainRegex.test(sanitized);

  return { valid, sanitized: valid ? sanitized : '' };
}

/**
 * Sanitize IP address
 */
export function sanitizeIpAddress(ip: string): { valid: boolean; sanitized: string } {
  const sanitized = ip.trim();

  // IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(sanitized)) {
    const parts = sanitized.split('.').map(Number);
    const valid = parts.every((part) => part >= 0 && part <= 255);
    return { valid, sanitized: valid ? sanitized : '' };
  }

  // IPv6 validation (simplified)
  const ipv6Regex = /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/i;
  if (ipv6Regex.test(sanitized)) {
    return { valid: true, sanitized: sanitized.toLowerCase() };
  }

  return { valid: false, sanitized: '' };
}

/**
 * Sanitize CIDR notation
 */
export function sanitizeCidr(cidr: string): { valid: boolean; sanitized: string } {
  const sanitized = cidr.trim();
  const parts = sanitized.split('/');

  if (parts.length !== 2) {
    return { valid: false, sanitized: '' };
  }

  const { valid: ipValid, sanitized: ip } = sanitizeIpAddress(parts[0]);
  if (!ipValid) {
    return { valid: false, sanitized: '' };
  }

  const prefix = parseInt(parts[1], 10);
  const maxPrefix = ip.includes(':') ? 128 : 32;

  if (isNaN(prefix) || prefix < 0 || prefix > maxPrefix) {
    return { valid: false, sanitized: '' };
  }

  return { valid: true, sanitized: `${ip}/${prefix}` };
}

/**
 * Sanitize assessment input based on type
 */
export function sanitizeTarget(
  value: string,
  type: 'email' | 'phone' | 'username' | 'domain' | 'ip' | 'cidr' | 'url'
): { valid: boolean; sanitized: string; error?: string } {
  switch (type) {
    case 'email':
      return { ...sanitizeEmail(value), error: 'Invalid email address' };
    case 'phone':
      return { ...sanitizePhone(value), error: 'Invalid phone number' };
    case 'username':
      return { ...sanitizeUsername(value), error: 'Invalid username' };
    case 'domain':
      return { ...sanitizeDomain(value), error: 'Invalid domain name' };
    case 'ip':
      return { ...sanitizeIpAddress(value), error: 'Invalid IP address' };
    case 'cidr':
      return { ...sanitizeCidr(value), error: 'Invalid CIDR notation' };
    case 'url':
      return { ...sanitizeUrl(value), error: 'Invalid URL' };
    default:
      return { valid: true, sanitized: sanitizeString(value) };
  }
}

/**
 * Rate limit tracker for client-side rate limiting
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  isAllowed(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Remove old timestamps
    const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);

    if (validTimestamps.length >= limit) {
      return false;
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }

  clear(): void {
    this.requests.clear();
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Secure random string generator
 */
export function generateSecureId(length: number = 16): string {
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, length);
  }
  // Fallback for non-browser environments
  return Array.from({ length }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Hash a string using SHA-256
 */
export async function hashString(input: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback: return a simple hash (not cryptographically secure)
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(16);
}
