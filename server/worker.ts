import { handleApi, type Env } from "./room-service";
import assets from "virtual:focus-town-assets";
const pages = new Set(["/", "/privacy", "/terms", "/cookies"]);
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env);
    if (!["GET", "HEAD"].includes(request.method))
      return new Response("Method not allowed", { status: 405 });
    const asset = assets[url.pathname] ?? assets["/index.html"];
    if (!asset) return new Response("Not found", { status: 404 });
    const known = !!assets[url.pathname] || pages.has(url.pathname);
    const binary = Uint8Array.from(atob(asset.body), (c) => c.charCodeAt(0));
    return new Response(request.method === "HEAD" ? null : binary, {
      status: known ? 200 : 404,
      headers: {
        "Content-Type": asset.type,
        "Cache-Control": url.pathname.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "no-cache",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
        "Content-Security-Policy":
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; base-uri 'self'; object-src 'none'",
      },
    });
  },
};
