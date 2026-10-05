# Tasks: Contact Form with Cloudflare Turnstile

**Spec**: specs/005-contact-form/spec.md · **Plan**: plan.md
Legend: [x] done · [ ] open · [OWNER] needs Tristen's decision

## Audit + gate
- [x] T001 Audit: no forms, no Turnstile code, zero Cloudflare widgets (2026-10-05)
- [x] T002 Wireframes updated first: WF-06 form block + revision logged as pending
- [x] [OWNER] T003 Tristen approved the WF-06 revision + FR-005 privacy copy (2026-10-05)

## Implementation (after T003)
- [x] T004 Production Turnstile widget created ("Axiovex Contact — Production", Managed, axiovexsystems.com only, site key 0x4AAAAAAFOkyD9ikBMt8aVk); secret → Pages Production secrets; Preview uses Cloudflare's always-pass test secret (2026-10-05)
- [x] T005 Entra app "Axiovex Website Contact" registered (client ID a9c02593-f205-4565-92b5-bf2ff52f6689), Mail.Send granted + admin consent verified, client secret (expires 2028-10-04) → Pages secrets in both environments; scope group "Axiovex Website Contact Scope" (ws-contact-scope@axiovexsystems.com, member: Start) created; **ApplicationAccessPolicy applied 2026-10-05** (RestrictAccess to the scope group) — verified with Test-ApplicationAccessPolicy: start@ **Granted**, tristen@ **Denied**. (Access note: device-code EXO sign-ins from unregistered devices are blocked by tenant Security Defaults, error 530035; the policy was applied during an owner-approved brief Security Defaults disable → apply → re-enable cycle, defaults verified back on.)
- [x] T006 `functions/api/contact.js` (Siteverify fail-closed, honeypot + timing trap, Graph delivery as Start with visitor Reply-To, stores nothing) + WF-06 contact form (inline success/error states, per-field errors, no-JS email fallback intact) + styles.v24.css — implemented in 7d11b2a, unit-tested locally, preview-verified in T009, live on production 2026-10-05
- [x] T007 Privacy policy + contact microcopy swapped to the FR-005 approved text (7d11b2a; verified live — /privacy/ serves the new "Information you provide" text and the October 5, 2026 date)
- [x] T008 Rate-limiting rule on /api/contact live: "Contact form rate limit", 5 requests / 10s per IP, Block (2026-10-05)
- [x] T009 Test ladder: preview pass/block/restore verified 2026-10-05 (delivered to Start with correct From/Reply-To; block case stopped at Siteverify, nothing delivered); negative Graph-scope test passed via Test-ApplicationAccessPolicy (Start Granted, tristen@ Denied — see T005); production end-to-end passed 2026-10-05 after merge to main: real submission on axiovexsystems.com (production widget → Success), inline "Message sent. A founder will reply.", delivery verified in Start, test message deleted, all 4 branch preview deployments deleted
- [x] T010 Wireframe revision log marked approved (2026-10-05) and implemented; spec status → implemented and live; CSP note added to spec 001 T014 (597d6b5); monitoring state updated (website_commit 597d6b5)
