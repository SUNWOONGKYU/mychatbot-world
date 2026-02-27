import re

file_path = r"c:\!SSAL_Works_Private\P1_사업계획\Patent\02_특허명세서_통합.md"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
# Regex to match "123: " at the start of a line
# Note: Some lines might be "117: 1. Title". We want "1. Title".
# Some might be "400: 【부호의 설명】". We want "【부호의 설명】".
pattern = re.compile(r'^\d+:\s?')

for line in lines:
    # Strip the leading number if present
    # But be careful not to strip "1. Step 1" if it's not a garbage number.
    # The garbage numbers clearly look like line numbers from a previous editor/view "117: ", "118: ".
    # They are usually followed by a space.
    # We will only strip if it matches the pattern strictly.
    
    # Check if the line STARTS with potential garbage
    # Example: "117: 1. 전체..."
    clean_line = pattern.sub('', line)
    new_lines.append(clean_line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Successfully cleaned embedded line numbers.")
