#!/usr/bin/env node
// Creates and updates client workspaces. Node built-ins only.
//   node tools/workspace.mjs new <client> <path> [--tools claude,copilot,cursor,codex] [--repos <dir>]...
//   node tools/workspace.mjs update <path> [--repos <dir>]...
//   node tools/workspace.mjs upgrade | refresh | doctor [<workspace>]
// --repos (repeatable): folders of this client's existing clones, or single repo
// folders (default: <workspace>/repos). Never point it at another client's code.
// A workspace holds ONE client's memory (context, NOW, projects, logs) and the
// agent files generated from agents/*.md. Client data never enters this repo.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, cpSync, rmSync, realpathSync, statSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = join(ROOT, 'workspace-template');
const CONFIG = '.engineering-framework.json';
const TOOLS = ['claude', 'copilot', 'cursor', 'codex'];

const normalize = (s) => s.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const read = (p) => normalize(readFileSync(p, 'utf8'));
const slash = (p) => resolve(p).replace(/\\/g, '/');
const asList = (r) => (r ? (Array.isArray(r) ? r : [r]) : []); // configs before v0.10 hold one string
const sha = (s) => createHash('sha256').update(normalize(s)).digest('hex').slice(0, 16);

// Canonical path for containment checks: follows junctions/symlinks on the part
// that exists, and ignores case on Windows (C:\Foo and c:\foo are one folder).
function canon(p) {
  let r = resolve(p); const rest = [];
  while (!existsSync(r) && dirname(r) !== r) { rest.unshift(basename(r)); r = dirname(r); }
  try { r = realpathSync.native(r); } catch { /* keep as is */ }
  const out = [r, ...rest].join('/').replace(/\\/g, '/').replace(/\/+/g, '/').replace(/\/$/, '');
  return process.platform === 'win32' ? out.toLowerCase() : out;
}
const within = (child, parent) => { const c = canon(child); const p = canon(parent); return c === p || c.startsWith(`${p}/`); };

// Child processes run without OPENSSL_CONF: a broken machine-wide OpenSSL config
// stops Node (and some git builds) before any script runs.
const CHILD_ENV = (() => { const e = { ...process.env }; delete e.OPENSSL_CONF; return e; })();

export function frameworkVersion(root = ROOT) {
  const m = read(join(root, 'CHANGELOG.md')).match(/^## \[(\d+\.\d+\.\d+)\]/m);
  return m ? m[1] : '0.0.0';
}

// agents/<name>.md -> { name, meta: {key: value}, handoffs: [{agent,label,prompt}], body }
export function loadAgents(root = ROOT) {
  const dir = join(root, 'agents');
  return readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'team.md').sort().map((f) => {
    const text = read(join(dir, f));
    const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!m) throw new Error(`agents/${f}: missing --- frontmatter ---`);
    const meta = {}; const handoffs = [];
    for (const line of m[1].split('\n')) {
      const kv = line.match(/^([\w-]+):\s*(.*)$/);
      if (!kv) continue;
      if (kv[1] === 'handoff') {
        const [agent, label, prompt] = kv[2].split('|').map((s) => s.trim());
        handoffs.push({ agent, label, prompt });
      } else meta[kv[1]] = kv[2].trim();
    }
    return { file: `agents/${f}`, name: meta.name || basename(f, '.md'), meta, handoffs, body: m[2].trim() + '\n' };
  });
}

// skills/<name>.md -> { name, description, userOnly, body }. Emitted to
// .claude/skills/<name>/SKILL.md, which Claude Code, VS Code (Copilot) and Cursor
// all read: only the name + description sit in context until a skill is used.
export function loadSkills(root = ROOT) {
  const dir = join(root, 'skills');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.md')).sort().map((f) => {
    const m = read(join(dir, f)).match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!m) throw new Error(`skills/${f}: missing --- frontmatter ---`);
    const meta = Object.fromEntries(m[1].split('\n').map((l) => l.match(/^([\w-]+):\s*(.*)$/)).filter(Boolean).map((k) => [k[1], k[2].trim()]));
    return { file: `skills/${f}`, name: meta.name || basename(f, '.md'), description: meta.description || '', userOnly: meta.invocation === 'user', toolchain: meta.toolchain || null, body: m[2].trim() + '\n' };
  });
}

