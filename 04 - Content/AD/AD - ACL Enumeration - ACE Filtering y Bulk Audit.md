---
aliases:
  - Find-InterestingDomainAcl
  - Bulk ACL Audit
  - ACE Filtering
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - ACL Enumeration]]"
---
# AD - ACL Enumeration - ACE Filtering & Bulk Audit

***

## Find-InterestingDomainAcl

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Find-InterestingDomainAcl -ResolveGUIDs` | Bulk dangerous ACEs forest-wide | Standard hunt. |
| `Find-InterestingDomainAcl -ResolveGUIDs -Domain <other>` | Cross-domain | Multi-domain. |
| `Find-InterestingDomainAcl -ResolveGUIDs \| ? IdentityReferenceClass -eq "user"` | Solo users (excluir computers/groups) | Filter. |
| `Find-InterestingDomainAcl -ResolveGUIDs \| ? IdentityReferenceName -notmatch "Domain Admins\|Enterprise Admins\|SYSTEM\|BUILTIN\|Cert Publishers\|Exchange"` | Excluir defaults | Reduce noise. |
| `Find-InterestingDomainAcl -ResolveGUIDs \| Export-Csv acl_audit.csv -NoTypeInformation` | Export CSV | Reportable. |
^ad-bulk-findacl

```powershell
Import-Module .\PowerView.ps1

# Hunt + filter en una pasada
Find-InterestingDomainAcl -ResolveGUIDs |
  Where {
    $_.AccessControlType -eq "Allow" -and
    $_.IdentityReferenceName -notmatch "Domain Admins|Enterprise Admins|Schema Admins|SYSTEM|BUILTIN|Cert Publishers|Exchange|Domain Controllers|Self|NetworkService|LocalService"
  } |
  Select ObjectDN,ActiveDirectoryRights,ObjectAceType,IdentityReferenceName |
  Export-Csv interesting_acls.csv -NoTypeInformation
```

___

## Custom Bulk Audit Scripts

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADObject -Filter * -Pr nTSecurityDescriptor` (RSAT bulk) | Todos objects con SD | Custom audit. |
| Custom PowerShell loop sobre objects con DACL parsing | Filtros específicos | Custom rules. |
| `bloodyAD --host <DC> -d corp -u u -p pass get search "(objectClass=*)" --resolve-sd` | Linux bulk | Cross-platform. |
^ad-bulk-custom

```powershell
# Custom audit — find principals con ACEs sobre múltiples high-value objects
$Targets = @(
  "CN=Domain Admins,CN=Users,$((Get-ADDomain).DistinguishedName)",
  "CN=Enterprise Admins,CN=Users,$((Get-ADForest).RootDomain | % {(Get-ADDomain $_).DistinguishedName})",
  "CN=AdminSDHolder,CN=System,$((Get-ADDomain).DistinguishedName)",
  (Get-ADDomain).DistinguishedName
)

$Acls = foreach ($t in $Targets) {
  Get-Acl "AD:$t" |
    Select -Expand Access |
    Where {
      $_.AccessControlType -eq "Allow" -and
      $_.IdentityReference -notmatch "BUILTIN|NT AUTHORITY|Domain Admins|Enterprise Admins|SYSTEM|Cert Publishers" -and
      $_.ActiveDirectoryRights -match "Generic|Write|AllExtendedRights"
    } |
    Select @{n='Target';e={$t}},IdentityReference,ActiveDirectoryRights,ObjectType
}

$Acls | Group IdentityReference | Sort Count -Descending
```

___

## BloodHound Bulk Cypher

