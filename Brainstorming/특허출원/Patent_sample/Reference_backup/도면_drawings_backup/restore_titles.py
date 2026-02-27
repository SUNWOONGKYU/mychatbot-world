import os
import re

mapping = {
    "Fig01.svg": "도 1: 전체 시스템 구성도",
    "Fig02.svg": "도 2: SAL ID 구조도",
    "Fig03.svg": "도 3: Parser/Normalizer 처리 흐름",
    "Fig04.svg": "도 4: Graph Builder DAG 생성 과정",
    "Fig05.svg": "도 5: Scheduler/Leveler 처리 과정",
    "Fig06.svg": "도 6: 3D Renderer/UI 상호작용 구조",
    "Fig07.svg": "도 7: ID Chain 구조",
    "Fig08.svg": "도 8: Reporting/Analytics 데이터 파이프라인",
    "Fig09.svg": "도 9: 증분 재계산 프로세스"
}

dir_path = r"c:\!SSAL_Works_Private\P1_사업계획\Patent\drawings"

for filename, title in mapping.items():
    path = os.path.join(dir_path, filename)
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Regex to find "도 X" inside a text tag
            # We look for >도 \d< or >도 \d+<
            pattern = r">도 (\d+)<"
            
            if re.search(pattern, content):
                new_content = re.sub(pattern, f">{title}<", content)
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filename} with title: {title}")
            else:
                print(f"Pattern not found in {filename}")
                # Fallback: check if it already has the title or slightly different format
                if title in content:
                     print(f"Title already present in {filename}")
                else:
                     print(f"DEBUG: Content start: {content[:100]}")

        except Exception as e:
            print(f"Error processing {filename}: {e}")
    else:
        print(f"File not found: {filename}")
