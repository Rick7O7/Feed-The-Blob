// Fügt src/*.js in die Vorlage ein und schreibt drei Fassungen, jede als einzelne Datei:
//   dist/index.html               Testfassung: Platzhalter-Werbung, Test-Schnittstelle, verschlüsseltes Admin-Menü
//   dist/portal-basic/index.html  ohne Werbung, für die Testphase eines Portals
//   dist/portal-full/index.html   mit CrazyGames-SDK und echter Werbung, für die weltweite Freigabe
// Die beiden Portal-Fassungen enthalten weder das Admin-Menü noch die Test-Schnittstelle. Das wird unten geprüft,
// und der Bau bricht ab, wenn es nicht stimmt.
// Admin-Menü: admin/admin.js wird mit einem Schlüssel aus der Passphrase (admin/pass.txt) verschlüsselt. Im Klartext
// landet es in keiner Fassung. Fehlt admin/pass.txt, entsteht die Testfassung ohne Admin-Menü.
// Aufruf: node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root = path.dirname(new URL(import.meta.url).pathname);
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const files = fs.readdirSync(path.join(root, 'src')).filter(f => f.endsWith('.js')).sort();
const game = files.map(f => '// ---- ' + f + ' ----\n' + read('src/' + f)).join('\n');
const tpl = read('src/index.tpl.html');
const sdk = '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>';
const CANARY = 'FBADMIN-CANARY', ROUNDS = 300000;

// Admin-Menü verschlüsseln: PBKDF2-SHA256 macht aus der Passphrase den Schlüssel, AES-256-GCM verschlüsselt den Quelltext.
// Das Salz bleibt gleich, damit ein auf einem Gerät gemerkter Schlüssel nach einem neuen Bau weiter passt.
function adminGate() {
  const passFile = path.join(root, 'admin/pass.txt'), saltFile = path.join(root, 'admin/salt.txt');
  if (!fs.existsSync(passFile)) { console.log('Hinweis: admin/pass.txt fehlt, die Testfassung entsteht ohne Admin-Menü.'); return ''; }
  const pass = fs.readFileSync(passFile, 'utf8').trim();
  if (pass.length < 12) throw new Error('Die Admin-Passphrase ist zu kurz (mindestens 12 Zeichen).');
  if (!fs.existsSync(saltFile)) fs.writeFileSync(saltFile, crypto.randomBytes(16).toString('base64'));
  const salt = Buffer.from(fs.readFileSync(saltFile, 'utf8').trim(), 'base64'), iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(pass, salt, ROUNDS, 32, 'sha256'), c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const src = read('admin/admin.js');
  if (!src.includes(CANARY)) throw new Error('admin/admin.js: Markierung ' + CANARY + ' fehlt.');
  const ct = Buffer.concat([c.update(src, 'utf8'), c.final(), c.getAuthTag()]);
  const payload = JSON.stringify({ s: salt.toString('base64'), i: iv.toString('base64'), c: ct.toString('base64'), n: ROUNDS });
  return read('admin/loader.js').replace('/*__ADMIN_PAYLOAD__*/null', () => payload);
}
const gate = adminGate(), harness = read('dev/harness.js');

for (const [dir, ads, head, dev] of [['dist', 'test', '', true], ['dist/portal-basic', 'none', '', false], ['dist/portal-full', 'crazygames', sdk, false]]) {
  const js = dev ? game + '\n// ---- dev/harness.js ----\n' + harness + (gate ? '\n// ---- admin/loader.js ----\n' + gate : '') : game;
  const html = tpl.replace('<!--__SDK__-->', head).replace('__ADS__', ads).replace('/*__JS__*/', () => js);
  if (html.includes(CANARY)) throw new Error(dir + ': Das Admin-Menü steht im Klartext in der Datei.');
  if (!dev) for (const bad of ['FBAdmin', 'feedblob.admin', '__ADMIN_PAYLOAD__', 'admin gate', '__fb']) if (html.includes(bad)) throw new Error(dir + ': enthält "' + bad + '", das darf in einer Portal-Fassung nicht vorkommen.');
  fs.mkdirSync(path.join(root, dir), { recursive: true });
  fs.writeFileSync(path.join(root, dir, 'index.html'), html);
  console.log(dir + '/index.html: ' + Math.round(html.length / 1024) + ' KB, Werbung: ' + ads + (dev ? ', Test-Schnittstelle, Admin-Menü ' + (gate ? 'verschlüsselt' : 'fehlt') : ', ohne Admin-Menü'));
}
// index.html im Hauptordner = Testfassung, damit das Repo direkt spielbar bleibt (nie von Hand bearbeiten).
fs.copyFileSync(path.join(root, 'dist/index.html'), path.join(root, 'index.html'));
console.log('index.html: Kopie von dist/index.html');
