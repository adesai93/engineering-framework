// Shared by the hooks in this folder. tools/workspace.mjs wires them into
// Claude Code (.claude/settings.json), Copilot in VS Code (.github/hooks/) and
// Codex (.codex/hooks.json); all three send the same JSON on stdin and read the
// same answers, but name their tools differently: call() hides that. A hook
// that can't work out where it is does nothing: the tool's own permissions apply.
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

const READS = new Set(['Read', 'read_file']);
const WRITES = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit', // Claude Code
  'create_file', 'replace_string_in_file', 'multi_replace_string_in_file', 'insert_edit_into_file', 'edit_notebook_file', // VS Code
  'apply_patch']); // Codex and VS Code

// Files named in an apply_patch body, and the lines it adds.
function patch(text) {
  const files = []; const added = [];
  for (const l of String(text).split('\n')) {
    const m = l.match(/^\*\*\* (?:Add File|Update File|Move to): (.+)$/);
    if (m) files.push(m[1].trim());
    else if (l.startsWith('+')) added.push(l.slice(1));
  }
  return { files, text: added.join('\n') };
}

// One tool call, whichever tool made it:
// { kind: 'read' | 'write' | null, files: [absolute paths], ranged, text }.
// text = what a write puts in the file(s); ranged = a read of part of a file.
export function call(inp) {
  const name = inp.tool_name || ''; const ti = inp.tool_input || {};
  const abs = (p) => (isAbsolute(p) ? p : resolve(inp.cwd || process.cwd(), p));
  const kind = READS.has(name) ? 'read' : WRITES.has(name) ? 'write' : null;
  if (!kind) return { kind, files: [], ranged: false, text: '' };
  if (name === 'apply_patch') {
    const p = patch(ti.command ?? ti.input ?? ti.patch ?? '');
    return { kind, files: p.files.map(abs), ranged: false, text: p.text };
  }
  const reps = ti.replacements || [];
  const files = [ti.file_path, ti.notebook_path, ti.filePath, ti.path, ...reps.map((r) => r.filePath)].filter(Boolean).map(abs);
  const text = [ti.content, ti.new_string, ti.newString, ti.code, ti.new_source, ti.newCode,
    ...(ti.edits || []).map((e) => e.new_string), ...reps.map((r) => r.newString)].filter((x) => typeof x === 'string').join('\n');
  const ranged = [ti.offset, ti.limit, ti.startLine, ti.endLine].some((x) => x !== undefined && x !== null);
  return { kind, files: [...new Set(files)], ranged, text };
}

export const asList = (r) => (r ? (Array.isArray(r) ? r : [r]) : []);
export const emit = (obj) => process.stdout.write(JSON.stringify(obj));
