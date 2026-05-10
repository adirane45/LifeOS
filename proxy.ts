import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('lifeos_session')?.value;

  // If cookie is missing and trying to access protected route, redirect to login
  if (!token && pathname !== '/auth/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // If cookie is present and trying to access login page, redirect to dashboard
  if (token && pathname === '/auth/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\.).*)']
};
