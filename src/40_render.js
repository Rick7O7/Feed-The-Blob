/* ---------- drawing ---------- */
var cv, cx, VW = 800, VH = 600, DPR = 1, SC = 1, ZB = 0, TOUCH = false, cam = { x: HOMES[0].x, y: HOMES[0].y };
var FONT = '"Arial Rounded MT Bold","Nunito","Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif';
if (window.CanvasRenderingContext2D && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) { this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath(); return this; };
}
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2); VW = window.innerWidth; VH = window.innerHeight;
  cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR); cv.style.width = VW + 'px'; cv.style.height = VH + 'px';
  SC = clamp(Math.min(VW, VH) / 560, 0.5, 1.45);
  try {          // safe areas (notch, home bar): canvas-drawn HUD parts (mini map, edge arrows) keep out of them
    var pr = document.getElementById('safeprobe'), cs = getComputedStyle(pr);
    SAFE = { l: parseFloat(cs.paddingLeft) || 0, r: parseFloat(cs.paddingRight) || 0, t: parseFloat(cs.paddingTop) || 0, b: parseFloat(cs.paddingBottom) || 0 };
  } catch (e) { SAFE = { l: 0, r: 0, t: 0, b: 0 }; }
}
var SAFE = { l: 0, r: 0, t: 0, b: 0 };
function txt(str, x, y, size, col, alpha, align) {
  cx.font = '900 ' + size + 'px ' + FONT; cx.textAlign = align || 'center'; cx.textBaseline = 'middle';
  if (alpha !== undefined) cx.globalAlpha = alpha;
  cx.lineWidth = Math.max(3, size * 0.22); cx.strokeStyle = INK; cx.lineJoin = 'round'; cx.strokeText(str, x, y);
  cx.fillStyle = col; cx.fillText(str, x, y); cx.globalAlpha = 1;
}
function blobPath(x, y, r, wob, seed, squash) {
  var n = 26; cx.beginPath();
  for (var i = 0; i <= n; i++) {
    var a = i / n * TAU, rr = r * (1 + 0.03 * Math.sin(a * 3 + G.t * 2 + seed) + 0.02 * Math.sin(a * 5 - G.t * 2.7 + seed * 2) + wob * 0.05 * Math.sin(a * 2 + G.t * 11));
    var px = x + Math.cos(a) * rr * (1 + squash), py = y + Math.sin(a) * rr * (0.9 - squash);
    if (i) cx.lineTo(px, py); else cx.moveTo(px, py);
  }
  cx.closePath();
}
var SPOTS = [[-0.5, -0.32, 0.22], [0.48, -0.52, 0.16], [0.34, 0.36, 0.24], [-0.36, 0.5, 0.18], [-0.78, 0.1, 0.12], [0.78, 0.04, 0.14], [0.02, -0.72, 0.13]];
function drawPattern(x, y, r, sk) {
  var i, p = sk.pat; cx.fillStyle = sk.pcol; cx.strokeStyle = sk.pcol; cx.lineCap = 'round';
  if (p === 'stripes') { cx.save(); cx.translate(x, y); cx.rotate(0.35); for (i = -3; i <= 3; i++) cx.fillRect(i * r * 0.42 - r * 0.07, -r * 1.4, r * 0.15, r * 2.8); cx.restore(); }
  else if (p === 'spots') { for (i = 0; i < SPOTS.length; i++) { cx.beginPath(); cx.ellipse(x + SPOTS[i][0] * r, y + SPOTS[i][1] * r, SPOTS[i][2] * r, SPOTS[i][2] * r * 0.8, i, 0, TAU); cx.fill(); } }
  else if (p === 'glaze') {
    cx.beginPath(); cx.moveTo(x - r * 1.2, y - r * 1.2); cx.lineTo(x + r * 1.2, y - r * 1.2); cx.lineTo(x + r * 1.2, y - r * 0.1);
    for (i = 6; i >= -6; i--) cx.lineTo(x + i * r * 0.2, y - r * 0.1 + (i % 2 ? r * 0.16 : -r * 0.02)); cx.closePath(); cx.fill();
    var sc = ['#fff', '#7ad7ff', '#ffe066', '#8cf58a']; cx.lineWidth = Math.max(2, r * 0.035);
    for (i = 0; i < 9; i++) { var sx = x + Math.cos(i * 2.4) * r * 0.62, sy = y - r * 0.5 + Math.sin(i * 1.7) * r * 0.25; cx.strokeStyle = sc[i % 4]; cx.beginPath(); cx.moveTo(sx, sy); cx.lineTo(sx + Math.cos(i) * r * 0.08, sy + Math.sin(i) * r * 0.08); cx.stroke(); }
  }
  else if (p === 'stitch') { cx.lineWidth = Math.max(2, r * 0.03); cx.beginPath(); cx.moveTo(x - r * 0.75, y - r * 0.5); cx.lineTo(x + r * 0.15, y - r * 0.68); for (i = 0; i < 5; i++) { var qx = x - r * 0.65 + i * r * 0.18, qy = y - r * 0.52 - i * r * 0.036; cx.moveTo(qx - r * 0.03, qy - r * 0.07); cx.lineTo(qx + r * 0.03, qy + r * 0.07); } cx.stroke(); cx.fillStyle = 'rgba(150,170,110,.8)'; cx.beginPath(); cx.roundRect(x + r * 0.3, y + r * 0.35, r * 0.3, r * 0.24, 3); cx.fill(); cx.stroke(); }
  else if (p === 'cracks') { cx.lineWidth = Math.max(2.5, r * 0.04); cx.globalAlpha = 0.65 + 0.35 * Math.sin(G.t * 4); for (i = 0; i < 5; i++) { var a = i * 1.26 + 0.4; cx.beginPath(); cx.moveTo(x + Math.cos(a) * r * 0.25, y + Math.sin(a) * r * 0.25); cx.lineTo(x + Math.cos(a + 0.3) * r * 0.55, y + Math.sin(a + 0.3) * r * 0.5); cx.lineTo(x + Math.cos(a - 0.1) * r * 0.95, y + Math.sin(a - 0.1) * r * 0.85); cx.stroke(); } cx.globalAlpha = 1; }
  else if (p === 'flakes') { cx.lineWidth = Math.max(1.5, r * 0.022); for (i = 0; i < SPOTS.length; i++) { var fx = x + SPOTS[i][0] * r, fy = y + SPOTS[i][1] * r, fs = r * 0.09; cx.beginPath(); for (var k = 0; k < 3; k++) { cx.moveTo(fx + Math.cos(k * 1.047) * fs, fy + Math.sin(k * 1.047) * fs); cx.lineTo(fx - Math.cos(k * 1.047) * fs, fy - Math.sin(k * 1.047) * fs); } cx.stroke(); } }
  else if (p === 'stars') { for (i = 0; i < 16; i++) { cx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(G.t * 1.5 + i * 2.1)); cx.beginPath(); cx.arc(x + Math.cos(i * 2.4) * r * (0.25 + (i % 5) * 0.15), y + Math.sin(i * 1.9) * r * (0.2 + (i % 4) * 0.17), r * (0.018 + (i % 3) * 0.012), 0, TAU); cx.fill(); } cx.globalAlpha = 1; }
  else if (p === 'shine') { var s = ((G.t * 0.45) % 1.6 - 0.3) * r * 2 - r; cx.save(); cx.translate(x + s, y); cx.rotate(0.4); cx.fillRect(-r * 0.12, -r * 1.4, r * 0.24, r * 2.8); cx.fillRect(r * 0.2, -r * 1.4, r * 0.07, r * 2.8); cx.restore(); }
  else if (p === 'bolt') {          // electric: lightning bolts that flicker
    cx.lineWidth = Math.max(2.5, r * 0.06); cx.lineCap = 'round';
    for (i = 0; i < 3; i++) {
      var bx = x + (i - 1) * r * 0.52; cx.globalAlpha = (Math.floor(G.t * 7) + i) % 2 ? 1 : 0.28;
      cx.beginPath(); cx.moveTo(bx + r * 0.08, y - r * 0.72); cx.lineTo(bx - r * 0.16, y - r * 0.08); cx.lineTo(bx + r * 0.12, y - r * 0.02); cx.lineTo(bx - r * 0.12, y + r * 0.66); cx.stroke();
    }
    cx.globalAlpha = 1;
  }
  else if (p === 'flame') {         // fire: flames licking upward, animated
    for (i = 0; i < 5; i++) {
      var fx = x + (i - 2) * r * 0.4, fh = r * (0.55 + 0.3 * Math.abs(Math.sin(G.t * 6 + i * 1.3)));
      cx.globalAlpha = 0.55 + 0.45 * (i % 2);
      cx.beginPath(); cx.moveTo(fx - r * 0.2, y + r * 0.55); cx.quadraticCurveTo(fx - r * 0.12, y + r * 0.55 - fh * 0.6, fx, y + r * 0.55 - fh); cx.quadraticCurveTo(fx + r * 0.12, y + r * 0.55 - fh * 0.6, fx + r * 0.2, y + r * 0.55); cx.closePath(); cx.fill();
    }
    cx.globalAlpha = 1;
  }
  else if (p === 'hearts') {
    for (i = 0; i < SPOTS.length; i++) { var hx = x + SPOTS[i][0] * r, hy = y + SPOTS[i][1] * r, hs = r * 0.14; cx.beginPath(); cx.moveTo(hx, hy + hs); cx.bezierCurveTo(hx - hs * 1.7, hy - hs * 0.5, hx - hs, hy - hs * 1.5, hx, hy - hs * 0.4); cx.bezierCurveTo(hx + hs, hy - hs * 1.5, hx + hs * 1.7, hy - hs * 0.5, hx, hy + hs); cx.fill(); }
  }
  else if (p === 'band') {          // bee: bold horizontal bands
    for (i = -2; i <= 2; i++) cx.fillRect(x - r * 1.3, y + i * r * 0.42 - r * 0.11, r * 2.6, r * 0.22);
  }
  else if (p === 'camo') {
    for (i = 0; i < SPOTS.length; i++) { cx.globalAlpha = 0.55 + 0.25 * (i % 2); cx.beginPath(); cx.ellipse(x + SPOTS[i][0] * r, y + SPOTS[i][1] * r, SPOTS[i][2] * r * 1.35, SPOTS[i][2] * r * 0.95, i * 0.7, 0, TAU); cx.fill(); }
    cx.globalAlpha = 1;
  }
  else if (p === 'checker') {
    var cz = r * 0.34; cx.globalAlpha = 0.9;
    for (var cj = -2; cj <= 2; cj++) for (var ck = -2; ck <= 2; ck++) if ((cj + ck) & 1) cx.fillRect(x + ck * cz - cz / 2, y + cj * cz - cz / 2, cz, cz);
    cx.globalAlpha = 1;
  }
  else if (p === 'bubbles') {       // rising bubbles, animated
    cx.lineWidth = Math.max(1.5, r * 0.028);
    for (i = 0; i < 8; i++) { var bt = (G.t * 0.4 + i * 0.33) % 1, ux = x + Math.sin(i * 2.1) * r * 0.62, uy = y + r * 0.72 - bt * r * 1.5, ur = r * (0.05 + 0.05 * (i % 3)); cx.globalAlpha = Math.sin(bt * Math.PI) * 0.9; cx.beginPath(); cx.arc(ux, uy, ur, 0, TAU); cx.stroke(); }
    cx.globalAlpha = 1;
  }
  else if (p === 'swirl') {         // hypnotic spiral that turns
    cx.lineWidth = Math.max(3, r * 0.085); cx.lineCap = 'round'; cx.save(); cx.translate(x, y); cx.rotate(G.t * (sk.h < 0 ? 0.6 : 1.1));
    cx.beginPath(); for (i = 0; i < 80; i++) { var sa = i * 0.3, sr = i / 80 * r * 1.12, sx = Math.cos(sa) * sr, sy = Math.sin(sa) * sr; if (i) cx.lineTo(sx, sy); else cx.moveTo(sx, sy); } cx.stroke(); cx.restore();
  }
  else if (p === 'pixel') {         // 8-bit blocks
    var pz = r * 0.33; for (var pj = -2; pj <= 2; pj++) for (var pk = -2; pk <= 2; pk++) { var pv = (pk * 7 + pj * 3 + pk * pj) & 3; if (!pv) continue; cx.globalAlpha = pv === 3 ? 0.6 : pv === 2 ? 0.38 : 0.16; cx.fillRect(x + pk * pz - pz / 2, y + pj * pz - pz / 2, pz * 0.94, pz * 0.94); }
    cx.globalAlpha = 1;
  }
  else if (p === 'facet') {         // diamond: cut facets plus a sweeping shine
    cx.lineWidth = Math.max(1.5, r * 0.028);
    cx.beginPath(); cx.moveTo(x - r, y - r * 0.2); cx.lineTo(x + r, y - r * 0.2); cx.moveTo(x - r * 0.5, y - r); cx.lineTo(x - r * 0.2, y + r); cx.moveTo(x + r * 0.5, y - r); cx.lineTo(x + r * 0.2, y + r); cx.moveTo(x - r * 0.6, y - r * 0.2); cx.lineTo(x, y + r); cx.lineTo(x + r * 0.6, y - r * 0.2); cx.stroke();
    var fs = ((G.t * 0.5) % 1.8 - 0.4) * r * 2 - r; cx.save(); cx.clip && cx.translate(x + fs, y); cx.rotate(0.4); cx.globalAlpha = 0.8; cx.fillRect(-r * 0.1, -r * 1.4, r * 0.2, r * 2.8); cx.globalAlpha = 1; cx.restore();
  }
}
function crownAt(x, y, cw) {
  cx.beginPath(); cx.moveTo(x - cw, y); cx.lineTo(x - cw, y - cw * 0.9); cx.lineTo(x - cw * 0.45, y - cw * 0.4); cx.lineTo(x, y - cw * 1.1); cx.lineTo(x + cw * 0.45, y - cw * 0.4); cx.lineTo(x + cw, y - cw * 0.9); cx.lineTo(x + cw, y); cx.closePath();
  cx.fillStyle = '#ffd23c'; cx.fill(); cx.lineWidth = Math.max(2.5, cw * 0.1); cx.strokeStyle = INK; cx.stroke();
  cx.beginPath(); cx.arc(x, y - cw * 0.35, cw * 0.15, 0, TAU); cx.fillStyle = '#ff5b8a'; cx.fill();
}
// mood: 0 normal, 1 angry (boss), 2 sad (just got hit)
function drawBlobBody(x, y, r, sk, wob, seed, mouth, blink, lookX, lookY, level, mood) {
  var sq = clamp(wob * 0.04, -0.05, 0.07), h = sk.h < 0 ? (G.t * 40) % 360 : sk.h, s, k, angry = mood === 1, sad = mood === 2;
  cx.beginPath(); cx.ellipse(x, y + r * 0.82, r * 0.95, r * 0.26, 0, 0, TAU); cx.fillStyle = 'rgba(40,25,15,.22)'; cx.fill();
  blobPath(x, y, r, wob, seed, sq);
  var g = cx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.1);
  g.addColorStop(0, 'hsl(' + h + ',' + Math.min(100, sk.s + 5) + '%,' + Math.min(94, sk.l + 14) + '%)'); g.addColorStop(1, 'hsl(' + (sk.h < 0 ? (h + 80) % 360 : h) + ',' + Math.max(0, sk.s - 13) + '%,' + Math.max(8, sk.l - 13) + '%)');
  cx.fillStyle = g; cx.fill();
  if (sk.pat) { cx.save(); cx.clip(); drawPattern(x, y, r, sk); cx.restore(); blobPath(x, y, r, wob, seed, sq); }
  cx.lineWidth = Math.max(4, r * 0.05); cx.strokeStyle = 'hsl(' + h + ',' + Math.max(0, sk.s - 30) + '%,' + Math.max(10, Math.min(26, sk.l - 34)) + '%)'; cx.stroke();
  cx.beginPath(); cx.ellipse(x - r * 0.38, y - r * 0.45, r * 0.2, r * 0.11, -0.6, 0, TAU); cx.fillStyle = 'rgba(255,255,255,.5)'; cx.fill();
  var er = r * 0.15, ey = y - r * 0.16, ex = r * 0.3, ll = hyp(lookX, lookY) + 0.01, lx = lookX / ll * er * 0.4, ly = lookY / ll * er * 0.4;
  for (s = -1; s <= 1; s += 2) {
    if (blink < 0 && !angry) { cx.beginPath(); cx.moveTo(x + s * ex - er, ey); cx.lineTo(x + s * ex + er, ey); cx.lineWidth = Math.max(3, r * 0.04); cx.strokeStyle = INK; cx.stroke(); continue; }
    cx.beginPath(); cx.arc(x + s * ex, ey, er, 0, TAU); cx.fillStyle = '#fff'; cx.fill(); cx.lineWidth = Math.max(2, r * 0.025); cx.strokeStyle = INK; cx.stroke();
    cx.beginPath(); cx.arc(x + s * ex + lx, ey + ly, er * 0.52, 0, TAU); cx.fillStyle = INK; cx.fill();
    cx.beginPath(); cx.arc(x + s * ex + lx - er * 0.18, ey + ly - er * 0.2, er * 0.17, 0, TAU); cx.fillStyle = '#fff'; cx.fill();
    if (angry || sad) { var up = angry ? 1 : -1; cx.beginPath(); cx.moveTo(x + s * (ex - er * 1.2), ey - er * (1.1 + 0.4 * up)); cx.lineTo(x + s * (ex + er * 0.9), ey - er * (1.1 - 0.4 * up)); cx.lineWidth = Math.max(3.5, r * 0.055); cx.strokeStyle = INK; cx.stroke(); }
  }
  if (level >= 2 && !angry) { cx.fillStyle = 'rgba(255,120,150,.45)'; for (s = -1; s <= 1; s += 2) { cx.beginPath(); cx.ellipse(x + s * r * 0.5, y + r * 0.1, r * 0.11, r * 0.07, 0, 0, TAU); cx.fill(); } }
  var my = y + r * 0.26, mw = r * 0.27;
  if (mouth > 0.08 || angry) {
    var mh = r * (0.05 + (angry ? 0.16 : mouth * 0.26));
    cx.beginPath(); cx.ellipse(x, my, mw * (1 + mouth * 0.15), mh, 0, 0, TAU); cx.fillStyle = '#5a1f2b'; cx.fill(); cx.lineWidth = Math.max(2.5, r * 0.03); cx.strokeStyle = INK; cx.stroke();
    cx.save(); cx.clip(); cx.beginPath(); cx.ellipse(x, my + mh * 0.9, mw * 0.7, mh * 0.7, 0, 0, TAU); cx.fillStyle = '#ff7b93'; cx.fill();
    if (angry) { cx.fillStyle = '#fff'; for (k = -2; k <= 2; k++) { cx.beginPath(); cx.moveTo(x + k * mw * 0.36 - mw * 0.16, my - mh); cx.lineTo(x + k * mw * 0.36, my - mh * 0.2); cx.lineTo(x + k * mw * 0.36 + mw * 0.16, my - mh); cx.fill(); } }
    cx.restore();
  } else if (sad) { cx.beginPath(); cx.arc(x, my + r * 0.16, mw * 0.7, 1.15 * Math.PI, 1.85 * Math.PI); cx.lineWidth = Math.max(3, r * 0.04); cx.strokeStyle = INK; cx.stroke(); }
  else {
    cx.beginPath(); cx.arc(x, my - r * 0.06, mw * 0.8, 0.15 * Math.PI, 0.85 * Math.PI); cx.lineWidth = Math.max(3, r * 0.04); cx.strokeStyle = INK; cx.stroke();
    if (level >= 3) { cx.beginPath(); cx.roundRect(x - r * 0.05, my + r * 0.07, r * 0.1, r * 0.09, 2); cx.fillStyle = '#fff'; cx.fill(); cx.lineWidth = 2; cx.stroke(); }
  }
  if (level >= 4 && !angry) {
    for (s = -1; s <= 1; s += 2) { cx.beginPath(); cx.moveTo(x + s * r * 0.52, y - r * 0.72); cx.quadraticCurveTo(x + s * r * 0.78, y - r * 1.12, x + s * r * 0.48, y - r * 1.02); cx.quadraticCurveTo(x + s * r * 0.5, y - r * 0.88, x + s * r * 0.3, y - r * 0.82); cx.closePath(); cx.fillStyle = '#fff4d6'; cx.fill(); cx.lineWidth = Math.max(2.5, r * 0.03); cx.strokeStyle = INK; cx.stroke(); }
  }
  if (level >= 6 && !angry) { for (k = 0; k < 5; k++) { var oa = G.t * 0.9 + k * 1.257 + seed; cx.globalAlpha = 0.5 + 0.5 * Math.sin(G.t * 5 + k); cx.beginPath(); cx.arc(x + Math.cos(oa) * r * 1.12, y + Math.sin(oa) * r * 0.95, Math.max(2.5, r * 0.03), 0, TAU); cx.fillStyle = '#fff'; cx.fill(); } cx.globalAlpha = 1; }
}
function drawSpikes(b) {
  var n = 16, a0 = G.t * 0.5, vis = b.shield > 1.5 || Math.floor(G.t * 8) % 2;
  if (!vis) return;
  for (var i = 0; i < n; i++) {
    var a = a0 + i / n * TAU, c = Math.cos(a), s = Math.sin(a) * 0.9, r0 = b.r * 0.96, r1 = b.r * 1.22 + Math.sin(G.t * 6 + i) * 3, w = b.r * 0.1;
    cx.beginPath(); cx.moveTo(b.x + c * r0 - s * w, b.y + s * r0 + c * w); cx.lineTo(b.x + c * r1, b.y + s * r1); cx.lineTo(b.x + c * r0 + s * w, b.y + s * r0 - c * w); cx.closePath();
    cx.fillStyle = '#f2f2f2'; cx.fill(); cx.lineWidth = 3; cx.strokeStyle = INK; cx.stroke();
  }
}
function drawItem(it, lowg) {
  var k = KIND[it.kind], sp = it.kind === 'goo' ? SPR['goo' + it.src] : SPR[it.kind], w = sp.width / 2, z = it.z, a = 1;
  if (it.state === 1) { if (it.life < 2.5) a = 0.3 + 0.7 * Math.abs(Math.sin(it.life * 9)); if (lowg) z = 7 + Math.sin(G.t * 3 + it.x * 0.05) * 4; if (it.kind === 'heart') z = 5 + Math.abs(Math.sin(G.t * 4 + it.x)) * 7; }
  if (it.state < 2 || it.state === 3) { var sh = clamp(1 - z / 800, 0.25, 1); cx.beginPath(); cx.ellipse(it.x, it.y + k.r * 0.7, k.r * sh, k.r * 0.38 * sh, 0, 0, TAU); cx.fillStyle = 'rgba(40,25,15,' + (0.22 * sh) + ')'; cx.fill(); }
  var s = (it.state === 2 ? 0.82 : 1) * (1 + Math.max(0, it.pop) * 0.4), rot = it.kind === 'star' ? G.t * 2 : it.kind === 'heart' ? 0 : it.rot + (it.state === 0 ? it.z * 0.004 : 0);
  cx.globalAlpha = a; cx.save(); cx.translate(it.x, it.y - z - (it.state === 2 ? 6 : 0)); cx.rotate(rot); cx.scale(s, s); cx.drawImage(sp, -w / 2, -w / 2, w, w); cx.restore(); cx.globalAlpha = 1;
  if ((it.kind === 'gem' || it.kind === 'gold' || it.kind === 'star') && it.state === 1 && Math.sin(G.t * 5 + it.x) > 0.93) { cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(it.x + 6, it.y - 9 - z, 2.6, 0, TAU); cx.fill(); }
}
function drawHat(id, r) {
  cx.lineWidth = 2.5; cx.strokeStyle = INK;
  if (id === 'cap') { cx.beginPath(); cx.arc(0, -r * 0.55, r * 0.78, Math.PI, 0); cx.closePath(); cx.fillStyle = '#ff5b5b'; cx.fill(); cx.stroke(); cx.beginPath(); cx.roundRect(r * 0.2, -r * 0.68, r * 0.95, r * 0.2, 3); cx.fill(); cx.stroke(); }
  else if (id === 'tophat') { cx.beginPath(); cx.roundRect(-r * 0.55, -r * 1.75, r * 1.1, r * 1.05, 3); cx.fillStyle = '#3b2a20'; cx.fill(); cx.stroke(); cx.beginPath(); cx.roundRect(-r * 0.95, -r * 0.85, r * 1.9, r * 0.24, 3); cx.fill(); cx.stroke(); cx.fillStyle = '#ff5b8a'; cx.fillRect(-r * 0.55, -r * 1.05, r * 1.1, r * 0.18); }
  else if (id === 'ears') { for (var s = -1; s <= 1; s += 2) { cx.beginPath(); cx.moveTo(s * r * 0.85, -r * 0.45); cx.lineTo(s * r * 0.75, -r * 1.35); cx.lineTo(s * r * 0.2, -r * 0.9); cx.closePath(); cx.fillStyle = '#ffb3d1'; cx.fill(); cx.stroke(); } }
  else if (id === 'halo') { cx.beginPath(); cx.ellipse(0, -r * 1.45, r * 0.7, r * 0.2, 0, 0, TAU); cx.lineWidth = 6; cx.strokeStyle = INK; cx.stroke(); cx.lineWidth = 3; cx.strokeStyle = '#ffe14d'; cx.stroke(); }
  else if (id === 'crown') crownAt(0, -r * 0.8, r * 0.62);
}
function drawActor(a) {
  var col = COLORS[a.id], bob = Math.abs(Math.sin(a.step * 0.085)) * 3, x = a.x, y = a.y - 3 - bob, P = a.id === 0, sp = hyp(a.vx, a.vy);
  cx.beginPath(); cx.ellipse(a.x, a.y + a.r - 3, a.r * 0.9, a.r * 0.36, 0, 0, TAU); cx.fillStyle = 'rgba(40,25,15,.24)'; cx.fill();
  if (a.atk > 0 && sp > 80) { for (var g = 1; g <= 3; g++) { cx.globalAlpha = 0.28 - g * 0.07; cx.beginPath(); cx.arc(x - a.vx / sp * g * 13, y - a.vy / sp * g * 13, a.r * (1 - g * 0.08), 0, TAU); cx.fillStyle = '#fff'; cx.fill(); } cx.globalAlpha = 1; }
  if ((a.immune > 0 || a.inv > 0) && Math.floor(G.t * 14) % 2) cx.globalAlpha = 0.4;
  cx.beginPath(); cx.roundRect(x - a.fx * 14 - 8, y - a.fy * 12 - 8, 16, 16, 5); cx.fillStyle = '#8b5a3c'; cx.fill(); cx.lineWidth = 2.5; cx.strokeStyle = INK; cx.stroke();
  var st = a.atk > 0 ? 1.28 : a.sprint ? 1.1 : 1, ang = Math.atan2(a.vy, a.vx);
  cx.save(); cx.translate(x, y);
  if (st > 1 && sp > 60) { cx.rotate(ang); cx.scale(st, 1 / st); cx.rotate(-ang); }
  cx.beginPath(); cx.arc(0, 0, a.r, 0, TAU); cx.fillStyle = col; cx.fill(); cx.lineWidth = 3; cx.strokeStyle = INK; cx.stroke();
  cx.beginPath(); cx.arc(-5, -7, 4.5, 0, TAU); cx.fillStyle = 'rgba(255,255,255,.45)'; cx.fill();
  var ex = a.fx * 5, ey = a.fy * 4 - 2;
  for (var s = -1; s <= 1; s += 2) {
    var px = s * 6.2 * (1 - Math.abs(a.fx) * 0.25) + ex;
    if (a.stun > 0) { cx.beginPath(); cx.moveTo(px - 3, ey - 3); cx.lineTo(px + 3, ey + 3); cx.moveTo(px + 3, ey - 3); cx.lineTo(px - 3, ey + 3); cx.lineWidth = 2.2; cx.strokeStyle = INK; cx.stroke(); continue; }
    cx.beginPath(); cx.arc(px, ey, 5, 0, TAU); cx.fillStyle = '#fff'; cx.fill(); cx.lineWidth = 1.6; cx.strokeStyle = INK; cx.stroke();
    cx.beginPath(); cx.arc(px + a.fx * 2, ey + a.fy * 2, 2.4, 0, TAU); cx.fillStyle = INK; cx.fill();
  }
  if (P && G.hat !== 'none') drawHat(G.hat, a.r);
  cx.restore(); cx.globalAlpha = 1;
  if (P) {
    var smax = stamMax(a);
    if (a.stam < smax - 0.5 || a.sprint) {
      var a0 = Math.PI * 0.82, a1 = Math.PI * 0.18, f = a.stam / smax;
      cx.lineCap = 'round'; cx.beginPath(); cx.arc(a.x, a.y, a.r + 11, a1, a0); cx.lineWidth = 7; cx.strokeStyle = 'rgba(59,42,32,.6)'; cx.stroke();
      if (f > 0.01) { cx.beginPath(); cx.arc(a.x, a.y, a.r + 11, a0 - (a0 - a1) * f, a0); cx.lineWidth = 4.5; cx.strokeStyle = a.tired > 0 ? '#ff5b5b' : a.stam < 22 ? '#ff9f2e' : '#ffe14d'; cx.stroke(); }
    }
    if (G.t < 25 && !OB.on) { var by = y - a.r - 16 - Math.abs(Math.sin(G.t * 4)) * 5; cx.beginPath(); cx.moveTo(x - 8, by - 9); cx.lineTo(x + 8, by - 9); cx.lineTo(x, by + 2); cx.closePath(); cx.fillStyle = '#fff'; cx.fill(); cx.lineWidth = 2.5; cx.strokeStyle = INK; cx.stroke(); }
    if (a.starT > 0) { cx.beginPath(); cx.arc(a.x, a.y, pickR(a) * 2.3 * 3, 0, TAU); cx.strokeStyle = 'rgba(255,243,107,.5)'; cx.lineWidth = 3; cx.setLineDash([10, 12]); cx.lineDashOffset = -G.t * 60; cx.stroke(); cx.setLineDash([]); }
  } else txt(NAMES[a.id], a.x, y - a.r - 11, 12, '#fff', 0.9);
}
function chevron(x, y, col) {
  var b = Math.abs(Math.sin(G.t * 5)) * 9; cx.beginPath(); cx.moveTo(x - 13, y - 22 - b); cx.lineTo(x + 13, y - 22 - b); cx.lineTo(x, y - 4 - b); cx.closePath();
  cx.fillStyle = col; cx.fill(); cx.lineWidth = 3; cx.strokeStyle = INK; cx.stroke();
}
function edgeArrow(wx, wy, col, label, pulse) {
  var z = SC * (1 - 0.05 * ZB), sx = (wx - cam.x) * z + VW / 2, sy = (wy - cam.y) * z + VH / 2, m = 46, land = VH < 430, top = (land ? 122 : 118) + SAFE.t, bot = VH - SAFE.b - (land ? (TOUCH ? 150 : 104) : TOUCH ? 215 : 128);
  if (sx > m + SAFE.l && sx < VW - m - SAFE.r && sy > top && sy < bot) return;
  var px = clamp(sx, m + SAFE.l, VW - m - SAFE.r), py = clamp(sy, top, bot), ang = Math.atan2(sy - py, sx - px), s = 1 + (pulse ? Math.abs(Math.sin(G.t * 6)) * 0.25 : 0);
  cx.save(); cx.translate(px, py); cx.scale(s, s);
  cx.beginPath(); cx.arc(0, 0, 20, 0, TAU); cx.fillStyle = col; cx.fill(); cx.lineWidth = 3; cx.strokeStyle = INK; cx.stroke();
  cx.rotate(ang); cx.beginPath(); cx.moveTo(30, 0); cx.lineTo(19, -9); cx.lineTo(19, 9); cx.closePath(); cx.fillStyle = col; cx.fill(); cx.stroke(); cx.restore();
  var lb = T(label); txt(lb, px, py, lb.length > 6 ? 7.5 : lb.length > 4 ? 9 : 10, '#fff');
}
function near(x, y, r) { return Math.abs(x - VIEW.x) < VIEW.w / 2 + r && Math.abs(y - VIEW.y) < VIEW.h / 2 + r; }
function wobPath(x, y, r, p, live) {
  var n = p.length; cx.beginPath();
  for (var i = 0; i <= n; i++) { var a = i / n * TAU, rr = r * (p[i % n] + (live ? 0.025 * Math.sin(G.t * 1.6 + i * 1.3) : 0)), px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.9; if (i) cx.lineTo(px, py); else cx.moveTo(px, py); }
  cx.closePath();
}
// everything that lies flat on the floor: colour patches, lanes, plaza, sticky zones, speed pads, portals, plants
function drawGround(th) {
  var M = G.map, i, k, o, mx = W / 2, my = H / 2;
  cx.fillStyle = th.patch;
  for (i = 0; i < M.patches.length; i++) { o = M.patches[i]; if (!near(o.x, o.y, o.rx)) continue; cx.beginPath(); cx.ellipse(o.x, o.y, o.rx, o.ry, o.rot, 0, TAU); cx.fill(); }
  cx.beginPath();
  for (i = 0; i < 4; i++) { var hx = HOMES[i].x, hy = HOMES[i].y, hd = hyp(mx - hx, my - hy); cx.moveTo(hx, hy); cx.lineTo(mx - (mx - hx) / hd * 205, my - (my - hy) / hd * 205); }
  cx.lineWidth = 80; cx.strokeStyle = th.lane; cx.stroke();
  if (near(mx, my, 240)) {
    cx.beginPath(); cx.arc(mx, my, 205, 0, TAU); cx.fillStyle = th.lane; cx.fill();
    cx.setLineDash([22, 16]); cx.lineDashOffset = G.t * 14; cx.lineWidth = 6; cx.strokeStyle = th.edge; cx.globalAlpha = 0.5; cx.stroke(); cx.setLineDash([]);
    cx.beginPath(); for (k = 0; k < 10; k++) { var sr = k % 2 ? 46 : 104, sa = -Math.PI / 2 + k * Math.PI / 5; cx.lineTo(mx + Math.cos(sa) * sr, my + Math.sin(sa) * sr); } cx.closePath();
    cx.globalAlpha = 0.22; cx.fillStyle = th.edge; cx.fill(); cx.globalAlpha = 1;
  }
  for (i = 0; i < M.slows.length; i++) {
    o = M.slows[i]; if (!near(o.x, o.y, o.r * 1.3)) continue;
    wobPath(o.x, o.y, o.r, o.p, true); cx.fillStyle = th.slow; cx.fill(); cx.lineWidth = 5; cx.strokeStyle = th.slowEdge; cx.stroke();
    for (k = 0; k < 4; k++) { var bt = (G.t * 0.35 + k * 0.27 + i * 0.13) % 1, ba = k * 1.9 + i; cx.globalAlpha = 1 - bt; cx.beginPath(); cx.arc(o.x + Math.cos(ba) * o.r * 0.5, o.y + Math.sin(ba) * o.r * 0.4, 4 + bt * 12, 0, TAU); cx.lineWidth = 3; cx.stroke(); }
    cx.globalAlpha = 1;
  }
  for (i = 0; i < M.decor.length; i++) {
    o = M.decor[i]; if (!near(o.x, o.y, 30)) continue;
    if (o.k === 0) { cx.strokeStyle = th.tuft; cx.lineWidth = 3.5; cx.beginPath(); for (k = -1; k <= 1; k++) { cx.moveTo(o.x + k * 4 * o.s, o.y); cx.lineTo(o.x + k * 10 * o.s + Math.sin(G.t * 1.4 + o.rot) * 2, o.y - (13 - Math.abs(k) * 4) * o.s); } cx.stroke(); }
    else if (o.k === 1) { cx.fillStyle = th.dots[o.c]; for (k = 0; k < 4; k++) { cx.beginPath(); cx.arc(o.x + Math.cos(o.rot + k * 1.7) * 9 * o.s, o.y + Math.sin(o.rot + k * 1.7) * 7 * o.s, (2.2 + (k % 2)) * o.s, 0, TAU); cx.fill(); } }
    else { cx.beginPath(); cx.ellipse(o.x, o.y, 9 * o.s, 6 * o.s, o.rot, 0, TAU); cx.fillStyle = th.grid; cx.fill(); }
  }
  for (i = 0; i < M.pads.length; i++) {
    o = M.pads[i]; if (!near(o.x, o.y, 70)) continue;
    cx.beginPath(); cx.arc(o.x, o.y, o.r, 0, TAU); cx.fillStyle = 'rgba(255,225,77,' + (0.3 + Math.max(0, o.t) * 0.4) + ')'; cx.fill();
    cx.setLineDash([13, 10]); cx.lineDashOffset = -G.t * 46; cx.lineWidth = 5; cx.strokeStyle = '#ffab00'; cx.stroke(); cx.setLineDash([]);
    var ps = 1 + Math.max(0, o.t) * 0.35 + Math.sin(G.t * 5 + i) * 0.05;
    cx.save(); cx.translate(o.x, o.y); cx.scale(ps, ps); cx.beginPath(); cx.moveTo(5, -24); cx.lineTo(-13, 4); cx.lineTo(-1, 4); cx.lineTo(-6, 24); cx.lineTo(13, -5); cx.lineTo(1, -5); cx.closePath();
    cx.fillStyle = '#ffe14d'; cx.fill(); cx.lineWidth = 3; cx.strokeStyle = INK; cx.stroke(); cx.restore();
  }
  for (i = 0; i < M.portals.length; i++) {
    o = M.portals[i]; if (!near(o.x, o.y, 80)) continue;
    cx.beginPath(); cx.ellipse(o.x, o.y, 40, 33, 0, 0, TAU); cx.fillStyle = INK; cx.globalAlpha = 0.55; cx.fill(); cx.globalAlpha = 1;
    for (k = 0; k < 3; k++) { var pr = 38 - k * 10, pa = G.t * (2.2 + k) * (i % 2 ? -1 : 1) + k * 2; cx.beginPath(); cx.ellipse(o.x, o.y, pr, pr * 0.82, 0, pa, pa + 4.3); cx.lineWidth = 7 - k * 1.5; cx.strokeStyle = k === 1 ? '#fff' : o.col; cx.stroke(); }
  }
}
// things that stand on the floor: rocks, bumpers, crates
function drawSolids(th) {
  var M = G.map, i, k, o;
  for (i = 0; i < M.rocks.length; i++) {
    o = M.rocks[i]; if (!near(o.x, o.y, o.r + 30)) continue;
    cx.beginPath(); cx.ellipse(o.x, o.y + o.r * 0.5, o.r * 1.02, o.r * 0.5, 0, 0, TAU); cx.fillStyle = 'rgba(40,25,15,.22)'; cx.fill();
    if (o.b) {
      var bs = 1 + Math.max(0, o.t) * 0.28, by = o.y - 8;
      cx.beginPath(); cx.arc(o.x, by, o.r * bs, 0, TAU); cx.fillStyle = '#ff5b8a'; cx.fill(); cx.lineWidth = 4; cx.strokeStyle = INK; cx.stroke();
      cx.beginPath(); cx.arc(o.x, by, o.r * bs * 0.62, 0, TAU); cx.fillStyle = '#fff'; cx.fill(); cx.lineWidth = 3; cx.stroke();
      cx.beginPath(); cx.arc(o.x, by, o.r * bs * 0.28, 0, TAU); cx.fillStyle = '#ffd23c'; cx.fill(); cx.stroke();
    } else {
      var n = o.p.length, ry = o.y - o.r * 0.18;
      cx.beginPath(); for (k = 0; k < n; k++) { var a = k / n * TAU, rr = o.r * o.p[k]; cx.lineTo(o.x + Math.cos(a) * rr, ry + Math.sin(a) * rr * 0.88); } cx.closePath();
      cx.fillStyle = th.rock; cx.fill(); cx.lineWidth = 4; cx.strokeStyle = INK; cx.stroke();
      cx.beginPath(); cx.arc(o.x - o.r * 0.1, ry - o.r * 0.05, o.r * 0.58, Math.PI * 1.05, Math.PI * 1.6); cx.lineWidth = Math.max(4, o.r * 0.12); cx.strokeStyle = 'rgba(255,255,255,.3)'; cx.stroke();
      cx.beginPath(); cx.arc(o.x + o.r * 0.1, ry + o.r * 0.05, o.r * 0.6, Math.PI * 0.1, Math.PI * 0.55); cx.strokeStyle = 'rgba(0,0,0,.16)'; cx.stroke();
    }
  }
  for (i = 0; i < G.crates.length; i++) {
    o = G.crates[i]; if (!near(o.x, o.y, 60)) continue;
    var cs = Math.min(1, o.age * 5) * (1 + Math.max(0, o.wob) * 0.18), tilt = Math.max(0, o.wob) * Math.sin(G.t * 40) * 0.12 + Math.sin(G.t * 2 + o.x) * 0.03;
    cx.beginPath(); cx.ellipse(o.x, o.y + 16, 27 * cs, 10 * cs, 0, 0, TAU); cx.fillStyle = 'rgba(40,25,15,.22)'; cx.fill();
    cx.save(); cx.translate(o.x, o.y - 6); cx.rotate(tilt); cx.scale(cs, cs);
    if (o.lucky) { cx.beginPath(); cx.arc(0, 0, 40 + Math.sin(G.t * 5) * 4, 0, TAU); cx.fillStyle = 'rgba(255,243,107,.35)'; cx.fill(); }
    cx.beginPath(); cx.roundRect(-23, -21, 46, 42, 6); cx.fillStyle = o.lucky ? (o.hp > 1 ? '#ffd23c' : '#e8b020') : o.hp > 1 ? '#c98a5a' : '#b0744a'; cx.fill(); cx.lineWidth = 3.5; cx.strokeStyle = INK; cx.stroke();
    cx.beginPath(); cx.moveTo(-23, -7); cx.lineTo(23, -7); cx.moveTo(-23, 8); cx.lineTo(23, 8); cx.lineWidth = 2.5; cx.strokeStyle = 'rgba(59,42,32,.55)'; cx.stroke();
    if (o.hp < 2) { cx.beginPath(); cx.moveTo(-6, -21); cx.lineTo(2, -6); cx.lineTo(-5, 4); cx.lineTo(4, 21); cx.lineWidth = 3; cx.strokeStyle = INK; cx.stroke(); }
    cx.beginPath(); for (k = 0; k < 10; k++) { var cr = k % 2 ? 4.5 : 10, ca = -Math.PI / 2 + k * Math.PI / 5; cx.lineTo(Math.cos(ca) * cr, Math.sin(ca) * cr); } cx.closePath(); cx.fillStyle = '#ffd23c'; cx.fill(); cx.lineWidth = 2; cx.strokeStyle = INK; cx.stroke();
    cx.restore();
  }
}
function drawCloudShadows() {
  for (var i = 0; i < G.clouds.length; i++) {
    var o = G.clouds[i]; if (!near(o.x, o.y, o.r + 20)) continue;
    cx.beginPath(); cx.ellipse(o.x, o.y, o.r, o.r * 0.9, 0, 0, TAU); cx.fillStyle = 'rgba(40,25,15,.1)'; cx.fill();
    cx.setLineDash([10, 14]); cx.lineDashOffset = G.t * 20; cx.lineWidth = 3; cx.strokeStyle = 'rgba(255,255,255,.55)'; cx.stroke(); cx.setLineDash([]);
  }
}
function drawClouds(P) {
  for (var i = 0; i < G.clouds.length; i++) {
    var o = G.clouds[i], y = o.y - 250 + Math.sin(G.t * 0.8 + o.ph) * 8; if (!near(o.x, y, 260)) continue;
    var under = hyp(P.x - o.x, P.y - o.y) < o.r + 60 || Math.abs(P.x - o.x) < 240 && Math.abs(P.y - y) < 120, k;
    cx.globalAlpha = under ? 0.28 : 0.82;
    cx.fillStyle = '#c9d6ea'; cx.beginPath(); cx.ellipse(o.x, y + 22, 150, 30, 0, 0, TAU); cx.fill();
    cx.fillStyle = '#fff'; cx.beginPath();
    var B = [[-105, 6, 52], [-48, -26, 66], [22, -34, 74], [92, -4, 56], [0, 12, 70]];
    for (k = 0; k < B.length; k++) { cx.moveTo(o.x + B[k][0] + B[k][2], y + B[k][1]); cx.arc(o.x + B[k][0], y + B[k][1], B[k][2], 0, TAU); }
    cx.fill();
    cx.globalAlpha = under ? 0.3 : 0.9; cx.strokeStyle = '#ffd23c'; cx.lineWidth = 4;
    for (k = 0; k < 5; k++) { var rt = (G.t * 1.3 + k * 0.21 + i * 0.4) % 1, rx = o.x - 90 + k * 45; cx.beginPath(); cx.moveTo(rx, y + 50 + rt * 60); cx.lineTo(rx, y + 64 + rt * 60); cx.stroke(); }
    cx.globalAlpha = 1;
  }
}
// small map: the arena is bigger than the screen, so this shows homes, rivals, clouds, crates and portals
function drawMini(th) {
  var mw, x0, y0, M = G.map, i, o;
  if (VH < 430) { mw = 120; x0 = 10 + SAFE.l; y0 = 92 + SAFE.t; } else if (VW < 860) { mw = 104; x0 = VW - mw - 10 - SAFE.r; y0 = 222 + SAFE.t; } else { mw = 172; x0 = VW - mw - 10 - SAFE.r; y0 = 66 + SAFE.t; }
  var k = mw / W, mh = H * k, dark = G.rb % 5 >= 3;
  cx.save(); cx.translate(x0, y0); cx.lineJoin = 'round';
  cx.globalAlpha = 0.9; cx.beginPath(); cx.roundRect(-3, -3, mw + 6, mh + 6, 9); cx.fillStyle = th.floor; cx.fill(); cx.globalAlpha = 1; cx.lineWidth = 3; cx.strokeStyle = INK; cx.stroke();
  cx.beginPath(); cx.roundRect(0, 0, mw, mh, 6); cx.clip();
  cx.fillStyle = th.slow; for (i = 0; i < M.slows.length; i++) { o = M.slows[i]; cx.beginPath(); cx.arc(o.x * k, o.y * k, o.r * k, 0, TAU); cx.fill(); }
  cx.fillStyle = dark ? 'rgba(255,255,255,.3)' : 'rgba(59,42,32,.3)'; for (i = 0; i < M.rocks.length; i++) { o = M.rocks[i]; cx.beginPath(); cx.arc(o.x * k, o.y * k, Math.max(1.5, o.r * k), 0, TAU); cx.fill(); }
  for (i = 0; i < G.clouds.length; i++) { o = G.clouds[i]; cx.beginPath(); cx.arc(o.x * k, o.y * k, o.r * k, 0, TAU); cx.fillStyle = 'rgba(255,255,255,.75)'; cx.fill(); cx.lineWidth = 1; cx.strokeStyle = 'rgba(59,42,32,.5)'; cx.stroke(); }
  for (i = 0; i < M.portals.length; i++) { o = M.portals[i]; cx.beginPath(); cx.arc(o.x * k, o.y * k, 3, 0, TAU); cx.fillStyle = o.col; cx.fill(); cx.lineWidth = 1.2; cx.strokeStyle = INK; cx.stroke(); }
  cx.fillStyle = '#c98a5a'; cx.lineWidth = 1; cx.strokeStyle = INK; for (i = 0; i < G.crates.length; i++) { o = G.crates[i]; cx.beginPath(); cx.rect(o.x * k - 2.5, o.y * k - 2.5, 5, 5); cx.fill(); cx.stroke(); }
  for (i = 0; i < 4; i++) {
    o = G.blobs[i]; var br = clamp(o.r * k * 1.25, 4, 13);
    cx.beginPath(); cx.arc(o.x * k, o.y * k, br, 0, TAU); cx.fillStyle = COLORS[i]; cx.fill(); cx.lineWidth = 1.5; cx.strokeStyle = INK; cx.stroke();
    if (i === 0 && G.alarm > 0 && Math.floor(G.t * 6) % 2) { cx.beginPath(); cx.arc(o.x * k, o.y * k, br + 3, 0, TAU); cx.lineWidth = 2.5; cx.strokeStyle = '#ff2d2d'; cx.stroke(); }
    if (G.leader === i) { cx.fillStyle = '#ffd23c'; cx.beginPath(); cx.moveTo(o.x * k - 4, o.y * k - br - 1); cx.lineTo(o.x * k - 4, o.y * k - br - 6); cx.lineTo(o.x * k - 1.5, o.y * k - br - 3.5); cx.lineTo(o.x * k, o.y * k - br - 7); cx.lineTo(o.x * k + 1.5, o.y * k - br - 3.5); cx.lineTo(o.x * k + 4, o.y * k - br - 6); cx.lineTo(o.x * k + 4, o.y * k - br - 1); cx.closePath(); cx.fill(); cx.lineWidth = 1; cx.strokeStyle = INK; cx.stroke(); }
  }
  if (G.boss) { cx.beginPath(); cx.arc(G.boss.x * k, G.boss.y * k, 5.5, 0, TAU); cx.fillStyle = '#b65cff'; cx.fill(); cx.lineWidth = 1.5; cx.strokeStyle = INK; cx.stroke(); }
  if (G.treasure) { cx.beginPath(); cx.arc(G.treasure.x * k, G.treasure.y * k, 4.5 + Math.sin(G.t * 8), 0, TAU); cx.fillStyle = '#ffd23c'; cx.fill(); cx.lineWidth = 1.5; cx.strokeStyle = INK; cx.stroke(); }
  if (G.feast) { cx.beginPath(); cx.arc(G.feast.x * k, G.feast.y * k, 6, 0, TAU); cx.fillStyle = '#ff9f2e'; cx.fill(); cx.lineWidth = 1.5; cx.strokeStyle = INK; cx.stroke(); }
  for (i = 3; i >= 0; i--) { o = G.actors[i]; cx.beginPath(); cx.arc(o.x * k, o.y * k, i ? 2.6 : 3.6, 0, TAU); cx.fillStyle = i ? COLORS[i] : '#fff'; cx.fill(); cx.lineWidth = i ? 1 : 1.8; cx.strokeStyle = INK; cx.stroke(); }
  cx.lineWidth = 1.5; cx.strokeStyle = dark ? 'rgba(255,255,255,.75)' : 'rgba(59,42,32,.55)'; cx.strokeRect((VIEW.x - VIEW.w / 2) * k, (VIEW.y - VIEW.h / 2) * k, VIEW.w * k, VIEW.h * k);
  cx.restore();
}
function skinOf(i) { if (i) return { h: BHUE[i], s: 85, l: 60 }; return findIn(SKINS, G.skin); }
function render() {
  var P = G.actors[0], i, b, it, lowg = evOn('lowgrav'), th = THEMES[G.rb % THEMES.length];
  ZB = lerp(ZB, P.sprint || P.lunge > 0 ? 1 : 0, 0.06);
  var Z = SC * (1 - 0.05 * ZB), tx = P.x + P.vx * 0.2, ty = P.y + P.vy * 0.2 + (TOUCH ? 78 : 40) / Z, hw = VW / Z / 2, hh = VH / Z / 2;
  tx = hw * 2 >= W + 160 ? W / 2 : clamp(tx, hw - 80, W - hw + 80); ty = hh * 2 >= H + 160 ? H / 2 + 60 : clamp(ty, hh - 110, H - hh + (TOUCH ? 215 : 140) / Z);
  cam.x = lerp(cam.x, tx, 0.16); cam.y = lerp(cam.y, ty, 0.16);
  VIEW.x = cam.x; VIEW.y = cam.y; VIEW.w = hw * 2; VIEW.h = hh * 2;
  cx.setTransform(DPR, 0, 0, DPR, 0, 0); cx.fillStyle = th.out; cx.fillRect(0, 0, VW, VH);
  cx.save(); cx.translate(VW / 2, VH / 2); cx.scale(Z, Z);
  cx.translate(-cam.x + (G.shake ? (Math.random() * 2 - 1) * G.shake : 0), -cam.y + (G.shake ? (Math.random() * 2 - 1) * G.shake : 0));
  cx.lineJoin = 'round'; cx.lineCap = 'round';
  cx.beginPath(); cx.roundRect(EDGE - 26, EDGE - 26, W - 2 * EDGE + 52, H - 2 * EDGE + 52, 46); cx.fillStyle = th.floor; cx.fill(); cx.lineWidth = 14; cx.strokeStyle = th.edge; cx.stroke();
  drawGround(th);
  cx.strokeStyle = th.grid; cx.lineWidth = 3; cx.beginPath();
  var gx0 = Math.max(EDGE, Math.floor((cam.x - hw) / 110) * 110), gy0 = Math.max(EDGE, Math.floor((cam.y - hh) / 110) * 110);
  for (var gx = gx0; gx < Math.min(W - EDGE, cam.x + hw + 110); gx += 110) if (gx > EDGE) { cx.moveTo(gx, EDGE); cx.lineTo(gx, H - EDGE); }
  for (var gy = gy0; gy < Math.min(H - EDGE, cam.y + hh + 110); gy += 110) if (gy > EDGE) { cx.moveTo(EDGE, gy); cx.lineTo(W - EDGE, gy); }
  cx.stroke();
  for (i = 0; i < 4; i++) {
    b = G.blobs[i]; cx.beginPath(); cx.arc(b.x, b.y, b.r + 46, 0, TAU);
    cx.fillStyle = 'hsla(' + BHUE[i] + ',80%,55%,.16)'; cx.fill(); cx.setLineDash([16, 14]); cx.lineDashOffset = i ? 0 : -G.t * 26; cx.lineWidth = 4; cx.strokeStyle = 'hsla(' + BHUE[i] + ',70%,' + (G.rb % 5 >= 3 ? 62 : 40) + '%,.6)'; cx.stroke(); cx.setLineDash([]);
  }
  if (evOn('tornado')) { var td = G.event.data; for (i = 0; i < 4; i++) { cx.beginPath(); cx.arc(td.x, td.y, 40 + i * 55, G.t * (3 - i * 0.5) + i, G.t * (3 - i * 0.5) + i + 3.6); cx.lineWidth = 9 - i * 1.5; cx.strokeStyle = 'rgba(110,200,120,' + (0.5 - i * 0.1) + ')'; cx.stroke(); } }
  for (i = 0; i < G.meteors.length; i++) { var m = G.meteors[i], f = 1 - m.t / m.max; cx.beginPath(); cx.arc(m.x, m.y, 200, 0, TAU); cx.fillStyle = 'rgba(255,140,40,.1)'; cx.fill(); cx.lineWidth = 3; cx.strokeStyle = 'rgba(255,120,30,.5)'; cx.stroke(); cx.beginPath(); cx.arc(m.x, m.y, 120, 0, TAU); cx.fillStyle = 'rgba(255,60,30,.18)'; cx.fill(); cx.lineWidth = 4; cx.strokeStyle = 'rgba(255,60,30,.85)'; cx.stroke(); cx.beginPath(); cx.arc(m.x, m.y, 120 * f, 0, TAU); cx.fillStyle = 'rgba(255,60,30,.35)'; cx.fill(); }
  drawCloudShadows();
  for (i = 0; i < G.items.length; i++) { it = G.items[i]; if (it.state === 1 && onScreen(it.x, it.y)) drawItem(it, lowg); }
  drawSolids(th);
  for (i = 0; i < 4; i++) {
    b = G.blobs[i]; if (hyp(b.x - cam.x, b.y - cam.y) > b.r * 1.4 + hyp(hw, hh)) continue;
    var o = G.actors[i], lvl = b.level;
    if (b.flash > 0) { cx.beginPath(); cx.arc(b.x, b.y, b.r * (1.2 + (1 - b.flash) * 1.4), 0, TAU); cx.strokeStyle = 'rgba(255,255,255,' + b.flash * 0.8 + ')'; cx.lineWidth = 10; cx.stroke(); }
    if (b.rage > 0) {       // warning before the blast: the red zone fills up, whoever is still inside loses a heart
      var rz = b.r + BLAST, rf = 1 - b.rage / RAGE;
      cx.beginPath(); cx.arc(b.x, b.y, rz, 0, TAU); cx.fillStyle = 'rgba(255,60,30,' + (0.1 + 0.08 * Math.abs(Math.sin(G.t * 18))) + ')'; cx.fill(); cx.lineWidth = 4; cx.strokeStyle = 'rgba(255,60,30,.9)'; cx.stroke();
      cx.beginPath(); cx.arc(b.x, b.y, b.r + BLAST * rf, 0, TAU); cx.fillStyle = 'rgba(255,60,30,.28)'; cx.fill();
    }
    if (b.shield > 0) drawSpikes(b);
    drawBlobBody(b.x, b.y, b.r, skinOf(i), b.wob, i * 1.7, b.mouth, b.blink, o.x - b.x, o.y - b.y, lvl, b.rage > 0 ? 1 : b.sad > 0 ? 2 : 0);
    if (G.leader === i) crownAt(b.x, b.y - b.r * 0.86, b.r * 0.34);
    if (i) txt(T('{0}  Lv {1}', NAMES[i], lvl), b.x, b.y + b.r * 0.9 + 20, 15, '#fff');
    if (i && b.shield > 0) txt(Math.ceil(b.shield) + 's', b.x, b.y - b.r * 1.22 - (G.leader === i ? b.r * 0.3 : 0) - 14, 17, '#fff', 0.9);
    if (b.rage > 0 && i) txt(T('RUN!'), b.x, b.y + b.r * 0.9 + 58, 34, '#ff6b5b', 0.6 + 0.4 * Math.abs(Math.sin(G.t * 14)));
    else if (i && G.started && G.stats.raids < 3 && G.t > 40 && b.shield <= 0 && b.hits === 0 && hyp(P.x - b.x, P.y - b.y) < b.r + 280) txt(T(TOUCH ? 'TAP RUN INTO IT: STEAL GOO' : 'LUNGE INTO IT: STEAL GOO'), b.x, b.y - b.r - (G.leader === i ? b.r * 0.42 : 0) - 26, 16, '#fff36b');
    if (b.hits > 0 && b.shield <= 0) for (var hi = 0; hi < 3; hi++) { cx.beginPath(); cx.arc(b.x + (hi - 1) * 22, b.y - b.r - (G.leader === i ? b.r * 0.42 : 0) - 16, 7, 0, TAU); cx.fillStyle = hi < b.hits ? '#ff4d6d' : 'rgba(255,255,255,.7)'; cx.fill(); cx.lineWidth = 2.5; cx.strokeStyle = INK; cx.stroke(); }
  }
  if (G.boss) {
    b = G.boss;
    drawBlobBody(b.x, b.y, b.r * (b.stun > 0 ? 0.93 : 1), { h: 282, s: 85, l: 60 }, Math.sin(b.wob * 5) * 0.8 + (b.stun > 0 ? 2 : 0), 9, 0.3 + Math.abs(Math.sin(b.wob * 4)) * 0.5, 1, P.x - b.x, P.y - b.y, 1, 1);
    for (i = 0; i < b.max; i++) { cx.beginPath(); cx.arc(b.x + (i - (b.max - 1) / 2) * 20, b.y - b.r - 22, 7.5, 0, TAU); cx.fillStyle = i < b.hp ? '#ff4d6d' : 'rgba(59,42,32,.35)'; cx.fill(); cx.lineWidth = 2.5; cx.strokeStyle = INK; cx.stroke(); }
  }
  drawSpecials(P);
  for (i = 0; i < 4; i++) { var cr = G.actors[i].carry; for (var j = cr.length - 1; j >= 0; j--) if (onScreen(cr[j].x, cr[j].y)) drawItem(cr[j], false); }
  var order = G.actors.slice().sort(function (p, q) { return p.y - q.y; });
  for (i = 0; i < 4; i++) if (onScreen(order[i].x, order[i].y)) drawActor(order[i]);
  for (i = 0; i < G.items.length; i++) { it = G.items[i]; if ((it.state === 0 || it.state === 3) && onScreen(it.x, it.y - it.z * 0.5)) drawItem(it, false); }
  drawClouds(P); drawOnboard();
  if (G.quest === 0 && G.started) {
    if (P.used < Math.min(4, capOf(P))) { var near = null, nd = 1e9; for (i = 0; i < G.items.length; i++) { it = G.items[i]; if (it.state === 1 && it.kind !== 'heart') { var dn = hyp(it.x - P.x, it.y - P.y); if (dn < nd) { nd = dn; near = it; } } } if (near) chevron(near.x, near.y - 8, '#fff36b'); }
    else chevron(G.blobs[0].x, G.blobs[0].y - G.blobs[0].r, '#8cf58a');
  }
  if (MOUSE.down && !TOUCH) { cx.beginPath(); cx.arc(MOUSE.wx, MOUSE.wy, 9 + Math.sin(G.t * 8) * 2, 0, TAU); cx.lineWidth = 3; cx.strokeStyle = 'rgba(255,255,255,.8)'; cx.stroke(); }
  for (i = 0; i < G.parts.length; i++) { var p = G.parts[i]; cx.globalAlpha = clamp(p.life / p.max * 1.5, 0, 1); cx.fillStyle = p.col; cx.beginPath(); cx.arc(p.x, p.y, p.size * (0.4 + 0.6 * p.life / p.max), 0, TAU); cx.fill(); }
  cx.globalAlpha = 1;
  if (G.pcombo >= 3 && G.t - G.pcomboT < 1.2) { var cs = 1 + Math.max(0, 0.25 - (G.t - G.pcomboT)) * 2; txt('x' + G.pcombo, P.x + 30, P.y - 30, (16 + Math.min(12, G.pcombo / 3)) * cs, '#ff8fe0', 1, 'left'); }      // pickup combo
  for (i = 0; i < G.texts.length; i++) { var t = G.texts[i], k = t.life / t.max; txt(T(t.str), t.x, t.y, t.size * (k > 0.85 ? 1 + (1 - k) * 2 : 1.3 - (1 - k) * 0.3), t.col, clamp(k * 2.2, 0, 1), t.align); }
  cx.restore();
  if (G.event && G.event.on) { cx.globalAlpha = 0.07; cx.fillStyle = EV[G.event.type].col; cx.fillRect(0, 0, VW, VH); cx.globalAlpha = 1; }
  if (evOn('rainbow')) { var rg = cx.createLinearGradient(0, 0, VW, VH), rh = (G.t * 60) % 360; for (var ri = 0; ri < 4; ri++) rg.addColorStop(ri / 3, 'hsla(' + ((rh + ri * 90) % 360) + ',90%,65%,.12)'); cx.fillStyle = rg; cx.fillRect(0, 0, VW, VH); }
  if (G.alarm > 0 || (G.hp === 1 && G.started)) { var al = G.alarm > 0 ? 0.1 + 0.1 * Math.abs(Math.sin(G.t * 8)) : 0.06 + 0.04 * Math.sin(G.t * 4); cx.globalAlpha = al; cx.fillStyle = '#ff2d2d'; cx.fillRect(0, 0, VW, VH); cx.globalAlpha = 1; }
  if (G.flash > 0) { cx.globalAlpha = clamp(G.flash, 0, 0.6); cx.fillStyle = '#fff'; cx.fillRect(0, 0, VW, VH); cx.globalAlpha = 1; }
  if (G.started) {
    var hb = G.blobs[0];
    if (G.alarm > 0) { edgeArrow(hb.x, hb.y, '#ff4d4d', 'HELP', true); txt(T('YOUR BLOB IS UNDER ATTACK!'), VW / 2, TOUCH ? 172 : 150, Math.min(22, VW / 22), '#ff6b5b', 0.6 + 0.4 * Math.abs(Math.sin(G.t * 8))); }
    else edgeArrow(hb.x, hb.y, '#59d16a', 'HOME', P.used >= capOf(P));
    if (G.boss) edgeArrow(G.boss.x, G.boss.y, '#b65cff', 'BOSS', false);
    if (G.treasure) edgeArrow(G.treasure.x, G.treasure.y, '#ffd23c', 'CATCH', true);
    if (G.feast) edgeArrow(G.feast.x, G.feast.y, '#ff9f2e', 'SNACK', true);
    var nc = null, ncd = 1e9; for (i = 0; i < G.clouds.length; i++) { var cd2 = hyp(G.clouds[i].x - P.x, G.clouds[i].y - P.y); if (cd2 < ncd) { ncd = cd2; nc = G.clouds[i]; } }
    if (nc && !G.alarm) edgeArrow(nc.x, nc.y, '#6cc0ff', 'LOOT', false);
    drawMini(th);
  }
  drawFx(FXDT);
  if (JOY) {
    cx.beginPath(); cx.arc(JOY.ox, JOY.oy, 56, 0, TAU); cx.fillStyle = 'rgba(255,255,255,.18)'; cx.fill(); cx.lineWidth = 3; cx.strokeStyle = 'rgba(59,42,32,.35)'; cx.stroke();
    cx.beginPath(); cx.arc(JOY.ox + JOY.dx, JOY.oy + JOY.dy, 24, 0, TAU); cx.fillStyle = 'rgba(255,255,255,.75)'; cx.fill(); cx.stroke();
  }
}

