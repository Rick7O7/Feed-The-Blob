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

/* ---------- sound: everything is synthesised, no audio files ----------
   master (silent while an ad plays) <- sfx bus (sound toggle) and music bus (music toggle). A compressor on the master keeps
   loud moments (boss pop, meteors, jackpots) from clipping, so the quiet pickups can stay audible. */
var Snd = {
  ctx: null, master: null, sfx: null, mus: null, muted: false, musicOff: false, last: {}, SFX: 0.6, MUS: 0.2,
  init: function () {
    if (this.ctx) { if (this.ctx.state === 'suspended' && !document.hidden) this.ctx.resume(); return; }
    try {
      var AC = window.AudioContext || window.webkitAudioContext, c = new AC();
      this.ctx = c; this.master = c.createGain();
      var comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.18;
      this.master.connect(comp); comp.connect(c.destination);
      this.sfx = c.createGain(); this.sfx.connect(this.master);
      this.mus = c.createGain(); this.mus.gain.value = 0;
      var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; this.mus.connect(lp); lp.connect(this.master);
      this.setMute(); Music.start();
    } catch (e) { this.ctx = null; }
  },
  // the argument is ignored: the state decides. Ads mute everything, the two toggles mute their own bus.
  setMute: function () {
    if (!this.ctx) return;
    this.master.gain.value = (typeof Ads !== 'undefined' && Ads.busy) ? 0 : 1;
    this.sfx.gain.value = this.muted ? 0 : this.SFX;
  },
  ok: function (key, gap) {
    if (!this.ctx || this.muted || this.ctx.state !== 'running') return false;
    var t = this.ctx.currentTime; if (key && this.last[key] && t - this.last[key] < gap) return false;
    if (key) this.last[key] = t; return true;
  },
  jit: function () { return 0.92 + Math.random() * 0.16; },   // random pitch wobble, keeps repeated hits/pickups from sounding identical (Math.random, never the seeded rnd, so the simulation stays deterministic)
  tone: function (f, dur, type, vol, f2, delay, out) {
    var c = this.ctx, t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out || this.sfx); o.start(t); o.stop(t + dur + 0.03);
  },
  noise: function (dur, vol, cut) {
    var c = this.ctx, n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = (cut || 1200) * this.jit(); g.gain.value = vol;
    s.buffer = b; s.connect(f); f.connect(g); g.connect(this.sfx); s.start();
  },
  // volumes balanced by ear against each other: frequent sounds (pop, gulp, coin, tick) quiet, rare big moments louder
  pop: function (n) { if (this.ok('pop', 0.035)) { var f = (440 + Math.min(n, 16) * 38) * this.jit(); this.tone(f, 0.07, 'triangle', 0.09, f * 1.5); } },
  gulp: function (n) { if (this.ok('gulp', 0.04)) { var f = (250 + Math.min(n, 20) * 26) * this.jit(); this.tone(f * 1.6, 0.1, 'sine', 0.15, f * 0.8); } },
  coin: function () { if (this.ok('coin', 0.08)) { var j = this.jit(); this.tone(988 * j, 0.08, 'square', 0.045); this.tone(1319 * j, 0.16, 'square', 0.045, 0, 0.07); } },
  tick: function (n) { if (this.ok('tick', 0.045)) this.tone((1400 + Math.min(n || 0, 12) * 60) * this.jit(), 0.05, 'triangle', 0.05); },   // a coin or gem landing in the HUD counter
  buy: function () { if (this.ok('buy', 0.05)) { this.tone(523, 0.08, 'triangle', 0.16); this.tone(784, 0.14, 'triangle', 0.16, 0, 0.07); } },
  nope: function () { if (this.ok('nope', 0.15)) this.tone(170, 0.12, 'square', 0.06, 120); },
  bump: function () { if (this.ok('bump', 0.08)) { this.noise(0.16, 0.24, 900); this.tone(170 * this.jit(), 0.16, 'square', 0.1, 60); } },
  hit: function () { if (this.ok('hit', 0.08)) { this.noise(0.22, 0.32, 700); this.tone(120 * this.jit(), 0.25, 'sawtooth', 0.13, 45); } },
  boom: function () { if (this.ok('boom', 0.1)) { this.noise(0.6, 0.45, 500); this.tone(90 * this.jit(), 0.5, 'sine', 0.3, 35); } },
  siren: function () { if (this.ok('siren', 0.5)) { for (var i = 0; i < 3; i++) this.tone(620, 0.22, 'sawtooth', 0.055, 930, i * 0.24); } },
  level: function () { if (this.ok('level', 0.3)) { var a = [523, 659, 784, 1047, 1319]; for (var i = 0; i < a.length; i++) this.tone(a[i], 0.2, 'triangle', 0.15, 0, i * 0.085); this.tone(1568, 0.5, 'sine', 0.08, 0, 0.45); } },
  quest: function () { if (this.ok('quest', 0.3)) { this.tone(784, 0.1, 'triangle', 0.13); this.tone(1047, 0.1, 'triangle', 0.13, 0, 0.09); this.tone(1568, 0.25, 'triangle', 0.13, 0, 0.18); } },
  tired: function () { if (this.ok('tired', 0.6)) this.tone(300, 0.25, 'sine', 0.08, 140); },
  whoosh: function () { if (this.ok('whoosh', 0.1)) { this.noise(0.14, 0.16, 2600); this.tone(520 * this.jit(), 0.14, 'sine', 0.06, 180); } },
  smack: function () { if (this.ok('smack', 0.08)) { this.noise(0.18, 0.28, 1100); this.tone(240 * this.jit(), 0.2, 'square', 0.11, 80); this.tone(660 * this.jit(), 0.12, 'triangle', 0.09, 990, 0.05); } },
  steal: function (n) { if (this.ok('steal', 0.08)) { var j = this.jit(); this.noise(0.2, 0.36, 1100); this.tone(240 * j, 0.22, 'square', 0.13, 70); this.tone(90, 0.18, 'sine', 0.22, 45); var f = [660, 880, 1175][n - 1] || 660; this.tone(f * j, 0.13, 'triangle', 0.12, f * 1.5, 0.05); if (n >= 3) { var a = [784, 988, 1175, 1568, 2093]; for (var i = 0; i < a.length; i++) this.tone(a[i], 0.16, 'square', 0.05, 0, 0.14 + i * 0.07); this.noise(0.5, 0.18, 4000); } } },
  crown: function () { if (this.ok('crown', 0.5)) { var a = [659, 784, 1047, 1319]; for (var i = 0; i < a.length; i++) this.tone(a[i], 0.16, 'triangle', 0.12, 0, i * 0.09); } },
  spike: function () { if (this.ok('spike', 0.15)) { this.tone(900 * this.jit(), 0.16, 'square', 0.08, 380); this.noise(0.12, 0.2, 3000); } },
  hurt: function () { if (this.ok('hurt', 0.2)) { this.tone(320, 0.3, 'sawtooth', 0.14, 90); this.noise(0.2, 0.26, 800); } },
  ko: function () { if (this.ok('ko', 0.5)) { var a = [523, 440, 349, 262, 196]; for (var i = 0; i < a.length; i++) this.tone(a[i], 0.24, 'triangle', 0.14, 0, i * 0.13); } },
  alarm: function () { if (this.ok('alarm', 1.2)) { for (var i = 0; i < 4; i++) this.tone(i % 2 ? 660 : 880, 0.14, 'square', 0.07, 0, i * 0.15); } },
  gem: function () { if (this.ok('gem', 0.06)) { var j = this.jit(); this.tone(1568 * j, 0.09, 'sine', 0.12); this.tone(2093 * j, 0.2, 'sine', 0.12, 0, 0.07); } },
  warp: function () { if (this.ok('warp', 0.3)) { this.tone(260, 0.3, 'sine', 0.14, 1300); this.tone(520, 0.25, 'triangle', 0.07, 1700, 0.06); } },
  boing: function () { if (this.ok('boing', 0.12)) this.tone(170 * this.jit(), 0.2, 'sine', 0.17, 560); },
  zoom: function () { if (this.ok('zoom', 0.3)) { this.tone(420, 0.16, 'triangle', 0.11, 940); this.noise(0.12, 0.1, 3200); } },
  heal: function () { if (this.ok('heal', 0.2)) { var j = this.jit(); this.tone(660 * j, 0.12, 'sine', 0.12); this.tone(880 * j, 0.2, 'sine', 0.12, 0, 0.1); } },
  fanfare: function () { if (this.ok('fanfare', 1)) { var a = [523, 659, 784, 1047], i; for (i = 0; i < a.length; i++) { this.tone(a[i], 0.14, 'square', 0.05, 0, i * 0.1); this.tone(a[i] / 2, 0.14, 'triangle', 0.1, 0, i * 0.1); } this.tone(1047, 0.6, 'triangle', 0.13, 0, 0.42); this.tone(1319, 0.6, 'triangle', 0.1, 0, 0.42); this.tone(1568, 0.6, 'sine', 0.08, 0, 0.42); } }
};

