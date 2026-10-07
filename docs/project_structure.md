# Project Structure

```text
BuilbotAI
├── .agents
│   ├── skills
│   │   ├── 3d-visualizer
│   │   │   ├── manifest.yaml
│   │   │   ├── README.md
│   │   │   └── SKILL.md
│   │   ├── ai-elements
│   │   │   ├── references
│   │   │   │   ├── agent.md
│   │   │   │   ├── artifact.md
│   │   │   │   ├── attachments.md
│   │   │   │   ├── audio-player.md
│   │   │   │   ├── canvas.md
│   │   │   │   ├── chain-of-thought.md
│   │   │   │   ├── checkpoint.md
│   │   │   │   ├── code-block.md
│   │   │   │   ├── commit.md
│   │   │   │   ├── confirmation.md
│   │   │   │   ├── connection.md
│   │   │   │   ├── context.md
│   │   │   │   ├── controls.md
│   │   │   │   ├── conversation.md
│   │   │   │   ├── edge.md
│   │   │   │   ├── environment-variables.md
│   │   │   │   ├── file-tree.md
│   │   │   │   ├── image.md
│   │   │   │   ├── inline-citation.md
│   │   │   │   ├── jsx-preview.md
│   │   │   │   ├── message.md
│   │   │   │   ├── mic-selector.md
│   │   │   │   ├── model-selector.md
│   │   │   │   ├── node.md
│   │   │   │   ├── open-in-chat.md
│   │   │   │   ├── package-info.md
│   │   │   │   ├── panel.md
│   │   │   │   ├── persona.md
│   │   │   │   ├── plan.md
│   │   │   │   ├── prompt-input.md
│   │   │   │   ├── queue.md
│   │   │   │   ├── reasoning.md
│   │   │   │   ├── sandbox.md
│   │   │   │   ├── schema-display.md
│   │   │   │   ├── shimmer.md
│   │   │   │   ├── snippet.md
│   │   │   │   ├── sources.md
│   │   │   │   ├── speech-input.md
│   │   │   │   ├── stack-trace.md
│   │   │   │   ├── suggestion.md
│   │   │   │   ├── task.md
│   │   │   │   ├── terminal.md
│   │   │   │   ├── test-results.md
│   │   │   │   ├── tool.md
│   │   │   │   ├── toolbar.md
│   │   │   │   ├── transcription.md
│   │   │   │   ├── voice-selector.md
│   │   │   │   └── web-preview.md
│   │   │   ├── scripts
│   │   │   │   ├── agent.tsx
│   │   │   │   ├── artifact.tsx
│   │   │   │   ├── attachments-inline.tsx
│   │   │   │   ├── attachments-list.tsx
│   │   │   │   ├── attachments.tsx
│   │   │   │   ├── audio-player-remote.tsx
│   │   │   │   ├── audio-player.tsx
│   │   │   │   ├── chain-of-thought.tsx
│   │   │   │   ├── checkpoint.tsx
│   │   │   │   ├── code-block-dark.tsx
│   │   │   │   ├── code-block.tsx
│   │   │   │   ├── commit.tsx
│   │   │   │   ├── confirmation-accepted.tsx
│   │   │   │   ├── confirmation-rejected.tsx
│   │   │   │   ├── confirmation-request.tsx
│   │   │   │   ├── confirmation.tsx
│   │   │   │   ├── context.tsx
│   │   │   │   ├── conversation.tsx
│   │   │   │   ├── environment-variables.tsx
│   │   │   │   ├── file-tree-basic.tsx
│   │   │   │   ├── file-tree-expanded.tsx
│   │   │   │   ├── file-tree-selection.tsx
│   │   │   │   ├── file-tree.tsx
│   │   │   │   ├── image.tsx
│   │   │   │   ├── inline-citation.tsx
│   │   │   │   ├── jsx-preview.tsx
│   │   │   │   ├── message.tsx
│   │   │   │   ├── mic-selector.tsx
│   │   │   │   ├── model-selector.tsx
│   │   │   │   ├── open-in-chat.tsx
│   │   │   │   ├── package-info.tsx
│   │   │   │   ├── persona-command.tsx
│   │   │   │   ├── persona-glint.tsx
│   │   │   │   ├── persona-halo.tsx
│   │   │   │   ├── persona-mana.tsx
│   │   │   │   ├── persona-obsidian.tsx
│   │   │   │   ├── persona-opal.tsx
│   │   │   │   ├── plan.tsx
│   │   │   │   ├── prompt-input-cursor.tsx
│   │   │   │   ├── prompt-input-tooltip.tsx
│   │   │   │   ├── prompt-input.tsx
│   │   │   │   ├── queue-prompt-input.tsx
│   │   │   │   ├── queue.tsx
│   │   │   │   ├── reasoning.tsx
│   │   │   │   ├── sandbox.tsx
│   │   │   │   ├── schema-display-basic.tsx
│   │   │   │   ├── schema-display-body.tsx
│   │   │   │   ├── schema-display-nested.tsx
│   │   │   │   ├── schema-display-params.tsx
│   │   │   │   ├── schema-display.tsx
│   │   │   │   ├── shimmer-duration.tsx
│   │   │   │   ├── shimmer-elements.tsx
│   │   │   │   ├── shimmer.tsx
│   │   │   │   ├── snippet-plain.tsx
│   │   │   │   ├── snippet.tsx
│   │   │   │   ├── sources-custom.tsx
│   │   │   │   ├── sources.tsx
│   │   │   │   ├── speech-input.tsx
│   │   │   │   ├── stack-trace-collapsed.tsx
│   │   │   │   ├── stack-trace-no-internal.tsx
│   │   │   │   ├── stack-trace.tsx
│   │   │   │   ├── suggestion-input.tsx
│   │   │   │   ├── suggestion.tsx
│   │   │   │   ├── task.tsx
│   │   │   │   ├── terminal-basic.tsx
│   │   │   │   ├── terminal-clear.tsx
│   │   │   │   ├── terminal-streaming.tsx
│   │   │   │   ├── terminal.tsx
│   │   │   │   ├── test-results-basic.tsx
│   │   │   │   ├── test-results-errors.tsx
│   │   │   │   ├── test-results-suites.tsx
│   │   │   │   ├── test-results.tsx
│   │   │   │   ├── tool-input-available.tsx
│   │   │   │   ├── tool-input-streaming.tsx
│   │   │   │   ├── tool-output-available.tsx
│   │   │   │   ├── tool-output-error.tsx
│   │   │   │   ├── tool.tsx
│   │   │   │   ├── transcription.tsx
│   │   │   │   ├── voice-selector.tsx
│   │   │   │   └── web-preview.tsx
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
│   │   ├── mantine-combobox
│   │   │   ├── references
│   │   │   │   ├── api.md
│   │   │   │   └── patterns.md
│   │   │   └── SKILL.md
│   │   ├── mantine-custom-components
│   │   │   ├── references
│   │   │   │   ├── api.md
│   │   │   │   └── patterns.md
│   │   │   └── SKILL.md
│   │   ├── mantine-form
│   │   │   ├── references
│   │   │   │   ├── api.md
│   │   │   │   └── patterns.md
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
├── .firebase
│   └── studio-3150054754-c7d0b
│       └── functions
│           └── .env
├── .husky
│   ├── pre-commit
│   └── pre-push
├── .idx
│   ├── dev.nix
│   └── icon.png
├── .tmp
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
│   ├── admin_session_and_idle_timeout.md
│   └── ingest_knowledge.md
├── docs
│   ├── backend.json
│   ├── blueprint.md
│   ├── database_scalability_plan.md
│   └── project_structure.md
├── execution
│   ├── consolidate_collections.ts
│   ├── delete-test-builders.js
│   ├── generate_project_structure.js
│   ├── ingest_website.py
│   ├── migrate_audit_logs.ts
│   └── update_changelog.js
├── public
│   ├── placeholders
│   │   └── components
│   │       ├── case.jpg
│   │       ├── cooler.jpg
│   │       ├── cpu.jpg
│   │       ├── gpu-integrated.jpg
│   │       ├── gpu.jpg
│   │       ├── motherboard.jpg
│   │       ├── psu.jpg
│   │       ├── ram.jpg
│   │       └── storage.jpg
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
│   ├── test_placeholders
│   │   ├── case.jpg
│   │   ├── cooler.jpg
│   │   ├── cpu.jpg
│   │   ├── gpu.jpg
│   │   ├── motherboard.jpg
│   │   ├── psu.jpg
│   │   ├── ram.jpg
│   │   └── storage.jpg
│   ├── app.spec.ts
│   ├── build_summary_diff.txt
│   ├── check-firestore-schema.js
│   ├── check-inventory.ts
│   ├── check-models.js
│   ├── find-bad-data.js
│   ├── list-models.js
│   ├── print-raw-response.js
│   ├── screenshot-home.png
│   ├── screenshot-mega-menu-dark.png
│   ├── screenshot-mega-menu-light.png
│   ├── screenshot-mega-menu.png
│   ├── screenshot-onboarding-header.png
│   ├── screenshot-signin.png
│   ├── screenshot-signup-form.png
│   ├── screenshot-signup-toa-v2.png
│   ├── screenshot-signup-toa.png
│   ├── screenshot-system-access-modal.png
│   ├── screenshot-system-access-new.png
│   ├── screenshot-system-access.png
│   ├── screenshot-terms-updated.png
│   ├── test-chat.js
│   ├── test-critique-speed.ts
│   ├── test-fetch.ts
│   ├── test-mega-menu.js
│   ├── verify-rbac.ts
│   └── verify-server-actions.ts
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
│   │   ├── forgot-password
│   │   │   └── page.tsx
│   │   ├── lens
│   │   │   └── page.tsx
│   │   ├── pre-builts
│   │   │   ├── [id]
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── profile
│   │   │   ├── components
│   │   │   │   ├── account-details.tsx
│   │   │   │   ├── audit-logs-section.tsx
│   │   │   │   ├── emergency-controls-card.tsx
│   │   │   │   ├── favorites-list.tsx
│   │   │   │   ├── mantine-profile-view.tsx
│   │   │   │   ├── mantine-settings-view.tsx
│   │   │   │   ├── profile-hero.tsx
│   │   │   │   ├── profile-sidebar.tsx
│   │   │   │   ├── reservations-list.tsx
│   │   │   │   └── user-audit-logs-section.tsx
│   │   │   ├── hooks
│   │   │   │   ├── use-admin-keys.ts
│   │   │   │   ├── use-audit-logs.ts
│   │   │   │   ├── use-emergency-controls.ts
│   │   │   │   ├── use-favorites.ts
│   │   │   │   ├── use-profile-state.ts
│   │   │   │   ├── use-reservations.ts
│   │   │   │   └── use-user-audit-logs.ts
│   │   │   └── page.tsx
│   │   ├── settings
│   │   ├── signin
│   │   │   └── page.tsx
│   │   ├── signup
│   │   │   └── page.tsx
│   │   ├── system-access
│   │   │   ├── components
│   │   │   │   └── request-key-modal.tsx
│   │   │   ├── signup
│   │   │   │   └── page.tsx
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
│   │   │   ├── session-timeout.tsx
│   │   │   └── terms-of-agreement-modal.tsx
│   │   ├── chat
│   │   │   ├── hooks
│   │   │   │   └── use-floating-chat.ts
│   │   │   ├── chat-header.tsx
│   │   │   ├── chat-input-bar.tsx
│   │   │   ├── chat-loading-indicator.tsx
│   │   │   ├── chat-message-bubble.tsx
│   │   │   ├── chat-message-list.tsx
│   │   │   ├── chat-preset-chips.tsx
│   │   │   ├── chat-recommendations-carousel.tsx
│   │   │   ├── chat-telemetry-drawer.tsx
│   │   │   ├── chat-tool-status.tsx
│   │   │   └── types.ts
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
│   │   │   ├── multi-image-upload.tsx
│   │   │   ├── part-identity-section.tsx
│   │   │   └── part-specifications-section.tsx
│   │   ├── prebuilt-builder
│   │   │   ├── component-fields.tsx
│   │   │   ├── identity-fields.tsx
│   │   │   ├── part-selector.tsx
│   │   │   └── use-prebuilt-form.ts
│   │   ├── providers
│   │   │   └── mantine-app-provider.tsx
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
│   │   ├── add-stock-dialog.tsx
│   │   ├── ai-build-critique.tsx
│   │   ├── ai-model-settings.tsx
│   │   ├── ai-progress-modal.tsx
│   │   ├── ai-system-prompts-settings.tsx
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
│   │   ├── header-mega-menu.module.css
│   │   ├── header-mega-menu.tsx
│   │   ├── header.module.css
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
│   ├── firebase
│   │   ├── auth
│   │   │   ├── google-auth.tsx
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
│   │   ├── use-admin-session-guard.ts
│   │   ├── use-build-actions.ts
│   │   ├── use-idle-timeout.ts
│   │   ├── use-mobile.tsx
│   │   ├── use-part-form.ts
│   │   ├── use-persistent-state.ts
│   │   ├── use-system-prompts.ts
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
│       │   ├── category-specs.ts
│       │   └── default-system-prompts.ts
│       ├── ai-model-resolver.ts
│       ├── auth-utils.ts
│       ├── bottleneck.ts
│       ├── compatibility.ts
│       ├── export-excel.ts
│       ├── fps-estimator.ts
│       ├── inventory-fetcher.ts
│       ├── knowledge-retriever.ts
│       ├── placeholder-images.ts
│       ├── prebuilt-utils.ts
│       ├── system-prompts.ts
│       ├── types.ts
│       ├── utils.ts
│       └── vector-retriever.ts
├── test-results
│   └── .last-run.json
├── tmp
│   ├── test_knowledge_tools.ts
│   ├── test_local_extraction.ts
│   ├── test_search.ts
│   ├── verify_google_search.ts
│   └── verify_local_db.ts
├── .env
├── .eslintrc.json
├── .firebaserc
├── .gitignore
├── .modified
├── agents.md
├── apphosting.yaml
├── CHANGELOG.md
├── CLAUDE.md
├── components.json
├── debug-response.json
├── DESIGN.md
├── firebase.json
├── firestore.indexes.json
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
