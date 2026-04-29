---
aliases:
  - User Attributes
  - UAC Flags Decoded
  - userAccountControl Bitfield
  - User Properties
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
# AD - Users Enumeration - User Attributes & UAC Flags

***

## Critical User Attributes

| **Atributo** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `samAccountName` | Login name (legacy) | Standard ID. |
| `userPrincipalName` (UPN) | `user@dom.local` | Modern format. |
| `sAMAccountType` | Object type numeric (805306368 = user) | Filter. |
| `objectSid` | SID | RID extraction. |
| `objectGUID` | Unique identifier | Persistent. |
| `cn` (Common Name) | Display name typically | Adjacent. |
| `displayName` | UI display | Adjacent. |
| `givenName` | First name | OSINT clue. |
| `sn` | Surname | OSINT clue. |
| `mail` | Email | Phishing prep. |
| `mailNickname` | Email alias | Edge. |
| `description` | Free-text — passwords leak frecuentemente | Always check. |
| `comment` | Alt free-text | Check too. |
| `info` | Notes field | Sometimes used. |
| `title` | Job title | OSINT. |
| `department` | Department | OSINT. |
| `company` | Company | OSINT. |
| `manager` | Manager DN | Org chart hint. |
| `homeDirectory` | UNC path | SMB asset. |
| `homeDrive` | Mapped drive | Adjacent. |
| `scriptPath` | Logon script | Scriptable. |
| `profilePath` | Roaming profile | Edge. |
| `pwdLastSet` | Last password change | Stale check. |
| `lastLogonTimestamp` | Last logon (replicated, ~14d delay) | Activity. |
| `lastLogon` | Last logon (per-DC, real-time) | Per-DC. |
| `accountExpires` | Expiration | Adjacent. |
| `whenCreated` / `whenChanged` | Lifecycle | Audit. |
| `userAccountControl` | UAC flags bitfield | Critical. |
| `memberOf` | Direct group membership | Privilege. |
| `tokenGroups` | Transitive group membership | Recursive. |
| `servicePrincipalName` | SPNs | Kerberoast. |
| `msDS-AllowedToDelegateTo` | Constrained delegation | Critical. |
| `msDS-AllowedToActOnBehalfOfOtherIdentity` | RBCD | Critical. |
| `msDS-KeyCredentialLink` | Shadow Credentials | NgC abuse. |
^ad-attrs-critical

### Attribute query templates

```bash
# Concise critical attrs
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=user)(!(objectClass=computer)))" \
  samAccountName userPrincipalName description \
  pwdLastSet lastLogonTimestamp userAccountControl \
  memberOf servicePrincipalName \
  msDS-AllowedToDelegateTo

# Free-text fields (description leakage)
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=user)(|(description=*pass*)(description=*Pass*)(comment=*pass*)))" \
  samAccountName description comment
```

```powershell
# RSAT
Get-ADUser -Filter * -Properties Description,Comment,Info,Title,Department,Company,Manager |
  Where {$_.Description -match "pass" -or $_.Comment -match "pass"} |
  Select Name,SamAccountName,Description,Comment,Info,Title
```

___

## userAccountControl (UAC) Flags Decoded

| **Hex** | **Decimal** | **Flag** | **Significado** |
|:---:|:---:|:---:|:---:|
| 0x00000001 | 1 | SCRIPT | Logon script run. |
| 0x00000002 | 2 | ACCOUNTDISABLE | Account disabled. |
| 0x00000008 | 8 | HOMEDIR_REQUIRED | Home dir required. |
| 0x00000010 | 16 | LOCKOUT | Account locked. |
| 0x00000020 | 32 | PASSWD_NOTREQD | **Password not required** (vuln). |
| 0x00000040 | 64 | PASSWD_CANT_CHANGE | User can't change pwd. |
| 0x00000080 | 128 | ENCRYPTED_TEXT_PWD_ALLOWED | **Reversible encryption** (DCSync recoverable). |
| 0x00000100 | 256 | TEMP_DUPLICATE_ACCOUNT | Local user from another domain. |
| 0x00000200 | 512 | NORMAL_ACCOUNT | Default user account. |
| 0x00000800 | 2048 | INTERDOMAIN_TRUST_ACCOUNT | Trust account. |
| 0x00001000 | 4096 | WORKSTATION_TRUST_ACCOUNT | Computer account. |
| 0x00002000 | 8192 | SERVER_TRUST_ACCOUNT | DC account. |
| 0x00010000 | 65536 | DONT_EXPIRE_PASSWORD | **Password never expires**. |
| 0x00020000 | 131072 | MNS_LOGON_ACCOUNT | MNS logon account. |
| 0x00040000 | 262144 | SMARTCARD_REQUIRED | Smartcard required. |
| 0x00080000 | 524288 | TRUSTED_FOR_DELEGATION | **Unconstrained delegation** (CRITICAL). |
| 0x00100000 | 1048576 | NOT_DELEGATED | Cannot be delegated. |
| 0x00200000 | 2097152 | USE_DES_KEY_ONLY | DES only. |
| 0x00400000 | 4194304 | DONT_REQ_PREAUTH | **AS-REP roastable** (CRITICAL). |
| 0x00800000 | 8388608 | PASSWORD_EXPIRED | Password expired. |
| 0x01000000 | 16777216 | TRUSTED_TO_AUTH_FOR_DELEGATION | **Constrained delegation w/protocol transition**. |
^ad-attrs-uac

