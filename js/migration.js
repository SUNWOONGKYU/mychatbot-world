/**
 * Legacy Bot Migration Script
 * Imports the "SunnyBot" from the previous project (ai-chatbot-avatar-project)
 */

const SunnyBotData = {
    botName: "½á´Ïº¿ (ºÐ½Å ¾Æ¹ÙÅ¸ 3 + AI µµ¿ì¹Ì 2)",
    botDesc: "½á´ÏÀÇ ºÐ½Å ¾Æ¹ÙÅ¸ 3°³¿Í AI µµ¿ì¹Ì 2°³·Î ±¸¼ºµÈ °³ÀÎ AI ½Ã½ºÅÛÀÔ´Ï´Ù.",
    greeting: "¾È³çÇÏ¼¼¿ä! ½á´Ïº¿ÀÔ´Ï´Ù. ºÐ½Å ¾Æ¹ÙÅ¸ 3°³¿Í AI µµ¿ì¹Ì 2°³ Áß¿¡¼­ Áö±Ý ¾²°í ½ÍÀº ¿ªÇÒÀ» ¼±ÅÃÇØÁÖ¼¼¿ä!",
    personas: [
        {
            id: "p_ai",
            name: "AI Master",
            role: "½á´ÏÀÇ Àü¹ÝÀûÀÎ AI Àü·«°ú »ç°í¸¦ ´ã´çÇÏ´Â ºÐ½Å ¾Æ¹ÙÅ¸ÀÔ´Ï´Ù.",
            model: "logic",
            iqEq: 100,
            isVisible: true,
            category: "avatar",
            helperType: null,
            isPublic: true
        },
        {
            id: "p_startup",
            name: "Startup Accelerator",
            role: "½ºÅ¸Æ®¾÷ »ç¾÷°èÈ¹, ÇÇÄ¡µ¦, ÅõÀÚÀü·«À» µ½´Â ºÐ½Å ¾Æ¹ÙÅ¸ÀÔ´Ï´Ù.",
            model: "logic",
            iqEq: 90,
            isVisible: true,
            category: "avatar",
            helperType: null,
            isPublic: true
        },
        {
            id: "p_cpa",
            name: "°øÀÎÈ¸°è»ç",
            role: "¼¼¹«¡¤È¸°è¡¤Àç¹«Á¦Ç¥¸¦ µ½´Â Àü¹® ¾Æ¹ÙÅ¸ÀÔ´Ï´Ù.",
            model: "logic",
            iqEq: 85,
            isVisible: true,
            category: "avatar",
            helperType: null,
            isPublic: true
        },
        {
            id: "p_star",
            name: "¾÷¹« µµ¿ì¹Ì",
            role: "ÀÏÁ¤¡¤ÇÒ ÀÏ¡¤ÇÁ·ÎÁ§Æ®¸¦ Á¤¸®ÇÏ°í ¾÷¹«¸¦ °ü¸®ÇØÁÖ´Â ºñ¼­ÀÔ´Ï´Ù.",
            model: "logic",
            iqEq: 70,
            isVisible: true,
            category: "helper",
            helperType: "work",
            isPublic: false
        },
        {
            id: "p_life",
            name: "»ýÈ° µµ¿ì¹Ì",
            role: "»ýÈ° ·çÆ¾, °Ç°­, °¨Á¤, °¡°èºÎ¸¦ ÇÔ²² °ü¸®ÇØÁÖ´Â ºñ¼­ÀÔ´Ï´Ù.",
            model: "emotion",
            iqEq: 60,
            isVisible: true,
            category: "helper",
            helperType: "life",
            isPublic: false
        }
    ],
    faqs: [
        { q: "¾î¶² ±â´ÉÀÌ ÀÖ³ª¿ä?", a: "5°¡Áö Æä¸£¼Ò³ª(ÀÚ¾Æ)¸¦ ÀüÈ¯ÇÏ¸ç ´ëÈ­ÇÒ ¼ö ÀÖ½À´Ï´Ù." },
        { q: "½á´Ïº¿ÀÌ ¹«¾ùÀÎ°¡¿ä?", a: "ÀÌÀü ÇÁ·ÎÁ§Æ®¿¡¼­ °³¹ßµÈ AI ¾Æ¹ÙÅ¸ Ãªº¿ÀÇ ÇÙ½É µ¥ÀÌÅÍ¸¦ ¸¶ÀÌ±×·¹ÀÌ¼ÇÇÑ ¹öÀüÀÔ´Ï´Ù." }
    ]
};

function createSunnyBot(silent = false) {
    if (!silent && !confirm('5ê°€ì§€ ?˜ë¥´?Œë‚˜ë¥?ê°€ì§?"SunnyBot"???ì„±?˜ì‹œê² ìŠµ?ˆê¹Œ?')) return;

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
            alert('SunnyBot(5?¸ê²©)???±ê³µ?ìœ¼ë¡??ì„±?˜ì—ˆ?µë‹ˆ??');
            location.reload();
        } else {
            console.log('SunnyBot auto-created as sample.');
            // Do not reload, let dashboard handle it
        }
    } else {
        if (!silent) alert('?¤ë¥˜: MCW ?¼ì´ë¸ŒëŸ¬ë¦¬ë? ì°¾ì„ ???†ìŠµ?ˆë‹¤.');
    }
}

// ÆäÀÌÁö¿¡¼­ migration.js¸¦ ºÒ·¯¿À±â¸¸ ÇØµµ
// SunnyBot(°ø½Ä º¿)ÀÌ ÇÑ ¹ø ÀÚµ¿ »ý¼ºµÇµµ·Ï ¿¬°áÇØÁØ´Ù.
(function autoCreateSunnyBotOnce() {
    if (typeof window === 'undefined') return;
    if (typeof MCW === 'undefined' || !MCW.storage) return;

    try {
        const bots = MCW.storage.getBots();
        const exists = bots.some(b => b.id === 'sunny-official' || b.username === 'sunny');

        // ¾ÆÁ÷ SunnyBotÀÌ ¾øÀ¸¸é Á¶¿ëÈ÷ ÇÑ ¹ø¸¸ »ý¼º
        if (!exists) {
            createSunnyBot(true);
            console.log('[Migration] SunnyBot(official) auto-created from legacy data.');
        }
    } catch (e) {
        console.warn('[Migration] SunnyBot auto-create skipped:', e);
    }
})();





