---
aliases:
  - LAPS Bulk Read
  - Get-AdmPwdPassword
  - Get-LapsADPassword
  - LAPS Decrypt
tags:
  - type/cheatsheet
  - vuln/ad-enumeration
  - technique/credential-access
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[AD - LAPS Enumeration]]"
---
# AD - LAPS Enumeration - LAPS Read & Decryption

***

## Bulk Read with netexec

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `nxc smb hosts.txt -u u -p p --laps` | Bulk LAPS read | Standard. |
| `nxc ldap DC -u u -p p --laps` | LDAP variant | Adjacent. |
| `crackmapexec smb hosts -u u -p p --laps` | Older name | Same. |
| Output: per-host password if readable | Standard | Standard. |
| Failed reads = ACL denied | Per-host | Standard. |
| Bulk via subnet | `nxc smb 10.0.0.0/24 --laps` | Sweep. |
| Cross-OU iteration | Manual loop | Standard. |
| Supports both LAPSv1 + LAPSv2 | Modern | Standard. |
| Decrypts LAPSv2 if authorized | Auto | Standard. |
| Output to file | Standard | Reportable. |
| `--continue-on-success` | Multi-host | Standard. |
| Verbose `-v` | Debug | Standard. |
| Per-host parallel | Performance | Standard. |
| Detection: bulk reads | Defender | Adjacent. |
| OPSEC: per-host vs bulk | Trade-off | Standard. |
| Combined with --shares | Lateral prep | Workflow. |
^ad-lapsread-netexec

### netexec bulk LAPS

```bash
# All computers in domain
nxc ldap DC -u user -p pass --computers > computers.txt

# Bulk LAPS read
nxc smb computers.txt -u user -p pass --laps

# Output format:
# SMB         10.0.0.50  445  WS01  [+] Found ms-Mcs-AdmPwd: a8B3#k$pQv2!nM7@xL
# SMB         10.0.0.60  445  WS02  [+] Found msLAPS-Password: r4S9!mN1@xL2#kP
# SMB         10.0.0.70  445  DC01  [-] msLAPS-Password not set or denied

# Combined: read + foothold test
nxc smb computers.txt -u user -p pass --laps --shares --sessions
```

___

## Single Host Read (PowerShell)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-AdmPwdPassword -ComputerName host` | LAPSv1 native module | Standard. |
| `Get-LapsADPassword -Identity host` | LAPSv2 native module | Modern. |
| `Get-LapsADPassword -Identity host -AsPlainText` | LAPSv2 cleartext | Standard. |
| `Get-LapsADPassword -Identity host -Domain dom` | Cross-domain | Adjacent. |
| `Get-LapsADPassword -Identity host -Source AD` | Force AD source | Standard. |
| `Get-LapsADPassword -Identity host -Source AAD` | Azure AD source | Hybrid. |
| `Get-LapsAADPassword` | Azure AD-only | Modern. |
| Native module install | Server 2022+ / Win11 | Standard. |
| Decrypts LAPSv2 if authorized | Auto | Standard. |
| Failed read: error message | Per-host | Standard. |
| Output: ComputerName + Password + Expiration | Standard | Standard. |
| Cross-correlate with priv | Cross-tier audit | Standard. |
| Bulk via foreach | Standard | Adjacent. |
| Detection: per-host audit | Defender | Adjacent. |
| Audit: who reads what | Standard | Compliance. |
| Modern: native PS module preferred | Standard | Standard. |
^ad-lapsread-pwsh

### PowerShell LAPS read

```powershell
# LAPSv1 (legacy)
Get-AdmPwdPassword -ComputerName WS01

# LAPSv2 (modern)
Get-LapsADPassword -Identity WS01

# LAPSv2 cleartext
(Get-LapsADPassword -Identity WS01 -AsPlainText).Password

# Bulk all computers
Get-ADComputer -Filter * | ForEach-Object {
  $name = $_.Name
  try {
    $pwd = Get-LapsADPassword -Identity $name -AsPlainText -ErrorAction SilentlyContinue
    if ($pwd) {
      [PSCustomObject]@{
        Computer = $name
        Password = $pwd.Password
        Expiration = $pwd.ExpirationTimestamp
        Source = $pwd.Source
      }
    }
  } catch {}
}
```

