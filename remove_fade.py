import re

with open('client/src/App.tsx', 'r') as f:
    text = f.read()

text = text.replace("transition-opacity duration-300", "")

with open('client/src/App.tsx', 'w') as f:
    f.write(text)

