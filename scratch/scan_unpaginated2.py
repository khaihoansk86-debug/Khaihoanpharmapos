import os
import re
import io

js_dir = r'd:\Khaihoanpharmapos\js'
pattern_from = re.compile(r'\.from\s*\([^)]*\)')

with io.open(r'scratch\scan_results.txt', 'w', encoding='utf-8') as outfile:
    for root, _, files in os.walk(js_dir):
        for f in files:
            if f.endswith('.js'):
                path = os.path.join(root, f)
                with open(path, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                statements = content.split(';')
                for stmt in statements:
                    if '.from' in stmt and '.select' in stmt:
                        if not any(x in stmt for x in ['.single(', '.maybeSingle(', '.limit(', '.range(', 'await Promise.all']):
                            if '.delete(' not in stmt and '.update(' not in stmt:
                                snippet = stmt.strip()[:200]
                                snippet = ' '.join(snippet.split())
                                outfile.write(f"{f}: {snippet}\n")
