---
aliases:
  - High-Value Targets
  - Tier 0 Users
  - Privileged Accounts
  - Service Accounts
tags:
  - type/technique
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[AD - Users Enumeration]]'
  - '[[BloodHound & SharpHound]]'
---
# AD - Users Enumeration - High-Value Users

***

## Privileged Group Members

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADGroupMember "Domain Admins" -Recursive` | DAs efectivos (incluye nested) | Tier 0 base. |
| `Get-ADGroupMember "Enterprise Admins" -Recursive` | EAs (forest-wide) | Tier 0 forest. |
| `Get-ADGroupMember "Schema Admins" -Recursive` | Schema (debe estar vacío) | Audit hardening. |
| `Get-ADGroupMember "Administrators" -Recursive` | Built-in administrators | Tier 0 local DC. |
| `Get-ADGroupMember "Backup Operators" -Recursive` | NTDS dump path | Tier 0 alt. |
| `Get-ADGroupMember "Account Operators" -Recursive` | Account mgmt | Tier 0/1. |
| `Get-ADGroupMember "Server Operators" -Recursive` | Logon DC + reg edit | Tier 0/1. |
| `Get-ADGroupMember "DnsAdmins" -Recursive` | Legacy DLL load (CVE-2021-40469) | Tier 0/1. |
| `Get-ADGroupMember "Group Policy Creator Owners" -Recursive` | GPO creation | Tier 0/1. |
| `Get-ADGroupMember "Cloneable Domain Controllers" -Recursive` | DC clone capability | Tier 0. |
| `nxc smb <DC> -u u -p p --groups "Domain Admins"` | Group members vía netexec | Linux quick. |
^ad-hv-priv-groups

```powershell
# Snapshot completo Tier 0
$Tier0 = "Domain Admins","Enterprise Admins","Schema Admins","Administrators",
         "Backup Operators","Account Operators","Server Operators","Print Operators",
         "DnsAdmins","Group Policy Creator Owners","Cloneable Domain Controllers"

foreach ($g in $Tier0) {
  Write-Host "`n=== $g ===" -ForegroundColor Cyan
  try {
    Get-ADGroupMember -Identity $g -Recursive -EA Stop |
      Get-ADUser -Properties Description,LastLogonDate,Enabled |
      Select Name,SamAccountName,Description,LastLogonDate,Enabled
  } catch { "  (no group / no access)" }
}
```

___

## adminCount Indicator

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter {AdminCount -eq 1}` | Users con flag AdminSDHolder | Quick Tier 0+ ID. |
| `Get-ADUser -Filter {AdminCount -eq 1} -Pr LastLogonDate,PasswordLastSet,Enabled` | + atributos para audit | Stale audit. |
| `Get-ADUser -Filter {AdminCount -eq 1 -and LastLogonDate -lt (Get-Date).AddDays(-180)}` | adminCount stale (priv pero inactivo) | Cleanup target. |
| `Get-ADUser -Filter {AdminCount -eq 1 -and Enabled -eq $false}` | Disabled but priv | Reactivation risk. |
| `nxc ldap <DC> -u u -p p --admin-count` | Filter via netexec | Quick. |
| `ldapsearch ... "(&(objectCategory=user)(adminCount=1))" samAccountName description memberOf` | LDAP raw | Sin RSAT. |
^ad-hv-admincount

**Cómo funciona:** AdminSDHolder propaga DACL cada 60 minutos a miembros de grupos protegidos. Set `adminCount=1` como marker. Permanece **incluso después de remover** del grupo (legacy quirk) → audit stale para detectar usuarios con priv residual.

```powershell
# Hardening — encontrar adminCount stale para limpiar
Get-ADUser -Filter {AdminCount -eq 1} -Properties AdminCount,MemberOf,LastLogonDate |
  Where { $_.MemberOf -notmatch "Domain Admins|Enterprise Admins|Schema Admins|Administrators|Account Operators|Backup Operators|Server Operators|Print Operators|Replicator" } |
  Select Name,SamAccountName,LastLogonDate,@{n='Groups';e={($_.MemberOf -replace 'CN=([^,]+).*','$1') -join ', '}}
```

___

## Service Accounts

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter {ServicePrincipalName -like "*"} -Pr ServicePrincipalName,AdminCount,LastLogonDate` | Users con SPN (kerberoastables) | Pre-attack. |
| `Get-ADUser -Filter {ServicePrincipalName -like "*" -and AdminCount -eq 1}` | Service accounts privilegiados | Critical kerberoast. |
| `Get-ADUser -Filter {SamAccountName -like "svc*" -or SamAccountName -like "*-svc" -or SamAccountName -like "service*"}` | Por naming convention | Pattern recon. |
| `Get-ADUser -Filter {PasswordNeverExpires -eq $true -and ServicePrincipalName -like "*"}` | Service + static pwd (spray) | Common combo. |
| `nxc ldap <DC> -u u -p p --kerberoasting kerb.hash` | SPN enum + dump TGS | Kerberoast bulk. |
| `impacket-GetUserSPNs corp.local/u:p -dc-ip <DC> -request -outputfile spns.kerb` | Kerberoast Linux | Linux. |
^ad-hv-service

```powershell
# Service accounts con detalle útil
Get-ADUser -Filter {ServicePrincipalName -like "*"} `
  -Properties ServicePrincipalName,AdminCount,LastLogonDate,PasswordLastSet,PasswordNeverExpires,MemberOf |
  Select Name,SamAccountName,AdminCount,
         @{n='SPNs';e={$_.ServicePrincipalName -join '; '}},
         LastLogonDate,PasswordLastSet,PasswordNeverExpires |
  Sort AdminCount -Descending
```

