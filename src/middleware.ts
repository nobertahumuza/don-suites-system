import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return new TextEncoder().encode(secret);
}

const publicPaths = ['/login', '/api/auth/login', '/guest', '/_next', '/favicon.ico'];

const roleRoutes: Record<string, string[]> = {
  admin: ['*'],
  reception: ['/dashboard', '/rooms', '/bookings', '/front-desk', '/guests', '/fb', '/conference', '/garden-bookings', '/parking', '/security/visitors', '/receipt', '/profile'],
  storekeeper: ['/dashboard', '/inventory', '/profile'],
  security: ['/dashboard', '/security', '/parking', '/profile'],
};

function hasAccess(role: string, pathname: string): boolean {
  const routes = roleRoutes[role];
  if (!routes) return false;
  if (routes.includes('*')) return true;
  return routes.some(route => pathname === route || pathname.startsWith(route + '/'));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const role = payload.role as string;
    if (!hasAccess(role, pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
