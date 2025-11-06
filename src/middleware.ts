import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Allow access to auth pages without authentication
    if (req.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.next();
    }

    // Require authentication for protected routes
    if (
      req.nextUrl.pathname.startsWith('/profile') ||
      req.nextUrl.pathname.startsWith('/online')
    ) {
      if (!req.nextauth.token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: ['/profile/:path*', '/online/:path*', '/auth/:path*'],
};
