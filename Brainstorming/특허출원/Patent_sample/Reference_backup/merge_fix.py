import os

parts = [
    "02_명세서_Part1.md",
    "02_명세서_Part2.md",
    "02_명세서_Part3.md",
    "02_명세서_Part4.md",
    "02_명세서_Part5.md",
    "02_명세서_Part6.md"
]

output_file = "02_특허명세서_통합.md"
cwd = r"c:\!SSAL_Works_Private\P1_사업계획\Patent"

try:
    with open(os.path.join(cwd, output_file), "w", encoding="utf-8") as outfile:
        for part in parts:
            part_path = os.path.join(cwd, part)
            if os.path.exists(part_path):
                with open(part_path, "r", encoding="utf-8") as infile:
                    outfile.write(infile.read())
                    outfile.write("\n\n")
    print("Merge successful")
except Exception as e:
    print(f"Error: {e}")