/* ---------- music: one calm generated loop per world theme (THEMES order), scheduled ahead on the audio clock ---------- */
// per theme: tempo, root note (MIDI), scale steps, chord roots as scale degrees, melody/bass wave, how busy the melody is, octave
var MUSIC = [
  { bpm: 96, root: 60, scale: [0, 2, 4, 7, 9], chords: [0, 3, 4, 3], lead: 'triangle', bass: 'sine', busy: 0.55, oct: 12, seed: 11 },       // Meadow: sunny pentatonic
  { bpm: 84, root: 65, scale: [0, 2, 4, 6, 7, 9, 11], chords: [0, 1, 4, 3], lead: 'sine', bass: 'triangle', busy: 0.45, oct: 12, seed: 23 }, // Lagoon: dreamy lydian marimba
  { bpm: 72, root: 57, scale: [0, 3, 5, 7, 10], chords: [0, 2, 3, 1], lead: 'sine', bass: 'sine', busy: 0.35, oct: 24, seed: 37 },           // Glacier: sparse high bells
  { bpm: 102, root: 50, scale: [0, 2, 3, 5, 7, 9, 10], chords: [0, 6, 5, 6], lead: 'square', bass: 'triangle', busy: 0.5, oct: 12, seed: 41 }, // Volcano: dorian, a bit of drive
  { bpm: 66, root: 52, scale: [0, 2, 3, 7, 8], chords: [0, 3, 2, 4], lead: 'triangle', bass: 'sine', busy: 0.4, oct: 24, seed: 53 }           // Deep Space: slow, floating
];
var Music = {
  timer: null, next: 0, stepI: 0, theme: -1, pat: null, vol: 0,
  hz: function (m) { return 440 * Math.pow(2, (m - 69) / 12); },
  note: function (deg, mu, octUp) { var s = mu.scale, o = Math.floor(deg / s.length); return mu.root + s[((deg % s.length) + s.length) % s.length] + 12 * o + (octUp || 0); },
  // a 32-step loop (4 bars of 8 eighths), generated once per theme from a fixed seed so it is the same tune every time
  build: function (ti) {
    var mu = MUSIC[ti], s = mu.seed, r = function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }, mel = [], prev = 2, i;
    for (i = 0; i < 32; i++) {
      var ch = mu.chords[i >> 3], strong = i % 4 === 0;
      if (i % 16 >= 12 && i >= 16) { mel.push(mel[i - 16] === null ? null : mel[i - 16] + (i % 2 ? 1 : 0)); continue; }   // the second phrase ends like the first, a little shifted
      if (strong || r() < mu.busy) { var d = strong ? ch + [0, 2, 4][Math.floor(r() * 3)] : prev + Math.round((r() - 0.5) * 3); prev = clamp(d, ch - 2, ch + 7); mel.push(prev); } else mel.push(null);
    }
    return { mel: mel, mu: mu };
  },
  start: function () { if (this.timer || !Snd.ctx) return; var self = this; this.next = Snd.ctx.currentTime + 0.1; this.timer = setInterval(function () { self.tick(); }, 60); },
  tick: function () {
    var c = Snd.ctx; if (!c || c.state !== 'running') return;
    var mg = typeof Ads !== 'undefined' && Ads.busy ? 0 : 1; if (Snd.master.gain.value !== mg) Snd.master.gain.value = mg;   // ads: silence everything
    var want = Snd.musicOff ? 0 : (!G || !G.started) ? 0.6 : G.modal ? 0.35 : 1;     // quieter on the start screen and under pop-ups
    if (Math.abs(want - this.vol) > 0.001) { this.vol = want; Snd.mus.gain.setTargetAtTime(want * Snd.MUS, c.currentTime, 0.4); }
    if (this.next < c.currentTime - 0.3) this.next = c.currentTime + 0.05;            // after a pause or a hidden tab: do not try to catch up
    while (this.next < c.currentTime + 0.25) {
      var ti = G ? G.rb % MUSIC.length : 0;
      if (this.stepI % 32 === 0 && ti !== this.theme) { this.theme = ti; this.pat = this.build(ti); }   // a new world switches tune at the loop start
      if (Snd.musicOff) { this.next += 0.25; this.stepI = 0; continue; }
      this.play(this.stepI % 32, this.next); this.stepI++; this.next += 60 / this.pat.mu.bpm / 2;
    }
  },
  play: function (i, t) {
    var mu = this.pat.mu, e = 60 / mu.bpm / 2, ch = mu.chords[i >> 3], m = this.pat.mel[i], d = t - Snd.ctx.currentTime;
    if (i % 8 === 0) { this.voice(this.hz(this.note(ch, mu, -12)), e * 7.5, mu.bass, 0.16, d); this.voice(this.hz(this.note(ch + 2, mu)), e * 7.5, 'sine', 0.035, d); this.voice(this.hz(this.note(ch + 4, mu)), e * 7.5, 'sine', 0.03, d); }   // bass plus a soft pad chord
    else if (i % 8 === 4) this.voice(this.hz(this.note(ch + 4, mu, -12)), e * 3, mu.bass, 0.08, d);
    if (m !== null && m !== undefined) this.voice(this.hz(this.note(m, mu, mu.oct)), e * (mu.lead === 'square' ? 0.9 : 1.8), mu.lead, mu.lead === 'square' ? 0.03 : 0.07, d);
  },
  voice: function (f, dur, type, vol, delay) {
    var c = Snd.ctx, t = c.currentTime + Math.max(0, delay), o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(Snd.mus); o.start(t); o.stop(t + dur + 0.05);
  }
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