___

## Delegation Targets

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter {TrustedForDelegation -eq $true}` | Users con UD (críticos, raros en users) | Critical pre-attack. |
| `Get-ADUser -Filter * -Pr msDS-AllowedToDelegateTo \| ? msDS-AllowedToDelegateTo` | Constrained delegation users | S4U privesc paths. |
| `Get-ADUser -Filter {TrustedToAuthForDelegation -eq $true}` | Constrained con protocol transition | S4U2Self abuse. |
| `Get-ADUser -Filter {AccountNotDelegated -eq $true}` | Users con `NOT_DELEGATED` (Tier 0 protected) | Confirmar hardening. |
| `nxc ldap <DC> -u u -p p --trusted-for-delegation` | UD users + computers via netexec | Quick. |
^ad-hv-delegation

```bash
# Comprehensive delegation enum
ldapsearch -h <DC> -D 'corp\u' -w pass -b "DC=corp,DC=local" \
  "(&(objectCategory=user)(|(userAccountControl:1.2.840.113556.1.4.803:=524288)(msDS-AllowedToDelegateTo=*)(userAccountControl:1.2.840.113556.1.4.803:=16777216)))" \
  samAccountName userAccountControl msDS-AllowedToDelegateTo memberOf
```

___

## sIDHistory Users (Migration Leftover)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter * -Pr sIDHistory \| ? sIDHistory` | Users con SID History | Audit migration leftover. |
| `Get-ADUser <user> -Pr sIDHistory \| Select -Expand sIDHistory` | SIDs históricos del user | Per-user decode. |
| `ldapsearch ... "(&(objectCategory=user)(sIDHistory=*))" samAccountName sIDHistory` | LDAP raw (SIDs binarios) | Linux. |
^ad-hv-sidhistory

**Por qué:** SID History permite cross-forest privesc si SID Filtering está OFF. Migration via ADMT setea sIDHistory; suele quedarse post-migración. Audit users con sIDHistory + non-migration context = sospechoso (posible inyección de atacante).

```powershell
# Resolver SID History a nombres
Get-ADUser -Filter * -Properties sIDHistory | Where sIDHistory | % {
  $u = $_
  $u.sIDHistory | % {
    [PSCustomObject]@{
      User    = $u.SamAccountName
      OldSID  = $_.Value
      OldName = try { (New-Object System.Security.Principal.SecurityIdentifier($_.Value)).Translate([System.Security.Principal.NTAccount]).Value } catch { "UNRESOLVED" }
    }
  }
}
```

___

## gMSA / MSA / dMSA

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADServiceAccount -Filter * -Properties *` | gMSA + MSA accounts | Inventory. |
| `ldapsearch ... "(objectClass=msDS-GroupManagedServiceAccount)" samAccountName servicePrincipalName memberOf msDS-GroupMSAMembership` | gMSA via LDAP | Linux. |
| `nxc ldap <DC> -u u -p p --gmsa` | Bulk dump cleartext NT hash + Kerberos keys | Si autorizado leer pwd. |
| `python3 gMSADumper.py -u u -p pass -d corp.local` | Igual desde Python | Sin nxc. |
| `ldapsearch ... "(objectClass=msDS-ManagedServiceAccount)"` | MSA (single-host) | Inventory. |
| `ldapsearch ... "(objectClass=msDS-DelegatedManagedServiceAccount)"` | dMSA (Server 2025+) | Modern. |
| `Get-KdsRootKey` (priv) | KDS Root Key (necesario para decode pwd) | Forensic + GoldenGMSA. |
^ad-hv-gmsa

**Por qué importan:** passwords auto-rotados (default 30d). Si tu cuenta está en `msDS-GroupMSAMembership` DACL = podés leer cleartext NT hash + Kerberos keys via LDAP. Algunos gMSA están en grupos privilegiados → privesc directo.

```bash
# Pipeline gMSA dump
nxc ldap <DC> -u user -p pass --gmsa

# Output ejemplo:
# Account: SQL_gMSA$    NTLM: aabbccdd...
# Account: WEB_gMSA$    NTLM: 11223344...

# Use hash con netexec / Impacket
nxc smb <target> -u 'SQL_gMSA$' -H aabbccdd...
```

___

## BloodHound High-Value Cypher

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u:User {highvalue:true}) RETURN u.name,u.domain` | Users tagged HighValue | Quick HV list. |
| `MATCH (u:User)-[:MemberOf*1..]->(g:Group {name:"DOMAIN ADMINS@CORP.LOCAL"}) RETURN u.name` | DA effective members | Tier 0. |
| `MATCH (u:User {hasspn:true}) WHERE u.adminCount = true RETURN u.name,u.serviceprincipalnames` | Priv kerberoastables | Critical pre-attack. |
| `MATCH (u:User) WHERE u.dontreqpreauth = true RETURN u.name` | AS-REP roastables | Pre-attack. |
| `MATCH (u:User) WHERE u.unconstraineddelegation = true RETURN u.name` | UD users | Critical. |
| `MATCH (u:User)-[:HasSIDHistory]->(d:Domain) RETURN u.name,d.name` | sIDHistory edges | Cross-trust. |
^ad-hv-bloodhound

***
