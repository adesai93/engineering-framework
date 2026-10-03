# <CLIENT> — Context

One page. Facts the team needs on every task for this client. Dated where it
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

## Environments
(dev / test / prod: subscriptions, accounts, projects, regions)

## Conventions
Naming + tagging: (pattern, mandated tags)
PR + pipeline gates: (reviews, required scans)
Governed solutions: (pipeline templates, IaC module registry, golden paths —
use these before building your own)
Where this client differs from base: (stricter thresholds, extra rules — can
raise security gates, never lower them)

## Process
Change process: (ticket system, approval needed for prod? — or "none")
Their incident / access / DR processes: (links only)
Docs go to: (wiki? repo docs/? SharePoint?)

## People
(name — role — what to go to them for)

## Gotchas
(dated one-liners: things that bit me or surprised me)
