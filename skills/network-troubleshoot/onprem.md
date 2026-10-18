# On-prem paths: gateways, BGP and devices

The agent usually can't reach these: hand the user one labelled block per
device (handoff skill), read-only commands only, and say what output to send
back. Record each device's management access in inventory.md (owner, how to
connect, where the credential lives, never the credential).

## The path to check, both directions
Azure source > (hub firewall) > VPN or ExpressRoute gateway > provider/edge
router > on-prem core > on-prem firewall > destination. Then the return path:
does on-prem route the reply back the same way? ExpressRoute and VPN both
present, or a more specific prefix on one of them, is the classic cause of
asymmetric routing (the stateful firewall drops the reply).

## Routing questions
1. Does Azure know the destination prefix, and from which peer? (azure.md,
   learned routes; on the NIC it shows as VirtualNetworkGateway.)
2. Does on-prem know the Azure source prefix? (advertised routes from Azure;
   the edge's BGP table below.) A spoke needs gateway transit on the hub
   peering and use remote gateways on the spoke, or it isn't advertised.
3. Any overlap between the two ranges (merged companies, reused 10.x)?
   Overlap = INDETERMINATE until someone decides which network owns it.

## Device commands (read-only unless marked)
| Device | Policy / path check | Routing | Sessions / traffic |
|---|---|---|---|
| Palo Alto (PAN-OS) | `test security-policy-match from <zone> to <zone> source <src> destination <dst> destination-port <port> protocol 6` | `test routing fib-lookup virtual-router default ip <dst>` | `show session all filter source <src> destination <dst>` |
| FortiGate | `diagnose firewall iprope lookup <src> <sport> <dst> <port> tcp <in-if>` | `get router info routing-table details <dst>` | `diagnose sys session filter dst <dst>` then `diagnose sys session list` |
| Cisco ASA | `packet-tracer input <in-if> tcp <src> 12345 <dst> <port> detailed` | `show route <dst>` | `show conn address <dst>` |
| Check Point | Policy: SmartConsole log search on src/dst | `ip route get <dst>` (expert) | `fw tab -t connections -u -f` filtered on the IP |
| Juniper SRX | `show security match-policies from-zone <z> to-zone <z> source-ip <src> destination-ip <dst> source-port 12345 destination-port <port> protocol tcp` | `show route <dst>` | `show security flow session destination-prefix <dst>` |
| Cisco IOS / NX-OS router | - | `show ip route <dst>`; `show ip bgp <prefix>`; `show ip bgp neighbors <peer> advertised-routes` | - |

Gated (confirm once: they load a production device or change its state):
FortiGate `diagnose debug flow` and `diagnose sniffer packet`, Check Point
`fw ctl zdebug drop`, ASA `capture`, any `tcpdump` on a busy host. If you
start a debug, the block ends with the command that stops it.

## Hosts at either end (user runs them)
- Windows: `Test-NetConnection <dst> -Port <port>`; `Get-NetFirewallProfile`;
  `Get-NetTCPConnection -LocalPort <port> -State Listen`
- Linux: `nc -zv <dst> <port>` or `curl -v telnet://<dst>:<port>`;
  `ip route get <dst>`; `ss -ltnp | grep <port>`; host firewall `nft list ruleset` or `iptables -S`
- A listener that isn't up, or a host firewall, is a DENY at the last hop:
  not a network change.
