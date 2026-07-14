import os
import re

html_files = [os.path.join(r, f) for r, d, files in os.walk('pages') for f in files if f.endswith('.html')]
js_files = [os.path.join(r, f) for r, d, files in os.walk('js') for f in files if f.endswith('.js')]

js_functions = set()
for jf in js_files:
    with open(jf, 'r', encoding='utf-8') as f:
        content = f.read()
        # find window.funcName = or function funcName(
        funcs1 = re.findall(r'window\.([a-zA-Z0-9_]+)\s*=', content)
        funcs2 = re.findall(r'function\s+([a-zA-Z0-9_]+)\s*\(', content)
        funcs3 = re.findall(r'const\s+([a-zA-Z0-9_]+)\s*=\s*\(.*?\)\s*=>', content)
        funcs4 = re.findall(r'const\s+([a-zA-Z0-9_]+)\s*=\s*async\s*\(.*?\)\s*=>', content)
        js_functions.update(funcs1)
        js_functions.update(funcs2)
        js_functions.update(funcs3)
        js_functions.update(funcs4)

# add common built-ins
js_functions.update(['alert', 'console.log', 'setTimeout', 'clearTimeout', 'history.back', 'location.reload'])

missing = []
for hf in html_files:
    with open(hf, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        for i, line in enumerate(lines):
            # match onclick="funcName(...)" or onchange="window.funcName(...)"
            matches = re.findall(r'on[a-z]+="([^"]+)"', line)
            for m in matches:
                # extract function name before (
                # this regex is basic but works for funcName(...) or window.funcName(...)
                call_match = re.search(r'(?:window\.)?([a-zA-Z0-9_]+)\s*\(', m)
                if call_match:
                    func_name = call_match.group(1)
                    if func_name not in js_functions:
                        missing.append(f"{hf}:{i+1} -> calls undefined function: {func_name}()")

for m in missing:
    print(m)
print(f"Total missing bindings: {len(missing)}")

