# Secrets & Key Vault Standard

## Golden rule
Secrets NEVER in code, config, pipeline YAML, or logs. No exceptions without a
logged client waiver.

## Where secrets live
- Azure: Key Vault, referenced via managed identity — never connection strings.
- AWS: Secrets Manager (Parameter Store for non-rotating config).
- GCP: Secret Manager.
- Pipelines pull at runtime via cloud-native identity — never stored in pipeline.

## Defaults (applied silently)
- Managed/workload identity over secret-bearing service principals.
- Rotation on; 90 days unless overlay overrides.
- Least-privilege RBAC — grant to identity, not people.
- Soft-delete + purge protection ON. Separate vaults per environment.

## Naming (default, overridable)
<client>-<env>-<service>-kv ; secret keys <service>-<purpose>

## STOP-and-confirm
- Exposing a secret to a new consumer/identity.
- Broadening vault access beyond least-privilege.
- Anything that could put a secret in logs or output.

## Verify before done
[ ] no secret in diff/config/pipeline  [ ] access via identity  [ ] rotation + soft-delete on
Authorities: CIS Benchmark (vault), cloud secrets docs.
