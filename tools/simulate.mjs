#!/usr/bin/env node
// Behaviour regression suite for the agent team (maintainer machine only).
//   node tools/simulate.mjs [--only id,id] [--parallel 4]
// Builds a fresh workspace per scenario from tools/sim/fixture.json (a fictional
// client), runs the prompts through Claude Code headless, applies the automatic
// checks in tools/sim/scenarios.json and prints PASS/FAIL with cost. Replies are
// saved for human review. Needs the `claude` CLI; costs real API usage (~$0.3-1
// per scenario). Run it before merging changes to agents/ or base/.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, execFileSync } from 'node:child_process';
import { ROOT } from './workspace.mjs';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const only = opt('--only')?.split(',');
const parallel = Number(opt('--parallel') || 4);

const fixture = JSON.parse(readFileSync(join(ROOT, 'tools/sim/fixture.json'), 'utf8'));
let { scenarios } = JSON.parse(readFileSync(join(ROOT, 'tools/sim/scenarios.json'), 'utf8'));
if (only) scenarios = scenarios.filter((s) => only.includes(s.id));
// Built at run time so no secret-shaped string is stored in the repo.
const FAKE_SAS = `https://stcontosodataprd001.blob.core.windows.net/logs?sv=2024-11-04&sp=rw&${'si'}g=${'Xk3Jd9fQ2mN8vLp4R7tYwZ1a'}BcDeFg%3D`;

const env = { ...process.env }; delete env.OPENSSL_CONF;
const sh = (cmd, a, cwd) => execFileSync(cmd, a, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
const run = (stamp) => join(tmpdir(), `engfw-sim-${stamp}`);
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const out = run(stamp); mkdirSync(out, { recursive: true });

function seed(dir) {
  sh(process.execPath, [join(ROOT, 'tools/workspace.mjs'), 'new', fixture.client, dir, '--tools', 'claude'], ROOT);
  for (const [rel, content] of Object.entries(fixture.files)) {
    const p = join(dir, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, content);
  }
  sh('git', ['add', '-A'], dir); sh('git', ['commit', '-q', '-m', 'fixture'], dir);
}

function claude(dir, prompt, cont, mode, allow) {
  return new Promise((done) => {
    // The prompt goes in on stdin: on Windows a shell would mangle quotes, colons and spaces.
    // stream-json so the "reply" is EVERYTHING the agent said, not just its last message.
    const a = ['-p', '--max-turns', '30', '--output-format', 'stream-json', '--verbose', '--permission-mode', mode || 'acceptEdits'];
    if (allow?.length) a.push('--allowedTools', ...allow);
    if (cont) a.unshift('-c');
    const p = spawn('claude', a, { cwd: dir, env, stdio: ['pipe', 'pipe', 'pipe'], shell: process.platform === 'win32' });
    p.stdin.end(prompt);
    let s = ''; p.stdout.on('data', (d) => { s += d; });
    p.on('close', () => {
      const msgs = s.split('\n').map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
      const text = msgs.filter((m) => m.type === 'assistant').flatMap((m) => m.message?.content || [])
        .filter((c) => c.type === 'text').map((c) => c.text).join('\n\n');
      const r = msgs.find((m) => m.type === 'result') || {};
      done({ result: text || r.result || s, total_cost_usd: r.total_cost_usd || 0 });
    });
  });
}

const mdText = (dir) => {
  const parts = [];
  const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) {
    if (['.git', '.claude'].includes(e.name)) continue;
    const p = join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(md|txt|json)$/.test(e.name)) parts.push(readFileSync(p, 'utf8'));
  } };
  walk(dir); return parts.join('\n');
};

