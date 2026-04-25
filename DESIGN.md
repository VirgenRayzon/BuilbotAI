# Design System: BuildbotAI (Forge Architect AI)

This document serves as the "source of truth" for the visual identity and design language of BuildbotAI.

## 1. Visual Theme & Atmosphere
The design follows a **Sleek Tech & Immersive** aesthetic. The atmosphere is **technical yet premium**, utilizing high-contrast elements, glassmorphism, and vibrant accents to create a sense of advanced AI capability.
- **Mood**: Precise, Professional, High-Tech, and Trustworthy.
- **Density**: Comfortable with ample whitespace to ensure focus on complex hardware specifications.
- **Visual Styles**: Glassmorphism (blur backgrounds), subtle gradients, and glowing accents.

## 2. Color Palette & Roles
The system uses a curated palette of tech-focused colors:
- **Primary Tech Blue (#448FC4)**: Used for primary interactive elements, brand highlights, and key icons.
- **Midnight Canvas (#21262B)**: The foundational background color, providing a deep, high-contrast base for the tech aesthetic.
- **Arctic Silver (#CDD8DB)**: Used for secondary text, borders, and subtle highlights, ensuring excellent readability.
- **Cyan Glow (#22D3EE)**: Used for AI-related accents, shadows, and status indicators (e.g., "Analyze My Build").
- **Emerald Success (#10B981)**: Used for positive actions like "Confirm Reservation" and success states.
- **Vibrant Purple (#A855F7)**: Used in gradients to add a sense of premium "AI energy."

## 3. Typography Rules
Typography is used to reinforce the technical and modern nature of the product:
- **Headline Font: 'Space Grotesk'**: A modern, geometric sans-serif used for all major titles and brand elements to convey a "future-tech" feel.
- **Body Font: 'Inter'**: A highly readable, neutral sans-serif used for specifications, labels, and instructional text.
- **Code Font: 'Monospace'**: Used for technical data, parts counts, and developer-oriented information.

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

### Consistency Guidelines
- **Line Height**: Use `1.5` for body text and `1.2` for headlines.
- **Letter Spacing**: Headlines use `tracking-tight`; uppercase labels use `tracking-widest`.
- **Contrast**: Use **Arctic Silver** for secondary/muted text to maintain hierarchy without sacrificing legibility.

## 4. Component Stylings
*   **Buttons**:
    *   **Style**: Highly interactive with subtle 100ms-300ms transitions.
    *   **Shape**: Subtly rounded corners (`rounded-md` or `rounded-lg`).
    *   **Interactions**: Use `hover:scale-105` and `active:scale-95` for tactile feedback.
    *   **Special**: AI-related buttons use gradients (`from-primary via-purple-500 to-primary`) and shimmer animations.
*   **Cards & Containers**:
    *   **Style**: Glassmorphic appearance using `backdrop-blur-2xl` and semi-transparent backgrounds (`bg-background/40` or `bg-white/5`).
    *   **Borders**: Thin, low-opacity borders (`border-white/5` or `border-primary/20`) with a subtle `ring-white/5` for definition.
    *   **Elevation**: Expressed through glows rather than traditional shadows (e.g., `shadow-[0_0_40px_rgba(34,211,238,0.05)]`).
*   **Inputs & Forms**:
    *   **Style**: Clean and structured with clear focus states (`ring-primary`).

## 5. Layout Principles
*   **Whitespace**: Ample spacing (utilizing an 8px/8dp rhythm) to prevent cognitive overload during component selection.
*   **Hierarchy**: Logical flow from top-level system categories to specific component details.
*   **Responsiveness**: Mobile-first approach with containers maximizing at `max-w-7xl` on desktop.
*   **Transitions**: Fluid animations for all state changes, including `fade-in` and `slide-in` for new component additions.
