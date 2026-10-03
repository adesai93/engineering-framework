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

## STOP and confirm — ONLY these two zones
1. Architecture *design* (you want the thinking) -> use plan mode.
2. Security-sensitive actions: exposing a secret, opening a network path,
   weakening/removing a gate, deleting data, anything irreversible.

## Never ask about
- Naming, structure, doc format, which playbook — these are decided.
- Anything answerable by reading base/ or the client overlay.
