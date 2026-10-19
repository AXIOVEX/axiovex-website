import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lighthouseFindings } from './seo-audit.mjs';
import { verifyFinalPreview } from './month-end.mjs';
test('Lighthouse results preserve failures and never turn a missing engine into a passing score', () => {
  const lhr = { categories: { seo: { score: 0.92, auditRefs: [{ id: 'link-text' }, { id: 'structured-data' }] } }, audits: { 'link-text': { title: 'Bad link', score: 0 }, 'structured-data': { score: null, scoreDisplayMode: 'manual' } } };
  assert.deepEqual(lighthouseFindings(lhr).map(f => f.id), ['link-text']);
  assert.throws(() => lighthouseFindings({ runtimeError: { message: 'timeout' } }));
  assert.throws(() => lighthouseFindings({ categories: {} }));
});
test('subscriber release requires acceptance of the same final edition by Tristen first', () => {
  const preview = { httpStatus: 202, sent: 1, recipient: 'tristen@axiovexsystems.com', date: '2026-10-30', emailSHA256: 'exact-bytes' };
  verifyFinalPreview(preview, '2026-10-30', 'exact-bytes');
  for (const change of [{ httpStatus: 502 }, { sent: 0 }, { recipient: 'other@example.com' }, { date: '2026-10-19' }, { emailSHA256: 'changed' }]) {
    assert.throws(() => verifyFinalPreview({ ...preview, ...change }, '2026-10-30', 'exact-bytes'));
  }
  assert.throws(() => verifyFinalPreview(null, preview.date, preview.emailSHA256));
});
test('real missing-page and machine-text assets prevent homepage fallback regressions', () => {
  const error = readFileSync('404.html', 'utf8');
  assert.match(error, /name="robots" content="noindex, follow"/);
  const machine = readFileSync('llms-full.txt', 'utf8');
  assert.match(machine, /## https:\/\/axiovexsystems\.com\/signals\//);
  assert.ok(!machine.includes('https://axiovexsystems.com/research/'));
  assert.ok(!/<(?:!doctype|html)\b/i.test(machine));
  assert.ok(!readFileSync('sitemap.xml', 'utf8').includes('/404.html'));
});
