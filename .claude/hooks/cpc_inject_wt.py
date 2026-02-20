"""
CPC WT Injector v6
- OC PID 기반 실시간 탭 계산 (생성시간 정렬)
- AttachThreadInput 트릭으로 SetForegroundWindow 강제 성공
- 탭 전환 완료 대기 후 SendInput
Usage: python cpc_inject_wt.py <wt_pid> <oc_pid> <text>
"""
import ctypes
import ctypes.wintypes as w
import sys
import time

LOG = r"C:\Users\wksun\cpc_inject_log.txt"


def log(msg):
    try:
        with open(LOG, "a", encoding="utf-8") as f:
            f.write(msg + "\n")
    except Exception:
        pass


user32   = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

INPUT_KEYBOARD    = 1
KEYEVENTF_KEYUP   = 0x0002
KEYEVENTF_UNICODE = 0x0004
VK_CONTROL = 0x11
VK_MENU    = 0x12
VK_RETURN  = 0x0D
TH32CS_SNAPPROCESS = 0x00000002


# ─── 프로세스 열거 ────────────────────────────────────────────
class PROCESSENTRY32(ctypes.Structure):
    _fields_ = [
        ("dwSize",              ctypes.c_uint32),
        ("cntUsage",            ctypes.c_uint32),
        ("th32ProcessID",       ctypes.c_uint32),
        ("th32DefaultHeapID",   ctypes.c_size_t),
        ("th32ModuleID",        ctypes.c_uint32),
        ("cntThreads",          ctypes.c_uint32),
        ("th32ParentProcessID", ctypes.c_uint32),
        ("pcPriClassBase",      ctypes.c_long),
        ("dwFlags",             ctypes.c_uint32),
        ("szExeFile",           ctypes.c_char * 260),
    ]


class FILETIME(ctypes.Structure):
    _fields_ = [("dwLowDateTime", ctypes.c_uint32),
                ("dwHighDateTime", ctypes.c_uint32)]

    def to_int(self):
        return (self.dwHighDateTime << 32) | self.dwLowDateTime


def get_process_creation_time(pid):
    PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
    h = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
    if not h:
        return 0
    ct, et, kt, ut = FILETIME(), FILETIME(), FILETIME(), FILETIME()
    ok = kernel32.GetProcessTimes(h, ctypes.byref(ct), ctypes.byref(et),
                                   ctypes.byref(kt), ctypes.byref(ut))
    kernel32.CloseHandle(h)
    return ct.to_int() if ok else 0


def get_oc_children_sorted(wt_pid):
    """WT 자식 OpenConsole.exe 또는 powershell.exe를 생성시간 순으로 반환 (= 탭 순서)
    구버전 WT: OpenConsole.exe 레이어 존재
    신버전 WT: powershell.exe 가 WT 직접 자식으로 연결됨
    """
    TAB_PROCS = {b"OpenConsole.exe", b"powershell.exe", b"cmd.exe", b"bash.exe"}
    snap = kernel32.CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0)
    if snap == ctypes.c_void_p(-1).value:
        return []
    pe = PROCESSENTRY32()
    pe.dwSize = ctypes.sizeof(PROCESSENTRY32)
    ocs = []
    try:
        if kernel32.Process32First(snap, ctypes.byref(pe)):
            while True:
                if (pe.th32ParentProcessID == wt_pid
                        and pe.szExeFile in TAB_PROCS):
                    ocs.append(pe.th32ProcessID)
                if not kernel32.Process32Next(snap, ctypes.byref(pe)):
                    break
    finally:
        kernel32.CloseHandle(snap)
    ocs.sort(key=get_process_creation_time)
    return ocs


def get_tab_idx(wt_pid, oc_pid):
    ocs = get_oc_children_sorted(wt_pid)
    log(f"OC order (by creation): {ocs}")
    if oc_pid not in ocs:
        log(f"ERROR: oc_pid={oc_pid} not found in WT={wt_pid}")
        return None
    return ocs.index(oc_pid) + 1  # 1-based


# ─── HWND 탐색 ───────────────────────────────────────────────
def find_wt_hwnd(pid):
    found = []
    EnumWindowsProc = ctypes.WINFUNCTYPE(w.BOOL, w.HWND, w.LPARAM)

    def cb(hwnd, _):
        wpid = w.DWORD(0)
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(wpid))
        if wpid.value == pid and user32.IsWindowVisible(hwnd):
            buf = ctypes.create_unicode_buffer(64)
            user32.GetClassNameW(hwnd, buf, 64)
            if buf.value == "CASCADIA_HOSTING_WINDOW_CLASS":
                found.append(hwnd)
        return True

    user32.EnumWindows(EnumWindowsProc(cb), 0)
    log(f"CASCADIA HWNDs for pid={pid}: {[hex(h) for h in found]}")
    return found[0] if found else None


