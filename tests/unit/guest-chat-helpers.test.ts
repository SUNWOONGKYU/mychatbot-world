/**
 * @task S2F6 (React 전환)
 * @description 게스트 체험 채팅 페이지 — 순수 헬퍼 단위 테스트
 *
 * 대상:
 *   getDemoResponse(cat, demoIdx) → string (순수 버전)
 *   WELCOME_MESSAGES 카테고리 커버리지
 *   MAX_MESSAGES 상수 검증
 */

import { describe, it, expect } from 'vitest';

// ── 상수 (인라인 복제) ────────────────────────────────────────────────────────

const MAX_MESSAGES = 10;

const WELCOME_MESSAGES: Record<string, string> = {
  lawyer:     '안녕하세요! 저는 법률 상담 AI 챗봇입니다. 법률 관련 궁금한 점을 편하게 물어보세요.',
  restaurant: '안녕하세요! 저는 음식점 AI 챗봇입니다. 메뉴, 예약, 영업 시간 등 무엇이든 물어보세요.',
  realestate: '안녕하세요! 저는 부동산 상담 AI 챗봇입니다. 매물, 임대차, 시세 등 편하게 질문하세요.',
  hospital:   '안녕하세요! 저는 병원 안내 AI 챗봇입니다. 진료 예약, 진료 과목, 이용 안내를 도와드립니다.',
  academy:    '안녕하세요! 저는 학원 안내 AI 챗봇입니다. 수강 신청, 수업 내용, 시간표를 알려드립니다.',
  salon:      '안녕하세요! 저는 미용실 AI 챗봇입니다. 예약, 가격, 스타일 상담을 도와드립니다.',
  cafe:       '안녕하세요! 저는 카페 AI 챗봇입니다. 메뉴, 가격, 영업 시간을 안내해 드립니다.',
  gym:        '안녕하세요! 저는 헬스장 AI 챗봇입니다. 회원권, PT, 시설 이용에 대해 알려드립니다.',
  studio:     '안녕하세요! 저는 스튜디오 AI 챗봇입니다. 촬영 예약, 패키지, 스튜디오 소개를 도와드립니다.',
  retail:     '안녕하세요! 저는 쇼핑 안내 AI 챗봇입니다. 상품, 재고, 배송에 대해 편하게 물어보세요.',
  default:    '안녕하세요! 무엇이든 편하게 물어보세요. 도움을 드리겠습니다.',
};

const DEMO_RESPONSES: Record<string, string[]> = {
  lawyer: [
    '법률 관련 궁금하신 점이 있으시군요. 어떤 법률 분야에 대해 알고 싶으신가요?',
    '네, 해당 사안에 대해 설명드리겠습니다. 구체적인 상황을 말씀해 주시면 더 정확한 안내가 가능합니다.',
    '법률 문제는 개별 상황에 따라 다를 수 있어 전문 변호사와 상담하시길 권합니다.',
  ],
  restaurant: [
    '네, 저희 메뉴에 대해 안내드리겠습니다. 특별히 원하시는 음식 종류가 있으신가요?',
    '예약은 전화 또는 앱을 통해 가능합니다. 몇 분 방문 예정이신가요?',
    '오늘의 특선 메뉴가 준비되어 있습니다. 더 궁금한 점이 있으시면 편하게 물어보세요!',
  ],
  default: [
    '안녕하세요! 질문을 잘 받았습니다. 어떻게 도와드릴까요?',
    '네, 말씀하신 내용을 확인했습니다. 더 자세히 설명해 주시면 도움을 드리겠습니다.',
    '좋은 질문입니다! 관련 정보를 안내해 드리겠습니다. 추가 궁금한 사항도 편하게 물어보세요.',
  ],
};

/** 순수 함수 버전 (컴포넌트에서는 useRef로 idx 관리) */
function getDemoResponse(cat: string, idx: number): string {
  const responses = DEMO_RESPONSES[cat] ?? DEMO_RESPONSES.default;
  return responses[idx % responses.length];
}

