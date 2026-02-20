# find_my_wt.ps1 - Find WT + current shell PID, write cpc_target.json

$outFile = "C:\Users\wksun\cpc_target.json"

function Get-ParentProcessId([int]$procId) {
    try {
        $entry = Get-CimInstance Win32_Process -Filter "ProcessId = $procId" -ErrorAction Stop
        if ($entry) { return [int]$entry.ParentProcessId }
    } catch {}
    return $null
}

function Get-ProcName([int]$procId) {
    try {
        return (Get-Process -Id $procId -ErrorAction Stop).ProcessName
    } catch { return $null }
}

$startPid = $PID
Write-Host "[find_my_wt] Start PID: $startPid"

$shellPid = $null   # powershell that is direct child of WT
$wtPid    = $null
$cur      = $startPid
$prevPid  = $startPid

for ($i = 0; $i -lt 20; $i++) {
    $parent = Get-ParentProcessId $cur
    if (-not $parent -or $parent -eq 0) { break }
    $name = Get-ProcName $parent
    Write-Host "  Parent PID=$parent  Name=$name"

    if ($name -eq "WindowsTerminal") {
        $wtPid    = $parent
        $shellPid = $cur   # the direct child of WT = this tab's shell
        break
    }
    $prevPid = $cur
    $cur     = $parent
}

if ($wtPid -and $shellPid) {
    $data = '{"wt_pid":' + $wtPid + ',"oc_pid":' + $shellPid + '}'
    [System.IO.File]::WriteAllText($outFile, $data, [System.Text.Encoding]::UTF8)
    Write-Host "[OK] cpc_target.json created"
    Write-Host "     WT_PID   = $wtPid"
    Write-Host "     SHELL_PID= $shellPid"
    Write-Host "     File: $outFile"
} else {
    Write-Host "[FAIL] WindowsTerminal not found. WT=$wtPid SHELL=$shellPid"
}
