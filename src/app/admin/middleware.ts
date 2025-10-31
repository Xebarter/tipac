import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple authentication middleware for admin routes
export function middleware(request: NextRequest) {
  // Get the session cookie
  const sessionCookie = request.cookies.get('admin_session');
  
  // If no session cookie, redirect to login
  if (!sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }
  
  // Here you could add more validation for the session cookie
  // For now, we'll just check if it exists
  
  return NextResponse.next();
}

// Configure which routes to apply the middleware to
export const config = {
  matcher: [
    '/admin/:path*',
    '/admin',
  ],
};