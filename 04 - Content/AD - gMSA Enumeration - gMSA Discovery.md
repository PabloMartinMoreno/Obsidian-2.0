---
aliases:
  - gMSA Discovery
  - msDS-GroupManagedServiceAccount
  - KDS Root Key
  - gMSA Detection
tags:
  - type/cheatsheet
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[AD - gMSA Enumeration]]"
---
# AD - gMSA Enumeration - gMSA Discovery

***

## Schema Detection

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| Schema class `msDS-GroupManagedServiceAccount` | gMSA | LDAP class. |
| `Get-ADObject -SearchBase "CN=Schema,..." -Filter "Name -eq 'ms-DS-Group-Managed-Service-Account'"` | Schema check | Standard. |
| `Get-ADServiceAccount -Filter *` | RSAT direct | Standard. |
| `objectClass=msDS-GroupManagedServiceAccount` | LDAP filter | Direct. |
| Container default | `CN=Managed Service Accounts,DC=...` | Standard location. |
| Custom OU storage | Configurable | Edge. |
| Schema requires Server 2012+ | Domain functional level | Standard. |
| KDS Root Key required | Forest-wide | Required. |
| `Get-KdsRootKey` | List root keys | Privileged. |
| Multiple KDS keys possible | Migration / rotation | Edge. |
| KDS key creation = Domain Admins | Privileged | Standard. |
| Per-domain key | Forest-wide replicated | Adjacent. |
| sMSA legacy class | `msDS-ManagedServiceAccount` | Legacy. |
| dMSA new (Server 2025) | `msDS-DelegatedManagedServiceAccount` | Modern. |
| Detection: schema attribute existence | Direct | Standard. |
| Detection: gMSA-set computers | Adjacent | Standard. |
^ad-gmsa-schema

### Schema check

```powershell
# gMSA schema attributes
$schemaPath = "CN=Schema,CN=Configuration,$((Get-ADDomain).DistinguishedName)"

Get-ADObject -SearchBase $schemaPath `
  -Filter "Name -like '*Group-Managed-Service-Account*' -or Name -like '*Managed-Service-Account*'" |
  Select Name,DistinguishedName

# KDS Root Key (required for gMSA)
Get-KdsRootKey | Select KeyId,EffectiveTime,DomainController

# If empty: gMSA not provisioned (no KDS key)
```

```bash
# LDAP raw schema check
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "CN=Schema,CN=Configuration,DC=dom,DC=local" \
  "(|(name=ms-DS-Group-Managed-Service-Account)(name=ms-DS-Managed-Service-Account))" \
  cn distinguishedName
```

___

## gMSA Account Discovery

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-ADServiceAccount -Filter *` | All gMSAs | Standard. |
| `Get-ADServiceAccount -Filter * -Properties *` | Full attrs | Detail. |
| `nxc ldap DC -u u -p p --gmsa` | netexec wrapper | Quick. |
| `nxc ldap DC -u u -p p --query "(objectClass=msDS-GroupManagedServiceAccount)" "*"` | Custom | Flexible. |
| LDAP filter `(objectCategory=msDS-GroupManagedServiceAccount)` | Direct | Standard. |
| Default container | `CN=Managed Service Accounts,DC=...` | Search base. |
| Custom OU search | Edge | Edge. |
| `Get-NetUser` (PowerView) | Adjacent (gMSAs are user-style) | Adjacent. |
| Bulk LDAP query | `(servicePrincipalName=*)` filter | Service-bound. |
| Cross-domain via GC port 3268 | Forest-wide | Standard. |
| Authenticated read | Standard | Required. |
| Anonymous: typically blocked | Edge | Edge. |
| Per-OU search | Targeted | Standard. |
| Output: gMSA samAccountName + SPN | Standard | Standard. |
| Per-gMSA detail | Membership audit | Adjacent. |
| Detection: bulk gMSA query events | Defender | Adjacent. |
^ad-gmsa-discovery

### gMSA enumeration

```powershell
# All gMSAs
Get-ADServiceAccount -Filter * | Select Name,SamAccountName,DistinguishedName

# Full attributes
Get-ADServiceAccount -Filter * -Properties * |
  Select Name,SamAccountName,
    @{n='SPNs';e={$_.ServicePrincipalNames -join '; '}},
    @{n='HostsAllowed';e={$_.HostComputers -join '; '}},
    @{n='PrincipalsAllowedToRetrievePassword';e={$_.PrincipalsAllowedToRetrieveManagedPassword -join '; '}},
    Enabled,LastLogonDate,PasswordLastSet
```

