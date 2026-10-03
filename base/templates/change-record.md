# Change Record: <title>

| Field | Value |
|---|---|
| title | <title> |
| type | change-record |
| author | <author> |
| date | <YYYY-MM-DD> |
| client | <client> |
| project | <project, or n/a> |
| status | Draft |
| ticket | <change ticket ID + link> |
| framework-version | <latest released version in CHANGELOG.md> |

_Replace every <...> and italic prompt. Cite evidence from the work just performed
(commands, plan output, checks); mark FACT / ASSUMPTION; no secrets (stop-zones.md)._

## Goal
_One or two lines: the outcome this change delivers and how success is judged._

## What changed
_Every resource, config, or code change — link the diff / PR / plan output._
- Environment: <env / region / subscription, account, or project>
- Changed: <resource or file: before -> after>
- When: <start-end UTC>
- Approval: <ticket / approver, if the client requires one; else n/a>

## Why
_The problem or request behind it; link the ticket, incident, or ADR._

## Verify
_Checks actually run after the change, with real output. An assertion is not evidence._

| Check | How (command / evidence) | Expected | Actual |
|---|---|---|---|
| <health / smoke check> | <command / link> | <result> | <PASS or FAIL + excerpt> |

## Rollback
_Executable steps, not "revert it". Name any step that cannot be undone (data loss,
irreversible — base/principles/stop-zones.md)._
- Trigger: <signal that means roll back>
- Steps:
   1. <exact command, pipeline run, or revert PR>
   2. <...>
- Confirm: <check that proves the prior state is back>
- Tested: <yes — env + date | no — why not>

## Root cause (if fix)
_Fixes only, else "n/a". The cause and the evidence that proves it; link the
troubleshooting doc if one exists. A symptom is not a root cause._
