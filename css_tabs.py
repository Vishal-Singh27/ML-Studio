import re

with open('client/src/App.tsx', 'r') as f:
    text = f.read()

# EDA
text = text.replace(
    "{/* ── EDA TAB CONTENT ── */}\n              {activeTab === 'eda' && results.preprocessing && (() => {",
    "{/* ── EDA TAB CONTENT ── */}\n              <div className={activeTab === 'eda' ? 'block animate-fade-in' : 'hidden'}>\n                {results.preprocessing && (() => {"
)
text = text.replace(
    "                );\n              })()}\n              \n              {/* ── MODEL RESULTS TAB CONTENT ── */}\n              {activeTab !== 'eda' && (\n                <>",
    "                );\n              })()}\n              </div>\n              \n              {/* ── MODEL RESULTS TAB CONTENT ── */}\n              <div className={activeTab !== 'eda' ? 'block animate-fade-in' : 'hidden'}>"
)
text = text.replace(
    "              })()}\n                </>\n              )}\n            </div>\n          )}",
    "              })()}\n              </div>\n            </div>\n          )}"
)

with open('client/src/App.tsx', 'w') as f:
    f.write(text)

