# STOP Zones (canonical list)

This is the ONLY list of actions that require stopping to confirm. Every other
file references it instead of keeping its own copy. A playbook may highlight
which zones are most likely for that task; it never adds or removes zones here.

On hitting a zone: stop, use plan mode if your tool has one, state exactly
what you intend to do and why, and wait for an explicit yes (without plan
mode: make no change and run nothing that changes state until then).
Approval covers that one action only.

Keep it to one confirmation: the action, its target (account / subscription
/ environment), the impact, and how to undo it, in a few lines. Once I say
yes, do it: don't ask again, argue, or water it down. These zones make sure I
decide with the facts in front of me; they never stop me doing what I've
decided. (The tool may show its own approval prompt for the same command:
that is the same confirmation, not a second one.)

## Zone 1 — Architecture design
- Choosing or changing the design of a system (you want the thinking).

## Zone 2 — Security-sensitive or irreversible actions
1. Network exposure: opening any network path (NSG/SG/firewall rule, public
   endpoint, peering or route that widens reachability).
2. Secret exposure: granting a secret to a new consumer/identity, or anything
   that could put a secret in code, logs, or output.
3. Access breadth: granting elevated, wildcard, or admin permissions;
   broadening vault or IAM access beyond least-privilege.
4. Gate weakening: skipping, weakening, or removing a security gate; lowering
   a severity threshold.
5. Data loss: deleting data, or destroy/replace of a stateful resource
   (databases, storage, vaults, disks, backups, state files).
6. Irreversible: any other action that cannot be undone.
7. Unapproved prod change: changing production when the client's process
   requires an approval you don't have.

## Not a STOP zone (proceed, state assumptions)
Naming, structure, doc format, which playbook, anything a standard or context.md
already answers. See when-to-ask.md.
