import os
import re

for root, _, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '.gemini' in root: continue
    for f in files:
        if f.endswith('.html') or f.endswith('.js'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # check if it contains ?v=20260709
            if '?v=20260709' in content:
                new_content = re.sub(r'\?v=20260709[a-z0-9]*', '?v=20260712a', content)
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                print(f"Updated {path}")