/* ---------- screen-space effects: raid impacts, level-up moment. Pure decoration, Math.random only, never touches G ---------- */
var FX = [], FXMAX = 40, FRAMEMS = 16, LOWFX = false;   // LOWFX: the device is struggling (average frame over 25 ms), so effects get cheaper
function w2s(wx, wy) { var z = SC * (1 - 0.05 * ZB); return { x: (wx - cam.x) * z + VW / 2, y: (wy - cam.y) * z + VH / 2, z: z }; }
function fxAdd(o) { if (FX.length >= (LOWFX ? 6 : FXMAX)) FX.shift(); o.t = 0; FX.push(o); }
function starPath(x, y, r0, r1, n, rot) { cx.beginPath(); for (var i = 0; i < n * 2; i++) { var r = i % 2 ? r0 : r1, a = rot + i * Math.PI / n; cx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } cx.closePath(); }
function drawFx(dt) {
  for (var i = FX.length - 1; i >= 0; i--) {
    var f = FX[i]; f.t += dt; if (f.t >= f.dur) { FX.splice(i, 1); continue; }
    var k = f.t / f.dur, e = 1 - Math.pow(1 - k, 3);
    if (f.type === 'hit') {        // a raid hit: white (gold for the jackpot) star burst plus a shock ring on the hit blob
      var s = w2s(f.x, f.y), big = f.n >= 3, R = (f.r * s.z) * (big ? 1.5 : 1.1);
      cx.globalAlpha = 1 - k; cx.lineWidth = (big ? 14 : 9) * (1 - k) + 2; cx.strokeStyle = big ? '#ffd23c' : '#fff';
      cx.beginPath(); cx.arc(s.x, s.y, R * (0.6 + e * (big ? 1.6 : 1)), 0, TAU); cx.stroke();
      if (k < 0.45) {
        var q = k / 0.45, sz = (f.hr * s.z) * (0.5 + q * (big ? 1.3 : 0.8)) * (1 + 0.1 * f.n);
        cx.globalAlpha = 1 - q * q; starPath(f.hx * s.z + s.x, f.hy * s.z + s.y, sz * 0.45, sz, big ? 12 : 8, f.rot);
        cx.fillStyle = big ? '#fff36b' : '#fff'; cx.fill(); cx.lineWidth = 4; cx.strokeStyle = INK; cx.stroke();
      }
      cx.globalAlpha = 1;
      if (big && k < 0.25 && !LOWFX) { cx.globalAlpha = 0.35 * (1 - k / 0.25); cx.fillStyle = '#ffd23c'; cx.fillRect(0, 0, VW, VH); cx.globalAlpha = 1; }
    } else if (f.type === 'lvl') {   // the level-up moment: rays, ring from the home blob, the new level name big in the middle
      var hb = G.blobs[0], hs = w2s(hb.x, hb.y), cy = VH * 0.36, fade = k < 0.82 ? 1 : 1 - (k - 0.82) / 0.18;
      cx.globalAlpha = 0.9 * (1 - e); cx.lineWidth = 16 * (1 - e) + 3; cx.strokeStyle = '#fff36b';
      cx.beginPath(); cx.arc(hs.x, hs.y, hb.r * hs.z * (1 + e * 3), 0, TAU); cx.stroke();
      cx.save(); cx.translate(VW / 2, cy); cx.rotate(f.t * 0.6); cx.globalAlpha = 0.28 * fade;
      var rl = Math.max(VW, VH) * 0.7 * Math.min(1, k * 4);
      if (!LOWFX) for (var r = 0; r < 12; r++) { cx.beginPath(); cx.moveTo(0, 0); cx.arc(0, 0, rl, r * TAU / 12, r * TAU / 12 + TAU / 26); cx.closePath(); cx.fillStyle = r % 2 ? '#fff36b' : '#fff'; cx.fill(); }
      cx.restore();
      var pop = k < 0.12 ? 0.4 + k / 0.12 * 0.8 : k < 0.2 ? 1.2 - (k - 0.12) / 0.08 * 0.2 : 1, ts = Math.min(VW / 7, VH / 6.5, 78);
      cx.save(); cx.translate(VW / 2, cy); cx.scale(pop, pop);
      txt(T('LEVEL {0}', f.level), 0, -ts * 0.35, ts, '#ffd23c', fade);
      txt(f.name, 0, ts * 0.55, ts * 0.5, '#fff', fade);
      cx.restore();
    }
  }
  cx.globalAlpha = 1;
}

