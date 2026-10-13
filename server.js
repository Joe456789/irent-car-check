// iRent 智能車況管家 Prototype 後端：靜態檔案 + Gemini 代理（API key 只留在伺服器端）
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;

function loadKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  try {
    const env = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
    const m = env.match(/^GEMINI_API_KEY=(.+)$/m);
    if (m) return m[1].trim();
  } catch {}
  return "";
}
const KEY = loadKey();
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// 公開部署時保護 Gemini 額度：每個 IP 每 10 分鐘最多 60 次、全站每天最多 1500 次
const WINDOW_MS = 10 * 60 * 1000, PER_IP = Number(process.env.RATE_PER_IP || 60), PER_DAY = Number(process.env.RATE_PER_DAY || 1500);
const hits = new Map();
let dayCount = 0, dayStart = Date.now();
function allow(ip) {
  const now = Date.now();
  if (now - dayStart > 86400000) { dayStart = now; dayCount = 0; }
  if (dayCount >= PER_DAY) return false;
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= PER_IP) { hits.set(ip, arr); return false; }
  arr.push(now); hits.set(ip, arr); dayCount++;
  return true;
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json" };

const PROMPTS = {
  quality: (c) => `你是 iRent 共享汽車的拍照品質檢查員。使用者正在拍攝「${c.viewName}」照片。請判斷這張照片是否合格，只回傳 JSON：
{"view_match": boolean(是否為要求的視角), "plate_visible": boolean(車牌是否清楚入鏡，僅車頭/車尾需要，其餘填 true), "distance": "ok"|"too_far"|"too_near", "lens_or_body_dirty": boolean(鏡頭或車身髒污影響判讀), "tip": "若不合格，用一句繁體中文告訴使用者怎麼重拍；合格則空字串"}`,
  existing: (c) => `你是租賃車輛的車況檢查員。這是取車時拍攝的「${c.viewName}」照片。請找出照片中「已存在」的車身損傷（刮傷、凹陷、破損等），只回傳 JSON：
{"existing_damage":[{"location":"位置(繁體中文)","type":"scratch|dent|crack|broken|other","severity":"輕|中|重","confidence":0到1,"description":"一句繁體中文描述","box":[ymin,xmin,ymax,xmax] 座標範圍 0-1000}]}
沒有損傷則回傳空陣列。反光、水痕、陰影不要當成損傷。`,
  compare: (c) => `你是租賃車輛的車況檢查員。第一張是取車時拍攝的基準照片，第二張是還車時同一視角（${c.viewName}）的照片。請找出「還車照中新增、取車照沒有」的車身損傷，已經存在於取車照的損傷不要列入。只回傳 JSON：
{"new_damage":[{"location":"位置(繁體中文)","type":"scratch|dent|crack|broken|other","severity":"輕|中|重","confidence":0到1,"description":"一句繁體中文描述","box":[ymin,xmin,ymax,xmax] 在還車照上的座標，範圍 0-1000}],"note":"補充說明"}
沒有新增損傷則 new_damage 為空陣列。光線、角度、反光、水痕造成的差異不要當成損傷。`,
  interior: (c) => `你是租賃車輛的車內清潔度檢查員。這是「${c.viewName}」照片。請把整潔程度分成三級：clean(乾淨)、normal(普通，輕微灰塵或小雜物)、dirty(髒汙，須立即清潔，如明顯垃圾、飲食污漬、嘔吐物、大量毛髮泥沙)。只回傳 JSON：
{"level":"clean|normal|dirty","reason":"一句繁體中文理由","confidence":0到1,"box":[ymin,xmin,ymax,xmax] 髒汙位置(若有，座標 0-1000，否則 null)}`,
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (d) => {
      size += d.length;
      if (size > 25 * 1024 * 1024) { reject(new Error("payload too large")); req.destroy(); return; }
      chunks.push(d);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function callGemini(task, context, images) {
  const parts = [{ text: PROMPTS[task](context) }];
  for (const url of images) {
    const m = /^data:(image\/[\w.+-]+);base64,(.+)$/.exec(url);
    if (!m) throw new Error("bad image data");
    parts.push({ inline_data: { mime_type: m[1], data: m[2] } });
  }
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
    body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json", temperature: 0.2, thinkingConfig: { thinkingBudget: 0 } } }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error((data.error && data.error.message) || "Gemini error " + r.status);
  const text = data.candidates && data.candidates[0] && data.candidates[0].content.parts.map((p) => p.text || "").join("");
  if (!text) throw new Error("empty response");
  return JSON.parse(text);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (url.pathname === "/api/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ ai: !!KEY, model: MODEL }));
    }
    if (url.pathname === "/api/analyze" && req.method === "POST") {
      const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
      if (!allow(ip)) { res.writeHead(429, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ error: "請求過多，請稍後再試" })); }
      if (!KEY) { res.writeHead(503, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ error: "no api key" })); }
      const body = JSON.parse(await readBody(req));
      if (!PROMPTS[body.task]) { res.writeHead(400); return res.end(JSON.stringify({ error: "bad task" })); }
      const out = await callGemini(body.task, body.context || {}, body.images || []);
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(out));
    }
    let p = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
    const file = path.join(ROOT, "public", path.normalize(p).replace(/^(\.\.[/\\])+/, ""));
    if (!file.startsWith(path.join(ROOT, "public"))) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404); return res.end("not found"); }
      res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
      res.end(buf);
    });
  } catch (e) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(e.message || e) }));
  }
});

server.listen(PORT, () => console.log(`iRent 智能車況管家 Prototype：http://localhost:${PORT}  (AI: ${KEY ? "已啟用 " + MODEL : "未設定 key，僅模擬模式"})`));
