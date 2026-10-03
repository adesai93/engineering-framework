# Playbook: Prove a Design (PoC / test a new architecture)

1. Client context -> context.md (sandbox subscription, allowed regions, IaC,
   cost limits).
2. Test plan: the question the PoC answers, measurable success criteria, test
   cases (incl. failure cases: link down, failover, load), a time box. The
   architect drafts it in the project folder; I approve it.
3. Change approval: follow the client's change process, if context.md defines
   one, for the sandbox and anything it connects to; link the ticket.
4. Build in the sandbox only, as IaC per provision-infra.md, so it can be torn
   down and rebuilt. Tag it as a PoC with an expiry date. No connection to
   prod networks unless I approve it.
5. Run the test cases; capture evidence per case (command, output, metric).
6. Verify: every success criterion is PASS or FAIL with evidence; explain each
   failure.
7. Security reviews the findings and anything that would carry into prod.
8. Tear down the sandbox (or confirm its expiry); check nothing billable remains.
9. GATE — document: an ADR with the outcome (adopt / adjust / reject) and the
   test evidence; change-record if shared infra was touched; link the ticket.
10. Graduation check: reusable test harness or module -> propose adding to
    context.md.

STOP-and-confirm: all zones in base/principles/stop-zones.md. Most likely here:
network exposure, access breadth, data loss.
