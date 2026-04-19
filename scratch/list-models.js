
const https = require('https');
const dotenv = require('dotenv');
dotenv.config();

async function listModels() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("No API key found in .env");
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.models) {
          console.log("Available Models:");
          json.models.forEach(m => console.log(`- ${m.name} (${m.displayName})`));
        } else {
          console.log("Could not retrieve models list:", json);
        }
      } catch (e) {
        console.error("Failed to parse response:", e);
      }
    });
  }).on('error', (err) => {
    console.error("Error fetching models:", err.message);
  });
}

listModels();
