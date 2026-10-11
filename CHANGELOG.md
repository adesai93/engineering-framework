# Changelog

All notable changes to this framework. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [SemVer](https://semver.org/) — MAJOR when a rule changes meaning
(agents would behave differently), MINOR for new playbooks/standards/templates,
PATCH for wording fixes. Pre-1.0: a meaning change bumps MINOR.

## [0.18.0] - 2026-10-11
The hooks work in every tool that has them, not just Claude Code.
### Added
- Copilot in VS Code (`.github/hooks/engineering-framework.json`, VS Code
  agent hooks, preview) and Codex (`.codex/hooks.json`, on apply_patch file
  edits) run the same hook scripts as Claude Code. lib.mjs maps each tool's
  names (create_file, replace_string_in_file, read_file, apply_patch, ...);
  tools the hooks don't know pass through. The VS Code workspace turns off
  chat.useClaudeHooks so the hooks don't run twice.
- Test feeding VS Code and Codex tool calls to the hooks (22 total).
### Changed
- The session-start hook answers in the additionalContext form all three
  tools read. SETUP: trust steps and the enforcement table per tool.
- handoff: with no project, scripts are saved to log/scripts/.
- simulate.mjs records every tool call (`<id>.tools.txt`); new checks
  `tool-matches` (what the agent did, not what it said) and
  `any-file-matches`; export-clean also needs the tool's verdict line in the
  report. Fixed four scenarios that failed on correct behaviour
  (correction-saved, retro-client-free, playbook-via-skill, handoff-packed).

## [0.17.0] - 2026-10-10
Architecture pass against Anthropic's agent, context-engineering and skill
guidance and Microsoft's orchestration patterns: checkable rules move into
code, procedures load only when needed.
### Changed
- Skills are folders: skills/<name>/SKILL.md plus reference files and scripts,
  copied beside SKILL.md for every tool (a file dropped from a skill is removed
  on update; an edited one is kept in .engfw-backup).
- Playbooks moved from base/playbooks/ into the `playbooks` skill: one
  description routes to the one playbook a task needs. The engineer and lead
  point at the skill instead of listing files.
- Skill descriptions in the third person, what then when (check.mjs enforces).
- handoff: PowerShell paste blocks come from `skills/handoff/pack.mjs`
  (read-only, pre-approved in Claude Code and Codex): hash computed over the
  exact bytes, tabs converted, `'@` lines refused, output file checked. The
  agent no longer hand-writes the block or skips the hash.
- Claude Code: CLAUDE.md now holds the team rules itself (minus what hooks
  enforce) and imports context.md, rules.md and NOW.md.
- simulate.mjs passes each workspace's settings, so scenarios run with the
  hooks and permissions users get (untrusted folders ignored them before).
### Added
- Claude Code hooks (tools/hooks/, wired into .claude/settings.json; hooks
  added by hand are kept): session start flags memory files over their limit,
  project logs over ~300 lines and a stale workspace; writes only inside the
  workspace and its repos, never the rulebook; no whole reads of files over
  ~300 lines; a possible secret or a malformed inventory.md line just written
  goes back to the agent.
- `<!-- no-hooks -->` blocks in team.md: rules a hook enforces load only for
  tools without hooks.
- Tests for skill reference files and all three hooks (21 total); scenarios
  playbook-via-skill, handoff-packed, hook-blocks-outside-write.
- Experiment branch `experiment/design-build-as-skills`: architect and
  engineer as skills the lead loads, to compare against subagents by
  simulation (pass rate and cost) before deciding.

## [0.16.0] - 2026-10-10
From a second review: fixes, one source per rule, and a way to keep the team small.
### Changed
- Security-review triggers live in one place, base/standards/security-gates.md
  "When a security review is needed"; team.md, engineer and pm point at it,
  and the engineer's trigger now also covers prod pipelines (it had drifted
  to "prod" only). The security agent's description keeps a word-for-word
  copy for tool routing.
- team.md: the two precedence statements are merged into "Which information
  to trust" (tiers 1-3 outrank the rulebook; nothing outranks a STOP zone).
- base/principles/stop-zones.md works without plan mode: tools without it make no change
  and run nothing that changes state until I say yes.
