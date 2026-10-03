# Engineering Framework (Base)

Portable, tool-agnostic standards for cloud / security / platform / network
engineering across Azure, AWS, GCP. This repo is the BASE only — my reusable
method and IP. It travels to every engagement.

## What is NOT in this repo
- Client overlays (a client's governance) — live LOCAL to that client's laptop,
  never committed here and never committed into the client's own repo.
- Project scaffolding — local only.
- Deliverables (code, docs, ADRs) — go into the CLIENT's repo, not here.

## Layers & precedence
project > client > base. Base is universal; overlays override per client.

## How to use
1. Clone this repo onto the machine.
2. Put the adapter where the agent reads it (see `adapters/`).
3. Create a LOCAL `clients/<name>/` from the template, beside this repo.
4. Tell the agent the client + task. It reads base + that one client overlay,
   runs the matching playbook, and drafts the docs.

## Golden rules
- Defaults-first: the agent proceeds on documented defaults, it doesn't interrogate.
- Work graduates upward: one-offs die in the project; client-wide rules move to the overlay.
- Base stays client-blind: nothing client-specific ever enters this repo.
