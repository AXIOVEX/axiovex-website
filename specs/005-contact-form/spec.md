# Feature Specification: Contact Form with Cloudflare Turnstile

**Feature Branch**: `005-contact-form`

**Created**: 2026-10-05

**Status**: Wireframes revised (WF-06) — **awaiting Tristen's approval**
(wireframe gate, constitution §III). No website, Cloudflare, or tenant
changes before approval. Second package of the owner's "do both —
Signals/Pulse first" direction; spec 004 shipped 2026-10-05.

**Audit basis (2026-10-05)**: the site and repo contain no HTML forms
and no Turnstile code; the AXIOVEX Cloudflare account has **zero**
Turnstile widgets. There is no incorrect widget to fix — this package
creates the first one, correctly.

## What this adds

A contact form on `/contact/` (WF-06 left column, primary route):
fields **Name**, **Email**, **Company (optional)**, **Topic** (New
project / Course & training / Question), **Message**; a Cloudflare
Turnstile challenge; and a Send button. Submissions are verified
server-side and delivered to the existing **Start mailbox**
(start@axiovexsystems.com). The email routes remain: start@ as the
form's fallback line, legal@ email-only. Replies still come from a
founder.

## Turnstile configuration (the correct widget)

- Widget name: **Axiovex Contact — Production**
- Mode: **Managed** (Cloudflare's recommended mode)
- Hostname: `axiovexsystems.com` only (www redirects to the apex)
- Action: `contact`
- Site key: public, embedded in the form
- Secret key: stored ONLY as a Cloudflare Pages secret — never in the
  repo, never in the browser
- Cloudflare's official test keys may be used on preview deploys;
  never in production

## Endpoint and delivery

- `functions/api/contact.js` — a Cloudflare Pages Function:
  1. Rejects non-POST and oversized payloads.
  2. Honeypot field must be empty; minimal timing check.
  3. Calls Cloudflare **Siteverify** with the secret; requires
     `success`, hostname `axiovexsystems.com`, action `contact`.
     Missing, expired (300s), replayed, or invalid tokens fail closed.
  4. On success, delivers via **Microsoft Graph sendMail as
     start@axiovexsystems.com**, so the message lands in the real
     Microsoft 365 mailbox with the visitor's address as Reply-To.
- Graph access: an Entra app registration ("Axiovex Website Contact")
  with the single application permission **Mail.Send**, plus an
  ApplicationAccessPolicy scoping it to the Start mailbox only. The
  client secret lives only in Pages secrets. Admin consent in the
  Axiovex tenant is a named task (may need Tristen's click).
- A Cloudflare rate-limiting rule on `/api/contact` caps abuse at the
  edge.

## Requirements *(mandatory)*

- **FR-001**: No submission is delivered without a passing Siteverify
  check. A client-side widget alone is not protection and is never
  shipped by itself.
- **FR-002**: Fail closed everywhere: verification errors, Graph
  errors, and rate limits all produce the inline error state, which
  offers the start@ email route. No silent drops, no fake success.
- **FR-003**: States (per WF-06): inline success confirmation (no
  redirect), inline per-field and summary errors, disabled/pending
  submit while sending. All fields labeled; keyboard and focus order
  correct; the Turnstile widget must not trap focus.
- **FR-004**: Data minimization: the endpoint stores nothing. The
  message exists only as the delivered email. No analytics, no
  cookies added by the form.
- **FR-005**: Privacy copy changes in the same release (exact text
  below — approval of this spec approves this copy):
  - *Privacy policy, "Information you provide"* — current text: "The
    Site has no accounts, forms, or newsletter sign-ups. The only
    personal information you share with us directly is what you choose
    to send when you email us — typically your name, email address,
    and the contents of your message."
    **Proposed:** "The Site has no accounts or newsletter sign-ups.
    You can share personal information with us directly in two ways:
    by emailing us, or through the contact form — in either case,
    typically your name, email address, and the contents of your
    message. The contact form is protected by Cloudflare Turnstile, a
    spam check run by Cloudflare. The form delivers your message to
    our mailbox, and we do not store form submissions anywhere else."
  - *Contact page microcopy* — the "no form, no tracking" line is
    replaced with the WF-06 form microcopy.
  - This also closes the open spec-001 R-1 review item insofar as the
    form is concerned: the policy will describe the form and the
    Turnstile check accurately.
- **FR-006**: The form page loads the Turnstile script from
  `challenges.cloudflare.com` only; when security headers land
  (spec 001 T014), the CSP must allow that origin for this page.
- **FR-007**: Test before production: full flow verified on a Pages
  preview deploy with Cloudflare test keys (always-pass and
  always-block), including a real delivery into the Start mailbox,
  before the production widget keys go live.

## Acceptance scenarios

1. **Given** a visitor submits with a valid Turnstile token, **When**
   the endpoint verifies it, **Then** exactly one email arrives in the
   Start mailbox with the visitor's Reply-To, and the visitor sees the
   inline success state.
2. **Given** a missing, expired, or replayed token, **When** the form
   is submitted, **Then** nothing is delivered and the inline error
   state offers the email route.
3. **Given** a bot fills the honeypot, **When** it submits, **Then**
   the request is discarded while appearing to succeed.
4. **Given** JavaScript is disabled, **When** a visitor opens
   /contact/, **Then** the email routes still work (progressive
   enhancement: the form notes that email is available).
