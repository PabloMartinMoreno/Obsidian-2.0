---
aliases:
  - Computer Objects Enumeration
  - LDAP Computer Filter
  - Servers Enumeration
  - High-Value Computer Targets
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
  - "[[AD - Hosts Enumeration]]"
  - "[[netexec]]"
---
# AD - Hosts Enumeration - Computer Objects via LDAP

***

## Bulk Computer Listing

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-ADComputer -Filter *` | All computers | RSAT minimal. |
| `Get-ADComputer -Filter * -Properties *` | All attributes | Full detail. |
| `Get-NetComputer -FullData` | PowerView | Adversary. |
| `nxc ldap DC -u u -p p --computers` | netexec | Quick list. |
| `ldapsearch -h DC -D u -w p -b "DC=dom,DC=local" "(objectCategory=computer)" cn dNSHostName operatingSystem` | Raw LDAP | Linux. |
| `windapsearch -d <dom> --dc-ip DC -u user -p pass --computers` | Wrapper | Helper. |
| `bloodhound-python -d <dom> -c Computers` | BH Python | Visualize. |
| `SharpHound.exe -c Computers` | BH C# | Windows. |
| `pywerview computer` | Linux PowerView | Adjacent. |
| `Get-WmiObject Win32_ComputerSystem` (per-host) | WMI | Local-only. |
| `dsquery computer -limit 0` | Legacy | All computers. |
| `adfind -f "(objectCategory=computer)" -bit -c` | Joeware adfind | Comprehensive. |
| `Get-ADComputer -Filter * | Measure | Count | Sizing. |
| Anonymous bind blocked? | Modern AD | Need creds. |
| Default Computers container | `CN=Computers,DC=dom,DC=local` | Default location. |
| Domain Controllers OU | `OU=Domain Controllers,DC=dom,DC=local` | DC location. |
^ad-computers-bulk

### Bulk dump

```bash
# netexec (fast)
nxc ldap DC -u user -p pass --computers > computers.txt

# Detailed attributes
nxc ldap DC -u user -p pass --query \
  "(objectCategory=computer)" \
  "cn,dNSHostName,operatingSystem,operatingSystemVersion,lastLogonTimestamp,servicePrincipalName" \
  > computers_detail.txt
```

```powershell
# RSAT
Get-ADComputer -Filter * -Properties OperatingSystem,OperatingSystemVersion,LastLogonDate,Description |
  Select Name,DNSHostName,OperatingSystem,OperatingSystemVersion,LastLogonDate,Description |
  Sort LastLogonDate -Descending |
  Export-Csv computers.csv -NoTypeInformation
```

___

## Critical Computer Attributes

| **Atributo** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `cn` / `samAccountName` | Hostname (with `$`) | Standard ID. |
| `dNSHostName` | FQDN | Network ID. |
| `operatingSystem` | OS name | Targeting. |
| `operatingSystemVersion` | Build number | Vuln matching. |
| `operatingSystemServicePack` | SP | Legacy. |
| `lastLogonTimestamp` | Last logon (replicated, ~14d delay) | Activity. |
| `lastLogon` | Last logon (per-DC, real-time) | Activity (per-DC). |
| `pwdLastSet` | Computer account password last change | Stale check. |
| `userAccountControl` | Flags (TRUSTED_FOR_DELEGATION, etc) | Critical bitfield. |
| `servicePrincipalName` | SPNs (host/HOST/RestrictedKrbHost) | Service ID. |
| `msDS-AllowedToDelegateTo` | Constrained delegation targets | Critical. |
| `msDS-AllowedToActOnBehalfOfOtherIdentity` | RBCD | Critical. |
| `ms-Mcs-AdmPwd` (legacy) / `msLAPS-Password` | LAPS password | Direct cred. |
| `description` | Free-text — passwords leak | Always check. |
| `managedBy` | Owner DN | Path indicator. |
| `objectSid` | SID | RID extraction. |
| `whenCreated` / `whenChanged` | Lifecycle | Recent activity. |
^ad-computers-attrs

