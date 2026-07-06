import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  // Desktop-Only MVP Constraint: Block mobile devices
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  const path = request.nextUrl.pathname;
  
  // Allow access to the mobile-blocked page and static assets
  if (isMobile && !path.startsWith('/mobile-blocked') && !path.startsWith('/_next') && !path.includes('.')) {
    return NextResponse.redirect(new URL('/mobile-blocked', request.url));
  }

  // Basic API protection: Ensure basic headers are present for /api routes
  // (Actual auth validation happens in the specific route handlers using Supabase SSR/Admin)
  if (path.startsWith('/api/') && !path.startsWith('/api/webhook')) {
    const origin = request.headers.get('origin');
    
    // Allow same-origin requests
    const isSameOrigin = origin === request.nextUrl.origin || !origin;
    
    if (!isSameOrigin) {
      // Return 403 for unauthorized cross-origin API requests
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden: Cross-origin API requests are not allowed.' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  // Set default security headers
  const response = NextResponse.next();
  
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
