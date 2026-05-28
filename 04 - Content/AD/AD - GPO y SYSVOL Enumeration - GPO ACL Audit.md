---
aliases:
  - GPO ACL Audit
  - GPO Modify Rights
  - WriteGPLink
  - Group Policy Creator Owners
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - GPO y SYSVOL Enumeration]]"
---
# AD - GPO y SYSVOL Enumeration - GPO ACL Audit

***

## GPO Object DACL

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-GPPermission -Guid <GPO-GUID> -All` | Permisos del GPO (RSAT-GPO) | Standard. |
| `Get-Acl "AD:CN={<GUID>},CN=Policies,CN=System,$((Get-ADDomain).DistinguishedName)"` | DACL raw del GPO container | Sin RSAT-GPO. |
| `Get-GPO -All \| % { Get-GPPermission -Guid $_.Id -All }` | Bulk audit | Forest-wide. |
^ad-gpoacl-rights

```powershell
# Audit GPOs con modify ACEs non-default
Get-GPO -All | % {
  $g = $_
  Get-GPPermission -Guid $g.Id -All -EA SilentlyContinue |
    Where {
      $_.Permission -in "GpoEditDeleteModifySecurity","GpoEdit" -and
      $_.Trustee.Name -notmatch "Domain Admins|Enterprise Admins|SYSTEM|Cert Publishers"
    } |
    Select @{n='GPO';e={$g.DisplayName}},@{n='Trustee';e={$_.Trustee.Name}},Permission
}
```

___

## GPO Owner

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-Acl "AD:CN={<GUID>},CN=Policies,CN=System,...").Owner` | Owner del GPO | Per-GPO. |
| `Get-GPO -All \| % { (Get-Acl "AD:CN={$($_.Id.Guid)},CN=Policies,CN=System,$((Get-ADDomain).DistinguishedName)").Owner }` | Bulk owners | Forest-wide. |
^ad-gpoacl-owner

**Por qué importa:** owner tiene **implicit Modify Permissions** = puede grant self GenericAll. Audit owners non-default.

___

## WriteGPLink ACE

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:<OU-DN>" \| Select -Expand Access \| ? ObjectType -eq "f30e3bbe-9ff0-11d1-b603-0000f80367c1"` | WriteProperty `gPLink` ACE | OU-level GPO link control. |
| `Find-InterestingDomainAcl -ResolveGUIDs \| ? ObjectAceType -eq "GP-Link"` | Bulk hunt | Forest-wide. |
^ad-gpoacl-writegplink

**Por qué importa:** `WriteProperty gPLink` sobre OU = atacante puede **link malicious GPO** a la OU. Combinado con `Group Policy Creator Owners` (crear GPO) = mass compromise OU.

___

## Group Policy Creator Owners

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADGroupMember "Group Policy Creator Owners" -Recursive` | Members efectivos | Audit. |
| `New-GPO -Name "<MaliciousGPO>"` (priv = group member) | Crear GPO | Privesc step. |
^ad-gpoacl-gpocreator

**Combo crítico:**
1. Member de `Group Policy Creator Owners` → crear GPO.
2. `WriteProperty gPLink` sobre OU → link GPO.
3. GPO contiene scheduled task / startup script malicious.
4. `gpupdate /force` en victims → ejecuta como SYSTEM.

___

## ACL Inheritance from Domain Root

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-Acl "AD:$((Get-ADDomain).DistinguishedName)").Access \| ? IsInherited -eq $false \| ? ActiveDirectoryRights -match "WriteProperty"` | Direct ACEs en domain root | Cross-trust audit. |
| `Get-GPInheritance -Target "$((Get-ADDomain).DistinguishedName)"` | GPOs aplicados a domain root | Top-level. |
^ad-gpoacl-inherit

___

## SYSVOL File Permissions

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "\\<DC>\sysvol\corp.local\Policies\{<GUID>}"` | DACL filesystem del GPO | SYSVOL side. |
| `icacls "\\<DC>\sysvol\corp.local\Policies\{<GUID>}"` | Native ACL | Sin RSAT. |
| `cacls.exe \\<DC>\sysvol\... /T /Q` | Recursive | Edge. |
^ad-gpoacl-sysvol

**Caveat:** GPO permissions están **en dos lugares**:
1. **AD object** (`CN={GUID},CN=Policies,...`) — controla quien puede modify settings.
2. **SYSVOL filesystem** (`\\<DC>\sysvol\...`) — controla quien puede modify scripts/files.

Ambos deben matchear. Mismatch = privesc surface.

___

## Cross-Correlate Tier 0

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-GPInheritance -Target "OU=Domain Controllers,..."` | GPOs aplicados a DCs | Critical. |
| `Get-GPInheritance -Target "OU=Domain Controllers,..." \| % { Get-GPPermission -Guid $_.GpoLinks.GpoId -All }` | Permisos de GPOs en DC OU | ACL audit. |
^ad-gpoacl-tier0

___

## BloodHound GPO Edges

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u)-[:GpLink]->(o:OU) RETURN u,o` | GPLink edges (rare relación inversa) | Edge cases. |
| `MATCH (g:GPO)-[:GpLink]->(o:OU) RETURN g,o` | GPO → OU links | Standard. |
| `MATCH (u {owned:true})-[:GenericAll\|GenericWrite\|WriteDacl\|WriteOwner]->(g:GPO) RETURN u,g` | Privesc surface (modify GPO) | Path. |
| `MATCH (u {owned:true})-[*1..]->(g:GPO)-[:GpLink]->(o:OU)-[:Contains]->(c:Computer) RETURN p` | Mass compromise paths | Critical. |
^ad-gpoacl-bh

___

## Mitigations

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| Restrict modify ACEs a Tier 0 only | Per-GPO ACL | Hardening. |
| Empty `Group Policy Creator Owners` group | Best practice | Defense. |
| Audit `WriteProperty gPLink` ACEs sobre Tier 0 OUs | Quarterly | Compliance. |
| Remove non-default owners | Re-set owner = Domain Admins | Cleanup. |
| Match AD + SYSVOL DACLs | Eliminate mismatches | Audit. |
^ad-gpoacl-mitigations

***
