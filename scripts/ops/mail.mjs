import { readFileSync } from 'node:fs';
import { request, save } from './io.mjs';
try {
  const secret = process.env.NEWSLETTER_SEND_SECRET;
  if (!secret) throw new Error('Founder email not sent: missing NEWSLETTER_SEND_SECRET');
  const kind = process.env.REPORT_KIND || process.argv[2] || 'daily';
  const report = readFileSync((process.env.OPS_OUTPUT || 'ops-output') + '/report.md', 'utf8');
  const runId = process.env.GITHUB_RUN_ID;
  const response = await request('https://axiovexsystems.com/api/ops/report', {
    method: 'POST', headers: { 'x-website-ops-secret': secret, 'content-type': 'application/json' },
    body: JSON.stringify({ kind, report,
      ...(runId && /^\d+$/.test(runId) ? { runUrl: `https://github.com/AXIOVEX/axiovex-website/actions/runs/${runId}` } : {}) }),
  });
  const result = await response.json().catch(() => ({}));
  save('mail-delivery.json', { ...result, httpStatus: response.status, checkedAt: new Date().toISOString() });
  if (response.status !== 202 || !result.ok) throw new Error(`Microsoft report delivery failed: HTTP ${response.status}, ${result.message || 'unexpected response'}`);
  console.log(`Microsoft 365 accepted the ${kind} report from ${result.from} to both founders. Delivery receipt saved.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
