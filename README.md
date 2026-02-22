# Buildbot AI

This is a Next.js starter project for Buildbot AI, an application that helps users build custom PCs with AI assistance.

## Getting Started

To run this application locally, you'll need to have [Node.js](https://nodejs.org/) (version 18 or later) and npm installed.

### 1. Install Dependencies

Open your terminal, navigate to the project directory, and run the following command to install all the necessary packages:

```bash
npm install
```

### 2. Set Up Environment Variables

The application requires environment variables for Firebase and its AI features. You should have a `.env` file in the root of your project. Add the following content, populated with your credentials:

```
# Firebase Credentials (get from your Firebase project settings)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Gemini API Key for AI features (get from https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Run the Development Servers

This project requires two separate processes to run concurrently: the Next.js front-end and the Genkit AI backend.

#### Terminal 1: Run the Web App

In your first terminal, run the following command to start the Next.js development server:

```bash
npm run dev
```

Your application will be available at [http://localhost:9002](http://localhost:9002).

#### Terminal 2: Run the AI Services

For the AI-powered features (like the Build Advisor) to work, you need to run the Genkit development server. Open a second terminal and run:

```bash
npm run genkit:dev
```

This will start the AI flows, making them available to your Next.js application.

You're all set! You can now access the application in your browser and start building.

### Troubleshooting

**AI Features Not Working?**

If you're seeing errors like "Could not connect to the AI service," make sure you have the Genkit development server running. In a separate terminal from your `npm run dev` process, you must run `npm run genkit:dev`. Both servers need to be running at the same time for the application to function correctly.

If you see an error about a missing `GEMINI_API_KEY`, ensure you have set it up correctly in the `.env` file as described in the "Set Up Environment Variables" section.
