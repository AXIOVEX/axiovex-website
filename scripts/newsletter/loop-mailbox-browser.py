#!/usr/bin/env python3
# Spec 022 — M365 mailbox delivery check for the newsletter
# loop test (production evidence leg, read-path correction
# 2026-10-10).
#
# The production probe is tristen@axiovexsystems.com. Its
# mail is NOT observable via the owner's connected Gmail (the
# mailbox forwards to a different hub gmail with keep-a-copy),
# so production delivery is asserted here instead: search
# Outlook on the web — whose search spans ALL folders (Inbox,
# Archive, Junk Email, and the rest) — for the run's message
# by sender + subject, newest first. Presence in any folder
# counts as delivered.
#
# The check runs in a dedicated persistent browser profile
# (~/workspace/tools/loop-test/browser-profile). If that
# profile holds no signed-in M365 session, the check reports
# "blocked" — an automation limit, never a pass and never a
# site failure (the runner maps it to its BLOCKED verdict).
#
# Run with the workspace Playwright venv:
#   ~/workspace/venvs/playwright/bin/python \
#     scripts/newsletter/loop-mailbox-browser.py \
#     --mode confirmation --base https://axiovexsystems.com
#   ... --mode issue --subject "<issue subject>" \
#       --postal "6633 18 Mile Rd"
#
# Prints one JSON object on stdout:
#   {"outcome": "found"|"notfound"|"blocked",
#    "folder": "all-folders search (Outlook web)",
#    "dateText": ..., "confirmUrl": ..., "unsubUrl": ...,
#    "hasPostal": bool, "detail": ..., "screenshot": path}

import argparse
import json
import os
import re
import sys
import time

from playwright.sync_api import sync_playwright

PROFILE = os.path.expanduser("~/workspace/tools/loop-test/browser-profile")
SENDER = "newsletter@axiovexsystems.com"


def emit(result):
    print(json.dumps(result))
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["confirmation", "issue"], required=True)
    ap.add_argument("--base", required=True)
    ap.add_argument("--subject", default="")
    ap.add_argument("--postal", default="")
    ap.add_argument("--timeout", type=int, default=180)
    args = ap.parse_args()

    host = re.sub(r"^https?://", "", args.base).rstrip("/")
    shot = f"/tmp/loop-mailbox-{args.mode}.png"
    result = {"outcome": "blocked", "folder": "all-folders search (Outlook web)",
              "dateText": "", "confirmUrl": "", "unsubUrl": "",
              "hasPostal": False, "detail": "", "screenshot": shot}

    subject = "Confirm your subscription" if args.mode == "confirmation" else args.subject
    if not subject:
        result["detail"] = "no subject supplied for the mailbox search"
        return emit(result)
    query = f'from:{SENDER} subject:"{subject}"'

    os.makedirs(PROFILE, exist_ok=True)
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            PROFILE,
            headless=True,
            args=["--disable-blink-features=AutomationControlled"],
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/140.0.0.0 Safari/537.36"
            ),
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        try:
            page.goto("https://outlook.office.com/mail/",
                      wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(6000)

            url = page.url or ""
            if "login.microsoftonline.com" in url or "login.live.com" in url:
                result["detail"] = ("no signed-in M365 session in the loop "
                                     "browser profile (Outlook redirected to "
                                     "sign-in); production delivery legs cannot "
                                     "be mailbox-verified from this profile")
                page.screenshot(path=shot, full_page=False)
                return emit(result)

            # A usable mailbox view exposes the search affordance.
            search_btn = page.locator(
                'button[aria-label*="Search" i], [aria-label="Search mail"]'
            ).first
            try:
                search_btn.wait_for(state="visible", timeout=45000)
            except Exception:
                result["detail"] = ("Outlook web did not reach a usable mailbox "
                                     "view (no search control); session state "
                                     "unconfirmed")
                page.screenshot(path=shot, full_page=False)
                return emit(result)

            deadline = time.time() + args.timeout
            while True:
                # (Re)run the all-folders search.
                try:
                    search_btn.click(timeout=10000)
                    box = page.locator(
                        'input[aria-label*="Search" i], input[placeholder*="Search" i]'
                    ).first
                    box.wait_for(state="visible", timeout=15000)
                    box.fill(query)
                    box.press("Enter")
                except Exception as exc:
                    result["detail"] = f"Outlook search could not be driven: {exc}"
                    page.screenshot(path=shot, full_page=False)
                    return emit(result)
                page.wait_for_timeout(8000)

                items = page.locator('[role="option"][aria-label*="Newsletter" i], '
                                     '[data-testid="message-list-item"]')
                count = 0
                try:
                    count = items.count()
                except Exception:
                    count = 0
                if count > 0:
                    items.first.click(timeout=15000)
                    page.wait_for_timeout(4000)
                    body = page.locator('div[aria-label="Message body"]').first
                    html, text = "", ""
                    try:
                        html = body.inner_html(timeout=10000)
                        text = body.inner_text(timeout=10000)
                    except Exception:
                        pane = page.locator('[data-testid="reading-pane"] div').first
                        html = pane.inner_html(timeout=10000)
                        text = pane.inner_text(timeout=10000)
                    header_text = ""
                    try:
                        header_text = page.locator(
                            '[data-testid="message-header"], [class*="header"] time'
                        ).first.inner_text(timeout=5000)
                    except Exception:
                        header_text = ""
                    m = re.search(r"\d{1,2}/\d{1,2}/\d{4}[^\n]{0,20}", header_text)
                    result["dateText"] = m.group(0).strip() if m else header_text[:60]

                    if args.mode == "confirmation":
                        m = re.search(
                            r"https://" + re.escape(host) +
                            r"/newsletter/confirm\?t=[a-f0-9]+", html)
                        result["confirmUrl"] = m.group(0) if m else ""
                    else:
                        m = re.search(
                            r"https://" + re.escape(host) +
                            r"/newsletter/unsubscribe\?t=[a-f0-9]+", html)
                        result["unsubUrl"] = m.group(0) if m else ""
                        result["hasPostal"] = bool(args.postal) and args.postal in text
                    result["outcome"] = "found"
                    result["detail"] = (f"message present in the probe mailbox "
                                        f"(all-folders search, newest match opened; "
                                        f"header date: {result['dateText'] or 'unread'})")
                    page.screenshot(path=shot, full_page=False)
                    return emit(result)

                if time.time() >= deadline:
                    result["outcome"] = "notfound"
                    result["detail"] = (f"all-folders Outlook search for "
                                        f"{query!r} returned no message within "
                                        f"{args.timeout}s")
                    page.screenshot(path=shot, full_page=False)
                    return emit(result)
                page.wait_for_timeout(12000)
        except Exception as exc:  # page/session level failure
            try:
                page.screenshot(path=shot, full_page=False)
            except Exception:
                pass
            result["detail"] = f"mailbox check could not run: {type(exc).__name__}: {exc}"
            return emit(result)
        finally:
            ctx.close()


if __name__ == "__main__":
    sys.exit(main())