// Make rulebook paths absolute so every tool finds them from inside the workspace.
function absolutize(text, fw) {
  return text.replaceAll('{{SNAPSHOT}}', snapshotCmd(fw)).replaceAll('{{FRAMEWORK}}', fw)
    .replace(/(^|[\s(`'"])base\//gm, `$1${fw}/base/`);
}
// YAML scalar for frontmatter. Plain (unquoted) when safe: some tools (Cursor)
// show quoted strings literally. Otherwise single-quoted ('' escapes ').
const yamlStr = (s) => (/^[\w(][^\n]*$/.test(s) && !/: |\s#|^(yes|no|true|false|null|~)$/i.test(s)
  ? s : `'${s.replace(/'/g, "''")}'`);

// Returns { 'relative/path': content } for one workspace.
export function render({ framework, tools, client, repos, toolchains }, root = ROOT) {
  const fw = framework.replace(/\\/g, '/');
  const repoDirs = asList(repos).map((r) => r.replace(/\\/g, '/'));
  const reposText = repoDirs.length ? repoDirs.join(', ') : 'repos/ in this workspace';
  const v = frameworkVersion(root);
  const note = (src) => `<!-- Generated by engineering-framework v${v} from ${src}. Edit it there, then run: node ${fw}/tools/workspace.mjs update . -->`;
  const out = {};
  const team = absolutize(read(join(root, 'agents/team.md')), fw).replaceAll('{{REPOS}}', reposText).replaceAll('{{SNAPSHOT}}', snapshotCmd(fw));
  out['AGENTS.md'] = `${note('agents/team.md')}\n\n${team}`;
  const agents = loadAgents(root);
  // Toolchain skills are opt-in per client (--toolchains); default: all of them.
  // .claude/skills is read by Claude Code, Copilot (VS Code) and Cursor; Codex gets .agents/skills below.
  for (const s of tools.some((x) => ['claude', 'copilot', 'cursor'].includes(x)) ? loadSkills(root).filter((k) => !k.toolchain || !toolchains || toolchains.includes(k.toolchain)) : []) {
    const fm = [`name: ${s.name}`, `description: ${yamlStr(s.description)}`];
    if (s.userOnly) fm.push('disable-model-invocation: true');
    out[`.claude/skills/${s.name}/SKILL.md`] = `---\n${fm.join('\n')}\n---\n${note(s.file)}\n\n${absolutize(s.body, fw)}`;
  }
  if (tools.includes('claude')) {
    // Imports load the every-chat memory files at launch and again after /compact.
    out['CLAUDE.md'] = `${note('agents/team.md')}\n\n@AGENTS.md\n@context.md\n@rules.md\n`;
    for (const a of agents) {
      const fm = [`name: ${a.name}`, `description: ${yamlStr(a.meta.description || '')}`];
      if (a.meta.claude_tools) fm.push(`tools: ${a.meta.claude_tools}`);
      if (a.meta.claude_model) fm.push(`model: ${a.meta.claude_model}`);
      out[`.claude/agents/${a.name}.md`] = `---\n${fm.join('\n')}\n---\n${note(a.file)}\n\n${absolutize(a.body, fw)}`;
    }
  }
  if (tools.includes('copilot')) {
    out['.github/copilot-instructions.md'] = out['AGENTS.md'];
    for (const a of agents) {
      const fm = [`name: ${a.name}`, `description: ${yamlStr(a.meta.description || '')}`];
      if (a.meta.copilot_tools) fm.push(`tools: [${a.meta.copilot_tools.split(',').map((t) => `'${t.trim()}'`).join(', ')}]`);
      if (a.meta.copilot_no_subagents === 'true') fm.push('agents: []');
      if (a.meta.copilot_user_only === 'true') fm.push('disable-model-invocation: true');
      if (a.handoffs.length) {
        fm.push('handoffs:');
        for (const h of a.handoffs) {
          fm.push(`  - label: ${yamlStr(h.label)}`, `    agent: ${h.agent}`, `    prompt: ${yamlStr(h.prompt)}`, '    send: false');
        }
      }
      out[`.github/agents/${a.name}.agent.md`] = `---\n${fm.join('\n')}\n---\n${note(a.file)}\n\n${absolutize(a.body, fw)}`;
    }
  }
  // Codex reads AGENTS.md natively; skills from .agents/skills, agents from
  // .codex/agents/*.toml, command rules from .codex/rules (trusted projects only).
  if (tools.includes('codex')) {
    const tomlStr = (s) => JSON.stringify(s); // TOML basic strings use JSON-compatible escapes
    for (const s of loadSkills(root).filter((k) => !k.toolchain || !toolchains || toolchains.includes(k.toolchain))) {
      out[`.agents/skills/${s.name}/SKILL.md`] = `---\nname: ${s.name}\ndescription: ${yamlStr(s.description)}\n---\n${note(s.file)}\n\n${absolutize(s.body, fw)}`;
      // Codex has no frontmatter flag for user-only skills; this makes it $skill-only.
      if (s.userOnly) out[`.agents/skills/${s.name}/agents/openai.yaml`] = 'policy:\n  allow_implicit_invocation: false\n';
    }
    for (const a of agents) {
      const body = absolutize(a.body, fw).replaceAll("'''", "'' '");
      const lines = [`# ${note(a.file).replace(/^<!-- | -->$/g, '')}`, `name = ${tomlStr(a.name)}`, `description = ${tomlStr(a.meta.description || '')}`];
      if (a.meta.codex_sandbox) lines.push(`sandbox_mode = ${tomlStr(a.meta.codex_sandbox)}`);
      lines.push(`developer_instructions = '''\n${body}'''`);
      out[`.codex/agents/${a.name}.toml`] = lines.join('\n') + '\n';
    }
    // Pre-approve ONLY the local workspace snapshot; everything else keeps its normal approval.
    const [nodeBin, script] = ['node', `${fw}/tools/workspace.mjs`];
    out['.codex/rules/engineering-framework.rules'] = `# ${note('tools/workspace.mjs').replace(/^<!-- | -->$/g, '')}\n`
      + `prefix_rule(pattern=[${tomlStr(nodeBin)}, ${tomlStr(script)}, "snapshot"], decision="allow", justification="Local snapshot of this client workspace; refuses if a git remote exists; never pushes.")\n`
      + `prefix_rule(pattern=[${tomlStr(nodeBin)}, ${tomlStr(script)}, "check-export"], decision="allow", justification="Read-only client-free check of a report before it leaves this workspace.")\n`;
  }
  // Cursor reads AGENTS.md natively for the team rules; subagents go in .cursor/agents.
  if (tools.includes('cursor')) {
    for (const a of agents) {
      const fm = [`name: ${a.name}`, `description: ${yamlStr(a.meta.description || '')}`];
      if (a.meta.readonly === 'true') fm.push('readonly: true');
      out[`.cursor/agents/${a.name}.md`] = `---\n${fm.join('\n')}\n---\n${note(a.file)}\n\n${absolutize(a.body, fw)}`;
    }
    // Cursor agent permissions (documented for the Cursor CLI): no writes to the rulebook.
    out['.cursor/cli.json'] = JSON.stringify({ permissions: { deny: [`Write(${fw}/**)`] } }, null, 2) + '\n';
  }
  // VS Code and Cursor: one workspace file opening this workspace + repos + the rulebook.
  if (tools.includes('copilot') || tools.includes('cursor')) {
    out[`${client}.code-workspace`] = JSON.stringify({
      folders: [{ name: client, path: '.' },
        ...repoDirs.map((r) => ({ name: `${client} repos: ${basename(r)}`, path: r })),
        { name: 'engineering-framework (rulebook)', path: fw }],
      // The rulebook is read-only in the editor: changes go through the weekly retro.
      settings: {
        'github.copilot.chat.codeGeneration.useInstructionFiles': true, // Copilot: load copilot-instructions.md
        'chat.useAgentsMdFile': false, // Copilot: don't also load AGENTS.md (same rules twice)
        'chat.useClaudeMdFile': false, // ...nor CLAUDE.md, when the workspace is also set up for Claude Code
        'files.readonlyInclude': { [`${fw}/**`]: true },
        // Copilot: auto-approve ONLY the local snapshot command, with a plain message
        // and nothing chained after it (no quotes, ;, &, |, $ or backticks inside).
        'chat.tools.terminal.autoApprove': {
          [`/^${snapshotCmd(fw).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\//g, '\\/')}( "[\\w .:()#-]*")?$/`]: true,
          // ...and the read-only client-free check on a report in feedback/.
          [`/^${exportCmd(fw).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\//g, '\\/')} feedback\\/[\\w.-]+\\.md$/`]: true,
        },
      },
    }, null, 2) + '\n';
  }
  return out;
}

// Claude Code permission rules use POSIX paths; "//" anchors at the filesystem root
// and Windows drives normalize to /c/... (C:/x -> //c/x).
export const ruleRoot = (p) => '/' + p.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, d) => `/${d.toLowerCase()}`);

// Claude Code may only read files under its working directory unless allowed:
// merge the rulebook (+ repos) into permissions.additionalDirectories, and deny
// edits to the rulebook (an Edit deny covers every file-writing tool).
function writeClaudeSettings(ws, fw, repos) {
  const p = join(ws, '.claude/settings.json');
  let s = {};
  if (existsSync(p)) { try { s = JSON.parse(read(p)); } catch { throw new Error(`${p} is not valid JSON; fix or delete it`); } }
  s.permissions = s.permissions || {};
  const dirs = new Set(s.permissions.additionalDirectories || []);
  dirs.add(fw);
  for (const r of asList(repos)) dirs.add(r);
  s.permissions.additionalDirectories = [...dirs];
  const deny = new Set(s.permissions.deny || []);
  deny.add(`Edit(${ruleRoot(fw)}/**)`);
  s.permissions.deny = [...deny];
  // Pre-approve ONLY the local snapshot command (Claude Code checks each part of a
  // chained command separately, so nothing can ride along with it).
  const allow = new Set(s.permissions.allow || []);
  allow.add(`Bash(${snapshotCmd(fw)}:*)`);
  allow.add(`Bash(${exportCmd(fw)}:*)`); // read-only client-free check
  s.permissions.allow = [...allow];
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(s, null, 2) + '\n');
}

