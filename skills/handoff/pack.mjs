#!/usr/bin/env node
// Packs a PowerShell script into ONE paste-safe block for a machine that can't see
// this workspace (jump host, VDI): writes the file, checks its hash, runs it, checks
// the output. Read-only: prints the block, writes nothing. Node built-ins only.
//   node pack.mjs <script.ps1> --where "<where> · <shell + version> · <read-only | changes X>"
//        [--param Name=Value]... [--out <output file name>]
// The hash is computed here over the exact bytes the block writes (UTF-8 with BOM,
// CRLF), so it matches on Windows PowerShell 5.1 and PowerShell 7 alike.
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { createHash } from 'node:crypto';

const args = process.argv.slice(2);
const die = (m) => { console.error(`pack: ${m}`); process.exit(1); };
const take = (flag) => { const out = []; for (let i = args.indexOf(flag); i >= 0; i = args.indexOf(flag)) { out.push(args[i + 1]); args.splice(i, 2); } return out; };
const [where] = take('--where'); const params = take('--param'); const [outName] = take('--out');
const file = args[0];
if (!file || !where) die('usage: node pack.mjs <script.ps1> --where "<where> · <shell> · <read-only | changes X>" [--param Name=Value]... [--out <file>]');
if (!/\.ps1$/i.test(file)) die('only .ps1 scripts (queries go in their own complete block, not through this tool)');

let text = readFileSync(file, 'utf8').replace(/^﻿/, '').replace(/\r\n?/g, '\n').replace(/\n+$/, '');
if (/^'@/m.test(text)) die(`a line in ${file} starts with '@, which would end the here-string early: indent it or change it`);
// A pasted tab triggers tab completion in the PowerShell console and mangles the script.
if (text.includes('\t')) { text = text.replace(/\t/g, '    '); console.error('pack: note: tabs replaced with 4 spaces (pasted tabs trigger tab completion)'); }
if (/[^\x09\x0a\x0d\x20-\x7e]/.test(text)) console.error('pack: note: non-ASCII characters present; they survive (UTF-8 with BOM) but check them after pasting');

const bytes = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(text.replace(/\n/g, '\r\n'), 'utf8')]);
const hash = createHash('sha256').update(bytes).digest('hex').toUpperCase();
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const name = basename(file);
const call = [`& $ps1`, ...params.map((p) => {
  const i = p.indexOf('='); if (i < 1) die(`--param needs Name=Value (got: ${p})`);
  return `-${p.slice(0, i)} ${q(p.slice(i + 1))}`;
})];
const lines = [
  `# RUNS IN: ${where}`,
  `$dir = Join-Path $env:TEMP 'handoff'; New-Item -ItemType Directory -Force $dir | Out-Null`,
  `$ps1 = Join-Path $dir ${q(name)}`,
  `$src = @'`, text, `'@`,
  `[IO.File]::WriteAllText($ps1, (($src -split "\`r?\`n") -join "\`r\`n"), [Text.UTF8Encoding]::new($true))`,
  `if ((Get-FileHash $ps1).Hash -ne '${hash}') { throw 'Script altered in transfer: copy the whole block again' }`,
];
if (outName) {
  lines.push(`$out = Join-Path $dir ${q(outName)}; Remove-Item $out -ErrorAction SilentlyContinue`);
  call.push('-OutFile $out');
}
lines.push(call.join(' '));
if (outName) lines.push(`if (-not (Test-Path $out) -or (Get-Item $out).Length -eq 0) { throw 'No output written to ' + $out }`, `Write-Host "Output: $out"`);
console.log('```powershell');
console.log(lines.join('\n'));
console.log('```');
