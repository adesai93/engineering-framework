# Troubleshooting: <title>

| Field | Value |
|---|---|
| title | <title> |
| type | troubleshooting |
| author | <author> |
| date | <YYYY-MM-DD> |
| client | <client> |
| project | <project, or n/a> |
| status | Draft |
| ticket | <ticket ID + link, or n/a> |
| framework-version | <latest released version in CHANGELOG.md> |

_Replace every <...> and italic prompt. Cite evidence from the work just performed
(commands, plan output, checks); mark FACT / ASSUMPTION; no secrets (stop-zones.md)._

## Symptoms
_Exactly what was observed: error text, scope (who / what / where), start time UTC,
how to reproduce._

## Triage
_Checks run, in order, with the real result. Include what was ruled out._

| # | Check (command / tool) | Result | Conclusion |
|---|---|---|---|
| 1 | <...> | <...> | <ruled out / points to ...> |

## Decision tree
_The diagnostic path taken (what was checked, in what order), or the layer order in
troubleshoot-connectivity.md._

## Causes -> fixes
_Each cause, the evidence for it, and the fix applied. Unproven cause = ASSUMPTION._

| Cause | Evidence | Fix | Change ticket |
|---|---|---|---|
| <...> | <...> | <...> | <ticket, or n/a if nothing changed> |

## Escalation
_When to escalate, to whom (escalation path in context.md), and what to hand over: this
doc, the evidence, current state._
