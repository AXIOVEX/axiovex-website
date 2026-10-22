# Listening edition — Your website doesn't need a cloud bill: what hosting actually costs

Sister deliverable of the blog article of the same name
(slug: cloudflare-github-website-costs). Generated with
scripts/build-listening.mjs (spec 029): the narration script
below was drafted from the published article only, passed the
tool's number-fidelity gate against the article text, and was
then synthesized chapter by chapter.

Rules followed (spec 029, FR-001/FR-002): every number and
fact below is the article's own, as published on October 7,
2026 — the article's pricing disclaimer applies to this
edition too; numbers are written as spoken in the narration
and as digits in the key points; the article's tables are
summarized in speech (their key rows), never read cell by
cell; links are not read aloud.

- Voice: Brian (ElevenLabs)
- Chapters: 7 · Total runtime: 6:00 (360 seconds, measured per file)
- Audio: /assets/audio/cloudflare-github-website-costs/ch-01.mp3 … ch-07.mp3

## 01 · HEADLINE — The expensive assumption (0:46)

**Key points**

- The usual assumption: a business website belongs on AWS or Azure — reasonable, and expensive
- The alternative: site files in a GitHub repository, delivered by Cloudflare — $0 a month in hosting
- The domain costs about $10 a year; this site's cost $10.46

**Takeaway:** Every price in this edition is as published on October 7, 2026 — check the vendor's current page before you budget.

**Narration**

When a new business asks us where their website should live, the assumption is usually that the answer is one of the big clouds — AWS or Azure — and that step one is finding a host. It is a reasonable assumption, and for most small business websites it is also an expensive one. There is a simpler combination: your site's files in a GitHub repository, delivered by Cloudflare. It is how this website runs. The hosting costs zero dollars a month, and the domain costs about ten dollars a year — this site's cost ten point four six dollars. Let us show the numbers. Every price here is as published on October seventh, twenty twenty-six; vendors change prices, so treat these as an honest snapshot for comparing the shape of the offers.

## 02 · THE SHAPE — Most business websites are just pages (0:44)

**Key points**

- Most business websites: pages, articles, a contact form, maybe a newsletter signup — written once, read many times
- No server chewing on computation, no database cluster, nothing that needs to stay awake all night
- AWS and Azure are built, brilliantly, for the other kind: applications, backends, compute that scales

**Takeaway:** Putting a brochure-and-articles website on a big cloud is like leasing a delivery fleet to drive one van.

**Narration**

First, what kind of website are we talking about? Most business websites are the same shape: pages that describe what you do, articles or reports you publish, a contact form, maybe a newsletter signup. They do not run an application. There is no server chewing on computation, no database cluster, nothing that needs to stay awake all night. Pages are written once and read many times. AWS and Azure are built — brilliantly — for the other kind: applications, backends, private networks, compute that scales up and down. Putting a brochure-and-articles website on them is like leasing a delivery fleet to drive one van. You can do it. You will pay for the fleet.

## 03 · THE TABLE IN WORDS — The big clouds meter success (0:55)

**Key points**

- Azure Static Web Apps: $0 free tier, then $9 per app per month; 100 GB of bandwidth included, then $0.20 per GB
- AWS: roughly $1–3 a month for the basics, assembled from parts — and the firewall is separate: $5 per rule set plus $1 per rule
- A terabyte month, modeled: still $0 on Cloudflare Pages; roughly $189 on Azure — $9 for the app plus about $180 of bandwidth overage

**Takeaway:** The big clouds meter the one thing a successful website uses most: bandwidth.

**Narration**

The article compares every option in one table; here are the rows that matter, in words. Azure's static web apps: a free tier, then nine dollars per app, per month. One hundred gigabytes of bandwidth are included, then zero point two zero dollars per gigabyte after that. AWS is assembled from parts — roughly one to three dollars a month for the storage-and-delivery basics — and the firewall is a separate product: five dollars per rule set, plus one dollar per rule, before you have hosted anything. Now run a popular month through it: your site serves a terabyte of pages. On Cloudflare Pages the hosting bill is still zero dollars, because bandwidth on the free plan is unmetered. On Azure's standard plan, that modeled terabyte works out to roughly one hundred eighty-nine dollars that month — nine for the app, plus about one hundred eighty dollars of bandwidth overage.

## 04 · THE TRADITIONAL HOSTS — Rent forever, and the builder keeps your site (0:52)

**Key points**

