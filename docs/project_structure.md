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
│   │   └── ui-ux-pro-max
│   │       ├── data
│   │       ├── scripts
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
│   │   ├── fetch-cache
│   │   │   └── a4b12e31f8ac302e63d078d1c0242bf4336846f9ee9cf48d9e266078f232a5cc
│   │   ├── swc
│   │   │   └── plugins
│   │   │       └── windows_x86_64_18.0.0
│   │   ├── webpack
│   │   │   ├── client-production
│   │   │   │   ├── 0.pack
│   │   │   │   ├── 1.pack
│   │   │   │   ├── 2.pack
│   │   │   │   ├── 3.pack
│   │   │   │   ├── 4.pack
│   │   │   │   ├── index.pack
│   │   │   │   └── index.pack.old
│   │   │   ├── edge-server-production
│   │   │   │   ├── 0.pack
│   │   │   │   └── index.pack
│   │   │   └── server-production
│   │   │       ├── 0.pack
│   │   │       ├── 1.pack
│   │   │       ├── 2.pack
│   │   │       ├── 3.pack
│   │   │       ├── 4.pack
│   │   │       ├── 5.pack
│   │   │       ├── index.pack
│   │   │       └── index.pack.old
│   │   ├── .previewinfo
│   │   ├── .rscinfo
│   │   └── next-devtools-config.json
│   ├── diagnostics
│   │   ├── build-diagnostics.json
│   │   └── framework.json
│   ├── server
│   │   ├── app
│   │   │   ├── _not-found
│   │   │   │   ├── page
│   │   │   │   │   ├── app-build-manifest.json
│   │   │   │   │   ├── app-paths-manifest.json
│   │   │   │   │   ├── build-manifest.json
│   │   │   │   │   ├── next-font-manifest.json
│   │   │   │   │   ├── react-loadable-manifest.json
│   │   │   │   │   └── server-reference-manifest.json
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   ├── page.js.map
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
│   │   │   │   ├── page
│   │   │   │   │   ├── app-build-manifest.json
│   │   │   │   │   ├── app-paths-manifest.json
│   │   │   │   │   ├── build-manifest.json
│   │   │   │   │   ├── next-font-manifest.json
│   │   │   │   │   ├── react-loadable-manifest.json
│   │   │   │   │   └── server-reference-manifest.json
│   │   │   │   ├── prebuilt-builder
│   │   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   │   ├── page.js
│   │   │   │   │   └── page.js.nft.json
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   ├── page.js.map
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
│   │   │   │   │   └── qr-health
│   │   │   │   │       ├── route
│   │   │   │   │       │   ├── app-build-manifest.json
│   │   │   │   │       │   ├── app-paths-manifest.json
│   │   │   │   │       │   ├── build-manifest.json
│   │   │   │   │       │   └── server-reference-manifest.json
│   │   │   │   │       ├── route_client-reference-manifest.js
│   │   │   │   │       ├── route.js
│   │   │   │   │       └── route.js.map
│   │   │   │   ├── ai
│   │   │   │   │   └── build-advisor
│   │   │   │   │       └── recommendations
│   │   │   │   │           ├── route_client-reference-manifest.js
│   │   │   │   │           ├── route.js
│   │   │   │   │           └── route.js.nft.json
│   │   │   │   ├── builder
│   │   │   │   │   └── download
│   │   │   │   │       ├── route_client-reference-manifest.js
│   │   │   │   │       ├── route.js
│   │   │   │   │       └── route.js.nft.json
│   │   │   │   ├── chat
│   │   │   │   │   ├── route_client-reference-manifest.js
│   │   │   │   │   ├── route.js
│   │   │   │   │   └── route.js.nft.json
│   │   │   │   ├── contact
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
│   │   │   │   └── qr
│   │   │   │       └── [token]
│   │   │   │           ├── route
│   │   │   │           │   ├── app-build-manifest.json
│   │   │   │           │   ├── app-paths-manifest.json
│   │   │   │           │   ├── build-manifest.json
│   │   │   │           │   └── server-reference-manifest.json
│   │   │   │           ├── route_client-reference-manifest.js
│   │   │   │           ├── route.js
│   │   │   │           ├── route.js.map
│   │   │   │           └── route.js.nft.json
│   │   │   ├── apple-icon.png
│   │   │   │   ├── route.js
│   │   │   │   └── route.js.nft.json
│   │   │   ├── builder
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
│   │   │   ├── icon.svg
│   │   │   │   ├── route.js
│   │   │   │   └── route.js.nft.json
│   │   │   ├── parts
│   │   │   │   ├── [productId]
│   │   │   │   │   ├── page
│   │   │   │   │   │   ├── app-build-manifest.json
│   │   │   │   │   │   ├── app-paths-manifest.json
│   │   │   │   │   │   ├── build-manifest.json
│   │   │   │   │   │   ├── next-font-manifest.json
│   │   │   │   │   │   ├── react-loadable-manifest.json
│   │   │   │   │   │   └── server-reference-manifest.json
│   │   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   │   ├── page.js
│   │   │   │   │   ├── page.js.map
│   │   │   │   │   └── page.js.nft.json
│   │   │   │   ├── page
│   │   │   │   │   ├── app-build-manifest.json
│   │   │   │   │   ├── app-paths-manifest.json
│   │   │   │   │   ├── build-manifest.json
│   │   │   │   │   ├── next-font-manifest.json
│   │   │   │   │   ├── react-loadable-manifest.json
│   │   │   │   │   └── server-reference-manifest.json
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   ├── page.js.map
│   │   │   │   └── page.js.nft.json
│   │   │   ├── pre-builts
│   │   │   │   ├── [id]
│   │   │   │   │   ├── page
│   │   │   │   │   │   ├── app-build-manifest.json
│   │   │   │   │   │   ├── app-paths-manifest.json
│   │   │   │   │   │   ├── build-manifest.json
│   │   │   │   │   │   ├── next-font-manifest.json
│   │   │   │   │   │   ├── react-loadable-manifest.json
│   │   │   │   │   │   └── server-reference-manifest.json
│   │   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   │   ├── page.js
│   │   │   │   │   ├── page.js.map
│   │   │   │   │   └── page.js.nft.json
│   │   │   │   ├── page
│   │   │   │   │   ├── app-build-manifest.json
│   │   │   │   │   ├── app-paths-manifest.json
│   │   │   │   │   ├── build-manifest.json
│   │   │   │   │   ├── next-font-manifest.json
│   │   │   │   │   ├── react-loadable-manifest.json
│   │   │   │   │   └── server-reference-manifest.json
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   ├── page.js.map
│   │   │   │   └── page.js.nft.json
│   │   │   ├── profile
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   └── page.js.nft.json
│   │   │   ├── q
│   │   │   │   └── [token]
│   │   │   │       ├── page
│   │   │   │       │   ├── app-build-manifest.json
│   │   │   │       │   ├── app-paths-manifest.json
│   │   │   │       │   ├── build-manifest.json
│   │   │   │       │   ├── next-font-manifest.json
│   │   │   │       │   ├── react-loadable-manifest.json
│   │   │   │       │   └── server-reference-manifest.json
│   │   │   │       ├── page_client-reference-manifest.js
│   │   │   │       ├── page.js
│   │   │   │       ├── page.js.map
│   │   │   │       └── page.js.nft.json
│   │   │   ├── signin
│   │   │   │   ├── page
│   │   │   │   │   ├── app-build-manifest.json
│   │   │   │   │   ├── app-paths-manifest.json
│   │   │   │   │   ├── build-manifest.json
│   │   │   │   │   ├── next-font-manifest.json
│   │   │   │   │   ├── react-loadable-manifest.json
│   │   │   │   │   └── server-reference-manifest.json
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   ├── page.js.map
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
│   │   │   │   ├── page
│   │   │   │   │   ├── app-build-manifest.json
│   │   │   │   │   ├── app-paths-manifest.json
│   │   │   │   │   ├── build-manifest.json
│   │   │   │   │   ├── next-font-manifest.json
│   │   │   │   │   ├── react-loadable-manifest.json
│   │   │   │   │   └── server-reference-manifest.json
│   │   │   │   ├── signup
│   │   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   │   ├── page.js
│   │   │   │   │   └── page.js.nft.json
│   │   │   │   ├── page_client-reference-manifest.js
│   │   │   │   ├── page.js
│   │   │   │   ├── page.js.map
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
│   │   │   ├── ssr
│   │   │   │   ├── _16e50adc._.js
│   │   │   │   ├── _16e50adc._.js.map
│   │   │   │   ├── _2e094f6c._.js
│   │   │   │   ├── _2e094f6c._.js.map
│   │   │   │   ├── _7d37fb37._.js
│   │   │   │   ├── _7d37fb37._.js.map
│   │   │   │   ├── _aa91a7b3._.js
│   │   │   │   ├── _aa91a7b3._.js.map
│   │   │   │   ├── [root-of-the-server]__22a492be._.js
│   │   │   │   ├── [root-of-the-server]__22a492be._.js.map
│   │   │   │   ├── [root-of-the-server]__275c6f36._.js
│   │   │   │   ├── [root-of-the-server]__275c6f36._.js.map
│   │   │   │   ├── [root-of-the-server]__28b01990._.js
│   │   │   │   ├── [root-of-the-server]__28b01990._.js.map
│   │   │   │   ├── [root-of-the-server]__2dbc566f._.js
│   │   │   │   ├── [root-of-the-server]__2dbc566f._.js.map
│   │   │   │   ├── [root-of-the-server]__31e8d935._.js
│   │   │   │   ├── [root-of-the-server]__31e8d935._.js.map
│   │   │   │   ├── [root-of-the-server]__3a7754cd._.js
│   │   │   │   ├── [root-of-the-server]__3a7754cd._.js.map
│   │   │   │   ├── [root-of-the-server]__4d3c106c._.js
│   │   │   │   ├── [root-of-the-server]__4d3c106c._.js.map
│   │   │   │   ├── [root-of-the-server]__59ad1344._.js
│   │   │   │   ├── [root-of-the-server]__59ad1344._.js.map
│   │   │   │   ├── [root-of-the-server]__5daf21c4._.js
│   │   │   │   ├── [root-of-the-server]__5daf21c4._.js.map
│   │   │   │   ├── [root-of-the-server]__61549fff._.js
│   │   │   │   ├── [root-of-the-server]__61549fff._.js.map
│   │   │   │   ├── [root-of-the-server]__7cec573e._.js
│   │   │   │   ├── [root-of-the-server]__7cec573e._.js.map
│   │   │   │   ├── [root-of-the-server]__910c8955._.js
│   │   │   │   ├── [root-of-the-server]__910c8955._.js.map
│   │   │   │   ├── [root-of-the-server]__a55a4bb7._.js
│   │   │   │   ├── [root-of-the-server]__a55a4bb7._.js.map
│   │   │   │   ├── [root-of-the-server]__bea21583._.js
│   │   │   │   ├── [root-of-the-server]__bea21583._.js.map
│   │   │   │   ├── [root-of-the-server]__c80f7c8f._.js
│   │   │   │   ├── [root-of-the-server]__c80f7c8f._.js.map
│   │   │   │   ├── [root-of-the-server]__cbe2c887._.js
│   │   │   │   ├── [root-of-the-server]__cbe2c887._.js.map
│   │   │   │   ├── [root-of-the-server]__d0dc6bca._.js
│   │   │   │   ├── [root-of-the-server]__d0dc6bca._.js.map
│   │   │   │   ├── [root-of-the-server]__f0336b73._.js
│   │   │   │   ├── [root-of-the-server]__f0336b73._.js.map
│   │   │   │   ├── [turbopack]_browser_dev_hmr-client_hmr-client_ts_818f0fdf._.js
│   │   │   │   ├── [turbopack]_browser_dev_hmr-client_hmr-client_ts_818f0fdf._.js.map
│   │   │   │   ├── [turbopack]_runtime.js
│   │   │   │   ├── [turbopack]_runtime.js.map
│   │   │   │   ├── 2a4f4_@grpc_grpc-js_e65e1e96._.js
│   │   │   │   ├── 2a4f4_@grpc_grpc-js_e65e1e96._.js.map
│   │   │   │   ├── 94568_@firebase_auth_dist_node-esm_39d07344._.js
│   │   │   │   ├── 94568_@firebase_auth_dist_node-esm_39d07344._.js.map
│   │   │   │   ├── node_modules_@ai-sdk_5bc85d02._.js
│   │   │   │   ├── node_modules_@ai-sdk_5bc85d02._.js.map
│   │   │   │   ├── node_modules_@ai-sdk_google_dist_index_mjs_bdc4cc50._.js
│   │   │   │   ├── node_modules_@ai-sdk_google_dist_index_mjs_bdc4cc50._.js.map
│   │   │   │   ├── node_modules_@firebase_firestore_dist_index_node_mjs_8bec9454._.js
│   │   │   │   ├── node_modules_@firebase_firestore_dist_index_node_mjs_8bec9454._.js.map
│   │   │   │   ├── node_modules_@firebase_storage_dist_node-esm_index_node_esm_7eeaaba0.js
│   │   │   │   ├── node_modules_@firebase_storage_dist_node-esm_index_node_esm_7eeaaba0.js.map
│   │   │   │   ├── node_modules_@floating-ui_react_dist_3d79f7db._.js
│   │   │   │   ├── node_modules_@floating-ui_react_dist_3d79f7db._.js.map
│   │   │   │   ├── node_modules_@genkit-ai_ai_lib_6fe21ff5._.js
│   │   │   │   ├── node_modules_@genkit-ai_ai_lib_6fe21ff5._.js.map
│   │   │   │   ├── node_modules_@genkit-ai_core_lib_5b1526ac._.js
│   │   │   │   ├── node_modules_@genkit-ai_core_lib_5b1526ac._.js.map
│   │   │   │   ├── node_modules_@genkit-ai_google-genai_lib_a20550b7._.js
│   │   │   │   ├── node_modules_@genkit-ai_google-genai_lib_a20550b7._.js.map
│   │   │   │   ├── node_modules_@grpc_grpc-js_dee9e152._.js
│   │   │   │   ├── node_modules_@grpc_grpc-js_dee9e152._.js.map
│   │   │   │   ├── node_modules_@mantine_core_esm_21d35c07._.js
│   │   │   │   ├── node_modules_@mantine_core_esm_21d35c07._.js.map
│   │   │   │   ├── node_modules_@mantine_core_esm_365b8ea5._.js
│   │   │   │   ├── node_modules_@mantine_core_esm_365b8ea5._.js.map
│   │   │   │   ├── node_modules_@mantine_core_esm_4b77b7ea._.js
│   │   │   │   ├── node_modules_@mantine_core_esm_4b77b7ea._.js.map
│   │   │   │   ├── node_modules_@mantine_core_esm_b930ce9b._.js
│   │   │   │   ├── node_modules_@mantine_core_esm_b930ce9b._.js.map
│   │   │   │   ├── node_modules_@mantine_core_esm_c5779e9b._.js
│   │   │   │   ├── node_modules_@mantine_core_esm_c5779e9b._.js.map
│   │   │   │   ├── node_modules_@opentelemetry_05992674._.js
│   │   │   │   ├── node_modules_@opentelemetry_05992674._.js.map
│   │   │   │   ├── node_modules_@opentelemetry_28b1336a._.js
│   │   │   │   ├── node_modules_@opentelemetry_28b1336a._.js.map
│   │   │   │   ├── node_modules_@opentelemetry_4a05c3bf._.js
│   │   │   │   ├── node_modules_@opentelemetry_4a05c3bf._.js.map
│   │   │   │   ├── node_modules_@opentelemetry_otlp-transformer_build_esm_6522dc85._.js
│   │   │   │   ├── node_modules_@opentelemetry_otlp-transformer_build_esm_6522dc85._.js.map
│   │   │   │   ├── node_modules_@opentelemetry_resources_build_esm_5f5d2121._.js
│   │   │   │   ├── node_modules_@opentelemetry_resources_build_esm_5f5d2121._.js.map
│   │   │   │   ├── node_modules_@opentelemetry_sdk-metrics_build_esm_1ea28c64._.js
│   │   │   │   ├── node_modules_@opentelemetry_sdk-metrics_build_esm_1ea28c64._.js.map
│   │   │   │   ├── node_modules_@opentelemetry_sdk-trace-base_build_esm_4b613864._.js
│   │   │   │   ├── node_modules_@opentelemetry_sdk-trace-base_build_esm_4b613864._.js.map
│   │   │   │   ├── node_modules_@vercel_oidc_dist_339f32a4._.js
│   │   │   │   ├── node_modules_@vercel_oidc_dist_339f32a4._.js.map
│   │   │   │   ├── node_modules_@vercel_oidc_dist_token_931a56ab.js
│   │   │   │   ├── node_modules_@vercel_oidc_dist_token_931a56ab.js.map
│   │   │   │   ├── node_modules_@vercel_oidc_dist_token_c8b2c1a7.js
│   │   │   │   ├── node_modules_@vercel_oidc_dist_token_c8b2c1a7.js.map
│   │   │   │   ├── node_modules_01dd0587._.js
│   │   │   │   ├── node_modules_01dd0587._.js.map
│   │   │   │   ├── node_modules_063e2c9a._.js
│   │   │   │   ├── node_modules_063e2c9a._.js.map
│   │   │   │   ├── node_modules_0b24718f._.js
│   │   │   │   ├── node_modules_0b24718f._.js.map
│   │   │   │   ├── node_modules_0b81925b._.js
│   │   │   │   ├── node_modules_0b81925b._.js.map
│   │   │   │   ├── node_modules_0df20cbe._.js
│   │   │   │   ├── node_modules_0df20cbe._.js.map
│   │   │   │   ├── node_modules_2971e4ab._.js
│   │   │   │   ├── node_modules_2971e4ab._.js.map
│   │   │   │   ├── node_modules_365bf203._.js
│   │   │   │   ├── node_modules_365bf203._.js.map
│   │   │   │   ├── node_modules_3e30fd05._.js
│   │   │   │   ├── node_modules_3e30fd05._.js.map
│   │   │   │   ├── node_modules_4dcd2a7a._.js
│   │   │   │   ├── node_modules_4dcd2a7a._.js.map
│   │   │   │   ├── node_modules_63581b6b._.js
│   │   │   │   ├── node_modules_63581b6b._.js.map
│   │   │   │   ├── node_modules_778616d7._.js
│   │   │   │   ├── node_modules_778616d7._.js.map
│   │   │   │   ├── node_modules_803ddb3a._.js
│   │   │   │   ├── node_modules_803ddb3a._.js.map
│   │   │   │   ├── node_modules_976992af._.js
│   │   │   │   ├── node_modules_976992af._.js.map
│   │   │   │   ├── node_modules_a918f8b3._.js
│   │   │   │   ├── node_modules_a918f8b3._.js.map
│   │   │   │   ├── node_modules_ai_dist_index_mjs_56ee2b81._.js
│   │   │   │   ├── node_modules_ai_dist_index_mjs_56ee2b81._.js.map
│   │   │   │   ├── node_modules_ai_dist_index_mjs_7a62fa11._.js
│   │   │   │   ├── node_modules_ai_dist_index_mjs_7a62fa11._.js.map
│   │   │   │   ├── node_modules_ajv_dist_7f0a026b._.js
│   │   │   │   ├── node_modules_ajv_dist_7f0a026b._.js.map
│   │   │   │   ├── node_modules_bb681d96._.js
│   │   │   │   ├── node_modules_bb681d96._.js.map
│   │   │   │   ├── node_modules_c1738bf7._.js
│   │   │   │   ├── node_modules_c1738bf7._.js.map
│   │   │   │   ├── node_modules_c74958c7._.js
│   │   │   │   ├── node_modules_c74958c7._.js.map
│   │   │   │   ├── node_modules_e8f6801c._.js
│   │   │   │   ├── node_modules_e8f6801c._.js.map
│   │   │   │   ├── node_modules_e9b3bdf2._.js
│   │   │   │   ├── node_modules_e9b3bdf2._.js.map
│   │   │   │   ├── node_modules_ecd861af._.js
│   │   │   │   ├── node_modules_ecd861af._.js.map
│   │   │   │   ├── node_modules_efcaee88._.js
│   │   │   │   ├── node_modules_efcaee88._.js.map
│   │   │   │   ├── node_modules_framer-motion_dist_es_514a1049._.js
│   │   │   │   ├── node_modules_framer-motion_dist_es_514a1049._.js.map
│   │   │   │   ├── node_modules_gaxios_345b1140._.js
│   │   │   │   ├── node_modules_gaxios_345b1140._.js.map
│   │   │   │   ├── node_modules_google-auth-library_cabb386c._.js
│   │   │   │   ├── node_modules_google-auth-library_cabb386c._.js.map
│   │   │   │   ├── node_modules_handlebars_dist_cjs_670ea975._.js
│   │   │   │   ├── node_modules_handlebars_dist_cjs_670ea975._.js.map
│   │   │   │   ├── node_modules_lodash_84097691._.js
│   │   │   │   ├── node_modules_lodash_84097691._.js.map
│   │   │   │   ├── node_modules_lucide-react_dist_esm_icons_5379007d._.js
│   │   │   │   ├── node_modules_lucide-react_dist_esm_icons_5379007d._.js.map
│   │   │   │   ├── node_modules_lucide-react_dist_esm_icons_9373f846._.js
│   │   │   │   ├── node_modules_lucide-react_dist_esm_icons_9373f846._.js.map
│   │   │   │   ├── node_modules_lucide-react_dist_esm_icons_d18f4625._.js
│   │   │   │   ├── node_modules_lucide-react_dist_esm_icons_d18f4625._.js.map
│   │   │   │   ├── node_modules_lucide-react_dist_esm_icons_fd46b353._.js
│   │   │   │   ├── node_modules_lucide-react_dist_esm_icons_fd46b353._.js.map
│   │   │   │   ├── node_modules_lucide-react_dist_esm_icons_type_5697afda.js
│   │   │   │   ├── node_modules_lucide-react_dist_esm_icons_type_5697afda.js.map
│   │   │   │   ├── node_modules_micromark-core-commonmark_dev_lib_db259fd5._.js
│   │   │   │   ├── node_modules_micromark-core-commonmark_dev_lib_db259fd5._.js.map
│   │   │   │   ├── node_modules_next_1a7a45c3._.js
│   │   │   │   ├── node_modules_next_1a7a45c3._.js.map
│   │   │   │   ├── node_modules_next_4fddc522._.js
│   │   │   │   ├── node_modules_next_4fddc522._.js.map
│   │   │   │   ├── node_modules_next_541eaa37._.js
│   │   │   │   ├── node_modules_next_541eaa37._.js.map
│   │   │   │   ├── node_modules_next_67b8332a._.js
│   │   │   │   ├── node_modules_next_67b8332a._.js.map
│   │   │   │   ├── node_modules_next_a4821b77._.js
│   │   │   │   ├── node_modules_next_a4821b77._.js.map
│   │   │   │   ├── node_modules_next_b4a2133c._.js
│   │   │   │   ├── node_modules_next_b4a2133c._.js.map
│   │   │   │   ├── node_modules_next_bc790d8d._.js
│   │   │   │   ├── node_modules_next_bc790d8d._.js.map
│   │   │   │   ├── node_modules_next_d492c570._.js
│   │   │   │   ├── node_modules_next_d492c570._.js.map
│   │   │   │   ├── node_modules_next_ded47c9a._.js
│   │   │   │   ├── node_modules_next_ded47c9a._.js.map
│   │   │   │   ├── node_modules_next_dist_291d111f._.js
│   │   │   │   ├── node_modules_next_dist_291d111f._.js.map
│   │   │   │   ├── node_modules_next_dist_9afa1ded._.js
│   │   │   │   ├── node_modules_next_dist_9afa1ded._.js.map
│   │   │   │   ├── node_modules_next_dist_client_70549d4a._.js
│   │   │   │   ├── node_modules_next_dist_client_70549d4a._.js.map
│   │   │   │   ├── node_modules_next_dist_client_components_9774470f._.js
│   │   │   │   ├── node_modules_next_dist_client_components_9774470f._.js.map
│   │   │   │   ├── node_modules_next_dist_client_components_builtin_forbidden_45780354.js
│   │   │   │   ├── node_modules_next_dist_client_components_builtin_forbidden_45780354.js.map
│   │   │   │   ├── node_modules_next_dist_client_components_builtin_global-error_ece394eb.js
│   │   │   │   ├── node_modules_next_dist_client_components_builtin_global-error_ece394eb.js.map
│   │   │   │   ├── node_modules_next_dist_client_components_builtin_unauthorized_15817684.js
│   │   │   │   ├── node_modules_next_dist_client_components_builtin_unauthorized_15817684.js.map
│   │   │   │   ├── node_modules_next_dist_compiled_b1baabe8._.js
│   │   │   │   ├── node_modules_next_dist_compiled_b1baabe8._.js.map
│   │   │   │   ├── node_modules_next_dist_compiled_next-devtools_index_a19313bf.js
│   │   │   │   ├── node_modules_next_dist_compiled_next-devtools_index_a19313bf.js.map
│   │   │   │   ├── node_modules_next_dist_esm_968ff1ee._.js
│   │   │   │   ├── node_modules_next_dist_esm_968ff1ee._.js.map
│   │   │   │   ├── node_modules_next_dist_server_route-modules_app-page_f354387c._.js
│   │   │   │   ├── node_modules_next_dist_server_route-modules_app-page_f354387c._.js.map
│   │   │   │   ├── node_modules_next_e36c7a06._.js
│   │   │   │   ├── node_modules_next_e36c7a06._.js.map
│   │   │   │   ├── node_modules_next_navigation_34126abf.js
│   │   │   │   ├── node_modules_next_navigation_34126abf.js.map
│   │   │   │   ├── node_modules_node-fetch_src_utils_multipart-parser_431de5b8.js
│   │   │   │   ├── node_modules_node-fetch_src_utils_multipart-parser_431de5b8.js.map
│   │   │   │   ├── node_modules_node-fetch_src_utils_multipart-parser_a6debb5a.js
│   │   │   │   ├── node_modules_node-fetch_src_utils_multipart-parser_a6debb5a.js.map
│   │   │   │   ├── node_modules_protobufjs_24557efc._.js
│   │   │   │   ├── node_modules_protobufjs_24557efc._.js.map
│   │   │   │   ├── node_modules_protobufjs_5977de25._.js
│   │   │   │   ├── node_modules_protobufjs_5977de25._.js.map
│   │   │   │   ├── node_modules_recharts_es6_84aedca2._.js
│   │   │   │   ├── node_modules_recharts_es6_84aedca2._.js.map
│   │   │   │   ├── node_modules_recharts_es6_d6d7a17e._.js
│   │   │   │   ├── node_modules_recharts_es6_d6d7a17e._.js.map
│   │   │   │   ├── node_modules_thriftrw_d9865ef6._.js
│   │   │   │   ├── node_modules_thriftrw_d9865ef6._.js.map
│   │   │   │   ├── node_modules_tr46_742a71cf._.js
│   │   │   │   ├── node_modules_tr46_742a71cf._.js.map
│   │   │   │   ├── node_modules_xlsx_xlsx_mjs_959e58f3._.js
│   │   │   │   ├── node_modules_xlsx_xlsx_mjs_959e58f3._.js.map
│   │   │   │   ├── node_modules_yaml_dist_c70cf5b3._.js
│   │   │   │   ├── node_modules_yaml_dist_c70cf5b3._.js.map
│   │   │   │   ├── node_modules_zod_38be36f2._.js
│   │   │   │   ├── node_modules_zod_38be36f2._.js.map
│   │   │   │   ├── node_modules_zod_832854bf._.js
│   │   │   │   ├── node_modules_zod_832854bf._.js.map
│   │   │   │   ├── node_modules_zod_v3_0c6b243f._.js
│   │   │   │   ├── node_modules_zod_v3_0c6b243f._.js.map
│   │   │   │   ├── src_03ab0394._.js
│   │   │   │   ├── src_03ab0394._.js.map
│   │   │   │   ├── src_135e9501._.js
│   │   │   │   ├── src_135e9501._.js.map
│   │   │   │   ├── src_17077995._.js
│   │   │   │   ├── src_17077995._.js.map
│   │   │   │   ├── src_226260cc._.js
│   │   │   │   ├── src_226260cc._.js.map
│   │   │   │   ├── src_26edb94e._.js
│   │   │   │   ├── src_26edb94e._.js.map
│   │   │   │   ├── src_49d1ed74._.js
│   │   │   │   ├── src_49d1ed74._.js.map
│   │   │   │   ├── src_76ee5cf5._.js
│   │   │   │   ├── src_76ee5cf5._.js.map
│   │   │   │   ├── src_88d7c8aa._.js
│   │   │   │   ├── src_88d7c8aa._.js.map
│   │   │   │   ├── src_app_62f4ffe8._.js
│   │   │   │   ├── src_app_62f4ffe8._.js.map
│   │   │   │   ├── src_app_admin_components_reservations-tab_tsx_63150948._.js
│   │   │   │   ├── src_app_admin_components_reservations-tab_tsx_63150948._.js.map
│   │   │   │   ├── src_app_bffc5095._.js
│   │   │   │   ├── src_app_bffc5095._.js.map
│   │   │   │   ├── src_app_ca777385._.js
│   │   │   │   ├── src_app_ca777385._.js.map
│   │   │   │   ├── src_app_caa950af._.js
│   │   │   │   ├── src_app_caa950af._.js.map
│   │   │   │   ├── src_b7af6fa7._.js
│   │   │   │   ├── src_b7af6fa7._.js.map
│   │   │   │   ├── src_be102fa8._.js
│   │   │   │   ├── src_be102fa8._.js.map
│   │   │   │   ├── src_c7605114._.js
│   │   │   │   ├── src_c7605114._.js.map
│   │   │   │   ├── src_cab69afa._.js
│   │   │   │   ├── src_cab69afa._.js.map
│   │   │   │   ├── src_components_196ef470._.js
│   │   │   │   ├── src_components_196ef470._.js.map
│   │   │   │   ├── src_components_5cf2eb3d._.js
│   │   │   │   ├── src_components_5cf2eb3d._.js.map
│   │   │   │   ├── src_components_fa253cb2._.js
│   │   │   │   ├── src_components_fa253cb2._.js.map
│   │   │   │   ├── src_daa9fc52._.js
│   │   │   │   ├── src_daa9fc52._.js.map
│   │   │   │   ├── src_e48ee555._.js
│   │   │   │   ├── src_e48ee555._.js.map
│   │   │   │   ├── src_ee914ed7._.js
│   │   │   │   ├── src_ee914ed7._.js.map
│   │   │   │   ├── src_fac2f4e6._.js
│   │   │   │   ├── src_fac2f4e6._.js.map
│   │   │   │   ├── src_fcf1c53c._.js
│   │   │   │   ├── src_fcf1c53c._.js.map
│   │   │   │   ├── src_lib_b828d407._.js
│   │   │   │   ├── src_lib_b828d407._.js.map
│   │   │   │   ├── src_lib_constants_default-system-prompts_ts_a1084dd3._.js
│   │   │   │   └── src_lib_constants_default-system-prompts_ts_a1084dd3._.js.map
│   │   │   ├── [root-of-the-server]__04e2d3e5._.js
│   │   │   ├── [root-of-the-server]__04e2d3e5._.js.map
│   │   │   ├── [root-of-the-server]__b77afd01._.js
│   │   │   ├── [root-of-the-server]__b77afd01._.js.map
│   │   │   ├── [turbopack]_runtime.js
│   │   │   ├── [turbopack]_runtime.js.map
│   │   │   ├── 1116.js
│   │   │   ├── 1156.js
│   │   │   ├── 13.js
│   │   │   ├── 1318.js
│   │   │   ├── 1428.js
│   │   │   ├── 1435.js
│   │   │   ├── 1452.js
│   │   │   ├── 154.js
│   │   │   ├── 1680.js
│   │   │   ├── 1776.js
│   │   │   ├── 1803.js
│   │   │   ├── 1824.js
│   │   │   ├── 1852.js
│   │   │   ├── 2274.js
│   │   │   ├── 2278.js
│   │   │   ├── 2394.js
│   │   │   ├── 2508.js
│   │   │   ├── 2571.js
│   │   │   ├── 3026.js
│   │   │   ├── 3349.js
│   │   │   ├── 3709.js
│   │   │   ├── 3919.js
│   │   │   ├── 3934.js
│   │   │   ├── 4118.js
│   │   │   ├── 4148.js
│   │   │   ├── 4161.js
│   │   │   ├── 4351.js
│   │   │   ├── 4417.js
│   │   │   ├── 4429.js
│   │   │   ├── 4515.js
│   │   │   ├── 4563.js
│   │   │   ├── 4589.js
│   │   │   ├── 4821.js
│   │   │   ├── 490.js
│   │   │   ├── 4915.js
│   │   │   ├── 5166.js
│   │   │   ├── 5396.js
│   │   │   ├── 5549.js
│   │   │   ├── 5611.js
│   │   │   ├── 5615.js
│   │   │   ├── 5662.js
│   │   │   ├── 5711.js
│   │   │   ├── 5873.js
│   │   │   ├── 5966.js
│   │   │   ├── 6055.js
│   │   │   ├── 6125.js
│   │   │   ├── 6260.js
│   │   │   ├── 6301.js
│   │   │   ├── 634.js
│   │   │   ├── 6366.js
│   │   │   ├── 641.js
│   │   │   ├── 6780.js
│   │   │   ├── 6813.js
│   │   │   ├── 7755.js
│   │   │   ├── 8172.js
│   │   │   ├── 8253.js
│   │   │   ├── 8276.js
│   │   │   ├── 8626.js
│   │   │   ├── 8882.js
│   │   │   ├── 8931.js
│   │   │   ├── 8937.js
│   │   │   ├── 8942.js
│   │   │   ├── 8945.js
│   │   │   ├── 937.js
│   │   │   ├── 9386.js
│   │   │   ├── 9455.js
│   │   │   ├── 9535.js
│   │   │   ├── 9644.js
│   │   │   ├── 9662.js
│   │   │   ├── 9877.js
│   │   │   ├── node_modules_@opentelemetry_api_build_esm_7e8f41ca._.js
│   │   │   ├── node_modules_@opentelemetry_api_build_esm_7e8f41ca._.js.map
│   │   │   ├── node_modules_f74b9372._.js
│   │   │   ├── node_modules_f74b9372._.js.map
│   │   │   ├── node_modules_next_03be8da3._.js
│   │   │   ├── node_modules_next_03be8da3._.js.map
│   │   │   ├── node_modules_zod_v3_f358d7b3._.js
│   │   │   └── node_modules_zod_v3_f358d7b3._.js.map
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
│   │   ├── 5T4YoS7h2yStaqth-odDp
│   │   │   ├── _buildManifest.js
│   │   │   └── _ssgManifest.js
│   │   ├── chunks
│   │   │   ├── app
│   │   │   │   ├── _not-found
│   │   │   │   │   └── page-180c5c33fc4b7a40.js
│   │   │   │   ├── about
│   │   │   │   │   └── page-efce537501bbd72f.js
│   │   │   │   ├── admin
│   │   │   │   │   ├── contact-inquiries
│   │   │   │   │   │   └── page-25828d65e8963c7a.js
│   │   │   │   │   ├── prebuilt-builder
│   │   │   │   │   │   └── page-6d645ccf8b9d8066.js
│   │   │   │   │   └── page-bd0ddd46fcf4295e.js
│   │   │   │   ├── ai-build-advisor
│   │   │   │   │   └── page-8a9131b5e62a019b.js
│   │   │   │   ├── api
│   │   │   │   │   ├── ai
│   │   │   │   │   │   └── build-advisor
│   │   │   │   │   │       └── recommendations
│   │   │   │   │   │           └── route-25828d65e8963c7a.js
│   │   │   │   │   ├── builder
│   │   │   │   │   │   └── download
│   │   │   │   │   │       └── route-25828d65e8963c7a.js
│   │   │   │   │   ├── chat
│   │   │   │   │   │   └── route-25828d65e8963c7a.js
│   │   │   │   │   ├── contact
│   │   │   │   │   │   ├── gmail
│   │   │   │   │   │   │   ├── oauth
│   │   │   │   │   │   │   │   ├── callback
│   │   │   │   │   │   │   │   │   └── route-25828d65e8963c7a.js
│   │   │   │   │   │   │   │   └── start
│   │   │   │   │   │   │   │       └── route-25828d65e8963c7a.js
│   │   │   │   │   │   │   ├── renew
│   │   │   │   │   │   │   │   └── route-25828d65e8963c7a.js
│   │   │   │   │   │   │   └── webhook
│   │   │   │   │   │   │       └── route-25828d65e8963c7a.js
│   │   │   │   │   │   ├── messages
│   │   │   │   │   │   │   ├── retry
│   │   │   │   │   │   │   │   └── route-25828d65e8963c7a.js
│   │   │   │   │   │   │   └── route-25828d65e8963c7a.js
│   │   │   │   │   │   ├── read
│   │   │   │   │   │   │   └── route-25828d65e8963c7a.js
│   │   │   │   │   │   ├── status
│   │   │   │   │   │   │   └── route-25828d65e8963c7a.js
│   │   │   │   │   │   └── route-25828d65e8963c7a.js
│   │   │   │   │   └── qr
│   │   │   │   │       └── [token]
│   │   │   │   │           └── route-25828d65e8963c7a.js
│   │   │   │   ├── builder
│   │   │   │   │   └── page-64d32ec1e6e6bdf8.js
│   │   │   │   ├── contact
│   │   │   │   │   └── page-5fbd650f642bcaae.js
│   │   │   │   ├── faq
│   │   │   │   │   └── page-f883c205fc1de0ee.js
│   │   │   │   ├── forgot-password
│   │   │   │   │   └── page-63153a6490976081.js
│   │   │   │   ├── parts
│   │   │   │   │   ├── [productId]
│   │   │   │   │   │   └── page-f3f9981df72b2624.js
│   │   │   │   │   └── page-ef6e966f54bbc48b.js
│   │   │   │   ├── pre-builts
│   │   │   │   │   ├── [id]
│   │   │   │   │   │   └── page-dca50de03559bf26.js
│   │   │   │   │   └── page-b9b3f1e0709213fc.js
│   │   │   │   ├── profile
│   │   │   │   │   └── page-f149926b72cc8b52.js
│   │   │   │   ├── q
│   │   │   │   │   └── [token]
│   │   │   │   │       └── page-045a3baa987e7b22.js
│   │   │   │   ├── signin
│   │   │   │   │   └── page-c3935c25cea8dc85.js
│   │   │   │   ├── signup
│   │   │   │   │   └── page-083c4ade0a5773b7.js
│   │   │   │   ├── support-requests
│   │   │   │   │   └── page-25828d65e8963c7a.js
│   │   │   │   ├── system-access
│   │   │   │   │   ├── signup
│   │   │   │   │   │   └── page-b4188b1b6a6f22e3.js
│   │   │   │   │   └── page-434c5bfbf2cd6113.js
│   │   │   │   ├── team
│   │   │   │   │   └── page-026002d07673e36f.js
│   │   │   │   ├── layout-35d352b8e0ca41c6.js
│   │   │   │   ├── loading-d666bc69994e7df6.js
│   │   │   │   └── page-62c22080e2457930.js
│   │   │   ├── pages
│   │   │   │   ├── _app-e8b861c87f6f033c.js
│   │   │   │   └── _error-c8f84f7bd11d43d4.js
│   │   │   ├── _08f774aa._.js
│   │   │   ├── _08f774aa._.js.map
│   │   │   ├── _32cabe29._.js
│   │   │   ├── _32cabe29._.js.map
│   │   │   ├── _a0ff3932._.js
│   │   │   ├── _cdba956c._.js.map
│   │   │   ├── [next]_internal_font_google_inter_377e5bcb_module_css_bad6b30c._.single.css
│   │   │   ├── [next]_internal_font_google_inter_377e5bcb_module_css_bad6b30c._.single.css.map
│   │   │   ├── [next]_internal_font_google_space_grotesk_8678ec55_module_css_bad6b30c._.single.css
│   │   │   ├── [next]_internal_font_google_space_grotesk_8678ec55_module_css_bad6b30c._.single.css.map
│   │   │   ├── [root-of-the-server]__f747fe81._.css
│   │   │   ├── [root-of-the-server]__f747fe81._.css.map
│   │   │   ├── [turbopack]_browser_dev_hmr-client_hmr-client_ts_285433b7._.js
│   │   │   ├── [turbopack]_browser_dev_hmr-client_hmr-client_ts_57d40746._.js
│   │   │   ├── [turbopack]_browser_dev_hmr-client_hmr-client_ts_57d40746._.js.map
│   │   │   ├── [turbopack]_browser_dev_hmr-client_hmr-client_ts_c8c997ce._.js
│   │   │   ├── [turbopack]_browser_dev_hmr-client_hmr-client_ts_c8c997ce._.js.map
│   │   │   ├── 1076-532d472b27128792.js
│   │   │   ├── 1255-de0c1abd22c7cccd.js
│   │   │   ├── 1319.efda2285e7628464.js
│   │   │   ├── 1435.a77e962cc3d1c05d.js
│   │   │   ├── 1436-7115b95ffb64399b.js
│   │   │   ├── 1554-11a11a9b1d2ebec2.js
│   │   │   ├── 1646.a93085a0445ba909.js
│   │   │   ├── 1649.8a99b2b9a1c8b692.js
│   │   │   ├── 1668.cff0f87bf54449e8.js
│   │   │   ├── 1678-14442fdf523c514b.js
│   │   │   ├── 1855-c7bf380b1f101ab7.js
│   │   │   ├── 2046.8f0c7ba290ea638f.js
│   │   │   ├── 21-210bd0486708c4ba.js
│   │   │   ├── 2170a4aa.23e3b5dc934453fe.js
│   │   │   ├── 2264-b97e69a0251f9a15.js
│   │   │   ├── 2310-dc4aaab6cba3b084.js
│   │   │   ├── 2515.254c8020ca5352da.js
│   │   │   ├── 2619-b8db57ac19da49ac.js
│   │   │   ├── 2769.761d3c2b27e34704.js
│   │   │   ├── 2913.c8c9648da62d9eb6.js
│   │   │   ├── 305-8a69d2eeb88a6711.js
│   │   │   ├── 3191-b86615278a498783.js
│   │   │   ├── 3218-f1efff9a6025739a.js
│   │   │   ├── 3387.6f950bfc6e039c14.js
│   │   │   ├── 3430.766b8b9edd1c1c3b.js
│   │   │   ├── 3498-ec9f52ca9c7d7833.js
│   │   │   ├── 3792.efdb15b3847a4f31.js
│   │   │   ├── 3813-9820628eebdb54c7.js
│   │   │   ├── 4003-f5e67193973a5297.js
│   │   │   ├── 4095-44222ec53810d7e5.js
│   │   │   ├── 4381.c55a71b054d07235.js
│   │   │   ├── 4390-dc145bd7d77d1ce7.js
│   │   │   ├── 4432-94faf78e2ed239ad.js
│   │   │   ├── 4679-ceaca0a5317a5c6a.js
│   │   │   ├── 4846.4f1bd021b6dd2ada.js
│   │   │   ├── 4bd1b696-182b6b13bdad92e3.js
│   │   │   ├── 5114.b73ba3c75bebd9b9.js
│   │   │   ├── 5139.e4ff9cc3669129ed.js
│   │   │   ├── 5239.5572dbde2a9efa1d.js
│   │   │   ├── 5287-74e1549ca7ccb56e.js
│   │   │   ├── 5417-bc5ab3b13a42e091.js
│   │   │   ├── 5530-a1cc7a73c2fbbff9.js
│   │   │   ├── 5770.cd3cd9eb76b8190a.js
│   │   │   ├── 5788.a1b9f2864d7867fb.js
│   │   │   ├── 5813-9994611299021ad1.js
│   │   │   ├── 5859-f5a4d0b01fcb6912.js
│   │   │   ├── 5861-282a02336cd61782.js
│   │   │   ├── 5889-77a82109fffb7f6f.js
│   │   │   ├── 5937-a37d798cf08beeb6.js
│   │   │   ├── 6029.0d8fd89ec442f473.js
│   │   │   ├── 6047-858f2639503235dd.js
│   │   │   ├── 6120-8ff906976694316e.js
│   │   │   ├── 6782-0ab2f58bd1abab62.js
│   │   │   ├── 6937-10d55df312eb0cc7.js
│   │   │   ├── 6942-213792197da03d19.js
│   │   │   ├── 7339.6d278cb99cf3bfea.js
│   │   │   ├── 7355-53dae2d041fa9556.js
│   │   │   ├── 7367-a8e898650823f46f.js
│   │   │   ├── 7381.ab6a171e07b92690.js
│   │   │   ├── 7614-8f8cdf6ebb54f11e.js
│   │   │   ├── 767-2fadf5d7843428a7.js
│   │   │   ├── 7755-1e12341cf30efeb7.js
│   │   │   ├── 7785-c6ac0c5807d1f9b0.js
│   │   │   ├── 8217-9a2e217929b946cb.js
│   │   │   ├── 8264.6a651ea41bcc832f.js
│   │   │   ├── 8473-0fd5b0764e5c44b1.js
│   │   │   ├── 856-a353dd9eea81959d.js
│   │   │   ├── 8641-232dcad727820dd3.js
│   │   │   ├── 8654-b7c41fa00dd5f266.js
│   │   │   ├── 8668-71a37d141c4cf3b7.js
│   │   │   ├── 87-aa1590c177e8dc96.js
│   │   │   ├── 8734-9baea29d30cdf5d8.js
│   │   │   ├── 8968-282a5eab4ed0d08d.js
│   │   │   ├── 9054-67a4e839549e3a9b.js
│   │   │   ├── 9087.4cd86136eebfe486.js
│   │   │   ├── 9182-abbb624b0cf4b39c.js
│   │   │   ├── 9303.84d7050749a55b0f.js
│   │   │   ├── 9372-3bde15c4c14523fc.js
│   │   │   ├── 94568_@firebase_auth_dist_esm2017_39867e80._.js
│   │   │   ├── 94568_@firebase_auth_dist_esm2017_39867e80._.js.map
│   │   │   ├── 9672-0d43332c58182294.js
│   │   │   ├── 9689-1c662df93c61bf27.js
│   │   │   ├── 9706.6cc7b2a8a91539a0.js
│   │   │   ├── 9762-560b70681ce8d886.js
│   │   │   ├── 996-41afd3a0870ed5c3.js
│   │   │   ├── ba12c10f-8063feea5a12ad92.js
│   │   │   ├── bc9e92e6-97565be9ace941ed.js
│   │   │   ├── c16f53c3-f2ef374b4e911d59.js
│   │   │   ├── ceb9e9aa-4d0f2733b74eb147.js
│   │   │   ├── framework-5c6aa4eeab4c6f34.js
│   │   │   ├── main-8d526c73b911ce44.js
│   │   │   ├── main-app-4dbf0c597e8ab152.js
│   │   │   ├── node_modules_@firebase_firestore_dist_index_esm2017_d9c36ae7.js
│   │   │   ├── node_modules_@firebase_firestore_dist_index_esm2017_d9c36ae7.js.map
│   │   │   ├── node_modules_@firebase_storage_dist_index_esm2017_46d20e3b.js
│   │   │   ├── node_modules_@firebase_storage_dist_index_esm2017_46d20e3b.js.map
│   │   │   ├── node_modules_@floating-ui_react_dist_22386cb2._.js
│   │   │   ├── node_modules_@floating-ui_react_dist_22386cb2._.js.map
│   │   │   ├── node_modules_@mantine_core_esm_25a343e9._.js
│   │   │   ├── node_modules_@mantine_core_esm_25a343e9._.js.map
│   │   │   ├── node_modules_@mantine_core_esm_28acc42a._.js
│   │   │   ├── node_modules_@mantine_core_esm_28acc42a._.js.map
│   │   │   ├── node_modules_@mantine_core_esm_48abab63._.js
│   │   │   ├── node_modules_@mantine_core_esm_48abab63._.js.map
│   │   │   ├── node_modules_@mantine_core_esm_7cec9394._.js
│   │   │   ├── node_modules_@mantine_core_esm_7cec9394._.js.map
│   │   │   ├── node_modules_@mantine_core_esm_7e82ab37._.js
│   │   │   ├── node_modules_@mantine_core_esm_7e82ab37._.js.map
│   │   │   ├── node_modules_@mantine_core_styles_css_bad6b30c._.single.css
│   │   │   ├── node_modules_@mantine_core_styles_css_bad6b30c._.single.css.map
│   │   │   ├── node_modules_@swc_helpers_cjs_b3dc30d6._.js
│   │   │   ├── node_modules_@swc_helpers_cjs_b3dc30d6._.js.map
│   │   │   ├── node_modules_42209f89._.js
│   │   │   ├── node_modules_42209f89._.js.map
│   │   │   ├── node_modules_46efe371._.js
│   │   │   ├── node_modules_46efe371._.js.map
│   │   │   ├── node_modules_5a121b96._.js
│   │   │   ├── node_modules_5a121b96._.js.map
│   │   │   ├── node_modules_5da75128._.js
│   │   │   ├── node_modules_5da75128._.js.map
│   │   │   ├── node_modules_794854e6._.js
│   │   │   ├── node_modules_794854e6._.js.map
│   │   │   ├── node_modules_7b2bdff9._.js
│   │   │   ├── node_modules_7b2bdff9._.js.map
│   │   │   ├── node_modules_8c689470._.js
│   │   │   ├── node_modules_8c689470._.js.map
│   │   │   ├── node_modules_97fef675._.js
│   │   │   ├── node_modules_97fef675._.js.map
│   │   │   ├── node_modules_9fd7fd78._.js
│   │   │   ├── node_modules_9fd7fd78._.js.map
│   │   │   ├── node_modules_aa1694c2._.js
│   │   │   ├── node_modules_aa1694c2._.js.map
│   │   │   ├── node_modules_ac2eac59._.js
│   │   │   ├── node_modules_ac2eac59._.js.map
│   │   │   ├── node_modules_ai_dist_index_mjs_a7281a1b._.js
│   │   │   ├── node_modules_ai_dist_index_mjs_a7281a1b._.js.map
│   │   │   ├── node_modules_b770b0d6._.js
│   │   │   ├── node_modules_b770b0d6._.js.map
│   │   │   ├── node_modules_c1c22457._.js
│   │   │   ├── node_modules_c1c22457._.js.map
│   │   │   ├── node_modules_c3ef5513._.js
│   │   │   ├── node_modules_c3ef5513._.js.map
│   │   │   ├── node_modules_d3b11640._.js
│   │   │   ├── node_modules_d3b11640._.js.map
│   │   │   ├── node_modules_eac0eddb._.js
│   │   │   ├── node_modules_eac0eddb._.js.map
│   │   │   ├── node_modules_fd964b14._.js
│   │   │   ├── node_modules_fd964b14._.js.map
│   │   │   ├── node_modules_framer-motion_dist_es_011a2bde._.js
│   │   │   ├── node_modules_framer-motion_dist_es_011a2bde._.js.map
│   │   │   ├── node_modules_lodash_0ce7be08._.js
│   │   │   ├── node_modules_lodash_0ce7be08._.js.map
│   │   │   ├── node_modules_lucide-react_dist_esm_icons_00a313b0._.js
│   │   │   ├── node_modules_lucide-react_dist_esm_icons_00a313b0._.js.map
│   │   │   ├── node_modules_lucide-react_dist_esm_icons_62222077._.js
│   │   │   ├── node_modules_lucide-react_dist_esm_icons_62222077._.js.map
│   │   │   ├── node_modules_lucide-react_dist_esm_icons_99ac1d08._.js
│   │   │   ├── node_modules_lucide-react_dist_esm_icons_99ac1d08._.js.map
│   │   │   ├── node_modules_lucide-react_dist_esm_icons_ab792436._.js
│   │   │   ├── node_modules_lucide-react_dist_esm_icons_ab792436._.js.map
│   │   │   ├── node_modules_lucide-react_dist_esm_icons_type_fbf5a37d.js
│   │   │   ├── node_modules_lucide-react_dist_esm_icons_type_fbf5a37d.js.map
│   │   │   ├── node_modules_micromark-core-commonmark_dev_lib_fc41dd51._.js
│   │   │   ├── node_modules_micromark-core-commonmark_dev_lib_fc41dd51._.js.map
│   │   │   ├── node_modules_next_23f5b8d1._.js
│   │   │   ├── node_modules_next_23f5b8d1._.js.map
│   │   │   ├── node_modules_next_dist_8db7fb1f._.js
│   │   │   ├── node_modules_next_dist_8db7fb1f._.js.map
│   │   │   ├── node_modules_next_dist_b0daae9a._.js
│   │   │   ├── node_modules_next_dist_b0daae9a._.js.map
│   │   │   ├── node_modules_next_dist_build_polyfills_polyfill-nomodule.js
│   │   │   ├── node_modules_next_dist_client_cf1d9188._.js
│   │   │   ├── node_modules_next_dist_client_cf1d9188._.js.map
│   │   │   ├── node_modules_next_dist_client_components_builtin_global-error_ac29ae45.js
│   │   │   ├── node_modules_next_dist_compiled_5150ccfd._.js
│   │   │   ├── node_modules_next_dist_compiled_5150ccfd._.js.map
│   │   │   ├── node_modules_next_dist_compiled_next-devtools_index_a9cb0712.js
│   │   │   ├── node_modules_next_dist_compiled_next-devtools_index_a9cb0712.js.map
│   │   │   ├── node_modules_next_dist_compiled_react-dom_1e674e59._.js
│   │   │   ├── node_modules_next_dist_compiled_react-dom_1e674e59._.js.map
│   │   │   ├── node_modules_next_f06cca34._.js
│   │   │   ├── node_modules_next_f06cca34._.js.map
│   │   │   ├── node_modules_qrcode_lib_browser_c873a604.js
│   │   │   ├── node_modules_recharts_es6_30a93e51._.js
│   │   │   ├── node_modules_recharts_es6_30a93e51._.js.map
│   │   │   ├── node_modules_recharts_es6_fc2da180._.js
│   │   │   ├── node_modules_recharts_es6_fc2da180._.js.map
│   │   │   ├── node_modules_xlsx_xlsx_mjs_fef98e92._.js
│   │   │   ├── node_modules_xlsx_xlsx_mjs_fef98e92._.js.map
│   │   │   ├── node_modules_zod_acdecf88._.js
│   │   │   ├── node_modules_zod_acdecf88._.js.map
│   │   │   ├── node_modules_zod_v3_511383c7._.js
│   │   │   ├── node_modules_zod_v3_511383c7._.js.map
│   │   │   ├── polyfills-42372ed130431b0a.js
│   │   │   ├── src_0045f76e._.js
│   │   │   ├── src_0045f76e._.js.map
│   │   │   ├── src_0ab44118._.js
│   │   │   ├── src_0ab44118._.js.map
│   │   │   ├── src_1a6a1d83._.js
│   │   │   ├── src_1a6a1d83._.js.map
│   │   │   ├── src_4dd72d59._.js
│   │   │   ├── src_4dd72d59._.js.map
│   │   │   ├── src_4e5f0ee7._.js
│   │   │   ├── src_4e5f0ee7._.js.map
│   │   │   ├── src_4f3dd29f._.js
│   │   │   ├── src_4f3dd29f._.js.map
│   │   │   ├── src_5156a713._.js
│   │   │   ├── src_5156a713._.js.map
│   │   │   ├── src_51f701d1._.js
│   │   │   ├── src_51f701d1._.js.map
│   │   │   ├── src_58c1c0f8._.js
│   │   │   ├── src_58c1c0f8._.js.map
│   │   │   ├── src_66e2c10f._.js
│   │   │   ├── src_66e2c10f._.js.map
│   │   │   ├── src_67ba552b._.js
│   │   │   ├── src_67ba552b._.js.map
│   │   │   ├── src_760c1f06._.js
│   │   │   ├── src_760c1f06._.js.map
│   │   │   ├── src_84e01acc._.js
│   │   │   ├── src_84e01acc._.js.map
│   │   │   ├── src_9647d412._.js
│   │   │   ├── src_9647d412._.js.map
│   │   │   ├── src_96e7b1f5._.js
│   │   │   ├── src_96e7b1f5._.js.map
│   │   │   ├── src_a04f2fc1._.js
│   │   │   ├── src_a04f2fc1._.js.map
│   │   │   ├── src_af405e0e._.js
│   │   │   ├── src_af405e0e._.js.map
│   │   │   ├── src_app_312a6890._.js
│   │   │   ├── src_app_312a6890._.js.map
│   │   │   ├── src_app_admin_components_archive-tab_tsx_e160f769._.js
│   │   │   ├── src_app_admin_components_prebuilt-tab_tsx_e160f769._.js
│   │   │   ├── src_app_admin_components_reservations-tab_tsx_727dd54b._.js
│   │   │   ├── src_app_admin_components_reservations-tab_tsx_727dd54b._.js.map
│   │   │   ├── src_app_admin_components_reservations-tab_tsx_e160f769._.js
│   │   │   ├── src_app_admin_components_sales-tab_tsx_e160f769._.js
│   │   │   ├── src_app_admin_page_tsx_ac29ae45._.js
│   │   │   ├── src_app_favicon_ico_mjs_243aa161._.js
│   │   │   ├── src_app_globals_css_bad6b30c._.single.css
│   │   │   ├── src_app_globals_css_bad6b30c._.single.css.map
│   │   │   ├── src_app_layout_tsx_0a548d63._.js
│   │   │   ├── src_app_loading_tsx_ac29ae45._.js
│   │   │   ├── src_app_parts_[productId]_page_tsx_ac29ae45._.js
│   │   │   ├── src_app_parts_page_tsx_ac29ae45._.js
│   │   │   ├── src_app_pre-builts_[id]_page_tsx_ac29ae45._.js
│   │   │   ├── src_app_pre-builts_page_tsx_ac29ae45._.js
│   │   │   ├── src_app_profile_components_audit-logs-section_tsx_e160f769._.js
│   │   │   ├── src_app_q_[token]_page_tsx_ac29ae45._.js
│   │   │   ├── src_app_signin_page_tsx_ac29ae45._.js
│   │   │   ├── src_app_system-access_page_tsx_ac29ae45._.js
│   │   │   ├── src_c5869fec._.js
│   │   │   ├── src_c5869fec._.js.map
│   │   │   ├── src_components_258ca094._.js
│   │   │   ├── src_components_258ca094._.js.map
│   │   │   ├── src_components_47e799de._.js
│   │   │   ├── src_components_47e799de._.js.map
│   │   │   ├── src_components_52b8e475._.js
│   │   │   ├── src_components_52b8e475._.js.map
│   │   │   ├── src_components_about-management_tsx_e160f769._.js
│   │   │   ├── src_components_add-part-editor_tsx_c873a604._.js
│   │   │   ├── src_components_ai-model-settings_tsx_e160f769._.js
│   │   │   ├── src_components_ai-system-prompts-settings_tsx_e160f769._.js
│   │   │   ├── src_components_header_module_css_bad6b30c._.single.css
│   │   │   ├── src_components_header_module_css_bad6b30c._.single.css.map
│   │   │   ├── src_components_notification-center_tsx_c79a6827._.js
│   │   │   ├── src_components_super-admin-settings_tsx_e160f769._.js
│   │   │   ├── src_components_user-notifications_tsx_c79a6827._.js
│   │   │   ├── src_context_advisor-jobs-scope_tsx_c79a6827._.js
│   │   │   ├── src_f81caa8e._.js
│   │   │   ├── src_f81caa8e._.js.map
│   │   │   ├── turbopack-_cdba956c._.js
│   │   │   └── webpack-719e1c0cf83a8e47.js
│   │   ├── css
│   │   │   ├── 51725c77dcf20c98.css
│   │   │   ├── 560f4892b710496d.css
│   │   │   ├── af27b7a09844e271.css
│   │   │   └── e35dfb38818993df.css
│   │   ├── development
│   │   │   ├── _buildManifest.js
│   │   │   ├── _clientMiddlewareManifest.json
│   │   │   └── _ssgManifest.js
│   │   └── media
│   │       ├── 0c89a48fa5027cee-s.p.4564287c.woff2
│   │       ├── 19cfc7226ec3afaa-s.woff2
│   │       ├── 1bffadaabf893a1e-s.7cd81963.woff2
│   │       ├── 21350d82a1f187e9-s.woff2
│   │       ├── 28868e710e86be81-s.c30238d4.woff2
│   │       ├── 2bbe8d2671613f1f-s.76dcb0b2.woff2
│   │       ├── 2c55a0e60120577a-s.2a48534a.woff2
│   │       ├── 32687112bd2dd8db-s.cfdd66c2.woff2
│   │       ├── 36966cca54120369-s.p.woff2
│   │       ├── 5476f68d60460930-s.c995e352.woff2
│   │       ├── 83afe278b6a6bb3c-s.p.3a6ba036.woff2
│   │       ├── 8e9860b6e62d6359-s.woff2
│   │       ├── 9c72aa0f40e4eef8-s.18a48cbc.woff2
│   │       ├── ad66f9afd8947f86-s.7a40eb73.woff2
│   │       ├── apple-icon.7fe38eb7.png
│   │       ├── b7387a63dd068245-s.woff2
│   │       ├── ba9851c3c22cd980-s.woff2
│   │       ├── c5fe6dc8356a8c31-s.woff2
│   │       ├── df0a9ae256c0569c-s.woff2
│   │       ├── e1aab0933260df4d-s.woff2
│   │       ├── e4af272ccee01ff0-s.p.woff2
│   │       ├── favicon.90ff4d21.ico
│   │       ├── feature-1.d184a8af.webp
│   │       ├── feature-2.efc2a3c3.webp
│   │       ├── feature-3.a6afbd5f.webp
│   │       ├── hero-custom.294d3161.webp
│   │       └── icon.6c4fd102.svg
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
│   │   │   │   ├── ai
│   │   │   │   │   └── build-advisor
│   │   │   │   │       └── recommendations
│   │   │   │   │           └── route.ts
│   │   │   │   ├── builder
│   │   │   │   │   └── download
│   │   │   │   │       └── route.ts
│   │   │   │   ├── chat
│   │   │   │   │   └── route.ts
│   │   │   │   ├── contact
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
│   │   │   │   └── qr
│   │   │   │       └── [token]
│   │   │   │           └── route.ts
│   │   │   ├── builder
│   │   │   │   └── page.ts
│   │   │   ├── contact
│   │   │   │   └── page.ts
│   │   │   ├── faq
│   │   │   │   └── page.ts
│   │   │   ├── forgot-password
│   │   │   │   └── page.ts
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
│   │   │   ├── team
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
│   ├── fallback-build-manifest.json
│   ├── images-manifest.json
│   ├── next-minimal-server.js.nft.json
│   ├── next-server.js.nft.json
│   ├── package.json
│   ├── postcss.js
│   ├── postcss.js.map
│   ├── prerender-manifest.json
│   ├── react-loadable-manifest.json
│   ├── required-server-files.json
│   ├── routes-manifest.json
│   └── trace
├── .tmp
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
│   ├── build_advisor_performance.md
│   ├── chatbot_build_context.md
│   ├── component_description_formatting.md
│   ├── customer_build_pdf.md
│   ├── customer_ui_spacing.md
│   ├── google_auth_feedback.md
│   ├── import_catalog_images.md
│   ├── ingest_knowledge.md
│   ├── inventory_hierarchy_migration.md
│   ├── inventory_performance.md
│   ├── landing_static_assets.md
│   ├── password_reset.md
│   ├── prebuilt_product_availability.md
│   ├── public_parts_performance.md
│   ├── qr_inventory.md
│   ├── sales_analytics_export.md
│   └── support_requests.md
├── docs
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
│   ├── api-and-integrations.md
│   ├── architecture.md
│   ├── backend.json
│   ├── blueprint.md
│   ├── build_advisor_performance_plan.md
│   ├── build_advisor_web_search_plan.md
│   ├── contact-inquiries-setup.md
│   ├── database_scalability_plan.md
│   ├── firebase-and-data.md
│   ├── implementation-plan-and-results.md
│   ├── inventory_performance_audit.md
│   ├── landing_performance_audit.md
│   ├── pages.md
│   ├── project_structure.md
│   ├── qr_inventory_feature_plan.md
│   ├── qr_system_improvement_plan.md
│   └── ui-pages-and-overlays-audit.md
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
│   ├── verify_product_identities.ts
│   ├── verify_public_firestore_reads.ts
│   └── verify_qr_feature.mjs
├── output
│   └── pdf
│       └── buildbotai-ui-pages-and-overlays-audit.pdf
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
│   ├── favicon.ico
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
│   │   │   └── build-advisor-schemas.ts
│   │   ├── dev.ts
│   │   └── genkit.ts
│   ├── app
│   │   ├── about
│   │   │   └── page.tsx
│   │   ├── admin
│   │   │   ├── components
│   │   │   │   ├── admin-tab-header.tsx
│   │   │   │   ├── archive-tab.tsx
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
│   │   │   │   ├── use-orders.ts
│   │   │   │   ├── use-prebuilt-builder-import.ts
│   │   │   │   └── use-sales-actions.ts
│   │   │   ├── prebuilt-builder
│   │   │   │   └── page.tsx
│   │   │   ├── page.tsx
│   │   │   └── reservation-actions.ts
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
│   │   │   ├── admin
│   │   │   │   ├── qr-health
│   │   │   │   │   └── route.ts
│   │   │   │   └── qr-status
│   │   │   │       └── [token]
│   │   │   │           └── route.ts
│   │   │   ├── ai
│   │   │   │   └── build-advisor
│   │   │   │       ├── critique
│   │   │   │       └── recommendations
│   │   │   │           └── route.ts
│   │   │   ├── builder
│   │   │   │   └── download
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
│   │   │   └── qr
│   │   │       └── [token]
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
│   │   │   └── page.tsx
│   │   ├── contact
│   │   │   └── page.tsx
│   │   ├── faq
│   │   │   └── page.tsx
│   │   ├── forgot-password
│   │   │   └── page.tsx
│   │   ├── parts
│   │   │   ├── [productId]
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── pre-builts
│   │   │   ├── [id]
│   │   │   │   ├── components
│   │   │   │   │   ├── prebuilt-action-card.tsx
│   │   │   │   │   ├── prebuilt-ai-review.tsx
│   │   │   │   │   ├── prebuilt-component-carousel.tsx
│   │   │   │   │   ├── prebuilt-image-view.tsx
│   │   │   │   │   └── prebuilt-parts-accordion.tsx
│   │   │   │   ├── hooks
│   │   │   │   │   └── use-prebuilt-details.ts
│   │   │   │   ├── legacy-prebuilt-product.tsx
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── profile
│   │   │   ├── components
│   │   │   │   ├── account-details.tsx
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
│   │   └── landing
│   │       ├── feature-1.webp
│   │       ├── feature-2.webp
│   │       ├── feature-3.webp
│   │       └── hero-custom.webp
│   ├── components
│   │   ├── auth
│   │   │   ├── route-guard.tsx
│   │   │   ├── session-timeout.tsx
│   │   │   ├── sign-out-loader.tsx
│   │   │   └── terms-of-agreement-modal.tsx
│   │   ├── bottleneck
│   │   │   ├── bottleneck-prototype-controller.tsx
│   │   │   ├── bottleneck-status-card.tsx
│   │   │   ├── dual-sidebar-analyzer.tsx
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
│   │   ├── landing
│   │   │   ├── accessories-section.tsx
│   │   │   ├── cta-section.tsx
│   │   │   ├── deferred-prebuilt-showcase.tsx
│   │   │   ├── feature-showcase.tsx
│   │   │   ├── features-section.tsx
│   │   │   ├── hero-section.tsx
│   │   │   ├── landing-page.tsx
│   │   │   ├── prebuilt-showcase.tsx
│   │   │   ├── section-header.tsx
│   │   │   ├── team-section.tsx
│   │   │   └── unified-background.tsx
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
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── canvas-text.tsx
│   │   │   ├── card.tsx
│   │   │   ├── carousel.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── compact-info.tsx
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
│   │   ├── about-management.tsx
│   │   ├── add-part-dialog.tsx
│   │   ├── add-part-editor.tsx
│   │   ├── add-prebuilt-dialog.tsx
│   │   ├── add-stock-dialog.tsx
│   │   ├── admin-product-focus.tsx
│   │   ├── admin-qr-lifecycle-modal.tsx
│   │   ├── advisor-job-toast.tsx
│   │   ├── ai-build-critique.tsx
│   │   ├── ai-model-settings.tsx
│   │   ├── ai-progress-modal.tsx
│   │   ├── ai-system-prompts-settings.tsx
│   │   ├── app-layout.tsx
│   │   ├── build-recommendation-notes.tsx
│   │   ├── build-summary.tsx
│   │   ├── builder-floating-analytics.tsx
│   │   ├── builder-floating-chat.tsx
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
│   │   ├── inventory-table.tsx
│   │   ├── inventory-toolbar.tsx
│   │   ├── logo.tsx
│   │   ├── maintenance-screen.tsx
│   │   ├── neutral-page-loader.tsx
│   │   ├── notification-center.tsx
│   │   ├── order-details-modal.tsx
│   │   ├── pagination-controls.tsx
│   │   ├── part-builder-compatibility-modal.tsx
│   │   ├── part-card.tsx
│   │   ├── part-details-content.tsx
│   │   ├── part-details-dialog.tsx
│   │   ├── prebuilt-builder-add-dialog.tsx
│   │   ├── prebuilt-card-specs.tsx
│   │   ├── prebuilt-system-card.tsx
│   │   ├── prebuilts-table.tsx
│   │   ├── product-identification.tsx
│   │   ├── product-identity-link.tsx
│   │   ├── product-qr.tsx
│   │   ├── public-part-page.tsx
│   │   ├── public-parts-catalog.tsx
│   │   ├── public-product-page.tsx
│   │   ├── qr-health-dialog.tsx
│   │   ├── qr-scanner-dialog.tsx
│   │   ├── sales-analytics.tsx
│   │   ├── smart-budget.tsx
│   │   ├── stock-editor.tsx
│   │   ├── super-admin-settings.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── user-notifications.tsx
│   │   └── your-build.tsx
│   ├── context
│   │   ├── advisor-jobs-context.tsx
│   │   ├── advisor-jobs-scope.tsx
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
│   │   ├── use-admin-session-guard.ts
│   │   ├── use-build-actions.ts
│   │   ├── use-build-pdf-download.ts
│   │   ├── use-idle-timeout.ts
│   │   ├── use-inventory-image-count.ts
│   │   ├── use-mobile.tsx
│   │   ├── use-near-viewport.ts
│   │   ├── use-part-builder-compatibility.ts
│   │   ├── use-part-form.ts
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
│       ├── chat-message-parts.test.ts
│       ├── chat-message-parts.ts
│       ├── chat-part-specifications.ts
│       ├── chat-recommendation-facts.test.ts
│       ├── chat-recommendation-facts.ts
│       ├── chat-recommendations.test.ts
│       ├── chat-recommendations.ts
│       ├── chat-stream-fallback.test.ts
│       ├── chat-stream-fallback.ts
│       ├── compatibility.ts
│       ├── contact-config.ts
│       ├── contact-schemas.ts
│       ├── contact-types.ts
│       ├── export-excel.ts
│       ├── fps-estimator.ts
│       ├── inventory-fetcher.ts
│       ├── inventory-image-sizes.ts
│       ├── inventory-paths.test.ts
│       ├── inventory-paths.ts
│       ├── knowledge-retriever.ts
│       ├── normalize-product-description.ts
│       ├── parse-peso-budget.ts
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
│       ├── save-catalog-product.ts
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
│   ├── auth-role-navigation.spec.ts
│   ├── chat-part-specifications.spec.ts
│   ├── landing-performance.spec.ts
│   ├── qr-inventory.integration.ts
│   ├── qr-inventory.spec.ts
│   ├── qr-phase2.test.ts
│   └── sales-export.spec.ts
├── tmp
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
