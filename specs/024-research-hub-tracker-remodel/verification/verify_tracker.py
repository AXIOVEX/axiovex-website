"""Spec 024 T006 — local visual + interaction verification of /research/.

Serves the staging worktree locally (localhost bypasses the sandbox proxy),
screenshots the page at desktop 1440 and mobile 390 (full page), exercises
the verdict-board filter chips, and asserts the structural invariants:
exactly 1 newsletter form, meta robots noindex, 20 board cards, 2 prediction
cards, 20 release rows.
"""
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

OUT = pathlib.Path(__file__).parent
BASE = "http://127.0.0.1:8901/research/"

results = {}

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    for name, width, height in (("desktop", 1440, 900), ("mobile", 390, 844)):
        page = browser.new_page(viewport={"width": width, "height": height})
        page.goto(BASE, wait_until="networkidle")
        # scroll through the page so any reveal-on-scroll content settles
        page.evaluate(
            """async () => {
              const step = Math.floor(innerHeight * 0.8);
              for (let y = 0; y < document.body.scrollHeight; y += step) {
                scrollTo(0, y); await new Promise(r => setTimeout(r, 60));
              }
              scrollTo(0, 0);
            }"""
        )
        page.wait_for_timeout(400)
        page.screenshot(path=str(OUT / f"research-{name}.png"), full_page=True)
        if name == "desktop":
            results["forms"] = page.locator("form").count()
            results["noindex"] = page.locator('meta[name="robots"][content="noindex"]').count()
            results["cards_total"] = page.locator("#board-grid .study-card").count()
            results["pred_cards"] = page.locator("#pred-grid .pred-card").count()
            results["rel_rows"] = page.locator("#rel-list .rel-row").count()
            results["chips"] = page.locator("#board-chips .chip").all_inner_texts()
            # chip tests: click each verdict chip, count visible cards
            counts = {}
            for key in ("confirmed", "rejected", "noeffect", "inconclusive", "running", "offscale"):
                page.locator(f'#board-chips .chip[data-filter="{key}"]').click()
                page.wait_for_timeout(150)
                counts[key] = page.locator("#board-grid .study-card:not([hidden])").count()
            results["chip_counts"] = counts
            page.locator('#board-chips .chip[data-filter="rejected"]').click()
            page.wait_for_timeout(150)
            page.locator("#board-grid").screenshot(path=str(OUT / "research-board-filtered-rejected.png"))
            page.locator('#board-chips .chip[data-filter="all"]').click()
        page.close()
    browser.close()

print(json.dumps(results, indent=2))
assert results["forms"] == 1, "form count != 1"
assert results["noindex"] == 1, "noindex meta missing"
assert results["cards_total"] == 20, "board cards != 20"
assert results["pred_cards"] == 2, "prediction cards != 2"
assert results["rel_rows"] == 20, "release rows != 20"
assert results["chip_counts"] == {
    "confirmed": 7, "rejected": 7, "noeffect": 3,
    "inconclusive": 1, "running": 1, "offscale": 2,
}, f"chip counts wrong: {results['chip_counts']}"
print("ALL ASSERTIONS PASSED")
