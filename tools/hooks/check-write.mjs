#!/usr/bin/env node
// PostToolUse hook (Claude Code), after Write / Edit / MultiEdit in the workspace
// (not client repos: they have their own scanners). The file is already written,
// so this tells the agent to fix it now:
// - possible secrets (the same patterns as snapshot/backup/doctor);
// - inventory.md lines just written that aren't in the one-line format.
import { readFileSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { within, canon, SCANNED, SECRET_PATTERNS } from '../workspace.mjs';
import { input, workspace, target, asList, emit } from './lib.mjs';

const inp = input();
const here = workspace(inp);
const file = target(inp);
if (!here || !file || !existsSync(file)) process.exit(0);
const { ws, cfg } = here;
if (!within(file, ws) || asList(cfg.repos).concat(join(ws, 'repos')).some((r) => within(file, r))) process.exit(0);

const rel = canon(file).slice(canon(ws).length + 1);
const problems = [];

if (SCANNED.test(basename(file))) {
  readFileSync(file, 'utf8').split('\n').forEach((l, i) => {
    for (const [kind, re] of SECRET_PATTERNS) if (re.test(l)) problems.push(`Possible secret at ${rel}:${i + 1} (${kind}).`);
  });
  if (problems.length) problems.push('Redact it now (name where the secret lives, never its value) and tell the user to rotate it if it was real.');
}

// inventory.md: check only the lines this call wrote (older lines may predate the format).
if (rel === 'inventory.md') {
  const ti = inp.tool_input || {};
  const written = [ti.content, ti.new_string, ...(ti.edits || []).map((e) => e.new_string)].filter(Boolean).join('\n');
  const body = written.replace(/<example>[\s\S]*?<\/example>/g, '');
  const bad = body.split('\n').filter((l) => /^- /.test(l)).filter((l) => {
    const f = l.slice(2).split(' · ');
    return f.length !== 9 || !/^\d{4}-\d{2}-\d{2}$/.test(f[8].trim());
  });
  if (bad.length) {
    problems.push(`inventory.md: ${bad.length} line(s) not in the format \`env · type · name · scope/ID · IP/CIDR/endpoint · owner · repo/IaC path · source · YYYY-MM-DD\` (9 fields, "-" for unknown): ${bad.slice(0, 3).map((l) => `"${l.slice(0, 80)}"`).join(', ')}. Rewrite them.`);
  }
}

if (problems.length) emit({ decision: 'block', reason: problems.join(' ') });
