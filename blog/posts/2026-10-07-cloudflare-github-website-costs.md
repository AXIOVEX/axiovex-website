---
title: Your website doesn't need a cloud bill: what hosting actually costs
date: 2026-10-07
description: A business website on GitHub + Cloudflare costs $0 a month in hosting and about $10 a year for the domain. Compared line by line with AWS, Azure, GoDaddy, and Namecheap — plus what databases and video streaming cost on each — here is the math, and an offer.
tags: startups, websites, cloudflare, costs, small business
slug: cloudflare-github-website-costs
---
When a new business asks us where their website should live, the assumption is usually that the answer is one of the big clouds — AWS or Azure — and that step one is finding a host. It is a reasonable assumption, and for most small business websites it is also an expensive one. There is a simpler combination — your site's files in a GitHub repository, delivered by Cloudflare — and for the kind of website most businesses actually have, it is better on the dimension that matters most at the start: cost.

We know, because it is how this website runs, and how we have built and run client websites since. Let us show the numbers.

## First, what kind of website are we talking about?

Most business websites are the same shape: pages that describe what you do, articles or reports you publish, a contact form, maybe a newsletter signup. They do not run an application. There is no server chewing on computation, no database cluster, nothing that needs to stay awake all night. Pages are written once and read many times.

AWS and Azure are built — brilliantly — for the other kind: applications, backends, private networks, compute that scales up and down. Putting a brochure-and-articles website on them is like leasing a delivery fleet to drive one van. You can do it. You will pay for the fleet.

## The cost comparison — every option, one table

These are the published figures for the most popular ways to put a small business website online, checked against each vendor's pricing and limits pages. One table, every option we seriously considered — including the two names most people start with.

> **Pricing disclaimer:** every price in this article is as published on **October 7, 2026, this article's publication date**. Vendors change prices, introductory offers expire into higher renewals, and regional pricing varies. Treat these figures as an honest snapshot for comparing the *shape* of the offers — and check the vendor's current pricing page before you budget. Where a number is our arithmetic rather than a vendor's list price (the terabyte example), it is labeled **modeled**.

| Option | What the site costs | Domain name | Bandwidth (visitors) | Firewall / protection | The honest catch |
|---|---|---|---|---|---|
| **GitHub + Cloudflare Pages** *(what we use)* | **$0/month** — free plan, no card required | About **$10/year** at cost through Cloudflare Registrar — this site's cost us **$10.46** | **Unlimited, unmetered** | Included (network firewall + DDoS protection) | For static sites and light edge functions. If you need a traditional always-on server, this isn't one — see the boundary section below |
| **Microsoft Azure** (Static Web Apps) | $0 free tier, then **$9 per app, per month** | Same domain cost wherever you buy it | 100 GB/month included, then **$0.20 per GB** | Basic included; full web application firewall is a separate, pricier tier (Azure Front Door, from about $35/month before usage) | The bandwidth meter: a popular month costs real money (modeled below) |
| **Amazon AWS** (S3 + CloudFront + friends) | Assembled from parts; roughly **$1–3/month** for the storage-and-delivery basics | Same domain cost wherever you buy it | Billed per GB, every GB, on more than one service | **AWS WAF is separate:** $5 per rule set + $1 per rule + a per-request charge — before you've hosted anything | There is no single "website" product: you assemble and wire up storage, delivery, certificates, DNS, and a build pipeline yourself |
| **GoDaddy** (Websites + Marketing builder / managed WordPress) | Builder Basic advertised around **$9.99/month** on an annual term, renewing around **$12.99/month**; managed WordPress $6.99/month first year, renewing at **$14.99/month** | A .com renews at roughly **$19–23/year**; privacy and protection add-ons are part of the business model | Included in the plan | Included in the plan | A site built in GoDaddy's builder **cannot be taken elsewhere as-is** — leaving means rebuilding. Introductory prices renew higher, and the checkout offers add-ons |
| **Namecheap** (Stellar shared hosting / EasyWP) | Stellar shared hosting **$1.98/month for the first year**, renewing at **$4.88/month**; EasyWP managed WordPress $3.88/month | A .com runs about **$10–14/year**, and WhoisGuard privacy protection is **included free** | Included ("unmetered" — on a server shared with other customers) | Included in the plan | The fairest renewal math in traditional hosting — and still a traditional shared server: WordPress updates, the database, and security are yours to maintain |

