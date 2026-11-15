'use strict';
/* ---------- helpers ---------- */
var TAU = Math.PI * 2;
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function hyp(x, y) { return Math.sqrt(x * x + y * y); }
var _seed = (Date.now() ^ 0x9e3779b9) >>> 0;
function rnd() { _seed = (_seed + 0x6D2B79F5) | 0; var t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
function rand(a, b) { return a + rnd() * (b - a); }
function pick(a) { return a[Math.floor(rnd() * a.length)]; }
function fmt(n) {
  n = Math.floor(n);
  if (n < 1000) return '' + n;
  var u = ['K', 'M', 'B', 'T', 'Q'], i = -1;
  while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
  return (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : n.toFixed(0)) + u[i];
}

/* ---------- sound: everything is synthesised, no audio files ---------- */
var Snd = {
  ctx: null, master: null, muted: false, last: {},
  init: function () {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC(); this.master = this.ctx.createGain();
      this.master.gain.value = 0.55; this.master.connect(this.ctx.destination);
    } catch (e) { this.ctx = null; }
  },
  ok: function (key, gap) {
    if (!this.ctx || this.muted || this.ctx.state !== 'running') return false;
    var t = this.ctx.currentTime; if (key && this.last[key] && t - this.last[key] < gap) return false;
    if (key) this.last[key] = t; return true;
  },
  tone: function (f, dur, type, vol, f2, delay) {
    var c = this.ctx, t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.03);
  },
  noise: function (dur, vol, cut) {
    var c = this.ctx, n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = cut || 1200; g.gain.value = vol;
    s.buffer = b; s.connect(f); f.connect(g); g.connect(this.master); s.start();
  },
  pop: function (n) { if (this.ok('pop', 0.035)) { var f = 440 + Math.min(n, 16) * 38; this.tone(f, 0.07, 'triangle', 0.13, f * 1.5); } },
  gulp: function (n) { if (this.ok('gulp', 0.04)) { var f = 250 + Math.min(n, 20) * 26; this.tone(f * 1.6, 0.1, 'sine', 0.2, f * 0.8); } },
  coin: function () { if (this.ok('coin', 0.08)) { this.tone(988, 0.08, 'square', 0.06); this.tone(1319, 0.16, 'square', 0.06, 0, 0.07); } },
  buy: function () { if (this.ok('buy', 0.05)) { this.tone(523, 0.08, 'triangle', 0.18); this.tone(784, 0.14, 'triangle', 0.18, 0, 0.07); } },
  nope: function () { if (this.ok('nope', 0.15)) this.tone(170, 0.12, 'square', 0.07, 120); },
  bump: function () { if (this.ok('bump', 0.08)) { this.noise(0.16, 0.35, 900); this.tone(170, 0.16, 'square', 0.12, 60); } },
  hit: function () { if (this.ok('hit', 0.08)) { this.noise(0.22, 0.45, 700); this.tone(120, 0.25, 'sawtooth', 0.16, 45); } },
  boom: function () { if (this.ok('boom', 0.1)) { this.noise(0.6, 0.6, 500); this.tone(90, 0.5, 'sine', 0.35, 35); } },
  siren: function () { if (this.ok('siren', 0.5)) { for (var i = 0; i < 3; i++) this.tone(620, 0.22, 'sawtooth', 0.07, 930, i * 0.24); } },
  level: function () { if (this.ok('level', 0.3)) { var a = [523, 659, 784, 1047, 1319]; for (var i = 0; i < a.length; i++) this.tone(a[i], 0.2, 'triangle', 0.17, 0, i * 0.085); } },
  quest: function () { if (this.ok('quest', 0.3)) { this.tone(784, 0.1, 'triangle', 0.15); this.tone(1047, 0.1, 'triangle', 0.15, 0, 0.09); this.tone(1568, 0.25, 'triangle', 0.15, 0, 0.18); } },
  tired: function () { if (this.ok('tired', 0.6)) this.tone(300, 0.25, 'sine', 0.1, 140); },
  whoosh: function () { if (this.ok('whoosh', 0.1)) { this.noise(0.14, 0.2, 2600); this.tone(520, 0.14, 'sine', 0.07, 180); } },
  smack: function () { if (this.ok('smack', 0.08)) { this.noise(0.18, 0.4, 1100); this.tone(240, 0.2, 'square', 0.13, 80); this.tone(660, 0.12, 'triangle', 0.1, 990, 0.05); } },
  steal: function (n) { if (this.ok('steal', 0.08)) { this.noise(0.18, 0.4, 1100); this.tone(240, 0.2, 'square', 0.13, 80); var f = [660, 880, 1175][n - 1] || 660; this.tone(f, 0.13, 'triangle', 0.13, f * 1.5, 0.05); if (n >= 3) { var a = [784, 988, 1175, 1568]; for (var i = 0; i < a.length; i++) this.tone(a[i], 0.14, 'square', 0.06, 0, 0.14 + i * 0.07); } } },
  crown: function () { if (this.ok('crown', 0.5)) { var a = [659, 784, 1047, 1319]; for (var i = 0; i < a.length; i++) this.tone(a[i], 0.16, 'triangle', 0.14, 0, i * 0.09); } },
  spike: function () { if (this.ok('spike', 0.15)) { this.tone(900, 0.16, 'square', 0.1, 380); this.noise(0.12, 0.25, 3000); } },
  hurt: function () { if (this.ok('hurt', 0.2)) { this.tone(320, 0.3, 'sawtooth', 0.16, 90); this.noise(0.2, 0.3, 800); } },
  ko: function () { if (this.ok('ko', 0.5)) { var a = [523, 440, 349, 262, 196]; for (var i = 0; i < a.length; i++) this.tone(a[i], 0.24, 'triangle', 0.16, 0, i * 0.13); } },
  alarm: function () { if (this.ok('alarm', 1.2)) { for (var i = 0; i < 4; i++) this.tone(i % 2 ? 660 : 880, 0.14, 'square', 0.09, 0, i * 0.15); } },
  gem: function () { if (this.ok('gem', 0.06)) { this.tone(1568, 0.09, 'sine', 0.13); this.tone(2093, 0.2, 'sine', 0.13, 0, 0.07); } },
  warp: function () { if (this.ok('warp', 0.3)) { this.tone(260, 0.3, 'sine', 0.16, 1300); this.tone(520, 0.25, 'triangle', 0.08, 1700, 0.06); } },
  boing: function () { if (this.ok('boing', 0.12)) this.tone(170, 0.2, 'sine', 0.2, 560); },
  zoom: function () { if (this.ok('zoom', 0.3)) { this.tone(420, 0.16, 'triangle', 0.13, 940); this.noise(0.12, 0.12, 3200); } },
  heal: function () { if (this.ok('heal', 0.2)) { this.tone(660, 0.12, 'sine', 0.13); this.tone(880, 0.2, 'sine', 0.13, 0, 0.1); } },
  setMute: function (m) { if (this.master) this.master.gain.value = m ? 0 : 0.55; }
};

