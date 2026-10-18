---
name: toolchain-terraform
description: Terraform / OpenTofu work - writing modules, reviewing plans, state, providers. Use when editing *.tf files, running terraform, reviewing a plan, or when the user asks for Terraform or OpenTofu; not for Bicep or ARM work.
toolchain: terraform
---
# Toolchain: Terraform

Verify, in this order (read-only until the last step):
1. `terraform fmt -check -recursive` · `terraform init -backend=false` then
   `terraform validate` (no state touched) · the linters the client uses
   (`tflint`, `checkov -d .`; see context.md "Scanners").
2. `terraform plan -out=tfplan` against the real backend only with my OK (it
   takes a state lock); read it with `terraform show tfplan`.
3. Any destroy or `-/+` replace of a stateful resource in the plan = STOP
   (data loss). Say which resources and why they're replaced.
4. Apply only through the client's pipeline (context.md), never locally,
   unless I say so.

Gotchas: pin provider and module versions; use the client's module registry
first (governed solutions); `moved {}` / `import {}` blocks over state
surgery; never print state (it holds secrets); mark secret variables
`sensitive`.

Official sources: developer.hashicorp.com/terraform; HashiCorp's agent skills
(github.com/hashicorp/agent-skills) if the client allows them.
Docs server if set up (SETUP.md): HashiCorp Terraform MCP (registry docs; no
TFE token). Search in generic terms only: no client names, IPs or resource
IDs.
