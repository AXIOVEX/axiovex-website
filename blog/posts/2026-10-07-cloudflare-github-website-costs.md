---
title: Your website doesn't need a cloud bill: what hosting actually costs
date: 2026-10-07
description: A business website on GitHub + Cloudflare costs $0 a month in hosting and about $10 a year for the domain. The same site on AWS or Azure can run into real money — mostly for power a website never uses. Here is the math, and an offer.
tags: startups, websites, cloudflare, costs, small business
slug: cloudflare-github-website-costs
---
When a new business asks us where their website should live, the assumption is usually that the answer is one of the big clouds — AWS or Azure — and that step one is finding a host. It is a reasonable assumption, and for most small business websites it is also an expensive one. There is a simpler combination — your site's files in a GitHub repository, delivered by Cloudflare — and for the kind of website most businesses actually have, it is better on the dimension that matters most at the start: cost.

We know, because it is how this website runs, and how we have built and run client websites since. Let us show the numbers.

## First, what kind of website are we talking about?

Most business websites are the same shape: pages that describe what you do, articles or reports you publish, a contact form, maybe a newsletter signup. They do not run an application. There is no server chewing on computation, no database cluster, nothing that needs to stay awake all night. Pages are written once and read many times.

AWS and Azure are built — brilliantly — for the other kind: applications, backends, private networks, compute that scales up and down. Putting a brochure-and-articles website on them is like leasing a delivery fleet to drive one van. You can do it. You will pay for the fleet.

## The cost comparison

These are the published figures, checked against each vendor's pricing and limits pages this week. Prices change; check them again before you budget. But the *shape* of the difference has been stable for years.

| What you pay for | GitHub + Cloudflare Pages | Azure Static Web Apps | AWS |
|---|---|---|---|
| Hosting the site itself | **$0** — free plan | $0 free tier, then **$9 per app, per month** | Assembled from parts; roughly $1–3/month for the storage-and-delivery basics |
| Bandwidth (people actually visiting) | **Unlimited, unmetered** | 100 GB/month included, then **$0.20 per GB** | Billed per GB, every GB |
| Your domain name | About **$10 a year** at cost through Cloudflare Registrar — this site's domain cost us **$10.46** | Same domain cost wherever you buy it | Same |
| SSL certificate (the padlock) | Free, automatic | Free | Free, but you wire it up yourself |
| Firewall / attack protection | Included | A separate, pricier tier (Azure Front Door starts around $35/month before usage) | AWS WAF alone is $5 per rule set plus $1 per rule plus a per-request charge — before you've hosted anything |
| Deploys | Push to GitHub; it's live, with a staging copy for review | Possible — through more machinery | Possible — through more machinery |

Run those numbers out. Say your site gets popular — a genuinely good problem — and serves a terabyte of pages in a month. On Cloudflare Pages, the hosting bill is still **$0**, because bandwidth on the free plan is unmetered. On Azure Static Web Apps' standard plan, a modeled terabyte works out to roughly **$189 that month** — $9 for the app plus about $180 of bandwidth overage. On AWS the same traffic is a stack of per-gigabyte line items across several services. The exact cents vary; the pattern doesn't: **the big clouds meter the one thing a successful website uses most, and Cloudflare, for static sites, doesn't.**

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

## Starting a business? We'll set this up with you.

If you're starting something, your technology foundation should cost you almost nothing to run and exactly nothing to worry about — so your money and attention go to the business itself. That's why we offer a **startup business support package** built on everything above: we get your domain, your website, and your professional email set up properly from day one, make sure Google and the AI answer engines can actually find you, set up your traffic reporting so you can see it's working — and then we stay in your corner as the person you call when something needs changing or stops making sense.

It's focused on two things, deliberately: **low cost** — because the underlying platforms genuinely cost this little when someone sets them up right, and we'll show you every figure — and **excellent support**, because a startup's real technology risk is never the platform. It's having nobody to call.

If that sounds like the start you want, write to us at [start@axiovexsystems.com](mailto:start@axiovexsystems.com) or use the [contact page](https://axiovexsystems.com/contact/). Tell us what you're building. The first conversation costs the same as the hosting: nothing.

— Tristen Pierson, President, Axiovex Systems
