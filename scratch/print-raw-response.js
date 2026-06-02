async function test() {
    const payload = {
        messages: [
            { 
                id: `msg-${Date.now()}`,
                role: 'user', 
                content: "Recommend 2 GPUs under 30000 PHP and explain why very briefly.",
                parts: [{ type: 'text', text: "Recommend 2 GPUs under 30000 PHP and explain why very briefly." }]
            }
        ],
        userProfile: {
            displayName: "Maria",
            experienceLevel: "Intermediate",
            preferences: "Wants quiet and energy-efficient graphics cards"
        }
    };

    console.log("Sending query to port 9005...");
    try {
        const response = await fetch('http://localhost:9005/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error("HTTP error:", response.status);
            console.error(await response.text());
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;

        console.log("\n--- STREAM START ---");
        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (value) {
                process.stdout.write(decoder.decode(value));
            }
        }
        console.log("\n--- STREAM END ---");

    } catch (e) {
        console.error(e);
    }
}

test();
