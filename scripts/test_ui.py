from playwright.sync_api import sync_playwright
import os

html_path = r"C:/Users/User/Documents/PMG MANAGEMENT HUB/index.html"

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={'width': 1366, 'height': 900})
    page = context.new_page()

    errors = []
    page.on('console', lambda msg: errors.append(f"CONSOLE {msg.type}: {msg.text}") if msg.type in ['error'] else None)
    page.on('pageerror', lambda err: errors.append(f"PAGEERROR: {err}"))

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

    page.wait_for_timeout(500)

    # Click tab-admin-utils
    page.click('#tab-admin-utils')
    page.wait_for_timeout(800)

    print('Errors after loading admin-utils:', errors)

    out_dir = r"C:/Users/User/Documents/PMG MANAGEMENT HUB/scratch"
    os.makedirs(out_dir, exist_ok=True)

    page.screenshot(path=os.path.join(out_dir, 'test_ui_quotation.png'))
    print('Quotation tab screenshot saved!')

    # Switch to Invoicing
    page.evaluate("() => window.pmgAdminUtils.switchSuiteSubTab('invoice')")
    page.wait_for_timeout(800)
    page.screenshot(path=os.path.join(out_dir, 'test_ui_invoice.png'))
    print('Invoice tab screenshot saved!')

    # Switch to Incident Report
    page.evaluate("() => window.pmgAdminUtils.switchSuiteSubTab('incident')")
    page.wait_for_timeout(800)
    page.screenshot(path=os.path.join(out_dir, 'test_ui_incident.png'))
    print('Incident tab screenshot saved!')

    browser.close()
    print('All tests completed successfully!')
