---
aliases:
  - AWS Recon
  - AWS S3 Bucket Enumeration
  - AWS IAM Enumeration
  - AWS Lambda & Serverless Enum
tags:
  - estado/completo
  - asset/cloud
  - env/cloud-aws
kind: CheatSheet
linked:
  - "[[Cloud Credential Hunting]]"
  - "[[Cloud Metadata Services]]"
---
# AWS Enumeration

> [!info]
> Recon de Amazon Web Services post-cred-leak o externo (S3 público, anon endpoints). CLI principal: `aws`. Pacu (toolkit), ScoutSuite (audit), enumerate-iam, S3Scanner.

***

## Setup AWS CLI

```bash
# Config con creds
aws configure
# AWS Access Key ID: <AKIAxxx>
# AWS Secret Access Key: <secret>
# Default region: us-east-1
# Default output: json

# O via env
export AWS_ACCESS_KEY_ID=AKIAxxx
export AWS_SECRET_ACCESS_KEY=xxx
export AWS_DEFAULT_REGION=us-east-1

# Verify
aws sts get-caller-identity
```

***

## IAM Enumeration

```bash
# Quién soy
aws sts get-caller-identity

# Listar permisos del current user
aws iam list-attached-user-policies --user-name <me>
aws iam list-user-policies --user-name <me>

# Listar todos users del account
aws iam list-users

# Roles disponibles
aws iam list-roles

# Policy attached a role
aws iam list-attached-role-policies --role-name <role>

# Auto-enum (tool)
enumerate-iam --access-key AKIAxxx --secret-key xxx
```

PrivEsc paths comunes: `iam:CreateAccessKey`, `iam:AttachUserPolicy`, `iam:PassRole + ec2:RunInstances`, `iam:CreatePolicyVersion`.

***

## S3 Bucket Enumeration

```bash
# Probar bucket por nombre (con creds o anon)
aws s3 ls s3://<bucket>/
aws s3 ls s3://<bucket>/ --no-sign-request   # anonymous

# Listar buckets del account
aws s3 ls

# Download bucket completo
aws s3 sync s3://<bucket> ./localdir/

# Subir file (test write)
echo test > t.txt
aws s3 cp t.txt s3://<bucket>/

# Enumerate buckets vía permutations
S3Scanner scan --bucket <target-name>
S3Scanner scan -f buckets.txt
```

Bucket naming conventions útiles para guessing:
- `<company>-backup`, `<company>-dev`, `<company>-logs`, `<company>-static`, etc.

***

## Lambda & Serverless

```bash
# Listar funciones
aws lambda list-functions

# Get function details (env vars puede contener secrets)
aws lambda get-function --function-name <fn>
aws lambda get-function-configuration --function-name <fn>

# Download code
aws lambda get-function --function-name <fn> --query 'Code.Location' --output text | xargs curl -o fn.zip

# Invoke function manualmente
aws lambda invoke --function-name <fn> --payload '{"key":"value"}' out.json
```

***

## Otros servicios útiles

```bash
# EC2 instances (post-compromise lateral)
aws ec2 describe-instances
aws ec2 describe-security-groups

# Secrets Manager
aws secretsmanager list-secrets
aws secretsmanager get-secret-value --secret-id <id>

# Systems Manager Parameter Store
aws ssm describe-parameters
aws ssm get-parameter --name <param> --with-decryption

# RDS
aws rds describe-db-instances

# CloudTrail (logs - útil para evasión)
aws cloudtrail describe-trails
```

***

## Tools

- **Pacu** — AWS exploitation framework
- **ScoutSuite** — multi-cloud audit
- **CloudSploit** — config audit
- **Prowler** — AWS security best practices
- **CloudFox** — recon de cuenta comprometida
- **enumerate-iam** — IAM permission enum
- **S3Scanner** — bucket enum
- **aws_consoler** — creds CLI → web console URL

***

## Notas Relacionadas

- [[Cloud Credential Hunting]]
- [[Cloud Metadata Services]]
- [[Azure Enumeration]]
- [[GCP Enumeration]]
- [[Cloud Configuration Auditing]]
