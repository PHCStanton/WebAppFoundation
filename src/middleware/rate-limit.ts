import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Simple in-memory store for rate limiting
// In production, this should be replaced with Redis or another distributed cache
const rateLimitStore: Record<string, { count: number; resetTime: number }> = {};

interface RateLimitOptions {
  // Maximum number of requests allowed within the window
  limit: number;
  // Time window in seconds
  windowInSeconds: number;
}

// Default rate limit options
const defaultOptions: RateLimitOptions = {
  limit: 100,
  windowInSeconds: 60, // 1 minute
};

/**
 * Rate limiting middleware
 * Limits the number of requests from a single IP address within a time window
 */
export function rateLimit(options: Partial<RateLimitOptions> = {}) {
  const { limit, windowInSeconds } = { ...defaultOptions, ...options };

  return async (request: NextRequest) => {
    // Get client IP address
    const ip = request.ip || 'unknown';
    const now = Date.now();
    
    // Initialize or get existing rate limit data for this IP
    if (!rateLimitStore[ip] || rateLimitStore[ip].resetTime < now) {
      rateLimitStore[ip] = {
        count: 0,
        resetTime: now + windowInSeconds * 1000,
      };
    }
    
    // Increment request count
    rateLimitStore[ip].count += 1;
    
    // Set rate limit headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set(
      'X-RateLimit-Remaining', 
      Math.max(0, limit - rateLimitStore[ip].count).toString()
    );
    response.headers.set(
      'X-RateLimit-Reset', 
      Math.ceil(rateLimitStore[ip].resetTime / 1000).toString()
    );
    
    // If rate limit exceeded, return 429 Too Many Requests
    if (rateLimitStore[ip].count > limit) {
      return NextResponse.json(
        { error: 'Too many requests, please try again later.' },
        { 
          status: 429,
          headers: response.headers,
        }
      );
    }
    
    return response;
  };
}

// Cleanup function to prevent memory leaks
// Should be called periodically in a production environment
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const ip of Object.keys(rateLimitStore)) {
    if (rateLimitStore[ip].resetTime < now) {
      delete rateLimitStore[ip];
    }
  }
}