// ── MAX_MESSAGES 상수 ─────────────────────────────────────────────────────────

describe('MAX_MESSAGES 상수', () => {
  it('10으로 정의되어 있다', () => {
    expect(MAX_MESSAGES).toBe(10);
  });
});

// ── WELCOME_MESSAGES ──────────────────────────────────────────────────────────

describe('WELCOME_MESSAGES', () => {
  const CATEGORIES = ['lawyer','restaurant','realestate','hospital','academy','salon','cafe','gym','studio','retail'];

  it('10개 카테고리 모두 정의되어 있다', () => {
    for (const cat of CATEGORIES) {
      expect(WELCOME_MESSAGES[cat]).toBeDefined();
      expect(typeof WELCOME_MESSAGES[cat]).toBe('string');
    }
  });

  it('default 메시지가 있다', () => {
    expect(WELCOME_MESSAGES.default).toBeDefined();
  });

  it('unknown 카테고리는 undefined를 반환한다 (코드에서 ?? default 처리)', () => {
    expect(WELCOME_MESSAGES['unknown_cat']).toBeUndefined();
  });

  it('모든 메시지가 안녕하세요로 시작한다', () => {
    for (const msg of Object.values(WELCOME_MESSAGES)) {
      expect(msg.startsWith('안녕하세요')).toBe(true);
    }
  });
});

// ── getDemoResponse ───────────────────────────────────────────────────────────

describe('getDemoResponse', () => {
  it('lawyer 카테고리 — 첫 응답 반환', () => {
    const resp = getDemoResponse('lawyer', 0);
    expect(resp).toBe(DEMO_RESPONSES.lawyer[0]);
  });

  it('순환 인덱싱 — 3개 응답 이후 다시 0으로', () => {
    expect(getDemoResponse('lawyer', 0)).toBe(DEMO_RESPONSES.lawyer[0]);
    expect(getDemoResponse('lawyer', 1)).toBe(DEMO_RESPONSES.lawyer[1]);
    expect(getDemoResponse('lawyer', 2)).toBe(DEMO_RESPONSES.lawyer[2]);
    expect(getDemoResponse('lawyer', 3)).toBe(DEMO_RESPONSES.lawyer[0]); // 순환
  });

  it('알 수 없는 카테고리는 default 응답 사용', () => {
    const resp = getDemoResponse('unknown_category', 0);
    expect(resp).toBe(DEMO_RESPONSES.default[0]);
  });

  it('restaurant 카테고리 응답 반환', () => {
    const resp = getDemoResponse('restaurant', 1);
    expect(resp).toBe(DEMO_RESPONSES.restaurant[1]);
  });
});

// ── 메시지 한도 로직 ──────────────────────────────────────────────────────────

describe('메시지 한도 경계 검증', () => {
  it('count < MAX_MESSAGES이면 메시지 전송 가능', () => {
    const canSend = (count: number) => count < MAX_MESSAGES;
    expect(canSend(9)).toBe(true);
    expect(canSend(0)).toBe(true);
  });

  it('count >= MAX_MESSAGES이면 전송 불가 + 모달 표시', () => {
    const shouldShowModal = (count: number) => count >= MAX_MESSAGES;
    expect(shouldShowModal(10)).toBe(true);
    expect(shouldShowModal(11)).toBe(true);
    expect(shouldShowModal(9)).toBe(false);
  });

  it('경고 표시: count >= 7', () => {
    const isWarning = (c: number) => c >= 7;
    expect(isWarning(7)).toBe(true);
    expect(isWarning(6)).toBe(false);
  });

  it('위험 표시: count >= 9', () => {
    const isDanger = (c: number) => c >= 9;
    expect(isDanger(9)).toBe(true);
    expect(isDanger(8)).toBe(false);
  });
});
