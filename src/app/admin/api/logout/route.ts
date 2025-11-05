import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Create a response that removes the admin session cookie
  const response = NextResponse.json({ message: "Logged out successfully" });
  
  // Remove the admin session cookie
  response.cookies.set('admin_session', '', { 
    path: '/', 
    expires: new Date(0) // Expire immediately
  });
  
  return response;
}