# Changelog

All notable changes to this project will be documented in this file.

## [2026-05-23]

### Features
- Implement test builder 1 (FAB/Pinning) and test builder 2 (standalone/browse) A/B layout pages with super admin guard and automated cleanup script ([35a78d2](https://github.com/VirgenRayzon/BuilbotAI/commit/35a78d2))
- **security**: Implement secure server-side RBAC and key validation ([ce5d550](https://github.com/VirgenRayzon/BuilbotAI/commit/ce5d550))

## [2026-05-18]

### Features
- Implement user build favorites, top dashboard aesthetics, grid layouts, and layout column alignment ([4206164](https://github.com/VirgenRayzon/BuilbotAI/commit/4206164))

## [2026-05-17]

### Bug Fixes
- Resolve Z-index conflict and responsive overlap between Chat and Analytics FABs ([fc6e179](https://github.com/VirgenRayzon/BuilbotAI/commit/fc6e179))

## [2026-05-16]

### Features
- Implement destructive part removal and restore category highlighting in builder ([91c250f](https://github.com/VirgenRayzon/BuilbotAI/commit/91c250f))
- Update default reservations pagination to 10 items ([dc527f5](https://github.com/VirgenRayzon/BuilbotAI/commit/dc527f5))
- Implement AI generation cancellation with interactive SparkleButton states ([7a529f5](https://github.com/VirgenRayzon/BuilbotAI/commit/7a529f5))
- Enforce Case -> Motherboard -> CPU assembly sequence globally ([d44d7c5](https://github.com/VirgenRayzon/BuilbotAI/commit/d44d7c5))
- Implement global prebuilt specs expansion and fix loading states ([ad3e416](https://github.com/VirgenRayzon/BuilbotAI/commit/ad3e416))
- Implement AI process cancellation and optimize knowledge retrieval ([5b42dd5](https://github.com/VirgenRayzon/BuilbotAI/commit/5b42dd5))

### Bug Fixes
- Remove analyze build button from manager sidebar ([d39744f](https://github.com/VirgenRayzon/BuilbotAI/commit/d39744f))
- Prebuilt builder interactivity, submission logic, and premium ai placeholders ([90af829](https://github.com/VirgenRayzon/BuilbotAI/commit/90af829))
- Enforce case and motherboard selection before other components in prebuilt builder ([b33faa7](https://github.com/VirgenRayzon/BuilbotAI/commit/b33faa7))
- Reorder prebuilt builder components to prioritize Case first ([099dca4](https://github.com/VirgenRayzon/BuilbotAI/commit/099dca4))

### Refactoring
- Optimize inventory filtering and restrict storage type specs ([fed26e8](https://github.com/VirgenRayzon/BuilbotAI/commit/fed26e8))

### Documentation
- Update team section with capstone context and grounded text ([80c82d5](https://github.com/VirgenRayzon/BuilbotAI/commit/80c82d5))

### Miscellaneous
- Refine hardware diagnostics copywriting and implement premium terminal logging for CSV grounding visibility ([2da95c3](https://github.com/VirgenRayzon/BuilbotAI/commit/2da95c3))

## [2026-05-15]

### Refactoring
- Admin Profile, Dashboard, Category Filters, and Terminal Verification ([e956c80](https://github.com/VirgenRayzon/BuilbotAI/commit/e956c80))

### Performance Improvements
- Optimize AI response times by consolidating flows and implementing in-memory caching ([51f41a7](https://github.com/VirgenRayzon/BuilbotAI/commit/51f41a7))

## [2026-05-14]

### Features
- Implement comprehensive audit log system with UI filtering and migration tools ([0ecf809](https://github.com/VirgenRayzon/BuilbotAI/commit/0ecf809))

### Documentation
- Revamp README with premium aesthetic and 3-layer architecture details ([d2bf90c](https://github.com/VirgenRayzon/BuilbotAI/commit/d2bf90c))

## [2026-05-13]

### Features
- Increase performance estimates to 6 games and remove Quick Add feature ([abd5db1](https://github.com/VirgenRayzon/BuilbotAI/commit/abd5db1))
- Implement diverse and context-aware FPS estimates in Build Critique ([2092fe8](https://github.com/VirgenRayzon/BuilbotAI/commit/2092fe8))
- Enhance AI Build Advisor with Web Search toggle, strict inventory rules, and improved error handling ([34a86dc](https://github.com/VirgenRayzon/BuilbotAI/commit/34a86dc))

### Bug Fixes
- Update handleCritique type definition in CritiqueTab props ([decd0c8](https://github.com/VirgenRayzon/BuilbotAI/commit/decd0c8))
- Make Try Again button functional in controlled mode ([8373af0](https://github.com/VirgenRayzon/BuilbotAI/commit/8373af0))

### Documentation
- Add project structure documentation and setup husky ([7469d79](https://github.com/VirgenRayzon/BuilbotAI/commit/7469d79))

### Styling & UI/UX
- Round the corners of the compatibility overlay ([d51fa97](https://github.com/VirgenRayzon/BuilbotAI/commit/d51fa97))
- Add color coding for validation errors in PartCard ([1563b53](https://github.com/VirgenRayzon/BuilbotAI/commit/1563b53))

## [2026-05-12]

### Features
- Improve analytics resolution scaling and implement collapsible sidebar sections ([7e282ef](https://github.com/VirgenRayzon/BuilbotAI/commit/7e282ef))
- Implement slot-based build view and improve AI bot UI ([9a23f6b](https://github.com/VirgenRayzon/BuilbotAI/commit/9a23f6b))

### Bug Fixes
- Auto-filter feature in PC Builder sidebar and improved category toggling logic ([2fde9ac](https://github.com/VirgenRayzon/BuilbotAI/commit/2fde9ac))

## [2026-05-11]

### Features
- Update landing sections content and remove Guides link from footer ([d8601e6](https://github.com/VirgenRayzon/BuilbotAI/commit/d8601e6))
- Enhance builder analytics dashboard with 4K scaling, high-fidelity metrics, and light mode optimization ([86e2949](https://github.com/VirgenRayzon/BuilbotAI/commit/86e2949))

### Bug Fixes
- Resolve ReferenceError 'mounted' in BuilderPage ([f0d2528](https://github.com/VirgenRayzon/BuilbotAI/commit/f0d2528))
- Resolve runtime TypeError in ProfileHero due to null authUser ([aca7a7d](https://github.com/VirgenRayzon/BuilbotAI/commit/aca7a7d))

### Refactoring
- Comprehensive UI and architecture updates ([fee03ef](https://github.com/VirgenRayzon/BuilbotAI/commit/fee03ef))
- Modularize components and hooks for better maintainability and design fidelity ([05e90e9](https://github.com/VirgenRayzon/BuilbotAI/commit/05e90e9))

## [2026-05-09]

### Miscellaneous
- Refine Modal Dropdown UX and relocate FABs to left side ([96c71c0](https://github.com/VirgenRayzon/BuilbotAI/commit/96c71c0))

## [2026-05-08]

### Refactoring
- Limit chatbot tokens to 1000 and update full build instructions ([6b04402](https://github.com/VirgenRayzon/BuilbotAI/commit/6b04402))
- Move team section to dedicated page, update team members with new avatars, and fix global layout/scrolling issues ([c3d7ebd](https://github.com/VirgenRayzon/BuilbotAI/commit/c3d7ebd))

## [2026-05-01]

### Features
- Enhance SalesVisualizer with premium heartbeat animation and scanning effects ([133355e](https://github.com/VirgenRayzon/BuilbotAI/commit/133355e))
- Refine builder UI/UX stability and mobile ergonomics ([698913a](https://github.com/VirgenRayzon/BuilbotAI/commit/698913a))
- Integrate dynamic power load meter into Your Build ([21c462f](https://github.com/VirgenRayzon/BuilbotAI/commit/21c462f))
- Enhance power critical warning in builder ([ba954a4](https://github.com/VirgenRayzon/BuilbotAI/commit/ba954a4))
- Implement strict footer whitelist logic ([3675fef](https://github.com/VirgenRayzon/BuilbotAI/commit/3675fef))
- Unified landing background and polished footer aesthetics ([a7b9a39](https://github.com/VirgenRayzon/BuilbotAI/commit/a7b9a39))
- Implement high-fidelity team section on landing page ([debdd74](https://github.com/VirgenRayzon/BuilbotAI/commit/debdd74))

### Bug Fixes
- Hydration mismatch in global footer rendering ([377a835](https://github.com/VirgenRayzon/BuilbotAI/commit/377a835))

### Refactoring
- Consolidate system analytics into a unified floating action button (FAB) architecture. Deprecated the legacy Build Insights sidebar, implemented mutual exclusivity between Chatbot and Analytics panels, and optimized profile page scroll behavior for a premium user experience. ([eb24e0a](https://github.com/VirgenRayzon/BuilbotAI/commit/eb24e0a))

### Styling & UI/UX
- Increase power meter font size and remove from sidebar ([694b848](https://github.com/VirgenRayzon/BuilbotAI/commit/694b848))

### Miscellaneous
- Revert sidebar compaction and implement infinite height layout ([055a967](https://github.com/VirgenRayzon/BuilbotAI/commit/055a967))

## [2026-04-29]

### Miscellaneous
- Standardize premium SparkleButton branding and ALL CAPS typography across AI entry points ([70c042f](https://github.com/VirgenRayzon/BuilbotAI/commit/70c042f))

## [2026-04-28]

### Features
- Implement premium SparkleButton and unify AI iconography across platform ([49a135a](https://github.com/VirgenRayzon/BuilbotAI/commit/49a135a))
- Implement AI Kill Switch, collapsible accessories, and support infrastructure (FAQ/Contact) ([0a67aac](https://github.com/VirgenRayzon/BuilbotAI/commit/0a67aac))
- Implement independent site maintenance and storage chaos mode kill switches ([f459040](https://github.com/VirgenRayzon/BuilbotAI/commit/f459040))
- Enhance about page with sub-topics, markdown support, and image lightbox ([e3d10fa](https://github.com/VirgenRayzon/BuilbotAI/commit/e3d10fa))

### Styling & UI/UX
- Refactor footer layout and content ([19ed474](https://github.com/VirgenRayzon/BuilbotAI/commit/19ed474))

### Miscellaneous
- Fix formatting in builder-floating-chat ([80010cf](https://github.com/VirgenRayzon/BuilbotAI/commit/80010cf))

## [2026-04-26]

### Features
- Implement and tune AI timeouts across all features ([d3976c8](https://github.com/VirgenRayzon/BuilbotAI/commit/d3976c8))
- Stabilize sales analytics, fix neural core crash, and improve light mode support ([26a4af5](https://github.com/VirgenRayzon/BuilbotAI/commit/26a4af5))
- Consolidate admin settings, fix dark mode charts, and enhance header with user profile ([dca5700](https://github.com/VirgenRayzon/BuilbotAI/commit/dca5700))

### Bug Fixes
- Import addPart in AdminPage ([2ae2832](https://github.com/VirgenRayzon/BuilbotAI/commit/2ae2832))
- Import bulkArchiveParts and bulkDeleteParts in AdminPage ([794cb66](https://github.com/VirgenRayzon/BuilbotAI/commit/794cb66))
- Import deletePart and archivePart in AdminPage ([fd080f3](https://github.com/VirgenRayzon/BuilbotAI/commit/fd080f3))

## [2026-04-25]

### Miscellaneous
- Remove Analyze My Build button for managers and super admins ([cab83c1](https://github.com/VirgenRayzon/BuilbotAI/commit/cab83c1))

## [2026-04-24]

### Features
- Remove 3D visualizer from landing page and update admin dashboard comments ([6681f26](https://github.com/VirgenRayzon/BuilbotAI/commit/6681f26))
- **chat**: Optimize BuildbotAI chat interface with decoupled carousel and grid layout ([88af90d](https://github.com/VirgenRayzon/BuilbotAI/commit/88af90d))

### Bug Fixes
- Restrict management portal to super admin only and cleanup unused imports ([0ee3a88](https://github.com/VirgenRayzon/BuilbotAI/commit/0ee3a88))

## [2026-04-23]

### Features
- Enhance reservation UI, real-time sync, and fix TS null check ([2176497](https://github.com/VirgenRayzon/BuilbotAI/commit/2176497))

### Bug Fixes
- Resolve Part model TypeScript error in prebuilt card ([cd0a01a](https://github.com/VirgenRayzon/BuilbotAI/commit/cd0a01a))

### Miscellaneous
- Replace Administrative Portal splash with Management settings in Profile ([c4a1b89](https://github.com/VirgenRayzon/BuilbotAI/commit/c4a1b89))
- Finalize Prebuilt UI consistency and Admin Dashboard cleanup ([5cc4833](https://github.com/VirgenRayzon/BuilbotAI/commit/5cc4833))

## [2026-04-22]

### Features
- Implement phase-driven AI progress modal and unify prebuilt add flow ([a3fe949](https://github.com/VirgenRayzon/BuilbotAI/commit/a3fe949))
- Implement click-to-filter in YourBuild sidebar and fix Build Insights layout ([5f0e135](https://github.com/VirgenRayzon/BuilbotAI/commit/5f0e135))

### Bug Fixes
- Resolve deployed chatbot 500 error - add GOOGLE_API_KEY fallback ([082b484](https://github.com/VirgenRayzon/BuilbotAI/commit/082b484))
- **chat**: Add streaming headers and unmask errors for deployment stability ([946b0a3](https://github.com/VirgenRayzon/BuilbotAI/commit/946b0a3))
- Update all AI features to use Gemini 2.5 Flash for production stability in 2026 ([7cd8a53](https://github.com/VirgenRayzon/BuilbotAI/commit/7cd8a53))
- Restore 'gemini-3-flash-preview' models for 2026 compatibility while retaining resilience fixes ([a69d3ee](https://github.com/VirgenRayzon/BuilbotAI/commit/a69d3ee))
- Resolve AI generation failures by updating invalid model names to 'gemini-1.5-flash' and adding resilience to search retrieval in advisor flow ([ec304be](https://github.com/VirgenRayzon/BuilbotAI/commit/ec304be))

### Miscellaneous
- Fix truncated chatbot messages and resolve TypeScript errors in AI SDK integration ([680fa64](https://github.com/VirgenRayzon/BuilbotAI/commit/680fa64))
- Refine part card UI: shrink spaces, remove info icons, fix name alignment and headset zoom ([c94f10b](https://github.com/VirgenRayzon/BuilbotAI/commit/c94f10b))

## [2026-04-20]

### Bug Fixes
- Stabilize pc visualizer alignment with explicit svg attributes and memoized layout ([818a3a7](https://github.com/VirgenRayzon/BuilbotAI/commit/818a3a7))

### Miscellaneous
- Implement per-manager key system and management dashboard ([cbf2138](https://github.com/VirgenRayzon/BuilbotAI/commit/cbf2138))
- Cleanup .gitignore and fix mangled entries ([1a5a212](https://github.com/VirgenRayzon/BuilbotAI/commit/1a5a212))
- Final cleanup: Fixed typecheck errors, removed deprecated visualizer files, and stabilized build architecture. ([77113d5](https://github.com/VirgenRayzon/BuilbotAI/commit/77113d5))
- Rename firebase service account env var to avoid reserved prefix and update gitignore ([2929bd5](https://github.com/VirgenRayzon/BuilbotAI/commit/2929bd5))

## [2026-04-19]

### Features
- Enhance prebuilt builder with build insights and improved 3D visualizer clearance logic ([4ae7ae3](https://github.com/VirgenRayzon/BuilbotAI/commit/4ae7ae3))
- Stabilize BuildbotAI chat interface and fix image rendering ([6038442](https://github.com/VirgenRayzon/BuilbotAI/commit/6038442))

### Miscellaneous
- Admin UI Refinement: Restrict Case specs to 3-digit numeric only and remove auto-reload on save ([bcddacd](https://github.com/VirgenRayzon/BuilbotAI/commit/bcddacd))
- Refine AI Build Advisor: persistence, design alignment, robust image matching, and flexible budgeting ([6ea3f0a](https://github.com/VirgenRayzon/BuilbotAI/commit/6ea3f0a))
- Add agent skills, models config, and scratch scripts (secrets removed) ([3936b0c](https://github.com/VirgenRayzon/BuilbotAI/commit/3936b0c))
- Admin dashboard enhancements: added popularity matrix by category and restricted numeric inputs to digits only. ([5be00a4](https://github.com/VirgenRayzon/BuilbotAI/commit/5be00a4))

## [2026-04-18]

### Features
- Enforce archival visibility constraints and fix Featured Systems blank screen ([1e89a2c](https://github.com/VirgenRayzon/BuilbotAI/commit/1e89a2c))

### Miscellaneous
- Update BuilbotAI: Integrate firebase-admin, refine UI components, and improve profile page ([6d1fd3a](https://github.com/VirgenRayzon/BuilbotAI/commit/6d1fd3a))

## [2026-04-17]

### Features
- Upgrade PC visualizer, fix sales analytics, and add Case dimension specs ([56b503f](https://github.com/VirgenRayzon/BuilbotAI/commit/56b503f))
- Implement admin batch confirmation and consolidate auth logic ([37b5e51](https://github.com/VirgenRayzon/BuilbotAI/commit/37b5e51))
- Implement secure reservation system, update firestore rules, and enhance pc compatibility validation ([b33fd2b](https://github.com/VirgenRayzon/BuilbotAI/commit/b33fd2b))

### Miscellaneous
- Modernized Prebuilt Management UI and Header Navigation ([576810d](https://github.com/VirgenRayzon/BuilbotAI/commit/576810d))
- Linting and cleanup in notification-center.tsx ([e49ce10](https://github.com/VirgenRayzon/BuilbotAI/commit/e49ce10))
- Fixed TypeScript mismatch for user_cancelled notification type ([5f1ae05](https://github.com/VirgenRayzon/BuilbotAI/commit/5f1ae05))
- Standardized layout widths, fixed profile button interactivity, and added cancellation notifications for admins ([63fa7e8](https://github.com/VirgenRayzon/BuilbotAI/commit/63fa7e8))
- Update buildbot skill, install project-related agent skills, and fix builder ts error ([f47537e](https://github.com/VirgenRayzon/BuilbotAI/commit/f47537e))

## [2026-04-16]

### Miscellaneous
- Refined GPU Slot Thickness with numeric input and auto-unit formatting, updated AI flow ([d9e5c90](https://github.com/VirgenRayzon/BuilbotAI/commit/d9e5c90))
- Refactored Case specifications with interactive checkboxes and dropdowns, updated AI normalization ([21114c1](https://github.com/VirgenRayzon/BuilbotAI/commit/21114c1))
- Admin Dashboard: 80% wide modals, Motherboard specs (SATA/NVMe), Form Factor dropdown, and AI normalization ([445690b](https://github.com/VirgenRayzon/BuilbotAI/commit/445690b))

## [2026-04-14]

### Features
- Exclusive category filtering in manage stock and archive filtering ([c1f9409](https://github.com/VirgenRayzon/BuilbotAI/commit/c1f9409))

## [2026-04-12]

### Features
- Complete dedicated prebuilt product pages with role-based navigation and streamlined AI performance analysis ([803b489](https://github.com/VirgenRayzon/BuilbotAI/commit/803b489))

### Miscellaneous
- Admin dashboard rebranding and multi-tier role system implementation. Renamed Builder Admin to Prebuilt Builder, implemented dynamic Manager/Super Admin roles, updated navigation header, and introduced new ImageUpload component with filename visibility and Storage overwrite logic. ([1257310](https://github.com/VirgenRayzon/BuilbotAI/commit/1257310))

## [2026-04-10]

### Features
- Standardize AI component extraction, fix GPU thickness rendering, and refine ITX PSU visualizer shape ([04201d3](https://github.com/VirgenRayzon/BuilbotAI/commit/04201d3))
- Enforce builder selection rules, fix power calculations, and anchor GPU to mobo slot in visualizer ([0eddead](https://github.com/VirgenRayzon/BuilbotAI/commit/0eddead))
- Collapsible prebuilt cards with synced expansion and premium UI improvements ([d3428f3](https://github.com/VirgenRayzon/BuilbotAI/commit/d3428f3))

## [2026-03-16]

### Features
- Customize stock cooler models for Intel and AMD CPUs ([1bf635a](https://github.com/VirgenRayzon/BuilbotAI/commit/1bf635a))

### Bug Fixes
- Refine stock cooler sync logic for replacements and brand changes ([57de665](https://github.com/VirgenRayzon/BuilbotAI/commit/57de665))
- Ensure CPU package type persists in database and admin page ([fc59f6e](https://github.com/VirgenRayzon/BuilbotAI/commit/fc59f6e))

## [2026-03-15]

### Features
- Implement CPU package type selection and auto-cooler logic in builder ([7c2548d](https://github.com/VirgenRayzon/BuilbotAI/commit/7c2548d))
- Do not overwrite description if it's already populated during AI autofill ([0200924](https://github.com/VirgenRayzon/BuilbotAI/commit/0200924))
- Expand AI autofill for product highlights and sync admin UI aesthetics ([776383a](https://github.com/VirgenRayzon/BuilbotAI/commit/776383a))

## [2026-03-14]

### Features
- Implement RAM slot support, case form factor compatibility, and fix search/validation regressions ([d5c3ebf](https://github.com/VirgenRayzon/BuilbotAI/commit/d5c3ebf))

## [2026-03-12]

### Features
- Enhance AI chatbot with RAG knowledge base, modern UI, and auto-reset on logout ([afb3c44](https://github.com/VirgenRayzon/BuilbotAI/commit/afb3c44))
- Integrate local DB and knowledge retriever, refine performance display, remove MCP client and tmp files ([a9449c3](https://github.com/VirgenRayzon/BuilbotAI/commit/a9449c3))

## [2026-03-07]

### Miscellaneous
- Add admin builder page and compatibility checks, hardcode admin key ([80d4da2](https://github.com/VirgenRayzon/BuilbotAI/commit/80d4da2))

## [2026-03-06]

### Miscellaneous
- Clean up project-specific MCP server and update client to use global server ([d5f041e](https://github.com/VirgenRayzon/BuilbotAI/commit/d5f041e))

## [2026-03-05]

### Features
- Animate sparkle buttons and fix AI autofill grounding ([5c4ce9d](https://github.com/VirgenRayzon/BuilbotAI/commit/5c4ce9d))

### Bug Fixes
- Add Firebase client config env vars to apphosting.yaml for build ([58013a8](https://github.com/VirgenRayzon/BuilbotAI/commit/58013a8))
- **apphosting**: Map firebase config secrets and set build availability ([d90b624](https://github.com/VirgenRayzon/BuilbotAI/commit/d90b624))

### Documentation
- Update buildbot skills and cleanup git tracking ([08c8e49](https://github.com/VirgenRayzon/BuilbotAI/commit/08c8e49))

### Miscellaneous
- Move hardcoded firebase config to environment variables ([da6cfed](https://github.com/VirgenRayzon/BuilbotAI/commit/da6cfed))

## [2026-03-04]

### Features
- Enhance UI with cosmic theme, add AI build advisor improvements, and new profile page ([b1e3a8b](https://github.com/VirgenRayzon/BuilbotAI/commit/b1e3a8b))

## [2026-03-03]

### Miscellaneous
- Refine PC visualizer, update AI build advisor, and improve UI accessibility and components ([aabfae8](https://github.com/VirgenRayzon/BuilbotAI/commit/aabfae8))

## [2026-03-02]

### Features
- Implement accessory categories, refine UI layout, and enhance compatibility checks ([72aa0a8](https://github.com/VirgenRayzon/BuilbotAI/commit/72aa0a8))

### Miscellaneous
- Update PC component UI, prebuilt systems, and inventory logic ([c6ee519](https://github.com/VirgenRayzon/BuilbotAI/commit/c6ee519))

## [2026-03-01]

### Features
- Implement full component specs schema for Firestore ([c91303d](https://github.com/VirgenRayzon/BuilbotAI/commit/c91303d))

### Miscellaneous
- Update application UI and components ([ba88a63](https://github.com/VirgenRayzon/BuilbotAI/commit/ba88a63))

## [2026-02-28]

### Features
- AI Quick Add, 2D component visualizer, image magnifier, and build logic enhancements ([d41c8ca](https://github.com/VirgenRayzon/BuilbotAI/commit/d41c8ca))

## [2026-02-26]

### Features
- Migrate AI from nvidia gemini, update to gemini-2.5-flash model ([1ed38ee](https://github.com/VirgenRayzon/BuilbotAI/commit/1ed38ee))
- Integrate Gemini 2.5 Flash and update Buildbot branding icons ([45b7361](https://github.com/VirgenRayzon/BuilbotAI/commit/45b7361))
- Integrate NotebookLM for PC part specifications and improve compatibility logic ([5d54a71](https://github.com/VirgenRayzon/BuilbotAI/commit/5d54a71))

### Miscellaneous
- Trigger rollout for secret permissions ([34f97b7](https://github.com/VirgenRayzon/BuilbotAI/commit/34f97b7))
- Trigger App Hosting redeploy for new API key ([51519ec](https://github.com/VirgenRayzon/BuilbotAI/commit/51519ec))
- Configure production AI features utilizing Cloud Secret Manager ([038ea2e](https://github.com/VirgenRayzon/BuilbotAI/commit/038ea2e))
- Configure Firebase App Hosting deployment ([8ea23d8](https://github.com/VirgenRayzon/BuilbotAI/commit/8ea23d8))
- Refactor AI Build Critique UI: in-line results, client-side caching, and icon removal interactions ([017a2ec](https://github.com/VirgenRayzon/BuilbotAI/commit/017a2ec))

## [2026-02-25]

### Features
- Enhance AI part extraction and update admin inventory UI ([e19ded5](https://github.com/VirgenRayzon/BuilbotAI/commit/e19ded5))
- Implement advanced bottleneck system with dual selectors (resolution and workload mode) ([e971db8](https://github.com/VirgenRayzon/BuilbotAI/commit/e971db8))
- Display at-a-glance specs on prebuilt system cards ([240d40b](https://github.com/VirgenRayzon/BuilbotAI/commit/240d40b))
- Add detailed prebuilt system modal with ai performance critique ([4434ebe](https://github.com/VirgenRayzon/BuilbotAI/commit/4434ebe))
- Improve pre-built page UI, loading states, and search filtering ([8c9aa3b](https://github.com/VirgenRayzon/BuilbotAI/commit/8c9aa3b))
- Updates to ai provider, stock validation, and checkout flow ([ce31e5c](https://github.com/VirgenRayzon/BuilbotAI/commit/ce31e5c))

### Miscellaneous
- Fix specification parsing, currency formatting, and UI errors ([9725da9](https://github.com/VirgenRayzon/BuilbotAI/commit/9725da9))

## [2026-02-24]

### Features
- Implement stock validation, prebuilt completeness rules, and PHP currency focus ([68ed386](https://github.com/VirgenRayzon/BuilbotAI/commit/68ed386))
- Implement 3D PC Visualizer and integrate AI Analysis features into the builder sidebar ([13f9517](https://github.com/VirgenRayzon/BuilbotAI/commit/13f9517))
- Introduce AI build advisor and PC builder pages, along with a shared component for displaying the current build. ([39eadf3](https://github.com/VirgenRayzon/BuilbotAI/commit/39eadf3))
- Introduce AI Build Advisor page with build summary, power consumption gauge, and AI critique functionality. ([dfda171](https://github.com/VirgenRayzon/BuilbotAI/commit/dfda171))
- Implement PC builder page with AI build critique and smart budget features. ([bb3b358](https://github.com/VirgenRayzon/BuilbotAI/commit/bb3b358))
- Implement PC builder page with part selection, build management, and compatibility checks. ([e0a9230](https://github.com/VirgenRayzon/BuilbotAI/commit/e0a9230))

### Bug Fixes
- **types**: Resolve typescript errors and update calendar for react-day-picker v9 ([acc4272](https://github.com/VirgenRayzon/BuilbotAI/commit/acc4272))

### Miscellaneous
- New update ([42f7cb0](https://github.com/VirgenRayzon/BuilbotAI/commit/42f7cb0))

## [2026-02-22]

### Miscellaneous
- Error initializing plugins: GenkitError: FAILED_PRECONDITION: Please pas ([f19950c](https://github.com/VirgenRayzon/BuilbotAI/commit/f19950c))
- Im getting AI error, could not fetch details for this part, when running ([f4c09e9](https://github.com/VirgenRayzon/BuilbotAI/commit/f4c09e9))
- I want this button to turn to red and the + become x, when the part is s ([2526e7a](https://github.com/VirgenRayzon/BuilbotAI/commit/2526e7a))
- The hover still clipping to other cards ([ca6dfef](https://github.com/VirgenRayzon/BuilbotAI/commit/ca6dfef))
- The hover message is cut, feels like the card is in the background fix i ([2a858bd](https://github.com/VirgenRayzon/BuilbotAI/commit/2a858bd))
- I want the cards in grid view look like this, retain the image preview. ([b55cfbf](https://github.com/VirgenRayzon/BuilbotAI/commit/b55cfbf))
- Add a duplicate protection when adding a new parts. add a light mode to ([45a099b](https://github.com/VirgenRayzon/BuilbotAI/commit/45a099b))
- ## Error Type Runtime FirebaseError ([cba8c0d](https://github.com/VirgenRayzon/BuilbotAI/commit/cba8c0d))
- Edit the AI assist to when adding parts to limit the specification, righ ([7f6616f](https://github.com/VirgenRayzon/BuilbotAI/commit/7f6616f))
- The est. wattage is still zero, it supposed to show the estimated wattag ([8225aa2](https://github.com/VirgenRayzon/BuilbotAI/commit/8225aa2))
- Remove the 650w word here, est. wattage total the wattage of all selecte ([0a810e2](https://github.com/VirgenRayzon/BuilbotAI/commit/0a810e2))
- The generated specification disappeared here, bring it back ([a23b780](https://github.com/VirgenRayzon/BuilbotAI/commit/a23b780))
- Add a watt estimation for each parts that needed it, add a warning if th ([1ec6741](https://github.com/VirgenRayzon/BuilbotAI/commit/1ec6741))
- Suggest a fix to this, i want all of the parts drop down all in the same ([2508080](https://github.com/VirgenRayzon/BuilbotAI/commit/2508080))
- Add a scroll bar to the right of this component, blue highlight focus is ([f682724](https://github.com/VirgenRayzon/BuilbotAI/commit/f682724))
- Bring back the case and the cooler here, then implement a scroll feature ([11b875a](https://github.com/VirgenRayzon/BuilbotAI/commit/11b875a))
- The case and cooler disappear, dont remove them add a scroll is needed, ([d6b40f5](https://github.com/VirgenRayzon/BuilbotAI/commit/d6b40f5))
- Fix the overlaps, same with the add new part ([5d7967b](https://github.com/VirgenRayzon/BuilbotAI/commit/5d7967b))
- Add the auto fill feature similar to cpu and gpu to other parts like ram ([736c297](https://github.com/VirgenRayzon/BuilbotAI/commit/736c297))
- Try fixing this error: `Runtime ReferenceError: CardFooter is not define ([5c1e71b](https://github.com/VirgenRayzon/BuilbotAI/commit/5c1e71b))
- Change three dots to just the delete button add a action confirmation , ([c5045cb](https://github.com/VirgenRayzon/BuilbotAI/commit/c5045cb))
- Try fixing this error: `Runtime ReferenceError: CardFooter is not define ([7f7b488](https://github.com/VirgenRayzon/BuilbotAI/commit/7f7b488))
- Remove the sign in and sign up at the upper right of the UI, change the ([6891e57](https://github.com/VirgenRayzon/BuilbotAI/commit/6891e57))
- I got this error when it runs ([a575e8d](https://github.com/VirgenRayzon/BuilbotAI/commit/a575e8d))
- How do i run this locally? ([7184a85](https://github.com/VirgenRayzon/BuilbotAI/commit/7184a85))
- Set up a Firebase project ([84aa73d](https://github.com/VirgenRayzon/BuilbotAI/commit/84aa73d))
- Where did you add the "users" collection. i cant see it ([df4486c](https://github.com/VirgenRayzon/BuilbotAI/commit/df4486c))
- Remove the get started in the main page, create a starting page, where t ([44c0d9d](https://github.com/VirgenRayzon/BuilbotAI/commit/44c0d9d))
- Remove the seeding feature in the app, ill input the parts manually ([581a170](https://github.com/VirgenRayzon/BuilbotAI/commit/581a170))
- Here is the setup for firestore database in CPU category, the "add new c ([8e2038a](https://github.com/VirgenRayzon/BuilbotAI/commit/8e2038a))
- Here is the firestore database, i want it to be filled via this app. ([ae9705a](https://github.com/VirgenRayzon/BuilbotAI/commit/ae9705a))
- Can you just save it to the firestore database instead of seeding it ([89a80c7](https://github.com/VirgenRayzon/BuilbotAI/commit/89a80c7))
- Can you optimized the admin page, it takes too long too load ([9bdbf7e](https://github.com/VirgenRayzon/BuilbotAI/commit/9bdbf7e))
- Lets remove the local database and stick with firebase ([6acacdf](https://github.com/VirgenRayzon/BuilbotAI/commit/6acacdf))
- Parts not being saved, it was cleared when the app is refreshed ([7089183](https://github.com/VirgenRayzon/BuilbotAI/commit/7089183))
- Try fixing this error: `Console Error: Image is missing required "alt" p ([ea9a435](https://github.com/VirgenRayzon/BuilbotAI/commit/ea9a435))
- Check for errors the app is stuck at loading ([621fbd0](https://github.com/VirgenRayzon/BuilbotAI/commit/621fbd0))
- The "add part" button dont write the item to the database, the item disa ([a1fa3d5](https://github.com/VirgenRayzon/BuilbotAI/commit/a1fa3d5))
- Check for errors, the app dont respond after pressing the delete in the ([0a1d73b](https://github.com/VirgenRayzon/BuilbotAI/commit/0a1d73b))
- Check for errors, it shows no items in inventory ([1134c50](https://github.com/VirgenRayzon/BuilbotAI/commit/1134c50))
- In the "add new component" when the add part button is pressed, the part ([f79a03c](https://github.com/VirgenRayzon/BuilbotAI/commit/f79a03c))
- The builder page supposed to post all of items that is in database based ([66a7ef5](https://github.com/VirgenRayzon/BuilbotAI/commit/66a7ef5))
- Generate an excel file for parts database ([89dbca4](https://github.com/VirgenRayzon/BuilbotAI/commit/89dbca4))
- This will be the "add new prebuilt" button, add "," to the price for muc ([d9e7eb7](https://github.com/VirgenRayzon/BuilbotAI/commit/d9e7eb7))
- Fix the add new component, it to fill the information when the AI assist ([2dc589c](https://github.com/VirgenRayzon/BuilbotAI/commit/2dc589c))
- This is what "+ add new part button" will looked like after press, make ([c5cde62](https://github.com/VirgenRayzon/BuilbotAI/commit/c5cde62))
- Remove this in the builder page, bring the category buttons with the scr ([190c19b](https://github.com/VirgenRayzon/BuilbotAI/commit/190c19b))
- This is what admin page supposed to look like, do not add "seed initial ([df3d99a](https://github.com/VirgenRayzon/BuilbotAI/commit/df3d99a))
- The scroll bar make it match the color scheme ([452a5a4](https://github.com/VirgenRayzon/BuilbotAI/commit/452a5a4))
- Try fixing this error: `Build Error: Export Rectangle doesn't exist in t ([912affd](https://github.com/VirgenRayzon/BuilbotAI/commit/912affd))
- Follow the design of this image but retain our project original fonts an ([276ffc4](https://github.com/VirgenRayzon/BuilbotAI/commit/276ffc4))
- Initial prototype ([f0152b7](https://github.com/VirgenRayzon/BuilbotAI/commit/f0152b7))

## [2026-02-10]

### Miscellaneous
- Initialized workspace with Firebase Studio ([83e8ae8](https://github.com/VirgenRayzon/BuilbotAI/commit/83e8ae8))

