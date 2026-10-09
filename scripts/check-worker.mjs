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

for (const name of ["rain", "forest", "fire", "lofi", "chime"]) {
  const url = "https://town.test/audio/" + name + ".mp3";
  const full = await worker.fetch(new Request(url), {});
  assert.equal(full.status, 200);
  assert.equal(full.headers.get("content-type"), "audio/mpeg");
  const bytes = new Uint8Array(await full.arrayBuffer());
  assert.ok(bytes.length > 1000);
  for (const [range, start, end] of [
    ["bytes=0-99", 0, 99],
    ["bytes=100-", 100, bytes.length - 1],
    ["bytes=-100", bytes.length - 100, bytes.length - 1],
  ]) {
    const partial = await worker.fetch(
      new Request(url, { headers: { Range: range } }),
      {},
    );
    assert.equal(partial.status, 206);
    assert.equal(
      partial.headers.get("content-range"),
      "bytes " + start + "-" + end + "/" + bytes.length,
    );
    assert.deepEqual(
      new Uint8Array(await partial.arrayBuffer()),
      bytes.slice(start, end + 1),
    );
  }
  const invalid = await worker.fetch(
    new Request(url, { headers: { Range: "bytes=" + bytes.length + "-" } }),
    {},
  );
  assert.equal(invalid.status, 416);
  const headAudio = await worker.fetch(
    new Request(url, { method: "HEAD", headers: { Range: "bytes=0-99" } }),
    {},
  );
  assert.equal(headAudio.status, 200);
  assert.equal(headAudio.headers.get("content-length"), String(bytes.length));
  assert.equal((await headAudio.arrayBuffer()).byteLength, 0);
}
console.log(
  "Five bundled audio files: full responses, byte ranges, invalid ranges and HEAD passed.",
);
