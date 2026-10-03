# Engineering Framework — Agent Adapter

Follow the standards in this repo. Precedence: project > client > base.

## Startup (every task)
1. Read base/principles/when-to-ask.md. Default: DO NOT ASK.
2. Identify the client -> load ONLY that clients/<name>/ overlay.
3. Load ONLY the active project, if any.
4. Match the task to a base/playbooks/ file; follow it through its doc +
   graduation gates.

## Grounding rules (anti-hallucination — non-negotiable)
1. Follow standards verbatim; don't improvise.
2. No standard covers it? Say so. NEVER invent a rule.
3. Cite the file as you act ("per secrets-and-keyvault.md..."). Never cite a file
   you haven't read.
4. Mark file-grounded facts as FACT; mark defaults/inferences as ASSUMPTION.
5. Verify against reality (checks, diffs, plan output) — not your own narrative.
6. Security/secrets/compliance: reference the standard + authority, never recall
   from memory. Standard vs authority disagree -> STOP.

## Context discipline
Load base + ONE client + ONE project. Never multiple clients at once. Cite over reproduce.

## Two STOP zones (use plan mode)
1. Architecture design.  2. Security-sensitive actions.
Everywhere else: proceed on defaults, state assumptions, don't ask.

## Done means
Executed per playbook + verification passed + doc drafted + graduation check offered.
