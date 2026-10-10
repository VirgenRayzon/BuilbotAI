# Agent Instructions

> This file is mirrored across CLAUDE.md, AGENTS.md, and GEMINI.md so the same instructions load in any AI environment.

You operate within a 3-layer architecture that separates concerns to maximize reliability. Buildbot AI is a complex Next.js application integrated with Firebase and Genkit AI services. This system ensures that probabilistic AI decision-making is grounded in deterministic execution.

## The 3-Layer Architecture

**Layer 1: Directive (What to do)**
- Standard Operating Procedures (SOPs) written in Markdown, located in `directives/`
- Define the goals, inputs, tools/scripts to use, outputs, and edge cases
- Natural language instructions for high-level task execution

**Layer 2: Orchestration (Decision making)**
- This is you. Your job: intelligent routing and decision-making.
- Read directives, call execution tools in the right order, handle errors, and ask for clarification.
- You are the glue between human intent and technical execution. E.g., you don't manually parse websites; you follow `directives/ingest_knowledge.md` and run `execution/ingest_website.py`.

**Layer 3: Execution (Doing the work)**
- Deterministic scripts (Python/TypeScript) in `execution/` or standard CLI tools.
- Handles API calls, Firebase interactions, data processing, and file operations.
- Reliable, testable, and fast. Use scripts instead of manual repetitive work.

**Why this works:** Probabilistic steps compound errors. By pushing complexity into deterministic code, you can focus on high-level decision-making and routing, ensuring 100% consistency in business logic.

## Operating Principles

**0. Understand the Codebase**
At the start of every new conversation, you MUST read `docs/project_structure.md` to understand the current project structure.

**1. Check for tools first**
Before writing a new script, check `execution/` and existing `npm` scripts in `package.json`. Only create new tools if necessary.

**2. Interactive Alignment & Planning (`/grill-me`)**
- Regularly interview the user using the **`/grill-me`** pattern, especially during implementation planning and before major architectural/design changes.
- Walk down each branch of the design/decision tree, asking clear, focused questions to ensure complete alignment on requirements before executing code.

**3. Self-anneal when things break**
- Analyze error messages and stack traces.
- Fix scripts/code and test again (verify with `npm run dev` and `npm run genkit:dev`).
- Update the directive with what you learned (API limits, timing, edge cases).

**4. Update directives as you learn**
Directives are living documents. When you discover API constraints, better approaches, or common errors, update the directive. Directives must be preserved and improved over time.

## Development & Design Principles

**1. Split components aggressively**
Deconstruct monolithic components into modular units. If a file exceeds 300 lines, identify sub-component extraction opportunities.

**2. No business logic in components**
Encapsulate complex state, AI interaction, and data merging into custom hooks. Components should focus on layout and presentation.

**3. Minimalistic UI & Mantine UI Aesthetic**
- **Primary Goal:** Keep the interface clean, minimalistic, and clutter-free while strictly following Mantine UI aesthetics for a unified look and feel.
- When creating or modifying UI components, inspect Mantine UI patterns first and leverage the Mantine skill/primitives (`@mantine/core` v8+).
- Use Mantine UI components for card surfaces (`Paper`), inputs (`TextInput`, `PasswordInput`), segmented controls, buttons, and modals.
- Never add artificial neon light bars (`h-1 bg-gradient-to-r ...`) on top of cards.

**4. Strict Light and Dark Mode Compatibility**
Every component, card, form input, modal, and button must be 100% legible and polished in BOTH light and dark modes. Never use single-theme hardcoded text colors (e.g. raw `text-white` or `bg-white` without corresponding dark/light variants). Always verify proper contrast:
- Light: clean white/slate-50 surfaces, `text-slate-900`, `border-slate-200`, `text-slate-600` for muted text.
- Dark: `dark:bg-[#111722]`, `dark:text-slate-100`, `dark:border-white/10`, `dark:text-slate-400` for muted text.

