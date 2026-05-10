import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req: any) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth?.token;
    const isAdminRole = token?.role === 'ADMIN' || token?.role === 'SUPERADMIN';

    // Admin-only routes
    if (pathname.startsWith('/admin') && !isAdminRole) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    if (pathname.startsWith('/integrations') && !isAdminRole) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    if (pathname.startsWith('/actioned-threats') && !isAdminRole) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }: any) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/threats/:path*',
    '/upload/:path*',
    '/admin/:path*',
    '/how-it-works/:path*',
    '/integrations/:path*',
    '/cve-database/:path*',
    '/product-portfolio/:path*',
    '/threat-feed/:path*',
    '/actioned-threats/:path*',
    '/executive-brief/:path*',
    '/policy/:path*',
  ],
};