___

## LDAP Direct Read

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-ADComputer host -Properties ms-Mcs-AdmPwd` | LAPSv1 RSAT | Standard. |
| `Get-ADComputer host -Properties msLAPS-Password` | LAPSv2 cleartext | Standard. |
| `Get-ADComputer host -Properties msLAPS-EncryptedPassword` | LAPSv2 encrypted blob | Standard. |
| `ldapsearch ... cn=host ms-Mcs-AdmPwd` | Linux LDAP | Standard. |
| `ldapsearch ... cn=host msLAPS-Password` | LDAP modern | Standard. |
| Encrypted blob without key | Useless | Standard. |
| Bulk LDAP query | Standard | Standard. |
| Filter: `(ms-Mcs-AdmPwd=*)` | Computers with LAPSv1 set | Filter. |
| Filter: `(msLAPS-Password=*)` | LAPSv2 cleartext | Filter. |
| Filter: `(msLAPS-EncryptedPassword=*)` | LAPSv2 encrypted | Filter. |
| Cross-domain via GC port | `-p 3268` | Edge. |
| Authenticated typical | Standard | Standard. |
| Per-attribute ACL | Granular | Standard. |
| Per-OU iteration | Standard | Standard. |
| Detection: bulk LDAP queries on LAPS attrs | Defender | Adjacent. |
| Modern: encrypted blob via Get-LapsADPassword | Decrypt automatic | Standard. |
^ad-lapsread-ldap

### LDAP direct read

```bash
# LAPSv1
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=computer)(ms-Mcs-AdmPwd=*))" \
  cn dNSHostName ms-Mcs-AdmPwd

# LAPSv2 cleartext
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=computer)(msLAPS-Password=*))" \
  cn dNSHostName msLAPS-Password

# LAPSv2 encrypted (need to decrypt separately)
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=computer)(msLAPS-EncryptedPassword=*))" \
  cn dNSHostName msLAPS-EncryptedPassword
```

```powershell
# RSAT bulk
Get-ADComputer -Filter * -Properties ms-Mcs-AdmPwd,msLAPS-Password |
  Where {$_.'ms-Mcs-AdmPwd' -or $_.'msLAPS-Password'} |
  Select Name,DNSHostName,
    @{n='LAPSv1';e={$_.'ms-Mcs-AdmPwd'}},
    @{n='LAPSv2';e={$_.'msLAPS-Password'}}
```

___

## Decryption of LAPSv2 Encrypted Password

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `msLAPS-EncryptedPassword` | Binary blob | Encrypted. |
| AES-256 with derived key | Crypto | Standard. |
| Encryption principal SID embedded | Targeted decryption | Standard. |
| Key derived from KDS root key | Forest crypto root | Standard. |
| Authorized principal: native PowerShell decrypts | `Get-LapsADPassword` | Standard. |
| Non-authorized: encrypted blob useless | Standard | Standard. |
| Membership in encryption principal group | Required | Standard. |
| `Get-LapsADPassword -Identity host -AsPlainText` | Auto-decrypt | Standard. |
| Manual decrypt via `LapsADPasswordDecryption` API | Custom | Edge. |
| Per-host encryption principal | Configurable | Standard. |
| Default Domain Admins typical | Standard | Standard. |
| Custom Tier 0 group | Best practice | Standard. |
| Atacante in priv group | Decryption viable | Privilege path. |
| Cross-correlate ACL + group membership | Critical audit | Standard. |
| BloodHound `ReadLAPSPassword` edge | Modern | Tool. |
| Detection: decryption events | Defender | Adjacent. |
| Audit: minimal decryptors | Best practice | Standard. |
^ad-lapsread-decrypt

### LAPSv2 decryption

```powershell
# Native PowerShell (auto-decrypts if authorized)
Get-LapsADPassword -Identity WS01 -AsPlainText

