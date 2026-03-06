# CPC Agent Server — Windows Task Scheduler 등록
# PowerShell에서 관리자 권한으로 1회 실행
#
# 효과:
# - 로그온 시 자동 시작
# - 프로세스 죽으면 1분 후 자동 재시작 (최대 99회)
# - 터미널 없이 백그라운드 실행 (pythonw.exe)

$pythonw = "C:\Python314\pythonw.exe"
$script  = "C:\claude-project\cpc-agent-server\server.py"
$workdir = "C:\claude-project\cpc-agent-server"

# 경로 검증
if (-not (Test-Path $pythonw)) { Write-Error "pythonw.exe 없음: $pythonw"; exit 1 }
if (-not (Test-Path $script))  { Write-Error "server.py 없음: $script"; exit 1 }
$taskName = "CPC-AgentServer"

# 기존 작업 제거 (재등록용)
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

$action = New-ScheduledTaskAction `
    -Execute $pythonw `
    -Argument $script `
    -WorkingDirectory $workdir

$trigger = New-ScheduledTaskTrigger -AtLogOn

$settings = New-ScheduledTaskSettingsSet `
    -RestartCount 99 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "CPC Agent Server - 리모트 컨트롤 명령 수신 및 처리"

Write-Host "등록 완료: $taskName"
Write-Host "시작: schtasks.exe /Run /TN '$taskName'"
Write-Host "중지: schtasks.exe /End /TN '$taskName'"
Write-Host "삭제: schtasks.exe /Delete /TN '$taskName' /F"
