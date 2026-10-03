# Documentation Standard

Common header on every doc:
title / type / author / date / client / project / status / ticket

## Types & spines
- change-record: goal, what changed, why, verify, rollback, root-cause(if fix)
- service-doc: what/why, architecture, operate, monitoring, failure modes, ownership
- kt-session: audience, mental model, walkthrough, exercise, gotchas, go-deeper
- troubleshooting: symptoms, triage, decision tree, causes->fixes, escalation
- config-reference: what it controls, settings+ranges, examples, failure impact
- adr: context, options, decision, consequences, status
- architecture-doc: goals, constraints(from client), design, data flow, security, scale, alternatives

## Type selection
1. You name it -> use it.
2. Else the playbook's default.
Never ask unless two docs are plausibly needed -> generate both, state it.

## Documentation is a GATE
A task is not "done" until its doc is drafted from the work just performed and
handed over for approval.