# Output:
# ComputerName : WS01
# DistinguishedName : CN=WS01,CN=Computers,DC=dom,DC=local
# Account : Administrator
# Password : a8B3#k$pQv2!nM7@xL  (decrypted cleartext)
# PasswordUpdateTime : 2024-01-15 03:45:23
# ExpirationTimestamp : 2024-02-14 03:45:23
# Source : EncryptedPassword

# If not authorized:
# Error: "The current user is not authorized to decrypt the password"
```

```python
# Python LapsADPasswordDecryption (requires authorized cred)
# Custom implementation rare — use native PS preferred
# Reference: https://github.com/T0X1Cx/LAPSv2-Decrypt-Toolkit
```

___

## ACL Bypass Paths

| **Path** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Direct LAPS read permission | Standard | Standard. |
| Group membership → reader group | Indirect | Standard. |
| `GenericAll` on computer | Full control = read | Privesc combo. |
| `GenericRead` on computer | Read all attrs | Privesc combo. |
| `AllExtendedRights` on computer | Includes LAPS | Standard. |
| Encryption principal membership | LAPSv2 specific | Modern. |
| Recursive group expansion | Nested groups | Standard. |
| Foreign principal in reader group | Cross-trust | Critical. |
| Cross-OU inheritance | Indirect | Standard. |
| ACL modification (privesc) | Add self to ACL | ACL Abuse. |
| Group membership add (privesc) | Add self to group | ACL Abuse. |
| Encryption principal modify (LAPSv2) | Change principal | Privileged. |
| Per-computer ACE override | Edge | Edge. |
| Service account in priv group | Common | Audit. |
| BloodHound paths | Visualize | Tool. |
| Cypher: shortest path to LAPS read | Custom | Tool. |
^ad-lapsread-bypass

### ACL bypass via group membership

```powershell
# Find user/group with LAPS read on target
$target = "CN=WS01,CN=Computers,DC=dom,DC=local"

$readers = (Get-Acl "AD:$target").Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    ($_.ActiveDirectoryRights -match "ReadProperty|GenericAll|GenericRead|AllExtendedRights")
  } |
  Select -ExpandProperty IdentityReference

# Resolve to recursive members
foreach ($r in $readers) {
  if ($r.Value -match "^(?:[\\w-]+)\\(.*)$") {
    $name = $Matches[1]
    try {
      $group = Get-ADGroup $name -ErrorAction SilentlyContinue
      if ($group) {
        Get-ADGroupMember $group -Recursive | Select Name,SamAccountName
      }
    } catch {}
  }
}
```

___

## Cross-Correlation with Priv

| **Pattern** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| Tier 0 admins read all LAPS | Best practice | Standard. |
| Helpdesk reads workstations | Tiered model | Standard. |
| Helpdesk reads servers | Tier conflation | Audit. |
| Service accounts in encryption principal | Risk | Audit. |
| Foreign principals reading LAPS | Cross-trust | Critical. |
| Cross-OU LAPS readers | Tier conflation | Audit. |
| BackupOperators / ServerOperators reading | Edge | Audit. |
| Custom IT support groups | Per-org | Edge. |
| Vendor groups | Cross-org | Audit. |
| Stale group members | Old delegations | Audit. |
| Audit log: per-principal LAPS reads | Standard | Compliance. |
| Cross-correlate with priv tier model | Standard | Audit. |
| Detection: LAPS read by non-tier-aligned | Defender ML | Modern. |
| Cross-correlate with computer tier | Per-host classification | Adjacent. |
| Honeypot computer LAPS read alert | Defender plant | Detection. |
| BloodHound CE 6.x audit | Modern | Tool. |
^ad-lapsread-correlate

### Cross-tier audit

```powershell
# Tier 0 OU computers + their LAPS readers
$tier0OU = "OU=Tier 0,DC=dom,DC=local"
$workstationsOU = "OU=Workstations,DC=dom,DC=local"

