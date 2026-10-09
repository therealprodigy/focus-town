import assert from "node:assert/strict";
import worker from "../dist/server/index.js";
for (const path of ["/", "/privacy", "/terms", "/cookies"]) {
  const response = await worker.fetch(
    new Request("https://town.test" + path),
    {},
  );
  assert.equal(response.status, 200);
  assert.ok(response.headers.get("content-type").includes("text/html"));
  assert.ok((await response.text()).includes("<title>Focus Town</title>"));
}
const missing = await worker.fetch(
  new Request("https://town.test/path-that-does-not-exist"),
  {},
);
assert.equal(missing.status, 404);
const image = await worker.fetch(
  new Request("https://town.test/art/observatory.png"),
  {},
);
assert.equal(image.status, 200);
assert.equal(image.headers.get("content-type"), "image/png");
assert.ok((await image.arrayBuffer()).byteLength > 100000);
const head = await worker.fetch(
  new Request("https://town.test/", { method: "HEAD" }),
  {},
);
assert.equal((await head.text()).length, 0);
const api = await worker.fetch(
  new Request("https://town.test/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  }),
  {},
);
assert.equal(api.status, 503);
console.log(
  "Built Worker checks passed: documents, 404, image, HEAD, unavailable storage. No browser preview was opened.",
);