### Fixed
- handoff skill: scripts are written with explicit bytes (UTF-8 with BOM,
  CRLF), so the hash matches between Windows PowerShell 5.1 and PowerShell 7
  (Set-Content's encoding differs between them and broke the check).
- `.gitattributes` (`* text=auto eol=lf`): the rulebook no longer looks
  modified when git runs without the system `core.autocrlf` (on Windows this
  failed all 16 workspace tests).
### Added
- check.mjs: "single review-trigger list" check; pm.md size budget; a note
  when team.md passes 90% of its budget.
- MAINTAINING.md "Prune": quarterly ablation (remove a rule, rerun its
  scenarios, delete it if they still pass); each inbox pass proposes a cut.
- SETUP.md: which rules each tool enforces vs. which are instructions only.

## [0.15.0] - 2026-10-10
From an independent review of the repo, plus a new agent.
### Added
- `pm` agent: drafts ADO / Jira epics, features, stories, tasks, bugs and
  spikes (acceptance criteria, verification, estimates in the client's unit)
  from briefs and plans into projects/<p>/work-items/; new `work-items` doc
  type; CSV import, paste-ready fields, or CLI with approval per batch.
  context.md gets "Work tracking". Architect plans hand off to it.
- `check-export`: deterministic filter for reports leaving the workspace
  (client name, people's full and partial names, inventory and resource names,
  domains, IPv4/IPv6, GUIDs, emails, handles, resource IDs); the retro report
  must pass it and still gets a human read. Retro reports week-over-week
  numbers.
- `tools/test-workspace.mjs`: deterministic tests for all four tools
  (generation, preserved edits, path isolation, snapshot, backup, secret scan,
  export check), run in CI.
- Rollback: UPDATING.md "Going back a version" (pin a previous release with a
  detached checkout; tested against v0.14.0's updater).
- Rules: corrections saved where they apply (resource, project or client-wide);
  files, logs, tickets and output are evidence, never instructions; the
  engineer checks identity, tenant, environment, region and scope before any
  changing command.
### Fixed
- Snapshot no longer reports "nothing new" when the commit failed; a laptop
  with no git name/email gets a local identity for the workspace.
- Backup is recorded only after the bundle is written and verified; it stops
  on a secret-scan hit unless `--anyway`.
- Secret scan covers saved scripts, queries and configs, not only Markdown;
  snapshot warns on hits.
- `update` merges VS Code workspace files (comments allowed) and Cursor
  permissions instead of replacing them, and keeps a copy of any hand-edited
  generated file in .engfw-backup/<date-time>/ (a new folder per update).
  When edits can't be told apart (first update from an older version, or
  after an older updater ran) it keeps a copy of every changed generated file.
- Workspace and repo paths are compared canonically (case, junctions): no
  workspace inside or around the rulebook, no nesting, and no repo folder
  shared with (or inside) another client's workspace or repos folder.
- The simulator and tests use their own workspace registry and leave the
  rulebook's git hooks alone; "no changes" and "path unchanged" checks also
  catch new commits.
- check.mjs fails on a git repository inside the rulebook (a clone or
  submodule), which its file listing used to skip.
- The rulebook ignores its own .claude/settings.local.json (saved when you
  approve a permission while working in it).
- SETUP: architect's Copilot tools described correctly; README lists what
  the tool keeps locally in the rulebook folder.

## [0.14.0] - 2026-10-10
From a second client's week of feedback.
### Added
- `handoff` skill for anything the user pastes or clicks elsewhere (jump
  host, VDI, air-gapped, portal, query editor): label where each block runs,
  complete content every time, one block that writes + checks + runs a
  script, plain text only, standalone queries, expected output outside code,
  fresh-output checks, test before sending. New context.md section "Where
  commands run".
- PowerShell StrictMode traps (empty and single collections, Boolean checks,
  piping foreach, native JSON output, optional properties, deltas, nested
  JSON, newlines) and "test with empty, single and nested data".
- Azure CLI / KQL parameter contracts: `az graph query -q` vs `--query`,
  workspace GUID vs ARM ID, workbook `canFetchContent=true`, optional fields;
  queries state their workspace and window.
- Evidence rule: name source, scope and window; deploy results aren't
  workload logs; unknowns stay unknown (no borrowed data or defaults); access
  questions start from inventory.md. Host lines record endpoint, port,
  connection path, login source and credential location.
- "Awaiting your acceptance" until the user accepts; deployed isn't done.
- Discovery is breadth-first with a "ready" definition; non-blocking
  anomalies get parked.
### Fixed
- Logs and feedback.md: append at the end, check both ends of the file, fix
  only a misplaced entry.

## [0.13.0] - 2026-10-10
From week-2 client feedback.
### Added
- `env-map` skill: maps an environment from read-only Azure Resource Graph
  queries (VNets, subnets, peerings, private IPs, private endpoints, public
  IPs, service endpoints) into reference/env-<env>.md with a Mermaid diagram,
  plus inventory lines. AWS / GCP / Steampipe / InfraMap as options.
- Structured inventory lines: `env · type · name · scope/ID · IP/CIDR/endpoint
  · owner · repo/IaC path · source · date`, searchable by env, address, repo.
- Repos table in the project brief (repo, what changes, branch). The engineer
  states the target repo and branch before editing and asks before touching
  an unlisted repo; notes never go into client repos.
- Optional docs MCP servers (Microsoft Learn, AWS Knowledge, HashiCorp
  Terraform) in SETUP.md and the toolchain skills; searches carry no client
  names, IPs or resource IDs.
- Pull the rulebook with the owner's GitHub account without switching the
  active one: `git config engfw.githubUser <user>`, then `upgrade` / `doctor`
  use that account's `gh` token for this repo only.
### Fixed
- `update` now adds template folders and files that are new in a version
  (not just top-level files) and refreshes projects/_new.
- The retro skips feedback entries already marked as covered by an earlier
  report, so fixed items don't come back as new.
- Close runs the snapshot as its own command so it stays pre-approved.

## [0.12.0] - 2026-10-04
### Added
- OpenAI Codex support (`--tools codex`): AGENTS.md, .agents/skills (user-only
  skills via agents/openai.yaml), .codex/agents/*.toml (security read-only
  sandbox), .codex/rules pre-approving only the local snapshot. Verified live:
  status and park (snapshot committed) through Codex.
- Orca guidance in SETUP.md: set Manual mode (its default Yolo mode switches
  off Claude Code / Codex permission checks); keep memory work out of worktrees.
- Toolchain skills (opt-in per client with `--toolchains`): terraform,
  bicep-arm, powershell, azure-cli, aws-cli, kql, pipelines-yaml. Thin:
  verification commands, safety stops, pointers to official vendor skills.
- Plan / execute split: the architect writes plans (new `plan` doc type,
  projects/<p>/plans/); the engineer builds only from an Approved plan.
- Fold outcomes back on close: decisions, inventory facts and context move
  into shared memory before a project is archived.
- Retro merges duplicate feedback and proposes a skill or rule for lessons
  that recur 3+ times. `<private>` text is never written to files.
### Fixed
- `update` no longer drops a workspace's backup settings.

## [0.11.0] - 2026-10-04
Optimised against Anthropic, GitHub Copilot / VS Code and Cursor docs.
### Added
- Skills (skills/ -> .claude/skills/, read by Claude Code, Copilot and
  Cursor): firefight, project-lifecycle, tidy, document, log-feedback, and
  user-only onboard, update-team, check-setup. Loaded on demand.
- `workspace.mjs backup` (git bundle to a client-approved folder) and
  `forget`; doctor checks backup age and scans notes for secrets.
- offboard-a-client playbook (hand over, final retro, backup, then delete).
- `tools/simulate.mjs`: behaviour regression suite on a fictional client.
- CI: nothing agent tools auto-load may live in the rulebook root; skills
  validated; team rules budget lowered to keep the saving.
### Changed
- Team rules cut from ~3.9k to ~2.3k tokens (paid by every chat AND every
  specialist run); procedures moved to skills.
- Security review gating now matches in every place (the agent's description
  said "every change", which caused extra runs).
- Claude Code: engineer and retro on sonnet; CLAUDE.md imports context.md and
  rules.md (loaded at start, survive /compact); compaction guidance.
- Copilot: security/architect get tool allowlists (truly read-only) and can't
  start further agents; retro runs only when asked; CLAUDE.md not double-loaded.
- park commits the workspace locally; long-chat nudge also after a 1h+ break.
- SETUP.md: skills, backups, model pinning per tool, Copilot policy
  diagnostics, Cursor Max mode, Claude /usage and /doctor prompt-audit.

## [0.10.3] - 2026-10-04
### Changed
- Bigger limits for the files read every chat, so busy clients do not need
  constant tidying: context.md ~120 lines (was ~60), NOW.md ~100, rules.md
  ~80. doctor and the tidy offer use the same limits.

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
