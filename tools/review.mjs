#!/usr/bin/env node
// Build-review loop (maintainer machine only): Codex reviews the branch Claude built.
//   node tools/review.mjs [--base main] [--max 3] [--model <m>] [--dry-run]   one review round
//   node tools/review.mjs log      the rounds so far as markdown (for the PR body)
//   node tools/review.mjs reset    start over on this branch
// Runs tools/check.mjs, then sends the diff vs the base branch (commits + uncommitted
// edits) to `codex exec` in a read-only sandbox with tools/review-rubric.md. Codex
// answers in JSON (findings P0/P1/P2); rounds and the engineer's replies are kept in
// .review/<branch>/ (git-ignored). From round 2 on, the reply to the previous round
// (round-<n>.reply.md) must exist: every finding fixed or disputed with a reason.
// Exit 0 = pass (no P0/P1), 1 = changes requested, 2 = error, 3 = round cap reached.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { ROOT } from './workspace.mjs';

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const cmd = ['log', 'reset'].includes(args[0]) ? args[0] : 'review';
const base = opt('--base', 'main');
const max = Number(opt('--max', 3));
const model = opt('--model');

const env = { ...process.env }; delete env.OPENSSL_CONF;
const git = (...a) => execFileSync('git', a, { cwd: ROOT, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const die = (msg) => { console.error(`review: ${msg}`); process.exit(2); };

const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
if (branch === base) die(`on ${base}: build on a branch, then review it against ${base}`);
const dir = join(ROOT, '.review', branch.replace(/[^\w.-]+/g, '_'));
const roundFile = (n) => join(dir, `round-${n}.json`);
const replyFile = (n) => join(dir, `round-${n}.reply.md`);
const rounds = () => (existsSync(dir) ? readdirSync(dir) : [])
  .map((f) => f.match(/^round-(\d+)\.json$/)?.[1]).filter(Boolean).map(Number).sort((a, b) => a - b);
const blocking = (r) => r.findings.filter((f) => f.severity !== 'P2');

const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['verdict', 'summary', 'findings'],
  properties: {
    verdict: { type: 'string', enum: ['pass', 'changes'] },
    summary: { type: 'string' },
    findings: { type: 'array', items: {
      type: 'object', additionalProperties: false, required: ['severity', 'file', 'line', 'title', 'detail'],
      properties: { severity: { type: 'string', enum: ['P0', 'P1', 'P2'] }, file: { type: 'string' },
        line: { type: 'integer' }, title: { type: 'string' }, detail: { type: 'string' } } } },
  },
};

const fmt = (r) => r.findings.map((f) => `- **${f.severity}** \`${f.file}:${f.line}\` ${f.title}: ${f.detail}`).join('\n') || '- (no findings)';

if (cmd === 'reset') { rmSync(dir, { recursive: true, force: true }); console.log(`review: cleared ${dir}`); process.exit(0); }

if (cmd === 'log') {
  const ns = rounds();
  if (!ns.length) die('no rounds yet on this branch');
  for (const n of ns) {
    const r = JSON.parse(readFileSync(roundFile(n), 'utf8'));
    console.log(`### Codex review, round ${n}: ${blocking(r).length ? 'changes' : 'pass'}\n${r.summary}\n\n${fmt(r)}\n`);
    if (existsSync(replyFile(n))) console.log(`**Engineer's reply:**\n\n${readFileSync(replyFile(n), 'utf8').trim()}\n`);
  }
  process.exit(0);
}

// One review round.
const done = rounds();
const n = (done.at(-1) || 0) + 1;
if (n > max) {
  console.log(`review: round cap (${max}) reached. Take the open findings to the maintainer:\n`);
  console.log(fmt(JSON.parse(readFileSync(roundFile(n - 1), 'utf8'))));
  process.exit(3);
}
if (n > 1 && !existsSync(replyFile(n - 1))) {
  die(`write ${replyFile(n - 1)} first: for each round-${n - 1} finding, "fixed" (how) or "disputed" (why)`);
}

const untracked = git('ls-files', '--others', '--exclude-standard');
if (untracked) die(`untracked files aren't in the diff; commit them or \`git add -N\` them:\n${untracked}`);
const check = spawnSync(process.execPath, [join(ROOT, 'tools/check.mjs')], { cwd: ROOT, env, encoding: 'utf8' });
if (check.status !== 0) { process.stdout.write(check.stdout); die('tools/check.mjs fails: fix that before asking for a review'); }

const mergeBase = git('merge-base', base, 'HEAD');
const diff = execFileSync('git', ['diff', mergeBase], { cwd: ROOT, env, encoding: 'utf8', maxBuffer: 64 << 20 });
if (!diff.trim()) die(`no changes vs ${base}`);

const history = done.map((k) => {
  const r = JSON.parse(readFileSync(roundFile(k), 'utf8'));
  return `### Your round ${k}\n${fmt(r)}\n\n### Engineer's reply to round ${k}\n${readFileSync(replyFile(k), 'utf8').trim()}`;
}).join('\n\n');
const prompt = [
  readFileSync(join(ROOT, 'tools/review-rubric.md'), 'utf8').trim(),
  `## This review\nRound ${n} of at most ${max}. Branch ${branch}, diff against ${base} below. Log: \n${git('log', '--format=- %s', `${mergeBase}..HEAD`) || '- (uncommitted only)'}`,
  history && `## Earlier rounds\n${history}`,
  `## Diff\n\`\`\`diff\n${diff}\`\`\``,
].filter(Boolean).join('\n\n');

mkdirSync(dir, { recursive: true });
const schemaPath = join(dir, 'schema.json');
writeFileSync(schemaPath, JSON.stringify(SCHEMA));
if (args.includes('--dry-run')) { writeFileSync(join(dir, `round-${n}.prompt.md`), prompt); console.log(`review: prompt written to ${join(dir, `round-${n}.prompt.md`)}`); process.exit(0); }

console.log(`review: round ${n}/${max}, ${diff.split('\n').length} diff lines -> codex (read-only), usually 1-3 min...`);
const out = join(dir, `round-${n}.raw.json`);
const codexArgs = ['exec', '-s', 'read-only', '--ephemeral', '-C', ROOT, '--output-schema', schemaPath, '-o', out, ...(model ? ['-m', model] : []), '-'];
// The npm install is a .cmd shim on Windows, which needs a shell: quote paths with spaces.
const win = process.platform === 'win32';
const res = spawnSync('codex', win ? codexArgs.map((a) => (/\s/.test(a) ? `"${a}"` : a)) : codexArgs,
  { cwd: ROOT, env, input: prompt, encoding: 'utf8', shell: win, timeout: 15 * 60 * 1000, maxBuffer: 64 << 20 });
if (res.error || res.status !== 0 || !existsSync(out)) {
  writeFileSync(join(dir, `round-${n}.log`), `${res.stdout || ''}\n${res.stderr || ''}`);
  die(`codex failed (${res.error?.message || `exit ${res.status}`}); output in ${join(dir, `round-${n}.log`)}. Signed in? Try \`codex login\`.`);
}
let result;
try { result = JSON.parse(readFileSync(out, 'utf8')); } catch { die(`codex did not return JSON; see ${out}`); }
rmSync(out);
writeFileSync(roundFile(n), JSON.stringify(result, null, 2));

const pass = blocking(result).length === 0;
console.log(`\n## Codex review, round ${n}: ${pass ? 'PASS' : 'CHANGES REQUESTED'}\n${result.summary}\n\n${fmt(result)}\n`);
if (!pass) console.log(`Next: fix or dispute each finding, write ${replyFile(n)}, commit, run again.`);
else if (result.findings.length) console.log(`P2s are optional; note any you skip in ${replyFile(n)}.`);
process.exit(pass ? 0 : 1);
