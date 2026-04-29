---
aliases:
  - High-Value Targets
  - Tier 0 Users
  - Privileged Accounts
  - Service Accounts
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
  - "[[BloodHound & SharpHound]]"
---
# AD - Users Enumeration - High-Value Users

***

## Privileged Group Members

| **Group** | **Tier** | **Notas** |
|:---:|:---:|:---:|
| Domain Admins | Tier 0 | Top domain priv. |
| Enterprise Admins | Tier 0 | Forest-wide priv. |
| Schema Admins | Tier 0 | Schema modification (dormant typically). |
| Administrators (Built-in) | Tier 0 | Per-host admins. |
| Account Operators | Tier 0/1 | Account management. |
| Backup Operators | Tier 0/1 | NTDS dump path. |
| Server Operators | Tier 0/1 | Logon DC + reg edit. |
| Print Operators | Tier 0/1 | Driver install (legacy RCE). |
| DnsAdmins | Tier 0/1 | DLL load via dnscmd (legacy). |
| Cert Publishers | Tier 1 | ADCS adjacent. |
| Group Policy Creator Owners | Tier 0/1 | GPO creation. |
| Exchange Trusted Subsystem | Tier 0 historically | DCSync via Exchange (legacy). |
| Exchange Windows Permissions | Tier 0 historically | Same legacy. |
| Hyper-V Administrators | Tier 1+ | Per-VM root. |
| Storage Replica Administrators | Tier 1 | Storage. |
| Pre-Windows 2000 Compatible Access | Edge legacy | Anonymous-style. |
| Read-only Domain Controllers | Tier 1 | RODC scope. |
| Cloneable Domain Controllers | Tier 0 | DC clone. |
| Allowed-To-Authenticate | Edge | Trust scope. |
| Denied RODC Password Replication | Tier 0 protection | Defense. |
^ad-hv-priv-groups

### Privileged group recursive enum

```powershell
# All Tier 0 group members (recursive)
$tier0 = "Domain Admins","Enterprise Admins","Schema Admins","Administrators",
         "Backup Operators","Account Operators","Server Operators","Print Operators",
         "DnsAdmins","Group Policy Creator Owners","Cloneable Domain Controllers"

foreach ($g in $tier0) {
  Write-Host "`n=== $g ===" -ForegroundColor Cyan
  try {
    Get-ADGroupMember -Identity $g -Recursive -ErrorAction Stop |
      Get-ADUser -Properties Description,LastLogonDate,Enabled |
      Select Name,SamAccountName,Description,LastLogonDate,Enabled
  } catch {
    Write-Host "  Group not found: $g"
  }
}
```

```bash
# netexec equivalent
for grp in "Domain Admins" "Enterprise Admins" "Administrators" "Backup Operators" "Account Operators"; do
  echo "=== $grp ==="
  nxc smb DC -u user -p pass --groups "$grp"
done
```

___

## adminCount Indicator

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `adminCount=1` | User was member of protected group | SDProp marker. |
| AdminSDHolder propagates DACL | Every 60min | Standard. |
| Protected groups (default list) | Domain Admins, Enterprise Admins, Schema Admins, Administrators, Account Operators, Backup Operators, Server Operators, Print Operators, Replicators, Domain Controllers, Read-only DCs, Cert Publishers (some env) | Tier 0/1. |
| `adminCount=0` after group removal | Manual reset (legacy) | Edge. |
| Stale `adminCount=1` users | Removed from group but flag remains | Audit candidate. |
| Detection: adminCount audit | Periodic | Defender. |
| Hardening: Protected Users group | Better defense than adminCount | Modern. |
| `adminCount` filter | LDAP `(adminCount=1)` | Direct. |
| Cross-correlation with LastLogonDate | Stale adminCount = audit | Defender. |
| Cross-correlation with PasswordNeverExpires | Risk | Audit. |
| Cross-correlation with ServicePrincipalName | Privileged service account | High-value. |
| `Get-ADUser -Filter {AdminCount -eq 1}` | RSAT direct | Standard. |
| BloodHound HighValue tag | Tier 0/1 visualization | Tool. |
| BloodHound queries on adminCount | Custom Cypher | Adjacent. |
| Removal post-pwn (cleanup) | Privesc cleanup | OPSEC. |
^ad-hv-admincount

### adminCount queries

```bash
# All users with adminCount=1
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=user)(adminCount=1))" \
  samAccountName description memberOf

