import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { localParts, shift } from './calendar.mjs';
import { save, summary } from './io.mjs';
export function verifyApproval(approval, bytes, date) {
  if (approval.issue !== date || approval.approvedBy !== 'Tristen Pierson' ||
      !Number.isFinite(Date.parse(approval.approvedAt)) || Date.parse(approval.approvedAt) > Date.now() ||
      approval.sha256 !== createHash('sha256').update(bytes).digest('hex')) {
    throw new Error('Missing or invalid per-issue approval: issue, owner, timestamp and email SHA-256 must match');
  }
}
async function main() {
  const p = localParts();
  const today = `${p.year}-${p.month}-${p.day}`;
  const mode = process.argv[2];
  if (mode === 'draft') {
    const date = shift(today, (3 - new Date(today + 'T12:00:00Z').getUTCDay() + 7) % 7);
    const snap = JSON.parse(readFileSync('data/signals.json', 'utf8'));
    save('editorial-template.json', { lede: 'REVIEW REQUIRED: write the editorial lede.', insights: [], watchlist: [], footerAddress: 'REVIEW REQUIRED: use the owner-designated production postal address.' });
    save('signals.json', snap);
    save('issue-candidates.json', { issue: date, snapshot: snap.updatedUtc,
      lanes: snap.lanes, pulse: snap.pulse, status: 'Editorial review required; not approved for sending' });
    summary(`# Newsletter preparation — ${date}\n\nSnapshot: ${snap.updatedUtc}. Candidate headlines and published Pulse values are attached with their original source/vintage fields.\n\n1. Review source claims, causes, WARN changes and the prior edition.\n2. Complete editorial-template.json; run node scripts/newsletter/assemble.mjs ${date} editorial.json.\n3. Review the email and web edition; commit the issue and email source.\n4. Record the owner approval for those exact email bytes in newsletter/approvals/${date}.json (see runbook).\n\nWednesday's job refuses an unapproved issue. Assembly is deterministic; editorial analysis and NDR/suppression review remain human work.\n`);
    return;
  }
  if (!['validate', 'send'].includes(mode)) throw new Error('Expected draft, validate or send');
  const date = process.env.ISSUE_DATE || today;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date !== today) throw new Error('Only today’s issue may be sent; prepare a new approved issue for recovery');
  const emailPath = `newsletter/issues/${date}.email.json`;
  const approvalPath = `newsletter/approvals/${date}.json`;
  if (!existsSync(emailPath) || !existsSync(approvalPath)) throw new Error(`Issue/approval absent for ${date}; nothing sent`);
  const bytes = readFileSync(emailPath);
  const approval = JSON.parse(readFileSync(approvalPath, 'utf8'));
  verifyApproval(approval, bytes, date);
  if (!process.env.NEWSLETTER_SEND_SECRET) throw new Error('Missing NEWSLETTER_SEND_SECRET in GitHub Actions secrets');
  if (mode === 'validate') {
    console.log('Issue bytes, owner approval, date and sender configuration validated; nothing sent.');
    return;
  }
  const child = spawnSync(process.execPath, ['scripts/newsletter/send.mjs', date,
    '--approved-by', `${approval.approvedBy} ${approval.approvedAt}`, '--base', 'https://axiovexsystems.com'], { encoding: 'utf8', timeout: 50 * 60 * 1000 });
  save('send.log', child.stdout + '\n' + child.stderr);
  if (child.status !== 0 || child.error) throw new Error('Newsletter sender failed; inspect send.log and server sends ledger before retrying');
  summary(`# Newsletter ${date}\n\nApproved bytes verified and sender completed. Inspect send.log for recipient results and FR-020 gauge; API acceptance does not prove inbox delivery.\n`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { summary(`# Newsletter blocked\n\n${error.message}\n`); process.exitCode = 1; });
}
