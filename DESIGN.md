# Design System: BuildbotAI

This document serves as the "source of truth" for the visual identity, copywriting style, and design language of BuildbotAI.

## 1. Visual Theme & Atmosphere
The design follows a **Sleek Tech & Immersive** aesthetic. The atmosphere is **technical yet premium**, utilizing high-contrast elements, refined glassmorphism, and vibrant accents to create a trustworthy, high-performance experience.
- **Mood**: Precise, Professional, Modern SaaS, Trustworthy, and Accessible.
- **Density**: Comfortable with ample whitespace to ensure focus on complex hardware specifications.
- **Visual Styles**: Clean glassmorphism (`backdrop-blur-xl`), subtle borders, modern surfaces, and purposeful lighting. No tacky neon top stripes on cards.

## 2. Color Palette & Roles
The system uses a curated palette of tech-focused colors:
- **Primary Tech Blue (#448FC4)**: Used for primary interactive elements, brand highlights, and key icons.
- **Midnight Canvas (#21262B / #141a23 / #111722)**: The foundational dark background colors, providing deep, high-contrast bases.
- **Arctic Silver (#CDD8DB)**: Used for secondary text, borders, and subtle highlights, ensuring excellent readability.
- **Cyan Glow (#22D3EE)**: Used for AI-related accents, highlights, and status indicators (e.g., "Analyze My Build").
- **Emerald Success (#10B981)**: Used for positive actions like "Confirm Reservation" and success states.
- **Vibrant Purple (#A855F7)**: Used in gradients to add a sense of premium "AI energy."

---

## 3. Strict Light and Dark Mode Compatibility Rules

BuildbotAI must be 100% legible, accessible, and aesthetically polished in **BOTH light and dark modes**. Any component that breaks in either theme is considered a defect.

### Core Dual-Theme Invariants:
1. **Never Hardcode Single-Theme Backgrounds or Text Colors**:
   - ❌ Avoid `text-white` without dark mode scoping on cards or inputs that turn white in light mode.
   - ❌ Avoid raw `bg-white` or `bg-slate-900` without corresponding `dark:` / light counterparts.
   - ✅ Always pair: `bg-white dark:bg-[#111722]`, `text-slate-900 dark:text-slate-100`, `text-slate-600 dark:text-slate-400`.
2. **Card Surfaces & Elevation**:
   - **Light Mode**: Pure white or ultra-clean slate surfaces (`bg-white` or `bg-slate-50/80`), subtle gray borders (`border-slate-200`), soft natural drop-shadows (`shadow-lg shadow-slate-900/5`).
   - **Dark Mode**: Deep blue/slate obsidian surfaces (`dark:bg-[#111722]` or `dark:bg-[#141a23]`), subtle translucent borders (`dark:border-white/10`), deep shadows (`dark:shadow-2xl dark:shadow-black/60`).
3. **Form Inputs (Text, Password, Select, Textarea)**:
   - Must have distinct borders, high text contrast, and clear focus rings in both modes:
     - Light: `bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600`.
     - Dark: `dark:bg-slate-900/60 dark:border-white/10 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400`.
4. **Contrast & WCAG AA Compliance**:
   - Secondary and muted labels must never be invisible or washed out (use `text-slate-600 dark:text-slate-400` or Mantine `c="dimmed"`).
   - High-emphasis values and currency must always pop (e.g. `text-cyan-700 dark:text-cyan-400` or `text-slate-950 dark:text-white`).

---

## 4. Mantine UI Integration & Aesthetic Directives

Mantine UI (`@mantine/core` v8+) is an official design standard for BuildbotAI components, modals, inputs, and interactive surfaces.

1. **Surface Primitives (`Paper`, `Card`, `Modal`)**:
   - Use Mantine `Paper` with `radius="lg"`, `withBorder`, and consistent padding (`p="lg"` or `p="xl"`).
   - Card headers must be clean and integrated with `ThemeIcon` (e.g., `variant="light"`).
   - **No Neon Light Bars**: Never add artificial glowing neon strips or gradients on top of cards (`<div className="h-1 bg-gradient-to-r ..."></div>`). Rely on clean borders and subtle radii.
2. **Form Controls (`TextInput`, `PasswordInput`, `SegmentedControl`)**:
   - Use Mantine input primitives with `radius="md"`, `size="md"`, and clear labels.
   - For role or tab switching, prefer Mantine `SegmentedControl` with distinct active indicator styling over heavy nested tabs.
3. **Modals & Overlays (`Modal`)**:
   - Use Mantine `Modal` with `radius="lg"`, `centered`, and clean blur overlay (`overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}`).
   - Modal headers must feature comfortable internal padding (`px-6 py-4`) with sufficient vertical separation (`pt-5` / `mt-2`) before announcement banners or dividers.
4. **Theme Synchronization**:
   - Mantine is driven by `MantineAppProvider` and synced with `next-themes` / `ThemeProvider`.
   - Always ensure Mantine components inherit the active `colorScheme` ("light" | "dark") automatically.

---

## 5. UI Copywriting & Text Guidelines

Use a modern, human, conversational e-commerce SaaS tone (similar to Vercel, Stripe, or PCPartPicker).

### Prohibited Robotic & Sci-Fi Tropes:
* ❌ Do NOT use robotic, cyberpunk, or sci-fi labels like:
  - "Citizen Access", "Citizen Identity", "Initialize Session", "Register Session", "Neural Link", "Matrix", "Protocol", "Cyber", "Agent Handshake", "Architect Credentials".

### Standard UI Substitutions:
| ❌ Robotic / Sci-Fi Phrasing | ✅ Standard Human SaaS / E-Commerce Equivalent |
|---|---|
| "Citizen Access" | "Sign In", "User Portal", "Customer Portal", "Account Access" |
| "Create Identity" / "Citizen Identity" | "Create Account", "Sign Up", "Register" |
| "Initialize Session" | "Sign In", "Log In", "Get Started" |
| "Register Session" | "Create Account", "Sign Up", "Get Started" |
| "Architect Credentials" | "Account Credentials", "Login Details" |
| "Neural Diagnostic / Bottleneck Protocol" | "Compatibility Check", "Performance Analysis" |
| "Stabilizing Neural Link" | "Loading inventory...", "Fetching components..." |
| "System Access Protocol" | "System Access", "Staff Portal", "Admin Login" |

### Copywriting Rules:
- **Button Labels**: Concise, action-oriented, and immediately clear (e.g., "Sign In", "Create Account", "Add to Build", "Confirm Reservation").
- **Card Headers & Subtitles**: Warm, professional, and descriptive (e.g., "Welcome back! Enter your details to access your builds.").
- **Error & Status Messages**: Helpful, plain English explanations instead of techno-babble.

---

## 6. Typography Rules
Typography reinforces precision and clarity:
- **Headline Font: 'Space Grotesk'**: Geometric sans-serif used for major titles and section headers.
- **Body Font: 'Inter'**: Highly readable, neutral sans-serif used for specifications, labels, descriptions, and forms.
- **Code Font: 'Monospace'**: Used for technical data, parts counts, SKUs, and wattage.

### Typography Hierarchy
| Role | Font | Size / Weight | Usage |
|------|------|---------------|-------|
| **H1 (Hero)** | Headline | 3rem / Bold | Page titles, major marketing headers |
| **H2 (Section)** | Headline | 1.875rem / Bold | Main section headers |
| **H3 (Sub-section)** | Headline | 1.25rem / Bold | Card titles, secondary headers |
| **H4 (Group)** | Headline | 1rem / SemiBold | Minor groupings, modal headers |
| **Body (Default)** | Body | 0.875rem / Regular | Main descriptive text, component details |
| **Label (Action)** | Body | 0.75rem / SemiBold | Buttons, badges, uppercase labels |
| **Code (Data)** | Monospace | 0.875rem / Medium | Wattage, prices, system specs |

---

## 7. Component Stylings & Layout
* **Buttons**:
  - Interactive with 150ms-250ms transitions.
  - Subtly rounded corners (`radius="md"`).
  - Tactile feedback with `hover:scale-[1.02]` and `active:scale-[0.98]`.
* **Cards & Containers**:
  - Clean `Paper` or glassmorphic panel with `backdrop-blur-xl`.
  - Borders: Thin, low-opacity borders (`border-slate-200 dark:border-white/10`).
  - Ample padding and 8px grid spacing.
* **Layout Principles**:
  - **Whitespace**: Ample spacing (8px/8dp rhythm) to prevent cognitive overload.
  - **Responsiveness**: Mobile-first approach with container maxing out at `max-w-7xl` on desktop.
