# find_my_wt.ps1 - Find WT + current shell PID, write cpc_target.json

$outFile = "C:\Users\wksun\cpc_target.json"

# Get foreground window HWND FIRST (before anything else changes focus)
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class Win32Util {
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern int GetWindowThreadProcessId(IntPtr hWnd, out int processId);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);
    [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr hWnd);
}
"@

$fgHwnd = [Win32Util]::GetForegroundWindow()
$fgPid = 0
[Win32Util]::GetWindowThreadProcessId($fgHwnd, [ref]$fgPid) | Out-Null
$sb = New-Object System.Text.StringBuilder 128
[Win32Util]::GetClassName($fgHwnd, $sb, 128) | Out-Null
$fgClass = $sb.ToString()
Write-Host "[find_my_wt] Foreground HWND: $fgHwnd  Class: $fgClass  PID: $fgPid"

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
    # Verify foreground window belongs to this WT process
    $wtHwnd = $null
    if ($fgClass -eq "CASCADIA_HOSTING_WINDOW_CLASS" -and $fgPid -eq $wtPid) {
        $wtHwnd = [long]$fgHwnd
        Write-Host "  [OK] Foreground HWND belongs to WT=$wtPid → saving wt_hwnd=$wtHwnd"
    } else {
        Write-Host "  [WARN] Foreground window is NOT the WT window (class=$fgClass pid=$fgPid vs wtPid=$wtPid)"
        Write-Host "         wt_hwnd not saved — injection will search by PID (may be unreliable with multiple WT windows)"
    }

    # Try to get visual tab index via UI Automation
    $tabIdx = $null
    try {
        Add-Type -AssemblyName UIAutomationClient -ErrorAction Stop
        $ae = [System.Windows.Automation.AutomationElement]::FromHandle($fgHwnd)
        if ($ae) {
            $tabCondition = [System.Windows.Automation.PropertyCondition]::new(
                [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
                [System.Windows.Automation.ControlType]::TabItem
            )
            $tabs = $ae.FindAll([System.Windows.Automation.TreeScope]::Descendants, $tabCondition)
            for ($t = 0; $t -lt $tabs.Count; $t++) {
                if ($tabs[$t].Current.IsSelected) {
                    $tabIdx = $t + 1  # 1-based
                    break
                }
            }
            # 탭이 1개면 무조건 인덱스=1 (selected 감지 실패해도 확실함)
            if ($tabs.Count -eq 1 -and -not $tabIdx) {
                $tabIdx = 1
            }
            Write-Host "  [UIA] Visual tab index: $tabIdx (of $($tabs.Count) tabs)"
        }
    } catch {
        Write-Host "  [UIA] Tab detection failed: $_"
    }

    # Build JSON
    $json = "{`"wt_pid`":$wtPid,`"oc_pid`":$shellPid"
    if ($wtHwnd) { $json += ",`"wt_hwnd`":$wtHwnd" }
    if ($tabIdx) { $json += ",`"tab_idx`":$tabIdx" }
    $json += "}"

    [System.IO.File]::WriteAllText($outFile, $json, [System.Text.Encoding]::UTF8)
    Write-Host "[OK] cpc_target.json created"
    Write-Host "     WT_PID   = $wtPid"
    Write-Host "     SHELL_PID= $shellPid"
    if ($wtHwnd) { Write-Host "     WT_HWND  = $wtHwnd" }
    if ($tabIdx) { Write-Host "     TAB_IDX  = $tabIdx" }
    Write-Host "     File: $outFile"
} else {
    Write-Host "[FAIL] WindowsTerminal not found. WT=$wtPid SHELL=$shellPid"
}
