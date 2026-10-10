#!/usr/bin/env node
// Framework CI check: node tools/check.mjs (from anywhere). Node built-ins only.
// Exit 0 = every check passed. Exit 1 = failures, each printed as file:line: reason.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, posix } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, loadAgents, loadSkills, render } from './workspace.mjs';

const STOP_ZONES = 'base/principles/stop-zones.md';
const DOC_STANDARD = 'base/standards/documentation.md';
const CHANGELOG = 'CHANGELOG.md';
// Only a slash-token starting with one of these is a path ("Terraform/Bicep" is not).
// Workspace paths (projects/, research/, log/) live in client workspaces, not here.
const TOP_DIRS = ['base', 'agents', 'skills', 'tools', 'workspace-template'];
// Bare names: "stop-zones.md", "check.mjs". No yml/yaml: bare ones (azure-pipelines.yml,
// buildspec.yml, cloudbuild.yaml) name client-repo files.
const BARE_EXT = ['md', 'mdc', 'mjs'];
// Intentional mentions of names that are not files in this repo. Keep minimal; say why:
// AGENTS.md / CLAUDE.md / copilot-instructions.md are generated INTO client workspaces by
// tools/workspace.mjs; README.md exists per folder, so a bare mention is never unique.
const ALLOWLIST = new Set(['AGENTS.md', 'CLAUDE.md', 'copilot-instructions.md', 'README.md']);
// History names files as they were (incl. removed/renamed ones): refs there are not resolved.
const SKIP_REFS_IN = new Set([CHANGELOG]);

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const read = (p) => readFileSync(join(ROOT, p), 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const lines = (p) => read(p).split('\n');
const fail = (file, line, reason) => ({ file, line, reason });

// Files git would commit: tracked + untracked-but-not-ignored (identical to tracked in CI).
// Without git, walk the tree, skipping .git and the layers .gitignore keeps local — except
// in CI, where the checkout holds only committed files and check f must still see them.
function listFiles() {
  try {
    const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const files = out.split('\0').filter((p) => p && !p.endsWith('/') && existsSync(join(ROOT, p)));
    return { viaGit: true, files: [...new Set(files)].sort() };
  } catch {
    return { viaGit: false, files: walk('').sort() };
  }
}
const WALK_SKIP = process.env.CI ? /^(\.git|node_modules)$/
  : /^(\.git|node_modules|projects|clients)$|\.local\.md$/;
function walk(dir) {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) => {
    const p = dir ? `${dir}/${e.name}` : e.name;
    if (WALK_SKIP.test(p)) return [];
    return e.isDirectory() ? walk(p) : [p];
  });
}

// a. Team definitions: agents/team.md plus specialists with a name, a description and
// valid handoff targets, and they render for every tool without error.
function checkAgents(ctx) {
  const out = [];
  if (!ctx.fileSet.has('agents/team.md')) out.push(fail('agents/team.md', 1, 'missing (lead + team rules)'));
  let agents = [];
  try { agents = loadAgents(); } catch (e) { return [...out, fail('agents/', 1, e.message)]; }
  const names = new Set(agents.map((a) => a.name));
  for (const a of agents) {
    if (!a.meta.name) out.push(fail(a.file, 1, 'frontmatter needs "name:"'));
    if (!a.meta.description) out.push(fail(a.file, 1, 'frontmatter needs "description:" (tools route on it)'));
    for (const h of a.handoffs) {
      if (!names.has(h.agent)) out.push(fail(a.file, 1, `handoff to unknown agent "${h.agent}"`));
      if (!h.label || !h.prompt) out.push(fail(a.file, 1, 'handoff needs "agent | label | prompt"'));
    }
  }
  // Skills: name matches the file, a description that says when to use it.
  let skills = [];
  try { skills = loadSkills(); } catch (e) { out.push(fail('skills/', 1, e.message)); }
  for (const s of skills) {
    if (s.name !== posix.basename(s.file, '.md')) out.push(fail(s.file, 1, `name "${s.name}" must match the file name`));
    if (!/^[a-z0-9-]+$/.test(s.name)) out.push(fail(s.file, 1, 'name: lowercase letters, digits, dashes'));
    if (s.description.length < 20 || s.description.length > 1000) out.push(fail(s.file, 1, 'description must say when to use it (20-1000 chars)'));
    if (names.has(s.name)) out.push(fail(s.file, 1, `skill "${s.name}" clashes with an agent name`));
  }
  try { render({ framework: '/fw', tools: ['claude', 'copilot', 'cursor', 'codex'], client: 'check' }); } catch (e) {
    out.push(fail('tools/workspace.mjs', 1, `render failed: ${e.message}`));
  }
  return out;
}