# Tier 0 readers should be tight (DA, EA, dedicated Tier 0 admin group)
Find-LapsADExtendedRights -Identity $tier0OU |
  Select ObjectDN,@{n='Reader';e={$_.ExtendedRightHolder}} |
  Sort Reader -Unique

# Workstation readers expanded (helpdesk OK)
Find-LapsADExtendedRights -Identity $workstationsOU |
  Select ObjectDN,ExtendedRightHolder
```

___

## OPSEC for LAPS Read

| **Aspect** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Bulk read = loud | SIEM flag | Defender. |
| Per-host targeted = stealthier | Standard | OPSEC. |
| Read frequency anomaly | Defender ML | Standard. |
| Atacante: cross-correlate target with priv | Single-host targeted | OPSEC win. |
| Read time-of-day pattern | Match legit pattern | Stealth. |
| Authenticated baseline | Standard | Reliable. |
| Cleanup not needed (read-only) | Standard | OPSEC. |
| Detection: Event 4662 with LAPS GUID | Defender | Adjacent. |
| Detection: Event 4624 + read | Defender | Adjacent. |
| Modern: Defender for Identity LAPS alerts | Modern | Defender. |
| Honeypot LAPS alert | Defender plant | Detection. |
| Stealth: don't bulk all hosts | Standard | OPSEC. |
| Targeted ACL audit + selective read | Best | OPSEC. |
| Cross-correlate with engagement scope | Per-engagement | Standard. |
| Compliance audit reads expected | Defender baseline | Adjacent. |
| Atacante reads vs admin reads | Pattern differentiation | Defender. |
^ad-lapsread-opsec

### OPSEC-aware read

```bash
# Targeted single host (preferred OPSEC)
nxc smb 10.0.0.50 -u user -p pass --laps

# Avoid bulk subnet sweep unless needed
# nxc smb 10.0.0.0/24 -u user -p pass --laps  # LOUD

# Cross-correlate priv computers first (BloodHound), then targeted read
# Avoid reading honeypot computers
```

___

## Common LAPS Read Errors

| **Error** | **Cause** | **Notas** |
|:---:|:---:|:---:|
| `Access denied` | ACL deny | Standard. |
| `Authentication required` | Auth needed | Standard. |
| `Object not found` | Computer DN incorrect | Standard. |
| `Attribute not found` | LAPS not deployed | Audit. |
| `The current user is not authorized to decrypt the password` | LAPSv2 encryption | Standard. |
| `Operations error` | Anonymous bind | Standard. |
| Empty output | Authorized but no LAPS set | Standard. |
| Encrypted blob without decryption | Read-only access | Standard. |
| `Insufficient access rights` | ACL deny granular | Standard. |
| `Interface unknown` | Server-side issue | Edge. |
| Stale ticket / refresh | Kerberos issue | Adjacent. |
| Anonymous LDAP blocked | Modern hardened | Standard. |
| Authentication misconfig | Per-engagement | Edge. |
| Schema not extended | LAPS not deployed | Audit. |
| Cross-domain access denied | Trust limit | Adjacent. |
| Cross-forest access denied | Selective Auth | Adjacent. |
^ad-lapsread-errors

### Troubleshooting common errors

```bash
# Error: Access denied
# → Check ACL on target computer
# → Authenticate with different (privileged) account

# Error: Not authorized to decrypt
# → User not in encryption principal group
# → Check msLAPS-EncryptedPassword's encryption principal SID

# Error: Object not found
# → Use FQDN instead of short name
# → Check OU path

# Error: Attribute not found  
# → LAPS schema not extended
# → Check schema with Get-ADObject -Filter "Name -like 'msLAPS-*'"
```

***