/* ---------- sprites: every picture is drawn by code once and cached ---------- */
var SPR = {};
function mkSprite(size, draw) {
  var c = document.createElement('canvas'); c.width = c.height = size * 2;
  var g = c.getContext('2d'); g.scale(2, 2); g.translate(size / 2, size / 2);
  g.lineJoin = 'round'; g.lineCap = 'round'; draw(g); return c;
}
var INK = '#3b2a20';
function outl(g, w) { g.lineWidth = w || 2.5; g.strokeStyle = INK; g.stroke(); }
function buildSprites() {
  SPR.apple = mkSprite(40, function (g) {
    g.beginPath(); g.arc(0, 2, 12, 0, TAU); g.fillStyle = '#ff5b5b'; g.fill(); outl(g);
    g.beginPath(); g.arc(-4, -2, 4, 0, TAU); g.fillStyle = 'rgba(255,255,255,.45)'; g.fill();
    g.beginPath(); g.moveTo(0, -9); g.lineTo(2, -15); g.strokeStyle = '#6b4226'; g.lineWidth = 2.5; g.stroke();
    g.beginPath(); g.ellipse(7, -13, 5, 2.6, -0.5, 0, TAU); g.fillStyle = '#5fcf5a'; g.fill(); outl(g, 1.5);
  });
  SPR.donut = mkSprite(40, function (g) {
    g.beginPath(); g.arc(0, 0, 13, 0, TAU); g.fillStyle = '#e9b872'; g.fill(); outl(g);
    g.beginPath(); g.arc(0, 0, 10.5, 0, TAU); g.fillStyle = '#ff8fc7'; g.fill();
    g.beginPath(); g.arc(0, 0, 4, 0, TAU); g.fillStyle = '#f3e6cf'; g.fill(); outl(g, 2);
    var cols = ['#fff', '#7ad7ff', '#ffe066', '#fff'];
    for (var i = 0; i < 7; i++) { var a = i * 0.9 + 0.3; g.beginPath(); g.moveTo(Math.cos(a) * 7.5, Math.sin(a) * 7.5); g.lineTo(Math.cos(a + 0.25) * 8.5, Math.sin(a + 0.25) * 8.5); g.strokeStyle = cols[i % 4]; g.lineWidth = 2; g.stroke(); }
  });
  SPR.pizza = mkSprite(40, function (g) {
    g.beginPath(); g.moveTo(0, 14); g.lineTo(-13, -9); g.quadraticCurveTo(0, -16, 13, -9); g.closePath(); g.fillStyle = '#ffd35a'; g.fill(); outl(g);
    g.beginPath(); g.moveTo(-13, -9); g.quadraticCurveTo(0, -16, 13, -9); g.strokeStyle = '#c98a3c'; g.lineWidth = 4; g.stroke();
    g.fillStyle = '#e5483f'; [[-4, -4], [4, -1], [0, 5]].forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], 2.6, 0, TAU); g.fill(); });
  });
  SPR.fish = mkSprite(40, function (g) {
    g.beginPath(); g.moveTo(8, 0); g.lineTo(16, -7); g.lineTo(16, 7); g.closePath(); g.fillStyle = '#4aa8ff'; g.fill(); outl(g);
    g.beginPath(); g.ellipse(-2, 0, 12, 8, 0, 0, TAU); g.fillStyle = '#6cc0ff'; g.fill(); outl(g);
    g.beginPath(); g.arc(-7, -2, 2.4, 0, TAU); g.fillStyle = '#fff'; g.fill(); g.beginPath(); g.arc(-7.5, -2, 1.1, 0, TAU); g.fillStyle = INK; g.fill();
  });
  SPR.can = mkSprite(40, function (g) {
    g.beginPath(); g.roundRect(-8, -12, 16, 24, 3); g.fillStyle = '#b9c2cc'; g.fill(); outl(g);
    g.fillStyle = '#e25d4a'; g.fillRect(-7, -4, 14, 8); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(-5, -10, 3, 20);
  });
  SPR.boot = mkSprite(44, function (g) {
    g.beginPath(); g.moveTo(-9, -15); g.lineTo(1, -15); g.lineTo(2, 2); g.quadraticCurveTo(16, 3, 15, 12); g.lineTo(-9, 12); g.closePath(); g.fillStyle = '#8b5a3c'; g.fill(); outl(g);
    g.beginPath(); g.moveTo(-9, 12); g.lineTo(15, 12); g.strokeStyle = '#4a3020'; g.lineWidth = 4; g.stroke();
    g.beginPath(); g.moveTo(-6, -8); g.lineTo(-1, -8); g.moveTo(-6, -3); g.lineTo(-1, -3); g.strokeStyle = '#e8d7b8'; g.lineWidth = 1.6; g.stroke();
  });
  SPR.gem = mkSprite(40, function (g) {
    g.beginPath(); g.moveTo(0, 13); g.lineTo(-12, -2); g.lineTo(-6, -11); g.lineTo(6, -11); g.lineTo(12, -2); g.closePath(); g.fillStyle = '#3fe0ff'; g.fill(); outl(g);
    g.beginPath(); g.moveTo(-12, -2); g.lineTo(12, -2); g.moveTo(-6, -11); g.lineTo(-3, -2); g.lineTo(0, 13); g.lineTo(3, -2); g.lineTo(6, -11); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.3; g.stroke();
  });
  SPR.gold = mkSprite(40, function (g) {
    g.beginPath(); g.arc(0, 0, 11.5, 0, TAU); g.fillStyle = '#ffc93c'; g.fill(); outl(g);
    g.beginPath(); g.arc(0, 0, 7.5, 0, TAU); g.strokeStyle = '#e09a12'; g.lineWidth = 2; g.stroke();
    g.beginPath(); g.arc(-4, -4, 2.6, 0, TAU); g.fillStyle = 'rgba(255,255,255,.8)'; g.fill();
  });
  SPR.heart = mkSprite(44, function (g) {
    g.beginPath(); g.moveTo(0, 13); g.bezierCurveTo(-20, -2, -12, -17, 0, -7); g.bezierCurveTo(12, -17, 20, -2, 0, 13); g.closePath(); g.fillStyle = '#ff4d6d'; g.fill(); outl(g);
    g.beginPath(); g.arc(-6, -5, 3, 0, TAU); g.fillStyle = 'rgba(255,255,255,.7)'; g.fill();
  });
  ['#59d16a', '#ff8a4c', '#5aa9ff', '#c77dff', '#b65cff'].forEach(function (col, i) {
    SPR['goo' + i] = mkSprite(40, function (g) {
      g.beginPath(); g.moveTo(0, -13); g.bezierCurveTo(11, -3, 12, 4, 12, 5); g.arc(0, 5, 12, 0, Math.PI); g.bezierCurveTo(-12, 4, -11, -3, 0, -13); g.closePath(); g.fillStyle = col; g.fill(); outl(g);
      g.beginPath(); g.arc(-4, 3, 3.4, 0, TAU); g.fillStyle = 'rgba(255,255,255,.75)'; g.fill();
    });
  });
  SPR.star = mkSprite(48, function (g) {
    g.beginPath(); for (var i = 0; i < 10; i++) { var r = i % 2 ? 7 : 16, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    g.closePath(); g.fillStyle = '#fff36b'; g.fill(); outl(g);
    g.beginPath(); g.arc(-3, -3, 2.5, 0, TAU); g.fillStyle = '#fff'; g.fill();
  });
}
