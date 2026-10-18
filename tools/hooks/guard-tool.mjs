#!/usr/bin/env node
// PreToolUse hook (Claude Code, Copilot in VS Code, Codex). Turns two team rules
// into hard checks:
// - Writes only inside this workspace and its client repos; never in the
//   rulebook (it's read-only: changes go through the weekly retro). Claude
//   Code's own files (~/.claude: plans, memory) stay writable.
// - A read of a whole file over ~300 lines is refused: search it or read the
//   part you need ("Keeping context small").
// Other tools pass through untouched (VS Code runs hooks for every tool).
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { within, needsConfirm } from '../workspace.mjs';
import { input, workspace, call, asList, emit } from './lib.mjs';

const inp = input();

// "Confirm once": a shell command that changes infrastructure, access or shared
// code always gets the tool's own approval prompt, even if similar commands were
// allowed before. Nothing is refused: the user approves and it runs.
const SHELLS = new Set(['Bash', 'PowerShell', 'run_in_terminal', 'shell', 'local_shell', 'exec_command']);
if (SHELLS.has(inp.tool_name)) {
  const ti = inp.tool_input || {};
  const cmd = Array.isArray(ti.command) ? ti.command.join(' ') : String(ti.command ?? ti.cmd ?? '');
  const what = needsConfirm(cmd);
  if (what && workspace(inp)) {
    emit({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask',
      permissionDecisionReason: `${what}. Check the target (account, subscription, environment) and the impact the agent stated, then allow it to run.` } });
  }
  process.exit(0);
}

const c = call(inp);
const here = c.kind && c.files.length ? workspace(inp) : null;
if (!here) process.exit(0);
const { ws, cfg } = here;
const deny = (reason) => { emit({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }); process.exit(0); };

if (c.kind === 'read') {
  const [file] = c.files;
  if (c.ranged || !existsSync(file) || statSync(file).size > 50_000_000) process.exit(0);
  const n = readFileSync(file, 'utf8').split('\n').length;
  if (n > 300) deny(`${file} is ${n} lines (over ~300): search it, or read only the part you need (e.g. the last 80 lines, from line ${n - 80}).`);
  process.exit(0);
}

const allowed = [ws, ...asList(cfg.repos), join(homedir(), '.claude')];
for (const file of c.files) {
  if (cfg.framework && within(file, cfg.framework)) {
    deny('The rulebook is read-only from a workspace. Rulebook changes go through the weekly retro report: log the idea with the log-feedback skill instead.');
  }
  if (!allowed.some((root) => within(file, root))) {
    deny(`${file} is outside this client's workspace and repos. Write only inside ${ws}${asList(cfg.repos).length ? ` or ${asList(cfg.repos).join(', ')}` : ''}. If the user really wants a file elsewhere, give them its content to save themselves.`);
  }
}
