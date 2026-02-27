import re

file_path = r"c:\!SSAL_Works_Private\P1_사업계획\Patent\02_특허명세서_통합.md"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip_mode = False

for line in lines:
    # 1. Start deleting at "9. Project SAL Grid 통합 구현 프로세스"
    if "9. Project SAL Grid 통합 구현 프로세스" in line:
        skip_mode = True
    
    # 2. Stop deleting at "10. 발명의 효과" (which we will renumber to 9)
    if "10. 발명의 효과" in line:
        skip_mode = False
        
        # Renumber 10 -> 9
        line = line.replace("10. 발명의 효과", "9. 발명의 효과")
        new_lines.append(line)
        continue

    if skip_mode:
        continue

    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Successfully deleted Section 9 (Implementation Process) and renumbered Section 10->9 (Effects).")
