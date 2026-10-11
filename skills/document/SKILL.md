---
name: document
description: Drafts or updates a document from the work just done. Use when the user says "document", "write it up", "change record", or after a fix, build or change is finished.
---
# Document

- Draft from this chat and the log, not memory. Pick the type: usually
  change-record; troubleshooting for an investigation; adr for a decision;
  service-doc / config-reference / kt-session / architecture-doc when asked.
- Start from base/templates/<type>.md; header includes framework-version
  (from .engineering-framework.json). Fill only what happened; mark gaps "TBD";
  FACT vs ASSUMPTION; cite evidence (commands, output, plan).
- Save the draft in the project folder (docs/ in the workspace if no project).
  The final copy goes to the client's doc destination (context.md).
- Updating an existing doc: edit it in place, keep its header, bump the date,
  add a one-line revision note at the bottom. Never create a second copy.
