# Playbook: Change IAM Access

1. Client context -> context.md (identity provider, PIM/JIT tooling, whether IAM is
   managed as code).
2. Capture the request: principal (human, group, workload identity, service
   principal/account), resource scope, permission/role, why, until when.
   Suspected compromise -> revoke first (step 7), then follow the client's process.
3. Read current state (read-only): existing assignments at that scope, inherited
   grants, group membership. Record the exact "before".
4. Least privilege per security-gates.md + secrets-and-keyvault.md: groups for
   humans; workload identity over keys; narrowest built-in role + scope; elevated
   -> client's PIM/JIT, else an enforced end date.
5. Change approval: follow the client's change / access-request process, if the
   client context.md defines one; link the ticket.
6. Apply via IaC/pipeline where the client manages IAM as code (plan shows only
   the intended grant changes); else the client's sanctioned process. Record
   exact before -> after. Modify = add new, confirm, then remove old.
7. Revoke (if removing access): remove the assignment/membership; disable or
   delete the principal's own keys/secrets; rotate shared secrets it could read per
   secrets-and-keyvault.md; revoke active sessions/tokens or confirm they expired.
8. Verify: effective-permission check — Azure "Check access", AWS IAM Policy
   Simulator / Access Analyzer, GCP Policy Troubleshooter / Policy Analyzer.
   Confirm the needed action works AND nothing broader was granted; end date/JIT
   in place. On revoke: access is gone.
9. GATE — document: change-record (principal, scope, role, justification,
   expiry, before -> after); link the change ticket.
10. Graduation check: reusable role/group pattern for this client? -> propose adding to context.md.

STOP-and-confirm: all zones in base/principles/stop-zones.md. Most likely here:
access breadth, secret exposure.
