import re

with open('client/src/App.tsx', 'r') as f:
    text = f.read()

# Replace EDA Tab conditional
text = text.replace(
    "{/* ── EDA TAB CONTENT ── */}\n              {activeTab === 'eda' && results.preprocessing && (() => {",
    "{/* ── EDA TAB CONTENT ── */}\n              <div className={activeTab === 'eda' ? 'block' : 'hidden'}>\n              {results.preprocessing && (() => {"
)
text = text.replace(
    "                </div>\n              )}",
    "                </div>\n              )}\n              </div>"
)

# Wait, the end of EDA tab is tricky. Let's find exactly where it ends.
