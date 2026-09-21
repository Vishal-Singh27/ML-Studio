import re

with open('client/src/App.tsx', 'r') as f:
    text = f.read()

# Restore and optimize animations
replacement = r"\g<1>isAnimationActive={true} animationDuration={600} animationEasing=\"ease-out\" isUpdateAnimationActive={false} "

text = re.sub(r"<(Scatter |Bar |Line |Radar )isAnimationActive=\{false\} ", replacement, text)

# Lower scatter cap from 1000 to 400 points to ensure smooth animation
text = text.replace(".slice(0, 1000); // cap at 1k points for performance", ".slice(0, 400); // capped at 400 for smooth SVG animation")

with open('client/src/App.tsx', 'w') as f:
    f.write(text)

