# Playbook: Offboard a Client (end of engagement)

1. Client context -> read context.md (doc destination, change process) and
   NOW.md: list every active and waiting item.
2. Close or hand over each item: finish it, or write a hand-over note in its
   project (where it stands, next step, owner on the client side).
3. Change approval: none for the workspace itself; any change to client
   systems still follows the client's process (context.md); link the ticket.
4. Hand over docs: move every Approved doc (and the latest architecture-doc,
   decisions, runbooks) to the client's doc destination. Ask me to confirm
   each landed.
5. Final retro: run `retro` for the last client-free report and bring it to
   the rulebook (this is the only thing that leaves with me).
6. Final backup to the client-approved folder:
   `node <rulebook>/tools/workspace.mjs backup <workspace>`; tell me the file
   name so I can hand it to the client if they want it.
7. Verify: docs are in the client's destination, the final retro report is
   saved, the backup file exists, nothing is left in Active.
8. Access clean-up checklist for me: sign out of client CLIs and SSO
   sessions, revoke personal tokens I created, remove client credentials
   from this laptop.
9. Delete the workspace (data loss: STOP and get my explicit yes), then
   `node <rulebook>/tools/workspace.mjs forget <workspace>`. The rulebook and
   other workspaces are untouched.
10. GATE — document: a short change-record "engagement closed": what was
    handed over, where, the backup file, the deletion date; link the ticket
    (if any). Save it with the hand-over docs, not in the workspace.
11. Graduation check: anything general learned at this client -> it's in the
    final retro report.

STOP-and-confirm: all zones in base/principles/stop-zones.md. Most likely here:
data loss, irreversible.
