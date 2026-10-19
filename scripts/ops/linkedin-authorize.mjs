// Local OAuth setup. Credentials never appear in logs, files or artifacts.
import { createServer } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { linkedinPolicy } from './linkedin.mjs';
const target = process.argv.includes('--company') ? 'company' : 'personal';
const nonce = randomBytes(24).toString('hex');
const state = randomBytes(32).toString('hex');
const redirect = 'http://localhost:8766/callback';
let credentials;
function secret(name, value) {
  const r = spawnSync('gh', ['secret', 'set', name, '--repo', 'AXIOVEX/axiovex-website'], { input: value, encoding: 'utf8' });
  if (r.status !== 0) throw new Error('Could not save GitHub secret ' + name);
}
function variable(name, value) {
  const r = spawnSync('gh', ['variable', 'set', name, '--body', value, '--repo', 'AXIOVEX/axiovex-website'], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('Could not save GitHub variable ' + name);
}
const form = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Axiovex LinkedIn authorization</title><body><h1>Axiovex ${target} publishing authorization</h1><p>App credentials are sent only to this loopback server and LinkedIn. The accepted token is saved directly to GitHub Actions secrets. No token is displayed.</p><form method="post" action="/configure"><input type="hidden" name="nonce" value="${nonce}"><p><label>Client ID <input name="clientId" required value="${target === 'personal' ? linkedinPolicy.clientId : ''}"></label></p><p><label>Client secret <input name="clientSecret" type="password" required autocomplete="off"></label></p><button>Authorize LinkedIn and save repository credentials</button></form></body></html>`;
const server = createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Security-Policy', "default-src 'none'; form-action 'self' https://www.linkedin.com; frame-ancestors 'none'; base-uri 'none'");
  try {
    const url = new URL(req.url, 'http://localhost:8766');
    console.log('Local OAuth request:', req.method, url.pathname === '/callback' ? '/callback (parameters hidden)' : url.pathname === '/configure' ? '/configure' : '/setup');
    if (req.headers.host !== 'localhost:8766' && req.headers.host !== '127.0.0.1:8766') { res.writeHead(403).end(); return; }
    if (req.method === 'GET' && url.pathname === `/setup/${nonce}`) { res.setHeader('content-type', 'text/html; charset=utf-8'); res.end(form); return; }
    if (req.method === 'POST' && url.pathname === '/configure') {
      let raw = '';
      for await (const part of req) { raw += part; if (raw.length > 8192) throw new Error('Oversized configuration'); }
      const fields = new URLSearchParams(raw);
      if (fields.get('nonce') !== nonce || !/^https?:\/\/(localhost|127\.0\.0\.1):8766$/.test(req.headers.origin || '')) throw new Error('Invalid local setup request');
      const clientId = fields.get('clientId'), clientSecret = fields.get('clientSecret');
      if (!clientId || !clientSecret || target === 'personal' && clientId !== linkedinPolicy.clientId) throw new Error('Invalid app credentials');
      credentials = { clientId, clientSecret };
      const scope = target === 'personal' ? 'openid profile w_member_social' : 'w_organization_social r_organization_social';
      const params = new URLSearchParams({ response_type: 'code', client_id: clientId, redirect_uri: redirect, state, scope });
      res.writeHead(303, { Location: 'https://www.linkedin.com/oauth/v2/authorization?' + params }).end(); return;
    }
    if (req.method === 'GET' && url.pathname === '/callback') {
      const received = url.searchParams.get('state') || '';
      if (!credentials || received.length !== state.length || !timingSafeEqual(Buffer.from(received), Buffer.from(state)) || !url.searchParams.get('code')) throw new Error('OAuth state/code validation failed');
      const r = await fetch('https://www.linkedin.com/oauth/v2/accessToken', { method: 'POST', body: new URLSearchParams({ grant_type: 'authorization_code', code: url.searchParams.get('code'), redirect_uri: redirect, client_id: credentials.clientId, client_secret: credentials.clientSecret }), signal: AbortSignal.timeout(30000) });
      if (!r.ok) throw new Error('LinkedIn token exchange failed: HTTP ' + r.status);
      const token = await r.json();
      if (!token.access_token || !Number.isFinite(token.expires_in) || token.expires_in < 1) throw new Error('Invalid token response');
      if (target === 'personal') {
        const who = await fetch('https://api.linkedin.com/v2/userinfo', { headers: { authorization: `Bearer ${token.access_token}` }, signal: AbortSignal.timeout(20000) });
        if (!who.ok) throw new Error('Authorized member verification failed');
        const profile = await who.json();
        if (!profile.sub || profile.name !== linkedinPolicy.expectedMemberName) throw new Error('The authorized member must be Tristen Pierson');
        variable('LINKEDIN_PERSON_URN', 'urn:li:person:' + profile.sub);
      }
      const prefix = target === 'company' ? 'LINKEDIN_COMPANY_' : 'LINKEDIN_';
      secret(prefix + 'ACCESS_TOKEN', token.access_token);
      secret(prefix + 'CLIENT_SECRET', credentials.clientSecret);
      if (token.refresh_token) secret(prefix + 'REFRESH_TOKEN', token.refresh_token);
      variable(prefix + 'CLIENT_ID', credentials.clientId);
      variable(prefix + 'EXPIRES_AT', new Date(Date.now() + token.expires_in * 1000).toISOString());
      credentials = undefined;
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.end('<!doctype html><html lang="en"><title>LinkedIn authorization saved</title><h1>Authorization saved</h1><p>The token is stored in GitHub Actions secrets. No social post was sent. You may close this tab.</p></html>');
      console.log(`LinkedIn ${target} authorization verified and saved to repository secrets; no token printed.`);
      server.close(); return;
    }
    res.writeHead(404).end('Not found');
  } catch (error) { res.writeHead(400, { 'content-type': 'text/plain' }).end('Authorization was not completed. Check the local terminal for the non-secret error.'); console.error(error.message); }
});
server.listen(8766, '127.0.0.1', () => console.log(`Open http://localhost:8766/setup/${nonce} — ${target} app redirect must be ${redirect}`));
setTimeout(() => { console.error('Local authorization session expired.'); server.close(); }, 30 * 60000).unref();
