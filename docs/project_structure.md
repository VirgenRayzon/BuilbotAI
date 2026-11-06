# Project Structure

```text
BuilbotAI
├── .agents
│   ├── skills
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
│   │   ├── brainstorming
│   │   │   ├── scripts
│   │   │   │   ├── frame-template.html
│   │   │   │   ├── helper.js
│   │   │   │   ├── server.cjs
│   │   │   │   ├── start-server.sh
│   │   │   │   └── stop-server.sh
│   │   │   ├── builder-check-prompt.md
│   │   │   ├── SKILL.md
│   │   │   └── visual-companion.md
│   │   ├── buildbot_master
│   │   │   └── SKILL.md
│   │   ├── diagnosing-superpowers
│   │   │   ├── prompts
│   │   │   │   ├── analyst-common.md
│   │   │   │   ├── cost-and-time.md
│   │   │   │   ├── plan-adherence.md
│   │   │   │   ├── quality-evidence.md
│   │   │   │   ├── repeated-work.md
│   │   │   │   ├── request-conflicts.md
│   │   │   │   ├── scrub-audit.md
│   │   │   │   ├── scrub.md
│   │   │   │   ├── similar-session.md
│   │   │   │   ├── skill-timeline.md
│   │   │   │   └── stumbles.md
│   │   │   ├── references
│   │   │   │   ├── context-safety.md
│   │   │   │   ├── github-issues.md
│   │   │   │   ├── redaction-policy.md
│   │   │   │   └── session-discovery.md
│   │   │   ├── templates
│   │   │   │   ├── bundle-README.md
│   │   │   │   ├── case.md
│   │   │   │   ├── issue.md
│   │   │   │   └── report.md
│   │   │   └── SKILL.md
│   │   ├── dispatching-parallel-agents
│   │   │   └── SKILL.md
│   │   ├── executing-plans
│   │   │   ├── scripts
│   │   │   │   ├── task-done
│   │   │   │   └── task-start
│   │   │   └── SKILL.md
│   │   ├── find-skills
│   │   │   └── SKILL.md
│   │   ├── finishing-a-development-branch
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
│   │   ├── gemini-api-dev
│   │   │   ├── references
│   │   │   │   └── migration.md
│   │   │   └── SKILL.md
│   │   ├── grill-with-docs
│   │   │   ├── agents
│   │   │   │   └── openai.yaml
│   │   │   └── SKILL.md
│   │   ├── gsd-add-tests
│   │   │   └── SKILL.md
│   │   ├── gsd-ai-integration-phase
│   │   │   └── SKILL.md
│   │   ├── gsd-audit-fix
│   │   │   └── SKILL.md
│   │   ├── gsd-audit-milestone
│   │   │   └── SKILL.md
│   │   ├── gsd-audit-uat
│   │   │   └── SKILL.md
│   │   ├── gsd-autonomous
│   │   │   └── SKILL.md
│   │   ├── gsd-capture
│   │   │   └── SKILL.md
│   │   ├── gsd-cleanup
│   │   │   └── SKILL.md
│   │   ├── gsd-code-review
│   │   │   └── SKILL.md
│   │   ├── gsd-complete-milestone
│   │   │   └── SKILL.md
│   │   ├── gsd-config
│   │   │   └── SKILL.md
│   │   ├── gsd-debug
│   │   │   └── SKILL.md
│   │   ├── gsd-discuss-phase
│   │   │   └── SKILL.md
│   │   ├── gsd-docs-update
│   │   │   └── SKILL.md
│   │   ├── gsd-eval-review
│   │   │   └── SKILL.md
│   │   ├── gsd-execute-phase
│   │   │   └── SKILL.md
│   │   ├── gsd-explore
│   │   │   └── SKILL.md
│   │   ├── gsd-extract-learnings
│   │   │   └── SKILL.md
│   │   ├── gsd-fast
│   │   │   └── SKILL.md
│   │   ├── gsd-forensics
│   │   │   └── SKILL.md
│   │   ├── gsd-graphify
│   │   │   └── SKILL.md
│   │   ├── gsd-health
│   │   │   └── SKILL.md
│   │   ├── gsd-help
│   │   │   └── SKILL.md
│   │   ├── gsd-import
│   │   │   └── SKILL.md
│   │   ├── gsd-inbox
│   │   │   └── SKILL.md
│   │   ├── gsd-ingest-docs
│   │   │   └── SKILL.md
│   │   ├── gsd-manager
│   │   │   └── SKILL.md
│   │   ├── gsd-map-codebase
│   │   │   └── SKILL.md
│   │   ├── gsd-mempalace-capture
│   │   │   └── SKILL.md
│   │   ├── gsd-mempalace-recall
│   │   │   └── SKILL.md
│   │   ├── gsd-milestone-summary
│   │   │   └── SKILL.md
│   │   ├── gsd-mvp-phase
│   │   │   └── SKILL.md
│   │   ├── gsd-new-milestone
│   │   │   └── SKILL.md
│   │   ├── gsd-new-project
│   │   │   └── SKILL.md
│   │   ├── gsd-next
│   │   │   └── SKILL.md
│   │   ├── gsd-ns-context
│   │   │   └── SKILL.md
│   │   ├── gsd-ns-ideate
│   │   │   └── SKILL.md
│   │   ├── gsd-ns-manage
│   │   │   └── SKILL.md
│   │   ├── gsd-ns-project
│   │   │   └── SKILL.md
│   │   ├── gsd-ns-review
│   │   │   └── SKILL.md
│   │   ├── gsd-ns-workflow
│   │   │   └── SKILL.md
│   │   ├── gsd-onboard
│   │   │   └── SKILL.md
│   │   ├── gsd-pause-work
│   │   │   └── SKILL.md
│   │   ├── gsd-phase
│   │   │   └── SKILL.md
│   │   ├── gsd-plan-phase
│   │   │   └── SKILL.md
│   │   ├── gsd-plan-review-convergence
│   │   │   └── SKILL.md
│   │   ├── gsd-pr-branch
│   │   │   └── SKILL.md
│   │   ├── gsd-profile-user
│   │   │   └── SKILL.md
│   │   ├── gsd-progress
│   │   │   └── SKILL.md
│   │   ├── gsd-quick
│   │   │   └── SKILL.md
│   │   ├── gsd-quick-batch
│   │   │   └── SKILL.md
│   │   ├── gsd-resume-work
│   │   │   └── SKILL.md
│   │   ├── gsd-review
│   │   │   └── SKILL.md
│   │   ├── gsd-review-backlog
│   │   │   └── SKILL.md
│   │   ├── gsd-secure-phase
│   │   │   └── SKILL.md
│   │   ├── gsd-settings
│   │   │   └── SKILL.md
│   │   ├── gsd-ship
│   │   │   └── SKILL.md
│   │   ├── gsd-sketch
│   │   │   └── SKILL.md
│   │   ├── gsd-spec-phase
│   │   │   └── SKILL.md
│   │   ├── gsd-spike
│   │   │   └── SKILL.md
│   │   ├── gsd-stats
│   │   │   └── SKILL.md
│   │   ├── gsd-surface
│   │   │   └── SKILL.md
│   │   ├── gsd-thread
│   │   │   └── SKILL.md
│   │   ├── gsd-ui-phase
│   │   │   └── SKILL.md
│   │   ├── gsd-ui-review
│   │   │   └── SKILL.md
│   │   ├── gsd-ultraplan-phase
│   │   │   └── SKILL.md
│   │   ├── gsd-undo
│   │   │   └── SKILL.md
│   │   ├── gsd-update
│   │   │   └── SKILL.md
│   │   ├── gsd-validate-phase
│   │   │   └── SKILL.md
│   │   ├── gsd-verify-work
│   │   │   └── SKILL.md
│   │   ├── gsd-workspace
│   │   │   └── SKILL.md
│   │   ├── gsd-workstreams
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
│   │   ├── migrate-radix-to-base
│   │   │   ├── class-mapping.md
│   │   │   ├── consumer-props.md
│   │   │   ├── disclosure.md
│   │   │   ├── display-misc.md
│   │   │   ├── form-controls.md
│   │   │   ├── menus.md
│   │   │   ├── overlays.md
│   │   │   ├── SKILL.md
│   │   │   ├── universal-patterns.md
│   │   │   └── wrapper-shapes.md
│   │   ├── nextjs-app-router-patterns
│   │   │   └── SKILL.md
│   │   ├── nextjs-best-practices
│   │   │   └── SKILL.md
│   │   ├── receiving-code-review
│   │   │   └── SKILL.md
│   │   ├── requesting-code-review
│   │   │   ├── code-reviewer.md
│   │   │   └── SKILL.md
│   │   ├── shadcn
│   │   │   ├── agents
│   │   │   │   └── openai.yml
│   │   │   ├── assets
│   │   │   │   ├── showcase
│   │   │   │   │   ├── color-pair.tsx
│   │   │   │   │   ├── preview-states.css
│   │   │   │   │   └── state-matrix.tsx
│   │   │   │   ├── shadcn-small.png
│   │   │   │   └── shadcn.png
│   │   │   ├── evals
│   │   │   │   └── evals.json
│   │   │   ├── rules
│   │   │   │   ├── base-vs-radix.md
│   │   │   │   ├── chat.md
│   │   │   │   ├── composition.md
│   │   │   │   ├── forms.md
│   │   │   │   ├── icons.md
│   │   │   │   └── styling.md
│   │   │   ├── scripts
│   │   │   │   └── showcase-coverage.mjs
│   │   │   ├── cli.md
│   │   │   ├── customization.md
│   │   │   ├── design-system-page.md
│   │   │   ├── design-system.md
│   │   │   ├── mcp.md
│   │   │   ├── registry.md
│   │   │   └── SKILL.md
│   │   ├── subagent-driven-development
│   │   │   ├── references
│   │   │   │   ├── batching.md
│   │   │   │   ├── cannot-verify.md
│   │   │   │   ├── final-review.md
│   │   │   │   ├── fix-loop.md
│   │   │   │   ├── handling-reports.md
│   │   │   │   ├── preflight.md
│   │   │   │   └── resuming.md
│   │   │   ├── scripts
│   │   │   │   ├── review-package
│   │   │   │   ├── sdd-workspace
│   │   │   │   └── task-brief
│   │   │   ├── implementer-prompt.md
│   │   │   ├── re-review-prompt.md
│   │   │   ├── SKILL.md
│   │   │   └── task-reviewer-prompt.md
│   │   ├── systematic-debugging
│   │   │   ├── condition-based-waiting-example.ts
│   │   │   ├── condition-based-waiting.md
│   │   │   ├── CREATION-LOG.md
│   │   │   ├── defense-in-depth.md
│   │   │   ├── find-polluter.sh
│   │   │   ├── root-cause-tracing.md
│   │   │   ├── SKILL.md
│   │   │   ├── test-academic.md
│   │   │   ├── test-pressure-1.md
│   │   │   ├── test-pressure-2.md
│   │   │   └── test-pressure-3.md
│   │   ├── test-driven-development
│   │   │   ├── SKILL.md
│   │   │   └── writing-good-tests.md
│   │   ├── ui-ux-pro-max
│   │   │   ├── data
│   │   │   ├── scripts
│   │   │   └── SKILL.md
│   │   ├── using-git-worktrees
│   │   │   └── SKILL.md
│   │   ├── using-superpowers
│   │   │   ├── references
│   │   │   │   ├── antigravity-tools.md
│   │   │   │   ├── claude-code-tools.md
│   │   │   │   ├── codex-tools.md
│   │   │   │   ├── gemini-tools.md
│   │   │   │   ├── hermes-tools.md
│   │   │   │   ├── muse-tools.md
│   │   │   │   └── pi-tools.md
│   │   │   └── SKILL.md
│   │   ├── verification-before-completion
│   │   │   └── SKILL.md
│   │   ├── writing-plans
│   │   │   └── SKILL.md
│   │   └── writing-skills
│   │       ├── references
│   │       │   ├── anthropic-best-practices.md
│   │       │   ├── bulletproofing.md
│   │       │   ├── CLAUDE_MD_TESTING.md
│   │       │   ├── discovery.md
│   │       │   ├── flowcharts.md
│   │       │   ├── graphviz-conventions.dot
│   │       │   ├── persuasion-principles.md
│   │       │   └── testing-skills-with-subagents.md
│   │       ├── render-graphs.js
│   │       └── SKILL.md
│   └── workflows
│       └── buildbotAI-capabilities.md
├── .claude
│   └── skills
│       ├── firebase
│       │   └── SKILL.md
│       ├── frontend-design
│       │   ├── LICENSE.txt
│       │   └── SKILL.md
│       ├── nextjs-app-router-patterns
│       │   └── SKILL.md
│       └── nextjs-best-practices
│           └── SKILL.md
├── .husky
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
│   ├── admin_inventory_dialog_saving.md
│   ├── admin_prebuilt_ai_assist.md
│   ├── admin_prebuilt_builder_navigation.md
│   ├── admin_prebuilt_pricing.md
│   ├── admin_session_and_idle_timeout.md
│   ├── ai_model_routing.md
│   ├── ai_part_images.md
│   ├── build_advisor_performance.md
│   ├── builder_compatibility.md
│   ├── catalog_images.md
│   ├── chatbot_build_context.md
│   ├── checkout_order_persistence.md
│   ├── component_description_formatting.md
│   ├── customer_build_pdf.md
│   ├── customer_order_workflow.md
│   ├── customer_ui_spacing.md
│   ├── google_auth_feedback.md
│   ├── import_catalog_images.md
│   ├── ingest_knowledge.md
│   ├── integrated_graphics.md
│   ├── inventory_hierarchy_migration.md
│   ├── inventory_performance.md
│   ├── landing_static_assets.md
│   ├── live_builder_recommendations.md
│   ├── password_reset.md
│   ├── prebuilt_product_availability.md
│   ├── public_parts_performance.md
│   ├── qr_inventory.md
│   ├── sales_analytics_export.md
│   ├── saved_build_loading.md
│   └── support_requests.md
├── docs
│   ├── diagrams
│   │   ├── data-flow-level-0.svg
│   │   ├── data-flow-level-1.svg
│   │   ├── data-flow-level-2-contact.svg
│   │   ├── data-flow-level-2-reservation.svg
│   │   └── firestore-data-map.svg
│   ├── flowcharts
│   │   ├── ai-system
│   │   │   ├── ai-architecture-flowchart.md
│   │   │   ├── ai-architecture-flowchart.mmd
│   │   │   ├── ai-build-critique-flowchart.md
│   │   │   ├── ai-build-critique-flowchart.mmd
│   │   │   ├── ai-chatbot-flowchart.md
│   │   │   ├── ai-chatbot-flowchart.mmd
│   │   │   ├── ai-data-processing-flowchart.md
│   │   │   ├── ai-data-processing-flowchart.mmd
│   │   │   ├── ai-decision-flowchart.md
│   │   │   ├── ai-decision-flowchart.mmd
│   │   │   ├── ai-error-handling-flowchart.md
│   │   │   ├── ai-error-handling-flowchart.mmd
│   │   │   ├── ai-interaction-inventory.md
│   │   │   ├── ai-master-flowchart.md
│   │   │   ├── ai-master-flowchart.mmd
│   │   │   ├── ai-part-extraction-flowchart.md
│   │   │   ├── ai-part-extraction-flowchart.mmd
│   │   │   ├── ai-prebuilt-assist-flowchart.md
│   │   │   ├── ai-prebuilt-assist-flowchart.mmd
│   │   │   ├── ai-prebuilt-performance-flowchart.md
│   │   │   ├── ai-prebuilt-performance-flowchart.mmd
│   │   │   ├── ai-recommendations-flowchart.md
│   │   │   ├── ai-recommendations-flowchart.mmd
│   │   │   ├── ai-settings-flowchart.md
│   │   │   ├── ai-settings-flowchart.mmd
│   │   │   ├── ai-smart-budget-flowchart.md
│   │   │   └── ai-smart-budget-flowchart.mmd
│   │   ├── admin-inventory-flowchart.md
│   │   ├── admin-inventory-flowchart.mmd
│   │   ├── admin-operations-flowchart.md
│   │   ├── admin-operations-flowchart.mmd
│   │   ├── authentication-flowchart-01.mmd
│   │   ├── authentication-flowchart-02.mmd
│   │   ├── authentication-flowchart.md
│   │   ├── builder-flowchart.md
│   │   ├── builder-flowchart.mmd
│   │   ├── error-handling-flowcharts.md
│   │   ├── error-handling-flowcharts.mmd
│   │   ├── interaction-inventory.md
│   │   ├── manager-flowchart.md
│   │   ├── manager-flowchart.mmd
│   │   ├── master-system-flowchart.md
│   │   ├── master-system-flowchart.mmd
│   │   ├── popup-decision-flowcharts-01.mmd
│   │   ├── popup-decision-flowcharts-02.mmd
│   │   ├── popup-decision-flowcharts-03.mmd
│   │   ├── popup-decision-flowcharts-04.mmd
│   │   ├── popup-decision-flowcharts.md
│   │   ├── prebuilts-flowchart.md
│   │   ├── prebuilts-flowchart.mmd
│   │   ├── profile-flowchart.md
│   │   ├── profile-flowchart.mmd
│   │   ├── public-navigation-flowchart.md
│   │   ├── public-navigation-flowchart.mmd
│   │   ├── README.md
│   │   ├── reservations-flowchart-01.mmd
│   │   ├── reservations-flowchart-02.mmd
│   │   ├── reservations-flowchart.md
│   │   ├── simplified-all-features-flowchart-01.mmd
│   │   ├── simplified-all-features-flowchart-02.mmd
│   │   ├── simplified-all-features-flowchart-03.mmd
│   │   ├── simplified-all-features-flowchart-04.mmd
│   │   ├── simplified-all-features-flowchart.md
│   │   ├── super-admin-flowchart.md
│   │   ├── super-admin-flowchart.mmd
│   │   ├── user-flowchart.md
│   │   └── user-flowchart.mmd
│   ├── superpowers
│   │   ├── plans
│   │   │   ├── 2026-11-02-customer-order-activity-payment-gate.md
│   │   │   ├── 2026-11-02-order-receipt.md
│   │   │   ├── 2026-11-04-admin-verification-loader.md
│   │   │   ├── 2026-11-04-loading-layouts.md
│   │   │   ├── 2026-11-04-public-auth-flicker.md
│   │   │   └── 2026-11-06-inventory-catalog-scaling.md
│   │   └── specs
│   │       ├── 2026-11-02-customer-order-activity-payment-gate-design.md
│   │       ├── 2026-11-02-order-receipt-design.md
│   │       └── 2026-11-04-admin-verification-loader-design.md
│   ├── test-cases
│   │   └── all-pages-manual-test-cases.md
│   ├── admin-order-phase-5.md
│   ├── admin-order-phase-6-7.md
│   ├── admin-order-phases-3-4.md
│   ├── api-and-integrations.md
│   ├── architecture.md
│   ├── backend.json
│   ├── blueprint.md
│   ├── build_advisor_performance_plan.md
│   ├── build_advisor_web_search_plan.md
│   ├── contact-inquiries-setup.md
│   ├── data-flow-diagram.md
│   ├── database_scalability_plan.md
│   ├── firebase-and-data.md
│   ├── firestore-data-map.md
│   ├── implementation-plan-and-results.md
│   ├── input-output-audit.md
│   ├── inventory_performance_audit.md
│   ├── inventory_scaling_rollout_2026-11-06.md
│   ├── landing_performance_audit.md
│   ├── pages.md
│   ├── project_structure.md
│   ├── qr_inventory_feature_plan.md
│   ├── qr_system_improvement_plan.md
│   ├── ui-pages-and-overlays-audit.md
│   └── user-guide.md
├── execution
│   ├── audit_inventory_performance.mjs
│   ├── audit_landing_performance.mjs
│   ├── backfill_inventory_query_fields.ts
│   ├── backup_qr_catalog.ts
│   ├── benchmark_build_advisor.mjs
│   ├── benchmark_build_critique.ts
│   ├── consolidate_collections.ts
│   ├── delete-test-builders.js
│   ├── generate_favicon.js
│   ├── generate_project_structure.js
│   ├── ingest_website.py
│   ├── migrate_audit_logs.ts
│   ├── migrate_inventory_hierarchy.ts
│   ├── migrate_product_identities.ts
│   ├── update_changelog.js
│   ├── verify_inventory_hierarchy.ts
│   ├── verify_loading_layouts.mjs
│   ├── verify_product_identities.ts
│   ├── verify_public_firestore_reads.ts
│   └── verify_qr_feature.mjs
├── output
│   └── pdf
│       ├── buildbotai-all-pages-test-cases-printable.pdf
│       ├── buildbotai-ui-pages-and-overlays-audit.pdf
│       └── netcodex-order-receipt-preview.pdf
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
│   ├── videos
│   │   ├── king45.mp4
│   │   └── prism5.mp4
│   ├── cosmic-bg.png
│   ├── hero-pc.png
│   ├── landing-hero.png
│   ├── netcodex_cc_2026_white.png.webp
│   ├── netcodex-emblem.png
│   ├── netcodex-logo-white.png
│   └── netcodex-storefront.png
├── scratch
│   ├── app.spec.ts
│   ├── build_summary_diff.txt
│   ├── check-firestore-schema.js
│   ├── check-inventory.ts
│   ├── check-models.js
│   ├── find-bad-data.js
│   ├── list-models.js
│   ├── print-raw-response.js
│   ├── screenshot-home.png
│   ├── screenshot-system-access.png
│   ├── test-chat.js
│   ├── test-fetch.ts
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
│   │   ├── schemas
│   │   │   ├── build-advisor-schemas.ts
│   │   │   └── critique-schemas.ts
│   │   ├── dev.ts
│   │   └── genkit.ts
│   ├── app
│   │   ├── about
│   │   │   └── page.tsx
│   │   ├── admin
│   │   │   ├── components
│   │   │   │   ├── orders
│   │   │   │   │   ├── copyable-order-id.tsx
│   │   │   │   │   ├── order-action-modals.tsx
│   │   │   │   │   ├── order-activity-timeline.tsx
│   │   │   │   │   ├── order-assembly-verification.tsx
│   │   │   │   │   ├── order-card-controls.tsx
│   │   │   │   │   ├── order-card-customer-finance.tsx
│   │   │   │   │   ├── order-card-fulfillment-stepper.tsx
│   │   │   │   │   ├── order-card-history-ledgers.tsx
│   │   │   │   │   ├── order-card-items-layout.test.ts
│   │   │   │   │   ├── order-card-items-list.tsx
│   │   │   │   │   ├── order-card.tsx
│   │   │   │   │   ├── order-history-ledgers.tsx
│   │   │   │   │   ├── order-history-modal.tsx
│   │   │   │   │   ├── order-payment-control.tsx
│   │   │   │   │   ├── order-payment-dialogs.tsx
│   │   │   │   │   ├── order-stage-control.tsx
│   │   │   │   │   ├── order-stage-dialog.tsx
│   │   │   │   │   ├── order-status-config.ts
│   │   │   │   │   ├── orders-card-layout.test.ts
│   │   │   │   │   ├── orders-filter-panel.tsx
│   │   │   │   │   ├── orders-header-bar.tsx
│   │   │   │   │   ├── orders-tab.tsx
│   │   │   │   │   ├── orders-table.tsx
│   │   │   │   │   └── refund-reconcile-control.tsx
│   │   │   │   ├── admin-sidebar-order-counts.test.ts
│   │   │   │   ├── admin-sidebar.tsx
│   │   │   │   ├── admin-tab-header.tsx
│   │   │   │   ├── admin-topbar.tsx
│   │   │   │   ├── archive-tab.tsx
│   │   │   │   ├── order-payment-status-dialog.tsx
│   │   │   │   ├── order-refund-dialog.tsx
│   │   │   │   ├── prebuilt-tab.tsx
│   │   │   │   ├── reservations-tab.tsx
│   │   │   │   ├── sales-tab.tsx
│   │   │   │   └── stock-tab.tsx
│   │   │   ├── contact-inquiries
│   │   │   │   └── page.tsx
│   │   │   ├── hooks
│   │   │   │   ├── use-admin-core.ts
│   │   │   │   ├── use-bulk-actions.ts
│   │   │   │   ├── use-inventory-page.ts
│   │   │   │   ├── use-inventory.ts
│   │   │   │   ├── use-order-actions.ts
│   │   │   │   ├── use-order-activity.ts
│   │   │   │   ├── use-order-assembly.ts
│   │   │   │   ├── use-orders-listener.test.ts
│   │   │   │   ├── use-orders-view.ts
│   │   │   │   ├── use-orders.ts
│   │   │   │   ├── use-payment-status-dialog.ts
│   │   │   │   ├── use-prebuilt-builder-import.ts
│   │   │   │   ├── use-refund-reconciliation.ts
│   │   │   │   └── use-sales-actions.ts
│   │   │   ├── prebuilt-builder
│   │   │   │   └── page.tsx
│   │   │   ├── inventory-query-actions.ts
│   │   │   ├── order-activity-actions.ts
│   │   │   ├── order-assembly-actions.ts
│   │   │   ├── order-refund-actions.ts
│   │   │   ├── page.tsx
│   │   │   ├── reservation-actions.ts
│   │   │   └── sales-admin-actions.ts
│   │   ├── ai-build-advisor
│   │   │   ├── components
│   │   │   │   ├── advisor-header.tsx
│   │   │   │   ├── advisor-loading-content.tsx
│   │   │   │   ├── critique-tab.tsx
│   │   │   │   └── recommendation-tab.tsx
│   │   │   ├── hooks
│   │   │   │   ├── use-advisor-data.ts
│   │   │   │   ├── use-advisor-state.ts
│   │   │   │   ├── use-critique-logic.ts
│   │   │   │   └── use-recommendation-logic.ts
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── api
│   │   │   ├── admin
│   │   │   │   ├── qr-health
│   │   │   │   │   └── route.ts
│   │   │   │   └── qr-status
│   │   │   │       └── [token]
│   │   │   │           └── route.ts
│   │   │   ├── ai
│   │   │   │   └── build-advisor
│   │   │   │       ├── critique
│   │   │   │       │   └── route.ts
│   │   │   │       └── recommendations
│   │   │   │           └── route.ts
│   │   │   ├── builder
│   │   │   │   ├── download
│   │   │   │   │   └── route.ts
│   │   │   │   └── live-recommendations
│   │   │   │       └── route.ts
│   │   │   ├── chat
│   │   │   │   └── route.ts
│   │   │   ├── contact
│   │   │   │   ├── delete
│   │   │   │   │   └── route.ts
│   │   │   │   ├── gmail
│   │   │   │   │   ├── oauth
│   │   │   │   │   │   ├── callback
│   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   └── start
│   │   │   │   │   │       └── route.ts
│   │   │   │   │   ├── renew
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── webhook
│   │   │   │   │       └── route.ts
│   │   │   │   ├── messages
│   │   │   │   │   ├── retry
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── read
│   │   │   │   │   └── route.ts
│   │   │   │   ├── status
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── cron
│   │   │   │   └── expire-orders
│   │   │   │       └── route.ts
│   │   │   ├── featured-accessories
│   │   │   │   └── route.ts
│   │   │   ├── featured-parts
│   │   │   │   └── route.ts
│   │   │   ├── qr
│   │   │   │   └── [token]
│   │   │   │       └── route.ts
│   │   │   ├── system-access
│   │   │   │   └── authenticate
│   │   │   │       └── route.ts
│   │   │   └── webhooks
│   │   │       └── paymongo
│   │   │           └── route.ts
│   │   ├── builder
│   │   │   ├── components
│   │   │   │   ├── builder-header.tsx
│   │   │   │   └── inventory-view.tsx
│   │   │   ├── hooks
│   │   │   │   ├── use-builder-logic.ts
│   │   │   │   ├── use-filtered-inventory.ts
│   │   │   │   └── use-inventory-query.ts
│   │   │   ├── builder-page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── checkout
│   │   │   └── page.tsx
│   │   ├── contact
│   │   │   └── page.tsx
│   │   ├── faq
│   │   │   ├── faq-data.ts
│   │   │   └── page.tsx
│   │   ├── forgot-password
│   │   │   └── page.tsx
│   │   ├── group
│   │   │   └── page.tsx
│   │   ├── landing-video
│   │   │   └── [name]
│   │   │       └── route.ts
│   │   ├── parts
│   │   │   ├── [productId]
│   │   │   │   ├── loading.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── catalog-actions.ts
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── pre-builts
│   │   │   ├── [id]
│   │   │   │   ├── components
│   │   │   │   │   ├── prebuilt-action-card.tsx
│   │   │   │   │   ├── prebuilt-ai-highlights.tsx
│   │   │   │   │   ├── prebuilt-ai-review.tsx
│   │   │   │   │   ├── prebuilt-component-carousel.tsx
│   │   │   │   │   ├── prebuilt-header-card.tsx
│   │   │   │   │   ├── prebuilt-image-view.tsx
│   │   │   │   │   ├── prebuilt-parts-accordion.tsx
│   │   │   │   │   ├── prebuilt-parts-list.tsx
│   │   │   │   │   └── prebuilt-performance-analyzer.tsx
│   │   │   │   ├── hooks
│   │   │   │   │   └── use-prebuilt-details.ts
│   │   │   │   ├── legacy-prebuilt-product.tsx
│   │   │   │   ├── loading.tsx
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── profile
│   │   │   ├── components
│   │   │   │   ├── account-details.tsx
│   │   │   │   ├── address-book-section.tsx
│   │   │   │   ├── audit-logs-section.tsx
│   │   │   │   ├── compose-inquiry-modal.tsx
│   │   │   │   ├── contact-inbox-tab.tsx
│   │   │   │   ├── customer-support-tab.tsx
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
│   │   │   │   ├── use-contact-inbox.ts
│   │   │   │   ├── use-customer-support.ts
│   │   │   │   ├── use-emergency-controls.ts
│   │   │   │   ├── use-favorite-inventory.ts
│   │   │   │   ├── use-favorites.ts
│   │   │   │   ├── use-profile-state.ts
│   │   │   │   ├── use-reservations.ts
│   │   │   │   └── use-user-audit-logs.ts
│   │   │   └── page.tsx
│   │   ├── q
│   │   │   └── [token]
│   │   │       └── page.tsx
│   │   ├── signin
│   │   │   └── page.tsx
│   │   ├── signup
│   │   │   └── page.tsx
│   │   ├── support-requests
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
│   │   ├── apple-icon.png
│   │   ├── checkout-actions.ts
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── icon.svg
│   │   ├── image-actions.ts
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── page.tsx
│   │   ├── prebuilt-reservation-actions.ts
│   │   ├── product-actions.ts
│   │   └── public-product-actions.ts
│   ├── assets
│   │   ├── about
│   │   │   └── netcodex-storefront.png
│   │   ├── branding
│   │   │   ├── netcodex_cc_2026_white.png.webp
│   │   │   ├── netcodex-emblem.png
│   │   │   └── netcodex-logo-white.png
│   │   ├── landing
│   │   │   ├── custom-builder-parts.png
│   │   │   ├── feature-1.webp
│   │   │   ├── feature-2.webp
│   │   │   ├── feature-3.webp
│   │   │   ├── hero-custom-v2.webp
│   │   │   ├── hero-custom.webp
│   │   │   ├── king45-poster.webp
│   │   │   ├── prebuilt-pcs.png
│   │   │   └── prism5-poster.webp
│   │   └── team
│   │       ├── developer_m.png
│   │       ├── developer.png
│   │       ├── documentation_m.png
│   │       ├── documentation.png
│   │       ├── pm_m.png
│   │       ├── pm.png
│   │       ├── rayzon.jpg
│   │       ├── rayzon.png
│   │       ├── ui_m.png
│   │       └── ui.png
│   ├── components
│   │   ├── auth
│   │   │   ├── auth-background.module.css
│   │   │   ├── auth-background.tsx
│   │   │   ├── protected-page-loading.tsx
│   │   │   ├── route-guard.tsx
│   │   │   ├── session-timeout.tsx
│   │   │   ├── sign-out-loader.tsx
│   │   │   └── terms-of-agreement-modal.tsx
│   │   ├── bottleneck
│   │   │   ├── bottleneck-prototype-controller.tsx
│   │   │   ├── bottleneck-status-card.tsx
│   │   │   ├── dual-sidebar-analyzer.tsx
│   │   │   ├── fps-chart-plot.tsx
│   │   │   ├── fps-performance-chart.tsx
│   │   │   ├── optimization-swaps-card.tsx
│   │   │   ├── prototype-bottom-dock.tsx
│   │   │   ├── prototype-dual-sidebar.tsx
│   │   │   ├── prototype-slide-drawer.tsx
│   │   │   ├── prototype-top-hud.tsx
│   │   │   └── synergy-gauge-card.tsx
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
│   │   ├── contact
│   │   │   └── contact-thread.tsx
│   │   ├── ecommerce
│   │   │   ├── cart-drawer.tsx
│   │   │   ├── checkout-modal.tsx
│   │   │   ├── header-cart-button.tsx
│   │   │   ├── mock-orders-section.tsx
│   │   │   ├── paymongo-checkout-modal.tsx
│   │   │   └── simulated-gcash-modal.tsx
│   │   ├── landing
│   │   │   ├── accessories-section.tsx
│   │   │   ├── deferred-prebuilt-showcase.tsx
│   │   │   ├── feature-showcase.tsx
│   │   │   ├── featured-products-section.tsx
│   │   │   ├── features-section.tsx
│   │   │   ├── hero-section.tsx
│   │   │   ├── landing-page.tsx
│   │   │   ├── prebuilt-showcase.tsx
│   │   │   ├── section-header.tsx
│   │   │   ├── shopping-paths-section.tsx
│   │   │   ├── team-section.tsx
│   │   │   ├── unified-background.tsx
│   │   │   └── why-choose-section.tsx
│   │   ├── loading
│   │   │   ├── admin-inventory-skeleton.tsx
│   │   │   ├── admin-panel-skeleton.tsx
│   │   │   ├── carousel-skeleton.tsx
│   │   │   ├── catalog-card-skeleton.tsx
│   │   │   ├── dashboard-card-skeleton.tsx
│   │   │   ├── inventory-loading.tsx
│   │   │   ├── order-card-skeleton.tsx
│   │   │   ├── prebuilt-card-skeleton.tsx
│   │   │   ├── prebuilt-detail-skeleton.tsx
│   │   │   ├── prebuilt-showcase-skeleton.tsx
│   │   │   ├── profile-list-skeleton.tsx
│   │   │   └── table-loading-rows.tsx
│   │   ├── orders
│   │   │   ├── customer-order-activity.tsx
│   │   │   └── download-receipt-button.tsx
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
│   │   │   ├── ai-action-button.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── animated-icons.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── canvas-text.tsx
│   │   │   ├── card.tsx
│   │   │   ├── carousel.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── compact-info.tsx
│   │   │   ├── confirmation-alert-dialog.tsx
│   │   │   ├── deferred-dialog.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
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
│   │   │   ├── skeleton.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── sliding-image.tsx
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
│   │   ├── add-part-dialog.tsx
│   │   ├── add-part-editor.tsx
│   │   ├── add-prebuilt-dialog.tsx
│   │   ├── add-stock-dialog.tsx
│   │   ├── admin-product-focus.tsx
│   │   ├── admin-qr-lifecycle-modal.tsx
│   │   ├── advisor-job-toast.tsx
│   │   ├── ai-build-critique.tsx
│   │   ├── ai-disclaimer.tsx
│   │   ├── ai-model-settings.tsx
│   │   ├── ai-progress-modal.tsx
│   │   ├── ai-system-prompts-settings.tsx
│   │   ├── app-layout.tsx
│   │   ├── budget-slider.tsx
│   │   ├── build-recommendation-notes.tsx
│   │   ├── build-summary.tsx
│   │   ├── builder-floating-analytics.tsx
│   │   ├── builder-floating-chat.tsx
│   │   ├── catalog-qr-button.tsx
│   │   ├── chat-form.tsx
│   │   ├── component-card.tsx
│   │   ├── deferred-builder-chat.tsx
│   │   ├── footer.tsx
│   │   ├── full-page-loader.tsx
│   │   ├── header-mega-menu.tsx
│   │   ├── header.module.css
│   │   ├── header.tsx
│   │   ├── image-upload.tsx
│   │   ├── inventory-part-card.tsx
│   │   ├── inventory-prebuilt-card.tsx
│   │   ├── inventory-save-success-dialog.tsx
│   │   ├── inventory-table.tsx
│   │   ├── inventory-toolbar.tsx
│   │   ├── logo.tsx
│   │   ├── maintenance-screen.tsx
│   │   ├── notification-center.tsx
│   │   ├── order-details-modal.tsx
│   │   ├── order-expiration-timer.tsx
│   │   ├── pagination-controls.tsx
│   │   ├── part-builder-compatibility-modal.tsx
│   │   ├── part-card.tsx
│   │   ├── part-details-content.tsx
│   │   ├── part-details-dialog.tsx
│   │   ├── part-related-products.tsx
│   │   ├── prebuilt-builder-add-dialog.tsx
│   │   ├── prebuilt-card-specs.tsx
│   │   ├── prebuilt-system-card.tsx
│   │   ├── prebuilts-table.tsx
│   │   ├── product-identification.tsx
│   │   ├── product-identity-link.tsx
│   │   ├── product-qr.tsx
│   │   ├── public-part-card.tsx
│   │   ├── public-part-list-item.tsx
│   │   ├── public-part-page.tsx
│   │   ├── public-parts-catalog.tsx
│   │   ├── public-parts-toolbar.tsx
│   │   ├── public-product-page.tsx
│   │   ├── qr-health-dialog.tsx
│   │   ├── qr-scanner-dialog.tsx
│   │   ├── sales-analytics.tsx
│   │   ├── sales-financial-kpis.tsx
│   │   ├── search-no-results.tsx
│   │   ├── smart-budget.tsx
│   │   ├── stock-editor.tsx
│   │   ├── super-admin-settings.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── user-notifications.tsx
│   │   └── your-build.tsx
│   ├── context
│   │   ├── advisor-jobs-context.tsx
│   │   ├── advisor-jobs-scope.tsx
│   │   ├── ecommerce-context.tsx
│   │   ├── loading-context.tsx
│   │   ├── sign-out-transition.tsx
│   │   ├── site-settings-context.tsx
│   │   ├── theme-provider.tsx
│   │   └── user-profile.tsx
│   ├── firebase
│   │   ├── auth
│   │   │   ├── google-auth.tsx
│   │   │   └── use-user.tsx
│   │   ├── firestore
│   │   │   ├── use-collection.tsx
│   │   │   ├── use-doc.tsx
│   │   │   └── use-inventory-parts.ts
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
│   │   ├── use-address-book.ts
│   │   ├── use-admin-session-guard.ts
│   │   ├── use-build-actions.ts
│   │   ├── use-build-pdf-download.ts
│   │   ├── use-customer-rig-assembly.ts
│   │   ├── use-idle-timeout.ts
│   │   ├── use-inventory-image-count.ts
│   │   ├── use-live-build-recommendations.ts
│   │   ├── use-mobile.tsx
│   │   ├── use-near-viewport.ts
│   │   ├── use-order-details-modal.ts
│   │   ├── use-part-builder-compatibility.ts
│   │   ├── use-part-form.ts
│   │   ├── use-paymongo-checkout-modal.ts
│   │   ├── use-persistent-state.ts
│   │   ├── use-product-qr.ts
│   │   ├── use-product-save-operation.ts
│   │   ├── use-public-parts-compatibility.ts
│   │   ├── use-public-product-actions.ts
│   │   ├── use-qr-health.ts
│   │   ├── use-qr-resolver.ts
│   │   ├── use-qr-scanner.ts
│   │   ├── use-qr-status.ts
│   │   ├── use-quick-build-checks.ts
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
│       ├── server
│       │   ├── admin-inventory-queries.ts
│       │   ├── builder-catalog.ts
│       │   ├── contact-auth.ts
│       │   ├── gmail.ts
│       │   ├── order-activity.ts
│       │   ├── order-auth.ts
│       │   ├── order-expiration-sweep.ts
│       │   ├── order-operations.ts
│       │   ├── order-payment-session.ts
│       │   ├── order-refund-notifications.ts
│       │   ├── order-refund-reconciliation.ts
│       │   ├── paymongo.ts
│       │   ├── product-identities.ts
│       │   ├── public-catalog-queries.ts
│       │   ├── public-products.ts
│       │   ├── qr-auth.ts
│       │   ├── qr-health-analysis.ts
│       │   └── qr-health.ts
│       ├── admin-inventory-query.test.ts
│       ├── admin-inventory-query.ts
│       ├── advisor-inventory.ts
│       ├── advisor-timing.ts
│       ├── advisor-web-research.ts
│       ├── ai-model-resolver.ts
│       ├── auth-utils.ts
│       ├── bottleneck.ts
│       ├── build-advisor-goals.ts
│       ├── build-pdf-categories.ts
│       ├── build-pdf.ts
│       ├── catalog-name-validation.test.ts
│       ├── catalog-name-validation.ts
│       ├── chat-conversation.test.ts
│       ├── chat-conversation.ts
│       ├── chat-message-parts.test.ts
│       ├── chat-message-parts.ts
│       ├── chat-part-specifications.ts
│       ├── chat-recommendation-facts.test.ts
│       ├── chat-recommendation-facts.ts
│       ├── chat-recommendations.test.ts
│       ├── chat-recommendations.ts
│       ├── chat-stream-fallback.test.ts
│       ├── chat-stream-fallback.ts
│       ├── compatibility.test.ts
│       ├── compatibility.ts
│       ├── contact-config.ts
│       ├── contact-schemas.ts
│       ├── contact-types.ts
│       ├── customer-order-activity.test.ts
│       ├── customer-order-activity.ts
│       ├── customer-order-workflow.test.ts
│       ├── customer-order-workflow.ts
│       ├── export-excel.test.ts
│       ├── export-excel.ts
│       ├── firestore-document.test.ts
│       ├── firestore-document.ts
│       ├── fps-estimator.ts
│       ├── included-cpu-cooler.test.ts
│       ├── included-cpu-cooler.ts
│       ├── integrated-graphics.test.ts
│       ├── integrated-graphics.ts
│       ├── inventory-fetcher.ts
│       ├── inventory-image-sizes.ts
│       ├── inventory-paths.test.ts
│       ├── inventory-paths.ts
│       ├── inventory-query-fields.test.ts
│       ├── inventory-query-fields.ts
│       ├── knowledge-retriever.ts
│       ├── live-build-recommendation-schema.ts
│       ├── live-build-recommendations.test.ts
│       ├── live-build-recommendations.ts
│       ├── normalize-product-description.ts
│       ├── order-activity.test.ts
│       ├── order-activity.ts
│       ├── order-assembly.test.ts
│       ├── order-assembly.ts
│       ├── order-classification.test.ts
│       ├── order-classification.ts
│       ├── order-expiration.test.ts
│       ├── order-expiration.ts
│       ├── order-fulfillment.test.ts
│       ├── order-fulfillment.ts
│       ├── order-image-resolver.test.ts
│       ├── order-image-resolver.ts
│       ├── order-item-groups.test.ts
│       ├── order-item-groups.ts
│       ├── order-operation-cache.test.ts
│       ├── order-operation-cache.ts
│       ├── order-payment.test.ts
│       ├── order-payment.ts
│       ├── order-permissions.test.ts
│       ├── order-permissions.ts
│       ├── order-receipt-pdf.test.ts
│       ├── order-receipt-pdf.ts
│       ├── order-workflow.test.ts
│       ├── order-workflow.ts
│       ├── parse-peso-budget.ts
│       ├── payment-methods.test.ts
│       ├── payment-methods.ts
│       ├── placeholder-images.ts
│       ├── popularity.ts
│       ├── prebuilt-utils.test.ts
│       ├── prebuilt-utils.ts
│       ├── product-identity.ts
│       ├── product-schemas.ts
│       ├── public-product-types.ts
│       ├── qr-decoder.ts
│       ├── qr-health.ts
│       ├── qr-lifecycle.ts
│       ├── qr-response.ts
│       ├── rule-based-advisor.test.ts
│       ├── rule-based-advisor.ts
│       ├── save-catalog-product.ts
│       ├── search-empty-state.test.ts
│       ├── search-empty-state.ts
│       ├── styled-excel.ts
│       ├── system-prompts.ts
│       ├── types.ts
│       ├── utils.ts
│       ├── validate-advisor-build.test.ts
│       ├── validate-advisor-build.ts
│       ├── vector-retriever.ts
│       └── vertex-tuned-endpoint.ts
├── test-results
│   └── .last-run.json
├── tests
│   ├── fixtures
│   │   └── loading-layout-page.tsx
│   ├── admin-inventory-queries.integration.ts
│   ├── auth-role-navigation.spec.ts
│   ├── chat-part-specifications.spec.ts
│   ├── inventory-catalog-pagination.spec.ts
│   ├── landing-featured-products.spec.ts
│   ├── landing-hero-guest-builder.spec.ts
│   ├── landing-loading-layouts.spec.ts
│   ├── landing-performance.spec.ts
│   ├── live-build-recommendations.spec.ts
│   ├── loading-layouts.spec.ts
│   ├── order-management.integration.ts
│   ├── order-phase2.test.ts
│   ├── prebuilt-toolbar.spec.ts
│   ├── public-auth-header.spec.ts
│   ├── public-parts-toolbar.spec.ts
│   ├── qr-inventory.integration.ts
│   ├── qr-inventory.spec.ts
│   ├── qr-phase2.test.ts
│   └── sales-export.spec.ts
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
├── eslint.config.mjs
├── firebase.json
├── firebase.qr-test.json
├── firestore.indexes.json
├── firestore.rules
├── GEMINI.md
├── models.json
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── playwright.config.ts
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