# ─── 강제 Foreground (AttachThreadInput 트릭) ────────────────
def force_foreground(hwnd):
    fg_hwnd  = user32.GetForegroundWindow()
    fg_tid   = user32.GetWindowThreadProcessId(fg_hwnd, None)
    our_tid  = kernel32.GetCurrentThreadId()
    attached = False
    if fg_tid and fg_tid != our_tid:
        attached = user32.AttachThreadInput(our_tid, fg_tid, True)
    user32.ShowWindow(hwnd, 9)   # SW_RESTORE
    user32.SetForegroundWindow(hwnd)
    user32.BringWindowToTop(hwnd)
    if attached:
        user32.AttachThreadInput(our_tid, fg_tid, False)
    # 포그라운드 확인
    for _ in range(10):
        time.sleep(0.02)
        if user32.GetForegroundWindow() == hwnd:
            return True
    return user32.GetForegroundWindow() == hwnd


# ─── SendInput 헬퍼 ──────────────────────────────────────────
class KEYBDINPUT(ctypes.Structure):
    _fields_ = [("wVk", w.WORD), ("wScan", w.WORD),
                ("dwFlags", w.DWORD), ("time", w.DWORD),
                ("dwExtraInfo", ctypes.POINTER(ctypes.c_ulong))]


class _INPUT_UNION(ctypes.Union):
    _fields_ = [("ki", KEYBDINPUT), ("_pad", ctypes.c_uint8 * 28)]


class INPUT(ctypes.Structure):
    _fields_ = [("type", w.DWORD), ("_u", _INPUT_UNION)]


def _vk(vk, flags=0):
    i = INPUT(); i.type = INPUT_KEYBOARD
    i._u.ki.wVk = vk; i._u.ki.dwFlags = flags
    return i


def _ch(ch, flags=0):
    i = INPUT(); i.type = INPUT_KEYBOARD
    i._u.ki.wScan = ord(ch)
    i._u.ki.dwFlags = KEYEVENTF_UNICODE | flags
    return i


def send_inputs(inputs):
    arr = (INPUT * len(inputs))(*inputs)
    return user32.SendInput(len(inputs), arr, ctypes.sizeof(INPUT))


# ─── 메인 주입 ───────────────────────────────────────────────
def inject(wt_pid, oc_pid, text):
    tab_idx = get_tab_idx(wt_pid, oc_pid)
    if tab_idx is None:
        return False

    hwnd = find_wt_hwnd(wt_pid)
    if not hwnd:
        log(f"HWND not found for WT={wt_pid}")
        return False

    log(f"inject: WT={wt_pid} OC={oc_pid} TAB={tab_idx} hwnd={hex(hwnd)} len={len(text)}")

    # 포그라운드 강제 획득
    ok_fg = force_foreground(hwnd)
    log(f"force_foreground: {'OK' if ok_fg else 'FAIL (proceed anyway)'}")
    time.sleep(0.1)

    # Ctrl+Alt+{tab_idx} — 정확한 탭으로 전환
    vk_digit = 0x30 + tab_idx
    send_inputs([_vk(VK_CONTROL), _vk(VK_MENU), _vk(vk_digit),
                 _vk(vk_digit, KEYEVENTF_KEYUP),
                 _vk(VK_MENU, KEYEVENTF_KEYUP), _vk(VK_CONTROL, KEYEVENTF_KEYUP)])
    log(f"Tab switch Ctrl+Alt+{tab_idx} sent")
    time.sleep(0.4)   # 탭 전환 완료 대기

    # 텍스트 주입
    for ch in text:
        send_inputs([_ch(ch, 0), _ch(ch, KEYEVENTF_KEYUP)])
        time.sleep(0.003)
    send_inputs([_vk(VK_RETURN), _vk(VK_RETURN, KEYEVENTF_KEYUP)])

    log(f"Done: {len(text)} chars → WT={wt_pid} OC={oc_pid} TAB={tab_idx}")
    return True


if __name__ == "__main__":
    if len(sys.argv) < 4:
        log("Usage: cpc_inject_wt.py <wt_pid> <oc_pid> <text|@filepath>")
        sys.exit(1)
    text_arg = sys.argv[3]
    if text_arg.startswith("@"):
        # UTF-8 파일에서 읽기 (한글 인코딩 보존)
        try:
            with open(text_arg[1:], 'r', encoding='utf-8') as f:
                text = f.read()
            import os; os.unlink(text_arg[1:])  # 임시 파일 삭제
        except Exception as e:
            log(f"파일 읽기 실패: {e}")
            sys.exit(1)
    else:
        text = text_arg
    ok = inject(int(sys.argv[1]), int(sys.argv[2]), text)
    sys.exit(0 if ok else 1)
