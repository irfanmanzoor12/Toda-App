import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for Better Auth session token
  const betterAuthSession = request.cookies.get('better-auth.session_token')?.value;

  // Check if accessing protected route (/todos)
  if (request.nextUrl.pathname.startsWith('/todos')) {
    // If no Better Auth session, redirect to login
    if (!betterAuthSession) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/todos/:path*'],
};
