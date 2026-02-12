const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../js/config.js');
const apiKey = process.env.OPENROUTER_API_KEY;

if (apiKey) {
    const content = `const CONFIG = { OPENROUTER_API_KEY: "${apiKey}" };\n`;
    fs.writeFileSync(configPath, content);
    console.log("✅ js/config.js generated from Environment Variables.");
} else {
    console.warn("⚠️ OPENROUTER_API_KEY not found in Environment Variables. Skipping config generation.");
}