/* ---------- the start screen hero: an idle blob that wobbles, blinks and snatches a snack every few seconds ---------- */
var HERO = { snacks: ['apple', 'donut', 'pizza', 'fish', 'gold', 'gem'], last: -1 };
function drawHero(cnv, now) {
  var w = cnv.clientWidth, h = cnv.clientHeight; if (!w || !h) return;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (cnv.width !== Math.round(w * dpr)) { cnv.width = Math.round(w * dpr); cnv.height = Math.round(h * dpr); }
  var old = cx, oldT = G.t, T = now / 1000, cyc = 3.4, n = Math.floor(T / cyc), p = (T % cyc) / cyc, side = n % 2 ? 1 : -1;
  cx = cnv.getContext('2d'); cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, w, h); cx.lineJoin = 'round'; cx.lineCap = 'round';
  G.t = T;
  var r = Math.min(h * 0.36, w * 0.2), bx = w / 2, by = h - r * 1.02, gulpK = p > 0.74 ? Math.max(0, 1 - (p - 0.74) / 0.12) : 0;
  var hop = Math.abs(Math.sin(T * 2.2)) * r * 0.06 * (1 - gulpK), wob = 0.8 + gulpK * 5 + Math.sin(T * 3) * 0.4;
  var sx = 0, sy = 0, kind = HERO.snacks[n % HERO.snacks.length], fly = p > 0.5 && p < 0.74;
  if (fly) { var q = (p - 0.5) / 0.24; sx = bx + side * (w * 0.46) * (1 - q); sy = by + r * 0.26 - Math.sin(q * Math.PI) * h * 0.55 + (1 - q) * -h * 0.1; }
  var mouth = p > 0.56 && p < 0.76 ? Math.min(1, (p - 0.56) / 0.08) : gulpK * 0.3, blink = (T % 3.9) < 0.12 && !fly ? -1 : 1;
  drawBlobBody(bx, by - hop, r * (1 + gulpK * 0.06), findIn(SKINS, G.skin), wob, 1.3, mouth, blink, fly ? sx - bx : Math.sin(T * 0.7) * 0.6, fly ? sy - by : 0.4, 3, 0);
  if (G.hat && G.hat !== 'none') { cx.save(); cx.translate(bx, by - hop - r * 0.45); drawHat(G.hat, r * 0.6); cx.restore(); }
  if (fly) { var sp = SPR[kind], sw = r * 0.62; cx.save(); cx.translate(sx, sy); cx.rotate(T * 6 * side); cx.drawImage(sp, -sw / 2, -sw / 2, sw, sw); cx.restore(); }
  if (p > 0.74 && p < 0.98) {       // little sparkles and hearts after the gulp
    var a = (p - 0.74) / 0.24; cx.globalAlpha = 1 - a;
    for (var i = 0; i < 5; i++) { var ang = -Math.PI / 2 + (i - 2) * 0.5, d = r * (0.9 + a * 0.9); cx.beginPath(); cx.arc(bx + Math.cos(ang) * d, by - r * 0.3 + Math.sin(ang) * d, r * 0.05 * (1 - a) + 1.5, 0, TAU); cx.fillStyle = i % 2 ? '#fff36b' : '#ff8fc7'; cx.fill(); }
    cx.globalAlpha = 1;
  }
  G.t = oldT; cx = old;
}

