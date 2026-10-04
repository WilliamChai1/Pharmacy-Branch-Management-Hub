import base64
import os

assets_dir = r"C:\Users\User\Documents\PMG MANAGEMENT HUB\assets"
js_path = r"C:\Users\User\Documents\PMG MANAGEMENT HUB\js\admin-assets.js"

assets = {
    'pmg_heart_logo': ('pmg_heart_logo.png', 'image/png'),
    'pmg_cert_care': ('pmg_cert_care.png', 'image/png'),
    'pmg_awards_banner': ('pmg_awards_banner.jpg', 'image/jpeg'),
    'ssj_header': ('ssj_header.jpg', 'image/jpeg'),
    'ampm_header': ('ampm_header.jpg', 'image/jpeg'),
    'ssj_logo': ('ssj_logo.png', 'image/png'),
    'ampm_logo': ('ampm_logo.png', 'image/png'),
    'pmg_logo': ('pmg_logo.jpg', 'image/jpeg'),
}

lines = [
    '// js/admin-assets.js - Pre-encoded offline visual assets for Commercial & Administrative Utilities',
    'window.ADMIN_ASSETS = {'
]

for key, (fname, mime) in assets.items():
    p = os.path.join(assets_dir, fname)
    if os.path.exists(p):
        with open(p, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('utf-8')
            lines.append(f'  "{key}": "data:{mime};base64,{b64}",')
            print(f'Asset {key}: {len(b64)} chars')
    else:
        print(f'Missing: {p}')

lines.append('};')

with open(js_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines) + '\n')

print('Generated js/admin-assets.js successfully!')
