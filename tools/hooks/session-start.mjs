#!/usr/bin/env node
// SessionStart hook (Claude Code): runs at startup, resume, /clear and after
// compaction. CLAUDE.md already imports context.md, rules.md and NOW.md; this
// adds only what needs computing: memory files over their limit, project logs
// over ~300 lines, and a workspace generated from an older rulebook.
// Plain stdout becomes context for the agent. Silent when all is well.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { MEMORY_LIMITS, frameworkVersion } from '../workspace.mjs';
import { input, workspace } from './lib.mjs';

const here = workspace(input());
if (!here) process.exit(0);
const { ws, cfg } = here;
const lines = (p) => readFileSync(p, 'utf8').split('\n').length;
const notes = [];

for (const [f, max] of MEMORY_LIMITS) {
  const p = join(ws, f);
  if (existsSync(p) && lines(p) > max) notes.push(`${f} is ${lines(p)} lines (limit ~${max})`);
}
const projects = join(ws, 'projects');
if (existsSync(projects)) {
  for (const d of readdirSync(projects, { withFileTypes: true })) {
    const p = join(projects, d.name, 'log.md');
    if (d.isDirectory() && existsSync(p) && lines(p) > 300) notes.push(`projects/${d.name}/log.md is ${lines(p)} lines (limit ~300)`);
  }
}
const out = [];
if (notes.length) out.push(`Workspace check: ${notes.join('; ')}. In your session summary, add one line offering \`tidy\`.`);
const rulebook = frameworkVersion();
if (cfg.version && cfg.version !== rulebook) out.push(`Workspace check: generated from rulebook v${cfg.version}, the rulebook is v${rulebook}. Tell the user once: say "update the team" to refresh it.`);
if (out.length) process.stdout.write(out.join('\n') + '\n');
