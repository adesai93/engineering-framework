#!/usr/bin/env node
// PostToolUse hook (Claude Code, Copilot in VS Code, Codex), after a file write
// in the workspace (not client repos: they have their own scanners). The file is
// already written, so this tells the agent to fix it now:
// - possible secrets (the same patterns as snapshot/backup/doctor);
// - inventory.md lines just written that aren't in the one-line format.
import { readFileSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { within, canon, SCANNED, SECRET_PATTERNS } from '../workspace.mjs';
import { input, workspace, call, asList, emit } from './lib.mjs';

const inp = input();
const c = call(inp);
const here = c.kind === 'write' && c.files.length ? workspace(inp) : null;
if (!here) process.exit(0);
const { ws, cfg } = here;
const problems = [];

for (const file of c.files) {
  if (!existsSync(file) || !within(file, ws) || asList(cfg.repos).concat(join(ws, 'repos')).some((r) => within(file, r))) continue;
  const rel = canon(file).slice(canon(ws).length + 1);
  const found = [];
  if (SCANNED.test(basename(file))) {
    readFileSync(file, 'utf8').split('\n').forEach((l, i) => {
      for (const [kind, re] of SECRET_PATTERNS) if (re.test(l)) found.push(`Possible secret at ${rel}:${i + 1} (${kind}).`);
    });
    if (found.length) found.push('Redact it now (name where the secret lives, never its value) and tell the user to rotate it if it was real.');
  }
  problems.push(...found);

  // inventory.md: check only the lines this call wrote (older lines may predate the format).
  if (rel === 'inventory.md') {
    const body = c.text.replace(/<example>[\s\S]*?<\/example>/g, '');
    const bad = body.split('\n').filter((l) => /^- /.test(l)).filter((l) => {
      const f = l.slice(2).split(' · ');
      return f.length !== 9 || !/^\d{4}-\d{2}-\d{2}$/.test(f[8].trim());
    });
    if (bad.length) {
      problems.push(`inventory.md: ${bad.length} line(s) not in the format \`env · type · name · scope/ID · IP/CIDR/endpoint · owner · repo/IaC path · source · YYYY-MM-DD\` (9 fields, "-" for unknown): ${bad.slice(0, 3).map((l) => `"${l.slice(0, 80)}"`).join(', ')}. Rewrite them.`);
    }
  }
}

if (problems.length) emit({ decision: 'block', reason: problems.join(' ') });
