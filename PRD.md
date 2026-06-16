# Atlas — Product Requirements Document

Atlas is the **system of record, wiki, and governance layer for an organization's Claude Agent Skills**. It turns a scattered pile of `SKILL.md` folders into a single, browsable, department-organized catalog where a non-technical subject-matter expert can author a validated, well-described, governed, versioned skill bundle without ever touching YAML or a terminal — while platform admins get the metadata coverage, approval gates, connection graph, and audit trail they need, and engineers/agents get one trustworthy source to deploy from across Claude.ai, Claude Code, and the Claude API. Atlas's leverage is on **metadata quality, discoverability, governance, and safe cross-surface distribution** of skills — explicitly **not** on executing them.

---

## Product Thesis

Atlas sits at the **intersection of four mature-but-disjoint product categories** that no existing product unifies: (1) the **Claude Agent Skills ecosystem & community registries**, (2) **AI prompt/agent hubs**, (3) **internal developer portals / software catalogs** (Backstage), and (4) **governed knowledge bases / wikis** (Confluence, Notion). Every surveyed competitor wins on at most two of these axes: the Anthropic ecosystem tools are skill-aware but flat and developer-only; Backstage and Dust are governance-rich but skill-unaware; Notion and Copilot Studio offer non-engineer authoring but over proprietary, non-portable artifacts.

**Atlas's defensible wedge is being the only product that does all four at once:**
1. **Native SKILL.md / YAML-frontmatter awareness** — parse, validate, and surface frontmatter as first-class catalog fields, with description-quality coaching (the load-bearing field that decides whether an agent ever triggers a skill).
2. **Backstage-style governance** — ownership, lifecycle/status, departmental organization, a connection graph (depends-on / supersedes / related-to), access control, and an audit trail — but over portable skill artifacts.
3. **Non-engineer authoring + browsing UX** — guided forms, validation coaching, and a calm wiki, so a legal-ops or finance SME ships a skill with no git, no YAML, no terminal.
4. **One-click cross-surface deployment** to Claude.ai, Claude Code, and the Claude API over the existing plugin/marketplace mechanism — which no competitor does for the open Skill standard.

The wedge is the **combination**. Ease-of-use for non-engineers is the headline differentiator; governance + the connection graph are the moat; native SKILL.md + cross-surface deploy are why it belongs in the Claude ecosystem rather than beside it.

---

## Users & Jobs-to-be-Done

| Persona | Role id | Primary goal | Technical level |
|---|---|---|---|
| **Non-technical SME author** | `skill.author` | Capture a procedure as a validated skill without writing YAML | Non-engineer (PRIMARY) |
| **Technical author** | `skill.author` (eng) | Author many skills fast with strict validation, CLI/API, git workflow | Engineer |
| **Department Lead / Skill Owner** | `dept.lead` | Curate, approve, retire their department's skills | Non-engineer |
| **Governance / Platform Admin** | `gov.admin` | Enforce policy, metadata coverage, audit org-wide | Mixed |
| **Engineer / Agent-Builder** | `agent.builder` | Discover a trusted skill and deploy it to a surface | Engineer |
| **Reader** | `reader` | Browse/search the wiki, learn what a skill does (read-only) | Any |
| **Consuming agent** | (machine) | Read clean descriptions, load the right bundle, no name collisions | Machine |

**Jobs-to-be-Done**

