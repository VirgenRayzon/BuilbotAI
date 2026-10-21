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
│   │   │   └── 9877.js
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
│   │   │   ├── polyfills-42372ed130431b0a.js
│   │   │   └── webpack-719e1c0cf83a8e47.js
│   │   ├── css
│   │   │   ├── 51725c77dcf20c98.css
│   │   │   ├── 560f4892b710496d.css
│   │   │   ├── af27b7a09844e271.css
│   │   │   └── e35dfb38818993df.css
│   │   └── media
│   │       ├── 19cfc7226ec3afaa-s.woff2
│   │       ├── 21350d82a1f187e9-s.woff2
│   │       ├── 36966cca54120369-s.p.woff2
│   │       ├── 8e9860b6e62d6359-s.woff2
│   │       ├── b7387a63dd068245-s.woff2
│   │       ├── ba9851c3c22cd980-s.woff2
│   │       ├── c5fe6dc8356a8c31-s.woff2
│   │       ├── df0a9ae256c0569c-s.woff2
│   │       ├── e1aab0933260df4d-s.woff2
│   │       ├── e4af272ccee01ff0-s.p.woff2
│   │       ├── feature-1.d184a8af.webp
│   │       ├── feature-2.efc2a3c3.webp
│   │       ├── feature-3.a6afbd5f.webp
│   │       └── hero-custom.294d3161.webp
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
│   │   ├── use-part-form.ts
│   │   ├── use-persistent-state.ts
│   │   ├── use-product-save-operation.ts
│   │   ├── use-public-parts-compatibility.ts
│   │   ├── use-public-product-actions.ts
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
│       │   └── public-products.ts
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
