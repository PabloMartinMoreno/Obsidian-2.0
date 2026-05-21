---
aliases:
  - Non-Default DCSync
  - DCSync Audit
  - Service Accounts DCSync
tags:
  - type/concept
  - vuln/ad-enumeration
  - technique/credential-access
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[AD - DCSync Rights Discovery]]'
---
# AD - DCSync Rights Discovery - Default vs Non-Default Holders

***

## Expected Default Holders

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-Acl "AD:DC=corp,DC=local").Access \| ? {$_.ObjectType -in "1131f6aa-...","1131f6ad-..."} \| ? IdentityReference -match "Domain Admins\|Enterprise Admins\|Administrators\|Domain Controllers\|SYSTEM"` | ACEs default (whitelist) | Baseline. |
^ad-dcsyncdef-defaults

**Whitelist principals esperados:**
- `Domain Admins` (S-1-5-21-...-512)
- `Enterprise Admins` (S-1-5-21-...-519, forest root only)
- `Administrators` (S-1-5-32-544)
- `Domain Controllers` (S-1-5-21-...-516)
- `Read-only Domain Controllers` (S-1-5-21-...-521)
- `BUILTIN\Pre-Windows 2000 Compatible Access` (legacy compat)
- `NT AUTHORITY\SYSTEM`
- `NT AUTHORITY\ENTERPRISE DOMAIN CONTROLLERS` (S-1-5-9)

___

## Common Misconfigurations

| **Comando** | **Qué detecta** | **Riesgo** |
|:---:|:---:|:---:|
| `(Get-Acl "AD:<domain-root-DN>").Access \| ? {$_.ObjectType -in (DCSync GUIDs)} \| ? IdentityReference -notmatch "<whitelist>"` | Non-default DCSync ACEs | Critical. |
| `... \| ? IdentityReference -match "Authenticated Users\|Domain Users\|Everyone"` | Wide DCSync (catastrofic) | **CRITICAL**. |
| `... \| ? IdentityReference -match "(?i)svc\|service"` | Service accounts con DCSync | Audit. |
| `... \| ? IdentityReference -match "Exchange"` | Exchange legacy DCSync (CVE-2019-1040 patched) | Legacy audit. |
^ad-dcsyncdef-misconfigs

```powershell
$Whitelist = "Domain Admins|Enterprise Admins|Schema Admins|Administrators|Domain Controllers|Read-only Domain Controllers|Pre-Windows 2000|SYSTEM|ENTERPRISE DOMAIN CONTROLLERS|BUILTIN"

(Get-Acl "AD:$((Get-ADDomain).DistinguishedName)").Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    $_.ObjectType -in @(
      "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2",
      "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"
    ) -and
    $_.IdentityReference -notmatch $Whitelist
  } |
  Select IdentityReference,ActiveDirectoryRights,ObjectType
```

___

## Exchange Legacy DCSync

| **Group** | **Pre-2019 Privilegio** | **Status** |
|:---:|:---:|:---:|
| `Exchange Trusted Subsystem` | `WriteDACL` sobre domain root → grant DCSync | Patched CVE-2019-1040. |
| `Exchange Windows Permissions` | Igual | Patched. |
| `Exchange Servers` | `GetChanges`-style legacy | Patched. |
| `Exchange Enterprise Servers` | Forest-wide adjacent | Patched. |
^ad-dcsyncdef-exchange

**Status:** patched 2019 con `Exchange Split Permissions Model`. Environments unpatched o con custom modifications siguen vulnerables. Audit Exchange groups en domain root DACL.

```powershell
# Hunt Exchange-style ACEs
(Get-Acl "AD:$((Get-ADDomain).DistinguishedName)").Access |
  Where {
    $_.IdentityReference -match "Exchange" -and
    $_.ActiveDirectoryRights -match "WriteDacl|GenericAll|GenericWrite"
  }
```

___

## Custom Tier 0 Groups

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADGroupMember <custom-T0-group> -Recursive` | Members de custom Tier 0 con DCSync | Audit. |
| `(Get-Acl "AD:<domain-root>").Access \| ? IdentityReference -notmatch <whitelist>` cross-ref con custom groups | Non-default + cross-ref | Standard audit. |
^ad-dcsyncdef-custom

**Common pattern:** orgs crean custom group "AD Recovery" o "Tier0 Backup" con DCSync rights → cleanup post-DR exercise. Audit estos como secondary tier 0.

___

## Cross-Trust DCSync

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-Acl "AD:<domain-root>").Access \| ? IdentityReference -match "ForeignSecurityPrincipals\|<other-domain>\\"` | Foreign principals con DCSync | **Critical** cross-trust. |
| BloodHound `MATCH (u)-[r:GetChanges\|GetChangesAll]->(d:Domain) WHERE u.domain <> d.name RETURN u,d` | Cross-domain DCSync paths | Visual. |
| `Find-InterestingDomainAcl -Domain <other> -ResolveGUIDs \| ? ActiveDirectoryRights -match "GetChanges"` | Cross-domain hunt | Cross-trust. |
^ad-dcsyncdef-crosstrust

___

## Stale ACE Detection

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-Acl "AD:<domain-root>").Access \| ? IdentityReference -in (Get-ADUser -Filter {Enabled -eq $false}).SamAccountName` | DCSync ACE de disabled accounts | Cleanup. |
| `(Get-Acl "AD:<domain-root>").Access \| ? IdentityReference -in (Get-ADUser -Filter {LastLogonDate -lt (Get-Date).AddDays(-180)}).SamAccountName` | Stale users con DCSync | Audit. |
| Empty groups con DCSync ACE | `Get-ADGroup -Filter * \| ? Members.Count -eq 0` cross-ref | Orphaned ACE. |
^ad-dcsyncdef-stale

___

## Continuous Audit

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| Snapshot DACL del domain root cada Q | Trimestral baseline | Compliance. |
| Diff snapshots → detect new DCSync ACEs | Persistence detection | Audit. |
| `PingCastle.exe --healthcheck` includes DCSync check (rule `S-DC-DCSync`) | Auto detection | Quarterly. |
| Purple Knight IoC `Suspicious DCSync rights` | Modern alert | Cross-tool. |
| MDI baseline + alerta cualquier change | Real-time | Defender. |
^ad-dcsyncdef-continuous

```powershell
# Snapshot quarterly
$Q = "2026-Q2"
$Out = "C:\dcsync-audits\$Q.csv"
New-Item -ItemType Directory -Path (Split-Path $Out) -Force -EA SilentlyContinue

(Get-Acl "AD:$((Get-ADDomain).DistinguishedName)").Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    $_.ObjectType -in @(
      "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2",
      "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"
    )
  } |
  Select IdentityReference,ActiveDirectoryRights,ObjectType,@{n='Snapshot';e={$Q}} |
  Export-Csv $Out -NoTypeInformation

# Diff con quarter anterior
Compare-Object (Import-Csv "C:\dcsync-audits\2026-Q1.csv") (Import-Csv $Out) `
  -Property IdentityReference,ObjectType |
  Where SideIndicator -eq "=>"  # nuevos
```

***
