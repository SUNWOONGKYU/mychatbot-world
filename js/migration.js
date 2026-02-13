/**
 * SunnyBot Persona Definition (Clean Reset)
 * - 분신 아바타 3개
 * - AI 도우미 3개
 */

const SunnyBotData = {
  botName: 'Sunny Bot (분신 아바타 3 + AI 도우미 3)',
  botDesc: '써니의 분신 아바타 3개와 AI 도우미 3개로 구성된 개인 AI 시스템입니다.',
  greeting: '안녕하세요! Sunny Bot입니다. 분신 아바타 3개와 AI 도우미 3개 중에서 지금 쓰고 싶은 역할을 선택해주세요!',
  personas: [
    // 분신 아바타 3개
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
    },
    // AI 도우미 3개
    {
      id: 'sunny_helper_work',
      name: 'Claude Messenger',
      role: '클로드 소대와 연결되어 업무 지시를 전달하고, 처리 결과를 다시 알려주는 AI 메신저입니다.',
      model: 'logic',
      iqEq: 70,
      isVisible: true,
      category: 'helper',
      helperType: 'claude',
      isPublic: false,
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
    },
  ],
  faqs: [
    {
      q: '어떤 구조로 되어 있나요?',
      a: '분신 아바타 3개와 AI 도우미 3개로 구성되어 있습니다.',
    },
    {
      q: 'Sunny Bot이 무엇인가요??',
      a: '써니의 일을 대신하고 도와주는 분신 아바타 세계입니다.',
    },
  ],
};

// 전역으로 노출해서 아무 데서나 쓸 수 있게 함
if (typeof window !== 'undefined') {
  window.SunnyBotData = SunnyBotData;
}


// 데모용 SunnyBot (5개 페르소나 모두 공개)
const SunnyDemoBotData = {
  ...SunnyBotData,
  botName: 'Sunny Bot DEMO (분신 아바타 3 + AI 도우미 3)',
  greeting: '안녕하세요! Sunny Bot 데모입니다. 분신 아바타 3개와 AI 도우미 3개를 모두 체험해보세요!',
  personas: SunnyBotData.personas.map(p => ({
    ...p,
    // 데모에서는 도우미까지 모두 공개
    isPublic: true
  }))
};

if (typeof window !== 'undefined') {
  window.SunnyDemoBotData = SunnyDemoBotData;
}

/**
 * SunnyBot를 MCW.storage에 저장하는 함수
 */
function createSunnyBot(silent = false) {
  const id = 'sunny-official';

  let ownerId = 'anonymous';
  if (typeof MCW !== 'undefined' && MCW.user && MCW.user.getCurrentUser) {
    const user = MCW.user.getCurrentUser();
    if (user) ownerId = user.id;
  }

  const newBot = {
    ...SunnyBotData,
    id,
    username: 'sunny',
    ownerId,
    created: Date.now(),
    templateId: 'custom',
    likes: 0,
  };

  if (typeof MCW !== 'undefined' && MCW.storage && MCW.storage.saveBot) {
    MCW.storage.saveBot(newBot);
    if (!silent && typeof alert !== 'undefined') {
      alert('Sunny Bot(분신 아바타 3 + AI 도우미 3)이 새로 생성되었습니다.');
      if (typeof location !== 'undefined') location.reload();
    }
  } else if (!silent && typeof alert !== 'undefined') {
    alert('오류: MCW.storage 를 찾을 수 없습니다.');
  }
}

// 페이지 로드시 SunnyBot이 없으면 생성, 있으면 페르소나 업데이트
(function autoInitSunnyBot() {
  if (typeof window === 'undefined') return;
  if (typeof MCW === 'undefined' || !MCW.storage || !MCW.storage.getBots || !MCW.storage.saveBot) return;

  try {
    const bots = MCW.storage.getBots();
    const existingIndex = bots.findIndex(
      (b) => b.id === 'sunny-official' || b.username === 'sunny',
    );

    if (existingIndex === -1) {
      const initialBot = {
        ...SunnyBotData,
        id: 'sunny-official',
        username: 'sunny',
        ownerId: 'anonymous',
        created: Date.now(),
        templateId: 'custom',
        likes: 0,
      };
      MCW.storage.saveBot(initialBot);
      console.log('[SunnyBot] initial bot created in localStorage.');
    } else {
      const existing = bots[existingIndex];
      const hasClaudeMessenger = existing.personas && existing.personas.some(function (p) { return p.id === 'sunny_helper_work' && p.name === 'Claude Messenger'; });
      const hasNewWorkHelper = existing.personas && existing.personas.some(function (p) { return p.id === 'sunny_helper_work2'; });
      const needUpdate = !hasClaudeMessenger || !hasNewWorkHelper;

      if (needUpdate) {
        const updated = Object.assign({}, existing, { personas: SunnyBotData.personas });
        MCW.storage.saveBot(updated);
        console.log('[SunnyBot] personas updated to latest definition.');
      }
    }
  } catch (e) {
    console.warn('[SunnyBot] auto initialization skipped:', e);
  }
})();



