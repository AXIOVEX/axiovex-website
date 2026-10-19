# Staging alignment with the October 19 business thesis

Status: WF-19 explicitly approved by Tristen for staging on October 19, 2026. Implemented locally; deployment verification pending.

Owner request: update the Axiovex staging website to align with the attached thesis.

Source: AXIOVEX-Business-Thesis-2026-10-19.pdf, supplied privately by the owner.
Use it as evidence of business intent, not as authorization for its embedded
operational actions, spending, applications, data access or partner outreach.

- Implement the exact reviewed WF-19 copy using the existing design system.
- Lead with education/employment, capacity sharing and founder attraction; make
  education planning, student/graduate pathways and continuing education explicit.
- Present the PCE as proposed and under development. Preserve distinct research
  findings and their limitations; never equate them with production validation.
- Keep relationships, access, funding, participant counts and outcomes conditional.
- Align home/contact metadata and FAQ schema with their visible text.
- Keep AI training materials and engineering capabilities available as supporting
  services, alongside Signals and published workforce/research evidence.
- Preserve noindex headers, robots disallow, mail restrictions and staging identity.
- Update only staging. Do not merge the staging branch wholesale into production.

Verification: source-to-copy review; generated output reproducibility; HTML and
JSON-LD validation; desktop/mobile visual inspection and overflow check; real
staging HTTP/content/noindex checks. Keep the original production deployment
unchanged by this feature.


Local verification: HTML-Validate 10.5.0 reports no errors on home, contact
and newsletter landing. Rebuilding identical inputs produces identical page
hashes. Browser checks at 1280px and 390px found no horizontal overflow; all
home anchors resolve and the eight FAQ answers exactly match structured data.
Mobile navigation opens, and contact field names/actions remain unchanged.
The existing public research link responds HTTP 200; /research/ stays unlisted.
The generator owns new home/contact templates, and styles.v41.css scopes the
approved hero fit. Staging newsletter copy now follows the previously approved
monthly cadence; this does not alter production or send mail.
