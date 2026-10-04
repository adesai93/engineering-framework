---
name: toolchain-aws-cli
description: AWS CLI commands for inspecting and changing AWS - accounts, IAM, VPC, EC2, S3, Organizations. Use when running or giving aws commands.
toolchain: aws-cli
---
# Toolchain: AWS CLI

First: `aws sts get-caller-identity --profile <p>` (right account and role?).
Always pass `--profile` and `--region` explicitly.

Sign-ins: prefer one IAM Identity Center session shared by profiles
(`[sso-session]` in ~/.aws/config, then `aws sso login --sso-session <name>`),
so discovery needs one browser approval, not one per profile.

Read-only by default: `describe-*`, `list-*` and `get-*` with `--query` and
`--output table` or `text`; EC2 changes support `--dry-run`. Save durable
results to inventory.md, never keys.

Changes go through the client's IaC or change path; deletes, IAM policy
widening and security-group opens are STOP zones. Never print exported
credentials, secret values or SSM SecureString values.

Official sources: docs.aws.amazon.com/cli; AWS agent plugins / MCP servers
(github.com/awslabs/agent-plugins) if the client allows them.