// Generated files people also edit by hand: merged on update, never replaced.
const MERGED = [/\.code-workspace$/, /^\.cursor\/cli\.json$/];
// Hand edits to other generated files are kept here before they're replaced.
const BACKUP_DIR = '.engfw-backup';
function keepCopy(ws, rel, text, stamp) {
  const p = join(ws, BACKUP_DIR, stamp, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, text);
  console.log(`  NOTE ${rel} had local edits: replaced, your version is in ${BACKUP_DIR}/${stamp}/${rel}`);
}
function mergeSettings(rel, oldText, oursText, ws, stamp) {
  let mine;
  try { mine = JSON.parse(oldText); } catch {
    keepCopy(ws, rel, oldText, stamp); // not plain JSON (comments?): can't merge safely
    return oursText;
  }
  const ours = JSON.parse(oursText);
  const out = { ...mine, ...ours };
  if (/\.code-workspace$/.test(rel)) {
    // Our folders first (current paths), then any folder someone added.
    const ourNames = new Set(ours.folders.map((f) => f.name));
    const isOurs = (n = '') => ourNames.has(n) || / repos: /.test(n) || n === 'engineering-framework (rulebook)';
    out.folders = [...ours.folders, ...(mine.folders || []).filter((f) => !isOurs(f.name))];
    out.settings = { ...(mine.settings || {}) };
    for (const [k, v] of Object.entries(ours.settings)) {
      out.settings[k] = v && typeof v === 'object' && !Array.isArray(v) ? { ...(mine.settings?.[k] || {}), ...v } : v;
    }
  } else {
    out.permissions = { ...(mine.permissions || {}) };
    for (const [k, v] of Object.entries(ours.permissions)) out.permissions[k] = [...new Set([...(mine.permissions?.[k] || []), ...v])];
  }
  return JSON.stringify(out, null, 2) + '\n';
}

function install(ws, cfg) {
  const files = render(cfg);
  // Remove generated skills that no longer exist in the rulebook (never the user's own).
  for (const base of ['.claude/skills', '.agents/skills']) {
    const sk = join(ws, base);
    if (!existsSync(sk)) continue;
    for (const d of readdirSync(sk)) {
      const p = join(sk, d, 'SKILL.md');
      if (existsSync(p) && read(p).includes('Generated by engineering-framework') && !files[`${base}/${d}/SKILL.md`]) {
        rmSync(join(sk, d), { recursive: true, force: true });
        console.log(`  removed ${base}/${d} (no longer in the rulebook or not opted in)`);
      }
    }
  }
  let prev = {};
  try { prev = JSON.parse(read(join(ws, CONFIG))); } catch { /* first install */ }
  const generated = {};
  const stamp = new Date().toISOString().slice(0, 10);
  for (const [rel, generatedContent] of Object.entries(files)) {
    const p = join(ws, rel);
    mkdirSync(dirname(p), { recursive: true });
    let content = generatedContent;
    const old = existsSync(p) ? read(p) : null;
    if (old !== null && MERGED.some((re) => re.test(rel))) {
      // Settings files people edit too: keep their entries, enforce ours.
      content = mergeSettings(rel, old, generatedContent, ws, stamp);
    } else if (old !== null && prev.generated?.[rel] && sha(old) !== prev.generated[rel] && old !== normalize(generatedContent)) {
      // Edited by hand since we wrote it: keep a copy before replacing it.
      keepCopy(ws, rel, old, stamp);
    }
    writeFileSync(p, content);
    generated[rel] = sha(content);
    console.log(`  wrote ${rel}`);
  }
  if (cfg.tools.includes('claude')) { writeClaudeSettings(ws, cfg.framework, cfg.repos); console.log('  wrote .claude/settings.json'); }
  const commit = (() => { try { return gitOut(ROOT, ['rev-parse', '--short', 'HEAD']); } catch { return 'unknown'; } })();
  // Merge with what's there: keep settings other commands own (backupDir, lastBackup).
  writeFileSync(join(ws, CONFIG), JSON.stringify({ ...prev, ...cfg, version: frameworkVersion(), commit, generated }, null, 2) + '\n');
  remember(ws);
  installPullHook();
}

// This machine's workspaces, so `refresh` can update them all. Local only
// (gitignored): paths never leave the laptop.
// ENGFW_REGISTRY points tests and the simulator at their own list.
const REGISTRY = process.env.ENGFW_REGISTRY || join(ROOT, '.workspaces.local.json');
function known() {
  try { return JSON.parse(read(REGISTRY)); } catch { return []; }
}
function remember(ws) {
  const list = new Set(known());
  list.add(slash(ws));
  writeFileSync(REGISTRY, JSON.stringify([...list].sort(), null, 2) + '\n');
}

function gitOut(cwd, args, env = CHILD_ENV) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env }).trim();
}

// Pull the rulebook as ITS owner without switching the active GitHub account (on a
// client laptop that's usually the client work account). Set once per machine:
//   git -C <rulebook> config engfw.githubUser <owner>
// The owner's token (from `gh auth token --user`) goes into this one git call
// through environment-only config, so nothing is stored or shown in the command.
function rulebookGitEnv() {
  let user = '';
  try { user = gitOut(ROOT, ['config', '--get', 'engfw.githubUser']); } catch { return CHILD_ENV; }
  let token = '';
  try { token = execFileSync('gh', ['auth', 'token', '--user', user], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: CHILD_ENV }).trim(); } catch {
    console.log(`WARNING: couldn't get a GitHub token for "${user}" (gh auth token --user ${user}). Sign that account into gh once: gh auth login`);
    return CHILD_ENV;
  }
  const header = `Authorization: Basic ${Buffer.from(`x-access-token:${token}`).toString('base64')}`;
  return { ...CHILD_ENV, GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader', GIT_CONFIG_VALUE_0: header };
}
const isMaintainer = () => { try { return gitOut(ROOT, ['config', '--get', 'engfw.maintainer']) === 'true'; } catch { return false; } };

