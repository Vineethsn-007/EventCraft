/** @type {import('next').NextConfig} */

// Content Security Policy. Next.js injects inline bootstrap scripts, so
// 'unsafe-inline' is required for scripts; style-src needs it for the CSS
// pipeline. No remote origins are allowed: the LLM call happens server-side only.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'" +
    // `next dev` compiles and hot-reloads with eval, which requires
    // 'unsafe-eval'. Dev only — production keeps the strict policy.
    (process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
