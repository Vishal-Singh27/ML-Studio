import re
with open("client/src/App.tsx", "r") as f:
    content = f.read()

# To cleanly close the <>, let's find the closing of the success block.
# The success block starts with `{status === 'success' && results && (` and ends with `)}` at the very end of the file/component.
# But wait, there's `</Layout>`.
# Let's just find the last `)}` before `</Layout>`.

# Since we injected `{activeTab !== 'eda' && ( <>`
if "{activeTab !== 'eda' && (" in content and "</>\n              )}" not in content:
    # Find `              {/* ── UNSUPERVISED ── */}` and its corresponding block end.
    # A safer approach is to not use fragments. Just do:
    # `{activeTab !== 'eda' && results.task_type === 'SUPERVISED' && ...}`
    # `{activeTab !== 'eda' && results.task_type === 'UNSUPERVISED' && ...}`
    pass