# netexec
nxc ldap DC -u user -p pass --admin-count
```

```powershell
# RSAT
Get-ADUser -Filter {AdminCount -eq 1} -Properties AdminCount,Description,LastLogonDate,Enabled |
  Sort LastLogonDate -Descending

# Stale adminCount (privileged but inactive)
$stale = (Get-Date).AddDays(-180)
Get-ADUser -Filter {AdminCount -eq 1 -and LastLogonDate -lt $stale} `
  -Properties LastLogonDate
```

___

## Service Accounts

| **Indicator** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| ServicePrincipalName set | SPN-bound = service | Kerberoast target. |
| Naming pattern `svc-*`, `*-svc`, `service*` | Common | Pattern recon. |
| `Domain Computers` group membership | Computer-style accounts | Adjacent. |
| `Pre-Windows 2000` group | Legacy compat | Edge. |
| User-style account with computer SPN | Service account on host | Common. |
| Description mentions service | Free-text | Hint. |
| Long pwdLastSet (rare rotation) | Service accounts often stale pwds | Spray. |
| PasswordNeverExpires + service | Common combo | Spray candidate. |
| Member of Domain Admins | High-value privileged service | Critical. |
| Member of Backup Operators | Backup service | Privesc path. |
| `gMSA` accounts | Group-managed | Auto-rotated. |
| `MSA` accounts | Single-host managed | Edge. |
| `dMSA` accounts (2025) | New delegated MSA | Modern. |
| Service running as service account | `Get-WmiObject Win32_Service` | Per-host. |
| Service binary path | UNC paths revealing | Adjacent. |
| Custom application service | Often hardcoded weak pwds | Vuln. |
| Backup software accounts | Veeam, Veritas, Commvault | Common. |
^ad-hv-service

### Service account discovery

```powershell
# Pattern-based
Get-ADUser -Filter {SamAccountName -like "svc*" -or SamAccountName -like "*svc" -or SamAccountName -like "service*"} `
  -Properties SamAccountName,Description,ServicePrincipalName,LastLogonDate,PasswordNeverExpires |
  Select SamAccountName,Description,@{n='SPNs';e={$_.ServicePrincipalName -join '; '}},LastLogonDate,PasswordNeverExpires

# All SPN-bound users (Kerberoast targets)
Get-ADUser -Filter {ServicePrincipalName -like "*"} `
  -Properties ServicePrincipalName,MemberOf |
  Select Name,SamAccountName,@{n='SPNs';e={$_.ServicePrincipalName -join '; '}},MemberOf

# Privileged service accounts
Get-ADUser -Filter {ServicePrincipalName -like "*" -and AdminCount -eq 1} `
  -Properties ServicePrincipalName,AdminCount,MemberOf
```

___

## Delegation Targets

| **Type** | **Filter** | **Notas** |
|:---:|:---:|:---:|
| Unconstrained delegation users | UAC TRUSTED_FOR_DELEGATION (524288) | Critical compromise target. |
| Constrained delegation users | `msDS-AllowedToDelegateTo` set | Privileged. |
| Constrained w/protocol transition | UAC TRUSTED_TO_AUTH (16777216) | More permissive. |
| RBCD-configured users (rare on users) | `msDS-AllowedToActOnBehalfOfOtherIdentity` | Atypical. |
| `Account is sensitive and cannot be delegated` UAC | Defender flag | Hardening. |
| Tier 0 should have NOT_DELEGATED | UAC bit | Hardening. |
| Service accounts often delegated | Standard | Adjacent. |
| Cross-trust delegation | Edge — modern restricted | Adjacent. |
| BloodHound delegation edges | Visual | Tool. |
| Critical: DA in delegation chain | Direct path | Critical. |
| Per-target service delegation | Granular | Standard. |
| Modern: protocol transition discouraged | Defense | Hardening. |
| Audit: delegation creation events | Defender | Adjacent. |
| Per-OU delegation policy | Granular control | Standard. |
| Removal cleanup post-attack | OPSEC | Hygiene. |
| Cross-correlate with privileged group | Highest value | Strategy. |
^ad-hv-delegation

### Delegation enumeration

```bash
# Unconstrained delegation (CRITICAL targets)
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=524288))" \
  samAccountName memberOf

