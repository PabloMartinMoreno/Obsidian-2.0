---
aliases:
  - LAPSv1
  - ms-Mcs-AdmPwd
  - Legacy LAPS
  - AdmPwd attribute
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
  - "[[AD - LAPS Enumeration]]"
---
# AD - LAPS Enumeration - Legacy LAPSv1

***

## LAPSv1 Architecture

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `ms-Mcs-AdmPwd` attribute | Cleartext local admin password | LAPSv1 core. |
| `ms-Mcs-AdmPwdExpirationTime` | FILETIME expiration | Adjacent. |
| Per-computer attribute | One password per host | Standard. |
| Stored on Computer object | LDAP location | Standard. |
| Default Confidential flag | Read-only restricted | Standard. |
| Schema extension required | `Update-AdmPwdADSchema` | Privileged install. |
| Client-side LAPS MSI | Per-host install | Required. |
| GPO-driven password rotation | Default 30 days | Standard. |
| Password generated locally | Per-host | Standard. |
| Pushed to AD on rotation | Standard | Standard. |
| Local Administrator account | RID 500 default | Standard. |
| Custom account configurable | GPO setting | Edge. |
| Read permission separate from password | ACL controls | Standard. |
| Public Microsoft GitHub repo (deprecated) | Archived | Adjacent. |
| Modern: deprecated post-2023 | Microsoft direction | Standard. |
| Migration path to LAPSv2 | Coexist or replace | Adjacent. |
^ad-lapsv1-arch

### LAPSv1 schema extension check

```powershell
# Schema attributes
Get-ADObject -SearchBase "CN=Schema,CN=Configuration,$((Get-ADDomain).DistinguishedName)" `
  -Filter "Name -eq 'ms-Mcs-AdmPwd' -or Name -eq 'ms-Mcs-AdmPwdExpirationTime'" |
  Select Name,DistinguishedName

# Confidentiality flag
Get-ADObject -SearchBase "CN=Schema,..." -Filter "Name -eq 'ms-Mcs-AdmPwd'" -Properties searchFlags |
  Select Name,@{n='ConfidentialFlag';e={($_.searchFlags -band 128) -ne 0}}
# searchFlags bit 128 = CONFIDENTIAL — only specific principals can read
```

___

## LAPSv1 Read via LDAP

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-ADComputer host -Properties ms-Mcs-AdmPwd` | RSAT direct | Standard. |
| `ldapsearch ... "(cn=host)" ms-Mcs-AdmPwd` | LDAP raw | Linux. |
| `nxc smb host -u u -p p --laps` | netexec wrapper | Bulk. |
| `nxc ldap DC -u u -p p --query "(ms-Mcs-AdmPwd=*)" "*"` | LDAP filter | Custom. |
| `Get-AdmPwdPassword -ComputerName host` | Native LAPS PowerShell module | Per-host. |
| `crackmapexec smb hosts -u u -p p --laps` | Older name | Same. |
| Required: read permission | Per-OU/computer | ACL. |
| Default Authenticated Users: NO read | CONFIDENTIAL flag | Standard. |
| Specific group reads | Per-OU GPO config | Standard. |
| Bulk read attempts | Test all hosts | Standard. |
| Output: cleartext password + expiration | Direct cred | Standard. |
| Cross-correlate with priv | LAPS readers in priv groups | Audit. |
| Detection: bulk LAPS query events | Defender | Adjacent. |
| BloodHound `ReadLAPSPassword` edge | Modern collection | Tool. |
| Authenticated required typical | Standard | Standard. |
| Per-host result: success or denied | Per-ACL | Standard. |
^ad-lapsv1-read

### LAPSv1 read examples

```bash
# netexec bulk
nxc smb hosts.txt -u user -p pass --laps

# Output format:
# SMB         10.0.0.50  445  WS01  [+] Found ms-Mcs-AdmPwd: a8B3#k$pQv2!nM7@xL
# SMB         10.0.0.60  445  WS02  [-] Failed to read

# LDAP direct
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(&(objectCategory=computer)(ms-Mcs-AdmPwd=*))" \
  cn dNSHostName ms-Mcs-AdmPwd ms-Mcs-AdmPwdExpirationTime

# Targeted single host
ldapsearch -h DC -D 'dom\u' -w pass -b "CN=WS01,CN=Computers,DC=dom,DC=local" \
  -s base "(objectClass=*)" ms-Mcs-AdmPwd
```

