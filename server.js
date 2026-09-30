// Zero-dependency server: no `npm install` needed. Run: node server.js
// Serves index.html gzipped + cached. Add OAuth/API routes below for live feeds.
// Never put private API secrets in index.html; keep them here as env vars.
const http = require("http"), fs = require("fs"), zlib = require("zlib"), path = require("path");
const page = fs.readFileSync(path.join(__dirname, "index.html"));
const pageGz = zlib.gzipSync(page, { level: 9 });
const json = (res, obj) => { res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };

http.createServer((req, res) => {
  const url = req.url.split("?")[0];
  if (url === "/api/health") return json(res, { ok: true, services: ["youtube", "tiktok", "x"] });
  if (url === "/api/feed") return json(res, { message: "Connect official APIs/OAuth on the server to return live feed items.", items: [] });
  if (url.startsWith("/auth/")) {
    const names = { youtube: ["YouTube", "YOUTUBE_CLIENT_ID"], tiktok: ["TikTok", "TIKTOK_CLIENT_KEY"], x: ["X", "X_CLIENT_ID"] };
    const svc = names[url.slice(6)];
    if (!svc) { res.writeHead(404); return res.end("Unknown service"); }
    if (!process.env[svc[1]]) return json(res, { configured: false, message: svc[0] + " isn't set up on the server yet. Add " + svc[1] + " as an environment variable, then restart." });
    return json(res, { configured: true, message: "Credentials found. Add the " + svc[0] + " OAuth redirect here in server.js." });
  }
  if (url === "/" || url === "/index.html") {
    const gz = /\bgzip\b/.test(req.headers["accept-encoding"] || "");
    const h = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300", "Vary": "Accept-Encoding" };
    if (gz) h["Content-Encoding"] = "gzip";
    res.writeHead(200, h);
    return res.end(gz ? pageGz : page);
  }
  res.writeHead(404); res.end("Not found");
}).listen(process.env.PORT || 3000, () => console.log("Social Hub running on http://localhost:" + (process.env.PORT || 3000)));
