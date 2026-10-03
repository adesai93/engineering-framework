# Changelog

All notable changes to this framework. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [SemVer](https://semver.org/) — MAJOR when a rule changes meaning
(agents would behave differently), MINOR for new playbooks/standards/templates,
PATCH for wording fixes. Pre-1.0: a meaning change bumps MINOR.

## [0.6.1] - 2026-10-03
### Changed
- A plain `git pull` of the rulebook is enough: a post-merge hook (installed
  by `new` / `update`) runs `workspace.mjs refresh` to regenerate every
  workspace on the machine; pulls are fast-forward only.
- UPDATING.md and "update the team": the agent pulls, reports what changed
  and asks for a new chat.

## [0.6.0] - 2026-10-03
### Added
- `workspace.mjs upgrade`: pulls main (fast-forward only) and updates every
  workspace on the machine (local, gitignored registry of workspace paths).
- Rulebook protection on client laptops: Claude Code deny rule on edits to the
  rulebook, VS Code read-only folder, and `upgrade` refuses when the rulebook
  has local changes or commits (shows them and how to drop them).

## [0.5.1] - 2026-10-03
### Changed
- Onboarding is fast: two replies (questions, then write context / NOW /
  rules and finish). No terminal commands or agent hand-offs during
  onboarding; "verify access" and "test the team" are optional later.

## [0.5.0] - 2026-10-03
### Added
- Which information to trust: a 6-tier order (rules > accepted decisions >
  context > dated inventory > closed outcomes > in-flight work). Plans build
  only on tiers 1-5; in-flight drafts and Proposed ADRs are labelled leads
  and appear as "pending change", never as the plan.
- decisions.md: one index of every Accepted decision across all projects,
  kept current by decide: and ADR status changes; read before planning.
- Project brief gets "Related work" with each item's status.

## [0.4.0] - 2026-10-03
### Added
- ONBOARDING.md + "onboard me": first-time workspace setup run by the lead
  (one batched interview, context/NOW/rules filled, access checked, inventory
  seeded, smoke test, handover).
- Client repos: team rules for working across many repos (repo's own rules
  apply inside it, one inventory line per repo, branch + PR, never commit
  workspace files into client repos); `--repos <dir>` for existing clones.

## [0.3.0] - 2026-10-03
### Changed
- Security is advisory. The security agent reports findings by severity
  (Critical/High flagged at the top, with fixes) and never blocks; each
  client's own scanners and pipelines do the blocking at their thresholds
  (recorded in context.md). Disabling or bypassing a client's scanner is still
  a STOP zone (gate weakening).
- Security verdict is CLEAR / FINDINGS instead of PASS / FAIL; findings come
  to me to decide, instead of looping back to the engineer.

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
