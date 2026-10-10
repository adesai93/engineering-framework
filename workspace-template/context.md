# <CLIENT> — Context

Up to ~120 lines (read every chat). Facts the team needs on most tasks for this client. Dated where it
matters. No secrets: say where they live, not what they are.

## Stack
Clouds: (Azure? AWS? GCP? — which owns what)
IaC + state: (Terraform? Bicep? — backend, locking)
Source + CI/CD: (ADO Repos/Pipelines? GitHub Actions? Octopus? Rundeck?)
Artifacts: (JFrog? ACR? ECR?)
Monitoring: (Datadog? Azure Monitor? CloudWatch?)
AI tools approved here: (Copilot enterprise? Claude?)

## Access from this machine
(az login as which identity — read or write? kubectl contexts? gh? MCP servers?
What the agent may run itself vs. what I run and paste)

## Where commands run
(this laptop / jump host / VDI / air-gapped / Cloud Shell / portal; shell and
version there, e.g. Windows PowerShell 5.1; can files be copied over, or only
pasted? The handoff skill uses this)

## Environments
(dev / test / prod: subscriptions, accounts, projects, regions; how resources
are marked per env, e.g. tag `environment` or `-prd-` in names. Maps:
reference/env-<env>.md)

## Conventions
Naming + tagging: (pattern, mandated tags)
PR + pipeline gates: (reviews, required scans)
Governed solutions: (pipeline templates, IaC module registry, golden paths —
use these before building your own)
Scanners + what they block: (code, IaC, container, secret, dependency tools
and their thresholds — they enforce; the team only reports)
Where this client differs from base: (extra rules)

## Process
Change process: (ticket system, approval needed for prod? — or "none")
Their incident / access / DR processes: (links only)
Docs go to: (wiki? repo docs/? SharePoint?)

## People
(name — role — what to go to them for)

## Gotchas
(dated one-liners: things that bit me or surprised me)
