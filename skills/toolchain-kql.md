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
  <workspace-id> --analytics-query "<kql>"`) and give the row count or a
  sample before calling it done.
- Sentinel analytics rules: match query period and frequency, set entity
  mappings, and check alert volume over the last 7 days before enabling.
- Changes to a production rule follow the client's change path (context.md).

Official sources: learn.microsoft.com/kusto/query; Microsoft Sentinel and
Azure Monitor docs.
