#!/usr/bin/env node
// PreToolUse hook (Claude Code). Turns two team rules into hard checks:
// - Writes (Write, Edit, MultiEdit, NotebookEdit) only inside this workspace and
//   its client repos; never in the rulebook (it's read-only: changes go through
//   the weekly retro). Claude Code's own files (~/.claude: plans, memory) stay writable.
// - Read of a file over ~300 lines without offset/limit is refused: search it
//   or read the part you need ("Keeping context small").
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { within } from '../workspace.mjs';
import { input, workspace, target, asList, emit } from './lib.mjs';

const inp = input();
const here = workspace(inp);
const file = target(inp);
if (!here || !file) process.exit(0);
const { ws, cfg } = here;
const deny = (reason) => { emit({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }); process.exit(0); };

if (inp.tool_name === 'Read') {
  const ti = inp.tool_input || {};
  if (ti.offset || ti.limit || !existsSync(file) || statSync(file).size > 50_000_000) process.exit(0);
  const n = readFileSync(file, 'utf8').split('\n').length;
  if (n > 300) deny(`${file} is ${n} lines (over ~300): search it with Grep, or Read with offset/limit (e.g. the last 80 lines: offset ${n - 80}).`);
  process.exit(0);
}

if (cfg.framework && within(file, cfg.framework)) {
  deny('The rulebook is read-only from a workspace. Rulebook changes go through the weekly retro report: log the idea with the log-feedback skill instead.');
}
const allowed = [ws, ...asList(cfg.repos), join(homedir(), '.claude')];
if (!allowed.some((root) => within(file, root))) {
  deny(`${file} is outside this client's workspace and repos. Write only inside ${ws}${asList(cfg.repos).length ? ` or ${asList(cfg.repos).join(', ')}` : ''}. If the user really wants a file elsewhere, give them its content to save themselves.`);
}
