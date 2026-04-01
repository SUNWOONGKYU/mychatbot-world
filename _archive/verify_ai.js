// Node 22 native fetch

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually
const envPath = path.join(__dirname, '.env');
let API_KEY = process.env.OPENROUTER_API_KEY;

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const match = envConfig.match(/OPENROUTER_API_KEY=(.*)/);
    if (match) {
        API_KEY = match[1].trim();
    }
}

if (!API_KEY) {
    console.error("❌ ERROR: OPENROUTER_API_KEY not found in .env or environment variables.");
    process.exit(1);
}

async function testModel(model) {
    console.log(`Testing model: ${model}...`);
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://mychatbot.world",
                "X-Title": "My Chatbot World Test"
            },
            body: JSON.stringify({
                "model": model,
                "messages": [{ "role": "user", "content": "Hi" }]
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log(`✅ SUCCESS: ${model} responded.`);
            return true;
        } else {
            console.log(`❌ FAILED: ${model} Error: ${data.error?.message || response.statusText}`);
            return false;
        }
    } catch (e) {
        console.log(`❌ ERROR: ${model} Network: ${e.message}`);
        return false;
    }
}

async function runTests() {
    const models = [
        "google/gemini-2.0-flash-exp:free",
        "google/gemini-2.0-flash-lite-preview-02-05:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "meta-llama/llama-3.1-8b-instruct:free",
        "deepseek/deepseek-chat:free",
        "mistralai/mistral-7b-instruct:free",
        "huggingfaceh4/zephyr-7b-beta:free",
        "openrouter/auto"
    ];

    for (const m of models) {
        await testModel(m);
        await new Promise(r => setTimeout(r, 1000));
    }
}

runTests();