- **JTBD-A1 (SME author):** When I have a repeatable manual task, I want to capture it as a skill *without writing YAML or learning the file format*, so an agent can do it and I stop being the bottleneck.
- **JTBD-A2 (SME author):** When I write the skill's description, I want guidance on whether an agent will actually find and trigger it, so I don't publish a skill that silently never fires.
- **JTBD-A3 (SME author):** When I attach a script/template/reference, I want a guided flow that structures the bundle correctly, so I never reason about progressive disclosure or folder layout.
- **JTBD-A4 (technical author):** When I'm building many skills fast, I want a CLI/API and git-like workflow with strict validation, so I author at speed and catch structural errors before they ship.
- **JTBD-O1 (discovery):** When I'm about to build a skill, I want to discover whether one already exists or overlaps, so I reuse instead of creating drift.
- **JTBD-O2 (discovery):** When I browse, I want skills organized by department and connected by relationships, so I navigate the library like a wiki and see how capabilities fit.
- **JTBD-O3 (discovery):** When I find a skill, I want its owner, status, version, and connections, so I can trust and correctly use it.
- **JTBD-V1 (validation):** When I'm ready to publish, I want Atlas to validate frontmatter (name uniqueness, description quality, required governance fields) and structure, so the skill is well-formed and discoverable.
- **JTBD-V2 (packaging):** When a skill is approved, I want it packaged into a distributable, versioned bundle automatically, so I deploy without manual zipping.
- **JTBD-G1 (governance):** When skills accumulate, I want every published skill to carry required governance metadata, so I can prove coverage and pass audit.
- **JTBD-G2 (governance):** When a skill changes, I want versioning with history, diffs, and an approval gate, so I can roll back and trace who changed what.
- **JTBD-G3 (governance):** When a skill is risky, outdated, or superseded, I want to deprecate/restrict it with a successor link, so consumers stop pulling stale capabilities.
- **JTBD-D1 (deploy):** When I deploy into a runtime (Claude Code, Agent SDK, internal app), I want to pull validated, versioned bundles from one source of truth across surfaces, so agents stay consistent.
- **JTBD-D2 (consuming agent):** When I decide what to load, I want unambiguous, well-scoped descriptions and no name collisions, so I trigger the right skill at the right time.

> **Persona tension to design for:** non-technical authors want maximum ease; admins want maximum control; engineers want maximum speed. Governance must be **progressive** — light for a draft, strict at publish.

---

## User Journeys

**Journey A — Author creates & validates a new skill *(PRIMARY)***
1. Author lands on the **Skill Catalog**, clicks **New Skill**.
2. Fills metadata: name, summary/description, **department** (select), tags, visibility.
3. Pastes/edits the **SKILL.md** body (frontmatter + markdown) in the authoring editor.
4. Clicks **Validate** → linter checks frontmatter schema, required fields, naming, broken links, declared connections; sees a pass/fail panel with per-rule results.
5. On pass, clicks **Publish** → skill is packaged + versioned (v1.0.0) and added to the registry.
6. Lands on the new skill's **Wiki Detail** page; the skill now appears in the catalog (durable artifact).

**Journey B — Department Lead browses & governs their department's skills**
1. Lead opens **Department Directory**, selects their department, sees that dept's skills + health.
2. Filters by governance status (Draft / In Review / Approved / Deprecated).
3. Opens a skill **Wiki Detail**; reviews summary, owner, connections, governance metadata.
4. Clicks **Approve** (or **Request changes** / **Deprecate**) → status transitions, audit-logged.
5. Governance badge updates across catalog and detail views.

**Journey C — Agent-Builder discovers a skill and deploys it to a surface**
1. Builder searches the **Catalog**, filters by capability/tag, opens a skill **Wiki Detail**.
2. Inspects the **Connection Graph** (depends-on / depended-on-by) and version.
3. Clicks **Deploy** → chooses target **surface** (Claude Code, Web Agent, Slack bot) + version pin.
4. Confirms; receives a deployment record + copyable install snippet.
5. Deployment appears under the skill's **Deployments** tab and the builder's surface inventory.

**Journey D — Admin reviews governance & version history**
1. Admin opens the **Governance Dashboard** → org-wide rollup (unowned, stale, policy violations).
2. Drills into a skill's **Version History** → diffs, who changed what, validation logs.
3. Reviews the **Audit Trail** of approvals/deprecations/deployments.
4. Sets/edits org policy (required frontmatter fields, allowed departments, review SLAs).

