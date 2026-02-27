import re

file_path = r"c:\!SSAL_Works_Private\P1_사업계획\Patent\02_특허명세서_통합.md"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip_mode = False

for line in lines:
    # 1. Delete Section 9
    if "9. 리포트/분석 (Reporting/Analytics)" in line:
        skip_mode = True
    
    # Stop skipping when we hit Section 10
    if "10. Project SAL Grid 통합 구현 프로세스" in line:
        skip_mode = False
    
    if skip_mode:
        continue

    # 2. Renumber Section 10 -> 9
    if "10. Project SAL Grid 통합 구현 프로세스" in line:
        line = line.replace("10. Project SAL Grid", "9. Project SAL Grid")
    
    # Renumber Sub-sections 10.x -> 9.x
    if line.strip().startswith("10."):
        line = line.replace("10.", "9.", 1)

    # 3. Renumber Section 11 -> 10 (Wait, did we already renumber 13->11? Yes. So now 11->10)
    if "11. 발명의 효과" in line:
        line = line.replace("11. 발명의 효과", "10. 발명의 효과")

    # 4. Remove "(도 9 참조)" or "(도 9 관련)" contents
    # Explicitly removing the specific reference in the old Section 10 header if present
    # But we effectively just renumbered the header, so we should check for the string " (도 9 참조)"
    line = line.replace("(도 9 참조)", "").replace("(도 9 관련)", "")

    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Successfully deleted Section 9, renumbered Sections 10->9 and 11->10, and removed Figure 9 references.")
