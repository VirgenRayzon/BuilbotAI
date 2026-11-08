const { exec } = require('child_process');

async function testQuery(name, prompt, userProfile = null) {
    console.log(`\n========================================`);
    console.log(`TEST CASE: ${name}`);
    console.log(`Prompt: "${prompt}"`);
    console.log(`========================================`);

    const payload = {
        messages: [
            { 
                id: `msg-${Date.now()}`,
                role: 'user', 
                content: prompt,
                parts: [{ type: 'text', text: prompt }]
            }
        ],
        userProfile: userProfile
    };

    const startTime = Date.now();
    try {
        const response = await fetch('http://localhost:9002/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error(`HTTP Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error(`Response body:`, text);
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let textResult = '';
        let toolInvocations = [];

        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (value) {
                const chunk = decoder.decode(value);
                textResult += chunk;
            }
        }

        const duration = Date.now() - startTime;
        console.log(`Time taken: ${duration}ms`);
        console.log(`Raw stream output length: ${textResult.length} characters`);
        
        const toolCallRegex = /"toolName"\s*:\s*"([^"]+)"/g;
        let match;
        const toolsCalled = [];
        while ((match = toolCallRegex.exec(textResult)) !== null) {
            toolsCalled.push(match[1]);
        }

        if (toolsCalled.length > 0) {
            console.log(`Tools Called:`, [...new Set(toolsCalled)]);
        } else {
            console.log(`Tools Called: None (Pure Conversational)`);
        }

        const lines = textResult.split('\n');
        let answerText = '';
        for (const line of lines) {
            if (line.startsWith('0:"')) {
                try {
                    const jsonStr = line.substring(2);
                    answerText += JSON.parse(jsonStr);
                } catch (e) {
                }
            } else if (line.startsWith('9:{') || line.startsWith('b:{') || line.startsWith('c:{')) {
                try {
                    const jsonStr = line.substring(2);
                    const parsed = JSON.parse(jsonStr);
                    console.log(`Tool Part Info:`, JSON.stringify(parsed, null, 2).substring(0, 300) + '...');
                } catch(e) {}
            }
        }

        console.log(`Response snippet:\n${answerText.trim().substring(0, 400)}...`);

    } catch (err) {
        console.error(`Request failed:`, err);
    }
}

async function runAll() {
    console.log("Starting verification suite...");

    await testQuery("Simple Conversational turn", "Hi there, who are you and what can you do?");

    await testQuery("Hardware specs look up", "what are the specs of Ryzen 5 7600X?");

    await testQuery("Compatibility rules query", "are ATX motherboards compatible with Mini-ITX cases?");

    await testQuery("Live catalog recommendation check", "Recommend some budget-friendly graphics cards under 20000 PHP");

    await testQuery(
        "User profile context injection",
        "Which motherboard would you recommend for me?",
        {
            displayName: "Leo",
            experienceLevel: "Beginner",
            preferences: "I need a budget-friendly motherboard under 6000 PHP for an AMD CPU"
        }
    );
}

runAll();
