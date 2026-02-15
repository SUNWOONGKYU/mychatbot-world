/**
 * SunnyBot — 실제 유저 소유 봇 (wksun999@gmail.com)
 * ID: 'sunny-official'
 * helper 페르소나는 isPublic: false (소유자만 사용)
 */

const SunnyBotData = {
  // Step 1: 기본정보
  botName: 'Sunny Bot',
  botDesc: '써니의 분신 아바타와 AI 도우미로 구성된 개인 AI 시스템입니다.',
  username: 'sunny',

  // Step 4: AI 분석 결과 — top-level (대표 페르소나 기준)
  greeting: '안녕하세요! Sunny Bot입니다. 페르소나를 선택해주세요!',
  faqs: [
    { q: '어떤 구조로 되어 있나요?', a: '분신 아바타와 AI 도우미로 구성되어 있습니다.' },
    { q: 'Sunny Bot이 무엇인가요?', a: '써니의 일을 대신하고 도와주는 분신 아바타 세계입니다.' },
  ],

  // Step 2: 페르소나 설정 (대면용 + 도우미)
  personas: [
    // 대면용 아바타 3개 (공개)
    {
      id: 'sunny_avatar_ai',
      name: 'AI Master',
      role: '써니의 전반적인 AI 전략과 사고를 담당하는 분신 아바타입니다.',
      model: 'logic',
      iqEq: 100,
      isVisible: true,
      category: 'avatar',
      helperType: null,
      isPublic: true,
      greeting: '안녕하세요. Sunny Bot의 AI Master입니다. 정확하고 전문적인 답변으로 도와드리겠습니다.',
      faqs: [
        { q: 'AI 전략을 세워주세요', a: '' },
        { q: 'AI 도구 추천해주세요', a: '' },
        { q: 'AI 트렌드 알려주세요', a: '' },
      ],
    },
    {
      id: 'sunny_avatar_startup',
      name: 'Startup Accelerator',
      role: '스타트업 사업계획, 피치덱, 투자전략을 돕는 분신 아바타입니다.',
      model: 'logic',
      iqEq: 90,
      isVisible: true,
      category: 'avatar',
      helperType: null,
      isPublic: true,
      greeting: '안녕하세요. Sunny Bot의 Startup Accelerator입니다. 사업 전략을 함께 고민하겠습니다.',
      faqs: [
        { q: '사업계획서 도와주세요', a: '' },
        { q: '투자 전략 알려주세요', a: '' },
        { q: '피치덱 검토해주세요', a: '' },
      ],
    },
    {
      id: 'sunny_avatar_cpa',
      name: '공인회계사',
      role: '세무·회계·재무제표를 돕는 전문 아바타입니다.',
      model: 'logic',
      iqEq: 85,
      isVisible: true,
      category: 'avatar',
      helperType: null,
      isPublic: true,
      greeting: '안녕하세요. Sunny Bot의 공인회계사입니다. 세무·회계 관련 질문에 답변드리겠습니다.',
      faqs: [
        { q: '세금 관련 질문이 있어요', a: '' },
        { q: '재무제표 분석해주세요', a: '' },
        { q: '절세 방법 알려주세요', a: '' },
      ],
    },
    // 도우미 3개 (비공개 — 소유자만)
    {
      id: 'sunny_helper_work',
      name: 'Claude Messenger',
      role: '클로드 소대와 연결되어 업무 지시를 전달하고, 처리 결과를 다시 알려주는 AI 메신저입니다.',
      model: 'logic',
      iqEq: 70,
      isVisible: true,
      category: 'helper',
      helperType: 'work',
      isPublic: false,
      greeting: '안녕하세요! Claude Messenger입니다. 업무 지시를 전달해주세요.',
      faqs: [
        { q: '업무 지시 전달해줘', a: '' },
        { q: '처리 결과 알려줘', a: '' },
        { q: '진행 상황 확인해줘', a: '' },
      ],
    },
    {
      id: 'sunny_helper_work2',
      name: '업무 도우미',
      role: '일정·할 일·프로젝트를 정리하고 업무를 관리해주는 AI 도우미입니다.',
      model: 'logic',
      iqEq: 68,
      isVisible: true,
      category: 'helper',
      helperType: 'work',
      isPublic: false,
      greeting: '안녕하세요! 업무 도우미입니다. 무엇을 도와드릴까요?',
      faqs: [
        { q: '오늘 일정 알려줘', a: '' },
        { q: '이메일 초안 작성해줘', a: '' },
        { q: '회의 요약해줘', a: '' },
      ],
    },
    {
      id: 'sunny_helper_life',
      name: '생활 도우미',
      role: '생활 루틴, 건강, 감정, 가계부를 함께 관리해주는 AI 도우미입니다.',
      model: 'emotion',
      iqEq: 60,
      isVisible: true,
      category: 'helper',
      helperType: 'life',
      isPublic: false,
      greeting: '안녕하세요! 생활 도우미예요. 편하게 말씀해 주세요.',
      faqs: [
        { q: '오늘 날씨 어때?', a: '' },
        { q: '근처 맛집 추천해줘', a: '' },
        { q: '건강 팁 알려줘', a: '' },
      ],
    },
  ],

  // Step 3: 인터뷰 텍스트
  inputText: '안녕하세요, 써니입니다. AI 전략과 스타트업 컨설팅을 전문으로 하고 있습니다. 공인회계사 자격을 보유하고 있으며, 세무·회계 분야에서도 전문 상담이 가능합니다. 평소 클로드 AI를 활용해 업무를 처리하고, 일정과 생활도 AI 도우미와 함께 관리하고 있습니다.',

  // Step 5: 완성 메타
  createdAt: '2025-01-01T00:00:00.000Z',
};

