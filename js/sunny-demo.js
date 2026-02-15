/**
 * Sunny Bot DEMO — SunnyBotData에서 자동 복제
 * 실제 봇 데이터가 바뀌면 데모도 자동 반영
 * 차이점: 모든 페르소나가 isPublic: true (체험용)
 */
(function() {
  if (typeof SunnyBotData === 'undefined') return;

  var SunnyDemoBotData = Object.assign({}, SunnyBotData, {
    botName: SunnyBotData.botName + ' DEMO',
    greeting: SunnyBotData.greeting.replace('Sunny Bot', 'Sunny Bot 데모'),
    personas: SunnyBotData.personas.map(function(p) {
      return Object.assign({}, p, {
        id: p.id.replace('sunny_', 'demo_'),
        isPublic: true
      });
    })
  });

  window.SunnyDemoBotData = SunnyDemoBotData;

  // localStorage에 데모 봇 등록
  if (typeof MCW !== 'undefined' && MCW.storage && MCW.storage.getBots) {
    var bots = MCW.storage.getBots();
    var demoIndex = bots.findIndex(function(b) { return b.id === 'sunny-demo'; });
    var demoBot = Object.assign({}, SunnyDemoBotData, {
      id: 'sunny-demo',
      username: 'sunny-demo',
      ownerId: '_system',
    });

    if (demoIndex === -1) {
      demoBot.created = Date.now();
      MCW.storage.saveBot(demoBot);
    } else {
      // 실제 봇 데이터 변경 시 데모도 동기화
      demoBot.created = bots[demoIndex].created || Date.now();
      MCW.storage.saveBot(demoBot);
    }
  }
})();
