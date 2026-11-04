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
├── .next-qr-test
│   ├── cache
│   │   ├── swc
│   │   │   └── plugins
│   │   │       └── windows_x86_64_18.0.0
│   │   ├── webpack
│   │   │   ├── client-production
│   │   │   │   ├── 0.pack
│   │   │   │   ├── 1.pack
│   │   │   │   ├── 10.pack
│   │   │   │   ├── 11.pack
│   │   │   │   ├── 12.pack
│   │   │   │   ├── 13.pack
│   │   │   │   ├── 14.pack
│   │   │   │   ├── 15.pack
│   │   │   │   ├── 16.pack
│   │   │   │   ├── 17.pack
│   │   │   │   ├── 18.pack
│   │   │   │   ├── 19.pack
│   │   │   │   ├── 2.pack
│   │   │   │   ├── 20.pack
│   │   │   │   ├── 21.pack
│   │   │   │   ├── 22.pack
│   │   │   │   ├── 23.pack
│   │   │   │   ├── 24.pack
│   │   │   │   ├── 3.pack
│   │   │   │   ├── 4.pack
│   │   │   │   ├── 5.pack
│   │   │   │   ├── 6.pack
│   │   │   │   ├── 7.pack
│   │   │   │   ├── 8.pack
│   │   │   │   ├── 9.pack
│   │   │   │   ├── index.pack
│   │   │   │   └── index.pack.old
│   │   │   ├── edge-server-production
│   │   │   │   ├── 0.pack
│   │   │   │   └── index.pack
│   │   │   └── server-production
│   │   │       ├── 0.pack
│   │   │       ├── 1.pack
│   │   │       ├── 10.pack
│   │   │       ├── 11.pack
│   │   │       ├── 12.pack
│   │   │       ├── 13.pack
│   │   │       ├── 14.pack
│   │   │       ├── 15.pack
│   │   │       ├── 16.pack
│   │   │       ├── 17.pack
│   │   │       ├── 18.pack
│   │   │       ├── 19.pack
│   │   │       ├── 2.pack
│   │   │       ├── 20.pack
│   │   │       ├── 21.pack
│   │   │       ├── 22.pack
│   │   │       ├── 23.pack
│   │   │       ├── 24.pack
│   │   │       ├── 25.pack
│   │   │       ├── 26.pack
│   │   │       ├── 27.pack
│   │   │       ├── 28.pack
│   │   │       ├── 3.pack
│   │   │       ├── 4.pack
│   │   │       ├── 5.pack
│   │   │       ├── 6.pack
│   │   │       ├── 7.pack
│   │   │       ├── 8.pack
│   │   │       ├── 9.pack
│   │   │       ├── index.pack
│   │   │       └── index.pack.old
│   │   ├── .previewinfo
│   │   └── .rscinfo
│   ├── diagnostics
│   │   ├── build-diagnostics.json
│   │   └── framework.json
│   ├── server
│   │   ├── app
│   │   │   ├── _not-found
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   └── page.js.nft.json
│   │   │   ├── about
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   └── page.js.nft.json
│   │   │   ├── admin
│   │   │   │   ├── contact-inquiries
│   │   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   │   ├── page.js
│   │   │   │   │   └── page.js.nft.json
│   │   │   │   ├── prebuilt-builder
│   │   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   │   ├── page.js
│   │   │   │   │   └── page.js.nft.json
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   ├── page.js.nft.json
│   │   │   │   ├── prebuilt-builder.html
│   │   │   │   ├── prebuilt-builder.meta
│   │   │   │   └── prebuilt-builder.rsc
│   │   │   ├── ai-build-advisor
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   └── page.js.nft.json
│   │   │   ├── api
│   │   │   │   ├── admin
│   │   │   │   │   ├── qr-health
│   │   │   │   │   │   ├── route_client-reference-manifest.js
│   │   │   │   │   │   ├── route.js
│   │   │   │   │   │   └── route.js.nft.json
│   │   │   │   │   └── qr-status
│   │   │   │   │       └── [token]
│   │   │   │   │           ├── route_client-reference-manifest.js
│   │   │   │   │           ├── route.js
│   │   │   │   │           └── route.js.nft.json
│   │   │   │   ├── ai
│   │   │   │   │   └── build-advisor
│   │   │   │   │       ├── critique
│   │   │   │   │       │   ├── route_client-reference-manifest.js
│   │   │   │   │       │   ├── route.js
│   │   │   │   │       │   └── route.js.nft.json
│   │   │   │   │       └── recommendations
│   │   │   │   │           ├── route_client-reference-manifest.js
│   │   │   │   │           ├── route.js
│   │   │   │   │           └── route.js.nft.json
│   │   │   │   ├── builder
│   │   │   │   │   ├── download
│   │   │   │   │   │   ├── route_client-reference-manifest.js
│   │   │   │   │   │   ├── route.js
│   │   │   │   │   │   └── route.js.nft.json
│   │   │   │   │   └── live-recommendations
│   │   │   │   │       ├── route_client-reference-manifest.js
│   │   │   │   │       ├── route.js
│   │   │   │   │       └── route.js.nft.json
│   │   │   │   ├── chat
│   │   │   │   │   ├── route_client-reference-manifest.js
│   │   │   │   │   ├── route.js
│   │   │   │   │   └── route.js.nft.json
│   │   │   │   ├── contact
│   │   │   │   │   ├── delete
│   │   │   │   │   │   ├── route_client-reference-manifest.js
│   │   │   │   │   │   ├── route.js
│   │   │   │   │   │   └── route.js.nft.json
│   │   │   │   │   ├── gmail
│   │   │   │   │   │   ├── oauth
│   │   │   │   │   │   │   ├── callback
│   │   │   │   │   │   │   │   ├── route_client-reference-manifest.js
│   │   │   │   │   │   │   │   ├── route.js
│   │   │   │   │   │   │   │   └── route.js.nft.json
│   │   │   │   │   │   │   └── start
│   │   │   │   │   │   │       ├── route_client-reference-manifest.js
│   │   │   │   │   │   │       ├── route.js
│   │   │   │   │   │   │       └── route.js.nft.json
│   │   │   │   │   │   ├── renew
│   │   │   │   │   │   │   ├── route_client-reference-manifest.js
│   │   │   │   │   │   │   ├── route.js
│   │   │   │   │   │   │   └── route.js.nft.json
│   │   │   │   │   │   └── webhook
│   │   │   │   │   │       ├── route_client-reference-manifest.js
│   │   │   │   │   │       ├── route.js
│   │   │   │   │   │       └── route.js.nft.json
│   │   │   │   │   ├── messages
│   │   │   │   │   │   ├── retry
│   │   │   │   │   │   │   ├── route_client-reference-manifest.js
│   │   │   │   │   │   │   ├── route.js
│   │   │   │   │   │   │   └── route.js.nft.json
│   │   │   │   │   │   ├── route_client-reference-manifest.js
│   │   │   │   │   │   ├── route.js
│   │   │   │   │   │   └── route.js.nft.json
│   │   │   │   │   ├── read
│   │   │   │   │   │   ├── route_client-reference-manifest.js
│   │   │   │   │   │   ├── route.js
│   │   │   │   │   │   └── route.js.nft.json
│   │   │   │   │   ├── status
│   │   │   │   │   │   ├── route_client-reference-manifest.js
│   │   │   │   │   │   ├── route.js
│   │   │   │   │   │   └── route.js.nft.json
│   │   │   │   │   ├── route_client-reference-manifest.js
│   │   │   │   │   ├── route.js
│   │   │   │   │   └── route.js.nft.json
│   │   │   │   ├── cron
│   │   │   │   │   └── expire-orders
│   │   │   │   │       ├── route_client-reference-manifest.js
│   │   │   │   │       ├── route.js
│   │   │   │   │       └── route.js.nft.json
│   │   │   │   ├── featured-accessories
│   │   │   │   │   ├── route_client-reference-manifest.js
│   │   │   │   │   ├── route.js
│   │   │   │   │   └── route.js.nft.json
│   │   │   │   ├── featured-parts
│   │   │   │   │   ├── route_client-reference-manifest.js
│   │   │   │   │   ├── route.js
│   │   │   │   │   └── route.js.nft.json
│   │   │   │   ├── qr
│   │   │   │   │   └── [token]
│   │   │   │   │       ├── route_client-reference-manifest.js
│   │   │   │   │       ├── route.js
│   │   │   │   │       └── route.js.nft.json
│   │   │   │   ├── system-access
│   │   │   │   │   └── authenticate
│   │   │   │   │       ├── route_client-reference-manifest.js
│   │   │   │   │       ├── route.js
│   │   │   │   │       └── route.js.nft.json
│   │   │   │   └── webhooks
│   │   │   │       └── paymongo
│   │   │   │           ├── route_client-reference-manifest.js
│   │   │   │           ├── route.js
│   │   │   │           └── route.js.nft.json
│   │   │   ├── apple-icon.png
│   │   │   │   ├── route.js
│   │   │   │   └── route.js.nft.json
│   │   │   ├── builder
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   └── page.js.nft.json
│   │   │   ├── checkout
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   └── page.js.nft.json
│   │   │   ├── contact
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   └── page.js.nft.json
│   │   │   ├── faq
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   └── page.js.nft.json
│   │   │   ├── favicon.ico
│   │   │   │   ├── route.js
│   │   │   │   └── route.js.nft.json
│   │   │   ├── forgot-password
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   └── page.js.nft.json
│   │   │   ├── group
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   └── page.js.nft.json
│   │   │   ├── icon.svg
│   │   │   │   ├── route.js
│   │   │   │   └── route.js.nft.json
│   │   │   ├── landing-video
│   │   │   │   └── [name]
│   │   │   │       ├── route_client-reference-manifest.js
│   │   │   │       ├── route.js
│   │   │   │       └── route.js.nft.json
│   │   │   ├── parts
│   │   │   │   ├── [productId]
│   │   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   │   ├── page.js
│   │   │   │   │   └── page.js.nft.json
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   └── page.js.nft.json
│   │   │   ├── pre-builts
│   │   │   │   ├── [id]
│   │   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   │   ├── page.js
│   │   │   │   │   └── page.js.nft.json
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   └── page.js.nft.json
│   │   │   ├── profile
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   └── page.js.nft.json
│   │   │   ├── q
│   │   │   │   └── [token]
│   │   │   │       ├── page_client-reference-manifest.js
│   │   │   │       ├── page.js
│   │   │   │       └── page.js.nft.json
│   │   │   ├── signin
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   └── page.js.nft.json
│   │   │   ├── signup
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   └── page.js.nft.json
│   │   │   ├── support-requests
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   └── page.js.nft.json
│   │   │   ├── system-access
│   │   │   │   ├── signup
│   │   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   │   ├── page.js
│   │   │   │   │   └── page.js.nft.json
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   ├── page.js.nft.json
│   │   │   │   ├── signup.html
│   │   │   │   ├── signup.meta
│   │   │   │   └── signup.rsc
│   │   │   ├── team
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   └── page.js.nft.json
│   │   │   ├── _not-found.html
│   │   │   ├── _not-found.meta
│   │   │   ├── _not-found.rsc
│   │   │   ├── about.html
│   │   │   ├── about.meta
│   │   │   ├── about.rsc
│   │   │   ├── admin.html
│   │   │   ├── admin.meta
│   │   │   ├── admin.rsc
│   │   │   ├── ai-build-advisor.html
│   │   │   ├── ai-build-advisor.meta
│   │   │   ├── ai-build-advisor.rsc
│   │   │   ├── apple-icon.png.body
│   │   │   ├── apple-icon.png.meta
│   │   │   ├── checkout.html
│   │   │   ├── checkout.meta
│   │   │   ├── checkout.rsc
│   │   │   ├── contact.html
│   │   │   ├── contact.meta
│   │   │   ├── contact.rsc
│   │   │   ├── faq.html
│   │   │   ├── faq.meta
│   │   │   ├── faq.rsc
│   │   │   ├── favicon.ico.body
│   │   │   ├── favicon.ico.meta
│   │   │   ├── forgot-password.html
│   │   │   ├── forgot-password.meta
│   │   │   ├── forgot-password.rsc
│   │   │   ├── group.html
│   │   │   ├── group.meta
│   │   │   ├── group.rsc
│   │   │   ├── icon.svg.body
│   │   │   ├── icon.svg.meta
│   │   │   ├── index.html
│   │   │   ├── index.meta
│   │   │   ├── index.rsc
│   │   │   ├── page_client-reference-manifest.js
│   │   │   ├── page.js
│   │   │   ├── page.js.nft.json
│   │   │   ├── pre-builts.html
│   │   │   ├── pre-builts.meta
│   │   │   ├── pre-builts.rsc
│   │   │   ├── profile.html
│   │   │   ├── profile.meta
│   │   │   ├── profile.rsc
│   │   │   ├── signin.html
│   │   │   ├── signin.meta
│   │   │   ├── signin.rsc
│   │   │   ├── signup.html
│   │   │   ├── signup.meta
│   │   │   ├── signup.rsc
│   │   │   ├── system-access.html
│   │   │   ├── system-access.meta
│   │   │   ├── system-access.rsc
│   │   │   ├── team.html
│   │   │   ├── team.meta
│   │   │   └── team.rsc
│   │   ├── chunks
│   │   │   ├── 101.js
│   │   │   ├── 1056.js
│   │   │   ├── 1070.js
│   │   │   ├── 113.js
│   │   │   ├── 13.js
│   │   │   ├── 1412.js
│   │   │   ├── 1428.js
│   │   │   ├── 1452.js
│   │   │   ├── 1680.js
│   │   │   ├── 1803.js
│   │   │   ├── 1824.js
│   │   │   ├── 2058.js
│   │   │   ├── 2274.js
│   │   │   ├── 2436.js
│   │   │   ├── 2494.js
│   │   │   ├── 2866.js
│   │   │   ├── 2930.js
│   │   │   ├── 3022.js
│   │   │   ├── 3026.js
│   │   │   ├── 3217.js
│   │   │   ├── 3276.js
│   │   │   ├── 3321.js
│   │   │   ├── 3691.js
│   │   │   ├── 3754.js
│   │   │   ├── 3827.js
│   │   │   ├── 3897.js
│   │   │   ├── 4148.js
│   │   │   ├── 4211.js
│   │   │   ├── 4349.js
│   │   │   ├── 4351.js
│   │   │   ├── 4479.js
│   │   │   ├── 4597.js
│   │   │   ├── 4657.js
│   │   │   ├── 4753.js
│   │   │   ├── 4797.js
│   │   │   ├── 4809.js
│   │   │   ├── 4814.js
│   │   │   ├── 5166.js
│   │   │   ├── 5270.js
│   │   │   ├── 5322.js
│   │   │   ├── 5350.js
│   │   │   ├── 5369.js
│   │   │   ├── 5387.js
│   │   │   ├── 5396.js
│   │   │   ├── 5450.js
│   │   │   ├── 5603.js
│   │   │   ├── 5611.js
│   │   │   ├── 5873.js
│   │   │   ├── 592.js
│   │   │   ├── 5966.js
│   │   │   ├── 6055.js
│   │   │   ├── 6125.js
│   │   │   ├── 6245.js
│   │   │   ├── 634.js
│   │   │   ├── 641.js
│   │   │   ├── 6749.js
│   │   │   ├── 6813.js
│   │   │   ├── 6870.js
│   │   │   ├── 7231.js
│   │   │   ├── 7255.js
│   │   │   ├── 7257.js
│   │   │   ├── 7532.js
│   │   │   ├── 756.js
│   │   │   ├── 7908.js
│   │   │   ├── 8212.js
│   │   │   ├── 8253.js
│   │   │   ├── 8276.js
│   │   │   ├── 831.js
│   │   │   ├── 8322.js
│   │   │   ├── 8575.js
│   │   │   ├── 8626.js
│   │   │   ├── 8882.js
│   │   │   ├── 8888.js
│   │   │   ├── 8945.js
│   │   │   ├── 9349.js
│   │   │   ├── 937.js
│   │   │   ├── 9401.js
│   │   │   ├── 944.js
│   │   │   ├── 9455.js
│   │   │   └── 9560.js
│   │   ├── pages
│   │   │   ├── _app.js
│   │   │   ├── _app.js.nft.json
│   │   │   ├── _document.js
│   │   │   ├── _document.js.nft.json
│   │   │   ├── _error.js
│   │   │   ├── _error.js.nft.json
│   │   │   ├── 404.html
│   │   │   └── 500.html
│   │   ├── app-paths-manifest.json
│   │   ├── functions-config-manifest.json
│   │   ├── interception-route-rewrite-manifest.js
│   │   ├── middleware-build-manifest.js
│   │   ├── middleware-manifest.json
│   │   ├── middleware-react-loadable-manifest.js
│   │   ├── next-font-manifest.js
│   │   ├── next-font-manifest.json
│   │   ├── pages-manifest.json
│   │   ├── server-reference-manifest.js
│   │   ├── server-reference-manifest.json
│   │   └── webpack-runtime.js
│   ├── static
│   │   ├── -EOu7W50sRUsng1ffbOZg
│   │   │   ├── _buildManifest.js
│   │   │   └── _ssgManifest.js
│   │   ├── chunks
│   │   │   ├── app
│   │   │   │   ├── _not-found
│   │   │   │   │   └── page-180c5c33fc4b7a40.js
│   │   │   │   ├── about
│   │   │   │   │   └── page-7482561a8cb06a72.js
│   │   │   │   ├── admin
│   │   │   │   │   ├── contact-inquiries
│   │   │   │   │   │   └── page-c5912e06adca8f8a.js
│   │   │   │   │   ├── prebuilt-builder
│   │   │   │   │   │   └── page-cd17e8a9a7f1c1c0.js
│   │   │   │   │   └── page-953f2349ce0978ad.js
│   │   │   │   ├── ai-build-advisor
│   │   │   │   │   └── page-18ab13a727e9f864.js
│   │   │   │   ├── api
│   │   │   │   │   ├── admin
│   │   │   │   │   │   ├── qr-health
│   │   │   │   │   │   │   └── route-c5912e06adca8f8a.js
│   │   │   │   │   │   └── qr-status
│   │   │   │   │   │       └── [token]
│   │   │   │   │   │           └── route-c5912e06adca8f8a.js
│   │   │   │   │   ├── ai
│   │   │   │   │   │   └── build-advisor
│   │   │   │   │   │       ├── critique
│   │   │   │   │   │       │   └── route-c5912e06adca8f8a.js
│   │   │   │   │   │       └── recommendations
│   │   │   │   │   │           └── route-c5912e06adca8f8a.js
│   │   │   │   │   ├── builder
│   │   │   │   │   │   ├── download
│   │   │   │   │   │   │   └── route-c5912e06adca8f8a.js
│   │   │   │   │   │   └── live-recommendations
│   │   │   │   │   │       └── route-c5912e06adca8f8a.js
│   │   │   │   │   ├── chat
│   │   │   │   │   │   └── route-c5912e06adca8f8a.js
│   │   │   │   │   ├── contact
│   │   │   │   │   │   ├── delete
│   │   │   │   │   │   │   └── route-c5912e06adca8f8a.js
│   │   │   │   │   │   ├── gmail
│   │   │   │   │   │   │   ├── oauth
│   │   │   │   │   │   │   │   ├── callback
│   │   │   │   │   │   │   │   │   └── route-c5912e06adca8f8a.js
│   │   │   │   │   │   │   │   └── start
│   │   │   │   │   │   │   │       └── route-c5912e06adca8f8a.js
│   │   │   │   │   │   │   ├── renew
│   │   │   │   │   │   │   │   └── route-c5912e06adca8f8a.js
│   │   │   │   │   │   │   └── webhook
│   │   │   │   │   │   │       └── route-c5912e06adca8f8a.js
│   │   │   │   │   │   ├── messages
│   │   │   │   │   │   │   ├── retry
│   │   │   │   │   │   │   │   └── route-c5912e06adca8f8a.js
│   │   │   │   │   │   │   └── route-c5912e06adca8f8a.js
│   │   │   │   │   │   ├── read
│   │   │   │   │   │   │   └── route-c5912e06adca8f8a.js
│   │   │   │   │   │   ├── status
│   │   │   │   │   │   │   └── route-c5912e06adca8f8a.js
│   │   │   │   │   │   └── route-c5912e06adca8f8a.js
│   │   │   │   │   ├── cron
│   │   │   │   │   │   └── expire-orders
│   │   │   │   │   │       └── route-c5912e06adca8f8a.js
│   │   │   │   │   ├── featured-accessories
│   │   │   │   │   │   └── route-c5912e06adca8f8a.js
│   │   │   │   │   ├── featured-parts
│   │   │   │   │   │   └── route-c5912e06adca8f8a.js
│   │   │   │   │   ├── qr
│   │   │   │   │   │   └── [token]
│   │   │   │   │   │       └── route-c5912e06adca8f8a.js
│   │   │   │   │   ├── system-access
│   │   │   │   │   │   └── authenticate
│   │   │   │   │   │       └── route-c5912e06adca8f8a.js
│   │   │   │   │   └── webhooks
│   │   │   │   │       └── paymongo
│   │   │   │   │           └── route-c5912e06adca8f8a.js
│   │   │   │   ├── builder
│   │   │   │   │   └── page-b4699b48890b9d3e.js
│   │   │   │   ├── checkout
│   │   │   │   │   └── page-e7b3563da1a74249.js
│   │   │   │   ├── contact
│   │   │   │   │   └── page-0b677a8298b5a86b.js
│   │   │   │   ├── faq
│   │   │   │   │   └── page-7376e14fab64b915.js
│   │   │   │   ├── forgot-password
│   │   │   │   │   └── page-53cdac1fb591cc52.js
│   │   │   │   ├── group
│   │   │   │   │   └── page-be650941f7b590bb.js
│   │   │   │   ├── landing-video
│   │   │   │   │   └── [name]
│   │   │   │   │       └── route-c5912e06adca8f8a.js
│   │   │   │   ├── parts
│   │   │   │   │   ├── [productId]
│   │   │   │   │   │   └── page-d643ca4e69051bfd.js
│   │   │   │   │   └── page-db3cba465929063a.js
│   │   │   │   ├── pre-builts
│   │   │   │   │   ├── [id]
│   │   │   │   │   │   └── page-1b6e4b5ef7587fba.js
│   │   │   │   │   └── page-73a0f32b71d389d7.js
│   │   │   │   ├── profile
│   │   │   │   │   └── page-b1b010d2f9eb8ecc.js
│   │   │   │   ├── q
│   │   │   │   │   └── [token]
│   │   │   │   │       └── page-69177804fde06df2.js
│   │   │   │   ├── signin
│   │   │   │   │   └── page-67408ca0e8410a30.js
│   │   │   │   ├── signup
│   │   │   │   │   └── page-fdd8f04077767325.js
│   │   │   │   ├── support-requests
│   │   │   │   │   └── page-c5912e06adca8f8a.js
│   │   │   │   ├── system-access
│   │   │   │   │   ├── signup
│   │   │   │   │   │   └── page-2905bbd44294e555.js
│   │   │   │   │   └── page-813933bd4918a61b.js
│   │   │   │   ├── team
│   │   │   │   │   └── page-bf96b8614e0e27c4.js
│   │   │   │   ├── layout-fefd62bb50bd04bf.js
│   │   │   │   ├── loading-569ffd2dc5ffeedf.js
│   │   │   │   └── page-6517a0174d30b26c.js
│   │   │   ├── pages
│   │   │   │   ├── _app-e8b861c87f6f033c.js
│   │   │   │   └── _error-c8f84f7bd11d43d4.js
│   │   │   ├── 1076-532d472b27128792.js
│   │   │   ├── 1150-d87bc5c90e7efcbe.js
│   │   │   ├── 1255-de0c1abd22c7cccd.js
│   │   │   ├── 1392-4d30fa57c1ea4bc2.js
│   │   │   ├── 1435.5c7a558ded609655.js
│   │   │   ├── 1506-da63817904ce3a16.js
│   │   │   ├── 1646.a93085a0445ba909.js
│   │   │   ├── 1668-811000b8382ec9eb.js
│   │   │   ├── 1669.1f32fe08f0d810a4.js
│   │   │   ├── 1708-385526e50e2906ea.js
│   │   │   ├── 1757.92e047c9783e353b.js
│   │   │   ├── 1902-3f1557941953d68a.js
│   │   │   ├── 1917.2e9ceca8774c1cba.js
│   │   │   ├── 2017-b0ce573dc486ace3.js
│   │   │   ├── 2046-23026b0e27541614.js
│   │   │   ├── 2170a4aa-23e3b5dc934453fe.js
│   │   │   ├── 235.29b58935d26fe0b2.js
│   │   │   ├── 2432-7e5cfc815b3f9722.js
│   │   │   ├── 2459-c0e192efdfd220e1.js
│   │   │   ├── 2465.ed8700984e6ed382.js
│   │   │   ├── 2467-04d4a325c8f36031.js
│   │   │   ├── 2530-b4987e3a501dcedd.js
│   │   │   ├── 2543-0155fa9d5c4cf276.js
│   │   │   ├── 2619-b8db57ac19da49ac.js
│   │   │   ├── 274-5da7280e14a31b08.js
│   │   │   ├── 2769.761d3c2b27e34704.js
│   │   │   ├── 2990.5f1040e4cd837f36.js
│   │   │   ├── 3166-10b311ab6664fa09.js
│   │   │   ├── 3430.e8aa836554894d70.js
│   │   │   ├── 3568-275252d8aab4c0de.js
│   │   │   ├── 3667.f29d0e9f7b93570a.js
│   │   │   ├── 3792.872e5ff9a2957249.js
│   │   │   ├── 3890-1b829a3136758e7a.js
│   │   │   ├── 4036-f3d5b68130dc3633.js
│   │   │   ├── 4095-44222ec53810d7e5.js
│   │   │   ├── 4103.b96eba06d0135ae0.js
│   │   │   ├── 4260-996ec32fa4e3f7fe.js
│   │   │   ├── 4432-94faf78e2ed239ad.js
│   │   │   ├── 4488.13886f767eadab9b.js
│   │   │   ├── 4540-17ce4e8f5b8026d1.js
│   │   │   ├── 4679-7b3b76de3d70d2ed.js
│   │   │   ├── 4721-b2077cb22ae3ac24.js
│   │   │   ├── 4776-033c0a3fbb34f161.js
│   │   │   ├── 4846.23217743c947ea2d.js
│   │   │   ├── 488-eac181ed2f3bf4dc.js
│   │   │   ├── 4bd1b696-182b6b13bdad92e3.js
│   │   │   ├── 5008-23ef350c844b2bdd.js
│   │   │   ├── 5010.bb099d501036a19f.js
│   │   │   ├── 5139.e4ff9cc3669129ed.js
│   │   │   ├── 5158-640d4a26b96e6b20.js
│   │   │   ├── 5287-c9ae512f936018af.js
│   │   │   ├── 5554-15253666c5358bc9.js
│   │   │   ├── 5788.a2d6e27810bbbd4b.js
│   │   │   ├── 5889-77a82109fffb7f6f.js
│   │   │   ├── 5937-a37d798cf08beeb6.js
│   │   │   ├── 5953.fa3307501a415256.js
│   │   │   ├── 6026.100e6d25317c698c.js
│   │   │   ├── 6120-f4116f5d079d1821.js
│   │   │   ├── 6572-3b18558e3f30ee99.js
│   │   │   ├── 6605-1592588efcdba16f.js
│   │   │   ├── 6834-af6681615c46f4b7.js
│   │   │   ├── 6882-49102e1bef36ce65.js
│   │   │   ├── 6942-213792197da03d19.js
│   │   │   ├── 7014-f77bd8ea72a8d3bd.js
│   │   │   ├── 7635.b7c50f19d7570e11.js
│   │   │   ├── 7647-d9b170f994514c4b.js
│   │   │   ├── 767-79e409318d2cfa57.js
│   │   │   ├── 7697-67c820e5d02fcedf.js
│   │   │   ├── 7793-0fbb931250b1811f.js
│   │   │   ├── 801-33f7a31de8a00426.js
│   │   │   ├── 82-3e31cebbcabb0d18.js
│   │   │   ├── 8285-c5a54337afb83707.js
│   │   │   ├── 8513-fb3c821099d581ca.js
│   │   │   ├── 856-a353dd9eea81959d.js
│   │   │   ├── 8583-9e210b9f746ec8b1.js
│   │   │   ├── 8658-e1f15b298d36fc04.js
│   │   │   ├── 8685.467533c43a657f62.js
│   │   │   ├── 8725.636bc571cc7ca98e.js
│   │   │   ├── 8734-27b44844a90f2ff8.js
│   │   │   ├── 90-3281dc3884815f88.js
│   │   │   ├── 9000-900d55344be8f5d1.js
│   │   │   ├── 9327-fedb4d0b3b187d1a.js
│   │   │   ├── 9330-8b2e37f936c8e951.js
│   │   │   ├── 9353-23f344bd080da4f0.js
│   │   │   ├── 9478-171ad3d5ff09c553.js
│   │   │   ├── 9496-0ca25bd242817033.js
│   │   │   ├── 9624-3f5bded12791bb26.js
│   │   │   ├── 9773-66f5b21185c89f8d.js
│   │   │   ├── 994-ac527d8bdc3609e3.js
│   │   │   ├── ba12c10f-8063feea5a12ad92.js
│   │   │   ├── bc9e92e6-97565be9ace941ed.js
│   │   │   ├── c16f53c3-f2ef374b4e911d59.js
│   │   │   ├── ceb9e9aa-c4675496ca701b39.js
│   │   │   ├── d0f5a89a-af7b72e16913fa3e.js
│   │   │   ├── framework-5c6aa4eeab4c6f34.js
│   │   │   ├── main-app-4dbf0c597e8ab152.js
│   │   │   ├── main-bb339113ec47b886.js
│   │   │   ├── polyfills-42372ed130431b0a.js
│   │   │   └── webpack-3b1ae21515358f64.js
│   │   ├── css
│   │   │   ├── 686b6b70651cde05.css
│   │   │   ├── 71d96a07ba072a09.css
│   │   │   ├── 793d9152bb43398a.css
│   │   │   ├── c6ebfc4485e94f61.css
│   │   │   └── e35dfb38818993df.css
│   │   └── media
│   │       ├── 19cfc7226ec3afaa-s.woff2
│   │       ├── 21350d82a1f187e9-s.woff2
│   │       ├── 36966cca54120369-s.p.woff2
│   │       ├── 8e9860b6e62d6359-s.woff2
│   │       ├── b7387a63dd068245-s.woff2
│   │       ├── ba9851c3c22cd980-s.woff2
│   │       ├── c5fe6dc8356a8c31-s.woff2
│   │       ├── custom-builder-parts.f35e2f48.png
│   │       ├── df0a9ae256c0569c-s.woff2
│   │       ├── documentation_m.c85f8142.png
│   │       ├── e1aab0933260df4d-s.woff2
│   │       ├── e4af272ccee01ff0-s.p.woff2
│   │       ├── feature-1.d184a8af.webp
│   │       ├── feature-2.efc2a3c3.webp
│   │       ├── feature-3.a6afbd5f.webp
│   │       ├── hero-custom-v2.112d5cfa.webp
│   │       ├── king45-poster.c86d4155.webp
│   │       ├── netcodex_cc_2026_white.png.28987f1e.webp
│   │       ├── netcodex-emblem.da68c994.png
│   │       ├── netcodex-storefront.300dc261.png
│   │       ├── pm_m.7d1c15dc.png
│   │       ├── prebuilt-pcs.13b2e5ef.png
│   │       ├── prism5-poster.ccf8d37c.webp
│   │       ├── rayzon.e41856c3.png
│   │       └── ui_m.833ba0df.png
│   ├── types
│   │   ├── app
│   │   │   ├── about
│   │   │   │   └── page.ts
│   │   │   ├── admin
│   │   │   │   ├── contact-inquiries
│   │   │   │   │   └── page.ts
│   │   │   │   ├── prebuilt-builder
│   │   │   │   │   └── page.ts
│   │   │   │   └── page.ts
│   │   │   ├── ai-build-advisor
│   │   │   │   └── page.ts
│   │   │   ├── api
│   │   │   │   ├── admin
│   │   │   │   │   ├── qr-health
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── qr-status
│   │   │   │   │       └── [token]
│   │   │   │   │           └── route.ts
│   │   │   │   ├── ai
│   │   │   │   │   └── build-advisor
│   │   │   │   │       ├── critique
│   │   │   │   │       │   └── route.ts
│   │   │   │   │       └── recommendations
│   │   │   │   │           └── route.ts
│   │   │   │   ├── builder
│   │   │   │   │   ├── download
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── live-recommendations
│   │   │   │   │       └── route.ts
│   │   │   │   ├── chat
│   │   │   │   │   └── route.ts
│   │   │   │   ├── contact
│   │   │   │   │   ├── delete
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── gmail
│   │   │   │   │   │   ├── oauth
│   │   │   │   │   │   │   ├── callback
│   │   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   │   └── start
│   │   │   │   │   │   │       └── route.ts
│   │   │   │   │   │   ├── renew
│   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   └── webhook
│   │   │   │   │   │       └── route.ts
│   │   │   │   │   ├── messages
│   │   │   │   │   │   ├── retry
│   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── read
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── status
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── cron
│   │   │   │   │   └── expire-orders
│   │   │   │   │       └── route.ts
│   │   │   │   ├── featured-accessories
│   │   │   │   │   └── route.ts
│   │   │   │   ├── featured-parts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── qr
│   │   │   │   │   └── [token]
│   │   │   │   │       └── route.ts
│   │   │   │   ├── system-access
│   │   │   │   │   └── authenticate
│   │   │   │   │       └── route.ts
│   │   │   │   └── webhooks
│   │   │   │       └── paymongo
│   │   │   │           └── route.ts
│   │   │   ├── builder
│   │   │   │   └── page.ts
│   │   │   ├── checkout
│   │   │   │   └── page.ts
│   │   │   ├── contact
│   │   │   │   └── page.ts
│   │   │   ├── faq
│   │   │   │   └── page.ts
│   │   │   ├── forgot-password
│   │   │   │   └── page.ts
│   │   │   ├── group
│   │   │   │   └── page.ts
│   │   │   ├── landing-video
│   │   │   │   └── [name]
│   │   │   │       └── route.ts
│   │   │   ├── parts
│   │   │   │   ├── [productId]
│   │   │   │   │   └── page.ts
│   │   │   │   └── page.ts
│   │   │   ├── pre-builts
│   │   │   │   ├── [id]
│   │   │   │   │   └── page.ts
│   │   │   │   └── page.ts
│   │   │   ├── profile
│   │   │   │   └── page.ts
│   │   │   ├── q
│   │   │   │   └── [token]
│   │   │   │       └── page.ts
│   │   │   ├── signin
│   │   │   │   └── page.ts
│   │   │   ├── signup
│   │   │   │   └── page.ts
│   │   │   ├── support-requests
│   │   │   │   └── page.ts
│   │   │   ├── system-access
│   │   │   │   ├── signup
│   │   │   │   │   └── page.ts
│   │   │   │   └── page.ts
│   │   │   └── page.ts
│   │   ├── cache-life.d.ts
│   │   ├── package.json
│   │   ├── routes.d.ts
│   │   └── validator.ts
│   ├── app-build-manifest.json
│   ├── app-path-routes-manifest.json
│   ├── BUILD_ID
│   ├── build-manifest.json
│   ├── export-marker.json
│   ├── images-manifest.json
│   ├── next-minimal-server.js.nft.json
│   ├── next-server.js.nft.json
│   ├── package.json
│   ├── prerender-manifest.json
│   ├── react-loadable-manifest.json
│   ├── required-server-files.json
│   ├── routes-manifest.json
│   └── trace
├── .tmp
│   ├── phase2-sales-results
│   │   └── .last-run.json
│   ├── phase34-sales-results
│   │   └── .last-run.json
│   ├── phase5-sales-results
│   │   └── .last-run.json
│   ├── qr-browser-results
│   │   └── .last-run.json
│   ├── qr-runtime
│   │   ├── java
│   │   │   └── jdk-21.0.12.1+1-jre
│   │   │       ├── bin
│   │   │       │   ├── server
│   │   │       │   │   ├── classes_nocoops.jsa
│   │   │       │   │   ├── classes.jsa
│   │   │       │   │   └── jvm.dll
│   │   │       │   ├── api-ms-win-core-console-l1-1-0.dll
│   │   │       │   ├── api-ms-win-core-console-l1-2-0.dll
│   │   │       │   ├── api-ms-win-core-datetime-l1-1-0.dll
│   │   │       │   ├── api-ms-win-core-debug-l1-1-0.dll
│   │   │       │   ├── api-ms-win-core-errorhandling-l1-1-0.dll
│   │   │       │   ├── api-ms-win-core-fibers-l1-1-0.dll
│   │   │       │   ├── api-ms-win-core-fibers-l1-1-1.dll
│   │   │       │   ├── api-ms-win-core-file-l1-1-0.dll
│   │   │       │   ├── api-ms-win-core-file-l1-2-0.dll
│   │   │       │   ├── api-ms-win-core-file-l2-1-0.dll
│   │   │       │   ├── api-ms-win-core-handle-l1-1-0.dll
│   │   │       │   ├── api-ms-win-core-heap-l1-1-0.dll
│   │   │       │   ├── api-ms-win-core-interlocked-l1-1-0.dll
│   │   │       │   ├── api-ms-win-core-kernel32-legacy-l1-1-1.dll
│   │   │       │   ├── api-ms-win-core-libraryloader-l1-1-0.dll
│   │   │       │   ├── api-ms-win-core-localization-l1-2-0.dll
│   │   │       │   ├── api-ms-win-core-memory-l1-1-0.dll
│   │   │       │   ├── api-ms-win-core-namedpipe-l1-1-0.dll
│   │   │       │   ├── api-ms-win-core-processenvironment-l1-1-0.dll
│   │   │       │   ├── api-ms-win-core-processthreads-l1-1-0.dll
│   │   │       │   ├── api-ms-win-core-processthreads-l1-1-1.dll
│   │   │       │   ├── api-ms-win-core-profile-l1-1-0.dll
│   │   │       │   ├── api-ms-win-core-rtlsupport-l1-1-0.dll
│   │   │       │   ├── api-ms-win-core-string-l1-1-0.dll
│   │   │       │   ├── api-ms-win-core-synch-l1-1-0.dll
│   │   │       │   ├── api-ms-win-core-synch-l1-2-0.dll
│   │   │       │   ├── api-ms-win-core-sysinfo-l1-1-0.dll
│   │   │       │   ├── api-ms-win-core-sysinfo-l1-2-0.dll
│   │   │       │   ├── api-ms-win-core-timezone-l1-1-0.dll
│   │   │       │   ├── api-ms-win-core-util-l1-1-0.dll
│   │   │       │   ├── api-ms-win-crt-conio-l1-1-0.dll
│   │   │       │   ├── api-ms-win-crt-convert-l1-1-0.dll
│   │   │       │   ├── api-ms-win-crt-environment-l1-1-0.dll
│   │   │       │   ├── api-ms-win-crt-filesystem-l1-1-0.dll
│   │   │       │   ├── api-ms-win-crt-heap-l1-1-0.dll
│   │   │       │   ├── api-ms-win-crt-locale-l1-1-0.dll
│   │   │       │   ├── api-ms-win-crt-math-l1-1-0.dll
│   │   │       │   ├── api-ms-win-crt-multibyte-l1-1-0.dll
│   │   │       │   ├── api-ms-win-crt-private-l1-1-0.dll
│   │   │       │   ├── api-ms-win-crt-process-l1-1-0.dll
│   │   │       │   ├── api-ms-win-crt-runtime-l1-1-0.dll
│   │   │       │   ├── api-ms-win-crt-stdio-l1-1-0.dll
│   │   │       │   ├── api-ms-win-crt-string-l1-1-0.dll
│   │   │       │   ├── api-ms-win-crt-time-l1-1-0.dll
│   │   │       │   ├── api-ms-win-crt-utility-l1-1-0.dll
│   │   │       │   ├── awt.dll
│   │   │       │   ├── dt_socket.dll
│   │   │       │   ├── extnet.dll
│   │   │       │   ├── fontmanager.dll
│   │   │       │   ├── freetype.dll
│   │   │       │   ├── instrument.dll
│   │   │       │   ├── j2gss.dll
│   │   │       │   ├── j2pcsc.dll
│   │   │       │   ├── j2pkcs11.dll
│   │   │       │   ├── jaas.dll
│   │   │       │   ├── jabswitch.exe
│   │   │       │   ├── jaccessinspector.exe
│   │   │       │   ├── jaccesswalker.exe
│   │   │       │   ├── java.dll
│   │   │       │   ├── java.exe
│   │   │       │   ├── javaaccessbridge.dll
│   │   │       │   ├── javajpeg.dll
│   │   │       │   ├── javaw.exe
│   │   │       │   ├── jawt.dll
│   │   │       │   ├── jdwp.dll
│   │   │       │   ├── jfr.exe
│   │   │       │   ├── jimage.dll
│   │   │       │   ├── jli.dll
│   │   │       │   ├── jrunscript.exe
│   │   │       │   ├── jsound.dll
│   │   │       │   ├── jsvml.dll
│   │   │       │   ├── jwebserver.exe
│   │   │       │   ├── keytool.exe
│   │   │       │   ├── kinit.exe
│   │   │       │   ├── klist.exe
│   │   │       │   ├── ktab.exe
│   │   │       │   ├── lcms.dll
│   │   │       │   ├── management_agent.dll
│   │   │       │   ├── management_ext.dll
│   │   │       │   ├── management.dll
│   │   │       │   ├── mlib_image.dll
│   │   │       │   ├── msvcp140.dll
│   │   │       │   ├── net.dll
│   │   │       │   ├── nio.dll
│   │   │       │   ├── prefs.dll
│   │   │       │   ├── rmi.dll
│   │   │       │   ├── rmiregistry.exe
│   │   │       │   ├── splashscreen.dll
│   │   │       │   ├── sspi_bridge.dll
│   │   │       │   ├── sunmscapi.dll
│   │   │       │   ├── syslookup.dll
│   │   │       │   ├── ucrtbase.dll
│   │   │       │   ├── vcruntime140_1.dll
│   │   │       │   ├── vcruntime140.dll
│   │   │       │   ├── verify.dll
│   │   │       │   ├── w2k_lsa_auth.dll
│   │   │       │   ├── windowsaccessbridge-64.dll
│   │   │       │   └── zip.dll
│   │   │       ├── conf
│   │   │       │   ├── management
│   │   │       │   │   ├── jmxremote.access
│   │   │       │   │   ├── jmxremote.password.template
│   │   │       │   │   └── management.properties
│   │   │       │   ├── security
│   │   │       │   │   ├── policy
│   │   │       │   │   │   ├── limited
│   │   │       │   │   │   │   ├── default_local.policy
│   │   │       │   │   │   │   ├── default_US_export.policy
│   │   │       │   │   │   │   └── exempt_local.policy
│   │   │       │   │   │   ├── unlimited
│   │   │       │   │   │   │   ├── default_local.policy
│   │   │       │   │   │   │   └── default_US_export.policy
│   │   │       │   │   │   └── README.txt
│   │   │       │   │   ├── java.policy
│   │   │       │   │   └── java.security
│   │   │       │   ├── jaxp.properties
│   │   │       │   ├── logging.properties
│   │   │       │   ├── net.properties
│   │   │       │   └── sound.properties
│   │   │       ├── legal
│   │   │       │   ├── java.base
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── aes.md
│   │   │       │   │   ├── asm.md
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   ├── c-libutl.md
│   │   │       │   │   ├── cldr.md
│   │   │       │   │   ├── icu.md
│   │   │       │   │   ├── LICENSE
│   │   │       │   │   ├── public_suffix.md
│   │   │       │   │   ├── siphash.md
│   │   │       │   │   ├── unicode.md
│   │   │       │   │   ├── wepoll.md
│   │   │       │   │   └── zlib.md
│   │   │       │   ├── java.compiler
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── java.datatransfer
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── java.desktop
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   ├── colorimaging.md
│   │   │       │   │   ├── freetype.md
│   │   │       │   │   ├── giflib.md
│   │   │       │   │   ├── harfbuzz.md
│   │   │       │   │   ├── jpeg.md
│   │   │       │   │   ├── lcms.md
│   │   │       │   │   ├── libpng.md
│   │   │       │   │   ├── LICENSE
│   │   │       │   │   └── mesa3d.md
│   │   │       │   ├── java.instrument
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── java.logging
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── java.management
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── java.management.rmi
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── java.naming
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── java.net.http
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── java.prefs
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── java.rmi
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── java.scripting
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── java.se
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── java.security.jgss
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── java.security.sasl
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── java.smartcardio
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── java.sql
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── java.sql.rowset
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── java.transaction.xa
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── java.xml
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   ├── bcel.md
│   │   │       │   │   ├── dom.md
│   │   │       │   │   ├── jcup.md
│   │   │       │   │   ├── LICENSE
│   │   │       │   │   ├── xalan.md
│   │   │       │   │   └── xerces.md
│   │   │       │   ├── java.xml.crypto
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   ├── LICENSE
│   │   │       │   │   └── santuario.md
│   │   │       │   ├── jdk.accessibility
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.charsets
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.crypto.cryptoki
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   ├── LICENSE
│   │   │       │   │   ├── pkcs11cryptotoken.md
│   │   │       │   │   └── pkcs11wrapper.md
│   │   │       │   ├── jdk.crypto.ec
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.crypto.mscapi
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.dynalink
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   ├── dynalink.md
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.httpserver
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.incubator.vector
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.internal.vm.ci
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.internal.vm.compiler
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.internal.vm.compiler.management
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.jdwp.agent
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.jfr
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.jsobject
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.localedata
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   ├── cldr.md
│   │   │       │   │   ├── LICENSE
│   │   │       │   │   └── thaidict.md
│   │   │       │   ├── jdk.management
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.management.agent
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.management.jfr
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.naming.dns
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.naming.rmi
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.net
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.nio.mapmode
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.sctp
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.security.auth
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.security.jgss
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.unsupported
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   ├── jdk.xml.dom
│   │   │       │   │   ├── ADDITIONAL_LICENSE_INFO
│   │   │       │   │   ├── ASSEMBLY_EXCEPTION
│   │   │       │   │   └── LICENSE
│   │   │       │   └── jdk.zipfs
│   │   │       │       ├── ADDITIONAL_LICENSE_INFO
│   │   │       │       ├── ASSEMBLY_EXCEPTION
│   │   │       │       └── LICENSE
│   │   │       ├── lib
│   │   │       │   ├── jfr
│   │   │       │   │   ├── default.jfc
│   │   │       │   │   └── profile.jfc
│   │   │       │   ├── security
│   │   │       │   │   ├── blocked.certs
│   │   │       │   │   ├── cacerts
│   │   │       │   │   ├── default.policy
│   │   │       │   │   └── public_suffix_list.dat
│   │   │       │   ├── classlist
│   │   │       │   ├── fontconfig.bfc
│   │   │       │   ├── fontconfig.properties.src
│   │   │       │   ├── jawt.lib
│   │   │       │   ├── jrt-fs.jar
│   │   │       │   ├── jvm.cfg
│   │   │       │   ├── jvm.lib
│   │   │       │   ├── modules
│   │   │       │   ├── psfont.properties.ja
│   │   │       │   ├── psfontj2d.properties
│   │   │       │   ├── tzdb.dat
│   │   │       │   └── tzmappings
│   │   │       ├── NOTICE
│   │   │       └── release
│   │   └── jre.zip
│   ├── advisor-light.png
│   ├── inspect-advisor-inventory.ts
│   ├── phase2-build.log
│   ├── phase2-emulator.log
│   ├── phase34-build.log
│   ├── phase34-emulator.log
│   ├── phase34-focused-emulator.log
│   ├── phase5-build.log
│   ├── phase5-emulator.log
│   ├── phase5-unit.log
│   ├── qr-admin-focus.png
│   ├── qr-backup.json
│   ├── qr-browser-server.log
│   ├── qr-health-dark-1280.png
│   ├── qr-health-dark-390.png
│   ├── qr-health-light-1280.png
│   ├── qr-health-light-390.png
│   ├── qr-live-firestore.rules
│   ├── qr-live-part-desktop.png
│   ├── qr-live-part-mobile.png
│   ├── qr-live-system-debug.png
│   ├── qr-migration-applied.json
│   ├── qr-migration-final-dry-run.json
│   ├── qr-migration-resumed.json
│   ├── qr-migration.json
│   ├── qr-original-fields.json
│   ├── qr-part-desktop.png
│   ├── qr-part-mobile.png
│   ├── qr-phase0-hosted-checks.json
│   ├── qr-phase0-hosted-checks.ts
│   ├── qr-phase0-release.cjs
│   ├── qr-phase0-release.json
│   ├── qr-phase01-before.json
│   ├── qr-phase01-dry-run.json
│   ├── qr-phase01-health.json
│   ├── qr-private-copy-check.json
│   ├── qr-safety-check.json
│   ├── qr-system-popup.png
│   ├── smoke-advisor.cjs
│   ├── smoke-new-build.cjs
│   ├── validate-advisor-result.ts
│   ├── verify-advisor-background.cjs
│   ├── verify-advisor-parallel.cjs
│   ├── verify-advisor-web-search.ts
│   ├── verify-advisor-web-ui.cjs
│   ├── web-search-mobile-dark.png
│   ├── web-search-mobile-light.png
│   ├── web-search-mobile.png
│   ├── web-search-result-dark.png
│   ├── web-search-result-light.png
│   └── web-search-result.png
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
│   │   │   └── 2026-11-04-public-auth-flicker.md
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
│   ├── screenshot-admin-ai.png
│   ├── screenshot-admin-management.png
│   ├── screenshot-admin-reservations.png
│   ├── screenshot-admin-sales-light.png
│   ├── screenshot-admin-sales.png
│   ├── screenshot-admin-stock.png
│   ├── screenshot-home.png
│   ├── screenshot-mega-menu-dark.png
│   ├── screenshot-mega-menu-light.png
│   ├── screenshot-mega-menu.png
│   ├── screenshot-onboarding-header.png
│   ├── screenshot-reservations-5cols.png
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
├── scripts
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
│   │   │   │   ├── build-advisor
│   │   │   │   │   ├── critique
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── recommendations
│   │   │   │   │       └── route.ts
│   │   │   │   └── live-build-recommendations
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
│   │   ├── loading-audit-preview
│   │   ├── parts
│   │   │   ├── [productId]
│   │   │   │   ├── loading.tsx
│   │   │   │   └── page.tsx
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
│   │   ├── settings
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
│       │   ├── public-products.ts
│       │   ├── qr-auth.ts
│       │   ├── qr-health-analysis.ts
│       │   └── qr-health.ts
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
│   ├── auth-role-navigation.spec.ts
│   ├── chat-part-specifications.spec.ts
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
├── tmp
│   ├── loading-audit
│   │   ├── accessories-heading-loaded-1440.png
│   │   ├── accessories-heading-loaded-390.png
│   │   ├── accessories-heading-loaded-768.png
│   │   ├── accessories-heading-loading-1440.png
│   │   ├── accessories-heading-loading-390.png
│   │   ├── accessories-heading-loading-768.png
│   │   ├── builder-before-1440.png
│   │   ├── builder-before-390.png
│   │   ├── builder-before-768.png
│   │   ├── builder-before.json
│   │   ├── builder-loaded-1440.png
│   │   ├── builder-loaded-390.png
│   │   ├── builder-loaded-768.png
│   │   ├── builder-loading-1440.png
│   │   ├── builder-loading-390.png
│   │   ├── builder-loading-768.png
│   │   ├── customer--ai-build-advisor-1440.png
│   │   ├── customer--ai-build-advisor-390.png
│   │   ├── customer--ai-build-advisor-768.png
│   │   ├── customer--profile-1440.png
│   │   ├── customer--profile-390.png
│   │   ├── customer--profile-768.png
│   │   ├── customer--support-requests-1440.png
│   │   ├── customer--support-requests-390.png
│   │   ├── customer--support-requests-768.png
│   │   ├── featured-products-heading-loaded-1440.png
│   │   ├── featured-products-heading-loaded-390.png
│   │   ├── featured-products-heading-loaded-768.png
│   │   ├── featured-products-heading-loading-1440.png
│   │   ├── featured-products-heading-loading-390.png
│   │   ├── featured-products-heading-loading-768.png
│   │   ├── guest---1440.png
│   │   ├── guest---390.png
│   │   ├── guest---768.png
│   │   ├── guest--ai-build-advisor-1440.png
│   │   ├── guest--ai-build-advisor-390.png
│   │   ├── guest--ai-build-advisor-768.png
│   │   ├── guest--parts-1440.png
│   │   ├── guest--parts-390.png
│   │   ├── guest--parts-768.png
│   │   ├── guest--pre-builts-1440.png
│   │   ├── guest--pre-builts-390.png
│   │   ├── guest--pre-builts-768.png
│   │   ├── manager--admin-1440.png
│   │   ├── manager--admin-390.png
│   │   ├── manager--admin-768.png
│   │   ├── manager--admin-contact-inquiries-1440.png
│   │   ├── manager--admin-contact-inquiries-390.png
│   │   ├── manager--admin-contact-inquiries-768.png
│   │   ├── manager--admin-prebuilt-builder-1440.png
│   │   ├── manager--admin-prebuilt-builder-390.png
│   │   ├── manager--admin-prebuilt-builder-768.png
│   │   ├── manager--profile-1440.png
│   │   ├── manager--profile-390.png
│   │   ├── manager--profile-768.png
│   │   └── pages-before.json
│   ├── loading-test-results
│   │   └── .last-run.json
│   ├── pdfs
│   │   ├── audit-page-1.png
│   │   ├── audit-page-2.png
│   │   ├── audit-page-3.png
│   │   ├── audit-page-4.png
│   │   ├── audit-page-5.png
│   │   ├── audit-page-6.png
│   │   ├── audit-page-7.png
│   │   ├── contact-sheet.png
│   │   ├── create_ui_audit_pdf.py
│   │   ├── live-approved-page-1.png
│   │   ├── live-approved-page-5.png
│   │   ├── live-final-last.png
│   │   ├── live-final-page-1.png
│   │   ├── live-final-page-5.png
│   │   ├── live-page-1.png
│   │   ├── live-page-5.png
│   │   ├── make_ui_audit_pdf.py
│   │   ├── page-1.png
│   │   ├── page-4.png
│   │   └── your-build-sample.pdf
│   ├── performance
│   │   ├── hosted-before-desktop.png
│   │   ├── hosted-before-mobile.png
│   │   ├── hosted-before.json
│   │   ├── inventory-after-admin-desktop.png
│   │   ├── inventory-after-builder-desktop.png
│   │   ├── inventory-before-admin-desktop.png
│   │   ├── inventory-before-admin-mobile.png
│   │   ├── inventory-before-builder-desktop.png
│   │   ├── inventory-before-builder-mobile.png
│   │   ├── inventory-before.json
│   │   ├── inventory-final-admin-desktop.png
│   │   ├── inventory-final-admin-mobile.png
│   │   ├── inventory-final-builder-desktop.png
│   │   ├── inventory-final-builder-mobile.png
│   │   ├── inventory-final.json
│   │   ├── local-after-desktop.png
│   │   ├── local-after-mobile.png
│   │   ├── local-after.json
│   │   ├── local-before-desktop.png
│   │   ├── local-before-mobile.png
│   │   ├── local-before.json
│   │   ├── local-final-desktop.png
│   │   ├── local-final-mobile.png
│   │   ├── local-final.json
│   │   ├── trace-sample-desktop.png
│   │   ├── trace-sample-mobile.png
│   │   ├── trace-sample-mobile.trace.json
│   │   └── trace-sample.json
│   ├── playwright
│   │   ├── tests-auth-role-navigation-6f874-ustomer-route-after-refresh
│   │   │   └── error-context.md
│   │   ├── tests-auth-role-navigation-78924-ut-removes-protected-access
│   │   │   └── error-context.md
│   │   ├── tests-auth-role-navigation-82e0d-ob-across-client-navigation
│   │   │   └── error-context.md
│   │   └── .last-run.json
│   ├── playwright-advisor
│   │   └── .last-run.json
│   ├── playwright-final
│   │   ├── tests-auth-role-navigation-82e0d-ob-across-client-navigation
│   │   │   └── error-context.md
│   │   └── .last-run.json
│   ├── playwright-image-motion
│   │   └── .last-run.json
│   ├── playwright-inventory
│   │   └── .last-run.json
│   ├── playwright-inventory-final
│   │   └── .last-run.json
│   ├── playwright-prebuilt-toast
│   │   └── .last-run.json
│   ├── playwright-verified
│   │   └── .last-run.json
│   ├── audit-loading.mjs
│   ├── audit-pages.mjs
│   ├── extend-loading-tests.mjs
│   ├── loading-fixture.tsx
│   ├── refactor-admin-loading.mjs
│   ├── refactor-builder-loading.mjs
│   ├── refactor-catalog-loading.mjs
│   ├── refactor-chart-loading.mjs
│   ├── refactor-landing-loading.mjs
│   ├── refactor-profile-loading.mjs
│   ├── refactor-protected-loading.mjs
│   ├── test_knowledge_tools.ts
│   ├── test_local_extraction.ts
│   ├── test_search.ts
│   ├── v2-model-verified.png
│   ├── verify_google_search.ts
│   ├── verify_local_db.ts
│   └── verify-build-pdf.ts
├── .env
├── .firebaserc
├── .gitignore
├── .modified
├── agents.md
├── apphosting.yaml
├── CHANGELOG.md
├── CLAUDE.md
├── components.json
├── debug-response.json
├── debug.log
├── DESIGN.md
├── eslint.config.mjs
├── firebase.json
├── firebase.qr-test.json
├── firestore-debug.log
├── firestore.indexes.json
├── firestore.rules
├── GEMINI.md
├── grounding-debug.log
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
