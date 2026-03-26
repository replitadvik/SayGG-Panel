/**
 * Cloudflare Worker — Header Sanitiser Proxy
 *
 * WHY THIS EXISTS:
 *   The game loader (Login.h) sends a header "Charse t: UTF-8" which has a
 *   space in the header name. This violates RFC 7230. Every standards-compliant
 *   reverse proxy — Vercel edge, Replit proxy, nginx in strict mode — drops or
 *   rejects the connection before any application code runs, so the loader gets
 *   raw "400 Bad Request" text instead of JSON and crashes.
 *
 *   Cloudflare's edge is lenient with incoming client connections and accepts
 *   the request. This Worker strips the malformed header and forwards the clean
 *   request to the real backend (Vercel or Replit). The backend receives a
 *   valid HTTP request and returns proper JSON.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEPLOYMENT (one-time setup, ~5 minutes, completely free)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. Make sure saygg.shop uses Cloudflare DNS
 *    - Log in to dash.cloudflare.com → select your domain
 *    - DNS tab → your A or CNAME record for saygg.shop must have the
 *      orange-cloud (Proxied) icon.  If it's grey, click it to turn it orange.
 *
 * 2. Create the Worker
 *    - Left sidebar → Workers & Pages → Create → Create Worker
 *    - Name it anything, e.g. "saygg-proxy"
 *    - Click "Deploy" (don't worry about the default code yet)
 *
 * 3. Paste this file
 *    - In the Worker editor, select all and replace with this entire file
 *    - Update BACKEND_ORIGIN below to your Vercel project URL
 *      (e.g. "https://saygg-shop.vercel.app" — NOT the saygg.shop domain)
 *    - Click "Deploy"
 *
 * 4. Assign the Worker to your domain
 *    - Workers & Pages → your worker → Settings → Domains & Routes
 *    - Add Route: pattern = "saygg.shop/*", Zone = saygg.shop
 *    - Save
 *
 * 5. In Vercel, add saygg.shop as a custom domain
 *    - Vercel dashboard → your project → Settings → Domains → Add "saygg.shop"
 *    - Vercel will ask you to add a CNAME, but since Cloudflare proxies it,
 *      just point the Cloudflare DNS record to cname.vercel-dns.com (or the
 *      IP Vercel gives you). Keep the orange cloud ON.
 *
 * After this setup the flow is:
 *   Game loader → Cloudflare (strips bad header) → Vercel (gets clean request)
 *                                                 → Returns JSON → Loader works
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Your Vercel deployment URL.
 * ⚠️  Set this to your actual Vercel project URL before deploying.
 *     Example: "https://saygg-shop.vercel.app"
 *     Do NOT use "saygg.shop" here — that would create an infinite loop.
 */
const BACKEND_ORIGIN = "https://YOUR-PROJECT.vercel.app"; // ← CHANGE THIS

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Rewrite the host to point at the Vercel backend
    const backend = new URL(BACKEND_ORIGIN);
    url.hostname = backend.hostname;
    url.protocol = backend.protocol;
    url.port     = backend.port;

    // Build a clean set of headers — drop any whose name has whitespace
    // ("Charse t: UTF-8" is the specific culprit from the game loader)
    const clean = new Headers();
    for (const [name, value] of request.headers.entries()) {
      if (!/[\t ]/.test(name)) {
        clean.set(name, value);
      }
    }
    // Tell the backend which host it is being reached as
    clean.set("host", backend.hostname);
    // Pass the real client IP for rate-limiting / logging
    clean.set("x-forwarded-for", request.headers.get("cf-connecting-ip") || "");

    const body =
      request.method === "GET" || request.method === "HEAD"
        ? null
        : request.body;

    try {
      const upstreamReq = new Request(url.toString(), {
        method:   request.method,
        headers:  clean,
        body,
        redirect: "manual",
      });

      return await fetch(upstreamReq);
    } catch (err) {
      // Backend unreachable — return valid JSON so the loader doesn't crash
      return new Response(
        JSON.stringify({ status: false, reason: "Server temporarily unavailable" }),
        {
          status:  200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};
