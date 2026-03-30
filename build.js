#!/usr/bin/env node
/**
 * build.js — Builds the obfuscated index.html from src/index.html
 *
 * Usage:  node build.js
 *
 * What it does:
 *  1. Reads src/index.html (the human-readable source)
 *  2. Extracts the inline <script> block
 *  3. Obfuscates the JavaScript with javascript-obfuscator
 *  4. Injects security hardening (CSP, anti-devtools, disable right-click)
 *  5. Writes the result to index.html (the deployed, obfuscated file)
 */

const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const SRC = path.join(__dirname, 'src', 'index.html');
const DEST = path.join(__dirname, 'index.html');

const html = fs.readFileSync(SRC, 'utf8');

// ── 1. Extract JS from <script>…</script> ──────────────────────────────────
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/i);
if (!scriptMatch) {
  console.error('ERROR: no <script> block found in src/index.html');
  process.exit(1);
}
const originalJs = scriptMatch[1];

// ── 2. Obfuscate ────────────────────────────────────────────────────────────
console.log('Obfuscating JavaScript…');
const obfuscationResult = JavaScriptObfuscator.obfuscate(originalJs, {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,
  deadCodeInjection: false,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  selfDefending: true,
  stringArray: true,
  stringArrayEncoding: ['rc4'],
  stringArrayThreshold: 0.75,
  unicodeEscapeSequence: false,
  target: 'browser',
});
const obfuscatedJs = obfuscationResult.getObfuscatedCode();
console.log(`  Original: ${originalJs.length.toLocaleString()} chars`);
console.log(`  Obfuscated: ${obfuscatedJs.length.toLocaleString()} chars`);

// ── 3. Security hardening snippet (injected BEFORE the obfuscated app code) ─
// NOTE: These measures are deterrents against casual copying, not bulletproof
// protection. Determined users can still access DevTools via browser menus or
// disable JavaScript. The primary protection is the JS obfuscation above.
const securitySnippet = `
/* ── Security hardening ─────────────────────────────────── */
(function(){
  // Disable right-click context menu
  document.addEventListener('contextmenu', function(e){ e.preventDefault(); });

  // Block common DevTools / View-Source keyboard shortcuts
  document.addEventListener('keydown', function(e){
    var k = e.key || '';
    // F12
    if (k === 'F12') { e.preventDefault(); return; }
    var ctrl = e.ctrlKey || e.metaKey;
    // Ctrl+U (view-source), Ctrl+S (save page)
    if (ctrl && (k === 'u' || k === 'U' || k === 's' || k === 'S')) {
      e.preventDefault(); return;
    }
    // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (DevTools)
    if (ctrl && e.shiftKey && (k === 'i' || k === 'I' || k === 'j' || k === 'J' || k === 'c' || k === 'C')) {
      e.preventDefault(); return;
    }
  });
})();
/* ─────────────────────────────────────────────────────────── */
`;

// ── 4. Build the CSP meta tag ───────────────────────────────────────────────
// NOTE: 'unsafe-inline' for script-src is required because this is a single-file
// SPA with an inline <script> block. Migrating to an external JS file with a
// hash/nonce-based CSP would provide stronger security but requires changing the
// single-file architecture.
const cspContent = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "script-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
].join('; ');

const cspMeta = `<meta http-equiv="Content-Security-Policy" content="${cspContent}">`;

// X-Content-Type-Options
const xctMeta = `<meta http-equiv="X-Content-Type-Options" content="nosniff">`;

// ── 5. Assemble output HTML ─────────────────────────────────────────────────
let output = html;

// Insert CSP + X-Content-Type-Options right after <meta charset="UTF-8">
output = output.replace(
  '<meta charset="UTF-8">',
  `<meta charset="UTF-8">\n${cspMeta}\n${xctMeta}`
);

// Replace the <script>…</script> block with the hardened + obfuscated version
output = output.replace(
  /<script>[\s\S]*?<\/script>/i,
  `<script>${securitySnippet}${obfuscatedJs}</script>`
);

// ── 6. Write output ─────────────────────────────────────────────────────────
fs.writeFileSync(DEST, output, 'utf8');
console.log(`\nDone — wrote ${DEST} (${(fs.statSync(DEST).size / 1024).toFixed(1)} KB)`);
