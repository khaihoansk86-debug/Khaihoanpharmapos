import os
import re

js_dir = r'd:\Khaihoanpharmapos\js'
pattern_window_async = re.compile(r'window\.\w+\s*=\s*async\s*(?:function)?\s*\([^)]*\)\s*=>?\s*{')

for root, _, files in os.walk(js_dir):
    for f in files:
        if f.endswith('.js'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
                
            # Basic check for UI handlers
            matches = list(pattern_window_async.finditer(content))
            for m in matches:
                start_idx = m.end()
                # Find the matching closing bracket
                bracket_count = 1
                idx = start_idx
                while idx < len(content) and bracket_count > 0:
                    if content[idx] == '{': bracket_count += 1
                    elif content[idx] == '}': bracket_count -= 1
                    idx += 1
                
                body = content[start_idx:idx]
                if 'catch' not in body:
                    print(f"Warning: {f} might be missing try/catch in UI async handler: {m.group(0)}")
