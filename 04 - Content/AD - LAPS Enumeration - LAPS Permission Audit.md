---
aliases:
  - LAPS ACL Audit
  - LAPS Readers
  - Find-AdmPwdExtendedRights
  - Find-LapsADExtendedRights
tags:
  - type/technique
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[AD - LAPS Enumeration]]'
---
# AD - LAPS Enumeration - LAPS Permission Audit

***

## Required Permissions

| **Permission** | **Necesario para** | **Schema attr** |
|:---:|:---:|:---:|
| `ExtendedRight: All-Extended-Rights` | Read pwd cleartext (LAPSv1/v2) | `ms-Mcs-AdmPwd` / `msLAPS-Password`. |
| `ReadProperty` específico sobre attribute | Read solo el attr | LAPSv1/v2 attr GUID. |
| `WriteProperty` sobre attr | Reset / modify | Solo Domain Admins typically. |
| `Self` ACE en computer object | Computer escribe su propio pwd | Auto setup. |
| LAPSv2: principal en `EncryptionPrincipal` GPO setting | Decrypt blob DPAPI-NG | Modern. |
^ad-laps-perm-required

**Decryption capability ≠ LDAP read** en LAPSv2. Podés leer `msLAPS-EncryptedPassword` blob pero sin decrypt key = inútil.

___

## Per-Computer ACL Audit

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-Acl "AD:<computer-DN>").Access \| ? ObjectType -eq "ea1b7b93-5e48-46d5-bc6c-4df4fda78a35"` | ACEs `All-Extended-Rights` (incluye LAPS read) | Per-host. |
| `dsacls "<computer-DN>" \| Select-String "ms-Mcs-AdmPwd\|msLAPS"` | DACL específica | Native. |
| `Get-ADObject "<computer-DN>" -Properties nTSecurityDescriptor \| Select -Expand nTSecurityDescriptor \| Select -Expand Access` | DACL completa | Detail. |
^ad-laps-perm-acl

```powershell
# Per-computer LAPS readers
function Get-LapsReaders {
  param([string]$ComputerDN)
  (Get-Acl "AD:$ComputerDN").Access |
    Where {
      $_.AccessControlType -eq "Allow" -and
      ($_.ObjectType -eq "ea1b7b93-5e48-46d5-bc6c-4df4fda78a35" -or
       $_.ActiveDirectoryRights -match "GenericAll|GenericRead")
    } |
    Select IdentityReference,ActiveDirectoryRights
}

Get-ADComputer -Filter * | % { Get-LapsReaders -ComputerDN $_.DistinguishedName }
```

___

## Native LAPS Helper Tools

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Find-AdmPwdExtendedRights -Identity <OU>` (LAPSv1 module) | Per-OU readers | LAPSv1. |
| `Find-LapsADExtendedRights -Identity <OU>` (Win LAPS module) | Per-OU readers | LAPSv2. |
| `Get-LapsADExtendedRights -Identity <OU>` | Detail readers + edges | Modern. |
| `Set-LapsADComputerSelfPermission -Identity <OU>` | Grant self-write (priv) | Setup. |
^ad-laps-perm-native

```powershell
# LAPSv1
Import-Module AdmPwd.PS
Find-AdmPwdExtendedRights -Identity "OU=Servers,DC=corp,DC=local"

# LAPSv2
Import-Module LAPS
Find-LapsADExtendedRights -Identity "OU=Servers,DC=corp,DC=local"
```

___

## Recursive Group Membership

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADGroupMember "LAPS Readers" -Recursive` | Effective members del read group | Per-group audit. |
| `Find-LapsADExtendedRights -Identity <OU> \| % { $_.ExtendedRightHolders \| Get-ADObject -EA SilentlyContinue }` | Resolve principals + recursive | Comprehensive. |
| BloodHound `MATCH p=(u:User)-[:MemberOf*1..]->(g:Group)-[:ReadLAPSPassword]->(c:Computer) RETURN p` | Recursive paths to LAPS | Visual. |
^ad-laps-perm-recursive

___

## BloodHound LAPS Edges

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u {owned:true})-[:ReadLAPSPassword*1..]->(c:Computer) RETURN u.name,c.name` | Paths owned → LAPS read | Privesc planning. |
| `MATCH (c:Computer {haslaps:true}) RETURN c.name,c.domain` | Computers con LAPS deployed | Coverage. |
| `MATCH (u:User)-[:MemberOf*1..]->(g:Group)-[:ReadLAPSPassword]->(c:Computer) RETURN u.name,g.name,c.name` | Recursive readers + computer | Detailed. |
| `MATCH (c:Computer) WHERE NOT c.haslaps RETURN c.name` | Computers SIN LAPS | Coverage gaps. |
^ad-laps-perm-bh

```bash
# SharpHound collection con LAPS data
.\SharpHound.exe -c All
# o
bloodhound-python -d corp.local -u u -p p -ns <DC> -c All --zip
```

___

## Permission Misconfigurations

| **Comando** | **Qué detecta** | **Riesgo** |
|:---:|:---:|:---:|
| `Find-LapsADExtendedRights -Identity (Get-ADDomain).DistinguishedName \| ? ExtendedRightHolders -match "Authenticated Users\|Everyone\|Domain Users"` | Wide LAPS read | **CRITICAL** — todos pueden read. |
| `Find-LapsADExtendedRights -Identity (Get-ADDomain).DistinguishedName \| ? {$_.ExtendedRightHolders.Count -gt 5}` | Demasiados readers (likely misconfig) | Audit. |
| OUs Tier 0 con readers Tier 1+ | Tier crossing | Audit critical. |
| Same group reads Tier 0 + Tier 2 | Flat tiering | Audit. |
^ad-laps-perm-misconfig

___

## LAPS Read Detection

| **Event ID** | **Significa** | **Cuándo** |
|:---:|:---:|:---:|
| `4662` (Object Access — Directory Service Access) | Per-attribute read logged si SACL configurado | Defender alerting. |
| `4663` | Object access | Standard. |
| MDI alerta `Suspicious LDAP query against AD` | Bulk LAPS read | Modern detection. |
| Custom SACL en LAPS attrs | Granular logging | Hardening. |
^ad-laps-perm-detection

```powershell
# Audit SACL en LAPS attrs (defender side)
$schema = (Get-ADRootDSE).SchemaNamingContext
Get-ADObject -SearchBase $schema -Filter {Name -eq "msLAPS-Password"} -Properties nTSecurityDescriptor |
  Select -Expand nTSecurityDescriptor |
  Select -Expand Audit
```

___

## Audit Best Practices

| **Práctica** | **Comando** | **Cuándo** |
|:---:|:---:|:---:|
| Tier-specific read groups | `Set-LapsADReadPasswordPermission -Identity <OU> -AllowedPrincipals "T1 Server Admins"` | Per-tier hardening. |
| Cleanup wide ACEs | `Remove-AdmPwdReadPermission` (custom script) | Post-audit. |
| Trimestral audit ACEs | `Find-LapsADExtendedRights` + diff | Compliance. |
| Force rotation post-engagement | `Reset-LapsPassword -Identity <host>` (Win LAPS module) | Cleanup. |
| Monitor 4662 con LAPS attr GUID filter | SIEM rule | Detection. |
^ad-laps-perm-audit

***