Run the popular-month example through the table. Say your site serves a terabyte of pages in a month — a genuinely good problem. On Cloudflare Pages the hosting bill is still **$0**, because bandwidth on the free plan is unmetered. On Azure's standard plan, a **modeled** terabyte works out to roughly **$189 that month** — $9 for the app plus about $180 of bandwidth overage. On AWS the same traffic is a stack of per-gigabyte line items across several services. On GoDaddy or Namecheap the month is simply your renewal rate — no meter, but a rent that never stops and, in the builder's case, a site you don't fully own. The exact cents vary; the pattern doesn't: **the big clouds meter the one thing a successful website uses most, the traditional hosts charge rent forever, and for static sites Cloudflare, uniquely, does neither.**

Namecheap deserves the plain compliment: if you want traditional hosting, its prices and free privacy protection are the most honest in that business. But notice what both traditional rows are — a monthly rent, forever, for a server that mostly sits idle serving pages. The GitHub + Cloudflare combination isn't a cheaper rental. It removes the rental.

And the meter is not the only cost. The assembled-cloud route means *operating* a host: a storage service, a delivery service, a certificate service, a DNS service, a build pipeline, a firewall — each with its own console, its own settings, and its own way of quietly billing you. Someone has to set that up, and someone has to remember how it works a year later when something breaks at 9 p.m. That someone is usually you, or a consultant you're paying by the hour. The combination we use has exactly two places to look: the GitHub repository, which holds the site, and one Cloudflare account, which holds the domain, the delivery, the security, and the traffic reports.

## When pages aren't enough: databases and video

Fair question: what happens when your site grows past pages — a members area, a product catalog, a course with video? Every stack above has an answer. They differ the same way the hosting does: one bundled product with simple pricing, or parts you assemble and meter separately.

**Databases**

| Stack | Your database option | What it costs to start |
|---|---|---|
| GitHub + Cloudflare | **D1**, a real SQL database at the edge, plus KV for simple key-value data and R2 for files | A generous **free allowance** (5 GB of database storage on the free plan); the $5/month Workers plan bundles far more |
| Azure | **Cosmos DB** (NoSQL) or **Azure SQL** (relational) | A genuinely good **lifetime free tier** on Cosmos DB (1,000 RU/s of throughput and 25 GB of storage per account); Azure SQL's Basic tier is about **$5/month** |
| AWS | **DynamoDB** (NoSQL) or **RDS** (a real hosted MySQL/PostgreSQL server) | DynamoDB charges per request — pennies at small scale, with 25 GB of storage in the free tier; the smallest always-on RDS database runs about **$12+/month** before storage |
| GoDaddy | **MySQL included with your hosting plan** — it's the database WordPress itself uses | Included, but sized and limited by your hosting plan; it is a hosting feature, not a database product you can build an application on |
| Namecheap | **MySQL / PostgreSQL included via cPanel** on shared plans | Included, same caveat: it belongs to the hosting account, scaled to a shared server |

**Video streaming**

| Stack | Your video option | What it costs to start |
|---|---|---|
| GitHub + Cloudflare | **Cloudflare Stream** — upload, encoding, player, and delivery in one product | **$5 per 1,000 minutes stored + $1 per 1,000 minutes delivered**; encoding is free and there are no bandwidth (egress) charges on top |
| Azure | **None, first-party** — Microsoft retired Azure Media Services in 2024 | You assemble storage + delivery yourself (Blob Storage + Front Door) or buy a third-party streaming service on top |
| AWS | Assemble it: **S3** stores the files, **MediaConvert** encodes them (per minute of output), **CloudFront** delivers them (per GB) | Each part meters separately — workable, and exactly the multi-line-item pattern from the hosting table |
| GoDaddy | **No streaming product** — builder pages embed YouTube or Vimeo | Free to embed, on the video platform's player, branding, and rules |
| Namecheap | **No streaming product** — embeds, or video files served from your shared hosting | Fine for a clip or two; shared storage and a shared server are not a streaming platform |

