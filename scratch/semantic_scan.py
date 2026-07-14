import os
import re

js_files = [os.path.join(r, f) for r, d, files in os.walk('js') for f in files if f.endswith('.js')]

patterns = {
    'Missing paren for || 0 +': r'([a-zA-Z0-9_\.]+)\s*=\s*([a-zA-Z0-9_\.]+)\s*\|\|\s*0\s*\+',
    'Missing paren for || 0 *': r'([a-zA-Z0-9_\.]+)\s*\|\|\s*0\s*\*|/',
    'String concatenation instead of addition': r'[a-zA-Z0-9_\.]+\s*\+=\s*[\'"].*[\'"]',
    'Value property without check': r'\.value(?!\s*\?)\s*\|\|\s*0', 
}

for jf in js_files:
    with open(jf, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        for i, line in enumerate(lines):
            for name, p in patterns.items():
                if re.search(p, line):
                    print(f"{name} -> {jf}:{i+1}: {line.strip()}")
