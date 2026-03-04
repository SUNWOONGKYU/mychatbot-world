# -*- coding: utf-8 -*-
"""최소 HWP COM 테스트 - 파일 로깅"""
import sys, os, traceback
sys.stdout.reconfigure(encoding='utf-8')

LOG_PATH = r'G:\내 드라이브\mychatbot-world\Brainstorming\정부지원사업\hwp_test_log.txt'

def log(msg):
    with open(LOG_PATH, 'a', encoding='utf-8') as f:
        f.write(msg + '\n')
    print(msg, flush=True)

try:
    log('=== HWP COM 테스트 시작 ===')

    import win32com.client
    import pythoncom
    pythoncom.CoInitialize()
    log('CoInitialize 완료')

    hwp = win32com.client.Dispatch('HWPFrame.HwpObject')
    log(f'HWP 객체 생성 완료, Version: {hwp.Version}')

    hwp.XHwpWindows.Item(0).Visible = True
    log('창 표시 완료')

    # RegisterModule 시도
    log('RegisterModule 호출...')
    hwp.RegisterModule('FilePathCheckDLL', 'FilePathCheckerModule')
    log('RegisterModule 완료')

    # 텍스트 삽입
    log('텍스트 삽입 중...')
    hwp.HAction.GetDefault("InsertText", hwp.HParameterSet.HInsertText.HSet)
    hwp.HParameterSet.HInsertText.Text = "사업계획서 HWP 테스트"
    hwp.HAction.Execute("InsertText", hwp.HParameterSet.HInsertText.HSet)
    log('텍스트 삽입 완료')

    hwp.HAction.Run("BreakPara")
    log('줄바꿈 완료')

    # 저장
    test_path = r'G:\내 드라이브\mychatbot-world\Brainstorming\정부지원사업\test_hwp_output.hwp'
    log(f'저장 시도: {test_path}')
    hwp.SaveAs(test_path, "HWP", "")
    log(f'저장 완료: {os.path.getsize(test_path):,} bytes')

    hwp.Clear(1)
    hwp.Quit()
    log('HWP 종료 완료')
    log('=== 테스트 성공! ===')

except Exception as e:
    log(f'오류: {e}')
    log(traceback.format_exc())
finally:
    try:
        pythoncom.CoUninitialize()
    except:
        pass
