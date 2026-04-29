---
aliases:
  - Default Domain Password Policy
  - net accounts
  - getdompwinfo
  - maxPwdAge
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
  - "[[AD - Password Policy Enumeration]]"
  - "[[netexec]]"
---
# AD - Password Policy Enumeration - Default Domain Policy

***

## Native Windows Tools

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `net accounts /domain` | Native CLI policy | Quick. |
| `Get-ADDefaultDomainPasswordPolicy` | RSAT detail | Standard. |
| `Get-ADDomain | Select MaxPasswordAge,MinPasswordLength,...` | Adjacent | Composite. |
| `dsquery * "DC=dom,DC=local" -attr maxPwdAge minPwdLength` | Legacy | Old. |
| `Get-DomainPolicy` (PowerView) | Adversary tool | Same. |
| `Get-DomainPolicyData` (PowerView v3) | Newer | Adjacent. |
| GPO Default Domain Policy | `Get-GPO -Name "Default Domain Policy"` | Adjacent. |
| GPO Settings Report | `Get-GPOReport` | Adjacent. |
| `gpresult /h policy.html` | Per-host effective | Adjacent. |
| AD attribute storage | Domain root object | LDAP. |
| `nltest /dompwd:<dom>` | Adjacent | Edge. |
| `secedit /export /cfg policy.inf` | Local export | Per-host. |
| `gpedit.msc` | GUI editor | GUI. |
| `Get-ADObject -Identity "DC=dom,DC=local" -Properties maxPwdAge` | LDAP via RSAT | Direct. |
| Forest functional level relevance | Some features | Adjacent. |
| Multi-domain: per-domain policy | Each child has own | Standard. |
^ad-pwdpol-native

### Native commands

```cmd
:: net accounts (concise)
net accounts /domain

:: Output:
:: Force user logoff how long after time expires?:       Never
:: Minimum password age (days):                          1
:: Maximum password age (days):                          42
:: Minimum password length:                              7
:: Length of password history maintained:                24
:: Lockout threshold:                                    5
:: Lockout duration (minutes):                           30
:: Lockout observation window (minutes):                 30
:: Computer role:                                        WORKSTATION
```

```powershell
# RSAT detailed
Get-ADDefaultDomainPasswordPolicy

# Output:
# ComplexityEnabled              : True
# DistinguishedName              : DC=dom,DC=local
# LockoutDuration                : 00:30:00
# LockoutObservationWindow       : 00:30:00
# LockoutThreshold               : 5
# MaxPasswordAge                 : 42.00:00:00
# MinPasswordAge                 : 1.00:00:00
# MinPasswordLength              : 8
# PasswordHistoryCount           : 24
# ReversibleEncryptionEnabled    : False
```

___

## netexec / crackmapexec

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `nxc smb DC -u u -p p --pass-pol` | Domain policy | Quick. |
| `nxc ldap DC -u u -p p --pass-pol` | LDAP variant | Same data. |
| `nxc smb DC -u '' -p '' --pass-pol` | Anonymous if allowed | Null check. |
| `crackmapexec smb DC --pass-pol` | Older name | Same. |
| Output: lockout + complexity + length + history | Standard | Comprehensive. |
| Bulk hosts | `nxc smb hosts.txt --pass-pol` | Forest-wide. |
| Per-DC variation rare | Same domain → same policy | Standard. |
| Edge: per-DC PSO override | Specific DC policy | Edge. |
| Cross-domain via different DCs | Per-domain | Adjacent. |
| Forest-wide via GC | `nxc ldap DC -p 3268 --pass-pol` | Edge. |
| Bulk for spray planning | Pre-spray check | OPSEC. |
| Authenticated typical | Most reliable | Standard. |
| Anonymous fallback | Worth testing | Standard. |
| Output to file | Standard | Reportable. |
| Verbose `-v` | Debug | Standard. |
| Combine with --users | Pre-spray prep | Workflow. |
^ad-pwdpol-netexec