function check(c, dir, reply, before) {
  switch (c.type) {
    case 'no-workspace-changes': {
      const st = sh('git', ['status', '--porcelain'], dir).split('\n').filter((l) => l && !l.includes('.claude/'));
      return [st.length === 0, st.length ? `changed: ${st.join(', ')}` : ''];
    }
    case 'file-matches': {
      const p = join(dir, c.file); const ok = existsSync(p) && new RegExp(c.regex, 'i').test(readFileSync(p, 'utf8'));
      return [ok, ok ? '' : `${c.file} lacks /${c.regex}/`];
    }
    case 'nowhere-matches': { const hit = new RegExp(c.regex).test(mdText(dir)); return [hit === (c.expect ?? false), hit ? `found /${c.regex}/ in workspace files` : '']; }
    case 'reply-matches': { const ok = new RegExp(c.regex, 'im').test(reply); return [ok, ok ? '' : `reply lacks /${c.regex}/`]; }
    case 'reply-not-matches': { const bad = new RegExp(c.regex, 'im').test(reply); return [!bad, bad ? `reply has /${c.regex}/` : '']; }
    case 'dir-exists': { const ok = existsSync(join(dir, c.path)); return [ok, ok ? '' : `${c.path} missing`]; }
    case 'glob-exists': {
      const found = []; const re = new RegExp(c.regex);
      const walk = (d, rel) => { for (const e of readdirSync(d, { withFileTypes: true })) {
        const r = rel ? `${rel}/${e.name}` : e.name; if (e.isDirectory()) walk(join(d, e.name), r); else if (re.test(r)) found.push(r);
      } };
      if (existsSync(join(dir, c.dir))) walk(join(dir, c.dir), '');
      return [found.length > 0, found.length ? '' : `no file under ${c.dir} matching /${c.regex}/`];
    }
    case 'git-log-matches': {
      const log = sh('git', ['log', '--oneline', '-10'], dir); const ok = new RegExp(c.regex, 'i').test(log);
      return [ok, ok ? '' : `no commit matching /${c.regex}/`];
    }
    case 'new-project': {
      const now = readdirSync(join(dir, 'projects')).filter((d) => d !== '_new');
      const added = now.filter((d) => !before.includes(d)); return [added.length > 0, added.length ? '' : 'no project folder created'];
    }
    default: return [false, `unknown check ${c.type}`];
  }
}

async function scenario(s) {
  const dir = join(out, s.id); seed(dir);
  const before = readdirSync(join(dir, 'projects'));
  let reply = ''; let cost = 0;
  for (const [i, p] of s.prompts.entries()) {
    const r = await claude(dir, p.replaceAll("{{FAKE_SAS}}", FAKE_SAS), i > 0 && s.continue, s.permissionMode, s.allow);
    reply = r.result || ''; cost += r.total_cost_usd || 0;
  }
  const results = s.checks.map((c) => check(c, dir, reply, before));
  writeFileSync(join(out, `${s.id}.reply.md`), reply);
  return { id: s.id, pass: results.every(([ok]) => ok), why: results.filter(([ok]) => !ok).map(([, w]) => w).join('; '), cost };
}

if (!existsSync(join(ROOT, '.git'))) { console.error('Run from a rulebook git clone.'); process.exit(1); }
try { sh('claude', ['--version'], ROOT); } catch { console.error('Claude Code CLI not found (claude).'); process.exit(1); }
console.log(`Running ${scenarios.length} scenario(s), ${parallel} at a time, in ${out}\n`);
const queue = [...scenarios]; const results = [];
await Promise.all(Array.from({ length: Math.min(parallel, queue.length) }, async () => {
  while (queue.length) { const s = queue.shift(); const r = await scenario(s); results.push(r); console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.id.padEnd(28)} $${r.cost.toFixed(2)}${r.why ? `  ${r.why}` : ''}`); }
}));
const failed = results.filter((r) => !r.pass);
const total = results.reduce((a, r) => a + r.cost, 0);
writeFileSync(join(out, 'results.json'), JSON.stringify(results, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} passed · total $${total.toFixed(2)} · replies in ${out}`);
process.exitCode = failed.length ? 1 : 0;
