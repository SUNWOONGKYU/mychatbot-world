# -*- coding: utf-8 -*-
"""HWP COM 테스트 v2 - 로컬 경로 저장"""
import sys, os, traceback, shutil
sys.stdout.reconfigure(encoding='utf-8')

TEMP_PATH = os.path.join(os.environ['TEMP'], 'test_hwp_output.hwp')
FINAL_PATH = r'G:\내 드라이브\mychatbot-world\Brainstorming\정부지원사업\test_hwp_output.hwp'

def log(msg):
    print(msg, flush=True)

try:
    log('=== HWP COM 테스트 v2 ===')

    import win32com.client
    import pythoncom
    pythoncom.CoInitialize()

    hwp = win32com.client.Dispatch('HWPFrame.HwpObject')
    log(f'Version: {hwp.Version}')
    hwp.XHwpWindows.Item(0).Visible = True
    hwp.RegisterModule('FilePathCheckDLL', 'FilePathCheckerModule')

    # 텍스트 삽입
    hwp.HAction.GetDefault("InsertText", hwp.HParameterSet.HInsertText.HSet)
    hwp.HParameterSet.HInsertText.Text = "사업계획서 HWP 테스트"
    hwp.HAction.Execute("InsertText", hwp.HParameterSet.HInsertText.HSet)
    hwp.HAction.Run("BreakPara")
    log('텍스트 삽입 완료')

    # 로컬 임시 경로에 저장
    log(f'저장 시도 (로컬): {TEMP_PATH}')
    hwp.SaveAs(TEMP_PATH, "HWP", "")
    log(f'저장 완료: {os.path.getsize(TEMP_PATH):,} bytes')

    # Google Drive로 복사
    shutil.copy2(TEMP_PATH, FINAL_PATH)
    log(f'복사 완료: {FINAL_PATH}')

    hwp.Clear(1)
    hwp.Quit()
    log('=== 성공! ===')

except Exception as e:
    log(f'오류: {e}')
    log(traceback.format_exc())
    # 한글 프로세스 종료 시도
    try:
        hwp.Quit()
    except:
        pass
finally:
    try:
        pythoncom.CoUninitialize()
    except:
        pass
