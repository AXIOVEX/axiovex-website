# Tasks: Contact Form with Cloudflare Turnstile

**Spec**: specs/005-contact-form/spec.md · **Plan**: plan.md
Legend: [x] done · [ ] open · [OWNER] needs Tristen's decision

## Audit + gate
- [x] T001 Audit: no forms, no Turnstile code, zero Cloudflare widgets (2026-10-05)
- [x] T002 Wireframes updated first: WF-06 form block + revision logged as pending
- [x] [OWNER] T003 Tristen approved the WF-06 revision + FR-005 privacy copy (2026-10-05)

## Implementation (after T003)
- [x] T004 Production Turnstile widget created ("Axiovex Contact — Production", Managed, axiovexsystems.com only, site key 0x4AAAAAAFOkyD9ikBMt8aVk); secret → Pages Production secrets; Preview uses Cloudflare's always-pass test secret (2026-10-05)
- [ ] T005 Entra app "Axiovex Website Contact" registered (client ID a9c02593-f205-4565-92b5-bf2ff52f6689), Mail.Send granted + admin consent verified, client secret (expires 2028-10-04) → Pages secrets in both environments; scope group "Axiovex Website Contact Scope" (ws-contact-scope@axiovexsystems.com, member: Start) created — **remaining: ApplicationAccessPolicy** (needs an Exchange Online PowerShell session; Cloud Shell unavailable — tenant has no Azure subscription; local pwsh device-code attempt authenticated the wrong admin account and was rejected by Connect-ExchangeOnline)
- [ ] T006 `functions/api/contact.js` (Siteverify fail-closed, honeypot, Graph delivery) + contact page form + styles — implemented on branch `005-contact-form`, unit-tested locally; live verification in T009
- [ ] T007 Privacy policy + contact microcopy swapped to the FR-005 approved text — implemented on branch `005-contact-form`; live verification in T009
- [x] T008 Rate-limiting rule on /api/contact live: "Contact form rate limit", 5 requests / 10s per IP, Block (2026-10-05)
- [ ] T009 Test ladder: preview + test keys (pass/block), negative Graph-scope test, production end-to-end delivery into Start
- [ ] T010 Wireframe revision log marked approved; spec status → implemented; CSP note added to spec 001 T014
