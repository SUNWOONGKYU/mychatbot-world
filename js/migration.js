/**
 * SunnyBot Persona Definition (Clean Reset)
 * - 분신 아바타 3개
 * - AI 도우미 3개
 */

const SunnyBotData = {
  botName: 'Sunny Bot (분신 아바타 + AI 도우미)',
  botDesc: '써니의 분신 아바타와 AI 도우미로 구성된 개인 AI 시스템입니다.',
  greeting: '안녕하세요! Sunny Bot입니다. 분신 아바타와 AI 도우미 중에서 필요한 페르소나를 선택해주세요!',
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
      a: '분신 아바타와 AI 도우미로 구성되어 있습니다.',
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
  botName: 'Sunny Bot DEMO (분신 아바타 + AI 도우미)',
  greeting: '안녕하세요! Sunny Bot 데모입니다. 분신 아바타와 AI 도우미를 모두 체험해보세요!',
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
      alert('Sunny Bot(분신 아바타 + AI 도우미)이 새로 생성되었습니다.');
      if (typeof location !== 'undefined') location.reload();
    }
  } else if (!silent && typeof alert !== 'undefined') {
    alert('오류: MCW.storage 를 찾을 수 없습니다.');
  }
}

// 버전 기반 강제 리셋: 이 값을 올리면 모든 사용자의 SunnyBot 데이터가 갱신됨
var SUNNY_DATA_VERSION = 'v12.7';

// 페이지 로드시 SunnyBot이 없으면 생성, 있으면 버전 체크 후 강제 업데이트
(function autoInitSunnyBot() {
  if (typeof window === 'undefined') return;
  if (typeof MCW === 'undefined' || !MCW.storage || !MCW.storage.getBots || !MCW.storage.saveBot) return;

  try {
    var storedVersion = localStorage.getItem('mcw_sunny_data_version');
    var bots = MCW.storage.getBots();
    var existingIndex = bots.findIndex(
      function(b) { return b.id === 'sunny-official' || b.username === 'sunny'; }
    );

    if (existingIndex === -1) {
      var initialBot = Object.assign({}, SunnyBotData, {
        id: 'sunny-official',
        username: 'sunny',
        ownerId: 'anonymous',
        created: Date.now(),
        templateId: 'custom',
        likes: 0,
      });
      MCW.storage.saveBot(initialBot);
      localStorage.setItem('mcw_sunny_data_version', SUNNY_DATA_VERSION);
      console.log('[SunnyBot] initial bot created (' + SUNNY_DATA_VERSION + ').');
    } else if (storedVersion !== SUNNY_DATA_VERSION) {
      // 버전 불일치 = 무조건 강제 리프레시 (인코딩 깨짐, 데이터 구조 변경 등 모두 대응)
      var existing = bots[existingIndex];
      var updated = Object.assign({}, existing, {
        botName: SunnyBotData.botName,
        botDesc: SunnyBotData.botDesc,
        greeting: SunnyBotData.greeting,
        personas: SunnyBotData.personas,
        faqs: SunnyBotData.faqs
      });
      MCW.storage.saveBot(updated);
      localStorage.setItem('mcw_sunny_data_version', SUNNY_DATA_VERSION);
      console.log('[SunnyBot] data force-refreshed to ' + SUNNY_DATA_VERSION);
    }
  } catch (e) {
    console.warn('[SunnyBot] auto initialization skipped:', e);
  }
})();



