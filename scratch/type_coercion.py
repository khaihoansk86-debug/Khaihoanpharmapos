import os
import re

js_files = [os.path.join(r, f) for r, d, files in os.walk('js') for f in files if f.endswith('.js')]

for jf in js_files:
    with open(jf, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        for i, line in enumerate(lines):
            # check for .value + or += .value without parseInt/Number
            # this regex is crude but might catch obvious ones
            if re.search(r'\.value\s*\+', line) or re.search(r'\+=\s*.*\.value\b', line):
                # ignore if it's inside string interpolation
                if '$' in line and '{' in line: continue
                # ignore if wrapped in Number() or parseFloat()
                if 'Number(' in line or 'parseFloat(' in line or 'parseInt(' in line: continue
                # ignore if it's string concatenation building HTML
                if '<' in line or '="' in line: continue
                
                print(f"Potential Type Coercion -> {jf}:{i+1}: {line.strip()}")
