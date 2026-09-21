import re

with open('client/src/App.tsx.bak', 'r') as f:
    text = f.read()

# We want to replace the bad inference blocks with just `</>`
# The bad blocks start with `\n                    {/* ── Inference Tab ── */}` 
# and end with `                  </>`
# BUT we want to KEEP the correct one, which is the last one (at line 1393).

# Let's find all occurrences
pattern = re.compile(r'\n\s*\{\/\* ── Inference Tab ── \*\/\}.*?\n\s*<\/>', re.DOTALL)
matches = list(pattern.finditer(text))

print(f"Found {len(matches)} occurrences of the Inference block ending in </>")

if len(matches) > 0:
    # The last one is the correct one. But wait, did the correct one replace a `</>`?
    # Yes, it replaced the `</>` that was closing the `SUPERVISED` block or something.
    
    # Let's just replace all but the last with `\n                                </>`
    # Wait, the indentation might be different. 
    new_text = text[:matches[0].start()]
    
    for i in range(len(matches) - 1):
        # We replace this match with `\n                                </>`
        new_text += '\n                                </>'
        new_text += text[matches[i].end():matches[i+1].start()]
    
    # For the last one, keep it as is.
    new_text += text[matches[-1].start():]
    
    # Also fix the ComposedChart2 -> BarChart2 issue
    new_text = new_text.replace("<ComposedChart2", "<BarChart2")

    with open('client/src/App.tsx', 'w') as f:
        f.write(new_text)
    print("Fixed!")