```bash
# netexec
nxc ldap DC -u user -p pass --gmsa

# Output:
# LDAP   DC  389  DC  Account: gMSA-svc01$  PrincipalsAllowedToReadPassword: dom\IT-Servers
# LDAP   DC  389  DC  Account: gMSA-sql$    PrincipalsAllowedToReadPassword: dom\SQL-Admins

# LDAP raw
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(objectClass=msDS-GroupManagedServiceAccount)" \
  cn samAccountName servicePrincipalName \
  msDS-GroupMSAMembership msDS-HostServiceAccount \
  msDS-ManagedPasswordInterval
```

___

## gMSA Critical Attributes

| **Atributo** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `samAccountName` | gMSA name (with `$`) | Standard. |
| `objectClass` | `msDS-GroupManagedServiceAccount` | Class. |
| `servicePrincipalName` | SPNs bound | Kerberoastable. |
| `msDS-GroupMSAMembership` | Security descriptor — who can read pwd | CRITICAL. |
| `msDS-HostServiceAccount` | Computers using gMSA | Adjacent. |
| `msDS-ManagedPassword` | Password blob (binary) | Encrypted. |
| `msDS-ManagedPasswordId` | Password ID | Standard. |
| `msDS-ManagedPasswordInterval` | Rotation period (default 30 days) | Standard. |
| `msDS-SupportedEncryptionTypes` | AES support flags | Adjacent. |
| `userAccountControl` | UAC flags | Standard. |
| `pwdLastSet` | Last password change | Adjacent. |
| `accountExpires` | Expiration | Edge. |
| `description` | Free-text | Audit. |
| `memberOf` | Group memberships | Privilege analysis. |
| `objectSid` | SID | Standard. |
| `whenCreated` / `whenChanged` | Lifecycle | Audit. |
^ad-gmsa-attrs

### gMSA detail query

```powershell
$gmsa = Get-ADServiceAccount -Identity gMSA-svc01 -Properties *
$gmsa | Format-List Name,SamAccountName,
  ServicePrincipalNames,
  PrincipalsAllowedToRetrieveManagedPassword,
  HostComputers,
  ManagedPasswordIntervalInDays,
  KerberosEncryptionType,
  Enabled,
  PasswordLastSet,
  MemberOf
```

```bash
# LDAP raw with all attrs
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "CN=gMSA-svc01,CN=Managed Service Accounts,DC=dom,DC=local" \
  -s base "(objectClass=*)" "*"
```

___

## KDS Root Key

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| KDS Root Key | Forest-wide crypto key | Required for gMSA. |
| `Add-KdsRootKey` | Create new key | Privileged. |
| `Add-KdsRootKey -EffectiveImmediately` | Bypass 10h replication wait (test only) | Edge. |
| `Get-KdsRootKey` | List existing keys | Privileged. |
| Default replication wait: 10 hours | Replication safety | Standard. |
| Multiple keys: rotation / migration | Edge | Edge. |
| KDS storage location | `CN=Master Root Keys,CN=Group Key Distribution Service,CN=Services,CN=Configuration,DC=...` | Standard. |
| Forest-wide replication | Standard | Standard. |
| KDS key compromise = decrypt all gMSAs | Critical risk | Standard. |
| Atacante with DCSync rights → KDS key | Adjacent | Adjacent. |
| GoldenGMSA technique | KDS key + msDS-ManagedPasswordId → derive password | Modern. |
| Per-key effective time | Different keys for different gMSAs | Edge. |
| Detection: KDS key creation events | Defender | Adjacent. |
| Audit: KDS key rotation | Standard | Adjacent. |
| Modern: rotate KDS key periodically | Best practice | Standard. |
| Cross-correlate KDS key access | Adjacent | Audit. |
^ad-gmsa-kdskey

### KDS Root Key inspection

```powershell
# List KDS Root Keys (Domain Admins required)
Get-KdsRootKey | Select KeyId,EffectiveTime,DomainController,KdfParameters

# Check if KDS key effective (must be older than 10h for gMSA use)
Get-KdsRootKey | Where {$_.EffectiveTime -lt (Get-Date).AddHours(-10)}
```

```bash
# LDAP raw KDS keys
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "CN=Master Root Keys,CN=Group Key Distribution Service,CN=Services,CN=Configuration,DC=dom,DC=local" \
  "(objectClass=msKds-ProvServerConfiguration)" \
  cn msKds-RootKeyData
```

___

## Container Storage

