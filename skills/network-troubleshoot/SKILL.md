---
name: network-troubleshoot
description: Traces why traffic between two endpoints fails, or proves it is allowed, across Azure and on-prem paths (NSGs, routes, firewalls, peering, DNS, private endpoints, VPN/ExpressRoute, on-prem firewalls), hop by hop, ending in an ALLOW/DENY/INDETERMINATE verdict per hop with the deciding rule. Use for "can't reach", timeouts, DNS or private endpoint problems, "is X allowed to Y", and before or after a network change.
---
# Network troubleshoot

Facts first, then reasoning. Read-only throughout; the diagnostics that change
something (step 6) are confirmed once.

1. Pin the flow: source, destination, port, protocol, direction. Resolve both
   ends (IP, NIC, subnet, VNet, subscription, environment) from inventory.md
   and reference/env-<env>.md before asking; ask once for what's missing.
2. Sketch the expected path both ways, from the env map and context.md:
   source NIC > subnet > route (UDR) > hub firewall/NVA > peering, or gateway >
   VPN/ExpressRoute > on-prem edge > on-prem firewall > destination subnet >
   NIC > listener. The return path matters as much (asymmetric routing).
3. Collect facts hop by hop: [azure.md](azure.md) for Azure, [onprem.md](onprem.md)
   for gateways, BGP and on-prem devices. Run what your access allows; for
   devices or hosts only the user can reach, give one labelled block per
   device (handoff skill). Note the source and time of every fact.
4. Evaluate in the platform's order:
   - NSGs: inbound = subnet NSG, then NIC NSG; outbound = NIC NSG, then subnet
     NSG. Both must allow. Within one NSG the lowest priority number that
     matches wins; defaults sit at 65000+.
   - Azure Firewall: DNAT, then network rules, then application rules;
     collection groups and collections by priority. FQDN rules in network
     rules need DNS proxy.
   - Routes: longest prefix wins; then UDR over BGP over system routes.
   - On-prem firewalls: their own order (onprem.md).
5. Verdict, one row per hop:

   | Hop | Verdict | Deciding rule / evidence (source, time) |
   |---|---|---|
   | NIC NSG (src) | ALLOW | AllowVnetOutBound 65000 (effective NSG, 10:02) |
   | Azure Firewall | DENY | no rule in rcg-x allows 10.1.0.0/24 > 10.2.0.4:1433 |
   | Dest subnet NSG | INDETERMINATE | not evaluated past the deny |

   The first DENY is the likely cause. INDETERMINATE names what's missing
   (no Network Watcher in the region, a PaaS target ip-flow can't test, a
   device you can't read). Never guess past it.
6. Gated diagnostics (they create or change something, so confirm once with
   the impact): packet capture, connection troubleshoot (installs the Network
   Watcher extension), `az vm run-command`, firewall debug/sniffer on a busy
   production device.
7. Check the usual suspects before concluding: DNS returns the public IP
   instead of the private endpoint; return traffic skips the firewall; spoke
   without gateway transit / use remote gateways; on-prem prefix not learned,
   or the Azure prefix not advertised; overlapping ranges; rule on the subnet
   NSG but not the NIC NSG (or the reverse); listener or host firewall down.
8. A fix goes through the normal change path (playbooks skill,
   troubleshoot-connectivity). Before the change, save effective routes and
   effective NSG for the NICs involved; after it, compare: only the intended
   difference, and the original test now passes.
9. Save: the verdict table and a Mermaid path diagram in the project log (or
   log/ without a project); new facts to inventory.md; a recurring
   client-specific cause as a dated line in context.md "Gotchas".