### UAC bitwise queries

```bash
# AS-REP roastable (DONT_REQ_PREAUTH = 4194304)
ldapsearch ... "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304))" samAccountName

# Unconstrained delegation users (TRUSTED_FOR_DELEGATION = 524288)
ldapsearch ... "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=524288))" samAccountName

# Password not required (PASSWD_NOTREQD = 32)
ldapsearch ... "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=32))" samAccountName

# Password never expires (DONT_EXPIRE_PASSWORD = 65536)
ldapsearch ... "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=65536))" samAccountName

# Reversible encryption (ENCRYPTED_TEXT_PWD_ALLOWED = 128)
ldapsearch ... "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=128))" samAccountName

# Disabled accounts
ldapsearch ... "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=2))" samAccountName
```

___

## SPN (servicePrincipalName) Attribute

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| SPN format | `service/host:port` | Standard. |
| Common SPN classes | HTTP, MSSQLSvc, CIFS, host, RestrictedKrbHost | Common. |
| MSSQLSvc | SQL Server | Kerberoast target. |
| HTTP/host | Web servers | Kerberoast target. |
| LDAP/host | Domain controller | Standard. |
| RestrictedKrbHost | Generic | Standard. |
| User SPN = service account | User-style account with SPN | Kerberoastable. |
| `setspn -L <user>` | List user's SPNs | Native. |
| `setspn -Q */*` | Query all SPNs | Native. |
| `setspn -T <dom> -Q */*` | Cross-domain | Adjacent. |
| Multiple SPNs per user | Comma-separated values | Standard. |
| SPN duplicate check | `setspn -X` | Detection. |
| Self-targeted Kerberoast | Force SPN onto target user | ACL combo. |
| LDAP filter for SPN-bound | `(servicePrincipalName=*)` | Bitwise. |
| Service account naming | `svc-*`, `*-svc`, `service-*` | Pattern. |
| Computer SPNs | Hostname-based | Adjacent. |
^ad-attrs-spn

### SPN enumeration

```bash
# All user SPNs (Kerberoast targets)
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=user)(servicePrincipalName=*))" \
  samAccountName servicePrincipalName

# Specific service type
ldapsearch ... "(&(objectCategory=user)(servicePrincipalName=MSSQLSvc/*))" \
  samAccountName servicePrincipalName

# netexec wrapper
nxc ldap DC -u user -p pass --kerberoasting kerb.txt
```

```powershell
# RSAT
Get-ADUser -Filter {ServicePrincipalName -like "*"} -Properties ServicePrincipalName |
  Select Name,SamAccountName,@{n='SPNs';e={$_.ServicePrincipalName -join '; '}}

# PowerView
Get-DomainUser -SPN | Select Name,ServicePrincipalName
```

___

## Delegation Attributes

| **Atributo** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `userAccountControl & 0x80000` | Unconstrained delegation flag | UAC. |
| `userAccountControl & 0x1000000` | Constrained delegation w/protocol transition | UAC. |
| `msDS-AllowedToDelegateTo` | Constrained delegation target services | LDAP. |
| `msDS-AllowedToActOnBehalfOfOtherIdentity` | RBCD configured | Computer attr typically. |
| `msDS-DelegationConfig` | Edge | Adjacent. |
| `Account is sensitive and cannot be delegated` | Defender flag | UAC bit. |
| `Account is trusted for delegation` | UAC checkbox | UAC bit. |
| `Trust this user for delegation to specified services only` | Constrained | GUI label. |
| `Use Kerberos only` | No protocol transition | Stricter constrained. |
| `Use any authentication protocol` | Protocol transition allowed | More permissive. |
| RBCD on user (rare) | Atypical | Edge. |
| RBCD on computer (common) | Standard | Standard. |
| Detection: delegation enable events | Defender | Adjacent. |
| Tier 0 should have NOT_DELEGATED set | UAC bit | Hardening. |
| Service accounts often have constrained delegation | Common | Standard. |
| BloodHound delegation edges | Visual | Tool. |
^ad-attrs-delegation

