import os

with open('sw.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_content = content.replace("const CACHE_NAME = 'khai-hoan-pos-v26';", "const CACHE_NAME = 'khai-hoan-pos-v27';")

with open('sw.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated sw.js")
