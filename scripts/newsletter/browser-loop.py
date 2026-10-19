"""Real browser/function lifecycle against isolated data and captured test mail.
Cloudflare's official testing keys are used; production protections stay intact.
This is not a claim that an external mailbox received a real message.
"""
import json
import os
from pathlib import Path
import re
import subprocess
import time
import urllib.request
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:8767'
OUT = Path('ops-output/newsletter-browser')
OUT.mkdir(parents=True, exist_ok=True)
steps = []
def api(path, method='GET'):
    with urllib.request.urlopen(urllib.request.Request(BASE + path, method=method)) as r:
        return json.load(r)
def check(name, condition):
    steps.append({'name': name, 'pass': bool(condition)})
    if not condition:
        raise AssertionError(name)

server = subprocess.Popen(['node', 'scripts/newsletter/browser-test-server.mjs'], stdout=subprocess.PIPE, text=True)
try:
    for _ in range(50):
        try:
            api('/_test/status')
            break
        except Exception:
            time.sleep(.1)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, **({'channel': 'chrome'} if os.environ.get('LOCAL_CHROME') else {}))
        page = browser.new_page(viewport={'width': 390, 'height': 900})
        page.goto(BASE + '/signals/', wait_until='domcontentloaded')
        form = page.locator('[data-nl-block] form.nl-form').first
        form.locator('[name="email"]').fill('tristen.pierson@gmail.com')
        page.wait_for_function("""() => !!document.querySelector('input[name="cf-turnstile-response"]')?.value""", timeout=60000)
        page.wait_for_timeout(1600)  # Exercise the real reader timing gate.
        form.locator('[type="submit"]').click()
        page.get_by_text('Check your inbox', exact=False).first.wait_for(timeout=20000)
        check('browser signup creates pending row', api('/_test/status').get('status') == 'pending')
        check('pending probe receives no issue', api('/_test/probe-send', 'POST').get('sent') == 0)
        mail = api('/_test/mailbox')[-1]
        confirm = re.search(r'http://127\.0\.0\.1:8767/newsletter/confirm\?t=[a-f0-9]+', mail['text']).group()
        page.goto(confirm)
        check('confirmation link activates probe', api('/_test/status').get('status') == 'active')
        check('probe-only issue sends exactly once', api('/_test/probe-send', 'POST').get('sent') == 1)
        mail = api('/_test/mailbox')[-1]
        check('captured issue has HTML and postal footer', '<table' in mail['html'] and '6633 18 Mile Rd' in mail['text'])
        check('capture is restricted to the fixed staging probe', mail['to'] == 'tristen.pierson@gmail.com')
        unsub = mail['unsubscribeUrl']
        page.goto(unsub)
        check('delivered footer link unsubscribes', api('/_test/status').get('status') == 'unsubscribed')
        with urllib.request.urlopen(urllib.request.Request(unsub, data=b'List-Unsubscribe=One-Click', method='POST')) as r:
            check('RFC 8058 repeated POST succeeds', r.status == 200)
        check('unsubscribed probe is suppressed', api('/_test/probe-send', 'POST').get('sent') == 0)
        page.screenshot(path=str(OUT / 'unsubscribe-mobile.png'))
        check('no mobile horizontal overflow', page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'))
        browser.close()
finally:
    server.terminate()
    server.wait(timeout=10)
    (OUT / 'result.json').write_text(json.dumps({'environment': 'isolated CI browser fixture', 'delivery': 'captured test mail; external inbox not asserted', 'steps': steps}, indent=2))
print(f'{len(steps)} browser lifecycle checks passed')
