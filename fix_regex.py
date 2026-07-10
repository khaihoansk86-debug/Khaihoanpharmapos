import os
import re

file1 = r'd:\Khaihoanpharmapos\js\features\reports\reportAnalyticsRules.js'
with open(file1, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r"movement\.reason === 'c.*?t li.*?u thu.*?c'", "movement.reason === 'cắt liều thuốc'", content)
with open(file1, 'w', encoding='utf-8') as f:
    f.write(content)

file2 = r'd:\Khaihoanpharmapos\tests\orderLifecycleIntegration.test.js'
with open(file2, 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r"name: 'Ch.*?ch thu.*?c kh.*?e'", "name: 'Chích thuốc khỏe'", content)
content = re.sub(r"product_name: 'Ch.*?ch thu.*?c kh.*?e'", "product_name: 'Chích thuốc khỏe'", content)
content = re.sub(r"unit_name: '.*?ng'", "unit_name: 'ống'", content)
content = re.sub(r"unit: '.*?ng'", "unit: 'ống'", content)
with open(file2, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
