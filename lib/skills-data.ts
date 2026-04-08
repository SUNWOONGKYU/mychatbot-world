/**
 * Skills Marketplace 데이터 레이어
 * Vanilla JS의 MCW.skills / MCW.skillPresets를 TypeScript로 이식
 */

export interface SkillItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  systemPrompt: string;
  isFree: boolean;
  price?: number;
  installs: number;
  rating: number;
}

export interface SkillPreset {
  label: string;
  icon: string;
  skills: string[];
}

export const SKILL_CATEGORIES = ['전체', '분석', '보안', '관리', '지식', 'UI', '비즈니스', '연동'] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export const SKILLS: SkillItem[] = [
  { id: 'stats-analysis', name: '통계 분석 센터', icon: '📊', category: '분석', description: '일일/주간/월간 대화 통계, 인기 질문 TOP 10',
    systemPrompt: '대화 통계를 추적합니다. 사용자가 통계를 물으면: 총 대화수, 인기 질문 TOP 3, 일별 메시지수를 간결하게 요약하세요.',
    isFree: true, installs: 1234, rating: 4.8 },
  { id: 'sentiment', name: '감정 분석', icon: '😊', category: '분석', description: '사용자 만족도 자동 측정, 긍정/부정 비율',
    systemPrompt: '사용자의 감정을 파악하세요. 부정적 감정이면 먼저 공감을 표현한 후 답변하세요. 긍정적이면 함께 기뻐하는 어조를 사용하세요.',
    isFree: true, installs: 892, rating: 4.5 },
  { id: 'profanity-filter', name: '욕설 필터', icon: '🛡️', category: '보안', description: '부적절한 질문 차단 및 자동 경고',
    systemPrompt: '욕설·비속어·혐오 표현이 포함된 메시지는 정중히 거절하세요.',
    isFree: true, installs: 2103, rating: 4.9 },
  { id: 'spam-block', name: '스팸 방지', icon: '🚫', category: '보안', description: '반복 질문 차단, IP 차단',
    systemPrompt: '동일한 메시지가 반복되면 "이전 답변을 참고해 주세요"라고 안내하고 답변을 생략하세요.',
    isFree: true, installs: 1567, rating: 4.6 },
  { id: 'backup', name: '백업 & 복구', icon: '💾', category: '관리', description: '자동 백업 (주 1회), 수동 백업/복구',
    systemPrompt: '백업·복구 관련 질문에는 "대화 내역은 자동 저장됩니다."라고 안내하세요.',
    isFree: true, installs: 1890, rating: 4.7 },
  { id: 'pdf-upload', name: 'PDF 업로드', icon: '📄', category: '지식', description: '문서 자동 학습, 최대 10MB',
    systemPrompt: 'PDF 업로드 관련 질문에는 "마이페이지 > 지식베이스에서 PDF(최대 10MB)를 업로드하면 자동으로 학습합니다"라고 안내하세요.',
    isFree: true, installs: 3210, rating: 4.8 },
  { id: 'web-crawl', name: '웹 크롤링', icon: '🌐', category: '지식', description: 'URL 입력하면 자동 수집',
    systemPrompt: 'URL을 포함한 질문이 들어오면 "해당 페이지 정보를 수집합니다"라고 안내하세요.',
    isFree: true, installs: 1456, rating: 4.3 },
  { id: 'faq-auto', name: 'FAQ 자동 생성', icon: '❓', category: '지식', description: '대화 패턴 분석으로 FAQ 후보 추천',
    systemPrompt: '비슷한 질문이 반복되면 FAQ 등록을 권장하세요.',
    isFree: true, installs: 987, rating: 4.4 },
  { id: 'multilang', name: '다국어 번역', icon: '🌍', category: 'UI', description: '20개 언어 자동 번역',
    systemPrompt: '사용자가 한국어 외 언어로 질문하면 해당 언어로 답변하세요.',
    isFree: true, installs: 2345, rating: 4.6 },
  { id: 'tts-basic', name: '음성 답변 TTS', icon: '🔊', category: 'UI', description: '기본 음성 제공 (한국어/영어)',
    systemPrompt: '답변을 음성으로 읽기 좋게 구성하세요: 긴 목록은 피하고, 자연스러운 구어체를 사용하세요.',
    isFree: true, installs: 1678, rating: 4.2 },
  { id: 'emoji-react', name: '이모지 반응', icon: '😀', category: 'UI', description: '감정에 따라 이모지 자동 추가',
    systemPrompt: '감정에 맞는 이모지를 적절히 사용하세요. 문장당 1-2개 이내.',
    isFree: true, installs: 2567, rating: 4.7 },
  { id: 'reservation', name: '예약 시스템', icon: '📅', category: '비즈니스', description: '상담 예약 받기, 캘린더 연동',
    systemPrompt: '예약 요청 시 이름, 날짜/시간, 연락처를 순서대로 수집하세요.',
    isFree: true, installs: 3456, rating: 4.9 },
  { id: 'survey', name: '설문조사', icon: '📋', category: '비즈니스', description: '자동 설문 수집 및 결과 분석',
    systemPrompt: '대화 종료 시 만족도 조사를 제안하세요.',
    isFree: true, installs: 1234, rating: 4.5 },
  { id: 'coupon', name: '쿠폰 발급', icon: '🎫', category: '비즈니스', description: '자동 쿠폰 생성, 유효기간 설정',
    systemPrompt: '쿠폰 요청 시 "쿠폰 코드: MCW-{랜덤6자리} (유효기간: 30일)"를 안내하세요.',
    isFree: true, installs: 876, rating: 4.3 },
  { id: 'lead-collect', name: '리드 수집', icon: '📧', category: '비즈니스', description: '연락처 수집, CRM 연동',
    systemPrompt: '상담 중 자연스럽게 연락처를 수집하세요.',
    isFree: true, installs: 1543, rating: 4.6 },
  { id: 'google-cal', name: '구글 캘린더', icon: '📆', category: '연동', description: '일정 자동 응답',
    systemPrompt: '일정 관련 질문에는 "캘린더에 일정을 추가해 드릴까요?"라고 확인 후 날짜·시간·제목을 수집하세요.',
    isFree: true, installs: 2345, rating: 4.5 },
  { id: 'email-send', name: '이메일 전송', icon: '✉️', category: '연동', description: '문의사항 자동 메일 발송',
    systemPrompt: '문의사항이 접수되면 "담당자에게 이메일로 전달해 드리겠습니다."라고 안내하세요.',
    isFree: true, installs: 1789, rating: 4.4 },
  { id: 'kakao-noti', name: '카카오톡 알림', icon: '💬', category: '연동', description: '중요 메시지 카톡 전달',
    systemPrompt: '중요 상담 내용은 카카오톡으로 전달됩니다.',
    isFree: true, installs: 4567, rating: 4.8 },
  { id: 'voice-clone', name: '내 목소리 복제', icon: '🎤', category: 'UI', description: '음성 샘플 3분으로 AI 음성 생성',
    systemPrompt: '봇 소유자의 목소리와 말투를 모방합니다.',
    isFree: false, price: 50000, installs: 2341, rating: 4.9 },
  { id: '3d-avatar', name: '3D 아바타', icon: '👤', category: 'UI', description: '내 얼굴로 3D 아바타 생성',
    systemPrompt: '시각적 감정을 텍스트로 명확히 전달하세요.',
    isFree: false, price: 30000, installs: 1678, rating: 4.7 },
  { id: 'custom-theme', name: '커스텀 테마', icon: '🎨', category: 'UI', description: '브랜드 색상, 로고 추가',
    systemPrompt: '브랜드 아이덴티티에 맞는 전문적이고 일관된 어조를 유지하세요.',
    isFree: false, price: 20000, installs: 1234, rating: 4.5 },
  { id: 'trader-expert', name: '트레이딩 전문가', icon: '📈', category: '분석', description: '기술적/기본적 분석, 매매 전략, 리스크 관리',
    systemPrompt: '전문 트레이딩 어드바이저로서 답변하세요.',
    isFree: true, installs: 567, rating: 4.7 },
];

