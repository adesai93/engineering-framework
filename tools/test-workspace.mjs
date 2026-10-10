#!/usr/bin/env node
// Deterministic tests for tools/workspace.mjs (no AI, no network): node tools/test-workspace.mjs
// Builds throwaway workspaces in the temp folder for every supported tool and
// checks generation, preservation of hand edits, path isolation, snapshot,
// backup, the secret scan and the client-free export check. Runs in CI.
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, mkdtempSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync, execFileSync } from 'node:child_process';
import { ROOT } from './workspace.mjs';

const TMP = mkdtempSync(join(tmpdir(), 'engfw-test-'));
const REG = join(TMP, 'registry.json');
// No global/system git config: proves a laptop without a git name/email still works.
const GITCFG = join(TMP, 'empty.gitconfig'); writeFileSync(GITCFG, '');
const env = { ...process.env, ENGFW_TEST: '1', ENGFW_REGISTRY: REG, ENGFW_NO_FETCH: '1', GIT_CONFIG_GLOBAL: GITCFG, GIT_CONFIG_NOSYSTEM: '1' };
delete env.OPENSSL_CONF;
const SCRIPT = join(ROOT, 'tools/workspace.mjs');
const wsmjs = (args, cwd = ROOT) => {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { cwd, env, encoding: 'utf8' });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
};
const git = (cwd, args) => execFileSync('git', args, { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const rd = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const json = (p) => JSON.parse(rd(p));
const today = new Date().toISOString().slice(0, 10);

let passed = 0; const failed = [];
function test(name, fn) {
  try { fn(); passed++; console.log(`PASS  ${name}`); } catch (e) { failed.push(name); console.log(`FAIL  ${name}\n      ${e.message}`); }
}
function ok(cond, msg) { if (!cond) throw new Error(msg); }

const A = join(TMP, 'client-a'); const B = join(TMP, 'client-b');

test('new: every tool gets its files, one local commit, config records generated hashes', () => {
  const r = wsmjs(['new', 'acme', A, '--tools', 'claude,copilot,cursor,codex']);
  ok(r.code === 0, `new failed: ${r.out}`);
  for (const f of ['AGENTS.md', 'CLAUDE.md', '.claude/settings.json', '.claude/agents/pm.md', '.claude/skills/handoff/SKILL.md',
    '.github/copilot-instructions.md', '.github/agents/pm.agent.md', '.cursor/agents/pm.md', '.cursor/cli.json', 'acme.code-workspace',
    '.codex/agents/pm.toml', '.agents/skills/env-map/SKILL.md', '.codex/rules/engineering-framework.rules',
    'context.md', 'inventory.md', 'projects/_new/brief.md', 'reference/README.md']) ok(existsSync(join(A, f)), `missing ${f}`);
  ok(git(A, ['log', '--oneline']).split('\n').length === 1, 'expected exactly one commit');
  ok(git(A, ['config', 'user.email']) === 'workspace@localhost', 'local identity not set for a laptop without one');
  ok(Object.keys(json(join(A, '.engineering-framework.json')).generated || {}).length > 20, 'generated hashes missing');
  ok(rd(join(A, '.github/agents/pm.agent.md')).includes("tools: ['read', 'search', 'edit', 'execute']"), 'pm Copilot tools wrong');
  ok(rd(join(A, '.github/agents/architect.agent.md')).includes('agent: pm'), 'architect -> pm handoff missing');
  // Pre-approved commands: snapshot and the read-only export check only, in every tool.
  const allow = json(join(A, '.claude/settings.json')).permissions.allow;
  ok(allow.length === 2 && allow.every((a) => / (snapshot|check-export):\*\)$/.test(a)), `Claude allow list: ${allow}`);
  const auto = Object.keys(json(join(A, 'acme.code-workspace')).settings['chat.tools.terminal.autoApprove']);
  ok(auto.length === 2 && auto.some((k) => k.includes('snapshot')) && auto.some((k) => k.includes('check-export')), `Copilot auto-approve: ${auto}`);
  const rules = rd(join(A, '.codex/rules/engineering-framework.rules'));
  ok((rules.match(/prefix_rule/g) || []).length === 2 && rules.includes('"check-export"'), 'Codex rules');
  ok(json(join(A, '.claude/settings.json')).permissions.deny.some((d) => d.startsWith('Edit(')), 'Claude rulebook deny missing');
  ok(rd(join(A, '.claude/agents/retro.md')).includes('tools: Read, Grep, Glob, Write, Edit, Bash'), 'retro cannot run the export check');
});

test('paths: a workspace or repo inside the rulebook is refused (any letter case)', () => {
  const inside = join(ROOT, 'clients', 'x');
  const r = wsmjs(['new', 'x', process.platform === 'win32' ? inside.toUpperCase() : inside]);
  ok(r.code !== 0 && /OUTSIDE/.test(r.out), `not refused: ${r.out}`);
  const r2 = wsmjs(['update', A, '--repos', join(ROOT, 'tools')]);
  ok(r2.code !== 0 && /inside the rulebook/.test(r2.out), `repo in rulebook not refused: ${r2.out}`);
});

test('paths: workspaces never nest or share repos', () => {
  const r = wsmjs(['new', 'nested', join(A, 'inner')]);
  ok(r.code !== 0 && /overlaps another workspace/.test(r.out), `nested workspace not refused: ${r.out}`);
  ok(wsmjs(['new', 'beta', B, '--tools', 'claude']).code === 0, 'second workspace failed');
  mkdirSync(join(A, 'repos', 'app'), { recursive: true });
  const r2 = wsmjs(['update', B, '--repos', join(A, 'repos', 'app')]);
  ok(r2.code !== 0 && /inside another workspace/.test(r2.out), `shared repo not refused: ${r2.out}`);
});

test('update: hand edits survive (VS Code workspace, Cursor permissions, Claude settings, notes)', () => {
  const cw = join(A, 'acme.code-workspace'); const c = json(cw);
  c.folders.push({ name: 'my notes', path: '../notes' });
  c.settings['editor.fontSize'] = 14;
  c.settings['chat.tools.terminal.autoApprove']['/^git status$/'] = true;
  writeFileSync(cw, JSON.stringify(c, null, 2));
  const cli = join(A, '.cursor/cli.json'); const cc = json(cli); cc.permissions.deny.push('Write(/etc/**)'); cc.model = 'mine'; writeFileSync(cli, JSON.stringify(cc));
  const st = join(A, '.claude/settings.json'); const s = json(st); s.permissions.allow.push('Bash(ls:*)'); writeFileSync(st, JSON.stringify(s));
  appendFileSync(join(A, 'context.md'), '\nMY CONTEXT LINE\n');
  const r = wsmjs(['update', A]);
  ok(r.code === 0, `update failed: ${r.out}`);
  const c2 = json(cw);
  ok(c2.folders.some((f) => f.name === 'my notes'), 'added folder dropped');
  ok(c2.folders.some((f) => f.name === 'engineering-framework (rulebook)'), 'rulebook folder missing');
  ok(c2.settings['editor.fontSize'] === 14, 'user setting dropped');
  ok(c2.settings['chat.tools.terminal.autoApprove']['/^git status$/'] === true, 'user auto-approve dropped');
  ok(Object.keys(c2.settings['files.readonlyInclude']).length >= 1, 'rulebook read-only setting missing');
  const cc2 = json(cli);
  ok(cc2.permissions.deny.includes('Write(/etc/**)') && cc2.permissions.deny.some((d) => d.includes('/**') && d !== 'Write(/etc/**)'), 'Cursor deny not merged');
  ok(cc2.model === 'mine', 'Cursor setting dropped');
  ok(json(st).permissions.allow.includes('Bash(ls:*)'), 'Claude allow dropped');
  ok(json(st).permissions.deny.length >= 1, 'Claude rulebook deny missing');
  ok(rd(join(A, 'context.md')).includes('MY CONTEXT LINE'), 'notes touched');
});

test('update: a hand-edited generated file is kept in .engfw-backup before it is replaced', () => {
  const p = join(A, '.claude/agents/engineer.md');
  appendFileSync(p, '\nMY AGENT EDIT\n');
  const r = wsmjs(['update', A]);
  ok(r.code === 0 && /had local edits/.test(r.out), `no edit notice: ${r.out}`);
  ok(!rd(p).includes('MY AGENT EDIT'), 'generated file not regenerated');
  ok(rd(join(A, '.engfw-backup', today, '.claude/agents/engineer.md')).includes('MY AGENT EDIT'), 'edit not kept');
  const r2 = wsmjs(['update', A]);
  ok(!/had local edits/.test(r2.out), 'second update flagged edits again');
});

test('update: template folders added since the workspace was made come back', () => {
  rmSync(join(A, 'reference'), { recursive: true, force: true });
  const r = wsmjs(['update', A]);
  ok(r.code === 0 && existsSync(join(A, 'reference/README.md')), `reference/ not restored: ${r.out}`);
});

test('snapshot: saves, says when nothing changed, and fails loudly instead of claiming "nothing new"', () => {
  let r = wsmjs(['snapshot', 'test one'], A);
  ok(r.code === 0 && /Snapshot saved/.test(r.out), `first snapshot: ${r.out}`);
  r = wsmjs(['snapshot', 'test two'], A);
  ok(r.code === 0 && /Nothing new/.test(r.out), `no-change snapshot: ${r.out}`);
  appendFileSync(join(A, 'NOW.md'), '\nchange\n');
  writeFileSync(join(A, '.git/index.lock'), '');
  r = wsmjs(['snapshot', 'test three'], A);
  rmSync(join(A, '.git/index.lock'));
  ok(r.code !== 0 && /FAILED/.test(r.out) && !/Nothing new/.test(r.out), `failure not reported: ${r.out}`);
});

test('snapshot: refuses when the workspace has a git remote', () => {
  git(A, ['remote', 'add', 'origin', 'https://example.invalid/x.git']);
  const r = wsmjs(['snapshot', 'x'], A);
  git(A, ['remote', 'remove', 'origin']);
  ok(r.code !== 0 && /REFUSED/.test(r.out), `remote not refused: ${r.out}`);
});

test('secrets: saved scripts are scanned; snapshot warns, backup stops unless --anyway', () => {
  mkdirSync(join(A, 'projects/p1/scripts'), { recursive: true });
  writeFileSync(join(A, 'projects/p1/scripts/get.ps1'), "$password = 'Sup3rS3cretValue!'\n");
  let r = wsmjs(['snapshot', 'with secret'], A);
  ok(r.code === 0 && /WARNING: 1 possible secret/.test(r.out) && /get\.ps1/.test(r.out), `snapshot didn't warn: ${r.out}`);
  const dest = join(TMP, 'backups'); mkdirSync(dest);
  r = wsmjs(['backup', A, '--to', dest]);
  ok(r.code !== 0 && /STOPPED/.test(r.out), `backup didn't stop: ${r.out}`);
  ok(!readdirSync(dest).length && !json(join(A, '.engineering-framework.json')).lastBackup, 'backup made or recorded anyway');
  r = wsmjs(['backup', A, '--to', dest, '--anyway']);
  ok(r.code === 0 && /verified/.test(r.out), `backup --anyway failed: ${r.out}`);
  const bundle = join(dest, readdirSync(dest)[0]);
  git(A, ['bundle', 'verify', '-q', bundle]);
  ok(json(join(A, '.engineering-framework.json')).lastBackup, 'lastBackup not recorded');
  rmSync(join(A, 'projects/p1'), { recursive: true });
});

test('backup: a failed bundle is never recorded as a backup', () => {
  const dest = join(TMP, 'backups2'); mkdirSync(dest);
  mkdirSync(join(dest, `beta-workspace-${today}.bundle`)); // a folder where the file must go
  const r = wsmjs(['backup', B, '--to', dest]);
  ok(r.code !== 0 && /FAILED/.test(r.out), `failure not reported: ${r.out}`);
  ok(!json(join(B, '.engineering-framework.json')).lastBackup, 'lastBackup recorded for a failed backup');
});

test('check-export: catches this client\'s names and identifier shapes, passes clean text', () => {
  appendFileSync(join(A, 'inventory.md'), '\n- prd · vnet · vnet-spoke-orders-prd-eus2 · sub-prd/rg-net · 10.40.8.0/22 · net team · - · az graph · 2026-10-10\n');
  appendFileSync(join(A, 'context.md'), '\n## People\nJane Smith — network lead — firewall changes\n');
  mkdirSync(join(A, 'feedback'), { recursive: true });
  const f = join(A, 'feedback/2026-W41.md');
  for (const [text, why] of [['the vnet-spoke-orders-prd-eus2 peering broke', 'inventory name'], ['asked Jane Smith twice', 'person'],
    ['route to 10.40.8.4 failed', 'IP'], ['tenant 3f2a1b4c-1111-2222-3333-444455556666', 'GUID'], ['the acme team said', 'client name']]) {
    writeFileSync(f, `# Report\n${text}\n`);
    const r = wsmjs(['check-export', 'feedback/2026-W41.md'], A);
    ok(r.code !== 0 && /NOT client-free/.test(r.out), `missed ${why}: ${r.out}`);
  }
  writeFileSync(f, '# Report\nA user corrected the agent twice about a <vnet> peering. Suggested change: agents/team.md.\n');
  const r = wsmjs(['check-export', 'feedback/2026-W41.md'], A);
  ok(r.code === 0 && /check passed/.test(r.out), `clean report flagged: ${r.out}`);
});

test('rulebook untouched: no hook or registry written by tests', () => {
  ok(existsSync(REG), 'test registry not used');
  const status = git(ROOT, ['status', '--porcelain', '--untracked-files=all']).split('\n').filter((l) => l && !l.includes('tools/test-workspace.mjs'));
  ok(!status.some((l) => /clients\//.test(l)), `rulebook got client files: ${status.join(', ')}`);
});

rmSync(TMP, { recursive: true, force: true });
console.log(`\n${passed}/${passed + failed.length} passed${failed.length ? ` · FAILED: ${failed.join('; ')}` : ''}`);
process.exitCode = failed.length ? 1 : 0;
