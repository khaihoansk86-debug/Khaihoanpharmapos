with open('scratch/test_analytics.cjs', 'r', encoding='utf-8') as f:
    text = f.read()
text = text.replace('console.log("Done building analytics!");', 'console.log("doseItemsSold:", analytics.summary.doseItemsSold);')
with open('scratch/test_analytics_patched.cjs', 'w', encoding='utf-8') as f:
    f.write(text)
