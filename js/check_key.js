(function () {
    console.log("%c[DIAGNOSTIC] check_key.js Loaded", "color: blue; font-weight: bold;");

    // Check CONFIG
    if (typeof CONFIG !== 'undefined') {
        console.log("[DIAGNOTSIC] CONFIG object found.", CONFIG);
        if (CONFIG.OPENROUTER_API_KEY) {
            console.log("[DIAGNOTSIC] CONFIG.OPENROUTER_API_KEY exists. Length:", CONFIG.OPENROUTER_API_KEY.length);
        } else {
            console.error("[DIAGNOTSIC] CONFIG.OPENROUTER_API_KEY is MISSING or EMPTY.");
        }
    } else {
        console.error("[DIAGNOTSIC] CONFIG object is UNDEFINED. config.js may not have loaded.");
    }

    // Check localStorage
    const stored = localStorage.getItem('mcw_openrouter_key');
    console.log("[DIAGNOTSIC] localStorage 'mcw_openrouter_key':", stored ? (stored.substring(0, 10) + "...") : "NULL");

    // Check Secrets (for local)
    if (typeof MCW_SECRETS !== 'undefined') {
        console.log("[DIAGNOTSIC] MCW_SECRETS object found.");
    } else {
        console.log("[DIAGNOTSIC] MCW_SECRETS object not found (Expected in Production).");
    }
})();