/* ---------- first-minute onboarding: one speech bubble in the world at a time (state lives in OB, see 50_ui.js) ---------- */
function bubble(x, y, str, k) {
  var s = Math.min(1, k * 5), pop = s < 1 ? 0.6 + s * 0.5 : 1 + 0.03 * Math.sin(G.t * 5);
  cx.font = '900 17px ' + FONT; var w = cx.measureText(str).width + 26, h = 34, mx = VIEW.w / 2 - w / 2 - 10;
  x = clamp(x, VIEW.x - mx, VIEW.x + mx); y = clamp(y, VIEW.y - VIEW.h / 2 + 150, VIEW.y + VIEW.h / 2 - 40);      // always inside the view
  cx.save(); cx.translate(x, y - Math.abs(Math.sin(G.t * 3.2)) * 6); cx.scale(pop, pop); cx.font = '900 17px ' + FONT;
  cx.beginPath(); cx.roundRect(-w / 2, -h - 12, w, h, 14); cx.moveTo(-9, -13); cx.lineTo(0, -1); cx.lineTo(9, -13);
  cx.fillStyle = '#fff8ea'; cx.fill(); cx.lineWidth = 3.5; cx.strokeStyle = INK; cx.stroke();
  cx.beginPath(); cx.rect(-w / 2 + 2, -16, w - 4, 4); cx.fillStyle = '#fff8ea'; cx.fill();
  cx.fillStyle = INK; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(str, 0, -h / 2 - 12);
  cx.restore();
}
function drawOnboard() {
  if (!OB.on || !G.started) return;
  var P = G.actors[0], k = OB.k, i;
  if (OB.step === 0) {           // move: arrows pulse out of the collector in four directions
    bubble(P.x, P.y - P.r - 26, T(TOUCH ? 'DRAG TO MOVE' : 'WASD OR ARROWS TO MOVE'), k);
    var d = P.r + 18 + (G.t * 30) % 14;
    for (i = 0; i < 4; i++) { var a = i * Math.PI / 2; cx.save(); cx.translate(P.x + Math.cos(a) * d, P.y + Math.sin(a) * d); cx.rotate(a); cx.beginPath(); cx.moveTo(8, 0); cx.lineTo(-4, -8); cx.lineTo(-4, 8); cx.closePath(); cx.globalAlpha = 0.85; cx.fillStyle = '#fff'; cx.fill(); cx.lineWidth = 2.5; cx.strokeStyle = INK; cx.stroke(); cx.restore(); }
    cx.globalAlpha = 1;
  } else if (OB.step === 1 && OB.item) bubble(OB.item.x, OB.item.y - 40, T('GRAB LOOT!'), k);
  else if (OB.step === 2) {       // home: a moving dashed path from the collector to the blob
    var h = G.blobs[0], dx = h.x - P.x, dy = h.y - P.y, l = hyp(dx, dy) + 0.01;
    if (l > h.r + 40) { cx.beginPath(); cx.moveTo(P.x + dx / l * (P.r + 10), P.y + dy / l * (P.r + 10)); cx.lineTo(h.x - dx / l * (h.r + 14), h.y - dy / l * (h.r + 14)); cx.setLineDash([14, 14]); cx.lineDashOffset = -G.t * 60; cx.lineWidth = 6; cx.strokeStyle = 'rgba(255,255,255,.85)'; cx.stroke(); cx.setLineDash([]); }
    if (Math.abs(h.x - VIEW.x) < VIEW.w / 2 - 60 && Math.abs(h.y - h.r - VIEW.y) < VIEW.h / 2 - 160) bubble(h.x, h.y - h.r - 30, T('BRING IT HOME!'), k); else bubble(P.x, P.y - P.r - 26, T('BRING IT HOME!'), k);
  } else if (OB.step === 3) { if (OB.rival) chevron(OB.rival.x, OB.rival.y - OB.rival.r - 6, '#ff8a7a'); bubble(P.x, P.y - P.r - 26, T(TOUCH ? 'TAP RUN TO LUNGE!' : 'SPACE TO LUNGE!'), k); }
}

