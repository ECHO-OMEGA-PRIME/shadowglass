import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that don't require authentication
const publicPaths = ['/login', '/api/auth/login', '/api/auth/refresh'];

// API paths (handled separately)
const apiPrefix = '/api';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create response object for adding security headers
  const response = NextResponse.next();

  // ==========================================================================
  // SECURITY HEADERS
  // ==========================================================================

  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Next.js
    "style-src 'self' 'unsafe-inline'", // Required for inline styles
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.shadowglass.com wss://*.shadowglass.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspDirectives);

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  // HSTS (Strict Transport Security) - only in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // ==========================================================================
  // API ROUTES
  // ==========================================================================

  // Skip middleware for API routes (handled by API route handlers)
  if (pathname.startsWith(apiPrefix)) {
    // Add CORS headers for API routes
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.NEXT_PUBLIC_APP_URL,
    ].filter(Boolean);

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Trust-Level, X-User-Id');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Max-Age', '86400');
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }

    return response;
  }

  // ==========================================================================
  // PUBLIC PATHS
  // ==========================================================================

  // Allow access to public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return response;
  }

  // ==========================================================================
  // STATIC ASSETS
  // ==========================================================================

  // Allow static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Files with extensions (images, etc.)
  ) {
    return response;
  }

  // ==========================================================================
  // PROTECTED ROUTES
  // ==========================================================================

  // For protected routes, we don't check auth in middleware
  // Instead, we let the client-side AuthContext handle it
  // This is because session storage is not accessible in middleware

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