// b. Every referenced framework path / bare filename exists.
const URL_RE = /\b[a-z][a-z0-9+.-]*:\/\/[^\s)>\]`'"]*/gi;
const PATH_RE = new RegExp(`(?<![\\w./~-])(?:${TOP_DIRS.map(esc).join('|')})/[^\\s\`'"()\\[\\]{}|,;:*!?]*`, 'g');
const BARE_RE = new RegExp(`(?<![\\w./~<>*@-])[A-Za-z0-9_][\\w.-]*\\.(?:${BARE_EXT.join('|')})(?![\\w/-])`, 'g');

function resolvePath(ref, ctx) {
  const p = ref;
  if (p.includes('<')) { // any other placeholder (e.g. <type>) = wildcard: needs >= 1 match
    const re = new RegExp(`^${p.split(/<[^>]*>/).map(esc).join('[^/]+')}${p.endsWith('/') ? '' : '$'}`);
    return ctx.files.some((f) => re.test(f));
  }
  return p.endsWith('/') ? ctx.files.some((f) => f.startsWith(p)) : ctx.fileSet.has(p);
}

function checkReferences(ctx) {
  const out = [];
  const byName = new Map(); // local-only files are check f's failures, not reference targets
  for (const f of ctx.files.filter((p) => !isLocalOnly(p))) byName.set(posix.basename(f), [...(byName.get(posix.basename(f)) || []), f]);
  for (const file of ctx.docs.filter((f) => !SKIP_REFS_IN.has(f) && !ctx.generated.has(f))) {
    lines(file).forEach((raw, i) => {
      // Drop URLs and _emphasis_ markers (template prompts are italic: "_... stop-zones.md._").
      const l = raw.replace(URL_RE, ' ').replace(/(^|[\s(])_+(?=\S)|(?<=\S)_+(?=[\s).,;:!?]|$)/g, '$1 ');
      for (const [tok] of l.matchAll(PATH_RE)) {
        const ref = tok.split('#')[0].replace(/[.>]+$/, '');
        const last = ref.split('/').filter(Boolean).at(-1) || '';
        if (!ref.endsWith('/') && !/\.[A-Za-z0-9]{1,5}$/.test(last)) continue; // not path-ish
        if (ALLOWLIST.has(ref)) continue;
        ctx.refCount++;
        if (!resolvePath(ref, ctx)) out.push(fail(file, i + 1, `path not found: ${ref}`));
      }
      for (const [name] of l.matchAll(BARE_RE)) {
        if (ALLOWLIST.has(name)) continue;
        ctx.refCount++;
        const hits = byName.get(name) || [];
        if (!hits.length) out.push(fail(file, i + 1, `file not found: ${name}`));
        else if (hits.length > 1) out.push(fail(file, i + 1, `ambiguous: ${name} -> ${hits.join(', ')} (use the full path)`));
      }
    });
  }
  return out;
}

// c. Playbook shape: title, steps 1..N, approval / verify / doc / graduation steps, STOP line
// whose "Most likely here:" zones are zone names from stop-zones.md.
const STEP_PARTS = [['Change approval:', /Change approval:/], ['Verify:', /Verify:/],
  ['GATE — document:', /GATE — document:/], ['Graduation check:', /Graduation check:/]];
