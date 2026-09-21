import re

with open('client/src/App.tsx', 'r') as f:
    text = f.read()

# 1. Extract the insights block
# Let's find the start of the block
start_marker = "              {/* AI Insights Card */}"
end_marker = "              {/* ── GLOBAL TABS ── */}"

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

insights_block = text[start_idx:end_idx]

# Remove the `&& activeTab !== 'eda'` from it
insights_block = insights_block.replace(" && activeTab !== 'eda' && (", " && (")

# Remove it from the original location
text = text[:start_idx] + text[end_idx:]

# 2. Insert it into the Model Results tab
target_marker = "              {/* ── MODEL RESULTS TAB CONTENT ── */}\n              {activeTab !== 'eda' && (\n                <>"
target_idx = text.find(target_marker)

if target_idx == -1:
    print("Could not find target marker")
    exit(1)

insert_pos = target_idx + len(target_marker)

text = text[:insert_pos] + "\n\n" + insights_block + text[insert_pos:]

with open('client/src/App.tsx', 'w') as f:
    f.write(text)
print("Success")
