import os

file_path = r"c:\!SSAL_Works_Private\P1_사업계획\Patent\02_특허명세서_통합.md"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip_mode = False
found_start = False
found_end = False

for line in lines:
    # Start deleting at Section 10.7
    if "10.7 전체 프로세스 흐름도" in line:
        skip_mode = True
        found_start = True
    
    # Stop deleting at Section 13 (and rename it)
    if "13. 발명의 효과" in line:
        skip_mode = False
        found_end = True
        # Renumber 13 -> 11
        new_line = line.replace("13. 발명의 효과", "11. 발명의 효과")
        new_lines.append(new_line)
        continue

    if not skip_mode:
        new_lines.append(line)

if found_start and found_end:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Successfully deleted garbage sections and renumbered Section 13.")
else:
    print(f"Error: Could not find markers. Start: {found_start}, End: {found_end}")
