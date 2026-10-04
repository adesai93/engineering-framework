# Changelog

All notable changes to this framework. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [SemVer](https://semver.org/) — MAJOR when a rule changes meaning
(agents would behave differently), MINOR for new playbooks/standards/templates,
PATCH for wording fixes. Pre-1.0: a meaning change bumps MINOR.

## [0.10.2] - 2026-10-04
### Added
- context.md overflow rule: tidy keeps the every-task essentials and moves
  detail to inventory.md or reference/<topic>.md with a one-line pointer;
  nothing is deleted. New reference/ folder in the workspace template.

## [0.10.1] - 2026-10-04
### Fixed
- Bookkeeping is confirmed only after the write succeeds; a blocked write
  says "⚠️ Not saved" with the exact line to add (it used to report "saved").
- Long-chat nudge fires on the 3rd separate piece of real work or ~20+
  reads/commands (quick questions don't count); it never fired before.

## [0.10.0] - 2026-10-04
First real-use feedback round (12 items from 4 hours at a client).
### Added
- `workspace.mjs doctor [<workspace>]`: one-screen OK/FIX health check;
  "check setup" runs it.
- `--repos` is repeatable (several folders or single repo folders).
- discover-a-client playbook: plan logins up front (one batch, shared SSO),
  read the client's docs first, then verify live; differences are questions
  until checked against their plans.
- How we talk: one decision per reply, side findings to a Backlog, explain
  when I'm lost, recap when the plan changes.
- Deploy path: confirmed before a build is routed; recorded in the brief.
- Onboarding detects the wrong window and says how to open the workspace;
  skims a reachable ticket tracker before asking.
### Changed
- Workspaces are only generated from the released rulebook: `new`/`update`
  refuse on uncommitted edits, local commits or missed updates (maintainer
  machine warns only); the workspace records the rulebook commit.
- Node runs with OPENSSL_CONF cleared in the pull hook and tool; a failed
  refresh after `git pull` is reported loudly.
- Git errors explained: "Repository not found" = wrong GitHub account, not
  network.
- Concurrent chats: re-read shared files before writing, edit only your
  lines; trimming moves out of park (tidy / session start offer).
- Learning questions: explain the concept first, then what's known/unknown
  about this client (context + inventory only, no workspace-wide search).
- Multi-session work: the project is created straight away, not asked about.
- Retro reports: no personal names at all (also names only seen in chat);
  self-check scans capitalized words, emails and handles.

## [0.9.0] - 2026-10-04
### Changed
- Lower model usage: security reviews only designs and risky changes
  (identity, network exposure, secrets, data deletion, prod) or on "review";
  small tasks stay with the lead (no hand-off); bookkeeping is batched into one
  set of edits per reply instead of separate tool calls.
### Added
- SETUP.md "Model choice and cost": mid-tier model as daily driver, top model
  for hard problems, park long chats.

## [0.8.3] - 2026-10-04
### Added
- Long-chat nudge: the lead suggests "park and start a new chat" once a chat
  has covered a third project/topic or done a lot of reading and commands.

## [0.8.2] - 2026-10-04
### Changed
- `tidy` commits the workspace before and after (local git only), so a
  merge it got wrong can be undone ("undo tidy").

## [0.8.1] - 2026-10-03
### Added
- CI "provenance" job: a commit pushed to main without a merged pull request
  fails (red X + email), so a push from a client laptop is caught.

## [0.8.0] - 2026-10-03
### Added
- Long-term size limits: every-chat files (context, rules, NOW) capped at a
  page; project logs rotate past ~300 lines (older entries to log-<YYYY>.md);
  superseded rules/decisions move to history/; never read a 300+ line file
  whole. `tidy` does it on demand; the lead offers it when a file is over.
- Client laptops are pull-only: workspace.mjs points the rulebook's push URL
  at a blocker (maintainer machine opts out via engfw.maintainer); UPDATING.md
  covers the GitHub ruleset on main and read-only tokens.
- CI size budget for the team rules (agents/team.md <= ~4k tokens, each
  specialist <= ~750) so weekly changes can't quietly bloat every chat.

## [0.7.2] - 2026-10-03
### Fixed
- "update the team" also runs `workspace.mjs update` on the current
  workspace, so it works on laptops where the pull hook isn't installed yet.

## [0.7.1] - 2026-10-03
### Added
- SETUP.md: per-tool setup, verification checklist and gotchas for Claude
  Code, Copilot and Cursor; "check setup" command walks it with me.
### Fixed
- Agent frontmatter is plain YAML (Cursor showed quoted descriptions
  literally). Verified in Cursor 3.7: rules (AGENTS), all four subagents and
  the read-only rulebook are detected.
- .code-workspace explicitly enables Copilot instruction files.

## [0.7.0] - 2026-10-03
### Added
- Cursor support (`--tools cursor`): team rules via AGENTS.md (read natively),
  subagents in .cursor/agents/ (security is readonly), .cursor/cli.json deny
  on rulebook writes, and the shared .code-workspace (rulebook read-only).

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
