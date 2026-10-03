# Config Reference: <title>

| Field | Value |
|---|---|
| title | <title> |
| type | config-reference |
| author | <author> |
| date | <YYYY-MM-DD> |
| client | <client> |
| project | <project, or n/a> |
| status | Draft |
| ticket | <ticket ID + link, or n/a> |
| framework-version | <latest released version in CHANGELOG.md> |

_Replace every <...> and italic prompt. Cite evidence from the work just performed
(commands, plan output, checks); mark FACT / ASSUMPTION; no secrets (stop-zones.md)._

## What it controls
_The component this config drives, where the config lives (repo path, IaC module,
vault reference), and how a change is approved (client process, if any)._

## Settings + ranges
_Every notable setting. Cite the source of each range (vendor docs, context.md).
Secrets: vault + secret name only, per secrets-and-keyvault.md._

| Setting | Default | Allowed range (source) | Current | Why this value |
|---|---|---|---|---|
| <name> | <...> | <...> | <...> | <reason / ticket> |

## Examples
_Working snippets copied from the actual IaC or config, one per common change. State
the environment each was tested in._

## Failure impact
_What breaks when a setting is wrong or out of range, how it shows up (alert, error),
and how to recover. Untested impact = ASSUMPTION._
