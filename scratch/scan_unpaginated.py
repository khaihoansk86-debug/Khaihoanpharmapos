import os
import re

js_dir = r'd:\Khaihoanpharmapos\js'
# We look for .from(...) followed by .select(...) and NOT followed by .single(), .maybeSingle(), .limit(), or .range() on the same statement
pattern_from = re.compile(r'\.from\s*\([^)]*\)')

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
                        # Check if it's a delete or update that returns data (less common to need pagination, but possible)
                        # We primarily care about just .select()
                        if '.delete(' not in stmt and '.update(' not in stmt:
                            # Print a snippet
                            snippet = stmt.strip()[:200]
                            # Clean up newlines for printing
                            snippet = ' '.join(snippet.split())
                            print(f"{f}: {snippet}")
