import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db, schema } from '../../db';
import { eq } from 'drizzle-orm';

// Define user roles
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

// Middleware to check if user is authenticated
export async function isAuthenticated(
  request: NextRequest
): Promise<{ authenticated: boolean; userId?: number; role?: UserRole }> {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get('session_token')?.value;
    
    if (!sessionToken) {
      return { authenticated: false };
    }
    
    // Find session in database
    const session = await db.query.sessionsTable.findFirst({
      where: eq(schema.sessionsTable.session_token, sessionToken),
      with: {
        user: true,
      },
    });
    
    // Check if session exists and is not expired
    if (!session || new Date(session.expires_at) < new Date()) {
      return { authenticated: false };
    }
    
    // Return authenticated user info
    return {
      authenticated: true,
      userId: session.user_id,
      role: UserRole.USER, // Default role, can be extended to get from user table
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { authenticated: false };
  }
}

// Middleware to check if user has required role
export function requireRole(role: UserRole) {
  return async (request: NextRequest) => {
    const auth = await isAuthenticated(request);
    
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (auth.role !== role && auth.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Add user info to request for handlers
    request.headers.set('X-User-ID', auth.userId?.toString() || '');
    request.headers.set('X-User-Role', auth.role || '');
    
    return NextResponse.next();
  };
}
