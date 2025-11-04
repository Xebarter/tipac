import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define the paths that require authentication
const protectedPaths = ['/admin'];

// Hardcoded credentials
const ADMIN_EMAIL = 'admin@tipac.com';
const ADMIN_PASSWORD = 'Admin123';

export function middleware(request: NextRequest) {
  // Check if the request is for a protected path
  const isProtectedPath = protectedPaths.some(path => 
    (request.nextUrl.pathname.startsWith(path) && 
    !request.nextUrl.pathname.startsWith('/admin/login')) ||
    request.nextUrl.pathname === '/admin'
  );

  // If it's not a protected path, continue
  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // For API routes and server-side checks, we would normally validate a token
  // But for this simple implementation, we'll just check for the presence of our cookie
  const adminSession = request.cookies.get('admin_session');
  
  // If no session cookie, redirect to login
  if (!adminSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

// Configure which routes to apply the middleware to
export const config = {
  matcher: [
    '/admin/:path*',
    '/admin'
  ],
};