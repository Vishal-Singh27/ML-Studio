import re

with open('client/src/App.tsx', 'r') as f:
    text = f.read()

# Add wrapper
text = text.replace(
    "              </div>\n\n              {/* ── EDA TAB CONTENT ── */}\n              <div className={activeTab === 'eda' ? 'block animate-fade-in' : 'hidden'}>",
    "              </div>\n\n              {/* ── TABS CONTAINER ── */}\n              <div className=\"relative w-full\">\n\n              {/* ── EDA TAB CONTENT ── */}\n              <div className={activeTab === 'eda' ? 'relative z-10 opacity-100 transition-opacity duration-300' : 'absolute top-0 left-0 w-full opacity-0 invisible pointer-events-none'}>"
)

text = text.replace(
    "              {/* ── MODEL RESULTS TAB CONTENT ── */}\n              <div className={activeTab !== 'eda' ? 'block animate-fade-in' : 'hidden'}>",
    "              {/* ── MODEL RESULTS TAB CONTENT ── */}\n              <div className={activeTab !== 'eda' ? 'relative z-10 opacity-100 transition-opacity duration-300' : 'absolute top-0 left-0 w-full opacity-0 invisible pointer-events-none'}>"
)

# Close the wrapper
text = text.replace(
    "              })()}\n              </div>\n            </div>\n          )}",
    "              })()}\n              </div>\n              </div>\n            </div>\n          )}"
)

with open('client/src/App.tsx', 'w') as f:
    f.write(text)

