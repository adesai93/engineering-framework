---
name: toolchain-kql
description: KQL queries for Log Analytics, Microsoft Sentinel (analytics rules, hunting), Azure Monitor alerts, Resource Graph and Defender. Use when writing, fixing or tuning KQL.
toolchain: kql
---
# Toolchain: KQL

Write queries that are cheap and checkable:
- Time-bound first: `| where TimeGenerated > ago(1h)` (pick the window on
  purpose), then filter, then `project` only the columns you need, then
  `summarize` or `take 50` to keep results small. Avoid `search *` and
  unbounded `union *`.
- Prefer `has` over `contains` (indexed terms); `=~` / `in~` for
  case-insensitive matches; `let` for reused values; `parse_json()` for
  dynamic fields.
- Test read-only (the Logs blade, or `az monitor log-analytics query -w
  <workspace-id> --analytics-query "<kql>"`; `-w` is the workspace GUID, not
  the ARM ID) and give the row count or a sample before calling it done.
- Every query you hand over is complete and standalone (all `let`
  statements included, no "replace the tail"), and states its scope: which
  workspace (name and ID) and time window. With more than one workspace
  (regional and global), confirm which one the results came from before
  interpreting them.
- Say what the data is: control-plane activity (AzureActivity, deployment
  results) is not workload telemetry. "The service failed" needs the
  source table, severity and window that show it.
- Sentinel analytics rules: match query period and frequency, set entity
  mappings, and check alert volume over the last 7 days before enabling.
- Changes to a production rule follow the client's change path (context.md).

Official sources: learn.microsoft.com/kusto/query; Microsoft Sentinel and
Azure Monitor docs.
Docs server if set up (SETUP.md): Microsoft Learn MCP. Search in generic
terms only: no client names, IPs or resource IDs.