```cypher
// Top 10 principals con más ACL paths a high-value
MATCH (u)-[r:GenericAll|GenericWrite|WriteDacl|WriteOwner|ForceChangePassword|AddMember|AllExtendedRights]->(t {highvalue:true})
WHERE NOT u.objectid ENDS WITH '-512'
  AND NOT u.objectid ENDS WITH '-519'
  AND NOT u.objectid ENDS WITH '-518'
RETURN u.name,COUNT(t) AS targets ORDER BY targets DESC LIMIT 10

// All ACL relationships (raw)
MATCH (u)-[r:GenericAll|GenericWrite|WriteDacl|WriteOwner|ForceChangePassword|AddMember|AllExtendedRights]->(t)
RETURN u.name,type(r),t.name LIMIT 100

// ACL chains que terminan en DCSync
MATCH p=(u)-[*1..5]->(d:Domain)
WHERE u.owned = true AND any(r IN relationships(p) WHERE type(r) IN ['GetChanges','GetChangesAll'])
RETURN p
```
^ad-bulk-bhcypher

___

## Foreign Principal Audit

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Find-InterestingDomainAcl -ResolveGUIDs \| ? {$_.ObjectDN -notmatch $_.IdentityReferenceDomain}` | Cross-domain ACEs | Cross-trust audit. |
| `Get-ADObject -SearchBase "CN=ForeignSecurityPrincipals,..." -Filter *` | FSPs en local | Cross-trust principals. |
| BloodHound `MATCH (u)-[r:GenericAll]->(t) WHERE u.domain <> t.domain RETURN u,t,r` | Cross-domain ACL paths | Visual. |
^ad-bulk-foreign

___

## Stale / Old ACE Detection

| **Comando** | **Qué detecta** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADUser -Filter * -Pr LastLogonDate \| ? LastLogonDate -lt (Get-Date).AddDays(-180)` cross-ref con `Find-InterestingDomainAcl` | ACEs de stale users (cleanup) | Audit. |
| `Get-ADGroup -Filter * \| ? Members.Count -eq 0` cross-ref | Empty groups con ACEs (huérfanos) | Cleanup. |
| `Find-InterestingDomainAcl -ResolveGUIDs \| ? {(Get-ADUser $_.IdentityReferenceName -EA Silent).Enabled -eq $false}` | ACEs de disabled accounts | Audit. |
^ad-bulk-stale

___

## Per-Quarter Compliance

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| Run `Find-InterestingDomainAcl -ResolveGUIDs` cada quarter | Snapshot trimestral | Compliance. |
| `Compare-Object (Import-Csv Q1.csv) (Import-Csv Q2.csv) -Property ObjectDN,IdentityReferenceName,ActiveDirectoryRights` | Diff quarter-over-quarter | Trend. |
| PingCastle `--healthcheck` quarterly | Auto audit ACL findings | Standard. |
| Purple Knight quarterly | IoE ACL anomalies | Cross-tool. |
^ad-bulk-quarterly

```powershell
# Quarterly snapshot
$Q = "2026-Q2"
$Out = "C:\acl-audits\$Q.csv"

Find-InterestingDomainAcl -ResolveGUIDs |
  Select ObjectDN,IdentityReferenceName,ActiveDirectoryRights,ObjectAceType,@{n='Snapshot';e={$Q}} |
  Export-Csv $Out -NoTypeInformation

# Diff
Compare-Object (Import-Csv "C:\acl-audits\2026-Q1.csv") (Import-Csv $Out) `
  -Property ObjectDN,IdentityReferenceName,ActiveDirectoryRights |
  Where SideIndicator -eq "=>"  # nuevos en Q2
```

___

## OPSEC Considerations

| **Práctica** | **Por qué** | **Cuándo** |
|:---:|:---:|:---:|
| `Find-InterestingDomainAcl` → bulk LDAP queries | Detectable como recon | Defender SIEM signal. |
| Use `-ResolveGUIDs` con cuidado | Cada GUID = LDAP query extra | Reduce noise. |
| Pacing: queries por OU en vez de domain root | Smaller scope per query | Stealth. |
| Run via existing context (no nuevos hosts) | Reduce telemetry | OPSEC. |
| Audit logs SACL en `nTSecurityDescriptor` reads | Defender side detection | Adjacent. |
| BloodHound collection vez de bulk LDAP | Single ingest = less LDAP storm | Standard. |
^ad-bulk-opsec

***