### UAC flags decoded for computers

```
0x00000002  ACCOUNTDISABLE
0x00001000  WORKSTATION_TRUST_ACCOUNT  (default workstation)
0x00002000  SERVER_TRUST_ACCOUNT       (DC)
0x00080000  TRUSTED_FOR_DELEGATION     ← Unconstrained delegation
0x00100000  NOT_DELEGATED
0x01000000  TRUSTED_TO_AUTH_FOR_DELEGATION  ← Constrained w/protocol transition
```

```bash
# Find unconstrained delegation
nxc ldap DC -u u -p p --trusted-for-delegation

# Or LDAP raw
ldapsearch -h DC -D u -w p -b "DC=dom,DC=local" \
  "(&(objectCategory=computer)(userAccountControl:1.2.840.113556.1.4.803:=524288))" \
  cn dNSHostName

# Find constrained delegation
ldapsearch -h DC -D u -w p -b "DC=dom,DC=local" \
  "(&(objectCategory=computer)(msDS-AllowedToDelegateTo=*))" \
  cn dNSHostName msDS-AllowedToDelegateTo
```

___

## High-Value Targets Identification

| **Filter** | **Purpose** | **Notas** |
|:---:|:---:|:---:|
| `OperatingSystem -like "*Server*"` | Servers only | Targeting tier 1+. |
| `TrustedForDelegation -eq $true` | Unconstrained delegation | Critical compromise target. |
| `msDS-AllowedToDelegateTo -ne $null` | Constrained delegation | Privileged. |
| `msDS-AllowedToActOnBehalfOfOtherIdentity -ne $null` | RBCD configured | Lateral target. |
| OU = Domain Controllers | DCs explicit | Top-tier. |
| `LastLogonDate < 30 days ago` | Active hosts | Live targets. |
| `LastLogonDate < 7 days` | Recently active | Sessions likely cached. |
| `ServicePrincipalName -like "*MSSQLSvc*"` | SQL Servers | DB target. |
| `ServicePrincipalName -like "*HTTP*"` | Web servers | Adjacent. |
| `ServicePrincipalName -like "*ldap*"` | DCs (also workstation/HOST) | Filter. |
| `Description` contains keywords | Manual review for clues | Passwords leak. |
| OS = Windows Server 2008 / 2012 | Legacy — likely vuln | Easy target. |
| OS = Windows Server 2003 | Very legacy | Critical. |
| OS = Linux / non-Windows | AD-joined Linux | Edge. |
| Hostname contains "DC" / "DB" / "SQL" | Naming convention | Easy ID. |
| Hostname contains "PROD" / "DEV" / "TEST" | Environment ID | Risk grading. |
^ad-computers-hvtargets

### High-value enumeration

```powershell
# Servers only (active)
Get-ADComputer -Filter {OperatingSystem -like "*Server*" -and Enabled -eq $true} `
  -Properties OperatingSystem,OperatingSystemVersion,LastLogonDate,Description |
  Where {$_.LastLogonDate -gt (Get-Date).AddDays(-30)} |
  Select Name,DNSHostName,OperatingSystem,LastLogonDate,Description

# Unconstrained delegation (CRITICAL)
Get-ADComputer -Filter {TrustedForDelegation -eq $true -and PrimaryGroupID -ne 516} `
  -Properties TrustedForDelegation,LastLogonDate
# (PrimaryGroupID 516 = Domain Controllers — exclude DCs which are expected to have this flag)

# Constrained delegation
Get-ADComputer -Filter {msDS-AllowedToDelegateTo -like "*"} `
  -Properties msDS-AllowedToDelegateTo |
  Select Name,@{n='DelegatedTo';e={$_.'msDS-AllowedToDelegateTo' -join '; '}}

# RBCD configured (lateral target)
Get-ADComputer -Filter * `
  -Properties msDS-AllowedToActOnBehalfOfOtherIdentity |
  Where {$_.'msDS-AllowedToActOnBehalfOfOtherIdentity'} |
  Select Name,DNSHostName
```

___

## Stale Computer Accounts

