// 共用：常數、示範照片產生、影像檢查工具
const VIEWS = [
  { id: 'front', name: '車頭', hint: '對準車頭，車牌需入鏡', plate: true },
  { id: 'rear', name: '車尾', hint: '對準車尾，車牌需入鏡', plate: true },
  { id: 'left', name: '車身左側', hint: '站在左側，拍到整個車身' },
  { id: 'right', name: '車身右側', hint: '站在右側，拍到整個車身' },
  { id: 'seat-front', name: '車內前座', hint: '拍到前排座椅與地墊', interior: true },
  { id: 'seat-rear', name: '車內後座', hint: '拍到後排座椅與地墊', interior: true },
];
const PLATE = 'ABC-1234';
const CAR = 'TOYOTA Yaris Cross';
const SEV = { '輕': 'low', '中': 'mid', '重': 'high' };
const TYPE_ZH = { scratch: '刮傷', dent: '凹陷', crack: '裂痕', broken: '破損', other: '其他損傷' };

// ============ 範例照片（程式產生，供 Demo 使用）============
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function wheel(g, x, y, r) { g.fillStyle = '#222a36'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = '#aab3c0'; g.beginPath(); g.arc(x, y, r * .52, 0, 7); g.fill(); g.fillStyle = '#6b7482'; g.beginPath(); g.arc(x, y, r * .16, 0, 7); g.fill(); }
function bgExt(g) {
  const gr = g.createLinearGradient(0, 0, 0, 380); gr.addColorStop(0, '#cfd6e0'); gr.addColorStop(1, '#aeb7c4');
  g.fillStyle = gr; g.fillRect(0, 0, 640, 480);
  g.fillStyle = '#5b616d'; g.fillRect(0, 385, 640, 95);
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 5; g.beginPath(); g.moveTo(40, 470); g.lineTo(60, 395); g.moveTo(600, 470); g.lineTo(580, 395); g.stroke();
}
function drawSide(g, scratch, dent) {
  bgExt(g);
  g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(320, 410, 270, 16, 0, 0, 7); g.fill();
  g.fillStyle = '#e9edf2'; g.strokeStyle = '#8a94a3'; g.lineWidth = 3;
  rr(g, 70, 250, 500, 105, 28); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(180, 252); g.lineTo(240, 182); g.lineTo(420, 182); g.lineTo(490, 252); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#8fb3cf';
  g.beginPath(); g.moveTo(198, 248); g.lineTo(246, 194); g.lineTo(318, 194); g.lineTo(318, 248); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(332, 248); g.lineTo(332, 194); g.lineTo(412, 194); g.lineTo(470, 248); g.closePath(); g.fill();
  g.strokeStyle = '#8a94a3'; g.lineWidth = 2; g.beginPath(); g.moveTo(325, 252); g.lineTo(325, 350); g.moveTo(190, 252); g.lineTo(190, 350); g.moveTo(455, 252); g.lineTo(455, 350); g.stroke();
  g.fillStyle = '#9aa3b0'; rr(g, 280, 268, 34, 8, 4); g.fill(); rr(g, 400, 268, 34, 8, 4); g.fill();
  wheel(g, 170, 358, 50); wheel(g, 470, 358, 50);
  if (scratch) {
    g.strokeStyle = '#59616e'; g.lineWidth = 2.5;
    [[360, 296, 462, 284], [364, 303, 455, 293], [370, 310, 440, 301]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo((a + c) / 2, (b + d) / 2 + 4); g.lineTo(c, d); g.stroke(); });
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1; g.beginPath(); g.moveTo(360, 299); g.lineTo(462, 287); g.stroke();
  }
  if (dent) {
    const rg = g.createRadialGradient(300, 306, 4, 300, 306, 48); rg.addColorStop(0, 'rgba(40,50,70,.7)'); rg.addColorStop(.6, 'rgba(70,80,100,.35)'); rg.addColorStop(1, 'rgba(70,80,100,0)');
    g.fillStyle = rg; g.beginPath(); g.arc(300, 306, 48, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3; g.beginPath(); g.arc(292, 300, 26, 3.4, 5); g.stroke();
  }
}
function drawFrontRear(g, rear) {
  bgExt(g);
  g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(320, 412, 190, 14, 0, 0, 7); g.fill();
  g.fillStyle = '#e9edf2'; g.strokeStyle = '#8a94a3'; g.lineWidth = 3;
  rr(g, 170, 215, 300, 135, 30); g.fill(); g.stroke();
  g.fillStyle = '#8fb3cf'; g.beginPath(); g.moveTo(205, 215); g.lineTo(240, 130); g.lineTo(400, 130); g.lineTo(435, 215); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = rear ? '#e03c4b' : '#fff6c9'; g.beginPath(); g.ellipse(212, 262, 28, 14, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(428, 262, 28, 14, 0, 0, 7); g.fill();
  if (!rear) { g.fillStyle = '#2b323f'; rr(g, 270, 252, 100, 30, 8); g.fill(); }
  g.fillStyle = '#fff'; g.strokeStyle = '#1b1f2a'; g.lineWidth = 2; rr(g, 270, 298, 100, 32, 4); g.fill(); g.stroke();
  g.fillStyle = '#1b1f2a'; g.font = 'bold 20px Arial'; g.textAlign = 'center'; g.fillText(PLATE, 320, 322);
  g.fillStyle = '#222a36'; rr(g, 150, 322, 32, 62, 6); g.fill(); rr(g, 458, 322, 32, 62, 6); g.fill();
}
function bgInt(g, c1, c2) { const gr = g.createLinearGradient(0, 0, 0, 480); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, 0, 640, 480); }
function drawSeatFront(g) {
  bgInt(g, '#d8dde5', '#9aa3b0');
  g.fillStyle = '#bfdcf0'; rr(g, 60, 30, 520, 170, 16); g.fill();
  g.fillStyle = '#2b323f'; g.fillRect(0, 195, 640, 95);
  g.strokeStyle = '#1b1f2a'; g.lineWidth = 14; g.beginPath(); g.arc(190, 335, 68, 0, 7); g.stroke(); g.fillStyle = '#1b1f2a'; g.beginPath(); g.arc(190, 335, 18, 0, 7); g.fill();
  g.fillStyle = '#4a5163'; rr(g, 300, 300, 80, 150, 10); g.fill();
  g.fillStyle = '#3a4150'; rr(g, 430, 290, 180, 190, 24); g.fill();
  g.fillStyle = '#7a8190'; g.fillRect(0, 450, 640, 30);
}
function drawSeatRear(g, dirty) {
  bgInt(g, '#cfd5de', '#8f98a6');
  g.fillStyle = '#bfdcf0'; rr(g, 120, 28, 400, 120, 14); g.fill();
  g.fillStyle = '#444c5e'; rr(g, 60, 160, 520, 200, 24); g.fill();
  g.fillStyle = '#555e72'; [[110, 120], [260, 120], [410, 120]].forEach(([x]) => { rr(g, x, 120, 120, 50, 12); g.fill(); });
  g.fillStyle = '#3a4150'; rr(g, 40, 345, 560, 105, 18); g.fill();
  g.strokeStyle = '#1b1f2a'; g.lineWidth = 6; g.beginPath(); g.moveTo(180, 180); g.lineTo(240, 345); g.moveTo(460, 180); g.lineTo(400, 345); g.stroke();
  if (dirty) {
    g.fillStyle = 'rgba(107,74,47,.88)'; g.beginPath(); g.ellipse(230, 398, 62, 26, .2, 0, 7); g.fill(); g.beginPath(); g.ellipse(430, 270, 46, 30, -.3, 0, 7); g.fill();
    g.fillStyle = 'rgba(140,100,60,.8)'; g.beginPath(); g.ellipse(330, 420, 28, 12, 0, 0, 7); g.fill();
    g.save(); g.translate(500, 405); g.rotate(.5); g.fillStyle = '#fff'; rr(g, 0, 0, 34, 52, 4); g.fill(); g.fillStyle = '#d62839'; g.fillRect(0, 14, 34, 12); g.restore();
    g.fillStyle = '#f2d04b'; g.beginPath(); g.moveTo(120, 380); g.lineTo(165, 372); g.lineTo(150, 405); g.lineTo(118, 400); g.closePath(); g.fill();
    g.fillStyle = '#c9a86a'; for (let i = 0; i < 40; i++) { g.fillRect(150 + (i * 53) % 330, 360 + (i * 37) % 80, 4, 4); }
  }
}
function noise(g) { for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? 0 : 255},${Math.random() < .5 ? 0 : 255},255,${(Math.random() * .1).toFixed(3)})`; g.fillRect(Math.random() * 640, Math.random() * 480, 2, 2); } }
function wrongOf(v) { return v === 'front' ? 'left' : 'front'; }
function drawSample(viewId, phase, scenario, variant) {
  const c = document.createElement('canvas'); c.width = 640; c.height = 480; const g = c.getContext('2d');
  const v = variant === 'wrong' ? wrongOf(viewId) : viewId;
  const newDent = viewId === 'right' && phase === 'return' && scenario === 'dent';
  const dirty = viewId === 'seat-rear' && ((phase === 'return' && scenario === 'dirty') || (phase === 'pickup' && scenario === 'inherit'));
  if (v === 'front') drawFrontRear(g, false);
  else if (v === 'rear') drawFrontRear(g, true);
  else if (v === 'left') drawSide(g, viewId === 'left' && variant !== 'wrong', false);
  else if (v === 'right') drawSide(g, false, newDent);
  else if (v === 'seat-front') drawSeatFront(g);
  else drawSeatRear(g, dirty);
  noise(g);
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '13px sans-serif'; g.textAlign = 'left'; g.fillText('示範照片 SAMPLE', 12, 22);
  let out = c;
  if (variant === 'dark') { g.fillStyle = 'rgba(5,8,15,.84)'; g.fillRect(0, 0, 640, 480); }
  if (variant === 'blur') { out = document.createElement('canvas'); out.width = 640; out.height = 480; const g2 = out.getContext('2d'); g2.filter = 'blur(9px)'; g2.drawImage(c, 0, 0); }
  return out.toDataURL('image/jpeg', .85);
}

function loadImg(url) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = url; }); }
async function metrics(url) {
  const im = await loadImg(url); const w = 320, h = Math.round(im.height * 320 / im.width);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(im, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data; const gray = new Float32Array(w * h); let sum = 0;
  for (let i = 0; i < w * h; i++) { gray[i] = .299 * d[i * 4] + .587 * d[i * 4 + 1] + .114 * d[i * 4 + 2]; sum += gray[i]; }
  const mean = sum / (w * h); let lm = 0, ls = 0, n = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; const l = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w]; lm += l; ls += l * l; n++; }
  lm /= n; const lap = ls / n - lm * lm;
  return { mean, lap };
}
async function shrink(url, max = 1024) {
  const im = await loadImg(url); const k = Math.min(1, max / Math.max(im.width, im.height));
  const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', .85);
}
const BOX_SCRATCH = [555, 540, 655, 740], BOX_DENT = [540, 395, 730, 545], BOX_DIRTY = [490, 265, 960, 845];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FLOW = ['待確認', '已確認', '已派工', '已結案'];
function boxHtml(b) { if (!b) return ''; const [y1, x1, y2, x2] = b; return `<div class="bx" style="left:${x1 / 10}%;top:${y1 / 10}%;width:${(x2 - x1) / 10}%;height:${(y2 - y1) / 10}%"></div>`; }
function imgBox(url, box) { return url ? `<div class="imgbox"><img src="${url}">${boxHtml(box)}</div>` : `<div class="empty" style="background:var(--bg);border-radius:10px;padding:40px 10px">無照片</div>`; }
function fmtT(d) { return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }); }
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.getElementById('toast').appendChild(t); setTimeout(() => t.remove(), 4500); }