### Delegation queries

```bash
# Unconstrained delegation users
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=524288))" \
  samAccountName memberOf

# Constrained delegation users
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=user)(msDS-AllowedToDelegateTo=*))" \
  samAccountName msDS-AllowedToDelegateTo userAccountControl

# Protocol transition users (any auth protocol)
ldapsearch ... "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=16777216))" \
  samAccountName msDS-AllowedToDelegateTo
```

___

## Shadow Credentials (msDS-KeyCredentialLink)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `msDS-KeyCredentialLink` attribute | NgC public key entries | Modern auth. |
| NgC = Next-Generation Credentials | PKI-based AD auth | Standard. |
| Shadow Credentials abuse | Add own cert to victim → auth as victim | Privilege. |
| Required permission | GenericAll, GenericWrite, or specific WriteProperty | ACL combo. |
| `certipy shadow auto` | Automated abuse | Tool. |
| Stealthier than ForceChangePassword | No pwd change | OPSEC. |
| Multiple keys allowed | Multi-cert per user | Edge. |
| Per-user setting | Granular | Standard. |
| Detection: 4742 (computer change) or 4738 (user change) | Defender events | Adjacent. |
| Modern Windows 10/11 + Server 2016+ | Required for NgC | Compatibility. |
| Adjacent: Windows Hello for Business | NgC backbone | Modern. |
| Adjacent: TPM key-based auth | NgC | Modern. |
| Audit users with KeyCred set | Anomaly detection | Defender. |
| Restrict KeyCred write permission | Hardening | Defense. |
| Removal post-attack | Cleanup | OPSEC. |
| Detection: AS-REQ with PKINIT extra cert | Anomaly | Defender. |
^ad-attrs-shadowcreds

### Shadow Credentials enumeration

```bash
# Users with KeyCredentialLink set
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=user)(msDS-KeyCredentialLink=*))" \
  samAccountName

# certipy abuse (privileged)
certipy shadow auto -u user -p pass -account victim -dc-ip DC

# Audit existing entries
Get-ADObject "CN=victim,CN=Users,DC=dom,DC=local" -Properties msDS-KeyCredentialLink
```

___

## Detection Patterns

| **Atributo** | **Anomaly Indicator** | **Notas** |
|:---:|:---:|:---:|
| Description contains password | Common leak | Free-text audit. |
| pwdLastSet very old (>5y) | Stale | Spray candidate. |
| Recently created admin user | Possible attacker creation | Detection. |
| User in Tier 0 OU but recent creation | Anomaly | Investigate. |
| servicePrincipalName recently added | Targeted Kerberoast | Suspicious. |
| msDS-KeyCredentialLink recently set | Shadow Credentials | Suspicious. |
| sIDHistory on non-migrated user | Edge | Investigate. |
| TRUSTED_FOR_DELEGATION on non-DC | Risky | Investigate. |
| DONT_REQ_PREAUTH | Default disabled | Vuln if set. |
| Multiple userAccountControl flag changes | History audit | Defender. |
| Account enabled then disabled | Honeytoken pattern | Edge. |
| logonCount = 0 | Never used | Audit. |
| BadPasswordCount high | Brute target signal | Adjacent. |
| LastBadPasswordAttempt recent | Active brute attempt | Detection. |
| AccountExpires past + still enabled | Edge bug | Adjacent. |
| Foreign sIDHistory | Cross-trust migration | Audit. |
^ad-attrs-detection

### Anomaly detection queries

```powershell
# Recently created admin users
$recent = (Get-Date).AddDays(-30)
Get-ADUser -Filter {AdminCount -eq 1 -and whenCreated -gt $recent} `
  -Properties whenCreated,AdminCount

# Users with description containing "pass" (case-insensitive)
Get-ADUser -Filter * -Properties Description |
  Where {$_.Description -match "pass|secret|key|cred"} |
  Select Name,SamAccountName,Description

# Suspicious UAC combinations
Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true -and AdminCount -eq 1} `
  -Properties UserAccountControl,AdminCount

# Stale users in privileged groups
$stale = (Get-Date).AddDays(-180)
Get-ADGroupMember "Domain Admins" -Recursive |
  Get-ADUser -Properties LastLogonDate,PasswordLastSet |
  Where {$_.LastLogonDate -lt $stale -or -not $_.LastLogonDate}
```

***