// Turn a failed git network call into a plain-language cause + fix.
export function explainGit(stderr) {
  const s = String(stderr || '');
  if (/repository not found|authentication failed|could not read username|permission denied|403|401|access denied/i.test(s)) {
    return 'GitHub refused access: the account git used can\'t see the rulebook (usually the client work account '
      + 'is active). Don\'t switch accounts. Tell the rulebook which account owns it, once: '
      + '`git -C <rulebook> config engfw.githubUser <owner>` (that account must be signed into gh: `gh auth login`), '
      + 'then run `node <rulebook>/tools/workspace.mjs upgrade`. Or re-clone with the read-only token (UPDATING.md).';
  }
  if (/could not resolve host|timed out|unable to access|failed to connect|network is unreachable|proxy/i.test(s)) {
    return 'Network problem reaching GitHub (offline, proxy or VPN). Try again when connected.';
  }
  if (/openssl configuration error/i.test(s)) {
    return 'A broken OPENSSL_CONF setting on this machine (SETUP.md, "Node or git won\'t start").';
  }
  return `git said: ${s.trim().split('\n').slice(-2).join(' ')}`;
}

// Where the rulebook stands vs GitHub: uncommitted edits, local commits, missed updates.
function rulebookState({ fetch = true } = {}) {
  const st = { commit: 'unknown', dirty: '', ahead: '', behind: '', fetchError: '' };
  try { st.commit = gitOut(ROOT, ['rev-parse', '--short', 'HEAD']); } catch { return st; } // not a git clone
  try { st.dirty = gitOut(ROOT, ['status', '--porcelain']); } catch { /* ignore */ }
  if (fetch && !process.env.ENGFW_NO_FETCH) {
    try { gitOut(ROOT, ['fetch', '-q'], rulebookGitEnv()); } catch (e) { st.fetchError = explainGit(e.stderr); }
  }
  try { st.ahead = gitOut(ROOT, ['log', '--oneline', '@{u}..HEAD']); } catch { /* no upstream */ }
  try { st.behind = gitOut(ROOT, ['log', '--oneline', 'HEAD..@{u}']); } catch { /* no upstream */ }
  return st;
}

// A deliberate rollback (UPDATING.md "Going back a version"): engfw.hold names
// the older commit this laptop stays on until the next `upgrade`.
function heldHere() {
  try { return gitOut(ROOT, ['rev-parse', gitOut(ROOT, ['config', '--get', 'engfw.hold'])]) === gitOut(ROOT, ['rev-parse', 'HEAD']); } catch { return false; }
}

// Workspaces must be generated from the released rulebook, never from a draft:
// refuse on a client laptop if it has local edits, local commits or missed updates.
function guardRulebook() {
  const st = rulebookState();
  const list = (s) => s.split('\n').map((l) => `    ${l}`).join('\n');
  const problems = [];
  if (st.dirty) problems.push(`  uncommitted changes:\n${list(st.dirty)}`);
  if (st.ahead) problems.push(`  local commits not on main:\n${list(st.ahead)}`);
  if (st.behind && heldHere()) console.log(`NOTE: rulebook held at ${st.commit} (rolled back on purpose; \`upgrade\` moves forward again).`);
  else if (st.behind) problems.push(`  ${st.behind.split('\n').length} update(s) on main not pulled yet`);
  if (st.fetchError) console.log(`WARNING: couldn't check GitHub for updates. ${st.fetchError}`);
  if (!problems.length) return st;
  const msg = `The rulebook here isn't the released version, so a workspace built from it could miss fixes or protections:\n${problems.join('\n')}`;
  if (isMaintainer()) { console.log(`WARNING (maintainer machine, continuing): ${msg}`); return st; }
  console.error(msg);
  console.error('\nFix: `git -C <rulebook> pull` for updates. Local edits belong in the weekly retro, not here:');
  console.error('  git -C <rulebook> stash   (keeps them aside)   or   git -C <rulebook> reset --hard @{u}   (drops them)');
  process.exit(1);
}

// Pull the latest rulebook (fast-forward only), then update every workspace on
// this machine. Refuses if the rulebook was edited locally: it must stay portable.
function cmdUpgrade() {
  const before = frameworkVersion();
  const st = rulebookState();
  if (st.fetchError) die(st.fetchError);
  if (st.dirty || st.ahead) {
    console.error('The rulebook has local changes, so it is no longer the shared baseline:\n');
    if (st.dirty) console.error(st.dirty.split('\n').map((l) => `  ${l}`).join('\n'));
    if (st.ahead) console.error(st.ahead.split('\n').map((l) => `  ${l}`).join('\n'));
    console.error('\nChanges belong in the weekly retro report, not here. To drop them:');
    console.error('  git -C <rulebook> stash   (keeps them aside)   or   git -C <rulebook> reset --hard @{u}   (drops them)');
    process.exit(1);
  }
  try {
    execFileSync('git', ['pull', '--ff-only', '-q'], { cwd: ROOT, stdio: ['ignore', 'inherit', 'pipe'], env: { ...rulebookGitEnv(), ENGFW_NO_HOOK: '1' } });
  } catch (e) { die(`git pull failed. ${explainGit(e.stderr)}`); }
  try { execFileSync('git', ['config', '--unset', 'engfw.hold'], { cwd: ROOT, stdio: 'ignore', env: CHILD_ENV }); } catch { /* wasn't held */ }
  console.log(`Rulebook: v${before} -> v${frameworkVersion()}`);
  cmdRefresh();
}

// Regenerate every workspace on this machine from the current rulebook (no pull).
// Runs automatically after `git pull` via the post-merge hook.
function cmdRefresh() {
  const list = known();
  if (!list.length) console.log('No workspaces registered on this machine yet (run `new`, or `update <path>` once).');
  let failed = 0;
  for (const ws of list) {
    if (!existsSync(join(ws, CONFIG))) { console.log(`  skipped ${ws} (no longer a workspace)`); continue; }
    try {
      execFileSync(process.execPath, [fileURLToPath(import.meta.url), 'update', ws], { stdio: 'inherit', env: { ...CHILD_ENV, ENGFW_NO_FETCH: '1' } });
    } catch { failed++; console.error(`!!! FAILED to refresh ${ws} (see the error above)`); }
  }
  if (failed) { console.error(`\n!!! ${failed} workspace(s) NOT refreshed. Run: node ${slash(ROOT)}/tools/workspace.mjs doctor`); process.exit(1); }
  console.log(`\nWorkspaces on v${frameworkVersion()}. Start new chats so agents load the new rules.`);
}

