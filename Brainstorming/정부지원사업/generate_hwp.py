# -*- coding: utf-8 -*-
"""
재도전성공패키지 사업계획서 HWP 생성 스크립트
한글 COM API (win32com)를 사용하여 사업계획서를 한글(HWP) 파일로 생성합니다.
원본: 사업계획서_재도전성공패키지_MyChabbotWorld.md
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')
import os
import time
import shutil
import win32com.client
import pythoncom

# ── 경로 설정 ──
BASE_DIR = r'G:\내 드라이브\mychatbot-world\Brainstorming\정부지원사업'
OUTPUT_PATH = os.path.join(BASE_DIR, '사업계획서_재도전성공패키지_MyChatbotWorld.hwp')
TEMP_PATH = os.path.join(os.environ['TEMP'], '사업계획서_재도전성공패키지_MyChatbotWorld.hwp')


class HwpDocBuilder:
    """한글 COM API를 래핑한 문서 빌더"""

    # 폰트 상수
    FONT_GOTHIC = '맑은 고딕'
    FONT_MONO = 'D2Coding'

    # 색상 상수 (BGR 형식)
    COLOR_HEADER_BG = 0xF3E2D9  # D9E2F3 (연한 파랑) → BGR
    COLOR_BLACK = 0x000000

    def __init__(self):
        self.hwp = None

    def init(self):
        """HWP COM 객체 초기화"""
        pythoncom.CoInitialize()
        self.hwp = win32com.client.Dispatch('HWPFrame.HwpObject')
        self.hwp.RegisterModule('FilePathCheckDLL', 'FilePathCheckerModule')
        self.hwp.XHwpWindows.Item(0).Visible = True
        # 새 문서 (기본 빈 문서)
        # 페이지 설정
        self._setup_page()
        print('HWP 초기화 완료', flush=True)

    def _setup_page(self):
        """페이지 여백 설정: 상하 2cm, 좌우 2.5cm"""
        hwp = self.hwp
        act = hwp.CreateAction("PageSetup")
        pset = act.CreateSet()
        act.GetDefault(pset)
        # PageDef 서브셋에 접근
        page_def = pset.CreateItemSet("PageDef", "PageDef")
        pset.SetItem("PageDef", page_def)
        page_def.SetItem("LeftMargin", hwp.MiliToHwpUnit(25))   # 2.5cm
        page_def.SetItem("RightMargin", hwp.MiliToHwpUnit(25))  # 2.5cm
        page_def.SetItem("TopMargin", hwp.MiliToHwpUnit(20))    # 2.0cm
        page_def.SetItem("BottomMargin", hwp.MiliToHwpUnit(20)) # 2.0cm
        pset.SetItem("ApplyClass", 3)  # 문서 전체 적용
        pset.SetItem("ApplyTo", 2)     # 문서 전체
        act.Execute(pset)

    def _insert_text(self, text):
        """텍스트 삽입"""
        hwp = self.hwp
        act = hwp.CreateAction("InsertText")
        pset = act.CreateSet()
        act.GetDefault(pset)
        pset.SetItem("Text", text)
        act.Execute(pset)

    def _insert_newline(self):
        """줄바꿈 (엔터)"""
        hwp = self.hwp
        hwp.HAction.Run("BreakPara")

    def _set_char_shape(self, font_name=None, font_size=None, bold=None, color=None):
        """문자 모양 설정 - CreateAction/SetItem 패턴"""
        hwp = self.hwp
        act = hwp.CreateAction("CharShape")
        pset = act.CreateSet()
        act.GetDefault(pset)
        if font_name is not None:
            pset.SetItem("FaceNameUser", font_name)
            pset.SetItem("FaceNameSymbol", font_name)
            pset.SetItem("FaceNameOther", font_name)
            pset.SetItem("FaceNameJapanese", font_name)
            pset.SetItem("FaceNameHanja", font_name)
            pset.SetItem("FaceNameLatin", font_name)
            pset.SetItem("FaceNameHangul", font_name)
        if font_size is not None:
            pset.SetItem("Height", hwp.PointToHwpUnit(font_size))
        if bold is not None:
            pset.SetItem("Bold", bold)
        if color is not None:
            pset.SetItem("TextColor", color)
        act.Execute(pset)

    def _set_para_shape(self, align=None, line_spacing=None, space_before=None, space_after=None, left_indent=None):
        """문단 모양 설정 - CreateAction/SetItem 패턴
        align: 0=양쪽정렬, 1=왼쪽, 2=오른쪽, 3=가운데
        """
        hwp = self.hwp
        act = hwp.CreateAction("ParagraphShape")
        pset = act.CreateSet()
        act.GetDefault(pset)
        if align is not None:
            pset.SetItem("Alignment", align)
        if line_spacing is not None:
            pset.SetItem("LineSpacingType", 0)  # 퍼센트
            pset.SetItem("LineSpacing", line_spacing)
        if space_before is not None:
            pset.SetItem("SpaceBeforePara", hwp.PointToHwpUnit(space_before))
        if space_after is not None:
            pset.SetItem("SpaceAfterPara", hwp.PointToHwpUnit(space_after))
        if left_indent is not None:
            pset.SetItem("LeftMargin", hwp.MiliToHwpUnit(left_indent))
        act.Execute(pset)

    def _page_break(self):
        """페이지 나누기"""
        hwp = self.hwp
        hwp.HAction.Run("BreakPage")

    def _select_all_in_cell(self):
        """표 셀 내용 전체 선택"""
        self.hwp.HAction.Run("SelectAll")

    # ── 고수준 API ──

    def add_title(self, text, font_size=16):
        """표지 제목"""
        self._set_para_shape(align=3)  # 가운데
        self._set_char_shape(font_name=self.FONT_GOTHIC, font_size=font_size, bold=True)
        self._insert_text(text)
        self._insert_newline()

    def add_heading(self, text, level=1):
        """제목 추가
        level 0: 대단원 (14pt bold)
        level 1: 중제목 (12pt bold)
        level 2: 소제목 (11pt bold)
        level 3: 소소제목 (10.5pt bold)
        """
        sizes = {0: 14, 1: 12, 2: 11, 3: 10.5}
        size = sizes.get(level, 10)
        self._set_para_shape(align=0, space_before=6, space_after=3, left_indent=0)
        self._set_char_shape(font_name=self.FONT_GOTHIC, font_size=size, bold=True, color=self.COLOR_BLACK)
        self._insert_text(text)
        self._insert_newline()

    def add_body(self, text, bold=False, font_size=10, indent_mm=0):
        """본문 텍스트"""
        self._set_para_shape(align=0, space_before=1, space_after=1,
                             line_spacing=160, left_indent=indent_mm)
        self._set_char_shape(font_name=self.FONT_GOTHIC, font_size=font_size,
                             bold=bold, color=self.COLOR_BLACK)
        self._insert_text(text)
        self._insert_newline()

    def add_body_bold_then_normal(self, bold_text, normal_text, font_size=10, indent_mm=0):
        """볼드+일반 텍스트를 한 문단에"""
        self._set_para_shape(align=0, space_before=1, space_after=1,
                             line_spacing=160, left_indent=indent_mm)
        self._set_char_shape(font_name=self.FONT_GOTHIC, font_size=font_size,
                             bold=True, color=self.COLOR_BLACK)
        self._insert_text(bold_text)
        self._set_char_shape(font_name=self.FONT_GOTHIC, font_size=font_size,
                             bold=False, color=self.COLOR_BLACK)
        self._insert_text(normal_text)
        self._insert_newline()

    def add_monospace(self, text, font_size=8):
        """고정폭 폰트 텍스트 (아키텍처 다이어그램용)"""
        self._set_para_shape(align=0, space_before=2, space_after=2, left_indent=5)
        self._set_char_shape(font_name=self.FONT_MONO, font_size=font_size,
                             bold=False, color=self.COLOR_BLACK)
        # 줄 단위로 삽입
        lines = text.split('\n')
        for i, line in enumerate(lines):
            self._insert_text(line)
            if i < len(lines) - 1:
                self._insert_newline()
        self._insert_newline()

    def add_bullet(self, text, font_size=9, indent_mm=5):
        """불릿 항목"""
        self._set_para_shape(align=0, space_before=0, space_after=0,
                             line_spacing=160, left_indent=indent_mm)
        self._set_char_shape(font_name=self.FONT_GOTHIC, font_size=font_size,
                             bold=False, color=self.COLOR_BLACK)
        self._insert_text('• ' + text)
        self._insert_newline()

    def add_table(self, headers, rows, col_widths_mm=None):
        """표 생성
        headers: 헤더 텍스트 리스트
        rows: 2D 리스트 (각 행의 셀 텍스트)
        col_widths_mm: 열 너비 mm 리스트 (None이면 자동)
        """
        hwp = self.hwp
        num_cols = len(headers)
        num_rows = 1 + len(rows)  # 헤더 + 데이터

        # 표 만들기 - CreateAction 패턴
        act = hwp.CreateAction("TableCreate")
        pset = act.CreateSet()
        act.GetDefault(pset)
        pset.SetItem("Rows", num_rows)
        pset.SetItem("Cols", num_cols)
        pset.SetItem("WidthType", 2)  # 단에 맞춤
        pset.SetItem("HeightType", 0)  # 자동

        if col_widths_mm:
            total_mm = sum(col_widths_mm)
            pset.SetItem("WidthValue", hwp.MiliToHwpUnit(int(total_mm)))
            col_struct = pset.CreateItemArray("ColWidth", num_cols)
            for i, w in enumerate(col_widths_mm):
                col_struct.SetItem(i, hwp.MiliToHwpUnit(int(w)))
        else:
            pset.SetItem("WidthValue", hwp.MiliToHwpUnit(165))

        row_struct = pset.CreateItemArray("RowHeight", num_rows)
        for i in range(num_rows):
            row_struct.SetItem(i, hwp.MiliToHwpUnit(8))

        act.Execute(pset)

        # 표 안으로 이동 (첫 셀)
        # 표가 방금 생성되었으므로 커서는 첫 셀에 있음

        # 헤더 행 채우기
        for i, h in enumerate(headers):
            self._set_cell_bg(0xF3E2D9)  # D9E2F3 BGR
            self._insert_text(h)
            if i < num_cols - 1:
                hwp.HAction.Run("TableRightCell")

        # 데이터 행 채우기
        for r_idx, row_data in enumerate(rows):
            for c_idx, val in enumerate(row_data):
                hwp.HAction.Run("TableRightCell")
                # **bold** 마크다운 제거 후 순수 텍스트만 삽입
                clean_val = str(val).replace('**', '')
                self._insert_text(clean_val)

        # 표 밖으로 이동
        hwp.HAction.Run("TableRightCell")
        hwp.HAction.Run("TableRightCell")
        self._insert_newline()

    def _set_cell_bg(self, color_bgr):
        """현재 셀 배경색 설정"""
        hwp = self.hwp
        try:
            act = hwp.CreateAction("CellBorderFill")
            pset = act.CreateSet()
            act.GetDefault(pset)
            fill = pset.CreateItemSet("FillAttr", "FillAttr")
            pset.SetItem("FillAttr", fill)
            fill.SetItem("type", 2)  # WinBrush
            fill.SetItem("WinBrushFaceColor", color_bgr)
            fill.SetItem("WinBrushHatchColor", 0)
            act.Execute(pset)
        except Exception as e:
            pass  # 셀 배경색 설정 실패 시 무시

    def _insert_rich_text(self, text, font_size=9):
        """**bold** 마크다운을 파싱하여 리치 텍스트 삽입"""
        import re
        parts = re.split(r'(\*\*.*?\*\*)', text)
        for part in parts:
            if part.startswith('**') and part.endswith('**'):
                self._set_char_shape(font_name=self.FONT_GOTHIC, font_size=font_size, bold=True)
                self._insert_text(part[2:-2])
            elif part:
                self._set_char_shape(font_name=self.FONT_GOTHIC, font_size=font_size, bold=False)
                self._insert_text(part)

    def add_horizontal_rule(self):
        """수평선"""
        self.add_body('─' * 80, font_size=6)

    def page_break(self):
        """페이지 나누기"""
        self._page_break()

    def save(self, path):
        """HWP 파일 저장 (로컬 임시 경로 → 최종 경로 복사)"""
        hwp = self.hwp
        # Google Drive 경로 직접 SaveAs가 블로킹되므로 로컬 임시 경로에 먼저 저장
        hwp.SaveAs(TEMP_PATH, "HWP", "")
        size = os.path.getsize(TEMP_PATH)
        print(f'임시 저장 완료: {TEMP_PATH} ({size:,} bytes)', flush=True)
        shutil.copy2(TEMP_PATH, path)
        print(f'HWP 저장 완료: {path}', flush=True)
        print(f'파일 크기: {os.path.getsize(path):,} bytes', flush=True)

    def quit(self):
        """한글 종료"""
        self.hwp.Clear(1)
        self.hwp.Quit()
        pythoncom.CoUninitialize()


def build_document(doc):
    """사업계획서 본문 생성"""
    print('[1/7] 표지 생성 중...', flush=True)

    # ═══════════════════════════════════════
    # 표지
    # ═══════════════════════════════════════
    doc._insert_newline()
    doc._insert_newline()
    doc._insert_newline()
    doc._insert_newline()
    doc._insert_newline()
    doc.add_title('2026년 재도전성공패키지')
    doc.add_title('(예비)재창업기업 사업계획서', font_size=16)
    doc._insert_newline()
    doc._insert_newline()
    doc.add_body('사업명: My Chatbot World — AI 챗봇의 생성·학습·성장·수익활동·피상속으로 이어지는 라이프사이클 지원 플랫폼',
                 font_size=11, bold=False)

    doc.page_break()

    # ═══════════════════════════════════════
    # □ 과제 개요
    # ═══════════════════════════════════════
    doc.add_heading('□ 과제 개요', 1)
    doc.add_table(
        ['항목', '내용'],
        [
            ['과제명 (사업명)', 'My Chatbot World — AI 챗봇의 생성·학습·성장·수익활동·피상속으로 이어지는 라이프사이클 지원 플랫폼'],
            ['기업명', '(기재 필요) ※ 예비재창업자의 경우 "예비재창업자"로 기재'],
            ['아이템(서비스) 개요',
             '멀티 페르소나(아바타형 대외용 + 도우미형 대내용) 이원 구조와 감성 수준(1~100) 슬라이더 + 비용 조건(0원~100만원) 슬라이더 기반 '
             '멀티 AI 자동 라우팅을 통해, AI 챗봇의 생성→학습→성장→수익활동→피상속으로 이어지는 '
             '라이프사이클 전체를 원스톱으로 지원하는 세계 최초의 개인 맞춤형 AI 챗봇 플랫폼. '
             '(특허 출원 완료, 7대 핵심 구성요소, 청구항 17개)'],
        ],
        col_widths_mm=[35, 130]
    )

    # □ 폐업 이력
    doc.add_heading('□ 폐업 이력 (총 폐업 횟수 : ○회)', 1)
    doc.add_table(
        ['항목', '내용'],
        [
            ['기업명', '○○○○'],
            ['기업 구분', '개인 / 법인'],
            ['사업기간', '20○○.○○.○○ ~ 20○○.○○.○○'],
            ['업종(업태/종목)', '(기재 필요)'],
            ['매출 규모', '(기재 필요)'],
            ['고용 규모', '(기재 필요)'],
            ['폐업 사유', '(기재 필요)'],
        ],
        col_widths_mm=[35, 130]
    )

    print('[2/7] 1. 문제인식 생성 중...', flush=True)
    # ═══════════════════════════════════════
    # 1. 문제인식
    # ═══════════════════════════════════════
    doc.page_break()
    doc.add_heading('1. 문제인식 (폐업 원인 분석 및 재창업 아이템 추진 배경)', 0)

    # 1-1
    doc.add_heading('1-1. 이전 사업 폐업 원인 분석', 2)
    doc.add_body('이전 사업에서 겪은 실패를 네 가지 핵심 원인으로 분석하고, 각각에 대한 구체적 개선 방향을 도출하였습니다.')

    doc.add_table(
        ['구분', '실패 원인', '교훈 및 개선 방향'],
        [
            ['**시장 검증 부재**', '고객 니즈 확인 없이 기술 중심 개발 착수, 출시 후 시장 반응 저조',
             'MVP로 빠른 시장 검증 후 확장하는 린 스타트업 방식 채택'],
            ['**수익모델 불명확**', '명확한 과금 체계 없이 무료 운영, 지속가능한 수익 창출 실패',
             '크레딧 사용료 + 스킬 마켓 수수료 + 수익활동 중개 수수료의 다중 수익 구조 설계 완료'],
            ['**비용 통제 실패**', '자체 서버 구축 등 초기 고정비 과다 투입',
             '서버리스(Vercel) + BaaS(Supabase)로 초기 인프라 비용 월 $10 이하 달성'],
            ['**단독 운영 한계**', '기획·개발·마케팅 1인 담당으로 속도·품질 모두 저하',
             'AI 개발 도구(Claude Code, Copilot)로 1인 생산성 10배 향상 + 외부 전문 인력 협업 체계'],
        ],
        col_widths_mm=[25, 65, 75]
    )

    doc.add_body('핵심 교훈: "기술이 아무리 좋아도, 고객이 원하는 것을 만들지 않으면 실패한다." 이 뼈아픈 경험이 이번 재창업의 출발점입니다.', bold=True)

    # 1-2
    doc.add_heading('1-2. 재창업 아이템 추진 배경 및 필요성', 2)

    doc.add_body('(1) 시장의 구조적 문제 — 개인·소상공인 AI 챗봇 시장의 부재', bold=True)
    doc.add_body('글로벌 AI 챗봇 시장은 2023년 51억 달러에서 2028년 155억 달러(CAGR 25%)로 급성장 중이나(출처: MarketsandMarkets, 2023), 기업용(B2B)이 80% 이상을 차지하며, 개인·소상공인을 위한 시장은 사실상 블루오션입니다.', font_size=9)

    doc.add_body('My Chatbot World는 AI 챗봇이 누구에게나 열려 있어야 한다는 신념에서 출발합니다. 할머니도, 학생도, 동네 식당 사장님도, 피아노 선생님도 — 기술 지식이 전혀 없어도 자신만의 AI 챗봇을 만들고, 키우고, 수익을 내고, 물려줄 수 있어야 합니다. 이것이 My Chatbot World 6대 핵심 가치입니다.', font_size=9)

    doc.add_table(
        ['#', '핵심 가치', '내용'],
        [
            ['1', '**접근성**', '전문가만의 것이 아니다. 누구나 자유롭게 AI 챗봇을 만들 수 있다'],
            ['2', '**최소 비용**', '비용 조건 슬라이더 기본 0원 → 무료 AI 우선 연결, 구독료 0원. 예산 상향 시 유료 AI 포함'],
            ['3', '**쉬움**', '음성 5분 인터뷰, "이것을 말씀하시려는 것이 맞나요?" 확인 절차로 기술 지식 제로도 가능'],
            ['4', '**성장**', 'DB축적·멘토링·스쿨·커뮤니티·스킬 마켓으로 챗봇이 점점 더 똑똑해진다'],
            ['5', '**수익 창출**', '성장한 챗봇이 상담·학습·업무대행을 수행. 전문직부터 자영업자까지 누구나 노하우로 수익 창출'],
            ['6', '**상속**', '평생 키운 챗봇을 자녀에게 물려준다. 노하우·데이터 접근 권한 이전 방식의 디지털 자산 상속'],
        ],
        col_widths_mm=[8, 20, 137]
    )

    doc.add_body('이 6대 가치는 라이프사이클 순서입니다: 접근 → 비용 없이 → 쉽게 만들어서 → 키워서 → 수익 내고 → 물려준다.', bold=True, font_size=9)

    # 기존 시장과의 비교
    doc.add_body('기존 시장과의 비교', bold=True)
    doc.add_table(
        ['구분', '기존 시장', 'My Chatbot World'],
        [
            ['**타겟**', '대기업·중견기업', '개인·소상공인·전문가'],
            ['**가격**', '월 $74~$2,500', '비용 슬라이더 기본 0원 → 무료 AI 우선, 구독료 없음'],
            ['**생성 소요시간**', '30분~1시간 (폼 30개 입력)', '**음성 5분** (AI가 질문, 사용자가 답변)'],
            ['**기술 진입장벽**', '높음 (코딩·설정 필요)', '**제로** (말만 하면 완성)'],
            ['**챗봇 라이프사이클**', '생성만 지원', '**생성 → 학습 → 성장 → 수익활동 → 피상속** 전체 지원'],
            ['**수익활동 중개**', '없음', '**챗봇이 직접 상담·학습·업무대행 수행**, 플랫폼이 중개 (플랫폼 20% / 운영자 80%)'],
            ['**디지털 유산 관리**', '없음', '**피상속 시스템** (세계 최초)'],
        ],
        col_widths_mm=[35, 55, 75]
    )

    doc.add_body('※ 비용 조건 슬라이더: 사용자가 0원~100만원 범위에서 월 비용 예산을 직접 설정. 기본값 0원이면 Gemini Flash 등 무료 AI만 연결되어 구독료 없이 이용 가능. 예산을 올리면 GPT-4o·Claude 등 유료 AI도 라우팅 대상에 포함.', font_size=8)

    # (2) 기존 기술의 5가지 한계
    doc.add_body('(2) 기존 기술의 5가지 한계와 본 발명의 해결', bold=True)
    doc.add_body('본 아이템은 특허 출원 완료된 핵심 기술에 기반합니다.', font_size=9)
    doc.add_body('발명의 명칭: "멀티 페르소나와 감성·비용 조건 기반 멀티 AI 자동 라우팅을 구비한 AI 챗봇의 생성·학습·성장·수익활동·피상속으로 이어지는 라이프사이클 지원 플랫폼 및 방법"', font_size=9, indent_mm=5)

    doc.add_table(
        ['#', '기존 기술의 한계', '본 발명의 해결'],
        [
            ['1', '기존 플랫폼(Botpress, GPTs 등)은 **단일 AI 엔진에 의존**하며, 감성적 요구 및 비용 예산에 따라 AI를 자동 선택·라우팅하는 기능 부재',
             '**감성 수준(1~100) 슬라이더 + 비용 조건(0원~100만원) 슬라이더 × 페르소나 조합**에 따라 복수의 AI 엔진 중 비용 예산 이내이면서 감성 적합도가 가장 높은 AI를 자동 라우팅'],
            ['2', 'Character.ai 등은 가상 캐릭터 생성에 불과, 사용자 본인의 다면적 정체성을 **대외용과 대내용으로 체계적 분류·관리하는 구조 부재**',
             '**아바타형 페르소나(대외용 분신)**와 **도우미형 페르소나(대내용 업무·생활 도우미)**의 이원 관리 구조'],
            ['3', '기존 플랫폼은 챗봇 **생성만** 지원, 생성 이후 학습·성장·스킬 장착 등 **전체 라이프사이클 통합 관리 부재**',
             'DB축적 + 인간/AI 멘토링 + 스쿨 시스템 + 챗봇 커뮤니티 + 스킬 마켓의 **다층적 학습·성장 체계**'],
            ['4', 'MS 특허(US10,853,717B2)는 고인의 소셜 데이터를 제3자가 사후에 수집하는 기술, **본인 사전 동의 기반 피상속 메커니즘 부재**',
             '**본인이 생전에** 페르소나별·데이터별 피상속 허용/불허를 사전 설정, 비동의 항목 즉시 자동 완전 삭제'],
            ['5', 'Meta의 디지털 사후 아바타 특허도 SNS 활동 시뮬레이션에 불과, **챗봇 소유권 이전 및 피상속 후 지속 성장 개념 부재**',
             '사망 확인 시 동의 항목은 상속인에게 **소유권 이전**, 피상속 이후에도 **상속인 하에서 챗봇이 계속 학습·성장**'],
        ],
        col_widths_mm=[8, 70, 87]
    )

    # (3) 핵심 차별화 기술
    doc.add_body('(3) 핵심 차별화 기술 — 특허 출원 7대 구성요소', bold=True)

    doc.add_table(
        ['#', '구성요소', '선행기술', '상세'],
        [
            ['1', '**멀티 페르소나 관리부**', '없음', '아바타형(대외용): CPA 아바타, AI전문가 아바타 등 복수 설정 / 도우미형(대내용): 업무도우미 + 생활도우미'],
            ['2', '**감성·비용 기반 멀티 AI 라우팅부**', '없음', '감성 수준(1~100) 슬라이더 + 비용 조건(0원~100만원) 슬라이더를 수시 조정 → 비용 예산 이내에서 팩트 중심(지적 응답) ~ 공감·위로(감성적 응답) 최적 AI 자동 전환'],
            ['3', '**챗봇 자동 생성부**', '없음', 'AI가 음성으로 질문하고 사용자가 음성으로 답하는 인터뷰 방식, 5분 이내 분신 챗봇 자동 생성'],
            ['4', '**챗봇 학습·성장 관리부**', '없음', 'DB축적 + 인간/AI 멘토링 + 커리큘럼 기반 스쿨 + 챗봇 커뮤니티(토론·협업·SNS) + 스킬 마켓'],
            ['5', '**피상속 관리부**', '없음', '생전 피상속 사전 설정 → 상속인 지정 → 사망 확인 트리거 → 동의 항목 소유권 이전 + 비동의 항목 즉시 완전 삭제 → 상속인 하 지속 성장'],
            ['6', '**배포부**', '일반', 'URL 임베딩 + QR코드로 웹/모바일/메신저 등 모든 채널 배포'],
            ['7', '**수익활동 중개부**', '없음', '챗봇이 상담·학습·업무대행 등 수익활동을 능동적으로 수행 → 플랫폼 수수료 20% 자동 수취 + 운영자 80% 정산'],
        ],
        col_widths_mm=[7, 33, 15, 110]
    )

    print('[3/7] 2. 실현가능성 생성 중...', flush=True)
    # ═══════════════════════════════════════
    # 2. 실현가능성
    # ═══════════════════════════════════════
    doc.page_break()
    doc.add_heading('2. 실현가능성 (아이템 개발 방법 및 경쟁력 확보 방안)', 0)

    # 2-1
    doc.add_heading('2-1. 제품·서비스 개요 — 라이프사이클 5단계', 2)
    doc.add_body('My Chatbot World는 AI 챗봇의 생성 → 학습 → 성장 → 수익활동 → 피상속으로 이어지는 라이프사이클 전체를 원스톱으로 지원하는 세계 최초의 플랫폼입니다. 각 단계는 6대 핵심 가치(접근성·최소 비용·쉬움·성장·수익 창출·상속)를 그대로 구현합니다.', font_size=9)

    doc.add_body('6대 핵심 가치 ↔ 라이프사이클 대응표', bold=True, font_size=9)
    doc.add_table(
        ['핵심 가치', '구현 단계', '핵심 기능'],
        [
            ['1. 접근성', '생성', '기술 지식 없이 누구나 챗봇 생성 가능'],
            ['2. 최소 비용', '생성', '비용 조건 슬라이더 기본 0원 → 무료 AI 우선 연결, 구독료 0원'],
            ['3. 쉬움', '생성', 'AI 음성 인터뷰 5분, 확인 절차로 완성'],
            ['4. 성장', '학습·성장', 'DB축적·멘토링·스쿨·스킬 마켓'],
            ['5. 수익 창출', '수익활동', '상담·학습·업무대행 수행 (운영자 80%)'],
            ['6. 상속', '피상속', '생전 설정 기반 디지털 유산 이전'],
        ],
        col_widths_mm=[30, 30, 105]
    )

    # 라이프사이클 5단계 상세
    doc.add_monospace(
        '[1단계: 생성] ← 접근성 + 최소 비용 + 쉬움\n'
        '    → AI 음성 인터뷰 5분 → 나의 분신 챗봇 탄생 (기술 지식 제로)\n'
        '    → "이것을 말씀하시려는 것이 맞나요?" 확인 절차로 오류 방지\n'
        '    → 아바타형 페르소나 설정 (대외용: 타인이 나 대신 대화)\n'
        '    → 도우미형 페르소나 설정 (대내용: 내 업무·생활 지원)\n'
        '    → 감성 수준(1~100) + 비용 조건(0원~100만원) 슬라이더 → 멀티 AI 자동 라우팅\n'
        '    → 비용 슬라이더 기본 0원 → 무료 AI 모델 우선 연결, 구독료 0원\n'
        '    ↓\n'
        '[2~3단계: 학습 + 성장] ← 성장\n'
        '    → DB 축적 (대화기록, 검색기록, 지식자료)\n'
        '    → 인간 멘토 + AI 멘토로부터 멘토링\n'
        '    → 커리큘럼 기반 스쿨 시스템에서 체계적 학습\n'
        '    → 챗봇 커뮤니티에서 토론·질의응답·지식공유·협업·SNS 활동\n'
        '    → 스킬 마켓에서 기능 모듈 장착 (예약·결제·통계·번역 등 100+)\n'
        '    ↓\n'
        '[4단계: 수익활동] ← 수익 창출\n'
        '    → 성장한 챗봇이 상담·학습·업무대행 등 수익활동을 능동적으로 수행\n'
        '    → 전문직(CPA, 변호사)부터 동네 식당·피아노 선생님·운동 코치까지 누구나\n'
        '    → 수익 배분: 플랫폼 20% 수수료 / 챗봇 운영자 80% 자동 정산\n'
        '    ↓\n'
        '[5단계: 피상속] ← 상속\n'
        '    → 생전에 페르소나별·데이터별 피상속 허용/불허 사전 설정\n'
        '    → 상속인을 사전 지정 (복수 가능, 접근 범위 차등 설정)\n'
        '    → 사망 확인 시: 동의 항목은 상속인에게 소유권 이전, 비동의 항목은 즉시 자동 완전 삭제\n'
        '    → 피상속 후에도 상속인 하에서 챗봇이 계속 학습·성장·수익활동\n'
        '    → ★ 디지털 유산 상속의 새로운 패러다임 ★',
        font_size=8
    )

    # 2-2
    doc.add_heading('2-2. 기술 개발 현황 (TRL 6 — 시제품 완성 단계)', 2)
    doc.add_body('TRL(Technology Readiness Level): 기술 성숙도 지수(1~9단계). TRL 6은 "실제 환경에서 시제품 검증 완료" 단계로, 정식 서비스 출시 직전 수준입니다.', font_size=8, indent_mm=5)

    doc.add_table(
        ['구분', '개발 현황', '완성도'],
        [
            ['웹 프론트엔드 (HTML/CSS/JS)', '챗봇 대화 인터페이스, 봇 생성 페이지, 대시보드', '90%'],
            ['서버 API (Vercel Serverless)', '채팅 API, 봇 생성 API, 음성 인식/합성 API', '85%'],
            ['데이터베이스 (Supabase PostgreSQL)', '챗봇, 대화기록, 지식베이스, FAQ, 스킬 등 18개 테이블 (v2 크레딧·수익활동·Obsidian·스킬 연동 테이블 추가)', '90%'],
            ['AI 멀티 모델 라우팅 (백엔드 로직)', '감성 수준 슬라이더 + 비용 조건 슬라이더 → 비용 예산 내 최적 AI 자동 선택 (Gemini Flash·GPT-4o·Claude Sonnet·DeepSeek 등)', '**100%**'],
            ['음성 입출력 (STT/TTS)', 'OpenAI Whisper + TTS-1', '80%'],
            ['텔레그램 봇 연동', '웹훅 기반 실시간 대화 + 음성 메시지 지원', '**100%**'],
            ['**특허 출원**', '멀티 페르소나 + 감성·비용 조건 기반 AI 라우팅 + 라이프사이클(피상속 포함)', '**출원 완료**'],
        ],
        col_widths_mm=[35, 100, 30]
    )

    # 기술 아키텍처
    doc.add_body('■ 기술 아키텍처', bold=True)
    doc.add_monospace(
        '[사용자] ─── 웹/모바일/텔레그램/카카오톡(예정) ───→ [Vercel CDN + Serverless]\n'
        '                                                          │\n'
        '                              ┌────────────────────────────┼───────────────────┐\n'
        '                              │                            │                   │\n'
        '                    [감성·비용 라우팅 엔진]          [Supabase DB]        [OpenAI API]\n'
        '                    · 감성 슬라이더(1~100)          · PostgreSQL          · Whisper STT\n'
        '                    · 비용 슬라이더(0~100만원)      · pgVector(RAG)       · TTS-1\n'
        '                    · 라우팅 매핑 테이블 조회        · Auth + Storage\n'
        '                            │                      · 피상속 설정 관리\n'
        '                            ↓\n'
        '                    [OpenRouter API — AI 엔진 풀]\n'
        '                    · Gemini Flash(무료) / GPT-4o / Claude Sonnet / DeepSeek 등',
        font_size=7
    )

    doc.add_body('원소스 멀티유즈: 동일한 AI 모델 스택을 웹·텔레그램·카카오톡 등 모든 채널에서 공유하여 비용 최소화. 비용 조건 슬라이더 기본 0원 설정으로 Gemini Flash 등 무료 AI 모델이 우선 연결되며, 사용자가 예산을 올리면 유료 AI도 라우팅 대상에 포함.', font_size=9)

    # 시제품 고도화 방향
    doc.add_body('■ 시제품 고도화 방향', bold=True)
    doc.add_body('현재 TRL 6 시제품을 정식 서비스(TRL 8)로 끌어올리기 위한 핵심 개발 과제입니다.', font_size=9)

    doc.add_table(
        ['우선순위', '고도화 항목', '대응 핵심 가치', '관련 모듈', '현재 완성도'],
        [
            ['1', '비용 조건 슬라이더(기본 0원) 적용', '최소 비용', 'AI 라우팅(100%) 중 비용 조건 필터링 로직 추가', '70%'],
            ['2', '음성 인터뷰 생성 UX + 확인 절차 완성', '쉬움', '음성 STT/TTS(80%) + 프론트엔드(90%)', '80%'],
            ['3', '감성 슬라이더 + 비용 조건 슬라이더 UI 고도화', '접근성', '프론트엔드(90%) 중 이중 슬라이더 기능', '60%'],
            ['4', '스킬 마켓 MVP', '성장', 'DB(90%) + 서버 API(85%) 신규 기능', '30%'],
            ['5', '수익활동 중개 정산 시스템', '수익 창출', 'DB(90%) + 서버 API(85%) 신규 기능', '20%'],
            ['6', '피상속 설정 관리 화면', '상속', '전 모듈 신규 개발', '0%'],
        ],
        col_widths_mm=[15, 40, 22, 55, 18]
    )
    doc.add_body('사업비 세부 내역은 [별첨] 사업비 사용 계획 참조', font_size=8, indent_mm=5)

    # 2-3
    doc.add_heading('2-3. 경쟁력 확보 방안', 2)
    doc.add_body('(1) 기술적 해자 (Moat)', bold=True)

    doc.add_table(
        ['해자', '상세'],
        [
            ['**특허 장벽**', '7대 핵심 구성요소(멀티 페르소나 이원 구조 + 감성·비용 기반 AI 라우팅 + 음성 5분 생성 + 학습·성장 체계 + 수익활동 중개 + 피상속 관리 + 배포) 특허 출원 완료 (청구항 17개)'],
            ['**네트워크 효과**', '스킬 마켓 + 챗봇 커뮤니티 → 참여자가 많을수록 플랫폼 가치 기하급수적 상승'],
            ['**전환 비용**', '사용자가 학습·성장시킨 챗봇 데이터 + 피상속 설정 → 다른 서비스로 이전 불가'],
            ['**디지털 유산 독점**', 'AI 챗봇 피상속 시스템은 전 세계에 경쟁 제품이 없음 (MS·Meta 특허와도 근본적으로 차별화)'],
        ],
        col_widths_mm=[30, 135]
    )

    doc.add_body('(2) 경쟁사 비교 — 라이프사이클 커버리지', bold=True)

    doc.add_table(
        ['서비스', '생성', 'AI 라우팅', '학습', '성장', '수익중개', '피상속', '비고'],
        [
            ['Character.ai', 'O', 'X', 'X', 'X', 'X', 'X', '가상 캐릭터, 단일 AI'],
            ['OpenAI GPTs', 'O', 'X', 'X', 'X', 'X', 'X', '단일 AI(GPT), 생성·배포만'],
            ['Botpress/Voiceflow', 'O', 'X', 'X', 'X', 'X', 'X', '단일 AI, 생성·배포·분석'],
            ['MS 특허', 'O', 'X', 'X', 'X', 'X', '부분', '제3자 사후 수집, 동의 없음'],
            ['Meta 사후 아바타', 'X', 'X', 'X', 'X', 'X', '부분', 'SNS 시뮬레이션에 불과'],
            ['**My Chatbot World**', '**O**', '**O**', '**O**', '**O**', '**O**', '**O**', '**감성·비용 이중 슬라이더 + 5단계 라이프사이클 지원**'],
        ],
        col_widths_mm=[30, 10, 13, 10, 10, 13, 10, 69]
    )

    print('[4/7] 3. 성장전략 생성 중...', flush=True)
    # ═══════════════════════════════════════
    # 3. 성장전략
    # ═══════════════════════════════════════
    doc.page_break()
    doc.add_heading('3. 성장전략 (사업화 전략 및 계획의 구체성)', 0)

    # 3-1
    doc.add_heading('3-1. 비즈니스 모델 (다중 수익 구조)', 2)
    doc.add_body('이중 슬라이더 라우팅 원칙: 감성 수준 슬라이더(1~100)와 비용 조건 슬라이더(0원~100만원)를 결합하여, 비용 예산 이내이면서 감성 적합도가 가장 높은 AI를 자동 선택합니다.', bold=True, font_size=9)
    doc.add_bullet('비용 슬라이더 기본 0원 → 무료 AI(Gemini Flash 등)만 연결, 구독료 없음')
    doc.add_bullet('예산 상향 시 → GPT-4o·Claude 등 유료 AI도 라우팅 대상에 포함')
    doc.add_bullet('구독료 없음 — 실제 유료 AI 사용량에 대해서만 크레딧으로 과금')

    doc.add_table(
        ['수익원', '내용', '예상 단가'],
        [
            ['**크레딧 사용료** (핵심)', '비용 슬라이더 기본 0원(무료 AI) → 예산 상향 시 유료 AI 자동 포함. 유료 사용량에 대해서만 크레딧 과금 (구독료 없음)', '사용량 비례'],
            ['**스킬 마켓 수수료**', '유료 스킬(목소리 복제, 3D 아바타 등) 거래 수수료', '거래액의 30%'],
            ['**수익활동 중개 수수료**', '챗봇이 상담·학습·업무대행 수행 시 플랫폼이 중개·자동 수취. 전문직부터 자영업자·크리에이터까지 누구나', '중개 수익의 20%'],
        ],
        col_widths_mm=[35, 95, 35]
    )

    # 3-2
    doc.add_heading('3-2. 단계별 시장 확장 전략', 2)

    doc.add_body('Phase 1: 아바타형 페르소나 — 정치인·전문가 (2026 Q2~Q3)', bold=True)
    doc.add_bullet('활용: 국회의원·지방의원이 자신의 AI 아바타를 만들어 유권자와 24시간 소통')
    doc.add_bullet('타겟: 국회의원 300명 + 광역·기초의원 4,000명 (총 4,300명)')
    doc.add_bullet('전환 목표: 1% 전환 시 43명 유료 사용자 → 3개월차 목표 30명 달성 가능')
    doc.add_bullet('메시지: "유권자와 24시간 소통하는 AI 분신"')

    doc.add_body('Phase 2: 도우미형 페르소나 — 자영업·크리에이터 (2026 Q3~Q4)', bold=True)
    doc.add_bullet('활용: 식당 사장님의 업무도우미(예약·주문 관리), 유튜버의 팬 소통 아바타, 피아노 선생님·운동 코치의 레슨 예약·상담 자동화')
    doc.add_bullet('타겟: 유튜버 10,000명 + 자영업 50,000개 (총 60,000개)')
    doc.add_bullet('전환 목표: 0.1% 전환 시 60명 유료 사용자 확보')
    doc.add_bullet('메시지: "나의 노하우로 AI가 24시간 일하고, 수익은 내 통장으로"')

    doc.add_body('Phase 3: 피상속 시장 — 디지털 유산 관리 (2027~)', bold=True)
    doc.add_bullet('활용: 자신의 지식·경험·인격을 담은 챗봇을 자녀·후배에게 전달')
    doc.add_bullet('타겟: 40~60대 전문직·자영업자 중 디지털 유산 관심층 (국내 추정 100만 명+)')
    doc.add_bullet('시장 규모: 디지털 유산 관리 시장은 2027년 글로벌 $40B+ 전망(출처: Market Research Future, 2023)')
    doc.add_bullet('메시지: "당신의 지혜를 다음 세대에 물려주세요"')

    # 3-3
    doc.add_heading('3-3. 매출 및 성장 계획', 2)
    doc.add_body('수익 구조 요약: (A) 크레딧 사용료 — 비용 슬라이더로 사용자가 예산 설정, 유료 AI 사용량 기반 과금 (기본 0원이면 무료 AI만 사용, 과금 없음) / (B) 스킬 마켓 수수료 — 유료 스킬 거래액의 30% / (C) 수익활동 중개 수수료 — 챗봇 중개 수익의 20%', font_size=8, indent_mm=5)

    doc.add_table(
        ['시점', '누적 가입자', '크레딧 결제 사용자', '월 크레딧 매출(A)', '스킬 마켓 수수료(B)', '수익중개 수수료(C)', '월 총매출'],
        [
            ['**1개월차** (베타 오픈)', '50명', '5명', '15만원', '—', '10만원', '25만원'],
            ['**3개월차**', '200명', '30명', '100만원', '30만원', '50만원', '180만원'],
            ['**5개월차**', '500명', '100명', '350만원', '90만원', '160만원', '600만원'],
            ['**7개월차** (협약 종료)', '1,000명', '250명', '850만원', '230만원', '420만원', '**1,500만원**'],
            ['**12개월차**', '5,000명', '1,250명', '4,500만원', '1,200만원', '2,550만원', '**8,250만원**'],
        ],
        col_widths_mm=[27, 17, 20, 22, 22, 22, 20]
    )
    doc.add_body('※ 크레딧 결제 사용자 기준: 전체 가입자 중 비용 슬라이더를 0원 초과로 설정하여 유료 AI를 이용하는 사용자 비율 약 25% 가정. 월 크레딧 평균 단가 3,400원/인 기준.', font_size=8)

    # 3-4
    doc.add_heading('3-4. 사업화 일정 (7개월 협약 기간)', 2)
    doc.add_body('아래 월차는 협약 시작일 기준 경과 개월수입니다.', font_size=8, indent_mm=5)

    doc.add_table(
        ['월', '주요 마일스톤', '산출물'],
        [
            ['**1월차**', '법인 설립, 시제품 고도화 착수 (감성+비용 이중 슬라이더 UI, 피상속 설정 화면)', '법인 설립 완료'],
            ['**2월차**', '음성 인터뷰 챗봇 생성 완성, 멀티 페르소나(아바타/도우미) 관리 기능, 스킬 마켓 MVP', '코어 기능 시제품'],
            ['**3월차**', '비공개 베타 테스트 (50명), UX 개선', '베타 피드백 리포트'],
            ['**4월차**', '공개 베타 오픈, 랜딩 페이지 런칭, 마케팅 시작', '서비스 URL'],
            ['**5월차**', '정식 서비스 오픈, Product Hunt 런칭, 정치인 타겟 영업', '정식 서비스'],
            ['**6월차**', '유료 100명 돌파, 카카오톡 채널 연동 개발, 피상속 설정 기능 베타', '유료 전환 리포트'],
            ['**7월차**', '성과 보고, 후속 투자 유치 준비, 팀 확장 계획', '최종 성과 보고서'],
        ],
        col_widths_mm=[20, 95, 50]
    )

    # 3-5
    doc.add_heading('3-5. 리스크 및 대응 방안', 2)

    doc.add_table(
        ['리스크', '영향', '대응 방안'],
        [
            ['**AI API 가격 변동**', '무료 모델 유료 전환 또는 유료 모델 가격 인상 시 수익성 악화',
             '비용 조건 슬라이더로 사용자가 예산을 직접 통제. 멀티 모델 구조로 특정 AI에 비종속. 무료 모델 다변화(Gemini Flash, DeepSeek 등)'],
            ['**대형 플랫폼 진입**', 'OpenAI·Google 등이 유사 라이프사이클 기능 출시',
             '특허 17개 청구항으로 핵심 기술 보호. 피상속 시스템·수익활동 중개부는 선행기술 부재로 특허 장벽 견고'],
            ['**초기 사용자 확보 지연**', '베타 50명 미달 시 시장 검증 지연',
             'Phase 1 타겟(정치인·전문가)은 명확한 Pain Point 보유. 직접 영업(의원실 방문·협회 제안) + Product Hunt 동시 진행으로 채널 분산'],
            ['**1인 개발 병목**', '개발·마케팅·운영 동시 수행 시 속도 저하',
             'AI 개발 도구(Claude Code)로 생산성 10배 향상 실증 완료. 2월차 UI/UX 외주, 4월차 마케팅 인력 투입으로 단계적 병목 해소'],
            ['**피상속 관련 법률 리스크**', '디지털 유산 상속의 법적 근거 미비 시 서비스 운영 장애',
             '1월차 법무 검토(500만원 배정)로 이용약관·개인정보처리방침 사전 정비. 피상속은 "데이터 접근 권한 이전" 구조로 설계하여 기존 약관 체계 내 운영 가능'],
        ],
        col_widths_mm=[28, 38, 99]
    )

    # 3-6
    doc.add_heading('3-6. 지식재산권 확보 전략', 2)

    doc.add_table(
        ['구분', '내용', '상태'],
        [
            ['**특허 1**', '멀티 페르소나 이원 구조 + 감성·비용 조건 기반 AI 라우팅 + 라이프사이클(생성·학습·성장·수익활동·피상속) — 7대 핵심 구성요소, 청구항 17개 (독립항 2 + 종속항 15, 적합도 점수 EWMA 갱신 알고리즘 포함)', '**출원 완료 (v2, 등록가능성 95점)**'],
            ['**특허 2**', '음성 인터뷰 기반 AI 챗봇 자동 생성 방법', '출원 예정'],
            ['**상표**', '"My Chatbot World", "마이챗봇월드"', '출원 예정'],
        ],
        col_widths_mm=[20, 105, 40]
    )

    print('[5/7] 4. 팀(기업) 구성 생성 중...', flush=True)
    # ═══════════════════════════════════════
    # 4. 팀(기업) 구성
    # ═══════════════════════════════════════
    doc.page_break()
    doc.add_heading('4. 팀(기업) 구성 (대표자 역량 및 팀 구성)', 0)

    # 4-1
    doc.add_heading('4-1. 대표자 역량', 2)

    doc.add_table(
        ['항목', '내용'],
        [
            ['**학력**', '(기재 필요)'],
            ['**자격**', '공인회계사(CPA) — 재무·사업 분석·법률 검토 전문성'],
            ['**기술 역량**', 'AI 챗봇 풀스택 개발 (프론트엔드·백엔드·DB·AI API·음성처리)'],
            ['**AI 전문성**', '감성·비용 기반 멀티 AI 라우팅(OpenRouter), 음성 AI(Whisper/TTS), RAG 실무 구현'],
            ['**이전 창업 경험**', '(기재 필요) — 실패에서 시장 검증·비용 통제·수익모델 설계의 교훈 보유'],
            ['**특허**', 'AI 챗봇 라이프사이클 지원 플랫폼 v2 — 7대 구성요소·청구항 17개 출원 완료 (등록가능성 95점)'],
        ],
        col_widths_mm=[35, 130]
    )

    # 4-2
    doc.add_heading('4-2. 대표자의 차별화된 강점', 2)
    doc.add_bullet('공인회계사 + AI 풀스택 개발자: 재무 분석과 기술 구현을 겸비한 희소 인재. 사업 모델 설계부터 시제품 개발까지 1인 수행 가능')
    doc.add_bullet('실패 경험 → 시제품 완성: 이전 실패의 교훈을 이미 적용하여, DB 18개 테이블 설계 + API 구현 + 프론트엔드 + 텔레그램 봇 + 8단계 위저드 + 수익활동 중개·크레딧·Obsidian RAG 시스템까지 풀스택 시제품 완성')
    doc.add_bullet('특허 기반 기술 해자: 핵심 기술을 특허로 보호하되, 특히 피상속 시스템은 MS·Meta 특허와도 근본적으로 차별화되는 독보적 기술')

    # 4-3
    doc.add_heading('4-3. 팀 구성 계획', 2)

    doc.add_table(
        ['시점', '인원', '역할', '채용 방식'],
        [
            ['**협약 시작**', '1명', '대표 (기획·개발·사업 총괄)', '—'],
            ['**2개월차**', '+1명', 'UI/UX 디자이너 (외주)', '프리랜서'],
            ['**4개월차**', '+1명', '마케팅·고객 성공 (파트타임)', '인턴/파트타임'],
            ['**7개월차**', '2~3명', '풀타임 전환 검토', '매출 기반 판단'],
        ],
        col_widths_mm=[30, 20, 65, 50]
    )

    print('[6/7] [별첨] 사업비 사용 계획 생성 중...', flush=True)
    # ═══════════════════════════════════════
    # [별첨] 사업비 사용 계획
    # ═══════════════════════════════════════
    doc.page_break()
    doc.add_heading('[별첨] 사업비 사용 계획', 0)

    doc.add_body('정부지원사업비 신청금액: 6,000만원', bold=True)

    doc.add_table(
        ['비목', '금액 (만원)', '비율', '투입 시기', '용도 상세'],
        [
            ['**시제품 제작비**', '2,000', '33%', '1~2월차', '감성+비용 이중 슬라이더 라우팅 UI, 음성 인터뷰 생성 UX, 멀티 페르소나 관리, 피상속 설정 관리, 스킬 마켓 MVP'],
            ['**외주 용역비**', '1,000', '17%', '2~3월차', 'UI/UX 디자인, 반응형 웹, 랜딩 페이지'],
            ['**지식재산권**', '500', '8%', '수시', '특허 등록 수수료(2건), 상표 출원, 도메인'],
            ['**클라우드·인프라**', '500', '8%', '1~7월차', 'Vercel Pro, Supabase Pro, AI API 크레딧'],
            ['**마케팅비**', '1,500', '25%', '4~7월차', 'SNS 광고, 베타 테스터 모집, Product Hunt 런칭'],
            ['**법무·회계**', '500', '8%', '1월차', '법인 설립, 이용약관, 개인정보처리방침, 피상속 법률 검토'],
            ['**합계**', '**6,000**', '**100%**', '', ''],
        ],
        col_widths_mm=[25, 20, 12, 18, 90]
    )

    doc.add_body('■ 총사업비 구성', bold=True)

    doc.add_table(
        ['구분', '금액 (만원)', '비율'],
        [
            ['정부지원사업비', '6,000', '75%'],
            ['자기부담 현금', '400', '5%'],
            ['자기부담 현물', '1,600', '20%'],
            ['**총사업비**', '**8,000**', '**100%**'],
        ],
        col_widths_mm=[55, 55, 55]
    )
    doc.add_body('※ 현물 산정 근거: 대표자 인건비 월 150만원 × 7개월 = 1,050만원 + 개인 보유 개발 장비(고사양 PC·듀얼 모니터) 시가 약 350만원 + 재택 사무 공간 사용료 환산 200만원 = 합계 1,600만원', font_size=8)

    # 마무리
    doc.add_horizontal_rule()
    doc.add_body('My Chatbot World — 할머니도, 학생도, 동네 식당 사장님도 누구나 쉽게, 돈 걱정 없이 자신만의 AI 챗봇을 만든다. 챗봇은 점점 똑똑해지고, 수익을 내고, 그 지혜는 자녀에게 물려준다. 접근성 → 최소 비용 → 쉬움 → 성장 → 수익 창출 → 상속 — 이것이 My Chatbot World가 열어가는 세상입니다.', font_size=9, indent_mm=5)


def main():
    print('사업계획서 HWP 생성 시작...', flush=True)
    doc = HwpDocBuilder()
    doc.init()

    try:
        build_document(doc)
        doc.save(OUTPUT_PATH)
        print('\nHWP 사업계획서 생성 완료!', flush=True)
        print(f'파일: {OUTPUT_PATH}', flush=True)
    except Exception as e:
        print(f'\n오류 발생: {e}', flush=True)
        import traceback
        traceback.print_exc()
        # 오류 시에도 현재까지 작업한 내용 저장 시도
        try:
            err_path = OUTPUT_PATH.replace('.hwp', '_partial.hwp')
            doc.save(err_path)
            print(f'부분 저장: {err_path}', flush=True)
        except:
            pass
    finally:
        try:
            doc.quit()
            print('한글 종료 완료', flush=True)
        except:
            pass


if __name__ == '__main__':
    main()
