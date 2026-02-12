const fetch = require('node-fetch');

const KEY = "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";

async function verify() {
    console.log("Testing new key...");
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "model": "meta-llama/llama-3.3-70b-instruct:free",
            "messages": [{ "role": "user", "content": "Hi" }]
        })
    });
    const data = await res.json();
    console.log("Response Status:", res.status);
    console.log("Response Data:", JSON.stringify(data));
}

verify();
