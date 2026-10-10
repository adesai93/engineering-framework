// Shared by the Claude Code hooks in this folder (wired into each workspace's
// .claude/settings.json by tools/workspace.mjs). A hook that can't work out
// where it is does nothing: Claude Code's own permission flow still applies.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve, isAbsolute } from 'node:path';
import { CONFIG } from '../workspace.mjs';

export function input() {
  try { return JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { return {}; }
}

// The client workspace: Claude Code's project dir, else the nearest folder up
// from cwd that has .engineering-framework.json. null = not in a workspace.
export function workspace(inp) {
  const starts = [process.env.CLAUDE_PROJECT_DIR, inp.cwd, process.cwd()].filter(Boolean);
  for (const s of starts) {
    for (let d = resolve(s); ; d = dirname(d)) {
      if (existsSync(join(d, CONFIG))) {
        let cfg = {};
        try { cfg = JSON.parse(readFileSync(join(d, CONFIG), 'utf8')); } catch { /* keep {} */ }
        return { ws: d, cfg };
      }
      if (dirname(d) === d) break;
    }
  }
  return null;
}

// The file a tool call targets, as an absolute path (or null).
export function target(inp) {
  const ti = inp.tool_input || {};
  const p = ti.file_path || ti.notebook_path || ti.path;
  if (!p) return null;
  return isAbsolute(p) ? p : resolve(inp.cwd || process.cwd(), p);
}

export const asList = (r) => (r ? (Array.isArray(r) ? r : [r]) : []);
export const emit = (obj) => process.stdout.write(JSON.stringify(obj));
