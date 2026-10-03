# Documentation Standard

Common header on every doc:
title / type / author / date / client / project / status / ticket / framework-version

`framework-version` = the latest released version in CHANGELOG.md, so every
deliverable records which version of this framework produced it.

## Types & spines
- change-record: goal, what changed, why, verify, rollback, root-cause(if fix)
- service-doc: what/why, architecture, operate, monitoring, failure modes, ownership
- kt-session: audience, mental model, walkthrough, exercise, gotchas, go-deeper
- troubleshooting: symptoms, triage, decision tree, causes->fixes, escalation
- config-reference: what it controls, settings+ranges, examples, failure impact
- adr: context, options, decision, consequences, status
- architecture-doc: goals, constraints(from client), design, data flow, security, scale, alternatives

## Templates
Each type has a fill-in template at base/templates/<type>.md (header + spine).
Start every doc from its template; the client's context.md may override the format
or destination.

## Type selection
1. You name it -> use it.
2. Else the playbook's default.
Never ask unless two docs are plausibly needed -> generate both, state it.

## Documentation is a GATE
A task is not "done" until its doc is drafted from the work just performed and
handed over for approval.
