import os
import re

html_ids = set()
for r, d, files in os.walk('pages'):
    for f in files:
        if f.endswith('.html'):
            with open(os.path.join(r, f), 'r', encoding='utf-8') as file:
                html_ids.update(re.findall(r'id="([^"]+)"', file.read()))

# Also read from layout.js
with open('js/components/layout.js', 'r', encoding='utf-8') as f:
    html_ids.update(re.findall(r'id="([^"]+)"', f.read()))

js_files = [os.path.join(r, f) for r, d, files in os.walk('js') for f in files if f.endswith('.js')]

missing = []
for jf in js_files:
    with open(jf, 'r', encoding='utf-8') as f:
        content = f.read()
        get_ids = re.findall(r"getElementById\(['\"]([^'\"]+)['\"]\)", content)
        query_ids = re.findall(r"querySelector\(['\"]#([^'\"]+)['\"]\)", content)
        
        for i in get_ids + query_ids:
            # ignore template literals in string
            if '$' in i: continue
            if i not in html_ids:
                missing.append(f"{jf} -> missing ID in HTML: {i}")

for m in set(missing):
    print(m)
print(f"Total missing IDs referenced in JS: {len(set(missing))}")
