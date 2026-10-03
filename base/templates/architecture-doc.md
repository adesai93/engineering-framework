# Architecture Doc: <title>

| Field | Value |
|---|---|
| title | <title> |
| type | architecture-doc |
| author | <author> |
| date | <YYYY-MM-DD> |
| client | <client> |
| project | <project, or n/a> |
| status | Draft |
| ticket | <ticket ID + link, or n/a> |
| framework-version | <latest released version in CHANGELOG.md> |

_Replace every <...> and italic prompt. Cite evidence from the work just performed
(commands, plan output, checks); mark FACT / ASSUMPTION; no secrets (stop-zones.md)._

## Goals
_What the system must achieve, as checkable outcomes (availability, latency, cost,
compliance). Source each to the client or the ticket._

## Constraints (from client)
_Client-imposed only, each citing its source: context.md or the ticket.
Unconfirmed = ASSUMPTION._

## Design
_Components and how they fit; real cloud service names; diagram link. Design is a
STOP zone (base/principles/stop-zones.md): stays Draft until the human approves._

## Data flow
_Every flow that crosses a component or network boundary._

| Flow (source -> destination) | Protocol / port | Data | Encryption | Identity |
|---|---|---|---|---|
| <...> | <...> | <...> | <in transit / at rest> | <...> |

## Security
_Identities + least-privilege roles, every inbound network path, secrets per
secrets-and-keyvault.md, gates per security-gates.md, client control mappings._

## Scale
_Expected load and growth, scaling mechanism and limits (quotas, tiers), cost drivers.
A number without a source = ASSUMPTION._

## Alternatives
_Designs considered and rejected, one line each with why. Link an adr per significant
decision._
