import re

with open('client/src/App.tsx', 'r') as f:
    text = f.read()

# 1. Lift remarkPlugins
text = text.replace("import remarkGfm from 'remark-gfm';", "import remarkGfm from 'remark-gfm';\n\nconst memoizedRemarkPlugins = [remarkGfm];")
text = text.replace("remarkPlugins={[remarkGfm]}", "remarkPlugins={memoizedRemarkPlugins}")

# 2. Add mb-6 to the Insights Card that we just moved
text = text.replace(
    "              {/* AI Insights Card */}\n              {((insights?.overall || insights) || insightError || isGeneratingInsights) && (\n                <div className={`p-6 rounded-2xl border relative overflow-hidden ${isDarkMode ? 'bg-purple-900/10 border-purple-500/30' : 'bg-purple-50 border-purple-200'}`}>",
    "              {/* AI Insights Card */}\n              {((insights?.overall || insights) || insightError || isGeneratingInsights) && (\n                <div className={`mb-6 p-6 rounded-2xl border relative overflow-hidden ${isDarkMode ? 'bg-purple-900/10 border-purple-500/30' : 'bg-purple-50 border-purple-200'}`}>"
)

with open('client/src/App.tsx', 'w') as f:
    f.write(text)

