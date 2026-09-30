/**
 * Production static host for Expo web export on Railway.
 * Binds 0.0.0.0:$PORT and fails fast if dist/ was not built.
 */
const http = require("http");
const path = require("path");
const fs = require("fs");
const handler = require("serve-handler");

const port = Number(process.env.PORT);
if (!port || Number.isNaN(port)) {
  console.error("PORT is not set (Railway should inject PORT).");
  process.exit(1);
}

const dist = path.join(__dirname, "dist");
const indexHtml = path.join(dist, "index.html");

if (!fs.existsSync(indexHtml)) {
  console.error(
    "Missing dist/index.html — run `npm run build` during deploy before starting.",
  );
  process.exit(1);
}

http
  .createServer((req, res) =>
    handler(req, res, {
      public: dist,
      rewrites: [{ source: "**", destination: "/index.html" }],
    }),
  )
  .listen(port, "0.0.0.0", () => {
    console.log(`Serving ${dist} at http://0.0.0.0:${port}`);
  });