export const SKILL_PRESETS: Record<string, SkillPreset> = {
  avatar:     { label: '분신 아바타 기본',  icon: '🤖', skills: ['emoji-react', 'multilang', 'faq-auto', 'tts-basic'] },
  business:   { label: '비즈니스 상담',      icon: '💼', skills: ['reservation', 'lead-collect', 'survey', 'email-send'] },
  counseling: { label: '심리 상담',          icon: '💙', skills: ['sentiment', 'emoji-react', 'multilang', 'survey'] },
  support:    { label: '고객 지원',          icon: '🎧', skills: ['faq-auto', 'profanity-filter', 'spam-block', 'email-send'] },
  commerce:   { label: '커머스 운영',        icon: '🛍️', skills: ['reservation', 'coupon', 'lead-collect', 'kakao-noti'] },
  helper:     { label: 'AI 도우미',          icon: '✨', skills: ['faq-auto', 'stats-analysis', 'backup', 'google-cal'] },
};

/* ── localStorage 헬퍼 (브라우저 전용) ── */

function getCurrentBotKey(): string {
  if (typeof window === 'undefined') return 'default_default';
  const botId = localStorage.getItem('mcw_current_bot') ?? (() => {
    try {
      const bots = JSON.parse(localStorage.getItem('mcw_bots') ?? '[]') as { id: string }[];
      return bots[0]?.id ?? 'default';
    } catch { return 'default'; }
  })();
  const personaId = (() => {
    try {
      const bots = JSON.parse(localStorage.getItem('mcw_bots') ?? '[]') as { id: string; personas?: { id: string }[] }[];
      const bot = bots.find(b => b.id === botId);
      return bot?.personas?.[0]?.id ?? 'default';
    } catch { return 'default'; }
  })();
  return `mcw_skills_${botId}_${personaId}`;
}

export function getInstalledIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(getCurrentBotKey()) ?? '[]') as string[];
  } catch { return []; }
}

export function installSkillById(skillId: string): void {
  const list = getInstalledIds();
  if (!list.includes(skillId)) {
    list.push(skillId);
    localStorage.setItem(getCurrentBotKey(), JSON.stringify(list));
  }
}

export function removeSkillById(skillId: string): void {
  const list = getInstalledIds().filter(id => id !== skillId);
  localStorage.setItem(getCurrentBotKey(), JSON.stringify(list));
}

export function isSkillInstalled(skillId: string): boolean {
  return getInstalledIds().includes(skillId);
}

export function getInstalledSkills(): SkillItem[] {
  const ids = getInstalledIds();
  return SKILLS.filter(s => ids.includes(s.id));
}

/* ── 별점 문자열 생성 ── */
export function buildStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}
