# Plan: <title>

| Field | Value |
|---|---|
| title | <title> |
| type | plan |
| author | architect |
| date | <YYYY-MM-DD> |
| client | <client> |
| project | <project> |
| status | Draft |
| ticket | <ticket ID + link, or n/a> |
| framework-version | <latest released version in CHANGELOG.md> |

_Written by the architect, executed by the engineer. Status goes Draft -> Approved
(by me) -> Done. The engineer builds only what an Approved plan says; anything
else goes back to the architect. Mark FACT / ASSUMPTION; no secrets._

## Goal
_What done looks like, in 1-3 lines; link the ADR if a decision was made._

## Scope
_In / out: environments, subscriptions/accounts, repos, and what is NOT changing._

## Changes
_The exact changes, in order. One row per resource or file._

| # | Repo / resource | Change (before -> after) | Deploy path | Depends on |
|---|---|---|---|---|
| 1 | <repo/path or resource> | <what changes> | <pipeline / script> | <#> |

## Parameters
_Values the engineer needs (names, SKUs, CIDRs, regions); where secrets live (never values)._

## Verification
_Checks the engineer runs, with what PASS looks like (plan/what-if output, connectivity, policy compliance)._

## Rollback
_Executable steps, and what can't be undone (data loss / irreversible: base/principles/stop-zones.md)._

## Risks and lenses
_One line per lens in base/lenses.md: OK, or the risk and its mitigation. Cost estimate if spend changes._