### netexec quick

```bash
DC="dc01.dom.local"

# Authenticated
nxc smb $DC -u user -p pass --pass-pol

# Output:
# [+] Password policy:
#     Domain: dom.local
#     Min password length: 7
#     Min password age: 1 day(s)
#     Max password age: 42 day(s)
#     Password history length: 24
#     Lockout threshold: 5
#     Lockout duration: 30 minute(s)
#     Lockout window: 30 minute(s)
#     Password complexity: Yes

# Anonymous (legacy systems)
nxc smb $DC -u '' -p '' --pass-pol
```

___

## RPC Anonymous Discovery

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `rpcclient -U "" DC -N -c 'getdompwinfo'` | Anonymous policy | Standard. |
| `rpcclient -U user%pass DC -c 'getdompwinfo'` | Authenticated | Same. |
| `rpcclient -U "" DC -N -c 'querydominfo'` | Domain info incl. policy | Adjacent. |
| `enum4linux-ng -P DC` | Bulk anonymous | Comprehensive. |
| `enum4linux -P DC` | Legacy | Old. |
| Modern Server 2019+ | Often blocks anonymous | Hardened. |
| Legacy 2008-2012 | Often allows | Audit. |
| `samba-tool domain passwordsettings show` | Linux DC tool | Edge. |
| Output decoded | Bitfield + values | Standard. |
| Min length | Numeric | Direct. |
| Min/max age | Negative ticks (FILETIME) | Decode. |
| Lockout threshold | Numeric | Direct. |
| Lockout duration | Negative ticks | Decode. |
| Password history | Numeric | Direct. |
| Properties bitfield | Complexity, reversible, etc | Decode. |
| Detection: bulk enum | Defender SIEM | Adjacent. |
^ad-pwdpol-rpc

### rpcclient anonymous

```bash
# Anonymous getdompwinfo
rpcclient -U "" DC -N -c 'getdompwinfo'

# Output:
# min_password_length: 7
# password_properties: 0x00000001 DOMAIN_PASSWORD_COMPLEX

# Anonymous querydominfo
rpcclient -U "" DC -N -c 'querydominfo'

# Output:
# Domain:               DOM
# Server:               DC01
# Comment:              
# Total Users:          250
# Total Groups:         15
# Total Aliases:        15
# Sequence No:          12345
# Force Logoff:         -1
# Domain Server State:  0x1
# Server Role:          ROLE_DOMAIN_PDC
# Unknown 3:            0x1
```

```bash
# enum4linux-ng comprehensive
enum4linux-ng -P -A DC -oJ pwdpol.json
```

___

## LDAP Direct Query

| **Atributo** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `maxPwdAge` | Max password age (FILETIME ticks negative) | Decode required. |
| `minPwdAge` | Min password age (FILETIME ticks negative) | Adjacent. |
| `minPwdLength` | Min length integer | Direct. |
| `pwdHistoryLength` | History count | Direct. |
| `pwdProperties` | Bitfield (complexity, reversible, lockout) | Decode. |
| `lockoutThreshold` | Failed attempts before lockout | Direct. |
| `lockoutDuration` | Lockout time (FILETIME ticks negative) | Decode. |
| `lockoutObservationWindow` | Reset counter window | Decode. |
| `lockoutDuration=0` | Lock until manual unlock | Edge. |
| Stored on domain root | `DC=dom,DC=local` | LDAP location. |
| Per-domain | Each domain has own | Standard. |
| Authenticated read | Standard required | Standard. |
| Anonymous LDAP rare for these attrs | Edge | Adjacent. |
| Forest-wide query via GC | Per-domain returned separately | Standard. |
| `Get-ADRootDSE` adjacent | Edge | Adjacent. |
| FILETIME conversion | (-PwdAge / 1e7 / 86400) days | Math. |
^ad-pwdpol-ldap

### LDAP raw query

