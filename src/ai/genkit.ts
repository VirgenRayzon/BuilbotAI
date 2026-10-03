import { genkit } from 'genkit';
import { googleAI, vertexAI } from '@genkit-ai/google-genai';

function getServiceAccount() {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) return undefined;
  try {
    return JSON.parse(Buffer.from(sa, 'base64').toString('utf8'));
  } catch {
    return undefined;
  }
}

const sa = getServiceAccount();

export const ai = genkit({
  plugins: [
    googleAI(),
    vertexAI({
      projectId: sa?.project_id || 'studio-3150054754-c7d0b',
      location: process.env.GOOGLE_VERTEX_LOCATION || 'us-central1',
      ...(sa ? { googleAuth: { credentials: sa } } : {}),
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
