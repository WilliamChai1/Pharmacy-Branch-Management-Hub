from playwright.sync_api import sync_playwright
import os

html_path = r"C:/Users/User/Documents/PMG MANAGEMENT HUB/index.html"

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={'width': 1366, 'height': 900})
    page = context.new_page()

    page.goto('file:///' + html_path)
    page.wait_for_timeout(1000)

    # Bypass auth
    page.evaluate('''() => {
        localStorage.setItem('pmg_session', JSON.stringify({
            userId: 'emp_william',
            displayName: 'William Chai',
            role: 'PIC',
            branchCode: 'KS01'
        }));
        if (typeof applyRoleUI === 'function') applyRoleUI(JSON.parse(localStorage.getItem('pmg_session')));
        const auth = document.getElementById('authOverlay');
        if (auth) auth.classList.add('hidden');
        const nav = document.getElementById('mainNav');
        if (nav) nav.classList.remove('hidden');
        const main = document.getElementById('mainContent');
        if (main) main.classList.remove('hidden');
        const footer = document.getElementById('mainFooter');
        if (footer) footer.classList.remove('hidden');
    }''')
    page.wait_for_timeout(400)

    # Open admin-utils
    page.click('#tab-admin-utils')
    page.wait_for_timeout(400)

    out_dir = r"C:/Users/User/Documents/PMG MANAGEMENT HUB/scratch"

    # Click SSJ Pharma preview
    page.click('#btn-prev-ssj')
    page.wait_for_timeout(400)
    page.screenshot(path=os.path.join(out_dir, 'test_ui_quote_ssj.png'))
    print('SSJ Pharma quote screenshot saved!')

    # Click AM PM Pharmacy preview
    page.click('#btn-prev-ampm')
    page.wait_for_timeout(400)
    page.screenshot(path=os.path.join(out_dir, 'test_ui_quote_ampm.png'))
    print('AM PM Pharmacy quote screenshot saved!')

    # Click Comparison Matrix preview
    page.click('#btn-prev-comparison')
    page.wait_for_timeout(400)
    page.screenshot(path=os.path.join(out_dir, 'test_ui_quote_comparison.png'))
    print('Comparison Matrix quote screenshot saved!')

    browser.close()
