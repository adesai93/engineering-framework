# Changelog

All notable changes to this framework. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [SemVer](https://semver.org/) — MAJOR when a rule changes meaning
(agents would behave differently), MINOR for new playbooks/standards/templates,
PATCH for wording fixes. Pre-1.0: a meaning change bumps MINOR.

## [0.2.0] - 2026-10-03
### Added
- The team: `agents/team.md` (lead + shared rules), `architect.md`,
  `engineer.md`, `security.md`, `retro.md`, written once and generated per tool (Claude
  Code subagents, Copilot custom agents with handoffs, instruction files).
- Client workspaces outside the repo (`tools/workspace.mjs new|update`):
  context.md, rules.md, NOW.md, projects (brief / next / log / decisions),
  monthly log, research, archive, repos. Own local git, no remote.
- Chat commands: status, new project, resume, quick, log, park, close,
  remember, correct, decide, research, design, build/fix/deploy, review.
- Just talk: the lead infers intent (corrections, decisions, switching,
  wrap-up, learning questions) and does the bookkeeping; commands are optional.
- Corrections and decisions become standing rules (rules.md) every agent reads.
- Pair mode for firefights (batched read-only checks, live UTC timeline) and
  `document` to draft the doc afterwards.
- inventory.md: durable facts saved from what I paste, every turn.
- Weekly improvement loop: feedback.md entries + `retro` agent writing a
  client-free, leak-checked report; MAINTAINING.md to process it here.
- Playbooks: build-a-platform (iterative, lens + security review per
  increment, hardening rounds), prove-a-design (sandbox PoC with evidence).
- Lenses add resilience and scale. docs/how-it-works.svg diagram.
- `base/lenses.md` (identity, network, security, data, CI/CD,
  observability, cost); `base/principles/stop-zones.md` as the one STOP list.
- `base/templates/` — one template per doc type; `framework-version` field.
- Playbooks: change-iam-access, decommission-a-service. Light change approval
  step everywhere: follow the client's process if context.md defines one.
- COMMANDS.md; `tools/check.mjs` + GitHub Actions CI; this changelog.

### Changed
- Client overlays (governance / approved-tools / overrides / intake) folded
  into one workspace context.md; base files now point at context.md.
- fix-a-service: short inline diagnose step; doc = change-record.
- Security gate 7: elevated access must be time-bound.

### Removed
- `adapters/` (replaced by generated workspace files), `clients/_template/`
  (replaced by `workspace-template/`).

## [0.1.0] - 2026-10-03
### Added
- Initial base: principles, standards, four playbooks, client template, adapters.
