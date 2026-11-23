/**
 * Adds basic browser-security headers to every response (Nitro auto-registers server/middleware/* on deploys).
 * No Content-Security-Policy on purpose: the app uses inline scripts and embeds Google Maps, so a strict CSP would
 * break it. HSTS is only meaningful on HTTPS; hosts such as Vercel already serve HTTPS.
 */
interface HeaderEvent {
  res: { headers: Headers };
}

export default async function securityHeaders(event: HeaderEvent, next: () => unknown | Promise<unknown>) {
  const h = event.res.headers;
  h.set("X-Content-Type-Options", "nosniff");
  h.set("X-Frame-Options", "SAMEORIGIN");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("Permissions-Policy", "geolocation=(self), microphone=(self), camera=(self), payment=()");
  h.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return next();
}
