import { genkit } from 'genkit';
import { googleAI, vertexAI } from '@genkit-ai/google-genai';

function getServiceAccount() {
  const sa = process.env.FB_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa || sa.trim() === '') return undefined;
  try {
    if (sa.trim().startsWith('{')) {
      return JSON.parse(sa);
    }
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
      ...(sa
        ? {
            googleAuth: {
              credentials: sa,
              scopes: ['https://www.googleapis.com/auth/cloud-platform'],
            },
          }
        : {}),
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
