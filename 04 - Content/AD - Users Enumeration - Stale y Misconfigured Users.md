---
aliases:
  - Stale Users
  - PASSWD_NOTREQD
  - DONT_EXPIRE_PASSWORD
  - Reversible Encryption
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
  - "[[AD - Users Enumeration]]"
---
# AD - Users Enumeration - Stale & Misconfigured Users

***

## Stale Accounts (Inactive Users)

| **Indicator** | **Filter** | **Notas** |
|:---:|:---:|:---:|
| `LastLogonDate < 90 days` | Inactive 3 months | Audit candidate. |
| `LastLogonDate < 180 days` | Inactive 6 months | Spray candidate. |
| `LastLogonDate < 1 year` | Likely abandoned | High-risk candidate. |
| Never logged in (LastLogonDate null) | Created but unused | Pre-positioning candidate. |
| `Enabled=true` + stale | Active but unused | Risk. |
| Disabled but in priv group | Re-enable risk | Audit. |
| Stale + sIDHistory | Migration leftover | Audit. |
| Stale service account | Forgotten — often weak pwd | High-value. |
| Stale + AdminCount=1 | Tier 0 abandoned | Critical. |
| `pwdLastSet > 5 years` | Stale password | Spray candidate. |
| `pwdLastSet > 1 year` + admin | Privileged stale pwd | High-risk. |
| `BadPasswordCount` history | Spray attempts | Detection. |
| `LastBadPasswordAttempt` recent | Active brute | Detection. |
| `accountExpires` past + still enabled | Bug | Edge. |
| Disabled then re-enabled pattern | Possible attacker | Defender. |
| New account in priv group + recent creation | Possible attacker plant | Defender. |
^ad-misc-stale

### Stale audit queries

```powershell
# Stale > 180 days
$stale = (Get-Date).AddDays(-180)
Get-ADUser -Filter {LastLogonDate -lt $stale -and Enabled -eq $true} `
  -Properties LastLogonDate,PasswordLastSet,AdminCount |
  Sort LastLogonDate

# Privileged + stale (CRITICAL)
Get-ADUser -Filter {LastLogonDate -lt $stale -and AdminCount -eq 1} `
  -Properties LastLogonDate,Description

# Never-logged-in
Get-ADUser -Filter {LastLogonDate -notlike "*"} `
  -Properties LastLogonDate,Description |
  Where {-not $_.LastLogonDate}

# Stale password (>1 year)
$pwdStale = (Get-Date).AddDays(-365)
Get-ADUser -Filter {PasswordLastSet -lt $pwdStale} `
  -Properties PasswordLastSet,LastLogonDate
```

```bash
# LDAP raw (stale via lastLogonTimestamp)
# Note: lastLogonTimestamp uses Windows FILETIME format
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=user)(lastLogonTimestamp<=132630720000000000))" \
  samAccountName lastLogonTimestamp
# Adjust FILETIME for desired date
```

___

## PASSWD_NOTREQD (No Password Required)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| UAC flag 0x20 (32) | PASSWD_NOTREQD | Bitfield. |
| Account allows empty password | Direct login as user | Trivial vuln. |
| Common in legacy migrations | Leftover from 2003-style | Audit. |
| Service account misconfig | Atypical | Investigate. |
| `nxc ldap DC --password-not-required` | netexec wrapper | Quick. |
| Auth attempt with empty pwd | Test directly | Validation. |
| `runas /user:dom\victim cmd` (empty pwd) | Native test | Direct. |
| Password reset to empty | Possible if PASSWD_NOTREQD | Edge. |
| Detection: PASSWD_NOTREQD audit | Periodic | Defender. |
| Hardening: remove flag | GPO or per-user | Defense. |
| Cross-correlate with priv group | High-value if both | Critical. |
| LAPS-managed accounts (some) | False positive | Edge. |
| Built-in Guest account | Often has flag set | Standard. |
| Trust accounts | Sometimes have flag | Standard. |
| Computer accounts | Often have flag | Standard. |
| Filter user accounts only | Better signal | Refine. |
^ad-misc-passwdnotreqd

### PASSWD_NOTREQD discovery

