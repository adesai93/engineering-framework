# Playbook: Troubleshoot Network Connectivity

1. Client context -> overlay (network topology, tooling, escalation path).
2. Define the failing path: source -> destination, port, protocol.
3. Layer-by-layer triage: DNS -> routing -> NSG/SG/firewall -> app/listener.
4. Use client's diagnostic tooling; log each finding as you go.
5. Isolate root cause before changing anything.
6. Fix: smallest change that resolves it. Any rule that opens a path = STOP-and-confirm.
7. Verify: reproduce the original test, confirm it now passes + nothing else broke.
8. GATE — document: troubleshooting doc (symptom, triage, root cause, fix, escalation).
9. Graduation check: recurring pattern for this client? -> propose to overlay.

STOP-and-confirm: opening any network path (NSG/SG/firewall rule, public endpoint).
