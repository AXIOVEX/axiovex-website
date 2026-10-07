# Feature Specification: Blog Article — Website Hosting Costs (Cloudflare + GitHub vs AWS / Azure)

**Feature Branch**: implementation lands on `staging` per spec 010;
promotion is a separate owner-gated merge `staging` → `main`.

**Created**: 2026-10-07

**Status**: IN IMPLEMENTATION ON STAGING — owner review gate open.
Production promotion and both LinkedIn posts are blocked on
Tristen's review of the staging article (tasks.md T004).

**Direction (Tristen, 2026-10-07)**: write a blog article for
axiovexsystems.com on the verified finding that, for websites like
the ones Axiovex builds and runs, Cloudflare + GitHub is a good
combination as opposed to AWS / Azure and having to find hosts.
Highlight **costs**. End the article with an offer to help people —
especially startups — get their business started on the tech side:
a startup business support package focused on low cost and
excellent support. Then a LinkedIn post from Tristen's personal
account about it, and an Axiovex Systems LinkedIn share of the
personal post, hashtags where appropriate. Tristen reviews on
staging before anything migrates to production.

## Scope

- **FR-001 — One new blog article** (content only, existing blog
  article template/layout; **no UI/UX change, no wireframe change**):
  `blog/posts/2026-10-07-cloudflare-github-website-costs.md`,
  slug `cloudflare-github-website-costs`, rendered by
  `scripts/build-site.mjs` through the normal flow.
- **FR-002 — Cost claims are verified or labeled.** Platform figures
  come from vendor pricing/limits pages checked 2026-10-07
  (Cloudflare Pages limits/pricing, Azure Static Web Apps pricing,
  AWS WAF pricing) and from Axiovex's own records (domain cost).
  The 1 TB bandwidth comparison is presented as a modeled example,
  labeled as such, not as a bill anyone was charged.
- **FR-003 — Honest limits.** The article states where AWS / Azure
  *are* the right answer (real application backends, named-cloud
  compliance, committed enterprise spend, library-scale video), so
  the recommendation carries its boundary with it.
- **FR-004 — Closing offer, no invented package terms.** The article
  ends with the startup business support offer in the owner's own
  framing (low cost, excellent support; the tech foundation: domain,
  website, professional email, search/AI visibility, analytics, a
  person to call) and routes readers to the Start mailbox / contact
  page. **No package price, package name beyond the owner's framing,
  SLA, or included-hours figure is stated** — none is on record;
  inventing one would violate claims discipline (skill §2.4).
- **FR-005 — LinkedIn copy is drafted, not posted.** A personal post
  (Tristen's voice) and an Axiovex Systems company share of it, each
  with hashtags, are delivered with the staging link for review.
  Posting happens only after the article is promoted to production
  (the posts link the live article URL, in the first comment per the
  established pattern) and only under Tristen's direction for those
  items (skill §4).
- **FR-006 — Staging-first verification.** Article verified live on
  staging.axiovexsystems.com with rendered screenshots at desktop
  and mobile widths before review is requested; production is
  untouched until the owner gate passes.

## Claims (AEE)

- C-017-1: Cloudflare Pages free tier — unlimited bandwidth, 500
  builds/month — per Cloudflare's published limits/pricing,
  checked 2026-10-07. Status: substantiated (vendor source).
- C-017-2: Azure Static Web Apps Standard — $9/app/month, 100 GB
  bandwidth included, $0.20/GB overage — per Microsoft pricing,
  checked 2026-10-07. Status: substantiated (vendor source).
- C-017-3: axiovexsystems.com domain cost $10.46/year via Cloudflare
  Registrar — Axiovex's own purchase record (2026-09-29).
  Status: substantiated (internal record).
- C-017-4: This site (Axiovex) runs AEO 100/100 and Seobility 90% —
  fresh scans 2026-10-06. Status: substantiated (scan records).
- C-017-5: A startup support *price* — **not claimed anywhere**;
  FR-004 forbids it until the owner sets one.
