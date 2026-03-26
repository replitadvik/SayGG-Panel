/**
 * Cloudflare Worker — Header Sanitiser Proxy
 *
 * Problem:
 *   The game loader sends an HTTP request that includes a header with a space
 *   in its name: "Charse t: UTF-8".  RFC 7230 forbids spaces in header names,
 *   so any standards-compliant reverse proxy (Vercel edge, Replit proxy, nginx
 *   in strict mode, etc.) rejects the connection with a raw 400 BEFORE the
 *   application code can respond with valid JSON.
 *
 * Solution:
 *   Cloudflare accepts non-standard client connections at the edge. This Worker
 *   runs on Cloudflare's network, receives the raw request (including the bad
 *   header), strips every header whose name contains whitespace, then forwards
 *   the cleaned request to the real backend.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEPLOYMENT STEPS
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Sign in to https://dash.cloudflare.com
 * 2. In the left sidebar: Workers & Pages → Create Application → Create Worker
 * 3. Replace the default code with this entire file
 * 4. In the BACKEND_ORIGIN constant below, put the URL of the deployed panel
 *    (your Replit .replit.app URL or any other backend URL)
 * 5. Click Deploy
 * 6. Go to Workers & Pages → your worker → Settings → Triggers → Add Route
 *    Route pattern:  saygg.shop/*
 *    Zone:           saygg.shop  (must be using Cloudflare DNS)
 *    This makes ALL traffic for saygg.shop go through this Worker.
 * 7. In Cloudflare DNS, make sure your A/CNAME record for saygg.shop is
 *    "Proxied" (orange cloud icon).
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** URL of the panel backend that actually handles requests. */
const BACKEND_ORIGIN = "https://YOUR-APP.replit.app"; // ← CHANGE THIS

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Point the request at the real backend, keep path + query intact
    const backend = new URL(BACKEND_ORIGIN);
    url.hostname = backend.hostname;
    url.protocol = backend.protocol;
    url.port = backend.port;

    // Build a clean set of headers: drop any whose name contains whitespace
    const clean = new Headers();
    for (const [name, value] of request.headers.entries()) {
      if (!/[\t ]/.test(name)) {
        clean.set(name, value);
      }
    }
    // Always set Host to match the backend
    clean.set("host", backend.hostname);

    const body =
      request.method === "GET" || request.method === "HEAD"
        ? null
        : request.body;

    const upstreamReq = new Request(url.toString(), {
      method: request.method,
      headers: clean,
      body,
      redirect: "manual",
    });

    try {
      return await fetch(upstreamReq);
    } catch (err) {
      // If the backend is unreachable return a valid JSON error so the loader
      // gets proper JSON instead of a network error / empty response
      return new Response(
        JSON.stringify({ status: false, reason: "Backend unreachable" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};
