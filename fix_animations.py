import re

with open('client/src/App.tsx', 'r') as f:
    text = f.read()

# Remove isUpdateAnimationActive
text = text.replace(" isUpdateAnimationActive={false}", "")
text = text.replace("animationDuration={600}", "animationDuration={400}")

with open('client/src/App.tsx', 'w') as f:
    f.write(text)