**Journey E — Reader explores the wiki *(read-only)***
1. Reader lands on the **Catalog**, uses global search + department facets.
2. Opens a **Wiki Detail**, reads docs, sees connections, copies usage examples. No write controls shown.

---

## Competitive Landscape

No surveyed product covers the full Atlas thesis. For each: what it does + the gap Atlas fills.

| Product | URL | What it does | Gap Atlas fills |
|---|---|---|---|
| **Anthropic Agent Skills** | [github.com/anthropics/skills](https://github.com/anthropics/skills) | Canonical SKILL.md format (YAML frontmatter `name`+`description`, markdown, scripts) + `marketplace.json` plugin system; works across Claude.ai/Code/API. | Flat git repo + JSON manifest, developer/CLI-only, no governance/ownership beyond name+description, no wiki, no departmental org, no access control, no analytics, no non-engineer authoring. |
| **Claude Code Marketplaces Directory** | [claudemarketplaces.com](https://claudemarketplaces.com/) | Public aggregator indexing 21,600+ skills / 2,500+ marketplaces / 12,500+ MCP servers; categorized, ranked by installs/stars/votes; copy-paste CLI install. | Internet-wide, not org-private; no governance, ownership, internal versioning, authoring, access control, or deploy beyond copy-paste; community votes, not org-curated trust. |
| **Claude Skill Registry (majiayu000)** | [github.com/majiayu000/claude-skill-registry](https://github.com/majiayu000/claude-skill-registry) | Searchable index aggregated from GitHub/community, updated daily, with a web frontend. | Public aggregation only; no private/org scoping, governance/lifecycle, non-engineer authoring/wiki, or cross-surface deploy controls. |
| **awesome-claude-skills (travisvn)** | [github.com/travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills) | Curated README organizing skills by function (Document, Design, Development, Communication) + Skills-vs-Prompts guidance + security warnings. | A static list — no dynamic metadata, versioning, governance enforcement, deployment, or UI. |
| **LangChain Hub (LangSmith Prompt Hub)** | [docs.langchain.com/langsmith/prompt-engineering-concepts](https://docs.langchain.com/langsmith/prompt-engineering-concepts) | Versioned prompt registry: commit-based versions, pull-by-name+hash, public/private sharing, programmatic push/pull. | Single-text prompts, not multi-file skill bundles; SDK-oriented, not non-engineer; no SKILL.md awareness, cross-surface deploy, or ownership graph. |
| **Dust (dust.tt)** | [dust.tt/home/product](https://dust.tt/home/product) | Enterprise platform to build/deploy/manage AI agents over company data; granular permissions, usage monitoring, audit, SOC 2, 3,000+ orgs. | Manages heavyweight agents in its own format/runtime, not portable SKILL.md; no connection-graph over skill artifacts; locks into the Dust runtime, not Claude surfaces. |
| **Microsoft Copilot Studio** | [learn.microsoft.com/microsoft-copilot-studio](https://learn.microsoft.com/en-us/microsoft-copilot-studio/) | Low-code business-user platform to build agents: topics, trigger phrases, prebuilt templates, M365/Teams governance. | Microsoft-ecosystem-locked, proprietary agent format, no portability to Claude surfaces, no open connection-graph over skill artifacts. |
| **GitHub Models** | [github.com/features/models](https://github.com/features/models) | Catalog + playground to browse/test/compare AI models with parameter tuning. | Models, not skills; no authoring, org-private governance, versioned bundles, or SKILL.md. |
| **Hugging Face Hub** | [huggingface.co/docs/hub/index](https://huggingface.co/docs/hub/index) | Models/datasets/spaces as git+LFS repos with full revision history, model cards, discovery, collaboration. | General ML artifacts, not SKILL.md; repo-level (not org-chart-aware) governance; no departmental org, cross-surface deploy; developer-centric. |
| **Backstage (by Spotify)** | [backstage.spotify.com/docs/portal/core-features-and-plugins/catalog](https://backstage.spotify.com/docs/portal/core-features-and-plugins/catalog) | Developer portal whose Software Catalog tracks ownership/metadata via in-repo YAML harvested from git OR a no-code Portal UI; entities form a relationship graph; software templates; TechDocs. | Developer-first and software-entity-oriented (not skill/SKILL.md-aware); no concept of deploying an artifact to AI surfaces or non-engineer authoring of the artifact. **Architecturally the closest analog** — its dual "managed by YAML / managed by Portal" model is the precedent for Atlas's hybrid path. |
| **Confluence (Atlassian)** | [atlassian.com/software/confluence](https://www.atlassian.com/software/confluence) | Structured team wiki: per-department spaces, page hierarchy, permissions, page versioning, templates, labels. | Documents only — no executable/structured skill artifacts, SKILL.md schema, deployment, or capability connection-graph. |
| **Notion** | [notion.com](https://www.notion.com/) | Flexible wiki/database hybrid: relational DBs, properties, views, templates, scoped AI Q&A. | Content isn't an executable skill; no schema validation, versioned bundle, or deploy to Claude surfaces; AI search stays inside Notion. |
| **Glean** | [glean.com](https://www.glean.com/) | Enterprise AI search indexing 100+ apps with org-aware relevance; an index layer, not a destination wiki. | Indexes existing content; doesn't author, version, govern lifecycle of, or deploy skills; not skill-format-aware. |
| **Storybook** | [storybook.js.org](https://storybook.js.org/) | Living, browsable catalog of UI components rendered with all variants/states. | Frontend-component-specific, developer/CI-driven; no non-engineer authoring, SKILL.md, AI-surface deploy, or governance/ownership model. |
| **Chromatic (Storybook composition)** | [chromatic.com/docs/composition](https://www.chromatic.com/docs/composition/) | Publishes/versions/indexes components in the cloud; one Storybook composes another (a dependency graph). | Component-specific; the publish→version→browse→compose lifecycle is the template, but no skill awareness or AI-surface deploy. |

---

## Solution Approach

**Recommended path: Path 3 — Hybrid (git-backed source of truth + DB-indexed governance/wiki/graph layer + a validation & cross-surface deployment pipeline).** This is the only path that satisfies all four load-bearing requirements simultaneously.

- **Git is the canonical store.** Skill bundles live as `SKILL.md` folders in git, exactly as the ecosystem expects today. Versioning, history, diffing, and pull-by-revision come from git essentially for free; skills stay portable and avoid walled-garden lock-in.
- **A database indexes those repos** into the layer that powers the wiki/catalog UI, the connection graph (declared depends-on / supersedes / related-to), governance/ownership/departmental metadata, search, and analytics — all of which are efficient in an index, awkward in raw YAML.
- **Non-engineers author through a guided UI that commits back to git** (Backstage's proven "managed by Portal" pattern), while engineers may keep authoring "managed by YAML" in git directly. The dual mode is the battle-tested bridge between the two audiences.
- **A validation pipeline** lints every change against the SKILL.md spec on the write path (frontmatter schema, name uniqueness, description quality, required governance fields, broken links, declared connections).
- **A deployment service** renders/syncs `marketplace.json` and versioned bundles to Claude.ai, Claude Code, and the Claude API over the existing plugin/marketplace mechanism.

**Sequencing:** start with git ingest + index + read-only wiki/catalog + governance overlay (fast to value, low risk), then layer the guided UI-commits-to-git authoring and the multi-surface deploy pipeline.

**Build posture: greenfield / standalone.** The build repo has no prior source to fork. The only mandatory reuse is the **tenexity-design** brand canon (see Non-Functional Requirements). For the MVP, the git source-of-truth and cross-surface deploy connectors may be simulated/stubbed behind a stable interface so the full authoring→validate→publish→catalog happy flow is real, durable, and verifiable end-to-end.

---

## MVP Scope

**MVP must deliver the full authoring → validate → publish → catalog happy flow as a real, durable artifact**, plus the read/govern surfaces around it.

**In MVP:**
- Skill **Catalog / Browse** with global search and left-rail **department facets** + status/tag/owner filters; skill cards with dept badge, governance status, version, connection count.
- **Skill Authoring Editor** (`/skill/new`, `/skill/:slug/edit`): metadata form (name, description, department, tags, visibility) + SKILL.md editor + live **Validate** + results panel.
- **Validation pipeline** for SKILL.md frontmatter (schema, required fields, name uniqueness, description-quality check, broken links/connections) with pass/fail/warn states.
- **Publish** → package + version (v1.0.0) → land on the skill's Wiki Detail page.
- **Skill Wiki Detail** (`/skill/:slug`): rendered SKILL.md, dept/status/version badges, owner, right-rail frontmatter metadata, tabs (Overview, Connections, Versions, Deployments, Governance).
- **Connection Graph** (with mandatory accessible list/table fallback).
- **Version History** with version list + diff + per-version validation log.
- **Governance Dashboard** (rollups, review queue, audit trail).
- **Department Directory** (`/departments`, `/departments/:dept`).
- **Cross-surface Deploy flow** (surface picker + version pin → deployment record + install snippet; connectors may be stubbed for MVP).
- Role-gated controls (`skill.author`, `dept.lead`, `gov.admin`, `agent.builder`, `reader`).
- Seed data and the tenexity-design tokens shipped verbatim.

**Deferred (post-MVP):**
- Live git round-trip with real multi-repo ingestion/reconciliation (MVP may use a single managed store behind the interface).
- Real deploy connectors to production Claude.ai / Claude Code / Claude API targets.
- LLM-based / live-trigger description-quality evaluation (MVP uses heuristic rules).
- Runtime trigger telemetry / reuse measurement from production runtimes.
- Bulk import / auto-metadata extraction migration of an existing skill pile.
- Comments/review threads, notifications, co-pilot authoring assistance, semantic search.
- Multi-tenancy / cross-org sharing & forking; CLI/API authoring surface for technical authors.
- Script security scanning/sandbox (integration, not built).

---

## Features

1. **Skill Catalog / Browse** — Primary discovery surface (`/`, `/catalog`): card grid with global search, left-rail department facets, and status/tag/owner/surface filters; sort + grid⇄table toggle; prominent **New Skill** CTA.
2. **Skill Wiki Detail** — Canonical per-skill page (`/skill/:slug`): rendered SKILL.md body, header badges (department, governance status, version), owner, right-rail frontmatter key/values, and tabs (Overview, Connections, Versions, Deployments, Governance); role-gated Edit/Approve/Deploy/New Version actions.
3. **Authoring Editor with SKILL.md frontmatter validation** — Guided create/edit (`/skill/new`): metadata fieldset (name, description, department, tags, visibility) + SKILL.md editor with live preview, a **Validate** button, and a rule-by-rule results panel (pass/fail/warn + line refs); **Publish** / **Save draft** with an unsaved-changes guard.
4. **Validation Pipeline** — Lints frontmatter schema, required fields, name uniqueness, **description quality** (heuristic), broken links, and declared connections; deterministic and fast; gates Publish.
5. **Connection Graph** — Interactive node-link view of depends-on / supersedes / related-to edges, department-colored nodes, focus/neighborhood spotlight, plus a **mandatory accessible list/table fallback**.
6. **Version History** — Semver version timeline with author/date/status, side-by-side SKILL.md + frontmatter diff, per-version validation log, and role-gated promote/rollback.
7. **Governance Dashboard** — Org-wide rollup cards (total, unowned, stale, pending review, policy violations), charts by department, a review queue, a filterable **audit trail**, and a policy editor (required fields, allowed departments, review SLAs).
8. **Department Directory** — Department grid (lead, skill count, health) and a department detail = catalog scoped to that department + dept-level governance summary + lead actions.
9. **Cross-surface Deploy** — Modal/drawer to pick a target surface (Claude Code / Web Agent / Slack bot) and pin a version; produces a deployment record + copyable install snippet, surfaced on the Deployments tab.
10. **Role-based access & governance status model** — Draft / In Review / Approved / Deprecated lifecycle with role-gated transitions, badges everywhere, and audit logging.

---

## Non-Functional Requirements

- **Performance:** Catalog and detail pages render meaningful content under typical load with skeleton states for async data. Validation of a well-formed SKILL.md body is **synchronous/fast and deterministic** (no flaky network) so Publish is reliably reachable. Publish completes and routes to the detail page before downstream reads.
- **Accessibility (WCAG 2.1 AA):** Full keyboard navigation with logical tab order and a visible focus ring (≥3:1). Text contrast ≥4.5:1 (≥3:1 large); UI components/focus ≥3:1. Governance status conveyed by **badge text + icon, never color alone**. Proper landmark + heading hierarchy (single H1 per page; rendered SKILL.md = one H1, stepped H2/H3). ARIA tabs pattern; labelled form fields with `aria-describedby` for errors. Focus moves to dialog on open and returns on close; route changes move focus to the main H1; validation completion announces via `aria-live="polite"`. Respect `prefers-reduced-motion`.
- **Connection Graph a11y (critical):** The SVG/canvas graph carries `role="application"` + `aria-label`, keyboard-focusable nodes with arrow-key traversal, selected-node announcement via `aria-live`, and a **always-available equivalent list/table fallback** enumerating nodes and directed edges. No meaning by color alone — pair department color with text label/shape.
- **Security & governance:** Role-gated write actions (author/lead/admin/builder) with read-only `reader`; required governance metadata enforced at publish (owner, sensitivity, data scope, approval state, review date); full audit trail of approvals/deprecations/deployments; progressive enforcement (light for drafts, strict at publish).
- **Browser support:** Current evergreen Chromium, Firefox, and Safari; Chromium headless must pass the Stage-3 Playwright happy-flow gate.
- **Mandatory brand constraint (Stage-3 gate):** The app **must ship `skills/tenexity-design/tokens.css` verbatim** as the base of its global stylesheet (existing tokens may not be deleted or edited; additions allowed), adopt the `tenexity-design/tailwind.config.ts` theme block, and reference colors only via `hsl(var(--token))` / Tailwind theme keys (never raw hex). The **served CSS must contain the literal token `--brand: 214 100% 55%`**. Light-first; the `.dark` block ships as the opt-in. Restyling the brand fails the gate.

---

## Acceptance Criteria

Written in Given / When / Then with a **Verification** line each. **AC-1 is the Stage-3 Playwright gate** and encodes CHROMA's primary happy-flow click-path end-to-end.

**AC-1 — Primary happy flow: author → validate → publish → catalog (the gate).**
- **Given** a user on the Skill Catalog at `/` where the heading "Skill Catalog" and a button with `data-testid="new-skill-button"` labeled "New Skill" are visible,
- **When** they click **New Skill** (loading the editor at `/skill/new` with heading "New Skill"), type `Invoice Summarizer` into the Name field (`data-testid="skill-name-input"`), type `Summarizes uploaded invoices into a structured digest.` into the Description field (`data-testid="skill-description-input"`), select `Finance` in the Department select (`data-testid="skill-department-select"`), paste the valid SKILL.md body (frontmatter `name: invoice-summarizer`, `description: Summarizes uploaded invoices into a structured digest.`, `department: Finance`, plus a `# Invoice Summarizer` body) into the editor (`data-testid="skill-body-editor"`), click **Validate** (`data-testid="validate-button"`), and then click **Publish** (`data-testid="publish-button"`),
- **Then** the validation panel (`data-testid="validation-status"`) shows `passed` with the text "Validation passed" and Publish becomes enabled; clicking Publish navigates to `/skill/invoice-summarizer` where `data-testid="skill-detail-title"` is an H1 reading "Invoice Summarizer" with a "Finance" department badge, a "v1.0.0" version badge, and a governance status badge (e.g. "Draft"); and navigating back to `/` shows a catalog card `data-testid="skill-card-invoice-summarizer"` titled "Invoice Summarizer" with a "Finance" badge.
- **Verification:** Playwright (headless Chromium) drives the exact click-path above using the listed `data-testid` selectors and asserts each "Expect"; the artifact is durable (the card persists on reload).

**AC-2 — Validation blocks publishing an invalid skill.**
- **Given** the authoring editor with a SKILL.md missing a required field (e.g. no `description`) or a duplicate `name`,
- **When** the author clicks **Validate**,
- **Then** the panel shows a fail state with per-rule results and line refs, and the **Publish** button remains disabled.
- **Verification:** Playwright submits an invalid body, asserts `validation-status` is `failed`/not `passed` and that `publish-button` is disabled.

**AC-3 — Department faceting filters the catalog.**
- **Given** a populated catalog with skills in multiple departments,
- **When** a user selects the `Finance` department facet,
- **Then** only Finance skills are shown and the result count updates accordingly.
- **Verification:** Playwright clicks the Finance facet and asserts every visible card carries a "Finance" badge.

**AC-4 — Department Lead approves a skill and the badge updates everywhere.**
- **Given** a `dept.lead` viewing a Draft skill's Wiki Detail in their department,
- **When** they click **Approve**,
- **Then** the governance status transitions to Approved, is audit-logged, and the badge reflects "Approved" on both the detail page and the catalog card.
- **Verification:** Authenticated as `dept.lead`, approve and assert the badge text on detail and catalog; assert an audit entry exists.

**AC-5 — Connection graph has an accessible list fallback.**
- **Given** a skill with declared connections on the Connections tab,
- **When** a keyboard/screen-reader user toggles the list/table fallback,
- **Then** an equivalent table enumerating nodes and directed edges is shown, the graph container has `role="application"` + `aria-label`, and nodes are keyboard-focusable.
- **Verification:** Automated a11y check (axe) on the graph view + Playwright asserts the fallback table is present and reachable, and that status/department are not color-only.

**AC-6 — Version history records and diffs versions.**
- **Given** a published skill that has had a second version saved,
- **When** a user opens the Versions tab,
- **Then** the version timeline lists each version with author/date/status and offers a side-by-side SKILL.md diff and per-version validation log.
- **Verification:** Create v1.0.0 then v1.1.0; assert both appear with a diff rendered between them.

**AC-7 — Read-only Reader sees no write controls.**
- **Given** a `reader` viewing the catalog and a skill detail,
- **When** the page renders,
- **Then** New Skill, Edit, Approve, and Deploy controls are hidden or disabled (with an explanatory tooltip), while browsing/search remain fully usable.
- **Verification:** Authenticated as `reader`, assert write controls are absent/disabled and catalog cards remain navigable.

**AC-8 — Brand token gate.**
- **Given** the deployed app,
- **When** its served CSS is fetched,
- **Then** the CSS contains the literal token `--brand: 214 100% 55%` and no raw-hex brand overrides replace it.
- **Verification:** Fetch the served stylesheet and assert it contains the substring `--brand: 214 100% 55%`.

**AC-9 — Deploy produces a record and install snippet.**
- **Given** an `agent.builder` on an Approved skill's detail page,
- **When** they open Deploy, pick a surface and pin a version, and confirm,
- **Then** a deployment record with an id + copyable install snippet is created and appears on the Deployments tab.
- **Verification:** Playwright runs the deploy flow and asserts a deployment id + snippet render on the Deployments tab.

---

## Out of Scope

Atlas is **NOT**:
- **The agent runtime** — it does not execute skills, run agents, or host the model; it prepares and governs artifacts, something else runs them.
- **A general-purpose IDE or codebase** — it manages skill bundles, not arbitrary application source.
- **A prompt/LLM-evaluation platform** — description-quality checks may borrow eval techniques, but model benchmarking is out of scope.
- **A security scanner / sandbox** — it may gate on or integrate with one, but deep code-security tooling is not built here.
- **An agent-building framework** — no agent orchestration, tools beyond skills, or conversation logic.
- **A generic document/knowledge wiki** — it is a *skill* wiki; wiki affordances exist to serve skill discovery and governance, not arbitrary docs.
- **A public, internet-wide directory** — Atlas is org-private (multi-tenant cross-org sharing is deferred).

---

## Ticket Seeds

The following ticket seeds decompose the MVP into buildable units, ordered so the primary happy flow (AC-1) comes up first and earns value early; each ticket seed is a short title + a one-line scope.

1. **Scaffold app + ship tenexity tokens** — Stand up the app shell (sidebar/department nav, page header, routing); ship `tokens.css` verbatim so served CSS contains `--brand: 214 100% 55%`; adopt the Tailwind theme block.
2. **Skill data model & store** — Define the Skill entity (name, slug, description, department, tags, visibility, version, governance status, owner, frontmatter, body, connections) behind a storage interface.
3. **Catalog page with department facets** — Build `/` and `/catalog`: search bar, left-rail department facets + status/tag filters, skill cards, `new-skill-button`, result count; `skill-card-<slug>` testids.
4. **Authoring editor (metadata + SKILL.md)** — Build `/skill/new`: metadata form (name/description/department/tags/visibility) + SKILL.md editor with live preview, save-draft, unsaved guard; required testids.
5. **Validation pipeline** — Frontmatter schema, required fields, name uniqueness, heuristic description quality, broken links/connections; deterministic, fast; `validate-button` + `validation-status` panel gating Publish.
6. **Publish + versioning (v1.0.0)** — Package the skill, assign v1.0.0, persist durably, route to the detail page on success.
7. **Skill Wiki Detail / wiki** — Build `/skill/:slug`: H1 `skill-detail-title`, dept/version/status badges, rendered SKILL.md, right-rail frontmatter, tab scaffold (Overview/Connections/Versions/Deployments/Governance).
8. **Version history + diff** — Versions tab: semver timeline, side-by-side SKILL.md/frontmatter diff, per-version validation log, role-gated promote/rollback.
9. **Connection graph + accessible fallback** — Interactive node-link graph (department-colored, focus spotlight) with `role="application"`, keyboard traversal, and the mandatory list/table fallback.
10. **Governance dashboard** — Rollup cards (total/unowned/stale/pending/violations), department charts, review queue, filterable audit trail, policy editor.
11. **Department directory** — `/departments` grid + `/departments/:dept` scoped catalog with dept-level governance summary and lead actions.
12. **Cross-surface deploy flow** — Deploy modal: surface picker + version pin → deployment record + copyable install snippet on the Deployments tab (connectors stubbed for MVP).
13. **Roles & governance status transitions** — Role gating (author/lead/admin/builder/reader), Draft→In Review→Approved→Deprecated transitions, audit logging, badges everywhere.
14. **Accessibility pass** — Keyboard nav, focus management/focus return on dialogs, `aria-live` validation announcements, contrast, `prefers-reduced-motion`; run axe on key screens.
15. **Seed data** — Load representative skills across departments (incl. Finance) so the catalog, facets, graph, and dashboard render populated states out of the box.
16. **Stage-3 happy-flow e2e test** — Playwright test encoding AC-1 end-to-end against the listed `data-testid` selectors, plus the `--brand: 214 100% 55%` CSS gate assertion.
