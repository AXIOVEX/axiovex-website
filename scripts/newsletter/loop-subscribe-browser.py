#!/usr/bin/env python3
# Spec 022 — browser leg for the newsletter loop test.
#
# Drives ONE real signup through the environment's /signals/
# page WF-G8 form (the interaction-triggered Turnstile arms on
# email-field focus, exactly as for a reader). Used for the
# production environment, whose Turnstile is the real Managed
# widget, and as the staging fallback if the API path is ever
# refused. A headless refusal by the Managed widget is an
# automation limit, not a site failure: it is reported as
# "blocked" with a screenshot, never as a pass.
#
# Run with the workspace Playwright venv:
#   ~/workspace/venvs/playwright/bin/python \
#     scripts/newsletter/loop-subscribe-browser.py \
#     --base https://axiovexsystems.com \
#     --email tristen@axiovexsystems.com --env-name production
#
# Prints one JSON object on stdout:
#   {"outcome": "submitted"|"blocked"|"failed", "detail": ...,
#    "screenshot": path}

import argparse
import json
import sys
import time

from playwright.sync_api import sync_playwright


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", required=True)
    ap.add_argument("--email", required=True)
    ap.add_argument("--env-name", required=True)
    args = ap.parse_args()

    shot = f"/tmp/loop-{args.env_name}-subscribe.png"
    result = {"outcome": "failed", "detail": "", "screenshot": shot}

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled"],
        )
        page = browser.new_page(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/140.0.0.0 Safari/537.36"
            )
        )
        try:
            page.goto(args.base.rstrip("/") + "/signals/",
                      wait_until="domcontentloaded", timeout=60000)
            form = page.locator("[data-nl-block] form.nl-form").first
            form.scroll_into_view_if_needed(timeout=15000)
            email = form.locator('input[name="email"]')
            email.click(timeout=15000)
            email.fill(args.email)

            # The widget renders on focus (interaction-triggered).
            # Wait for a Turnstile response token; a Managed
            # challenge that needs a human shows an interactive
            # iframe and never yields one.
            token = ""
            deadline = time.time() + 60
            while time.time() < deadline:
                token = page.evaluate(
                    """() => {
                      const el = document.querySelector(
                        'input[name="cf-turnstile-response"]');
                      return el ? el.value : '';
                    }"""
                )
                if token:
                    break
                time.sleep(1)

            if not token:
                challenge = page.locator(
                    'iframe[src*="challenges.cloudflare.com"]').count()
                page.screenshot(path=shot, full_page=False)
                if challenge:
                    result.update(
                        outcome="blocked",
                        detail=("Turnstile presented an interactive "
                                "challenge to the automated browser; "
                                "no token issued in 60s"),
                    )
                else:
                    result.update(
                        outcome="blocked",
                        detail=("Turnstile widget produced no token "
                                "in 60s (no challenge iframe found)"),
                    )
                print(json.dumps(result))
                return 0

            form.locator('[type="submit"]').click(timeout=15000)
            # Success is the WF-G8 pending state: "Check your
            # inbox" (in .nl-done or .nl-summary).
            try:
                page.wait_for_function(
                    """() => {
                      const t = document.body.innerText || '';
                      return t.includes('Check your inbox');
                    }""",
                    timeout=30000,
                )
                result.update(
                    outcome="submitted",
                    detail="form submitted; page shows 'Check your inbox'",
                )
            except Exception:
                page.screenshot(path=shot, full_page=False)
                summary = form.locator(".nl-summary").inner_text() \
                    if form.locator(".nl-summary").count() else ""
                result.update(
                    outcome="failed",
                    detail=f"no 'Check your inbox' state after submit; "
                           f"form summary: {summary!r}",
                )
            page.screenshot(path=shot, full_page=False)
        except Exception as exc:  # page/form level failure
            try:
                page.screenshot(path=shot, full_page=False)
            except Exception:
                pass
            result.update(outcome="failed", detail=f"{type(exc).__name__}: {exc}")
        finally:
            browser.close()

    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    sys.exit(main())