- GoDaddy's builder: advertised around $9.99 a month, renewing around $12.99; a .com renews at roughly $19–23 a year
- A site built in GoDaddy's builder cannot be taken elsewhere as-is — leaving means rebuilding
- Namecheap is the fairest of the traditional hosts: $1.98 a month for the first year, renewing at $4.88, privacy protection included free — still rent, forever, for a mostly idle server

**Takeaway:** The GitHub-plus-Cloudflare combination is not a cheaper rental. It removes the rental.

**Narration**

The traditional hosts charge differently: rent, forever. GoDaddy's website builder is advertised around nine point nine nine dollars a month on an annual term, renewing around twelve point nine nine dollars — and a dot-com domain renews at roughly nineteen to twenty-three dollars a year, with privacy and protection add-ons as part of the business model. The honest catch: a site built in GoDaddy's builder cannot be taken elsewhere as-is. Leaving means rebuilding. Namecheap deserves the plain compliment: its shared hosting is one point nine eight dollars a month for the first year, renewing at four point eight eight dollars, and privacy protection is included free — the fairest renewal math in traditional hosting. But it is still a monthly rent, forever, for a server that mostly sits idle serving pages.

## 05 · BEYOND PAGES — Databases and video, same pattern (0:58)

**Key points**

- Databases: Cloudflare's D1 starts with a generous free allowance — 5 GB of storage; Azure Cosmos DB has a lifetime free tier (1,000 RU/s, 25 GB); the smallest always-on AWS RDS database runs about $12 a month
- Video: Cloudflare Stream is $5 per 1,000 minutes stored plus $1 per 1,000 minutes delivered, no bandwidth charges on top
- Azure retired its media services in 2024; AWS assembles video from three separately metered parts; GoDaddy and Namecheap have no streaming product at all

**Takeaway:** At every layer the pattern holds: bundled whole products, small versions tied to a rental, or separately metered parts.

**Narration**

What happens when your site grows past pages — a members area, a catalog, a course with video? Databases first. Cloudflare's D1 is a real SQL database with a generous free allowance — five gigabytes of storage on the free plan. Azure's Cosmos DB has a genuinely good lifetime free tier: one thousand requests per second of throughput and twenty-five gigabytes of storage. On AWS, the smallest always-on hosted database runs about twelve dollars a month before storage. Video: Cloudflare Stream bundles upload, encoding, player, and delivery at five dollars per one thousand minutes stored, plus one dollar per one thousand minutes delivered — with no bandwidth charges on top. Microsoft retired Azure Media Services in twenty twenty-four; AWS assembles video from three separately metered parts; GoDaddy and Namecheap offer no streaming product at all.

## 06 · THE BOUNDARY — Where the big clouds are the right answer (0:52)

**Key points**

- A real application backend — persistent servers, heavy databases, private networking — belongs on AWS or Azure
- A compliance regime, a contract that names a specific cloud, or committed cloud spend settles the question by itself
- This site, on the free combination: 100 out of 100 on AI-search readiness checks, 90% on independent SEO checks, $0 a month plus the $10.46-a-year domain

**Takeaway:** Host the project that crosses the line on the big cloud — and keep your website where websites belong.

**Narration**

To be precise about the boundary: a real application backend belongs on AWS or Azure — that is what they are for. A compliance regime, or a contract that names a specific cloud, settles the question by itself. Video at library scale will push you toward paid, purpose-built services on any platform. If your project crosses one of those lines, host that project there — and keep your website where websites belong. A website built this way is plain files in a repository; it is never trapped. This site is the working example: it currently scores one hundred out of one hundred on AI-search readiness checks and ninety percent on independent SEO checks. Total monthly hosting cost: zero dollars, plus that ten point four six dollar a year domain.

## 07 · THE OFFER — Take the toolkit, or take a hand (0:53)

**Key points**

- The method is packaged and published free, under an open-source license: website-forge, linked in the article
- It walks your own AI assistant through the same process: spec first, wireframes before pages, staging before live, verified by screenshots
- Starting a business? The startup support package sets up domain, website, and professional email properly from day one

**Takeaway:** The first conversation costs the same as the hosting: nothing.

**Narration**

Everything in this edition is a method, and methods should not be secrets. So we packaged ours and published it, free, under an open-source license: website-forge — the complete head start for building your website with your own AI assistant, linked in the article. It walks your AI through the same process this site was built with: write the spec before the code, draw the wireframes before the pages, build on a staging copy you review before anything goes live, and verify every change with real screenshots instead of hope. Use it to build your own site for the same zero dollars a month. And if you are starting a business and would rather have a person in your corner, that is the offer: we set up your domain, website, and professional email properly from day one, and stay in your corner afterward. The first conversation costs the same as the hosting: nothing.
