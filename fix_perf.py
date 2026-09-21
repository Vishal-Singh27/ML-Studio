import re

with open('client/src/App.tsx', 'r') as f:
    text = f.read()

# 1. Lift remarkPlugins
text = text.replace("import remarkGfm from 'remark-gfm';", "import remarkGfm from 'remark-gfm';\n\nconst memoizedRemarkPlugins = [remarkGfm];")
text = text.replace("remarkPlugins={[remarkGfm]}", "remarkPlugins={memoizedRemarkPlugins}")

# 2. Add useMemo where necessary. Wait, inserting useMemo correctly via python regex is hard and prone to syntax errors.
# Instead, let's look at what triggers re-renders in App.tsx.
# AnimatedNumber causes 60 re-renders per second for 1 second! 
# But it only sets its OWN state. Does it trigger App re-renders? No.

# What triggers App re-renders?
# - setActiveTab
# - setStatus
# - setInferenceForm
# Does hovering trigger App re-renders?
# Let's check if there is any `onMouseEnter` or `onMouseMove` in App.tsx.