/* ---------- event specials: treasure blob, giant snack, party hearts, lucky aura ---------- */
var GOLDSKIN = { h: 46, s: 96, l: 58, pat: 'shine', pcol: 'rgba(255,255,255,.75)' };
function drawSpecials(P) {
  var i, tr = G.treasure, fe = G.feast;
  if (tr && near(tr.x, tr.y, 120)) {
    for (i = 0; i < 6; i++) { var sa = G.t * 2 + i * 1.05, sr = tr.r * (1.35 + 0.15 * Math.sin(G.t * 4 + i)); cx.globalAlpha = 0.5 + 0.5 * Math.sin(G.t * 6 + i); cx.fillStyle = i % 2 ? '#fff36b' : '#3fe0ff'; cx.beginPath(); cx.arc(tr.x + Math.cos(sa) * sr, tr.y + Math.sin(sa) * sr * 0.8, 3.5, 0, TAU); cx.fill(); }
    cx.globalAlpha = 1;
    drawBlobBody(tr.x, tr.y, tr.r, GOLDSKIN, 0.6 + (tr.hurt > 0 ? 3 : 0), 4.2, tr.hurt > 0 ? 0.6 : 0.25, 1, tr.x - P.x, tr.y - P.y, 3, tr.hurt > 0 ? 2 : 0);
    for (i = 0; i < 3; i++) { cx.beginPath(); cx.arc(tr.x + (i - 1) * 16, tr.y - tr.r - 16, 6, 0, TAU); cx.fillStyle = i < tr.hp ? '#ffd23c' : 'rgba(59,42,32,.3)'; cx.fill(); cx.lineWidth = 2.5; cx.strokeStyle = INK; cx.stroke(); }
  }
  if (fe && near(fe.x, fe.y, 200)) {
    var drop = Math.max(0, 1 - fe.t / 0.6), z = drop * drop * 700, sc = (0.55 + 0.45 * fe.hp / fe.max) * (1 + Math.max(0, fe.wob) * 0.08), w = fe.r * 2.3 * sc;
    cx.beginPath(); cx.ellipse(fe.x, fe.y + fe.r * 0.55, fe.r * sc, fe.r * 0.3 * sc, 0, 0, TAU); cx.fillStyle = 'rgba(40,25,15,.25)'; cx.fill();
    cx.save(); cx.translate(fe.x, fe.y - z); cx.rotate(Math.sin(G.t * 2) * 0.05 + Math.max(0, fe.wob) * Math.sin(G.t * 40) * 0.08); cx.drawImage(SPR.donut, -w / 2, -w / 2, w, w); cx.restore();
    if (fe.t > 0.6) { cx.beginPath(); cx.roundRect(fe.x - 40, fe.y - fe.r * sc - 26, 80, 10, 5); cx.fillStyle = 'rgba(59,42,32,.4)'; cx.fill(); cx.beginPath(); cx.roundRect(fe.x - 40, fe.y - fe.r * sc - 26, 80 * fe.hp / fe.max, 10, 5); cx.fillStyle = '#ff9f2e'; cx.fill(); }
  }
  if (evOn('party')) for (i = 1; i < 4; i++) {          // floating hearts and confetti over the friendly rivals
    var b = G.blobs[i]; if (!near(b.x, b.y, b.r + 80)) continue;
    for (var k = 0; k < 7; k++) { var ph = (G.t * 0.6 + k / 7) % 1, hx = b.x + Math.sin(k * 2.3 + G.t) * b.r * 0.8, hy = b.y - b.r * 0.5 - ph * b.r * 1.4; cx.globalAlpha = Math.sin(ph * Math.PI);
      if (k % 2) { cx.fillStyle = '#ff4d6d'; cx.beginPath(); cx.moveTo(hx, hy + 6); cx.bezierCurveTo(hx - 10, hy - 2, hx - 6, hy - 10, hx, hy - 4); cx.bezierCurveTo(hx + 6, hy - 10, hx + 10, hy - 2, hx, hy + 6); cx.fill(); }
      else { cx.fillStyle = ['#fff36b', '#7ad7ff', '#8cf58a', '#ff8fe0'][k % 4]; cx.save(); cx.translate(hx, hy); cx.rotate(G.t * 5 + k); cx.fillRect(-4, -2, 8, 4); cx.restore(); } }
    cx.globalAlpha = 1;
  }
  if (G.lucky > 0) {      // lucky star: golden aura around the collector with the pickups left
    cx.beginPath(); cx.arc(P.x, P.y, P.r + 14 + Math.sin(G.t * 6) * 3, 0, TAU); cx.lineWidth = 5; cx.strokeStyle = 'rgba(255,215,60,.85)'; cx.stroke();
    for (i = 0; i < 5; i++) { var la = G.t * 3 + i * 1.257; cx.fillStyle = '#fff36b'; cx.beginPath(); cx.arc(P.x + Math.cos(la) * (P.r + 14), P.y + Math.sin(la) * (P.r + 14), 3, 0, TAU); cx.fill(); }
  }
}
