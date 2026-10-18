# Azure: facts per hop (read-only)

Confirm the subscription first (`az account show -o table`). Effective routes
and effective NSG need the VM running; Network Watcher commands need Network
Watcher enabled in that region (otherwise: INDETERMINATE, say why).

## Endpoints
- NIC: `az network nic show -g <rg> -n <nic> --query "{ip:ipConfigurations[0].privateIPAddress, subnet:ipConfigurations[0].subnet.id, nsg:networkSecurityGroup.id}"`
- Subnet NSG and route table: `az network vnet subnet show -g <rg> --vnet-name <vnet> -n <subnet> --query "{nsg:networkSecurityGroup.id, rt:routeTable.id}"`

## Routes
- Effective routes on the source NIC (UDR, BGP, system, peering):
  `az network nic show-effective-route-table -g <rg> -n <nic> -o table`
- Next hop for this flow: `az network watcher show-next-hop -g <rg> --vm <vm> --source-ip <src> --dest-ip <dst>`
- UDRs: `az network route-table route list -g <rg> --route-table-name <rt> -o table`

## NSGs
- Effective rules (subnet + NIC combined, per NIC): `az network nic list-effective-nsg -g <rg> -n <nic>`
- This exact flow: `az network watcher test-ip-flow -g <rg> --vm <vm> --direction Outbound --protocol TCP --local <src>:* --remote <dst>:<port>`
  (and `--direction Inbound` on the destination VM). Returns the deciding rule.

## Firewall / NVA
- Azure Firewall policy rules: `az network firewall policy rule-collection-group list -g <rg> --policy-name <policy>`
- What it actually did (KQL, resource-specific tables; scope = the firewall's workspace):
  `AZFWNetworkRule | where TimeGenerated > ago(1h) | where SourceIp == "<src>" and DestinationIp == "<dst>" | project TimeGenerated, Action, Policy, RuleCollection, Rule, DestinationPort`
  (also AZFWApplicationRule, AZFWDnsQuery; older setups: AzureDiagnostics).
- NVA (Palo Alto, Fortinet...): treat as an on-prem firewall (onprem.md).

## Peering
- `az network vnet peering list -g <rg> --vnet-name <vnet> -o table` (state
  Connected; allowForwardedTraffic for traffic through a hub NVA;
  allowGatewayTransit on the hub, useRemoteGateways on the spoke).

## DNS and private endpoints
- VNet DNS servers: `az network vnet show -g <rg> -n <vnet> --query dhcpOptions.dnsServers`
- Private endpoint IP and FQDN: `az network private-endpoint show -g <rg> -n <pe> --query customDnsConfigs`
- Zone linked to the VNet doing the lookup: `az network private-dns link vnet list -g <rg> -z privatelink.<service>.<suffix> -o table`
- Record: `az network private-dns record-set a list -g <rg> -z <zone> -o table`
- Private Resolver forwarding: `az dns-resolver forwarding-rule list -g <rg> --ruleset-name <rs> -o table`
- From the source host (user runs it): `nslookup <fqdn>`; Windows `Resolve-DnsName <fqdn>`.
  A public IP for a privatelink name = DNS is the problem, not the network.

## Gateways (towards on-prem)
- Learned routes (is the on-prem prefix known, from which peer?):
  `az network vnet-gateway list-learned-routes -g <rg> -n <gw> -o table`
- Advertised to a peer (does on-prem learn our prefix?):
  `az network vnet-gateway list-advertised-routes -g <rg> -n <gw> --peer <bgp-peer-ip> -o table`
- VPN connection: `az network vpn-connection show -g <rg> -n <conn> --query "{status:connectionStatus, in:ingressBytesTransferred, out:egressBytesTransferred}"`
- ExpressRoute route table: `az network express-route list-route-tables -g <rg> -n <circuit> --path primary --peering-name AzurePrivatePeering -o table`

## Logs and flows
- VNet/NSG flow logs with Traffic Analytics: `NTANetAnalytics | where TimeGenerated > ago(1h) | where SrcIp == "<src>" and DestIp == "<dst>"`
  (FlowStatus Allowed/Denied). State the workspace and time window.

## Gated (confirm once: they change something)
`az network watcher test-connectivity` (installs the Network Watcher
extension), `az network watcher packet-capture create` (extension + storage),
`az vm run-command invoke` (runs code on the VM).
