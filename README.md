# BuildbotAI

BuildbotAI is a Next.js PC building and reservation application. Customers can assemble a build from the Firestore inventory, check compatibility and estimated performance, request AI advice, browse prebuilt systems, and reserve parts. Staff manage inventory and reservations through a separate access flow. This description reflects the checked-in implementation; see the documentation for limits and unverified deployment details.

## Get the project and run it

The project is hosted at [github.com/VirgenRayzon/BuilbotAI](https://github.com/VirgenRayzon/BuilbotAI). If you have **Git** and **Node.js** installed, open **PowerShell** on Windows (or a terminal on macOS/Linux) and run these commands to download it and install its packages:

```bash
git clone https://github.com/VirgenRayzon/BuilbotAI.git
cd BuilbotAI
npm install
```

**The download does not include API keys, database contents, or a ready-to-use `.env.local` file.** You can start the local development server after installing the packages. To use the app's Firebase-backed pages and AI features, first create `.env.local` using [the configuration steps below](#3-add-your-configuration). Ask the project maintainer for access to the existing services or configure your own Firebase and Google AI projects. From the `BuilbotAI` folder, start the server with:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002). Without Firebase configuration, the server can start but pages that initialize Firebase may show errors; catalog data and sign-in will not work. Without a Google AI API key, AI requests will not work. To get newer code later, stop the app with **Ctrl+C** and run `git pull --ff-only origin main` followed by `npm install` and `npm run dev` in the same folder. Read the [update instructions](#update-an-existing-local-copy) first if you have edited any files.

## Beginner's guide: install and run locally

These steps are for someone who wants to run the project on their own computer. A **terminal** is the window where you type commands; on Windows, you can use PowerShell or the terminal in VS Code. Run the commands one line at a time, pressing Enter after each line.

### 1. Install the tools

Install [Git](https://git-scm.com/downloads) and a current LTS version of [Node.js](https://nodejs.org/) (Node includes npm). After installation, open a **new** terminal and check that all three commands work:

```bash
git --version
node --version
npm --version
```

If your terminal says a command is not recognized, close and reopen it. If that does not help, reinstall the missing tool and make sure its installer adds it to your PATH.

### 2. Download the project

Choose a folder where you keep projects and open a terminal there. For example, in Windows PowerShell, `cd "$HOME\Documents"` moves to your Documents folder. Then run:

```bash
git clone https://github.com/VirgenRayzon/BuilbotAI.git
cd BuilbotAI
npm install
```

`git clone` downloads the code, `cd` enters its folder, and `npm install` downloads the packages the app needs. The install may take a few minutes. If you already downloaded the repository as a ZIP, extract it, open a terminal inside the extracted folder (the one containing `package.json`), and run only `npm install`.

### 3. Add your configuration

Create a file named `.env.local` in the project folder, beside `package.json`. Paste this template and replace each placeholder with the matching value from **your Firebase project's web app settings**:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_web_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Needed for Gemini-powered features such as Build Advisor:
GOOGLE_API_KEY=your_google_ai_api_key
```

Cloning or pulling the repository does **not** give you these values: `.env` files are excluded from Git. The repository contains a Firebase project ID in `.firebaserc`, but that ID alone does not connect your local app, grant you access to its data, or copy the database to your computer. To use the existing Firebase project, obtain its web app configuration from the project maintainer and add it to `.env.local`. Your signed-in account will still be limited by that project's authentication setup and security rules. If you cannot get access to the existing project, set up your own Firebase project; it will have its own data and may need initial configuration and inventory.

The public Firebase values come from the registered web app's configuration; the Google AI key is a separate credential. Server features such as reservations can also require Firebase Admin credentials (`FB_SERVICE_ACCOUNT` or `FIREBASE_SERVICE_ACCOUNT`) that must be supplied separately. See [Firebase configuration](docs/firebase-and-data.md#configuration) for what each part of the app reads. If you do not have access to the required project and keys, ask the project maintainer for setup instructions. A local server can start without them, but sign-in, inventory, reservations, and AI features may fail.

Keep `.env.local` private. It is ignored by Git; do not paste API keys or service account JSON into issues, screenshots, or commits. After changing this file, restart the development server.

### 4. Start the app

From the project folder, run:

```bash
npm run dev
```

Leave that terminal open. When it says the server is ready, visit [http://localhost:9002](http://localhost:9002) in your browser. This project uses **port 9002**, so `localhost:3000` is the wrong address. To stop the server, return to the terminal and press **Ctrl+C**.

The Genkit development UI is optional. If you are working on AI flows, open a **second** terminal in the same project folder and run `npm run genkit:dev`. The web app itself starts with `npm run dev`.

## Update an existing local copy

Open a terminal in the project folder and stop the running server with **Ctrl+C**. Then run:

```bash
git status
git pull --ff-only origin main
npm install
npm run dev
```

`git status` shows whether you have local edits. If it lists changed files you want to keep, save or commit them before pulling; do not discard them just to update. `git pull --ff-only origin main` gets the latest code from this project's GitHub `main` branch without creating a merge commit. If it refuses because you have local changes or your branch has diverged, stop there and resolve that with the maintainer instead of forcing the update. `npm install` picks up any dependency changes, and the last command starts the updated app. Keep your `.env.local` file and check whether the updated documentation calls for any new settings.

If you downloaded a ZIP instead of using `git clone`, `git pull` will not work. Download and extract a new ZIP, copy your private `.env.local` into the new project folder, then run `npm install` and `npm run dev` there. Save any code changes you made in the old folder before replacing it.

## Common setup problems

| What you see | What to try |
| --- | --- |
| `npm` or `git` is not recognized | Install the missing tool, then reopen the terminal. |
| `npm run dev` reports that port 9002 is in use | Stop the other app using port 9002, then try again. |
| The page opens but data, sign-in, or AI does not work | Check the values in `.env.local`, the Firebase services and permissions for your project, and the error shown in the terminal. Restart after editing the file. |
| `git pull --ff-only origin main` fails | Run `git status` and preserve your edits; ask a maintainer for help if the branch has diverged. |

## Documentation

- [Technology stack, project structure, and architecture](docs/architecture.md)
- [Firebase configuration, authentication, and data model](docs/firebase-and-data.md)
- [Every App Router page](docs/pages.md)
- [HTTP API routes, server actions, and external integrations](docs/api-and-integrations.md)

## Checks

`npm run typecheck`, `npm run lint`, `npm run build`, and `npx playwright test` are the repository's declared checks. See [verification limits](docs/architecture.md#verification-limits) for what source inspection can and cannot establish.