if (typeof window !== 'undefined') {
  window.SunnyBotData = SunnyBotData;
}

// 버전 기반 강제 리셋
var SUNNY_DATA_VERSION = 'v15.0';

// 페이지 로드 시 실제 SunnyBot 생성/업데이트 + 유저 연결
(function autoInitSunnyBot() {
  if (typeof window === 'undefined') return;
  if (typeof MCW === 'undefined' || !MCW.storage || !MCW.storage.getBots || !MCW.storage.saveBot) return;

  try {
    var storedVersion = localStorage.getItem('mcw_sunny_data_version');
    var bots = MCW.storage.getBots();
    var existingIndex = bots.findIndex(function(b) {
      return b.id === 'sunny-official' || b.username === 'sunny';
    });

    // 현재 로그인 유저
    var ownerId = 'anonymous';
    if (MCW.user && MCW.user.getCurrentUser) {
      var user = MCW.user.getCurrentUser();
      if (user) ownerId = user.id;
    }

    if (existingIndex === -1) {
      // 최초 생성
      var initialBot = Object.assign({}, SunnyBotData, {
        id: 'sunny-official',
        username: 'sunny',
        ownerId: ownerId,
        created: Date.now(),
        likes: 0,
      });
      MCW.storage.saveBot(initialBot);
      localStorage.setItem('mcw_sunny_data_version', SUNNY_DATA_VERSION);
      console.log('[SunnyBot] created (' + SUNNY_DATA_VERSION + ') owner: ' + ownerId);
    } else {
      var existing = bots[existingIndex];
      var needUpdate = false;

      // 버전 불일치 → 데이터 리프레시
      if (storedVersion !== SUNNY_DATA_VERSION) {
        Object.assign(existing, {
          botName: SunnyBotData.botName,
          botDesc: SunnyBotData.botDesc,
          username: SunnyBotData.username,
          greeting: SunnyBotData.greeting,
          faqs: SunnyBotData.faqs,
          personas: SunnyBotData.personas,
          inputText: SunnyBotData.inputText,
          createdAt: SunnyBotData.createdAt,
        });
        needUpdate = true;
      }

      // ownerId가 admin/anonymous이면 현재 유저에 연결
      if (ownerId !== 'anonymous' && (!existing.ownerId || existing.ownerId === 'anonymous' || existing.ownerId === 'admin')) {
        existing.ownerId = ownerId;
        needUpdate = true;
      }

      if (needUpdate) {
        MCW.storage.saveBot(existing);
        localStorage.setItem('mcw_sunny_data_version', SUNNY_DATA_VERSION);
        console.log('[SunnyBot] updated to ' + SUNNY_DATA_VERSION + ', owner: ' + existing.ownerId);
      }
    }

    // 데모 봇은 sunny-demo.js가 담당
  } catch (e) {
    console.warn('[SunnyBot] init skipped:', e);
  }
})();
