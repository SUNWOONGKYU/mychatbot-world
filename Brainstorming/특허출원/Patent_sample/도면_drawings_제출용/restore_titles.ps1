$mapping = @{
    "Fig01.svg" = "도 1: 오케스트레이션 시스템 구성도"
    "Fig02.svg" = "도 2: SAL ID 구조도"
    "Fig03.svg" = "도 3: Parser/Normalizer 처리 흐름"
    "Fig04.svg" = "도 4: Graph Builder DAG 생성 과정"
    "Fig05.svg" = "도 5: Scheduler/Leveler 처리 과정"
    "Fig06.svg" = "도 6: 3D Renderer/UI 상호작용 구조"
    "Fig07.svg" = "도 7: ID Chain 구조"
    "Fig08.svg" = "도 8: Reporting/Analytics 데이터 파이프라인"
    "Fig09.svg" = "도 9: 증분 재계산 프로세스"
}

$dir = "c:\!SSAL_Works_Private\P1_사업계획\Patent\drawings"

foreach ($file in $mapping.Keys) {
    $path = Join-Path $dir $file
    if (Test-Path $path) {
        $content = Get-Content $path -Encoding UTF8 -Raw
        $title = $mapping[$file]
        # Regex to find "도 X" inside a text tag, allowing for some flexibility in attributes
        # We look for >도 \d< or >도 \d+<
        $pattern = ">도 (\d+)<"
        
        if ($content -match $pattern) {
            $newContent = $content -replace $pattern, ">$title<"
            $newContent | Set-Content $path -Encoding UTF8
            Write-Host "Updated $file with title: $title"
        }
        else {
            Write-Warning "Pattern not found in $file"
        }
    }
    else {
        Write-Warning "File not found: $file"
    }
}