```powershell
# RSAT
Get-ADComputer -Filter * -Properties ms-Mcs-AdmPwd,ms-Mcs-AdmPwdExpirationTime |
  Where {$_.'ms-Mcs-AdmPwd'} |
  Select Name,DNSHostName,
    @{n='Password';e={$_.'ms-Mcs-AdmPwd'}},
    @{n='Expiration';e={[datetime]::FromFileTime($_.'ms-Mcs-AdmPwdExpirationTime')}}

# LAPS PowerShell module (if installed)
Get-AdmPwdPassword -ComputerName WS01
```

___

## LAPSv1 ACL Audit

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| Per-computer DACL | `Get-Acl "AD:CN=host,..."` | Standard. |
| Filter for `ms-Mcs-AdmPwd` read | Specific GUID | Filter. |
| `dsacls "CN=host,..." | findstr "ms-Mcs-AdmPwd"` | Native | Adjacent. |
| LAPSv1 GUID for read | `Read msDS-AllowedToActOnBehalfOfOtherIdentity` schema GUID | LDAP. |
| `Find-AdmPwdExtendedRights` (LAPS module) | Native helper | Standard. |
| Per-OU ACL inheritance | Standard | Standard. |
| `ReadProperty on ms-Mcs-AdmPwd` | Specific permission | Direct. |
| `All Extended Rights` | Includes LAPS read | Edge. |
| `GenericAll on computer` | Full control = LAPS read | ACL combo. |
| Check who can read | Per-host audit | Standard. |
| Bulk audit | Per-OU iteration | Standard. |
| Default: only specific groups | Best practice | Hardening. |
| Default: Authenticated Users blocked | CONFIDENTIAL flag | Standard. |
| Detection: ACL modify on LAPS attr | Defender | Adjacent. |
| BloodHound `ReadLAPSPassword` edge | Visual | Tool. |
| Audit: who has LAPS read | Compliance | Standard. |
^ad-lapsv1-acl

### LAPSv1 ACL audit

```powershell
# Find principals with LAPS read on specific computer
$computer = "CN=WS01,CN=Computers,DC=dom,DC=local"
$lapsAttr = "AdmPwd"  # ms-Mcs-AdmPwd

Get-Acl "AD:$computer" | Select -ExpandProperty Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    ($_.ActiveDirectoryRights -match "ReadProperty|GenericAll|GenericRead|ExtendedRight")
  } |
  Select IdentityReference,ActiveDirectoryRights

# Native LAPS helper (if module installed)
Import-Module AdmPwd.PS
Find-AdmPwdExtendedRights -Identity "OU=Workstations,DC=dom,DC=local"
```

```bash
# Linux LDAP
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "CN=WS01,CN=Computers,DC=dom,DC=local" \
  -s base nTSecurityDescriptor

# bloodyAD (decode SDDL)
bloodyAD --host DC -d dom -u user -p pass get object "CN=WS01,..." --resolve-sd
```

___

## LAPSv1 Misconfigurations

| **Misconfig** | **Risk** | **Notas** |
|:---:|:---:|:---:|
| Authenticated Users with read | Default permissive | Critical (rare default but possible). |
| Domain Users with read | Anyone in domain | Critical. |
| ACL inheritance from broad parent | Indirect read | Audit. |
| Stale LAPS-set computers | Old passwords still readable | Adjacent. |
| LAPS not deployed (no schema) | No protection | Audit gap. |
| LAPS deployed but no GPO link | Schema only, no rotation | Edge. |
| Password rotation interval >90 days | Stale passwords | Audit. |
| Custom non-default local account | Edge configuration | Edge. |
| Default Administrator account | RID 500 | Standard. |
| LAPS not on Domain Controllers | Best practice | Standard. |
| LAPS on DCs (rare) | Hardening | Edge. |
| Confidential flag not set | Authenticated Users may read | Critical. |
| `searchFlags & 128 = 0` | Confidential off | Vuln. |
| Per-OU LAPS gap | Some OUs without coverage | Audit. |
| Cross-OU inheritance unintended | Edge | Audit. |
| Recovery: helper accounts excluded | Per-org policy | Standard. |
^ad-lapsv1-misconfig

### LAPSv1 misconfig audit

```powershell
# Audit: Confidential flag set?
$lapsSchema = Get-ADObject -SearchBase "CN=Schema,CN=Configuration,$((Get-ADDomain).DistinguishedName)" `
  -Filter "Name -eq 'ms-Mcs-AdmPwd'" -Properties searchFlags

if (($lapsSchema.searchFlags -band 128) -eq 0) {
  Write-Warning "ms-Mcs-AdmPwd Confidential flag NOT set — Authenticated Users may read"
}