| **Indicator** | **Filter** | **Notas** |
|:---:|:---:|:---:|
| `pwdLastSet` very old | Computer pwd not rotated | Stale. |
| `LastLogonDate > 180 days` | No domain logon | Likely abandoned. |
| `Enabled=true` but stale | Defense gap | Risk. |
| Disabled but in priv group | Re-enable risk | Audit. |
| Computer password = default | After failed re-join | Risk. |
| Servers stale > 90 days | Critical hosts | Security audit. |
| Pre-Windows 2000 compatible (ANONYMOUS LOGON in Pre-Windows 2000 group) | Legacy | Edge. |
| Computer pwd never set | Anomaly | Investigation. |
| sIDHistory present | Migrated computer | Check trust. |
| Rouge computer accounts | Created by non-admin | Audit ms-DS-MachineAccountQuota. |
| Service account on workstation | Misconfig | Investigate. |
| Computer in Tier 0 OU | Should not be (unless DC) | Audit. |
| Mass-create from default container | Random unjoin | Suspicious. |
| `whenCreated` very recent + privileged OU | Possible attacker creation | Detection. |
| Description contains password | Common leak | Check. |
| Quote-default password ("password", "Pa$$w0rd!") in description | Default/test | Check. |
^ad-computers-stale

### Stale audit

```powershell
# Stale > 180 days
$staleDate = (Get-Date).AddDays(-180)
Get-ADComputer -Filter {LastLogonDate -lt $staleDate -and Enabled -eq $true} `
  -Properties LastLogonDate,OperatingSystem |
  Select Name,DNSHostName,OperatingSystem,LastLogonDate

# Computer account pwd > 90 days (default rotation 30d)
$pwdStale = (Get-Date).AddDays(-90)
Get-ADComputer -Filter * -Properties PasswordLastSet |
  Where {$_.PasswordLastSet -lt $pwdStale} |
  Select Name,PasswordLastSet
```

___

## Bulk Profile Live Targets

| **Combine** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Live + signing off | `nxc smb hosts.txt -u u -p p --signing` filter | Relay candidates. |
| Live + LAPS readable | `nxc smb hosts.txt -u u -p p --laps` | Cred path. |
| Live + admin access | `nxc smb hosts.txt -u u -p p` (Pwn3d marker) | Lateral foothold. |
| Live + session count | `nxc smb hosts.txt -u u -p p --sessions` | Pivot prep. |
| Live + loggedon users | `nxc smb hosts.txt -u u -p p --loggedon-users` | Tier-X user discovery. |
| Live + share enum | `nxc smb hosts.txt -u u -p p --shares` | Spider target prep. |
| Live + RID brute | `nxc smb hosts.txt -u u -p p --rid-brute` | Local accounts enum. |
| Live + svc enum | `nxc smb hosts.txt -u u -p p --services` | Service discovery. |
| Live + WMI exec test | `nxc smb hosts.txt -u u -p p -x whoami` | Code exec verify. |
| Live + WinRM access | `nxc winrm hosts.txt -u u -p p` | Lateral path. |
| Live + RDP access | `nxc rdp hosts.txt -u u -p p` (limited) | Adjacent. |
| Live + SSH on Linux | `nxc ssh hosts.txt -u u -p p` | Linux AD-joined. |
| Live + MSSQL access | `nxc mssql hosts.txt -u u -p p` | DB enumeration. |
| Live + LDAP query | `nxc ldap DC -u u -p p` | DC query. |
| HTTPS WinRM (5986) | `nxc winrm hosts.txt -u u -p p --port 5986` | Encrypted. |
| HTTP WinRM (5985) | Default port | Standard. |
^ad-computers-bulk-profile

### Profile pipeline

```bash
# Get all server names
nxc ldap DC -u user -p pass --computers > servers.txt

# Quick live + admin profile
nxc smb servers.txt -u user -p pass

# Output decode:
# (Pwn3d!)        = local admin
# Signing: True   = relay-resistant
# Signing: False  = relay candidate ←
# OS info         = vuln matching
```

***
