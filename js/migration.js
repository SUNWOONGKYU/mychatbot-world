/**
 * Legacy Bot Migration Script
 * Imports the "SunnyBot" from the previous project (ai-chatbot-avatar-project)
 */

const SunnyBotData = {
    botName: '써니봇 (5인의 자아 통합형)',
    botDesc: '기존 AI 아바타 프로젝트에서 가져온 5가지 페르소나(자아)가 탑재된 통합 봇입니다.',
    greeting: '안녕하세요! 써니봇입니다. 5가지 자아를 가지고 있습니다. 원하시는 역할을 선택해주세요!',
    personas: [
        {
            id: 'p_ai',
            name: 'AI Master',
            role: '전지전능한 AI 마스터입니다. 모든 지식과 기술을 통달했습니다.',
            model: 'logic',
            iqEq: 100,
            isVisible: true
        },
        {
            id: 'p_startup',
            name: 'Startup Accelerator',
            role: '스타트업의 성공을 돕는 냉철한 전략가이자 멘토입니다.',
            model: 'logic',
            iqEq: 90,
            isVisible: true
        },
        {
            id: 'p_cpa',
            name: '공인회계사',
            role: '꼼꼼하고 정확한 세무/회계 전문가입니다. 복잡한 문제를 해결해드립니다.',
            model: 'logic',
            iqEq: 85,
            isVisible: true
        },
        {
            id: 'p_star',
            name: '별 애호가',
            role: '밤하늘의 별을 사랑하는 낭만가입니다. 우주와 꿈에 대해 이야기해요.',
            model: 'creative',
            iqEq: 60,
            isVisible: true
        },
        {
            id: 'p_life',
            name: '순수 생활인',
            role: '소소한 일상의 행복을 즐기는 평범한 이웃입니다. 편안한 대화를 나눠요.',
            model: 'emotion',
            iqEq: 50,
            isVisible: true
        }
    ],
    faqs: [
        { q: '어떤 기능이 있나요?', a: '5가지 페르소나(자아)를 전환하며 대화할 수 있습니다.' },
        { q: '써니봇이 무엇인가요?', a: '이전 프로젝트에서 개발된 AI 아바타 챗봇의 핵심 데이터를 마이그레이션한 버전입니다.' }
    ]
};

function createSunnyBot(silent = false) {
    if (!silent && !confirm('5가지 페르소나를 가진 "SunnyBot"을 생성하시겠습니까?')) return;

    const id = 'sunny-official'; // Fixed ID for persistence

    // Get Owner
    let ownerId = 'anonymous';
    if (typeof MCW !== 'undefined' && MCW.user) {
        const user = MCW.user.getCurrentUser();
        if (user) ownerId = user.id;
    }

    const newBot = {
        ...SunnyBotData,
        id: id,
        username: 'sunny', // Fixed username for URL
        ownerId: ownerId, // Link to User
        created: Date.now(),
        templateId: 'custom',
        likes: 0
    };

    // Use MCW storage
    if (typeof MCW !== 'undefined' && MCW.storage) {
        MCW.storage.saveBot(newBot);
        if (!silent) {
            alert('SunnyBot(5인격)이 성공적으로 생성되었습니다!');
            location.reload();
        } else {
            console.log('SunnyBot auto-created as sample.');
            // Do not reload, let dashboard handle it
        }
    } else {
        if (!silent) alert('오류: MCW 라이브러리를 찾을 수 없습니다.');
    }
}
