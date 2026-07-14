with open('js/features/reports/reportController.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = "function renderNetProfit(analytics) {\n    const section = document.getElementById('netProfitSection');\n    if (!section) return;\n\n    if (currentOrderType !== 'all') {\n        section.classList.add('hidden');\n        return;\n    }"
replacement = "function renderNetProfit(analytics) {\n    const section = document.getElementById('netProfitSection');\n    if (!section) return;\n\n    if (employeeMode || currentOrderType !== 'all') {\n        section.classList.add('hidden');\n        return;\n    }"

if target in content:
    with open('js/features/reports/reportController.js', 'w', encoding='utf-8') as f:
        f.write(content.replace(target, replacement))
    print("Patched successfully")
else:
    print("Target not found")
