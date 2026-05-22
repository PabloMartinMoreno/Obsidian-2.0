---
aliases:
tags:
  - estado/completo
  - asset/cloud
  - technique/discovery
kind: Concept
linked:
---
# Cloud Configuration Auditing

> [!info]
> Análisis automatizado de postura de seguridad de cuenta cloud: misconfigs, public exposure, IAM overpriv, encryption gaps. Tools multi-cloud reduce manual recon.

***

## Tools principales

| Tool | Cloud | Estilo |
|---|---|---|
| **ScoutSuite** | AWS, Azure, GCP, Aliyun, Oracle | Read-only audit, HTML report |
| **Prowler** | AWS, Azure, GCP | CIS benchmark + custom checks |
| **CloudSploit** | AWS, Azure, GCP, OCI, GitHub | Open-source, JSON output |
| **Steampipe** | Multi-cloud SQL queries | Postgres-style queries via mod packs |
| **Cartography** | AWS, Azure, GCP | Graph en Neo4j (estilo BloodHound) |
| **PMapper** | AWS | IAM principal mapping |
| **PurplePanda** | Multi-cloud | Discovery + graph |
| **CloudFox** | AWS, Azure | Recon attacker perspective |
| **Pacu** | AWS | Exploitation framework |

***

## Workflow típico

```bash
# 1. ScoutSuite (full audit, output HTML)
scout aws --report-dir scout-report/
# Abrir scout-report/scoutsuite-report/aws-*.html

# 2. Prowler CIS check
prowler aws -M csv,json,html -o output/

# 3. CloudFox enum focused
cloudfox aws -p <profile> all-checks

# 4. PMapper IAM graph
pmapper graph create
pmapper query "preset privesc *"
```

***

## Findings categories típicas

| Categoría | Ejemplos |
|---|---|
| **Public exposure** | S3 buckets públicos, RDS público, ELB sin TLS |
| **IAM overpriv** | `*:*` policies, root account uso, sin MFA |
| **Encryption gaps** | EBS unencrypted, RDS sin encryption-at-rest |
| **Logging gaps** | CloudTrail disabled, S3 access logging off |
| **Network** | SG abierto a 0.0.0.0/0 en puertos sensibles |
| **Identity** | Inactive users, viejos access keys (>90 days), no MFA |
| **Compliance** | GDPR/HIPAA/PCI específicos |

***

## Tradeoffs

- **Read-only tools** (ScoutSuite, Prowler) — safe, slow para grandes accounts
- **Graph tools** (Cartography, PMapper) — útiles para attack path discovery
- **Pacu** — modifica state, evita en prod

***

## Notas Relacionadas

- [[AWS Enumeration]]
- [[Azure Enumeration]]
- [[GCP Enumeration]]
- [[Cloud Credential Hunting]]