// Make a plain `git pull` enough: a post-merge hook in the rulebook runs `refresh`
// (with OPENSSL_CONF cleared) and says so LOUDLY if it fails; pulls are
// fast-forward only so local commits can't merge in.
const HOOK_MARK = '# engineering-framework: refresh workspaces after git pull';
const HOOK = `#!/bin/sh
${HOOK_MARK} (v2)
[ -n "$ENGFW_NO_HOOK" ] && exit 0
ROOT="$(git rev-parse --show-toplevel)"
if ! command -v node >/dev/null 2>&1; then
  echo "!!! engineering-framework: node not found, so your workspaces were NOT refreshed. Install Node, then run: node \\"$ROOT/tools/workspace.mjs\\" refresh"
  exit 0
fi
env -u OPENSSL_CONF node "$ROOT/tools/workspace.mjs" refresh || {
  echo "!!! engineering-framework: workspace refresh FAILED after this pull. Your agents still have the OLD rules."
  echo "!!! Run: node \\"$ROOT/tools/workspace.mjs\\" doctor   (see SETUP.md)"
}
exit 0
`;
function installPullHook() {
  if (process.env.ENGFW_TEST) return; // tests and the simulator leave the rulebook's git alone
  let hooks;
  try { hooks = resolve(ROOT, gitOut(ROOT, ['rev-parse', '--git-path', 'hooks'])); } catch { return; } // not a git clone
  const p = join(hooks, 'post-merge');
  if (existsSync(p) && !read(p).includes(HOOK_MARK)) return; // someone else's hook: leave it
  mkdirSync(hooks, { recursive: true });
  writeFileSync(p, HOOK, { mode: 0o755 });
  try { execFileSync('git', ['config', 'pull.ff', 'only'], { cwd: ROOT, stdio: 'ignore', env: CHILD_ENV }); } catch { /* best effort */ }
  blockPush();
}

// Client laptops are pull-only: point origin's PUSH url at a name that can't
// resolve, so `git push` fails with a pointer to UPDATING.md. Pulls still use
// the normal url. The maintainer's machine opts out: git config engfw.maintainer true
export const PUSH_BLOCK = 'NO-PUSH-from-client-laptops--changes-go-through-the-weekly-retro--see-UPDATING.md';
function blockPush() {
  if (isMaintainer()) return;
  try { execFileSync('git', ['config', 'remote.origin.pushurl', PUSH_BLOCK], { cwd: ROOT, stdio: 'ignore', env: CHILD_ENV }); } catch { /* best effort */ }
}

function git(ws, args) {
  try { execFileSync('git', args, { cwd: ws, stdio: 'ignore', env: CHILD_ENV }); return true; } catch { return false; }
}

// Commit everything in a workspace. Returns 'committed' or 'nothing'; THROWS on
// failure, so "nothing to save" and "couldn't save" are never confused. A laptop
// with no git name/email gets a local-only identity for this workspace.
function commitAll(ws, msg) {
  for (const [k, v] of [['user.name', 'engineering-framework'], ['user.email', 'workspace@localhost']]) {
    try { gitOut(ws, ['config', '--get', k]); } catch { gitOut(ws, ['config', k, v]); }
  }
  gitOut(ws, ['add', '-A']);
  if (!gitOut(ws, ['status', '--porcelain'])) return 'nothing';
  gitOut(ws, ['commit', '-q', '-m', msg]);
  return 'committed';
}
const gitErr = (e) => String(e.stderr || e.message || e).trim().split('\n').slice(-3).join(' ');

// Client isolation on disk: a workspace never sits inside the rulebook (or holds
// it), and its folders never overlap another workspace registered on this machine.
function checkPaths(ws, repos) {
  if (within(ws, ROOT) || within(ROOT, ws)) die('create the workspace OUTSIDE the framework repo (and not around it), so client data never lands in it');
  for (const r of repos) if (within(r, ROOT)) die(`--repos ${r} is inside the rulebook: client code never goes there`);
  for (const other of known().filter((w) => canon(w) !== canon(ws) && existsSync(w))) {
    if (within(ws, other) || within(other, ws)) die(`${ws} overlaps another workspace on this machine (${other}): one folder per client, never nested`);
    for (const r of repos) if (within(r, other)) die(`--repos ${r} is inside another workspace (${other}): repos belong to one client`);
  }
}

function cmdNew(client, path, tools, repos, toolchains) {
  if (!client || !path) usage();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(client)) die('client name: lowercase letters, digits and dashes (e.g. client-a)');
  const ws = resolve(path);
  checkPaths(ws, repos);
  if (existsSync(ws) && readdirSync(ws).length) die(`${ws} already exists and is not empty`);
  guardRulebook();
  cpSync(TEMPLATE, ws, { recursive: true });
  for (const f of ['context.md', 'NOW.md', 'rules.md']) {
    const p = join(ws, f);
    writeFileSync(p, read(p).replaceAll('<CLIENT>', client));
  }
  const cfg = { client, framework: slash(ROOT), tools, ...(repos.length ? { repos: repos.map(slash) } : {}), ...(toolchains ? { toolchains } : {}) };
  console.log(`Creating workspace for ${client} at ${ws}`);
  install(ws, cfg);
  if (git(ws, ['init', '-q'])) {
    try {
      commitAll(ws, `Create ${client} workspace (engineering-framework v${frameworkVersion()})`);
      console.log('  git: initialised local history (no remote)');
    } catch (e) { console.log(`  WARNING git: history created but the first commit FAILED (${gitErr(e)}). Snapshots will fail until this is fixed.`); }
  }
  console.log('\nNext: open the WORKSPACE (not the rulebook, not a single repo) and say "onboard me":');
  if (tools.includes('claude')) console.log(`  Claude Code:      cd "${ws}" && claude`);
  const wsFile = join(ws, `${client}.code-workspace`);
  if (tools.includes('copilot')) console.log(`  VS Code/Copilot:  File > Open Workspace from File > ${wsFile}`);
  if (tools.includes('cursor')) console.log(`  Cursor:           File > Open Workspace from File > ${wsFile}`);
}

