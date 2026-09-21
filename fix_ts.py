import re

with open('client/src/App.tsx', 'r') as f:
    text = f.read()

text = re.sub(r'const CHART_COLORS = \[.*?\];', '', text)
text = re.sub(r"const cs = \[.*?\];", '', text)
text = text.replace("if (status === 'uploading') return;", "if (status as string === 'uploading') return;")
text = text.replace("formatter={(val: any, name, props)", "formatter={(val: any, name)")

with open('client/src/App.tsx', 'w') as f:
    f.write(text)

