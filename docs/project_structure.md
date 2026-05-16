# Project Structure

```text
BuilbotAI
├── .agents
│   ├── skills
│   │   ├── 3d-visualizer
│   │   │   ├── manifest.yaml
│   │   │   ├── README.md
│   │   │   └── SKILL.md
│   │   ├── ai-sdk
│   │   │   ├── references
│   │   │   │   ├── ai-gateway.md
│   │   │   │   ├── common-errors.md
│   │   │   │   ├── devtools.md
│   │   │   │   └── type-safe-agents.md
│   │   │   └── SKILL.md
│   │   ├── buildbot_master
│   │   │   └── SKILL.md
│   │   ├── find-skills
│   │   │   └── SKILL.md
│   │   ├── firebase
│   │   │   └── SKILL.md
│   │   ├── firebase-basics
│   │   │   ├── references
│   │   │   │   ├── refresh
│   │   │   │   │   ├── antigravity.md
│   │   │   │   │   ├── claude.md
│   │   │   │   │   ├── gemini-cli.md
│   │   │   │   │   └── other-agents.md
│   │   │   │   ├── setup
│   │   │   │   │   ├── antigravity.md
│   │   │   │   │   ├── claude_code.md
│   │   │   │   │   ├── cursor.md
│   │   │   │   │   ├── gemini_cli.md
│   │   │   │   │   ├── github_copilot.md
│   │   │   │   │   └── other_agents.md
│   │   │   │   ├── firebase-cli-guide.md
│   │   │   │   ├── firebase-service-init.md
│   │   │   │   ├── local-env-setup.md
│   │   │   │   └── web_setup.md
│   │   │   └── SKILL.md
│   │   ├── frontend-design
│   │   │   ├── LICENSE.txt
│   │   │   └── SKILL.md
│   │   ├── nextjs-app-router-patterns
│   │   │   └── SKILL.md
│   │   ├── nextjs-best-practices
│   │   │   └── SKILL.md
│   │   ├── r3f-animation
│   │   │   └── SKILL.md
│   │   ├── react-three-fiber
│   │   │   ├── assets
│   │   │   │   ├── examples
│   │   │   │   │   └── README.md
│   │   │   │   └── starter_r3f
│   │   │   │       ├── src
│   │   │   │       │   ├── components
│   │   │   │       │   │   ├── Box.jsx
│   │   │   │       │   │   └── Sphere.jsx
│   │   │   │       │   ├── App.jsx
│   │   │   │       │   ├── Experience.jsx
│   │   │   │       │   └── main.jsx
│   │   │   │       ├── index.html
│   │   │   │       ├── package.json
│   │   │   │       ├── README.md
│   │   │   │       └── vite.config.js
│   │   │   ├── references
│   │   │   │   └── api_reference.md
│   │   │   ├── scripts
│   │   │   │   ├── component_generator.py
│   │   │   │   └── scene_setup.py
│   │   │   └── SKILL.md
│   │   ├── threejs-fundamentals
│   │   │   └── SKILL.md
│   │   ├── threejs-interaction
│   │   │   └── SKILL.md
│   │   └── ui-ux-pro-max
│   │       ├── data
│   │       ├── scripts
│   │       └── SKILL.md
│   └── workflows
│       └── buildbotAI-capabilities.md
├── .claude
│   └── skills
│       ├── 3d-visualizer
│       │   ├── manifest.yaml
│       │   ├── README.md
│       │   └── SKILL.md
│       ├── firebase
│       │   └── SKILL.md
│       ├── frontend-design
│       │   ├── LICENSE.txt
│       │   └── SKILL.md
│       ├── nextjs-app-router-patterns
│       │   └── SKILL.md
│       ├── nextjs-best-practices
│       │   └── SKILL.md
│       ├── r3f-animation
│       │   └── SKILL.md
│       ├── react-three-fiber
│       │   ├── assets
│       │   │   ├── examples
│       │   │   │   └── README.md
│       │   │   └── starter_r3f
│       │   │       ├── src
│       │   │       │   ├── components
│       │   │       │   │   ├── Box.jsx
│       │   │       │   │   └── Sphere.jsx
│       │   │       │   ├── App.jsx
│       │   │       │   ├── Experience.jsx
│       │   │       │   └── main.jsx
│       │   │       ├── index.html
│       │   │       ├── package.json
│       │   │       ├── README.md
│       │   │       └── vite.config.js
│       │   ├── references
│       │   │   └── api_reference.md
│       │   ├── scripts
│       │   │   ├── component_generator.py
│       │   │   └── scene_setup.py
│       │   └── SKILL.md
│       ├── threejs-fundamentals
│       │   └── SKILL.md
│       └── threejs-interaction
│           └── SKILL.md
├── .husky
│   ├── _
│   │   ├── .gitignore
│   │   ├── applypatch-msg
│   │   ├── commit-msg
│   │   ├── h
│   │   ├── husky.sh
│   │   ├── post-applypatch
│   │   ├── post-checkout
│   │   ├── post-commit
│   │   ├── post-merge
│   │   ├── post-rewrite
│   │   ├── pre-applypatch
│   │   ├── pre-auto-gc
│   │   ├── pre-commit
│   │   ├── pre-merge-commit
│   │   ├── pre-push
│   │   ├── pre-rebase
│   │   └── prepare-commit-msg
│   ├── pre-commit
│   └── pre-push
├── .idx
│   ├── dev.nix
│   └── icon.png
├── .vscode
│   └── settings.json
├── design_mocks
│   ├── ai_companion_layout_1772284543518.png
│   ├── analytics_dashboard_layout_1772284568273.png
│   ├── command_center_layout_1772284510920.png
│   ├── immersive_aesthetic_layout_1772284607227.png
│   ├── media__1772284001327.png
│   └── neon_analytics_bot_layout_1772285192674.png
├── directives
│   └── ingest_knowledge.md
├── docs
│   ├── backend.json
│   ├── blueprint.md
│   └── project_structure.md
├── execution
│   ├── generate_project_structure.js
│   ├── ingest_website.py
│   └── migrate_audit_logs.ts
├── public
│   ├── assets
│   │   └── blueprints
│   ├── team
│   │   ├── developer_m.png
│   │   ├── developer.png
│   │   ├── documentation_m.png
│   │   ├── documentation.png
│   │   ├── pm_m.png
│   │   ├── pm.png
│   │   ├── ui_m.png
│   │   └── ui.png
│   ├── cosmic-bg.png
│   ├── feature-1.webp
│   ├── feature-2.webp
│   ├── feature-3.webp
│   ├── hero-custom.webp
│   ├── hero-pc.png
│   └── landing-hero.png
├── scratch
│   ├── check-firestore-schema.js
│   ├── check-inventory.ts
│   ├── check-models.js
│   ├── find-bad-data.js
│   └── list-models.js
├── src
│   ├── ai
│   │   ├── flows
│   │   │   ├── ai-build-advisor-recommendations.ts
│   │   │   ├── ai-build-critique.ts
│   │   │   ├── ai-prebuilt-advisor.ts
│   │   │   ├── ai-prebuilt-performance.ts
│   │   │   ├── ai-smart-budget.ts
│   │   │   └── extract-part-details.ts
│   │   ├── dev.ts
│   │   └── genkit.ts
│   ├── app
│   │   ├── about
│   │   │   └── page.tsx
│   │   ├── admin
│   │   │   ├── components
│   │   │   │   ├── archive-tab.tsx
│   │   │   │   ├── prebuilt-tab.tsx
│   │   │   │   ├── reservations-tab.tsx
│   │   │   │   ├── sales-tab.tsx
│   │   │   │   └── stock-tab.tsx
│   │   │   ├── hooks
│   │   │   │   ├── use-admin-core.ts
│   │   │   │   ├── use-bulk-actions.ts
│   │   │   │   ├── use-inventory.ts
│   │   │   │   └── use-orders.ts
│   │   │   ├── prebuilt-builder
│   │   │   │   ├── components
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── ai-build-advisor
│   │   │   ├── components
│   │   │   │   ├── advisor-header.tsx
│   │   │   │   ├── critique-tab.tsx
│   │   │   │   └── recommendation-tab.tsx
│   │   │   ├── hooks
│   │   │   │   ├── use-advisor-data.ts
│   │   │   │   ├── use-advisor-state.ts
│   │   │   │   ├── use-critique-logic.ts
│   │   │   │   └── use-recommendation-logic.ts
│   │   │   └── page.tsx
│   │   ├── api
│   │   │   ├── ai
│   │   │   │   └── extract-details
│   │   │   └── chat
│   │   │       └── route.ts
│   │   ├── builder
│   │   │   ├── components
│   │   │   │   ├── builder-header.tsx
│   │   │   │   └── inventory-view.tsx
│   │   │   ├── hooks
│   │   │   │   ├── use-builder-logic.ts
│   │   │   │   ├── use-filtered-inventory.ts
│   │   │   │   └── use-inventory-query.ts
│   │   │   └── page.tsx
│   │   ├── contact
│   │   │   └── page.tsx
│   │   ├── faq
│   │   │   └── page.tsx
│   │   ├── lens
│   │   │   └── page.tsx
│   │   ├── pre-builts
│   │   │   ├── [id]
│   │   │   │   └── page.tsx
│   │   │   ├── components
│   │   │   └── page.tsx
│   │   ├── profile
│   │   │   ├── components
│   │   │   │   ├── account-details.tsx
│   │   │   │   ├── audit-logs-section.tsx
│   │   │   │   ├── profile-hero.tsx
│   │   │   │   └── reservations-list.tsx
│   │   │   ├── hooks
│   │   │   │   ├── use-admin-keys.ts
│   │   │   │   ├── use-audit-logs.ts
│   │   │   │   ├── use-emergency-controls.ts
│   │   │   │   ├── use-profile-state.ts
│   │   │   │   └── use-reservations.ts
│   │   │   └── page.tsx
│   │   ├── signin
│   │   │   └── page.tsx
│   │   ├── signup
│   │   │   └── page.tsx
│   │   ├── team
│   │   │   └── page.tsx
│   │   ├── actions.ts
│   │   ├── checkout-actions.ts
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── image-actions.ts
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── page.tsx
│   │   └── prebuilt-reservation-actions.ts
│   ├── components
│   │   ├── auth
│   │   │   ├── route-guard.tsx
│   │   │   └── session-timeout.tsx
│   │   ├── landing
│   │   │   ├── accessories-section.tsx
│   │   │   ├── cta-section.tsx
│   │   │   ├── feature-showcase.tsx
│   │   │   ├── features-section.tsx
│   │   │   ├── hero-section.tsx
│   │   │   ├── prebuilt-showcase.tsx
│   │   │   ├── section-header.tsx
│   │   │   ├── team-section.tsx
│   │   │   ├── unified-background.tsx
│   │   │   └── visualizer-preview.tsx
│   │   ├── parts
│   │   │   ├── part-identity-section.tsx
│   │   │   └── part-specifications-section.tsx
│   │   ├── prebuilt-builder
│   │   │   ├── component-fields.tsx
│   │   │   ├── identity-fields.tsx
│   │   │   ├── part-selector.tsx
│   │   │   └── use-prebuilt-form.ts
│   │   ├── ui
│   │   │   ├── accordion.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── animated-icons.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── canvas-text.tsx
│   │   │   ├── card.tsx
│   │   │   ├── carousel.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── lens.tsx
│   │   │   ├── menubar.tsx
│   │   │   ├── optimized-image.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── power-meter.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── sparkle-button.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── toggle-group.tsx
│   │   │   ├── toggle.tsx
│   │   │   └── tooltip.tsx
│   │   ├── about-management.tsx
│   │   ├── add-part-dialog.tsx
│   │   ├── add-prebuilt-dialog.tsx
│   │   ├── ai-build-critique.tsx
│   │   ├── ai-progress-modal.tsx
│   │   ├── animated-cube-logo.tsx
│   │   ├── app-layout.tsx
│   │   ├── build-summary.tsx
│   │   ├── builder-floating-analytics.tsx
│   │   ├── builder-floating-chat.tsx
│   │   ├── builder-sidebar-left.tsx
│   │   ├── chat-form.tsx
│   │   ├── component-card.tsx
│   │   ├── footer.tsx
│   │   ├── full-page-loader.tsx
│   │   ├── header.tsx
│   │   ├── image-upload.tsx
│   │   ├── inventory-part-card.tsx
│   │   ├── inventory-prebuilt-card.tsx
│   │   ├── inventory-table.tsx
│   │   ├── inventory-toolbar.tsx
│   │   ├── lens-demo.tsx
│   │   ├── logo.tsx
│   │   ├── maintenance-screen.tsx
│   │   ├── notification-center.tsx
│   │   ├── order-details-modal.tsx
│   │   ├── pagination-controls.tsx
│   │   ├── part-card.tsx
│   │   ├── part-details-dialog.tsx
│   │   ├── prebuilt-builder-add-dialog.tsx
│   │   ├── prebuilt-card-specs.tsx
│   │   ├── prebuilt-system-card.tsx
│   │   ├── prebuilts-table.tsx
│   │   ├── sales-analytics.tsx
│   │   ├── sales-visualizer.tsx
│   │   ├── smart-budget.tsx
│   │   ├── smart-image-magnifier.tsx
│   │   ├── stock-editor.tsx
│   │   ├── super-admin-settings.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── user-notifications.tsx
│   │   └── your-build.tsx
│   ├── context
│   │   ├── loading-context.tsx
│   │   ├── site-settings-context.tsx
│   │   ├── theme-provider.tsx
│   │   └── user-profile.tsx
│   ├── database
│   │   ├── case.csv
│   │   ├── cooler.csv
│   │   ├── cpu.csv
│   │   ├── gpu.csv
│   │   ├── headset.csv
│   │   ├── keyboard.csv
│   │   ├── monitor.csv
│   │   ├── motherboard.csv
│   │   ├── mouse.csv
│   │   ├── psu.csv
│   │   ├── ram.csv
│   │   └── storage.csv
│   ├── firebase
│   │   ├── auth
│   │   │   └── use-user.tsx
│   │   ├── firestore
│   │   │   ├── use-collection.tsx
│   │   │   └── use-doc.tsx
│   │   ├── audit.ts
│   │   ├── client-provider.tsx
│   │   ├── config.ts
│   │   ├── database.ts
│   │   ├── error-emitter.ts
│   │   ├── errors.ts
│   │   ├── index.ts
│   │   ├── init.ts
│   │   ├── provider.tsx
│   │   └── server-init.ts
│   ├── hooks
│   │   ├── use-build-actions.ts
│   │   ├── use-mobile.tsx
│   │   ├── use-part-form.ts
│   │   ├── use-persistent-state.ts
│   │   └── use-toast.ts
│   ├── knowledge
│   │   ├── check-parts-compatible.md
│   │   ├── community-recommended-resources.md
│   │   ├── cpu-cooler-tier-list.md
│   │   ├── cpu-tier-list.md
│   │   ├── gpu-tier-list.md
│   │   ├── ltt-cooler-tier-list.md
│   │   ├── motherboard-selection-guide.md
│   │   ├── pc-bottleneck-guide.md
│   │   ├── pc-bottleneck.md
│   │   ├── psu-tier-list.md
│   │   ├── ram-performance-guide.md
│   │   ├── ssd-tier-list.md
│   │   ├── toms-cpu-hierarchy.md
│   │   ├── toms-gpu-hierarchy.md
│   │   └── understand-cpu-bottleneck.md
│   └── lib
│       ├── constants
│       │   └── category-specs.ts
│       ├── auth-utils.ts
│       ├── bottleneck.ts
│       ├── compatibility.ts
│       ├── fps-estimator.ts
│       ├── inventory-fetcher.ts
│       ├── knowledge-retriever.ts
│       ├── local-db.ts
│       ├── placeholder-images.ts
│       ├── prebuilt-utils.ts
│       ├── spec-retriever.ts
│       ├── types.ts
│       └── utils.ts
├── .env
├── .eslintrc.json
├── .firebaserc
├── .gitignore
├── .modified
├── agents.md
├── apphosting.yaml
├── CLAUDE.md
├── components.json
├── debug-response.json
├── DESIGN.md
├── firebase-debug.log
├── firebase.json
├── firestore.rules
├── GEMINI.md
├── grounding-debug.log
├── models.json
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── README.md
├── skills-lock.json
├── storage.rules
├── tailwind.config.ts
├── temp_build.json
├── test-ai.ts
├── test-genkit.ts
├── test-nv.ts
├── tsconfig.json
└── tsconfig.tsbuildinfo
```

_Auto-generated on git push._
