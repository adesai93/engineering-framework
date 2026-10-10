---
name: env-map
description: Build or refresh a per-environment map (address ranges, subnets, peerings, private endpoints, public IPs, service endpoints) from read-only cloud queries, saved to reference/env-<env>.md with a Mermaid diagram and matching inventory.md lines. Use when the user says "map the environment", "map prd/dev", "what's in <env>", or before a design that needs the network picture.
---
# Env map

Read-only throughout: only `az account show/list` and `az graph query`
(Azure Resource Graph) run. Keep only the map and inventory lines: no raw
output dumps in the workspace or any repo.

1. Scope: which environment and which subscriptions / management group?
   Read context.md "Environments" and any existing reference/env-<env>.md.
   If context.md doesn't say how this client marks environments (a tag, a
   subscription name, a name part like `-prd-`), ask once and save it there.
2. `az account show -o table` (right tenant?). `az graph` needs the
   resource-graph extension (`az extension add -n resource-graph`; ask
   first). Get my OK once for the whole batch of queries.
3. Run each query file in base/queries/env-map/ (azure-subscriptions first
   if the scope is unclear), passed as a file so no shell quoting breaks:
   `az graph query -q @<file> --subscriptions <ids> --first 1000 -o json`
   (or `--management-groups <id>`). Page with `--skip-token` when there's
   more. Keep rows for this environment (env column or naming rule).
4. Write reference/env-<env>.md:
   - header: `Mapped <date> from Azure Resource Graph · scope · env rule`
   - Address ranges: VNet | address space | subnet | prefix | NSG | route table
   - Peerings: VNet | peer (subscription) | state | gateway transit
   - Endpoints: name | type | private IP / FQDN | public? | owner | repo/IaC
   - Diagram: Mermaid `graph LR`, one subgraph per VNet with its subnets,
     peerings as edges, private endpoints in their subnet pointing at the
     service, public IPs and hosts outside.
   - Gaps and questions; Related decisions (links into decisions.md, briefs).
   Owner and repo come from inventory.md or tags; "-" when unknown, listed
   under Gaps, never guessed. Over ~150 resources: a section per VNet, hub
   first, and say what was left out.
5. inventory.md: add or update lines in its format for VNets, subnets,
   peerings, private endpoints, public IPs, gateways and service endpoints
   (not every NIC); source `az graph`, today's date. Mark items missing since
   the last map "gone?" instead of deleting them.
6. Reply: counts; anything surprising (overlapping ranges, public access on a
   service that also has a private endpoint, peerings not Connected, no env
   tag); "Inventory: +N, ~M changed".

Other clouds and sources, only what the client allows:
- AWS: read-only `aws ec2 describe-vpcs / describe-subnets /
  describe-vpc-peering-connections / describe-vpc-endpoints /
  describe-network-interfaces` per account and region, or
  `aws resource-explorer-2 search` if Resource Explorer is on.
- GCP: `gcloud asset search-all-resources --scope=projects/<p>
  --asset-types=compute.googleapis.com/Network,compute.googleapis.com/Subnetwork,compute.googleapis.com/Address`.
- Steampipe (SQL over Azure/AWS/GCP, local): read-only credentials,
  `STEAMPIPE_TELEMETRY=none`.
- InfraMap (github.com/cycloidio/inframap): graph from local tfstate or HCL,
  only state the client lets me hold locally, prune on, never shown in chat.
