# AGENTS.md — BuildbotAI Guidelines

> Dedicated context and operating instructions for AI coding agents working on BuildbotAI. Reference standard: [agents.md](https://agents.md).

## Project Overview
BuildbotAI is an AI-powered PC building, compatibility validation, and e-commerce platform tailored for the Philippine market (PHP pricing with USD × 60 conversion).
- **Frontend / Fullstack:** Next.js 15 App Router (React 19, Turbopack)
- **UI & Component System:** Mantine UI v8 (`@mantine/core`, `@mantine/hooks`) + Tailwind CSS v3
- **Backend & Database:** Firebase v11 (Authentication, Cloud Firestore, Cloud Storage, Admin SDK)
- **AI Engine:** Google Genkit v1.28 + Google Gemini API (`@ai-sdk/google`, `@genkit-ai/google-genai`)
- **Testing:** Playwright (`@playwright/test`) + TypeScript strict mode

## Setup & Dev Environment Commands
Run all commands from the repository root:
- **Install dependencies:** `npm install`
- **Start dev server:** `npm run dev` (Runs strictly on **Port `9002`**: `http://localhost:9002/`)
- **Start Genkit AI dev server:** `npm run genkit:dev` (`genkit start -- tsx src/ai/dev.ts`)
- **Watch Genkit AI flows:** `npm run genkit:watch`
- **Update changelog:** `npm run changelog` (`node execution/update_changelog.js`)

## Build & Testing Instructions
Agents must execute relevant programmatic checks and fix failures before completing any task:
- **Typecheck:** `npm run typecheck` (`tsc --noEmit`) — *Must pass with zero errors (enforced by Husky pre-commit)*
- **Lint:** `npm run lint` (`next lint`) — *ESLint and Next.js rules must pass with zero warnings/errors*
- **Production build check:** `npm run build`
- **End-to-End tests:** `npx playwright test` (e.g. `npx playwright test tests/auth-role-navigation.spec.ts`)
- **Automated verification loop:** After modifying files or imports, immediately run `npm run typecheck` and `npm run lint`. Fix any type or linting errors before reporting completion.

## 3-Layer Operating Architecture
1. **Directive (`directives/`):** Standard Operating Procedures (SOPs) defining goals, inputs, tools, and outputs. Consult existing directives before taking action.
2. **Orchestration (Agent Decision-Making):** Intelligent routing and tool execution. Never run probabilistic repetitive actions when deterministic code exists.
3. **Execution (`execution/`):** Testable TypeScript/Python/Node scripts for deterministic data migrations, ingestion, benchmarks, and API calls. Always check `execution/` before writing new one-off scripts.

## Code Style & Architectural Standards
- **TypeScript Strict Mode:** Maintain strict typing without `any`. Validate API payloads and schemas with `zod`.
- **Component Slicing:** Keep components under **300 lines**. Aggressively extract sub-components into modular units.
- **Zero Business Logic in UI:** Encapsulate state, queries, mutation logic, and AI flows in custom hooks (`src/hooks/` or feature-specific hooks like `src/app/admin/hooks/`).
- **Client Environment Variables:** All client-accessible variables must strictly use the `NEXT_PUBLIC_` prefix (e.g., `NEXT_PUBLIC_FIREBASE_*`). Never expose server secrets or admin keys to client code.
- **Data Access Hierarchy:** Verified Knowledge Corpus (`src/knowledge/`) > Firestore Database > Heuristic calculation.

## UI/UX & Mantine Design Standards
- **Mantine UI Clean Aesthetic:** Use `@mantine/core` v8+ primitives (`Paper`, `TextInput`, `PasswordInput`, `Modal`, `Button`, `Stack`, `Group`). Never add artificial neon light bars (`h-1 bg-gradient-to-r`).
- **Strict Light & Dark Mode:**
  - **Light mode:** `bg-white/85` or slate-50 surfaces, `text-slate-900`, `border-slate-200`, `text-slate-600` muted.
  - **Dark mode:** `dark:bg-[#141a23]/90` or `dark:bg-[#111722]`, `dark:text-slate-100`, `dark:border-white/10`, `dark:text-slate-400` muted.
  - Never use hardcoded single-theme text or background colors.
- **Compact Card & Modal Standards:**
  - Modal header and body padding must strictly be **`12px`** (`header: "... p-3"`, `body: "!p-3"`).
  - Inner bordered sub-surfaces and toolbars must maintain **`12px`** (`p-3`) padding.
  - Card surfaces: `Paper` with `withBorder`, `radius="lg"`, `shadow-sm`, and `p={{ base: 'md', sm: 'lg' }}` with `Stack gap="md"`. Avoid bloated padding (`p="xl"`).
  - Container widths: Customer auth `max-w-[440px]`, admin/management forms `max-w-[480px]`. Action links use `whitespace-nowrap`.
- **Mobile-First Responsiveness:**
  - Always style for `< 640px` first, then scale up (`sm:`, `md:`, `lg:`).
  - No fixed pixel widths on containers (use `w-full max-w-...` and `overflow-x-hidden`).
  - Builders and product catalogs must collapse to 1 column on mobile.
  - Builder sidebar converts into a floating action button (FAB) drawer on mobile.
  - Minimum interactive touch target: **`44px`** (`h-11` or `p-3`).
- **Professional Copywriting (Zero Cyberpunk):**
  - Use human e-commerce SaaS tone (Vercel/Stripe/PCPartPicker style).
  - **Forbidden terms:** "Citizen Access", "Neural Link", "Matrix", "Protocol", "Cyber", "Agent Handshake", "Architect Credentials".
  - **Approved substitutions:** "Sign In", "Create Account", "Compatibility Check", "Performance Analysis", "Hardware Verification".

## Hardware Domain Logic & Constraints
- **Compatibility Validation Engine:** Motherboard socket matching (AM4/AM5/LGA1700), RAM DDR generation matching, PSU wattage headroom (total TDP × 1.25), GPU clearance vs PC case max length, CPU cooler clearance.
- **Pricing & Currency Conversion:** Hardware base pricing in USD must convert to Philippine Peso using:
  - Formula: `Price (PHP) = Price (USD) * 60`
- **Sparkle Protocol & AI Grounding:** Managed via skill `buildbot_master` and Genkit hardware vector retriever in `src/lib/vector-retriever.ts`.

## Operational Constraints & Test Credentials
- **Development Port:** Strictly **Port `9002`** (`http://localhost:9002/`). When testing or launching URLs, NEVER default to port 3000.
- **Test Accounts & Credentials:**
  - **Customer / User:** `user@test.com` | `123456`
  - **Manager:** `manager@test.com` | `123456` | Key: `00216764`
  - **Super Admin:** `admin@test.com` | `123456` | Key: `SUPER_ADMIN_123`

## PR & Commit Guidelines
- **Commit Format:** Conventional Commits (e.g. `feat: ...`, `fix: ...`, `chore: ...`, `refactor: ...`).
- **Pre-Commit Checks:** Husky automatically runs `npm run typecheck`. Do not bypass without justification.
- **Pre-Push Automation:** Pushes to `main` automatically run `node execution/update_changelog.js` and `node execution/generate_project_structure.js`.
- **Pre-PR Verification:** Always confirm `npm run typecheck` and `npm run lint` pass cleanly before submitting changes.

## Self-Annealing & Troubleshooting Guidelines
- **Codebase First:** Always consult `docs/project_structure.md` and check `execution/` or `package.json` before writing new scripts or tools.
- **Interactive Alignment (`/grill-me`):** Interview the user to resolve ambiguity before major architectural or design changes.
- **Self-Annealing Loop:** When encountering errors:
  1. Diagnose root cause directly from logs and runtime errors.
  2. Implement deterministic fixes.
  3. Verify locally against dev server on port `9002` (`npm run dev`).
  4. Update the corresponding directive in `directives/` with lessons learned.