```bash
# Direct LDAP attributes
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" -s base \
  "(objectClass=*)" \
  maxPwdAge minPwdAge minPwdLength pwdHistoryLength \
  pwdProperties lockoutThreshold lockoutDuration lockoutObservationWindow

# FILETIME conversion (Python)
python3 -c "
ticks = 36288000000000  # Example value
days = abs(ticks) / 1e7 / 86400
print(f'{days} days')
"
```

```powershell
# RSAT raw
Get-ADObject -Identity "DC=dom,DC=local" -Properties maxPwdAge,minPwdAge,minPwdLength,pwdProperties,lockoutThreshold,lockoutDuration,lockoutObservationWindow

# Decode FILETIME
$root = Get-ADObject -Identity "DC=dom,DC=local" -Properties maxPwdAge,lockoutDuration
$maxAgeDays = [TimeSpan]::FromTicks(-$root.maxPwdAge).Days
$lockoutMin = [TimeSpan]::FromTicks(-$root.lockoutDuration).TotalMinutes
"$maxAgeDays days max age, $lockoutMin min lockout"
```

___

## pwdProperties Bitfield Decoded

| **Hex** | **Decimal** | **Flag** | **Significado** |
|:---:|:---:|:---:|:---:|
| 0x00000001 | 1 | DOMAIN_PASSWORD_COMPLEX | Complexity required. |
| 0x00000002 | 2 | DOMAIN_PASSWORD_NO_ANON_CHANGE | Anonymous can't change. |
| 0x00000004 | 4 | DOMAIN_PASSWORD_NO_CLEAR_CHANGE | Cleartext password change disabled. |
| 0x00000008 | 8 | DOMAIN_LOCKOUT_ADMINS | Lockout applies to admins (rare). |
| 0x00000010 | 16 | DOMAIN_PASSWORD_STORE_CLEARTEXT | Store reversibly encrypted. |
| 0x00000020 | 32 | DOMAIN_REFUSE_PASSWORD_CHANGE | Refuse change | Edge. |
| 0x00000040 | 64 | DOMAIN_PASSWORD_NO_LM_HASH | Don't store LM hash. |
| Combined | Bitwise OR | Standard | Multiple flags. |
| Default modern | 0x01 (complexity) | Standard | Standard. |
| Reversible enabled | 0x10 set | Critical | Vuln signal. |
| LM hash stored | 0x40 NOT set | Legacy concern | Hardening. |
| Audit: complexity OFF | 0x01 not set | Vuln | Critical. |
| Audit: reversible ON | 0x10 set | Critical | Vuln. |
| Audit: store cleartext | Same flag | Critical | Vuln. |
| Hardening modern | 0x01 + 0x40 | Best practice | Standard. |
| Per-PSO override | Adjacent | Adjacent. |
^ad-pwdpol-properties

### Decode pwdProperties

```python
def decode_pwd_properties(props):
    flags = []
    if props & 0x1: flags.append("COMPLEX (complexity required)")
    if props & 0x2: flags.append("NO_ANON_CHANGE")
    if props & 0x4: flags.append("NO_CLEAR_CHANGE")
    if props & 0x8: flags.append("LOCKOUT_ADMINS")
    if props & 0x10: flags.append("STORE_CLEARTEXT (REVERSIBLE - VULN)")
    if props & 0x20: flags.append("REFUSE_PASSWORD_CHANGE")
    if props & 0x40: flags.append("NO_LM_HASH")
    return flags

# Example
print(decode_pwd_properties(1))    # ['COMPLEX (complexity required)']
print(decode_pwd_properties(17))   # COMPLEX + STORE_CLEARTEXT (vuln combo)
```

___

