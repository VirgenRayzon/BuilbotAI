import 'dotenv/config';

async function testNv() {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + process.env.NVIDIA_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'meta/llama-3.3-70b-instruct',
            messages: [{ role: 'user', content: 'Say hello world in valid JSON { "msg": "..." }' }],
            response_format: { type: 'json_object' },
            max_tokens: 100
        })
    });

    const data = await res.json();
    console.dir(data, { depth: null });
}

testNv();
