---
aliases:
  - Azure Recon
  - "Azure AD (Entra ID) Enumeration"
  - Azure Blob Storage Enumeration
  - Microsoft 365 Enumeration
  - Entra ID Enumeration
tags:
  - asset/cloud
  - env/cloud-azure
kind: CheatSheet
linked:
  - "[[Cloud Credential Hunting]]"
---
# Azure Enumeration

> [!info]
> Recon de Microsoft Azure / Entra ID (Azure AD) / M365. Tools: `az` CLI, AzureHound, ROADtools, MicroBurst, Stormspotter.

---

## Setup

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login
az login   # interactive
az login --service-principal -u <appId> -p <secret> --tenant <tenant>

# Verify
az account show
```

PowerShell modules: `Az`, `AzureAD`, `MSOnline`.

---

## Tenant / Org recon (sin auth)

```bash
# Es válido el dominio? Federation? Tenant ID?
curl 'https://login.microsoftonline.com/<domain>/.well-known/openid-configuration'

# UserRealm endpoint — válida users (post-2020 más limitado)
curl 'https://login.microsoftonline.com/getuserrealm.srf?login=<email>'

# Tenant ID por dominio
curl 'https://login.microsoftonline.com/<domain>/v2.0/.well-known/openid-configuration' | jq .issuer
```

---

## Entra ID (Azure AD) Enumeration

```bash
# Users
az ad user list
az ad user show --id <upn>

# Groups
az ad group list
az ad group member list --group <group>

# Apps (service principals)
az ad sp list
az ad app list

# Roles asignadas
az role assignment list --assignee <user> --all
az role definition list

# Directory roles (privileged groups)
Get-AzureADDirectoryRole | Get-AzureADDirectoryRoleMember
```

---

## Subscription / Resource Group recon

```bash
# Listar subscriptions accesibles
az account list

# Resource groups
az group list

# Recursos (VMs, Storage, etc.)
az resource list

# Permisos en RG específico
az role assignment list --resource-group <rg>
```

---

## Azure Storage / Blob

```bash
# Probar blob URL público
curl 'https://<storage>.blob.core.windows.net/<container>?restype=container&comp=list'

# Listar containers
az storage container list --account-name <storage>

# Download blob
az storage blob download --account-name <storage> --container-name <c> --name <blob> --file out

# Anonymous discovery
MicroBurst Invoke-EnumerateAzureBlobs -Base <company>
```

Naming convention para guessing: `<company>data`, `<company>backup`, `<company>files`, `dev-<company>`, etc.

---

## Key Vault (Secrets)

```bash
# Listar vaults
az keyvault list

# Listar secrets (requiere permissions)
az keyvault secret list --vault-name <vault>

# Obtener secret
az keyvault secret show --vault-name <vault> --name <secret-name>
```

---

## VM Enum

```bash
# Listar VMs
az vm list

# Ejecutar comando en VM (requiere Virtual Machine Contributor)
az vm run-command invoke -g <rg> -n <vm> --command-id RunShellScript --scripts "whoami"
```

VM Extensions = vector RCE post-compromise común (CustomScriptExtension).

---

## M365 Enumeration

```powershell
# Module
Install-Module ExchangeOnlineManagement
Install-Module MicrosoftTeams

# Connect
Connect-ExchangeOnline
Get-Mailbox

# Teams
Connect-MicrosoftTeams
Get-Team

# SharePoint
Connect-SPOService -Url https://<tenant>-admin.sharepoint.com
Get-SPOSite
```

---

## Tools

- **az** — CLI oficial
- **AzureHound** — BloodHound collector para Azure
- **ROADtools** (ROADrecon + ROADoidc) — Azure AD enum sin permisos elevados
- **MicroBurst** — PowerShell toolkit ofensivo
- **Stormspotter** — Azure recon graph
- **PowerZure** — PowerShell ofensivo
- **MFASweep** — detectar MFA configs

---

## Notas Relacionadas

- [[AWS Enumeration]]
- [[GCP Enumeration]]
- [[Cloud Credential Hunting]]
- [[Cloud Metadata Services]]
