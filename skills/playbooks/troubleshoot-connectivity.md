# Playbook: Troubleshoot Network Connectivity

1. Client context -> context.md (network topology, tooling, escalation path).
2. Define the failing path: source -> destination, port, protocol.
3. Layer-by-layer triage: DNS -> routing -> NSG/SG/firewall -> app/listener.
   Azure and on-prem paths: the network-troubleshoot skill (facts per hop,
   evaluation order, an ALLOW/DENY/INDETERMINATE verdict per hop).
4. Use client's diagnostic tooling; log each finding as you go.
5. Isolate root cause before changing anything.
6. Change approval: follow the client's change process, if context.md defines
   one; link the ticket.
7. Fix: smallest change that resolves it. Any rule that opens a path = STOP-and-confirm.
8. Verify: reproduce the original test, confirm it now passes + nothing else broke.
9. GATE — document: troubleshooting doc (symptom, triage, root cause, fix,
   escalation); change-record if anything was changed; link the ticket.
10. Graduation check: recurring pattern for this client? -> propose adding to context.md.

STOP-and-confirm: all zones in base/principles/stop-zones.md. Most likely here:
network exposure.
