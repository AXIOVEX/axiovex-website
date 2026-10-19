# CI publication identity — October 19, 2026

The owner approved normal CI updates to main, retaining owner-only publication
on other branches and owner-only main creation, deletion and force-pushes.
GitHub rejected its built-in Actions integration as a ruleset bypass actor
because it is not owned by AXIOVEX. The attempted duplicate protection rule
was removed; the original restriction was preserved throughout setup.

The owner then approved a private AXIOVEX-owned Website CI Publisher app,
installed only on axiovex-website, with contents read/write and metadata read.
It has no workflow, Actions-administration, secret or organization permission.
Its private key is stored only in AXIOVEX_PUBLISH_PRIVATE_KEY Actions secret;
AXIOVEX_PUBLISH_APP_ID and AXIOVEX_PUBLISH_BOT_LOGIN are repository variables.
The one-time manifest callback runs locally only during setup. No local service
is needed for production jobs.

Six trusted CI writers mint a repository-limited, short-lived installation token
with GitHub's official create-github-app-token action. GITHUB_TOKEN remains
read-only for contents. The app is an exception only for normal main updates;
all other branch restrictions remain owner-only. Owner-only main creation,
deletion and non-fast-forward protections are separate rules.

App-generated data pushes do not recursively start document regeneration or
expensive health reports; those writers already build their generated output.
Normal schedules and human code pushes retain their checks. Cloudflare still
receives actual content pushes and deploys them.

Verification must include a real generated-content main push by the app and a
successful Cloudflare deployment, plus effective main/other-branch rule reads.
A no-change source check alone does not prove publication access.