// Zone names = "## Zone N — <name>" headings + "N. <Name>:" items, lower-cased.
function zoneNames() {
  const text = read(STOP_ZONES);
  return new Set([...text.matchAll(/^## Zone \d+ — (.+)$/gm), ...text.matchAll(/^\d+\. ([^:]+):/gm)]
    .map((m) => m[1].trim().toLowerCase()));
}
function checkPlaybooks(ctx) {
  const out = [];
  const zones = ctx.fileSet.has(STOP_ZONES) ? zoneNames() : new Set();
  for (const p of ctx.files.filter((f) => /^base\/playbooks\/[^/]+\.md$/.test(f))) {
    const ls = lines(p);
    // Each step's text = its numbered line + indented continuation lines.
    const steps = ls.flatMap((l, i) => {
      if (!/^\d+\.\s/.test(l)) return [];
      let j = i + 1;
      while (j < ls.length && /^\s+\S/.test(ls[j])) j++;
      return [{ n: parseInt(l, 10), i, l: ls.slice(i, j).join(' ') }];
    });
    if (!ls.some((l) => /^# Playbook: \S/.test(l))) out.push(fail(p, 1, 'missing "# Playbook: <name>" title'));
    if (!steps.length) out.push(fail(p, 1, 'missing numbered steps'));
    steps.forEach((s, k) => {
      if (s.n !== k + 1) out.push(fail(p, s.i + 1, `step numbered ${s.n}, expected ${k + 1}`));
    });
    for (const [label, re] of STEP_PARTS) {
      if (!steps.some((s) => re.test(s.l))) out.push(fail(p, 1, `missing a "${label}" step`));
    }
    if (steps[0] && !/context.md/.test(steps[0].l)) out.push(fail(p, steps[0].i + 1, 'step 1 must read the client context.md'));
    const gate = steps.find((s) => /GATE — document:/.test(s.l));
    if (gate && !/ticket/.test(gate.l)) out.push(fail(p, gate.i + 1, '"GATE — document:" step must link the ticket'));
    const last = steps.at(-1);
    if (last && !/Graduation check:/.test(last.l)) out.push(fail(p, last.i + 1, 'final step must be "Graduation check:"'));
    const stop = ls.findIndex((l) => /^STOP-and-confirm:/.test(l));
    const end = Math.max(1, ls.findLastIndex((l) => l.trim()) + 1); // last non-blank line
    if (stop < 0) { out.push(fail(p, end, 'missing closing "STOP-and-confirm:" line')); continue; }
    if (!ls[stop].includes(STOP_ZONES)) out.push(fail(p, stop + 1, `STOP-and-confirm line must reference ${STOP_ZONES}`));
    // "Most likely here:" list runs to the end of the STOP paragraph; "(...)" notes are ignored.
    let j = stop + 1;
    while (j < ls.length && ls[j].trim()) j++;
    const likely = ls.slice(stop, j).join(' ').split('Most likely here:')[1];
    if (likely === undefined) { out.push(fail(p, stop + 1, 'STOP line must name "Most likely here:" zones')); continue; }
    for (const z of likely.replace(/\([^)]*\)/g, '').replace(/\.\s*$/, '').split(',').map((s) => s.trim().toLowerCase())) {
      if (z && !zones.has(z)) out.push(fail(p, stop + 1, `unknown zone "${z}" (not in ${STOP_ZONES})`));
    }
  }
  return out;
}

// d. One canonical STOP list. Heuristic: a STOP block is a heading naming STOP, or "stop
// zone(s)" / "stop and confirm" in any case (runs to the next heading), or a line, bullet or
// numbered step opening with such a "...:" label (runs to the next blank line). Outside
// stop-zones.md every block must point at stop-zones.md instead of keeping its own list.
// Mid-sentence markers ("No approval = STOP.") and "Stop traffic first:" are not blocks.
const isStop = (s) => /\bSTOP\b/.test(s) || /\bstop[ -](?:zones?|and[ -]confirm)\b/i.test(s);
function checkSingleStopList(ctx) {
  const out = [];
  for (const p of ctx.docs.filter((f) => f !== STOP_ZONES && !ctx.generated.has(f))) {
    const ls = lines(p);
    ls.forEach((l, i) => {
      const heading = /^#{1,6}\s/.test(l) && isStop(l);
      const label = l.match(/^[\s>*_-]*(?:\d+[.)]\s+)?[*_]*([A-Za-z][\w -]*):/);
      if (!heading && !(label && /^stop/i.test(label[1]) && isStop(label[1]))) return;
      let end = i + 1;
      while (end < ls.length && !(heading ? /^#{1,6}\s/ : /^\s*$/).test(ls[end])) end++;
      if (!ls.slice(i, end).join('\n').includes('stop-zones.md')) {
        out.push(fail(p, i + 1, `STOP block without a reference to ${STOP_ZONES} (keep one STOP list)`));
      }
    });
  }
  return out;
}

// e. Doc types in documentation.md <-> base/templates/<type>.md, each with the common header.
function checkTemplates(ctx) {
  const out = [];
  if (!ctx.fileSet.has(DOC_STANDARD)) return [fail(DOC_STANDARD, 1, 'missing')];
  const ls = lines(DOC_STANDARD);
  const start = ls.findIndex((l) => /^## Types & spines\s*$/.test(l));
  if (start < 0) return [fail(DOC_STANDARD, 1, 'missing "## Types & spines" section')];
  const types = new Map();
  for (let i = start + 1; i < ls.length && !/^#{1,6}\s/.test(ls[i]); i++) {
    const m = ls[i].match(/^- ([\w-]+):/);
    if (m) types.set(m[1], i + 1);
  }
  const h = ls.findIndex((l) => /Common header/.test(l)); // fields after its colon, or next line
  let spec = h < 0 ? '' : ls[h].slice(ls[h].indexOf(':') + 1).trim();
  if (h >= 0 && !spec) spec = ls.slice(h + 1).find((l) => l.trim()) || '';
  const fields = spec.split(/[/,]/).map((s) => s.trim()).filter(Boolean);
  if (!fields.length) out.push(fail(DOC_STANDARD, h + 1 || 1, 'cannot parse the "Common header" fields'));
  const templates = ctx.files.filter((f) => /^base\/templates\/[^/]+\.md$/.test(f));
  for (const [t, line] of types) {
    if (!ctx.fileSet.has(`base/templates/${t}.md`)) out.push(fail(DOC_STANDARD, line, `doc type "${t}" has no base/templates/${t}.md`));
  }
  for (const tp of templates) {
    const name = posix.basename(tp, '.md');
    if (!types.has(name)) out.push(fail(tp, 1, `"${name}" is not a doc type in ${DOC_STANDARD} (Types & spines)`));
    const text = read(tp);
    const missing = fields.filter((f) => !new RegExp(`^(\\|\\s*${esc(f)}\\s*\\||${esc(f)}\\s*:)`, 'm').test(text));
    if (missing.length) out.push(fail(tp, 1, `header missing field(s): ${missing.join(', ')}`));
    const type = text.match(/^\|\s*type\s*\|\s*([^|]*?)\s*\|/m);
    if (type && type[1] !== name) out.push(fail(tp, 1, `header type "${type[1]}" does not match file name "${name}"`));
  }
  return out;
}

// f. Client data never committed: workspaces live outside this repo; these paths are the
// tell-tales of one copied in by mistake.
const isLocalOnly = (f) => f.startsWith('clients/') || f.startsWith('projects/')
  || f.endsWith('.local.md') || f.endsWith('.engineering-framework.json')
  || f.endsWith('.workspaces.local.json');
function checkNoClientData(ctx) {
  if (!ctx.viaGit) ctx.notes.push(`git unavailable: file list from a tree walk${process.env.CI ? '' : ' that skips local-only layers'}`);
  return ctx.files.filter(isLocalOnly)
    .map((f) => fail(f, 1, 'local-only layer (client/project data) must not be committed'));
}

// g. CHANGELOG.md has a release; its latest version is what docs record as framework-version.
// h. Size budgets: agents/team.md is loaded into EVERY chat, so weekly iterations
// must not quietly grow it. ~4 chars per token.
const BUDGETS = [['agents/team.md', 11000], ['agents/architect.md', 3000], ['agents/engineer.md', 3000],
  ['agents/security.md', 3000], ['agents/retro.md', 3000]];
function checkBudgets(ctx) {
  const out = [];
  const skillBudgets = ctx.files.filter((f) => /^skills\/[^/]+\.md$/.test(f)).map((f) => [f, 4000]);
  for (const [f, max] of [...BUDGETS, ...skillBudgets]) {
    if (!ctx.fileSet.has(f)) continue;
    const n = read(f).length;
    if (f === 'agents/team.md') ctx.teamTokens = Math.round(n / 4);
    if (n > max) out.push(fail(f, 1, `${n} chars > budget ${max} (~${Math.round(max / 4)} tokens). Trim before adding.`));
  }
  return out;
}

function checkChangelog(ctx) {
  if (!ctx.fileSet.has(CHANGELOG)) return [fail(CHANGELOG, 1, 'missing at repo root')];
  const versions = [...read(CHANGELOG).matchAll(/^## \[(\d+)\.(\d+)\.(\d+)\]/gm)].map((m) => m.slice(1, 4).map(Number));
  if (!versions.length) return [fail(CHANGELOG, 1, 'no "## [x.y.z]" release heading')];
  versions.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  ctx.version = versions.at(-1).join('.');
  return [];
}

// i. The rulebook is opened next to client workspaces (multi-root): files that agent
// tools auto-load must never appear in its root, or they'd apply to every client.
const AUTOLOADED = /^(AGENTS\.md|CLAUDE\.md|CLAUDE\.local\.md|\.github\/(copilot-instructions\.md|agents\/|instructions\/|skills\/|prompts\/)|\.claude\/|\.cursor\/|\.agents\/|\.cursorrules)/;
function checkNoAutoload(ctx) {
  return ctx.files.filter((f) => AUTOLOADED.test(f)).map((f) => fail(f, 1, 'agent tools auto-load this from the rulebook root; move it (generated files belong in workspaces)'));
}

// j. No git repository inside the rulebook: a clone or submodule here (e.g. from
// running `git clone` inside this folder) would be committed as a pointer or hide
// a second, different copy of the rules. The file listing skips folders, so look.
function checkNoNestedRepos() {
  const run = (a) => { try { return execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return ''; } };
  const links = run(['ls-files', '-s']).split('\n').filter((l) => l.startsWith('160000 ')).map((l) => l.split('\t')[1]);
  const nested = run(['ls-files', '--others', '--exclude-standard', '--directory']).split('\n')
    .filter((d) => d.endsWith('/') && existsSync(join(ROOT, d, '.git'))).map((d) => d.slice(0, -1));
  return [...links, ...nested].map((p) => fail(p, 1, 'a git repository inside the rulebook (clone or submodule): move it out of this folder'));
}

const CHECKS = [
  ['team definitions', checkAgents],
  ['path references resolve', checkReferences],
  ['playbook structure', checkPlaybooks],
  ['single STOP list', checkSingleStopList],
  ['doc types <-> templates', checkTemplates],
  ['no client data committed', checkNoClientData],
  ['changelog release', checkChangelog],
  ['size budgets', checkBudgets],
  ['no auto-loaded files in rulebook root', checkNoAutoload],
  ['no git repositories inside the rulebook', checkNoNestedRepos],
];

function main() {
  const { viaGit, files } = listFiles();
  const ctx = {
    viaGit, files, fileSet: new Set(files), notes: [], refCount: 0, version: null,
    docs: files.filter((f) => /\.(md|mdc)$/.test(f)),
    generated: new Set(),
  };
  const failures = [];
  for (const [name, check] of CHECKS) {
    let found;
    try { found = check(ctx); } catch (e) { found = [fail('tools/check.mjs', 1, `crashed: ${e.message}`)]; }
    for (const f of found) {
      console.log(`${f.file}:${f.line}: [${name}] ${f.reason}`);
      // GitHub Actions annotation, so failures show inline on the PR diff.
      if (process.env.GITHUB_ACTIONS) console.log(`::error file=${f.file},line=${f.line}::${name}: ${f.reason.replace(/%/g, '%25')}`);
    }
    failures.push(...found.map((f) => ({ ...f, check: name })));
  }
  for (const n of ctx.notes) console.log(`note: ${n}`);
  const failedChecks = new Set(failures.map((f) => f.check));
  if (failures.length) {
    console.log(`\nframework-check FAILED: ${failures.length} failure(s) in ${failedChecks.size} of `
      + `${CHECKS.length} checks (${[...failedChecks].join(', ')}).`);
    process.exitCode = 1; // not process.exit(): let buffered output (Windows TTY) flush
    return;
  }
  console.log(`framework-check OK: ${CHECKS.length} checks passed; ${ctx.docs.length} docs, `
    + `${ctx.refCount} references; team rules ~${ctx.teamTokens} tokens; framework version ${ctx.version}.`);
}

main();