# Constrained delegation
ldapsearch ... "(&(objectCategory=user)(msDS-AllowedToDelegateTo=*))" \
  samAccountName msDS-AllowedToDelegateTo userAccountControl

# netexec
nxc ldap DC -u user -p pass --trusted-for-delegation
```

___

## sIDHistory Users (Migration Leftover)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `sIDHistory` attribute | Stores prior domain SIDs | LDAP. |
| Purpose: domain migration | User retains old access | Standard. |
| Cross-trust + sIDHistory abuse | Forest takeover via SID History injection | Critical. |
| Without SID Filtering | Foreign SIDs accepted | Vulnerability. |
| With SID Filtering | Foreign SIDs dropped | Defense. |
| Migration tool ADMT sets sIDHistory | Standard practice | Common. |
| Suspicious if non-migration user has sIDHistory | Investigate | Detection. |
| Cleanup post-migration | Should be removed | Hygiene. |
| Audit users with sIDHistory | Compliance | Standard. |
| BloodHound HasSIDHistory edge | Visual | Tool. |
| Cross-forest sIDHistory abuse | Specific attack | Adjacent. |
| Forest root migrations | Critical risk | Audit. |
| Privileged sIDHistory entries | Highest value | Strategy. |
| LDAP query | `(sIDHistory=*)` | Direct. |
| Resolve foreign SIDs | Cross-domain LDAP | Adjacent. |
| Defender alert on sIDHistory modify | Standard | Defender. |
^ad-hv-sidhistory

### sIDHistory enum

```bash
# Users with SID History
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=user)(sIDHistory=*))" \
  samAccountName sIDHistory

# Resolve foreign SIDs (if domain reachable)
# Per-SID Translate via .NET
```

```powershell
# RSAT
Get-ADUser -Filter * -Properties sIDHistory |
  Where {$_.sIDHistory} |
  Select Name,SamAccountName,sIDHistory
```

___

## gMSA / MSA / dMSA

| **Type** | **Class** | **Notas** |
|:---:|:---:|:---:|
| gMSA (Group Managed Service Account) | `msDS-GroupManagedServiceAccount` | Multi-host service. |
| MSA (Managed Service Account) | `msDS-ManagedServiceAccount` | Single-host. |
| dMSA (delegated MSA, Server 2025) | `msDS-DelegatedManagedServiceAccount` | Modern. |
| Auto-rotated password | Default 30 days | No manual mgmt. |
| Password readable by authorized | `msDS-GroupMSAMembership` | DACL controls. |
| Password decoded with KDS root key | Crypto required | Authority. |
| `gMSADumper.py` extracts cleartext NT hash | Privileged read | Tool. |
| `nxc ldap DC --gmsa` | Bulk dump | Quick. |
| KDS Root Key | `Get-KdsRootKey` (privileged) | Required. |
| SPN-bound typically | Kerberoast adjacent | Common. |
| Privilege analysis | Often in privileged groups | Audit. |
| `msDS-ManagedPasswordInterval` | Rotation period | Custom. |
| User-context vs computer-context | Standard | Standard. |
| Persistence via gMSA hash | If readable, persistent | Backdoor. |
| Removal cleanup | Standard | Hygiene. |
| Modern hardening: restrict gMSA password readers | Defense | Adjacent. |
^ad-hv-gmsa

### gMSA enumeration

```bash
# All gMSA accounts
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(objectClass=msDS-GroupManagedServiceAccount)" \
  samAccountName servicePrincipalName memberOf

# Bulk dump cleartext NT hash (if authorized)
git clone https://github.com/micahvandeusen/gMSADumper
python3 gMSADumper.py -u user -p pass -d dom.local

# Output:
# gMSA name + NT hash + Kerberos keys

# netexec
nxc ldap DC -u user -p pass --gmsa
```

```powershell
# RSAT
Get-ADServiceAccount -Filter * -Properties *
```

***
