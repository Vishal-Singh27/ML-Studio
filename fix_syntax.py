import re

with open("client/src/App.tsx", "r") as f:
    content = f.read()

# We need to find the specific block at the end of the file.
old_str = """)()}

            </div>
          )}"""

new_str = """)()}
                </>
              )}
            </div>
          )}"""

if "</>\n              )}" not in content:
    content = content.replace(old_str, new_str)
    
with open("client/src/App.tsx", "w") as f:
    f.write(content)

