# Service Doc: <title>

| Field | Value |
|---|---|
| title | <title> |
| type | service-doc |
| author | <author> |
| date | <YYYY-MM-DD> |
| client | <client> |
| project | <project, or n/a> |
| status | Draft |
| ticket | <ticket ID + link, or n/a> |
| framework-version | <latest released version in CHANGELOG.md> |

_Replace every <...> and italic prompt. Cite evidence from the work just performed
(commands, plan output, checks); mark FACT / ASSUMPTION; no secrets (stop-zones.md)._

## What/why
_What the service does, for whom, and why it exists. Two or three lines._

## Architecture
_Components, dependencies, network paths, identities, regions; diagram link. Name the
actual resources from the IaC / plan output, not from memory._

## Operate
_How to deploy, scale, restart, and rotate secrets: pipeline + exact commands. Link the
playbook used. Changes follow context.md._

## Monitoring
_Client's monitoring tool per context.md: dashboards, alerts + thresholds, log
location. Link each; state which alerts were verified, not just configured._

## Failure modes
_Known ways it breaks, from the design and incidents seen. Untested = ASSUMPTION._

| Failure | Detection (alert / signal) | Response (doc / playbook) |
|---|---|---|
| <...> | <...> | <...> |

## Ownership
_Who owns and supports it after handover; source each line (context.md or ticket)._
- Owner: <team / role>
- On-call + escalation: <client contact / team>
- Support hours: <from context.md, or n/a>