```bash
# LDAP filter (PASSWD_NOTREQD = 32)
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=user)(!(objectClass=computer))(userAccountControl:1.2.840.113556.1.4.803:=32))" \
  samAccountName description userAccountControl

# netexec
nxc ldap DC -u user -p pass --password-not-required
```

```powershell
# RSAT
Get-ADUser -Filter {PasswordNotRequired -eq $true -and Enabled -eq $true} `
  -Properties PasswordNotRequired,Description,LastLogonDate

# Test direct login (verify vulnerability)
$cred = New-Object System.Management.Automation.PSCredential ('dom\victim', (New-Object System.Security.SecureString))
Get-ADDomainController -Credential $cred
```

___

## DONT_EXPIRE_PASSWORD (Password Never Expires)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| UAC flag 0x10000 (65536) | DONT_EXPIRE_PASSWORD | Bitfield. |
| Common: service accounts | Standard | Audit. |
| Common: privileged users | Risky | Investigate. |
| Stale pwd + never expires | Vuln combination | Spray candidate. |
| `Get-ADUser -Filter {PasswordNeverExpires -eq $true}` | RSAT | Standard. |
| GPO control | Force expiration via GPO | Hardening. |
| Per-user manual setting | Common operator action | Standard. |
| Cross-correlate with adminCount | Privileged + stale | Critical. |
| Cross-correlate with SPN | Service account + never expires | Common. |
| Detection: change events | Defender | Adjacent. |
| Compliance issue (PCI-DSS, HIPAA) | Often regulatory violation | Audit. |
| FineGrainedPasswordPolicy override | PSO can override | Adjacent. |
| Detection: bulk DONT_EXPIRE_PASSWORD adds | Anomaly | Defender. |
| Per-OU GPO password policy | Granular | Standard. |
| Privileged Users group should expire | Hardening | Defense. |
| Old "Pa$$w0rd1" pattern + never expires | Spray hit candidate | Common. |
^ad-misc-dontexpire

### DONT_EXPIRE_PASSWORD discovery

```bash
# LDAP filter (DONT_EXPIRE_PASSWORD = 65536)
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=user)(!(objectClass=computer))(userAccountControl:1.2.840.113556.1.4.803:=65536))" \
  samAccountName description pwdLastSet
```

```powershell
# RSAT all PasswordNeverExpires accounts
Get-ADUser -Filter {PasswordNeverExpires -eq $true -and Enabled -eq $true} `
  -Properties PasswordNeverExpires,Description,PasswordLastSet,LastLogonDate |
  Select Name,SamAccountName,PasswordLastSet,LastLogonDate,Description

# Cross-correlate with admin
Get-ADUser -Filter {PasswordNeverExpires -eq $true -and AdminCount -eq 1} `
  -Properties PasswordLastSet,Description
```

___

## ENCRYPTED_TEXT_PWD_ALLOWED (Reversible Encryption)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| UAC flag 0x80 (128) | ENCRYPTED_TEXT_PWD_ALLOWED | Bitfield. |
| Password stored in reversibly-encrypted form | Recoverable as cleartext | Critical vuln. |
| Why exists: legacy CHAP/Digest auth | Ancient compat | Edge. |
| DCSync recovers cleartext | Direct via secretsdump | Critical. |
| `secretsdump -just-dc-user user` | Privileged dump | Direct. |
| Output includes "CLEARTEXT_PASSWORD:..." | If reversible | Standard. |
| LDAP filter | UAC bit 128 | Direct. |
| Modern: should be 0 | Hardening default | Standard. |
| Detection: any user with this flag | Anomaly | Defender. |
| Per-domain default off | Standard | Default. |
| GPO can enforce | Hardening | Defense. |
| Apps requiring this: rare | Legacy auth protocols | Edge. |
| Privileged user with reversible | Critical risk | Audit. |
| FineGrainedPasswordPolicy override | PSO can set | Adjacent. |
| Removal cleanup | Standard hygiene | Defense. |
| Cross-correlate with adminCount | Critical risk if both | Strategy. |
^ad-misc-reversible

### Reversible encryption discovery

```bash
# LDAP filter (ENCRYPTED_TEXT_PWD_ALLOWED = 128)
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=user)(!(objectClass=computer))(userAccountControl:1.2.840.113556.1.4.803:=128))" \
  samAccountName description

