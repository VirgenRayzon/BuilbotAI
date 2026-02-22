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

The application requires environment variables to connect to Firebase. You should have a `.env` file in the root of your project with the following content, populated with your Firebase project credentials:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
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
