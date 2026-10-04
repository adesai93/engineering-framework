---
name: toolchain-pipelines-yaml
description: CI/CD and config files in YAML and JSON - Azure DevOps Pipelines, GitHub Actions, Kubernetes manifests, app and config JSON. Use when editing *.yml, *.yaml or config *.json files, or pipeline definitions.
toolchain: pipelines-yaml
---
# Toolchain: Pipelines, YAML and JSON

Verify before committing:
- YAML syntax: `yamllint <file>`; GitHub Actions: `actionlint`; Kubernetes:
  `kubectl apply --dry-run=server -f <file>` (read-only) or `kubeconform`.
- JSON: `jq . <file>` (or `Get-Content <file> | ConvertFrom-Json`) to prove it
  parses; validate against its schema where one exists.
- Azure DevOps: extend the client's governed templates (context.md); review
  the expanded YAML of a run before merging changes to shared templates.

Rules: secrets come from variable groups, Key Vault or OIDC federation, never
literals in YAML or JSON; pin action and task versions (a commit SHA or exact
version for third-party actions); keep the client's required stages (scans,
approvals); removing or skipping a gate is a STOP zone (gate weakening).

Official sources: learn.microsoft.com/azure/devops/pipelines;
docs.github.com/actions.
