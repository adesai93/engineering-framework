# Lenses

Check every design and change through each lens. Write one line per lens in
the output: OK, or the risk and why. Skip a lens only by saying "n/a — why".
For platform builds these map to the cloud's well-architected pillars
(security, reliability, performance, cost, operations).

- Identity: who or what gets access; least privilege; workload identity over
  keys; elevated access time-bound.
- Network: paths opened or changed; public exposure; DNS; private endpoints;
  egress.
- Security: secrets handling; scanning gates; encryption in transit and at
  rest; sensitive data in logs.
- Data: state touched; backups exist; deletes or replaces; residency.
- Resilience: single points of failure; zones/regions; what happens when a
  dependency fails; tested recovery.
- Scale: limits and quotas; growth (teams, subnets, IPs, throughput);
  autoscale; how it behaves at 10x.
- CI/CD: goes through the pipeline and its gates; rollback path; artifact
  provenance.
- Observability: will we see it break; alerts; logs; dashboards.
- Cost: new spend; right-sized; cleanup of what it replaces.
