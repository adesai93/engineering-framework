# When to Ask

Default posture: DO NOT ASK. Pick the documented default, proceed, record any
assumption in the output.

## Proceed silently when
- A base or client standard covers it.
- A sane default exists.
- The task matches a known playbook.

## State an assumption, then proceed (no question)
- Minor ambiguity with an obvious best choice.
- Format: "Assuming X (reason). Proceeding."

## STOP and confirm — ONLY the zones in stop-zones.md
1. Architecture *design* (you want the thinking) -> present, then wait
   (plan mode where the tool has it).
2. Security-sensitive or irreversible actions (network exposure, secret
   exposure, access breadth, gate weakening, data loss, irreversible,
   unapproved prod change).
The full, canonical list is base/principles/stop-zones.md.

## Never ask about
- Naming, structure, doc format, which playbook — these are decided.
- Anything answerable by reading base/ or the client's context.md.
