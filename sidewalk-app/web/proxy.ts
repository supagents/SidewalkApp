import { NextResponse, type NextRequest } from "next/server";

// A nonce-based CSP: Next.js automatically tags its own inline
// hydration/RSC-streaming scripts with this nonce when it sees the
// Content-Security-Policy header shaped this way, so script-src can stay
// 'self' + the nonce — no 'unsafe-inline' — which is what actually blocks
// the class of bug fixed in map-view.tsx (an injected <img onerror=...>
// or <script> tag executing). style-src still needs 'unsafe-inline':
// React's style={{}} props and Leaflet's own dynamic styling both rely on
// inline style attributes, and there's no practical nonce mechanism for
// those — but inline styles can't execute JavaScript in modern browsers,
// so that's a much smaller concession than the one for scripts.
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https://*.tile.openstreetmap.org;
    font-src 'self';
    connect-src 'self' https://*.googleapis.com https://*.google.com wss://*.firebaseio.com https://*.firebaseio.com https://*.cloudfunctions.net https://nominatim.openstreetmap.org;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Skip Next's static assets and image optimizer — no point spending a
    // nonce/CSP header on requests that were never going to render HTML.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