# DCSync to recover cleartext (privileged required)
impacket-secretsdump dom.local/admin:pass@DC -just-dc-user victim

# Output:
# victim:CLEARTEXT_PASSWORD:hereistheactualpassword
# (only if ENCRYPTED_TEXT_PWD_ALLOWED was set)
```

___

## Description / Comment Field Leakage

| **Pattern** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| `description` contains password | Common leak | Critical find. |
| `comment` contains password | Same | Common. |
| `info` contains password | Same | Edge. |
| Specific keywords: pass, secret, key, cred | Filter | Standard. |
| Default password in description | Service account onboarding | Common. |
| "Password reset to: X" | Recovery note left | Common. |
| Encoded/encrypted password attempts | base64, ROT13 | Look for. |
| Free-text fields rarely audited | Defender gap | Common. |
| Authenticated Users read description | Default | Permissive. |
| Cross-correlate with priv group | Critical if both | Strategy. |
| Email + password combo | Combined credential | Edge. |
| URLs in description | API docs, internal services | OSINT. |
| Server hostnames | Internal infra | Adjacent. |
| Migration notes | Source domain reveal | Edge. |
| HR notes | Personal info | Privacy. |
| Phone numbers | OSINT | Edge. |
^ad-misc-description

### Description audit

```bash
# All users with non-empty description
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=user)(description=*))" \
  samAccountName description

# Specific keyword search
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=user)(|(description=*pass*)(description=*cred*)(description=*secret*)(description=*key*)(comment=*pass*)))" \
  samAccountName description comment
```

```powershell
# RSAT free-text scan
Get-ADUser -Filter * -Properties Description,Comment,Info |
  Where {
    $_.Description -match "pass|secret|key|cred|pwd" -or
    $_.Comment -match "pass|secret|key|cred" -or
    $_.Info -match "pass|secret|key|cred"
  } | Select Name,SamAccountName,Description,Comment,Info
```

___

## Other Misconfig Patterns

| **Misconfig** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| `User cannot change password` | Lock-out scenarios | Edge. |
| `Smart card required` for non-priv | Misconfig | Edge. |
| Multiple SPNs on user | Possible attacker plant | Defender. |
| Recent SPN add | Targeted Kerberoast | Suspicious. |
| Recent KeyCredentialLink | Shadow Credentials abuse | Suspicious. |
| sIDHistory on non-migrated user | Anomaly | Investigate. |
| TRUSTED_FOR_DELEGATION on user | Risky | Investigate. |
| User in Pre-Windows 2000 group | Legacy compat | Edge. |
| User with mailbox = Exchange-attacked? | Common privilege escalation | Adjacent. |
| Duplicate SamAccountName | Bug | Edge. |
| Special characters in name | Edge | Edge. |
| Account never disabled but inactive | Audit | Common. |
| User without primary group | Edge | Edge. |
| User with primary group != 513 | Tier indicator | Edge. |
| Computers in user containers | Misclassification | Edge. |
| Hidden/system users | Special handling | Edge. |
^ad-misc-others

### Misc misconfig audit

```powershell
# Multiple SPNs (suspicious for users)
Get-ADUser -Filter * -Properties ServicePrincipalName |
  Where {$_.ServicePrincipalName.Count -gt 3} |
  Select Name,SamAccountName,@{n='SPNCount';e={$_.ServicePrincipalName.Count}},ServicePrincipalName

# Recent attribute changes (auditable changes window)
$recent = (Get-Date).AddDays(-30)
Get-ADUser -Filter * -Properties whenChanged |
  Where {$_.whenChanged -gt $recent} |
  Select Name,SamAccountName,whenChanged |
  Sort whenChanged -Descending

# Users with KeyCredentialLink (Shadow Credentials marker)
Get-ADUser -Filter * -Properties msDS-KeyCredentialLink |
  Where {$_."msDS-KeyCredentialLink"} |
  Select Name,SamAccountName

# Users with sIDHistory
Get-ADUser -Filter * -Properties sIDHistory |
  Where {$_.sIDHistory} |
  Select Name,SamAccountName,sIDHistory
```

***