# Find computers where Authenticated Users can read LAPS (audit)
Get-ADComputer -Filter * -Properties ms-Mcs-AdmPwd | ForEach-Object {
  $dn = $_.DistinguishedName
  $acl = Get-Acl "AD:$dn"
  $authUsers = $acl.Access | Where {
    $_.IdentityReference -eq "NT AUTHORITY\Authenticated Users" -and
    ($_.ActiveDirectoryRights -match "GenericAll|GenericRead")
  }
  if ($authUsers) {
    Write-Host "[!] $($_.Name) has Authenticated Users read"
  }
}
```

___

## LAPSv1 Read Permissions Discovery

| **Vector** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `Find-AdmPwdExtendedRights` | LAPS PS module | Native helper. |
| Per-OU read | OU-level permission | Standard. |
| Per-computer read | Granular | Standard. |
| Read via group membership | Indirect | Standard. |
| Bulk audit script | DIY | Standard. |
| BloodHound `ReadLAPSPassword` edge | Visual | Tool. |
| `Get-ObjectAcl -DistinguishedName host -ResolveGUIDs` | PowerView | Adjacent. |
| `dsacls` native | Adjacent | Adjacent. |
| Tier 0 admins read all | Standard | Standard. |
| Helpdesk groups read workstations | Tiered model | Standard. |
| Audit: minimal read principals | Best practice | Standard. |
| Cross-correlate with priv | LAPS readers in priv groups | Audit. |
| Stale read permissions | Old delegations | Audit. |
| Service accounts as readers | Common find | Audit. |
| BackupOperators / ServerOperators read | Per-org config | Edge. |
| Detection: LAPS read events | Defender | Adjacent. |
^ad-lapsv1-readers

### LAPS readers discovery

```powershell
# Native LAPS module helper
Import-Module AdmPwd.PS
Find-AdmPwdExtendedRights -Identity "OU=Workstations,DC=dom,DC=local"

# Manual via DACL audit
$ou = "OU=Workstations,DC=dom,DC=local"
$lapsRead = "00000000-0000-0000-0000-000000000000"  # ms-Mcs-AdmPwd schema GUID

Get-ADComputer -SearchBase $ou -Filter * | ForEach-Object {
  $acl = Get-Acl "AD:$($_.DistinguishedName)"
  $readers = $acl.Access | Where {
    $_.AccessControlType -eq "Allow" -and
    ($_.ActiveDirectoryRights -match "ReadProperty|GenericAll|AllExtendedRights")
  }
  [PSCustomObject]@{
    Computer = $_.Name
    Readers = ($readers.IdentityReference | Sort -Unique) -join '; '
  }
}
```

___

## LAPSv1 Replacement (Migration to LAPSv2)

| **Step** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Install LAPSv2 schema | Native Server 2022+ | Standard. |
| Configure GPO LAPSv2 | New ADMX | Standard. |
| Decommission LAPSv1 GPO | Per-OU | Standard. |
| Remove LAPSv1 client install | Optional | Adjacent. |
| Coexistence period | Both attrs may exist | Edge. |
| Verify LAPSv2 deployment | `msLAPS-Password` populated | Standard. |
| Test LAPSv2 read | Authorized principals | Standard. |
| Disable LAPSv1 attribute updates | Stop GPO settings | Standard. |
| Schema cleanup (rare) | Don't remove schema | Standard. |
| Audit migration completion | Per-OU | Standard. |
| Update read permissions | LAPSv2 ACL | Standard. |
| Detection: LAPSv1 read events post-migration | Anomaly | Defender. |
| BloodHound LAPSv2 edges | Modern | Tool. |
| Compliance: deprecate LAPSv1 | Microsoft direction | Standard. |
| Per-org migration timeline | Variable | Operational. |
| Modern best practice: LAPSv2 only | Hardening | Standard. |
^ad-lapsv1-migration

### Coexistence detection

```powershell
# Find computers with both LAPSv1 + LAPSv2 set (mid-migration)
Get-ADComputer -Filter * `
  -Properties ms-Mcs-AdmPwd,msLAPS-Password,
    ms-Mcs-AdmPwdExpirationTime,msLAPS-PasswordExpirationTime |
  Where {
    $_.'ms-Mcs-AdmPwd' -and $_.'msLAPS-Password'
  } |
  Select Name,
    @{n='LAPSv1Set';e={$null -ne $_.'ms-Mcs-AdmPwd'}},
    @{n='LAPSv2Set';e={$null -ne $_.'msLAPS-Password'}},
    @{n='V1Exp';e={[datetime]::FromFileTime($_.'ms-Mcs-AdmPwdExpirationTime')}},
    @{n='V2Exp';e={[datetime]::FromFileTime($_.'msLAPS-PasswordExpirationTime')}}
```

***
