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
    let body = binary,
      status = known ? 200 : 404,
      contentRange: string | undefined;
    const range = request.headers.get("Range");
    if (
      request.method === "GET" &&
      known &&
      asset.type.startsWith("audio/") &&
      range
    ) {
      const m = range.match(/^bytes=(\d*)-(\d*)$/);
      if (!m || (!m[1] && !m[2]))
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": "bytes */" + binary.length },
        });
      const start = m[1]
        ? Number(m[1])
        : Math.max(0, binary.length - Number(m[2]));
      const end = m[1]
        ? m[2]
          ? Math.min(Number(m[2]), binary.length - 1)
          : binary.length - 1
        : binary.length - 1;
      if (
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        start > end ||
        start >= binary.length
      )
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": "bytes */" + binary.length },
        });
      body = binary.slice(start, end + 1);
      status = 206;
      contentRange = "bytes " + start + "-" + end + "/" + binary.length;
    }
    return new Response(request.method === "HEAD" ? null : body, {
      status,
      headers: {
        "Content-Type": asset.type,
        "Content-Length": String(body.byteLength),
        ...(asset.type.startsWith("audio/")
          ? { "Accept-Ranges": "bytes" }
          : {}),
        ...(contentRange ? { "Content-Range": contentRange } : {}),
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
