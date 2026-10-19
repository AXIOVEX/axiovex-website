// Ephemeral loopback-only CI fixture. Never deployed as a Pages Function.
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { onRequest as subscribe } from '../../functions/api/newsletter/subscribe.js';
import { onRequest as confirm } from '../../functions/newsletter/confirm.js';
import { onRequestGet as unsubscribeGet, onRequestPost as unsubscribePost } from '../../functions/newsletter/unsubscribe.js';
import { renderEmail } from './render.mjs';
import { onRequest as send } from '../../functions/api/newsletter/send.js';
const base = 'http://127.0.0.1:8767';
const probe = 'tristen.pierson@gmail.com'; // Existing hard-coded staging probe.
const raw = new DatabaseSync(':memory:');
raw.exec(readFileSync('scripts/newsletter/schema.sql', 'utf8'));
const db = { prepare(sql) { const s = raw.prepare(sql); let args = []; const api = { bind(...v) { args = v; return api; }, async first() { return s.get(...args) || null; }, async all() { return { results: s.all(...args) }; }, async run() { s.run(...args); return { success: true }; } }; return api; } };
const outbox = [];
const env = { ENVIRONMENT: 'staging', NEWSLETTER_DB: db, NEWSLETTER_TEST_ALLOWLIST: probe, NEWSLETTER_SITE_BASE: base, NEWSLETTER_SEND_SECRET: 'local-browser-test-only', NEWSLETTER_TOKEN_SECRET: 'local-browser-test-token-only', NEWSLETTER_TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA', NEWSLETTER_MAIL_CAPTURE: outbox };
const issue = renderEmail(JSON.parse(readFileSync('newsletter/issues/2026-10-14.json', 'utf8')));
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, base);
    if (url.pathname === '/_test/mailbox') { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(outbox)); return; }
    if (url.pathname === '/_test/status') { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(raw.prepare('SELECT status, confirmed_at FROM subscribers WHERE email = ?').get(probe) || {})); return; }
    if (url.pathname === '/_test/probe-send' && req.method === 'POST') {
      const r = await send({ env, request: new Request(base + '/api/newsletter/send', { method: 'POST', headers: { 'content-type': 'application/json', 'x-newsletter-send-secret': env.NEWSLETTER_SEND_SECRET }, body: JSON.stringify({ mode: 'test', testRecipient: probe, issue: '2026-10-14', ...issue }) }) });
      res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(await r.text()); return;
    }
    const handler = url.pathname === '/api/newsletter/subscribe' ? subscribe : url.pathname === '/newsletter/confirm' ? confirm : url.pathname === '/newsletter/unsubscribe' ? req.method === 'POST' ? unsubscribePost : unsubscribeGet : null;
    if (handler) {
      let body = ''; for await (const part of req) body += part;
      const request = new Request(url, { method: req.method, headers: req.headers, ...(!['GET', 'HEAD'].includes(req.method) ? { body } : {}) });
      const response = await handler({ request, env, waitUntil() {} });
      res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(await response.text()); return;
    }
    const file = resolve('.' + decodeURIComponent(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '');
    const root = resolve('.');
    if (!file.startsWith(root + '/') && !file.startsWith(root + '\\') || /\/(?:scripts|functions|\.git|data)\//.test(url.pathname) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404).end(); return; }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
    res.setHeader('content-type', types[extname(file)] || 'application/octet-stream');
    res.end(readFileSync(file));
  } catch { res.writeHead(500).end('Local browser fixture error'); }
});
server.listen(8767, '127.0.0.1', () => console.log('Local newsletter browser fixture ready'));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));