| **Container** | **Path** | **Notas** |
|:---:|:---:|:---:|
| Default gMSA storage | `CN=Managed Service Accounts,DC=dom,DC=local` | Standard. |
| Custom OU support | User-configurable | Edge. |
| Per-OU GPO scope | Adjacent | Adjacent. |
| Container ACL | DACL controls who can read | Standard. |
| Read access default | Authenticated Users | Permissive (read attrs but not password). |
| Modern hardening: restrict container | Edge | Edge. |
| Audit: gMSAs in custom OUs | Standard | Standard. |
| Cross-OU search | Forest-wide | Adjacent. |
| sMSA legacy in same container | Co-exists | Edge. |
| Container DN inheritance | Standard | Standard. |
| BloodHound gMSA visibility | Modern | Tool. |
| Detection: container modify events | Defender | Adjacent. |
| Per-tier storage segregation | Hardening | Edge. |
| Default vs custom comparison | Per-org | Edge. |
| Authenticated Users read attrs | Default | Standard. |
| Specific groups read msDS-ManagedPassword | Granular | Standard. |
^ad-gmsa-container

### Container exploration

```powershell
# Default container contents
Get-ADObject -SearchBase "CN=Managed Service Accounts,DC=dom,DC=local" -Filter * |
  Select Name,DistinguishedName,ObjectClass

# Container DACL
Get-Acl "AD:CN=Managed Service Accounts,DC=dom,DC=local" |
  Select -ExpandProperty Access |
  Where AccessControlType -eq "Allow" |
  Select IdentityReference,ActiveDirectoryRights
```

___

## Anonymous gMSA Discovery (Limited)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Anonymous LDAP read | Often blocked | Hardened. |
| Modern Server 2019+ | Anonymous bind disabled | Standard. |
| RPC anonymous: gMSA queries blocked | Standard | Standard. |
| Schema query anonymous | Sometimes allowed | Edge. |
| RootDSE anonymous | Always | Standard. |
| Authenticated baseline preferred | Standard | Reliable. |
| Initial foothold required | Standard | Standard. |
| OSINT: gMSA naming patterns | OSINT | OSINT. |
| Public docs / leaked configs | Edge | Edge. |
| BloodHound passive | Authenticated required | Tool. |
| Pre-auth gMSA recon | Limited | Edge. |
| Detection: anonymous gMSA attempts | Defender | Adjacent. |
| Cross-trust gMSA read | Edge | Adjacent. |
| Compliance: authenticated only | Standard | Audit. |
| Authenticated `nxc ldap DC --gmsa` | Reliable | Standard. |
| Defender hardening default | Modern | Standard. |
^ad-gmsa-anonymous

### Anonymous gMSA probe

```bash
# Try anonymous LDAP for gMSA container
ldapsearch -x -h DC \
  -b "CN=Managed Service Accounts,DC=dom,DC=local" \
  -s onelevel \
  "(objectClass=msDS-GroupManagedServiceAccount)" \
  cn

# Common: "Operations error" (anonymous blocked)
# Modern: authenticated required

# Authenticated baseline
nxc ldap DC -u user -p pass --gmsa
```

___

## Per-Domain / Forest-Wide gMSA Discovery

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Per-domain gMSAs | Each domain has own | Standard. |
| Cross-domain queries via GC | Forest-wide | Standard. |
| `Get-ADServiceAccount -Server <domain>` | Specific domain | Adjacent. |
| Forest-wide audit | Per-domain iterate | Standard. |
| KDS key forest-wide | Single forest key | Standard. |
| Per-domain KDS variations | Edge | Edge. |
| Cross-trust gMSA | Edge — usually no | Adjacent. |
| Per-domain ACL controls | Standard | Standard. |
| Migration scenarios | Cross-domain gMSA | Edge. |
| BloodHound multi-domain gMSA | Modern | Tool. |
| Forest root gMSAs | Tier 0 typically | Standard. |
| Cross-domain replication | Standard | Adjacent. |
| Audit: per-domain gMSA count | Standard | Compliance. |
| Detection: forest-wide gMSA enum | Defender SIEM | Adjacent. |
| OPSEC: bulk forest enum loud | Standard | OPSEC. |
| Targeted single-domain | Stealthier | OPSEC. |
^ad-gmsa-multidomain

### Forest-wide gMSA audit

```powershell
$forest = Get-ADForest

foreach ($d in $forest.Domains) {
  Write-Host "`n=== $d ===" -ForegroundColor Cyan
  try {
    $gmsas = Get-ADServiceAccount -Filter * -Server $d -ErrorAction SilentlyContinue
    Write-Host "gMSA count: $(($gmsas | Measure-Object).Count)"
    $gmsas | Select Name,SamAccountName,DistinguishedName | Format-Table
  } catch {
    Write-Warning "Failed to query $d"
  }
}
```

***
