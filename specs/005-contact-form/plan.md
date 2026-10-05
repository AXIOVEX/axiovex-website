# Plan: Contact Form with Cloudflare Turnstile

**Spec**: specs/005-contact-form/spec.md

## Sequence (after the approval gate)

1. **Cloudflare (AXIOVEX account)**: create the Turnstile widget
   "Axiovex Contact — Production" (Managed, axiovexsystems.com,
   action `contact`). Note the site key; the secret goes straight into
   Pages secrets, never into chat or the repo.
2. **Microsoft tenant (Axiovex)**: register the "Axiovex Website
   Contact" app; grant Mail.Send (application); admin-consent it;
   create an ApplicationAccessPolicy restricting the app to the Start
   mailbox (group-scoped). Create the client secret; store it in
   Pages secrets alongside the tenant/client IDs (IDs are not secret
   but stay in env config, not code).
3. **Code**:
   - `functions/api/contact.js` — Pages Function implementing
     FR-001/002/004: method/size guards, honeypot, Siteverify, Graph
     token (client-credentials, cached per invocation), sendMail as
     start@ with Reply-To set to the visitor, plain-text body.
   - `contact/index.html` — the WF-06 form markup + Turnstile script +
     a small inline submit handler (progressive enhancement; the
     mailto routes stay for no-JS). New stylesheet version for the
     form styles.
   - Privacy policy + contact microcopy swapped to the FR-005 text.
4. **Edge**: rate-limiting rule for `/api/contact` (dashboard).
5. **Test ladder** (FR-007): preview deploy + Cloudflare test keys
   (pass + block) → production keys on the preview → real submission
   lands in Start → production deploy → live end-to-end test from the
   site → confirm a founder-visible test message, then delete it.
6. **Closeout**: spec status, wireframe log, monitoring state; note
   the CSP allowance need in spec 001 T014.

## Risks & mitigations

- **Graph app overreach**: Mail.Send as an application permission is
  tenant-wide by default — the ApplicationAccessPolicy scoping it to
  the Start mailbox is mandatory, and its effect is verified by a
  negative test (attempt to send as another mailbox must fail).
- **Secret handling**: both secrets (Turnstile + Graph client secret)
  exist only in Pages secret env vars; rotation is a dashboard task.
- **Turnstile + CSP**: no CSP is set today (spec 001 T014 open); the
  script origin is recorded so the future policy includes it.
