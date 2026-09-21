import re

with open('client/src/App.tsx', 'r') as f:
    text = f.read()

text = text.replace("Brain, FlaskConical, Sparkles", "Brain, FlaskConical, Sparkles, Download")

with open('client/src/App.tsx', 'w') as f:
    f.write(text)