The pattern holds at every layer: the popular names either don't offer the piece at all, include a small version tied to a server rental, or offer it as separately metered parts. Cloudflare's lineup — hosting, database, file storage, and video — is priced in whole products, and the first tier of almost every one is free.

And the meter is not the only cost. The AWS/Azure route means *assembling* a host: a storage service for the files, a content-delivery service in front of it, a certificate service, a DNS service, a build pipeline, a firewall — each with its own console, its own settings, and its own way of quietly billing you. Someone has to set that up, and someone has to remember how it works a year later when something breaks at 9 p.m. That someone is usually you, or a consultant you're paying by the hour. The combination we use has exactly two places to look: the GitHub repository, which holds the site, and one Cloudflare account, which holds the domain, the delivery, the security, and the traffic reports.

## Where the big clouds are the right answer

We want to be precise about the boundary, because a recommendation that doesn't state its limits isn't worth much:

- **A real application backend** — persistent servers, heavy databases, private networking into a company's internal systems — belongs on AWS or Azure. That's what they're for.
- **A compliance regime or a contract that names a specific cloud**, or an organization with committed cloud spend, settles the question by itself.
- **Video at library scale, or complex server-rendered applications**, will push you toward paid, purpose-built services on any platform.

If your project crosses one of those lines, host *that project* there — and keep your website where websites belong. A website built this way is plain files in a repository; it is never trapped.

## What this looks like in practice

This site is the working example. Its files live in GitHub; Cloudflare delivers them from its edge network — the same network that carries a large share of the web. Changes are reviewed on a staging copy before they go live, promotion is a merge, and the traffic, search, and AI-visibility reports arrive on a schedule: the site currently scores 100 out of 100 on AI-search readiness checks and 90% on independent SEO checks. Total monthly hosting cost: zero dollars, plus that $10.46-a-year domain. We run client sites the same way, on the same pattern — including a two-site rebuild we recently completed with professional email, a newsletter list, and weekly health reporting on top.

None of that required finding a host. There is no host. There is a repository and a delivery network, and between them, nothing to patch, reboot, or get billed for at 3 a.m.

## Want to do it yourself? Take the toolkit — it's free.

Everything in this article is a method, and methods shouldn't be secrets. So we packaged ours and published it, free, under an open-source license: **[website-forge](https://github.com/AXIOVEX/website-forge)** — the complete head start for building your website *with your own AI assistant*.

Hand it to Claude Code, Cursor, or ChatGPT and it walks your AI through the same process this site was built with: write the spec before the code, draw the wireframes before the pages, build on a staging copy you review before anything goes live, hold search and AI-answer visibility near perfect with a weekly check, and verify every change with real screenshots instead of hope. It includes the skill file that teaches the AI the method, an MCP server that audits any website and generates the robots/sitemap/llms files for it, ready-to-copy templates, checklists, and the verified cost comparison this article is based on.

Use it to build your own site for the same $0 a month. And if, somewhere in the middle, you decide you'd rather have a person in your corner — that's the offer in the next section.

## Starting a business? We'll set this up with you.

If you're starting something, your technology foundation should cost you almost nothing to run and exactly nothing to worry about — so your money and attention go to the business itself. That's why we offer a **startup business support package** built on everything above: we get your domain, your website, and your professional email set up properly from day one, make sure Google and the AI answer engines can actually find you, set up your traffic reporting so you can see it's working — and then we stay in your corner as the person you call when something needs changing or stops making sense.

It's focused on two things, deliberately: **low cost** — because the underlying platforms genuinely cost this little when someone sets them up right, and we'll show you every figure — and **excellent support**, because a startup's real technology risk is never the platform. It's having nobody to call.

If that sounds like the start you want, write to us at [start@axiovexsystems.com](mailto:start@axiovexsystems.com) or use the [contact page](https://axiovexsystems.com/contact/). Tell us what you're building. The first conversation costs the same as the hosting: nothing.

— Tristen Pierson, President, Axiovex Systems
