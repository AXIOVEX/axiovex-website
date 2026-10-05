# Tasks: Contact Form with Cloudflare Turnstile

**Spec**: specs/005-contact-form/spec.md · **Plan**: plan.md
Legend: [x] done · [ ] open · [OWNER] needs Tristen's decision

## Audit + gate
- [x] T001 Audit: no forms, no Turnstile code, zero Cloudflare widgets (2026-10-05)
- [x] T002 Wireframes updated first: WF-06 form block + revision logged as pending
- [ ] [OWNER] T003 Tristen approves the WF-06 revision + FR-005 privacy copy — **blocks all tasks below**

## Implementation (after T003)
- [ ] T004 Create the production Turnstile widget (Managed, axiovexsystems.com, action `contact`); secret → Pages secrets
- [ ] T005 Entra app registration + Mail.Send + admin consent [OWNER-assist if a consent click is required]; ApplicationAccessPolicy scoped to Start; client secret → Pages secrets
- [ ] T006 `functions/api/contact.js` (Siteverify fail-closed, honeypot, Graph delivery) + contact page form + styles
- [ ] T007 Privacy policy + contact microcopy swapped to the FR-005 approved text
- [ ] T008 Rate-limiting rule on /api/contact
- [ ] T009 Test ladder: preview + test keys (pass/block), negative Graph-scope test, production end-to-end delivery into Start
- [ ] T010 Wireframe revision log marked approved; spec status → implemented; CSP note added to spec 001 T014
