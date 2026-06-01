---
aliases:
  - GCP Recon
  - GCP Storage Buckets Enumeration
tags:
  - asset/cloud
  - env/cloud-gcp
kind: CheatSheet
linked:
  - "[[Cloud Credential Hunting]]"
---
# GCP Enumeration

> [!info]
> Recon de Google Cloud Platform. CLI: `gcloud`. Tools: GCPBucketBrute, hayat, ScoutSuite.

***

## Setup

```bash
# Auth con service account JSON
gcloud auth activate-service-account --key-file=key.json

# Auth interactive
gcloud auth login

# Set project
gcloud config set project <project-id>

# Verify
gcloud auth list
gcloud config list
```

***

## Project / IAM Enumeration

```bash
# Projects accesibles
gcloud projects list

# Service accounts
gcloud iam service-accounts list

# Permisos del current account
gcloud projects get-iam-policy <project>

# Roles definidas
gcloud iam roles list --project <project>

# Permisos efectivos en recurso
gcloud projects get-iam-policy <project> --format=json | \
  jq '.bindings[] | select(.members[] | contains("<user>"))'
```

***

## Compute Engine (VMs)

```bash
# Listar instances
gcloud compute instances list

# SSH a instance (auto-config keys)
gcloud compute ssh <instance> --zone <zone>

# Metadata de instance (incluye startup scripts a veces con creds)
gcloud compute instances describe <instance> --zone <zone> --format='value(metadata)'
```

***

## Storage Buckets

```bash
# Listar buckets del project
gsutil ls

# Verificar bucket público (anonymous)
gsutil ls gs://<bucket>/   # solo funciona si tenés permission

# Curl directo (anonymous read si bucket público)
curl 'https://storage.googleapis.com/<bucket>/'

# Download
gsutil cp gs://<bucket>/file ./

# Sync entero
gsutil -m rsync -r gs://<bucket> ./local/

# Test write
echo test > t.txt
gsutil cp t.txt gs://<bucket>/
```

Bucket name brute:
```bash
GCPBucketBrute -k <project>-keyword -u user@org.gserviceaccount.com
```

***

## Cloud Functions / Run

```bash
# Listar Cloud Functions
gcloud functions list

# Source code
gcloud functions describe <fn>

# Cloud Run
gcloud run services list
```

***

## Secrets Manager

```bash
# Listar secrets
gcloud secrets list

# Obtener valor
gcloud secrets versions access latest --secret <name>
```

***

## PrivEsc patterns

- `iam.serviceAccountTokenCreator` → impersonate cualquier SA
- `iam.serviceAccountUser` + `compute.instances.create` → run code as SA
- `iam.serviceAccounts.actAs` + `cloudfunctions.functions.create` → SA exec
- `cloudbuild.builds.create` → run code as default Cloud Build SA
- `deploymentmanager.deployments.create` → privilege escalation via DM

Ver `gcp_scanner`, `GCP-IAM-Privilege-Escalation` (rhino-security).

***

## Tools

- **gcloud** — CLI oficial
- **gsutil** — Storage CLI
- **GCPBucketBrute** — bucket enum por brute
- **hayat** — GCP audit
- **ScoutSuite** — multi-cloud audit
- **gcp_scanner** — privesc finder

***

## Notas Relacionadas

- [[AWS Enumeration]]
- [[Azure Enumeration]]
- [[Cloud Credential Hunting]]
- [[Cloud Metadata Services]]