## krbtgt Password Age

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| krbtgt account holds KDC trust password | Signs all TGTs | Critical. |
| Password rotation = invalidates Golden Tickets | Defender mitigation | Standard. |
| Recommended rotation: 180 days | Microsoft guidance | Standard. |
| Rotate twice consecutively | Replication delay | Procedure. |
| `Get-ADUser krbtgt -Properties pwdLastSet` | Direct query | Standard. |
| LDAP `pwdLastSet` on krbtgt | Direct attribute | Standard. |
| Convert FILETIME | `[datetime]::FromFileTime(...)` | Decode. |
| Stale krbtgt = persistent Golden Ticket | Critical | Adjacent. |
| Defender priority: rotate periodically | Standard | Defense. |
| Audit: krbtgt > 180 days | Risk indicator | Detection. |
| Detection: krbtgt password change events | Defender alarm | Adjacent. |
| RODC has separate krbtgt (filtered) | Edge | Standard. |
| Cross-domain krbtgt independent | Per-domain | Standard. |
| Microsoft script for rotation | TechNet | Reference. |
| Rotation impact: cached tickets invalidated | Operational | Standard. |
| Adjacent: trust account passwords | Same concept | Adjacent. |
^ad-pwdpol-krbtgt

### krbtgt age check

```powershell
# RSAT
$krbtgt = Get-ADUser krbtgt -Properties pwdLastSet
$ageDays = ((Get-Date) - [datetime]::FromFileTime($krbtgt.pwdLastSet)).Days
Write-Host "krbtgt password age: $ageDays days"

if ($ageDays -gt 180) {
  Write-Warning "krbtgt password is stale (>180 days) — Golden Ticket persistent risk"
}
```

```bash
# LDAP
ldapsearch -h DC -D 'dom\u' -w pass -b "CN=krbtgt,CN=Users,DC=dom,DC=local" \
  -s base "(objectClass=*)" pwdLastSet

# Manual conversion of FILETIME
python3 -c "
from datetime import datetime, timedelta
filetime = 132630720000000000  # example
# Windows epoch 1601 → Unix epoch 1970 = 11644473600 seconds
unix_ts = (filetime / 10000000) - 11644473600
print(datetime.fromtimestamp(unix_ts))
"
```

___

## Multi-Domain / Forest-Wide Policy Differences

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Per-domain default policy | Each child has own | Standard. |
| Forest root policy independent | Standard | Standard. |
| Cross-domain user passwords | Subject to home domain policy | Standard. |
| Stronger policy in some domains | Common | Audit. |
| Weaker policy in some domains | Spray candidate | Strategy. |
| PSO per-domain | Granular | Standard. |
| Cross-domain PSO no | Per-domain only | Standard. |
| Forest-wide audit required | Multi-query | Standard. |
| Default Domain Policy GPO | Per-domain | Adjacent. |
| Domain Controllers Policy GPO | Per-domain | Adjacent. |
| Custom GPOs override | OU-linked GPOs | Edge. |
| `Get-ADForest | foreach Domains | Get-ADDefaultDomainPasswordPolicy` | Iterate | Standard. |
| Bulk audit script | Forest-wide | Standard. |
| Migration leftover | Old policies | Audit. |
| Inconsistent policies | Risk indicator | Audit. |
| Spray strategy: target weakest domain | Pivot | Strategy. |
^ad-pwdpol-multidomain

### Forest-wide audit

```powershell
$forest = Get-ADForest
foreach ($dom in $forest.Domains) {
  Write-Host "`n=== $dom ===" -ForegroundColor Cyan
  try {
    $pol = Get-ADDefaultDomainPasswordPolicy -Identity $dom
    [PSCustomObject]@{
      Domain = $dom
      MinLength = $pol.MinPasswordLength
      Complexity = $pol.ComplexityEnabled
      LockoutThreshold = $pol.LockoutThreshold
      LockoutDuration = $pol.LockoutDuration
      MaxAge = $pol.MaxPasswordAge
      ReversibleEnc = $pol.ReversibleEncryptionEnabled
      History = $pol.PasswordHistoryCount
    }
  } catch {
    Write-Warning "Failed for $dom"
  }
}
```

***