function cmdUpdate(path, repos, toolchains) {
  if (!path) usage();
  const ws = resolve(path);
  const p = join(ws, CONFIG);
  if (!existsSync(p)) die(`${ws} is not a workspace (no ${CONFIG})`);
  guardRulebook();
  const cfg = JSON.parse(read(p));
  cfg.framework = slash(ROOT); // the framework may have moved
  const repoList = repos.length ? repos.map(slash) : asList(cfg.repos);
  checkPaths(ws, repoList);
  console.log(`Updating ${cfg.client} workspace at ${ws} to v${frameworkVersion()}`);
  const tc = toolchains || cfg.toolchains;
  install(ws, { client: cfg.client, framework: cfg.framework, tools: cfg.tools, ...(repoList.length ? { repos: repoList } : {}), ...(tc ? { toolchains: tc } : {}) });
  syncTemplate(ws, cfg.client);
  console.log('Done. Your notes (context, rules, NOW, projects, logs) were not touched.');
}

// Bring an existing workspace up to the current template without touching notes:
// add any file or folder that's missing (at any depth), and refresh the blank
// project template (projects/_new) completely, since it holds no notes.
function syncTemplate(ws, client) {
  const fill = (text) => text.replaceAll('<CLIENT>', client);
  const walk = (rel) => {
    for (const e of readdirSync(join(TEMPLATE, rel), { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      const dst = join(ws, r);
      const isNewTemplate = r === 'projects/_new' || r.startsWith('projects/_new/');
      if (e.isDirectory()) {
        if (!existsSync(dst)) { mkdirSync(dst, { recursive: true }); console.log(`  added ${r}/ (new in this version)`); }
        walk(r);
      } else {
        const existed = existsSync(dst);
        if (existed && !(isNewTemplate && read(dst) !== fill(read(join(TEMPLATE, r))))) continue;
        writeFileSync(dst, fill(read(join(TEMPLATE, r))));
        console.log(`  ${existed ? 'refreshed' : 'added'} ${r}`);
      }
    }
  };
  walk('');
}

// One-screen health check for this machine (and a workspace, if given).
// "check setup" runs it. Every line is OK or FIX with the exact fix.
function cmdDoctor(path) {
  const ok = (m) => console.log(`OK   ${m}`);
  const fix = (m) => console.log(`FIX  ${m}`);
  console.log(`engineering-framework doctor (rulebook v${frameworkVersion()})\n`);
  ok(`Node ${process.version} runs`);
  if (process.env.OPENSSL_CONF) {
    fix(`OPENSSL_CONF is set (${process.env.OPENSSL_CONF}). If node or git fail with "OpenSSL configuration error", see SETUP.md "Node or git won't start". The pull hook already clears it.`);
  }
  const st = rulebookState();
  if (st.commit === 'unknown') fix('The rulebook is not a git clone: re-clone it (README Quick start).');
  else {
    ok(`Rulebook at commit ${st.commit}${isMaintainer() ? ' (maintainer machine)' : ''}`);
    if (st.fetchError) fix(`Can't check GitHub: ${st.fetchError}`);
    if (st.dirty) fix('Rulebook has uncommitted changes: `git -C <rulebook> stash` (UPDATING.md).');
    if (st.ahead) fix('Rulebook has local commits not on main: `git -C <rulebook> reset --hard @{u}`.');
    if (st.behind && heldHere()) ok(`Rulebook held at ${st.commit} on purpose (rollback); \`upgrade\` moves forward`);
    else if (st.behind) fix(`Rulebook is ${st.behind.split('\n').length} update(s) behind: \`git -C <rulebook> pull\`.`);
    if (!st.dirty && !st.ahead && !st.behind && !st.fetchError) ok('Rulebook matches main on GitHub');
    let hook = '';
    try { hook = read(join(resolve(ROOT, gitOut(ROOT, ['rev-parse', '--git-path', 'hooks'])), 'post-merge')); } catch { /* none */ }
    if (hook.includes(`${HOOK_MARK} (v2)`)) ok('Pull hook installed (git pull refreshes workspaces)');
    else fix('Pull hook missing or outdated: run `node <rulebook>/tools/workspace.mjs update <workspace>` once.');
    let push = '';
    try { push = gitOut(ROOT, ['config', '--get', 'remote.origin.pushurl']); } catch { /* unset */ }
    if (isMaintainer()) ok('Pushing allowed (maintainer machine)');
    else if (push === PUSH_BLOCK) ok('Pushing blocked (client laptop)');
    else fix('Pushing is not blocked: run `update <workspace>` once.');
  }
  if (!path) { console.log('\n(Pass a workspace path to check it too.)'); return; }
  const ws = resolve(path);
  if (!existsSync(join(ws, CONFIG))) { fix(`${ws} is not a workspace. Open the workspace folder, not the rulebook or a repo.`); return; }
  const cfg = JSON.parse(read(join(ws, CONFIG)));
  ok(`Workspace "${cfg.client}" for ${cfg.tools.join(', ')}`);
  if (cfg.version !== frameworkVersion() || (cfg.commit && st.commit !== 'unknown' && cfg.commit !== st.commit)) {
    fix(`Workspace was generated from v${cfg.version} (${cfg.commit || 'unknown commit'}), rulebook is v${frameworkVersion()} (${st.commit}): run \`update ${slash(ws)}\`.`);
  } else ok('Workspace generated from the current rulebook');
  if (known().includes(slash(ws))) ok('Workspace registered (git pull refreshes it)');
  else fix('Workspace not registered on this machine: run `update` on it once.');
  for (const r of asList(cfg.repos)) (existsSync(r) ? ok : fix)(`Repos folder ${r}${existsSync(r) ? '' : ' is missing: fix with update --repos <folder>'}`);
  // Files read every chat have line limits (keep in step with agents/team.md).
  for (const [f, max] of [['context.md', 120], ['NOW.md', 100], ['rules.md', 80]]) {
    const fp = join(ws, f);
    if (!existsSync(fp)) { fix(`${f} missing: run update`); continue; }
    const n = read(fp).split('\n').length;
    if (n > max) fix(`${f} is ${n} lines (limit ~${max}): say "tidy" in a chat.`);
  }
  // The workspace's git must stay local: a remote would let client notes be pushed.
  let wsRemotes = '';
  try { wsRemotes = gitOut(ws, ['remote', '-v']); } catch { /* no git yet */ }
  if (wsRemotes) fix(`This workspace has a git remote, so client notes could be pushed off this laptop: ${wsRemotes.split('\n')[0]}. Remove it: git -C "${slash(ws)}" remote remove <name> (backups use the backup command instead).`);
  else ok('Workspace history is local only (no git remote)');
  // Backups: the workspace is the only copy of this client's memory.
  if (!cfg.backupDir) fix(`No backup set up. Run: node ${slash(ROOT)}/tools/workspace.mjs backup ${slash(ws)} --to <client-approved folder>`);
  else {
    const age = cfg.lastBackup ? Math.floor((Date.now() - Date.parse(cfg.lastBackup)) / 86400000) : Infinity;
    if (age > 7) fix(`Last backup ${cfg.lastBackup ? `${age} days ago` : 'never'}: run \`backup ${slash(ws)}\`.`);
    else ok(`Backed up ${age === 0 ? 'today' : `${age} day(s) ago`} to ${cfg.backupDir}`);
  }
  // Secrets that slipped into the workspace notes (masked in the output).
  const hits = scanSecrets(ws);
  if (hits.length) for (const h of hits) fix(`Possible secret in ${h.file}:${h.line} (${h.kind}): remove it, then rotate it if it was real.`);
  else ok('No secrets found in workspace notes');
}

// Patterns for credentials that must never sit in workspace notes. Scans text
// files (notes, saved scripts, queries, configs) outside repos/ (client code has
// its own scanners) and .git.
const SCANNED = /\.(md|txt|json|jsonc|ya?ml|ps1|psm1|psd1|sh|bash|tf|tfvars|bicep|kql|sql|csv|ini|conf|cfg|xml|py|js|ts)$|^\.env/i;
const SECRET_PATTERNS = [
  ['Azure SAS signature', /[?&]sig=[A-Za-z0-9%+/=]{20,}/],
  ['Azure storage/service bus key', /(AccountKey|SharedAccessKey)=[A-Za-z0-9+/=]{20,}/],
  ['AWS access key id', /\b(AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['GitHub token', /\b(gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/],
  ['Private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ['JWT / bearer token', /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/],
  ['Password assignment', /\b(password|passwd|pwd|client_secret|secret)\s*[:=]\s*["']?[^\s"'<>(){}]{8,}/i],
];
export function scanSecrets(ws) {
  const hits = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (['.git', 'repos', 'node_modules'].includes(e.name)) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!SCANNED.test(e.name) || statSync(p).size > 2_000_000) continue;
      read(p).split('\n').forEach((l, i) => {
        for (const [kind, re] of SECRET_PATTERNS) if (re.test(l)) hits.push({ file: slash(p).slice(slash(ws).length + 1), line: i + 1, kind });
      });
    }
  };
  walk(ws);
  return hits;
}

// Back up a workspace as ONE git bundle file into a folder the client approves
// (e.g. their OneDrive/SharePoint, an encrypted drive). Commits pending changes
// first (local only). Restore: git clone <bundle> <workspace path>.
function cmdBackup(path, to, anyway) {
  if (!path) usage();
  const ws = resolve(path);
  const p = join(ws, CONFIG);
  if (!existsSync(p)) die(`${ws} is not a workspace (no ${CONFIG})`);
  const cfg = JSON.parse(read(p));
  const dir = to ? slash(to) : cfg.backupDir;
  if (!dir) die('Where to? First time: add --to <client-approved folder> (it is remembered).');
  if (!existsSync(dir)) die(`${dir} does not exist`);
  const hits = scanSecrets(ws);
  if (hits.length) {
    console.log(`${anyway ? 'WARNING' : 'STOPPED'}: ${hits.length} possible secret(s) in the workspace would be copied into this backup:`);
    for (const h of hits) console.log(`  ${h.file}:${h.line} (${h.kind})`);
    if (!anyway) {
      console.log('  Remove them and rotate any that were real (older snapshots still hold them: rotating is the fix).');
      console.log('  If they are false alarms, back up with --anyway.');
      process.exit(1);
    }
  }
  const stamp = new Date().toISOString().slice(0, 10);
  try { commitAll(ws, `backup ${stamp}`); } catch (e) { die(`couldn't commit the workspace before backing up, so NO backup was made: ${gitErr(e)}`); }
  const file = join(dir, `${cfg.client}-workspace-${stamp}.bundle`);
  try {
    execFileSync('git', ['bundle', 'create', file, '--all'], { cwd: ws, stdio: ['ignore', 'ignore', 'pipe'], env: CHILD_ENV });
    execFileSync('git', ['bundle', 'verify', '-q', file], { cwd: ws, stdio: ['ignore', 'ignore', 'pipe'], env: CHILD_ENV });
  } catch (e) { die(`backup FAILED, nothing recorded as backed up: ${gitErr(e)}`); }
  // Recorded only now, after the bundle exists and verifies.
  cfg.backupDir = dir; cfg.lastBackup = new Date().toISOString();
  writeFileSync(p, JSON.stringify(cfg, null, 2) + '\n');
  console.log(`Backed up ${cfg.client} workspace to ${slash(file)} (verified)`);
  console.log(`Restore with: git clone "${slash(file)}" <workspace path>   (repos/ isn't included: client code lives in its own remotes)`);
}

// The ONE command agents may run without asking: a local snapshot (commit) of the
// workspace notes. It never pushes, and refuses outright if the workspace has
// a git remote, so client notes can't be sent anywhere by it.
export const snapshotCmd = (fw) => `node ${/\s/.test(fw) ? `"${fw}/tools/workspace.mjs"` : `${fw}/tools/workspace.mjs`} snapshot`;
export const exportCmd = (fw) => snapshotCmd(fw).replace(/ snapshot$/, ' check-export');
function cmdSnapshot(message) {
  const ws = process.cwd();
  if (!existsSync(join(ws, CONFIG))) die('Run snapshot from inside a client workspace.');
  let remotes = '';
  try { remotes = gitOut(ws, ['remote']); } catch { die('This workspace has no git history: run `update` on it once.'); }
  if (remotes) die(`REFUSED: this workspace has a git remote (${remotes.split('\n').join(', ')}), so a commit could later be pushed off this laptop. Remove it: git -C "${slash(ws)}" remote remove <name>`);
  const msg = (message || `snapshot ${new Date().toISOString().slice(0, 10)}`).replace(/[^\w .:/()#-]/g, '').slice(0, 120);
  let result;
  try { result = commitAll(ws, msg); } catch (e) { die(`Snapshot FAILED, nothing was saved: ${gitErr(e)}`); }
  if (result === 'nothing') console.log('Nothing new to snapshot (everything was already saved).');
  else console.log(`Snapshot saved on this laptop only: ${gitOut(ws, ['log', '--oneline', '-1'])}`);
  const hits = scanSecrets(ws);
  if (hits.length) {
    console.log(`WARNING: ${hits.length} possible secret(s) in the workspace (now in its history too). Remove them and rotate any that are real:`);
    for (const h of hits) console.log(`  ${h.file}:${h.line} (${h.kind})`);
  }
}

// Deterministic client-free check for anything leaving the workspace (the weekly
// retro report): flags this client's own identifiers (client name, people, names
// from inventory/context, domains) and identifier-shaped strings (IPs, GUIDs,
// emails, resource IDs). Run from the workspace: check-export <file>. Exit 1 on hits.
export function exportTerms(ws, client) {
  const terms = new Set([client]);
  const text = (f) => (existsSync(join(ws, f)) ? read(join(ws, f)) : '');
  const ctx = text('context.md'); const inv = text('inventory.md');
  const people = ctx.split(/^## People\s*$/m).slice(1).map((s) => s.split(/^## /m)[0]).join('\n');
  for (const l of people.split('\n')) { const n = l.replace(/^[-*]\s*/, '').split(/\s+[—–-]\s+/)[0].trim(); if (/^[A-Z][\w'.-]+( [A-Z][\w'.-]+)*$/.test(n)) terms.add(n); }
  for (const l of inv.split('\n')) { const cols = l.replace(/^- /, '').split(' · '); if (cols.length >= 4) terms.add(cols[2].split(' (')[0].trim()); }
  // Resource-style names (two or more dashes) and domains, wherever the notes mention them.
  for (const m of `${ctx}\n${inv}`.matchAll(/\b[a-z][a-z0-9]*(?:-[a-z0-9]+){2,}\b/g)) terms.add(m[0]);
  for (const m of `${ctx}\n${inv}`.matchAll(/\b[a-z0-9-]+\.(?:onmicrosoft\.com|[a-z0-9-]+\.(?:com|net|org|io|local|corp|internal))\b/gi)) terms.add(m[0]);
  return [...terms].filter((t) => t && t.length >= 3 && !/^(e\.g|i\.e|n\/a|-)$/i.test(t));
}
const EXPORT_PATTERNS = [
  ['IPv4 address', /\b(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?\b/],
  ['GUID', /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i],
  ['email address', /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/],
  ['Azure resource ID', /\/subscriptions\/[^\s/]+\/resourceGroups\//i],
  ['AWS ARN / account', /\barn:aws:|\b\d{12}\b/],
];
function cmdCheckExport(file) {
  if (!file) usage();
  const ws = process.cwd();
  if (!existsSync(join(ws, CONFIG))) die('Run check-export from inside the client workspace.');
  if (!existsSync(file)) die(`${file} not found`);
  const { client } = JSON.parse(read(join(ws, CONFIG)));
  const terms = exportTerms(ws, client);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hits = [];
  read(file).split('\n').forEach((l, i) => {
    for (const t of terms) if (new RegExp(`(^|[^\\w-])${esc(t)}($|[^\\w-])`, 'i').test(l)) hits.push(`${slash(file)}:${i + 1}: "${t}" (this client's notes)`);
    for (const [kind, re] of EXPORT_PATTERNS) { const m = l.match(re); if (m) hits.push(`${slash(file)}:${i + 1}: ${kind} "${m[0]}"`); }
  });
  if (hits.length) {
    console.log(`NOT client-free: ${hits.length} hit(s). Rewrite these generically, then run this again:`);
    for (const h of hits) console.log(`  ${h}`);
    process.exit(1);
  }
  console.log(`Client-free check passed: none of ${terms.length} identifiers from this workspace, and no IPs, GUIDs, emails or resource IDs.`);
}

// Offboarding: stop refreshing a workspace on this machine (after it has been
// handed over, backed up and deleted per the offboard-a-client playbook).
function cmdForget(path) {
  if (!path) usage();
  const list = known().filter((w) => w !== slash(resolve(path)));
  writeFileSync(REGISTRY, JSON.stringify(list, null, 2) + '\n');
  console.log(`Forgot ${slash(resolve(path))}: git pull will no longer refresh it.`);
}

function usage() {
  console.error([
    'usage:',
    '  node tools/workspace.mjs new <client> <path> [--tools claude,copilot,cursor,codex] [--repos <dir>]... [--toolchains a,b]',
    '  node tools/workspace.mjs update <path> [--repos <dir>]... [--toolchains a,b]',
    '  node tools/workspace.mjs upgrade             (checked pull of the rulebook + refresh)',
    '  node tools/workspace.mjs refresh             (regenerate every workspace here; runs after git pull)',
    '  node tools/workspace.mjs doctor [<workspace>] (health check: what\'s OK, what to fix)',
    '  node tools/workspace.mjs backup <workspace> [--to <client-approved folder>] [--anyway]',
    '  node tools/workspace.mjs check-export <file>  (from a workspace: is this file client-free?)',
    '  node tools/workspace.mjs forget <workspace>   (offboarding: stop refreshing it here)',
  ].join('\n'));
  process.exit(2);
}
function die(msg) { console.error(`error: ${msg}`); process.exit(1); }

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const [cmd, ...rest] = process.argv.slice(2);
  const ti = rest.indexOf('--tools');
  let tools = ['claude', 'copilot']; // default; add cursor with --tools
  if (ti >= 0) { tools = (rest[ti + 1] || '').split(',').filter(Boolean); rest.splice(ti, 2); }
  if (!tools.length || tools.some((t) => !TOOLS.includes(t))) die(`--tools takes a comma list of: ${TOOLS.join(', ')}`);
  const repos = [];
  for (let ri = rest.indexOf('--repos'); ri >= 0; ri = rest.indexOf('--repos')) {
    const r = rest[ri + 1]; rest.splice(ri, 2);
    if (!r || !existsSync(r)) die(`--repos needs an existing folder (got: ${r || 'nothing'})`);
    repos.push(r);
  }
  // --toolchains terraform,bicep-arm,... : only those toolchain skills (default: all).
  const tci = rest.indexOf('--toolchains');
  let toolchains;
  if (tci >= 0) {
    toolchains = (rest[tci + 1] || '').split(',').filter(Boolean); rest.splice(tci, 2);
    const known = loadSkills().map((s) => s.toolchain).filter(Boolean);
    const bad = toolchains.filter((x) => !known.includes(x));
    if (bad.length) die(`unknown toolchain(s): ${bad.join(', ')}. Choose from: ${known.join(', ')}`);
  }
  if (cmd === 'new') cmdNew(rest[0], rest[1], tools, repos, toolchains);
  else if (cmd === 'update') cmdUpdate(rest[0], repos, toolchains);
  else if (cmd === 'upgrade') cmdUpgrade();
  else if (cmd === 'refresh') cmdRefresh();
  else if (cmd === 'doctor') cmdDoctor(rest[0]);
  else if (cmd === 'backup') {
    const t = rest.indexOf('--to'); let to;
    if (t >= 0) { to = rest[t + 1]; rest.splice(t, 2); }
    const a = rest.indexOf('--anyway'); if (a >= 0) rest.splice(a, 1);
    cmdBackup(rest[0], to, a >= 0);
  } else if (cmd === 'check-export') cmdCheckExport(rest[0]);
  else if (cmd === 'forget') cmdForget(rest[0]);
  else if (cmd === 'snapshot') cmdSnapshot(rest.join(' '));
  else usage();
}
