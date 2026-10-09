import { describe, expect, it, vi } from "vitest";
import worker, { type CloudflareEnv } from "../server/cloudflare";
const ORIGIN = "https://focus.test";
const HTML = "<!doctype html><title>Focus Town</title>";
function fixture(
  serve: (request: Request) => Promise<Response> = async (request) =>
    new URL(request.url).pathname === "/index.html"
      ? new Response(request.method === "HEAD" ? null : HTML, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Length": String(HTML.length),
          },
        })
      : new Response("Missing", { status: 404 }),
) {
  const fetch = vi.fn(serve);
  const env: CloudflareEnv = { ASSETS: { fetch } };
  return {
    fetch,
    run: (path: string, init?: RequestInit) =>
      worker.fetch(new Request(ORIGIN + path, init), env),
  };
}
describe("Cloudflare adapter", () => {
  it.each(["/", "/privacy", "/terms", "/cookies"])(
    "serves the shell at %s without redirects",
    async (path) => {
      const f = fixture();
      const response = await f.run(path + "?ignored=1");
      expect(response.status).toBe(200);
      expect(await response.text()).toBe(HTML);
      expect(response.headers.get("Location")).toBeNull();
      expect(response.headers.get("Cache-Control")).toBe("no-cache");
      expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("Content-Security-Policy")).toContain(
        "connect-src 'self'",
      );
      expect(f.fetch.mock.calls[0][0].url).toBe(ORIGIN + "/index.html");
    },
  );
  it("returns the custom shell with a real 404 and no inherited range or cache conditionals", async () => {
    const f = fixture();
    const response = await f.run("/missing-page", {
      headers: { Range: "bytes=0-1", "If-None-Match": '"old"' },
    });
    expect(response.status).toBe(404);
    expect(await response.text()).toBe(HTML);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const fallback = f.fetch.mock.calls[1][0];
    expect(fallback.headers.has("Range")).toBe(false);
    expect(fallback.headers.has("If-None-Match")).toBe(false);
  });
  it.each(["/privacy", "/unknown"])(
    "HEAD %s retains representation headers without a body",
    async (path) => {
      const response = await fixture().run(path, { method: "HEAD" });
      expect(response.status).toBe(path === "/privacy" ? 200 : 404);
      expect(response.body).toBeNull();
      expect(response.headers.get("Content-Type")).toContain("text/html");
      expect(response.headers.get("Content-Length")).toBe(String(HTML.length));
    },
  );
  it("preserves the asset service's audio range, caching and bytes", async () => {
    const f = fixture(async (request) => {
      expect(request.headers.get("Range")).toBe("bytes=2-4");
      return new Response(new Uint8Array([2, 3, 4]), {
        status: 206,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Range": "bytes 2-4/10",
          "Content-Length": "3",
          "Accept-Ranges": "bytes",
          ETag: '"audio-v1"',
          "Cache-Control": "public, max-age=3600",
        },
      });
    });
    const response = await f.run("/audio/river.mp3", {
      headers: { Range: "bytes=2-4" },
    });
    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Range")).toBe("bytes 2-4/10");
    expect(response.headers.get("Content-Length")).toBe("3");
    expect(response.headers.get("ETag")).toBe('"audio-v1"');
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=3600");
    expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([
      2, 3, 4,
    ]);
  });
  it("strips Range on asset HEAD requests", async () => {
    const f = fixture(async (request) => {
      expect(request.method).toBe("HEAD");
      expect(request.headers.has("Range")).toBe(false);
      return new Response(null, {
        headers: { "Content-Type": "audio/mpeg", "Content-Length": "10" },
      });
    });
    const response = await f.run("/audio/river.mp3", {
      method: "HEAD",
      headers: { Range: "bytes=2-4" },
    });
    expect(response.status).toBe(200);
    expect(response.body).toBeNull();
    expect(response.headers.get("Content-Length")).toBe("10");
  });
  it.each([304, 416, 500])(
    "preserves asset status %s without an HTML fallback",
    async (status) => {
      const f = fixture(
        async () =>
          new Response(null, {
            status,
            headers: status === 416 ? { "Content-Range": "bytes */10" } : {},
          }),
      );
      const response = await f.run("/audio/river.mp3");
      expect(response.status).toBe(status);
      expect(f.fetch).toHaveBeenCalledTimes(1);
      expect(response.body).toBeNull();
      if (status === 416)
        expect(response.headers.get("Content-Range")).toBe("bytes */10");
    },
  );
  it("does not conceal a missing shell", async () => {
    expect(
      (
        await fixture(async () => new Response("Missing", { status: 404 })).run(
          "/",
        )
      ).status,
    ).toBe(404);
  });
  it("routes API calls to the existing backend", async () => {
    const f = fixture();
    const response = await f.run("/api/rooms", {
      method: "POST",
      headers: { Origin: ORIGIN, "Content-Type": "application/json" },
      body: "{}",
    });
    expect(response.status).toBe(503);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect((await response.json()).error).toContain("Co-op");
    expect(f.fetch).not.toHaveBeenCalled();
  });
  it("retains API same-origin protection", async () => {
    const f = fixture();
    const response = await f.run("/api/rooms", {
      method: "POST",
      headers: {
        Origin: "https://other.test",
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    expect(response.status).toBe(403);
    expect(f.fetch).not.toHaveBeenCalled();
  });
  it("keeps API HEAD bodyless and rejects page mutations", async () => {
    const f = fixture();
    const api = await f.run("/api/rooms", { method: "HEAD" });
    expect(api.status).toBe(405);
    expect(api.body).toBeNull();
    const page = await f.run("/privacy", { method: "POST" });
    expect(page.status).toBe(405);
    expect(page.headers.get("Allow")).toBe("GET, HEAD");
    expect(f.fetch).not.toHaveBeenCalled();
  });
});