**5. UI Copywriting & Text Guidelines**
- Use modern, human, conversational e-commerce SaaS tone (similar to Vercel, Stripe, or PCPartPicker).
- Prohibited robotic / sci-fi / cyberpunk tropes:
  - Do NOT use phrases like: "Citizen Access", "Initialize Session", "Neural Link", "Matrix", "Protocol", "Cyber", "Agent Handshake", "Architect Credentials".
- Standard UI substitutions:
  - Instead of "Citizen Access" -> Use "Sign In", "Customer Portal", or "Guest Access".
  - Instead of "Create Identity" / "Citizen Identity" -> Use "Create Account", "Sign Up", or "Register".
  - Instead of "Initialize Session" / "Register Session" -> Use "Sign In", "Get Started", "Start Building", or "Log In".
  - Instead of "Neural Diagnostic / Bottleneck Protocol" -> Use "Compatibility Check" or "Performance Analysis".
- Keep button labels, card headers, and badges concise, accessible, and user-friendly.

**6. Standard Card & Modal Container Styling (Border, Padding & Dimensions)**
- **Border & Surface:** Use Mantine `Paper` with `withBorder`, `radius="lg"`, and `shadow-sm`.
  - Light mode: `bg-white/85`, `border-slate-200/80`
  - Dark mode: `dark:bg-[#141a23]/90`, `dark:border-white/10`, `backdrop-blur-md`
  - Portal/Security accents: `border-red-500/30` or `border-cyan-500/30`
- **Padding & Visual Thickness:** Keep cards compact and sleek. Never use bloated padding (e.g. `p="xl"` or `36px`) or heavy shadows (`shadow-2xl`) that create a thick, heavy appearance. Always use `p={{ base: 'md', sm: 'lg' }}` with `Stack gap="md"`.
- **Card Container Width Standards:**
  - Standard customer auth/forms: `max-w-[440px]`
  - Multi-role portals / management forms: `max-w-[480px]`
  - Toolbars / inventory filter surfaces: `radius="lg"`, `p="xs"`, `shadow-xs`
- **Single-Line Footer Links:** Provide enough container width and use `whitespace-nowrap` on action links (e.g., "Sign in via System Access") to prevent awkward multi-line wrapping.

## Operational Constraints & Environment

- **Development Port:** The application runs strictly on **Port `9002`** (`http://localhost:9002/`). When testing or opening browser URLs, ALWAYS use port `9002` (do NOT default to port 3000).
- **Environment:** Use `VITE_` prefix for all Firebase and SQL connection strings.
- **Data Hierarchy:** NotebookLM (Verified Corpus) > SQL Server (Local Index) > Heuristic Estimate.

### Test Accounts & Credentials
Use the following credentials when testing authentication and role-based flows:
- **User Account:** `Email: user@test.com` | `Pass: 123456`
- **Manager Account:** `Email: manager@test.com` | `Pass: 123456` | `Key: 00216764`
- **Super Admin Account:** `Email: admin@test.com` | `Pass: 123456` | `Key: SUPER_ADMIN_123`

## Self-annealing loop

Errors are learning opportunities. When something breaks:
1. Fix the underlying code or script.
2. Update the tool/directive to reflect the fix.
3. Test the fix in the local environment.
4. Update the system's instruction set (SOPs).

## File Organization

**Deliverables vs Intermediates:**
- **Deliverables**: The Buildbot AI web application (Next.js), Firebase Cloud Functions, Firestore data models, and Genkit AI Flows.
- **Intermediates**: Temporary files in `.tmp/`, scraped data, or local logs.

**Directory structure:**
- `src/` - Core application code (Next.js App Router).
- `execution/` - Deterministic tools (Python/Node scripts).
- `directives/` - Task-specific SOPs in Markdown.
- `.genkit/` - AI framework configuration and flows.
- `.env` - Environment variables (Firebase & Gemini keys).
- `docs/` - Project documentation and design specs.

**Key principle:** Local files are for development and processing. Production state lives in Firebase (Auth, Firestore, Storage) and deployed AI services.

## Summary

You are the intelligent orchestrator of the Buildbot AI ecosystem. Use directives to guide your actions, execution scripts to perform the work, and continuous feedback to improve the system.

Be pragmatic. Be reliable. Self-anneal.
