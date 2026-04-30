---
aliases:
  - SYSVOL Spider
  - SYSVOL Scripts
  - SYSVOL Search
  - GPP Files
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
  - "[[AD - GPO y SYSVOL Enumeration]]"
---
# AD - GPO & SYSVOL Enumeration - SYSVOL Content Discovery

***

## SYSVOL Mount + Browse

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `smbclient //DC/SYSVOL -U user` | Linux SMB browse | Standard. |
| `smbclient //DC/SYSVOL -U user -W dom -c 'ls'` | One-shot dir | Standard. |
| `smbmap -H DC -u user -p pass -R SYSVOL` | Recurse list | Standard. |
| `smbmap -H DC -u user -p pass -R SYSVOL --depth 5` | Limit depth | Standard. |
| `smbmap -H DC -u user -p pass -R SYSVOL -A '\.xml$\|\.ini$\|\.bat$\|\.ps1$'` | Filter pattern | Targeted. |
| `nxc smb DC -u user -p pass --shares` | Share list | Adjacent. |
| `nxc smb DC -u user -p pass -M spider_plus -o INTERESTING_EXTENSIONS=xml,ini,ps1,bat,vbs` | Module spider | Standard. |
| `mount -t cifs //DC/SYSVOL /mnt/sysvol -o user=user,pass=pass` | Linux mount | Standard. |
| `New-PSDrive -Name SYSVOL -PSProvider FileSystem -Root \\dom\SYSVOL` | Windows mount | Standard. |
| `dir \\dom\SYSVOL\dom\Policies` | Native browse | Standard. |
| `Get-ChildItem \\dom\SYSVOL -Recurse` | PS recursive | Slow. |
| `Get-ChildItem \\dom\SYSVOL -Recurse -Filter "*.xml"` | XML filter | Standard. |
| `cd \\dom\SYSVOL\dom\Scripts` | NETLOGON adjacent | Standard. |
| `dir /s /b \\dom\SYSVOL\*.xml` | Native bulk | Standard. |
| `find /mnt/sysvol -type f -name "*.xml"` | Linux find | Standard. |
| Authenticated read default | Authenticated Users | Standard. |
^ad-sysvol-mount

### SYSVOL recurse

```bash
# smbmap recursive
smbmap -H DC -u user -p pass -R SYSVOL --depth 10 -A '\.xml$|\.ini$|\.bat$|\.ps1$|\.vbs$'

# nxc spider
nxc smb DC -u user -p pass -M spider_plus -o INTERESTING_EXTENSIONS=xml,ini,bat,ps1,vbs,vba,reg,kdbx,config

# Linux mount + find
sudo mkdir /mnt/sysvol
sudo mount -t cifs //DC/SYSVOL /mnt/sysvol -o user=user,pass=pass,domain=dom
find /mnt/sysvol -type f \( -name "*.xml" -o -name "*.ps1" -o -name "*.bat" \)
```

___

## GPP Files (Group Policy Preferences)

| **File** | **Path Pattern** | **Notas** |
|:---:|:---:|:---:|
| Groups.xml | `Preferences\Groups\Groups.xml` | Local user mgmt — cpassword target. |
| ScheduledTasks.xml | `Preferences\ScheduledTasks\ScheduledTasks.xml` | Tasks — cpassword target. |
| Services.xml | `Preferences\Services\Services.xml` | Services — cpassword target. |
| DataSources.xml | `Preferences\DataSources\DataSources.xml` | DB connections — cpassword target. |
| Printers.xml | `Preferences\Printers\Printers.xml` | Printers — cpassword target. |
| Drives.xml | `Preferences\Drives\Drives.xml` | Mapped drives — cpassword target. |
| Find all GPP XML | `find /mnt/sysvol -name "*.xml" \| xargs grep -l cpassword` | Direct hunt. |
| Native Windows | `findstr /S /M "cpassword" \\dom\SYSVOL\dom\Policies\*.xml` | Adjacent. |
| Bulk grep (Linux mount) | `grep -r "cpassword" /mnt/sysvol` | Standard. |
| `Get-GPPPassword` (PowerSploit) | Native PS function | Adjacent. |
| `gpp-decrypt` (Linux) | Decrypt found cpassword | Standard. |
| GPP MS14-025 patched May 2014 | Modern blocked | Patched. |
| Legacy environments still vuln | Audit | Standard. |
| Detection: bulk SYSVOL XML reads | Defender | Adjacent. |
| Adjacent: SYSVOL & GPP cpassword hub | Cross-ref | Adjacent. |
| Modern: minimal GPP usage | Best practice | Standard. |
^ad-sysvol-gppfiles

### GPP discovery

```bash
# Find all GPP XML with cpassword
find /mnt/sysvol -name "*.xml" -exec grep -l "cpassword" {} \;

# Or per-extension
find /mnt/sysvol -type f \( -name "Groups.xml" -o -name "ScheduledTasks.xml" -o -name "Services.xml" -o -name "DataSources.xml" -o -name "Printers.xml" -o -name "Drives.xml" \)

# nxc Get-GPPPassword module
nxc smb DC -u user -p pass -M gpp_password
```

```powershell
# Native Windows
findstr /S /M "cpassword" \\dom\SYSVOL\dom\Policies\*.xml

# PowerSploit
Import-Module PowerSploit
Get-GPPPassword
```

___

## SYSVOL Scripts Discovery

| **File Type** | **Search Pattern** | **Notas** |
|:---:|:---:|:---:|
| Logon scripts | `\Scripts\Logon\` | Standard. |
| Logoff scripts | `\Scripts\Logoff\` | Standard. |
| Startup scripts | `\Machine\Scripts\Startup\` | Standard. |
| Shutdown scripts | `\Machine\Scripts\Shutdown\` | Standard. |
| `.bat`, `.cmd`, `.ps1`, `.vbs`, `.exe` | Common | Standard. |
| `find /mnt/sysvol -type f -name "*.ps1"` | Linux | Standard. |
| `find /mnt/sysvol -type f -name "*.bat"` | Standard | Standard. |
| `Get-ChildItem \\dom\SYSVOL -Recurse -Include *.ps1,*.bat,*.cmd,*.vbs` | Windows native | Standard. |
| `findstr /S /M "password" \\dom\SYSVOL\*.bat` | Hunt creds | Standard. |
| `grep -ri "password\|secret\|key" /mnt/sysvol` | Hunt creds bulk | Standard. |
| Common cred patterns: `password=`, `pass=`, `pwd=` | Standard | Audit. |
| Encrypted in scripts (legacy) | Audit | Standard. |
| Per-GPO Scripts.ini | `\Scripts.ini` configures execution | Standard. |
| `gpresult /h policy.html` | Per-host effective | Adjacent. |
| Modern: signed scripts | Best practice | Standard. |
| Detection: SYSVOL script modify | Defender | Adjacent. |
^ad-sysvol-scripts

### Script hunt

```bash
# Linux mount + find scripts with creds
find /mnt/sysvol -type f \( -name "*.bat" -o -name "*.ps1" -o -name "*.cmd" -o -name "*.vbs" \) | \
  while read f; do
    if grep -qi "password\|secret\|pwd\|pass=" "$f"; then
      echo "[!] $f"
      grep -i "password\|secret\|pwd\|pass=" "$f"
    fi
  done

# Bulk grep
grep -ri "password\|secret\|pwd" /mnt/sysvol --include="*.bat" --include="*.ps1" --include="*.cmd"
```

```powershell
# Windows native
Get-ChildItem \\dom\SYSVOL -Recurse -Include *.ps1,*.bat,*.cmd,*.vbs |
  Select-String -Pattern "password|secret|pwd" |
  Select Path,LineNumber,Line
```

___

## Embedded Credentials Hunt

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `grep -r "password" /mnt/sysvol` | Bulk plaintext | Standard. |
| `grep -r "Password=" /mnt/sysvol` | Specific format | Standard. |
| `grep -r "cpassword" /mnt/sysvol` | GPP encrypted | Critical. |
| `grep -ri "secret\|api_key\|token" /mnt/sysvol` | Multi-pattern | Standard. |
| `findstr /S /I /M "password" \\dom\SYSVOL\*.*` | Native Windows | Standard. |
| `Select-String -Path \\dom\SYSVOL -Recurse -Pattern "password"` | PS native | Standard. |
| `Get-ChildItem \\dom\SYSVOL -Recurse -File | Select-String "password"` | Bulk PS | Standard. |
| Snaffler (modern) | Auto-discover | Modern. |
| `Snaffler.exe -s -u` | Comprehensive | Standard. |
| `manspider` | Linux Snaffler-equivalent | Adjacent. |
| Custom regex: `[Pp]assword\s*=\s*"[^"]+"` | Targeted | Standard. |
| Connection strings: `Server=...;User Id=...;Password=...` | Standard pattern | Audit. |
| `.kdbx` (KeePass) files | Audit candidates | Standard. |
| `.config` files (NET) | Connection strings | Standard. |
| `.ini` files | Legacy creds | Standard. |
| Detection: bulk SYSVOL grep | Defender ML | Adjacent. |
^ad-sysvol-creds

### Comprehensive cred hunt

```bash
# Snaffler-equivalent search
patterns=(
  "[Pp]assword\s*=" 
  "[Pp]wd\s*=" 
  "[Ss]ecret\s*=" 
  "API[_]?[Kk]ey" 
  "[Tt]oken\s*=" 
  "[Cc]onnection[Ss]tring"
  "cpassword="
)

for pattern in "${patterns[@]}"; do
  echo "=== $pattern ==="
  grep -rE "$pattern" /mnt/sysvol --include="*.xml" --include="*.ini" \
    --include="*.bat" --include="*.ps1" --include="*.cmd" --include="*.vbs" \
    --include="*.config" 2>/dev/null
done
```

```powershell
# Snaffler
.\Snaffler.exe -s -u -o snaffler.log

# Or PowerShell native
Get-ChildItem \\dom\SYSVOL -Recurse -File -Include *.xml,*.ini,*.ps1,*.bat,*.cmd,*.config |
  Select-String -Pattern "password|secret|cpassword|token|api_key" |
  Select Path,LineNumber,Line |
  Export-Csv sysvol_creds.csv
```

___

## Logon Script Modification (Privesc)

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| WriteAccess on `\Scripts\Logon\*.bat` | Modify logon script | Privesc. |
| `Get-Acl \\dom\SYSVOL\dom\Scripts\Logon\login.bat` | NTFS DACL | Standard. |
| Atacante adds backdoor command to script | Persistence | Standard. |
| Logon script runs as user | Per-user context | Standard. |
| Per-OU different scripts | Standard | Audit. |
| Detection: SYSVOL script modify | Defender | Adjacent. |
| Modern: signed scripts | Best practice | Standard. |
| Audit: script modify rights | Standard | Compliance. |
| Stale scripts | Audit | Standard. |
| Per-quarter SYSVOL audit | Standard | Compliance. |
| Cross-correlate per-OU scope | Standard | Audit. |
| Cleanup post-engagement | Standard | OPSEC. |
| Documented baseline scripts | Standard | Compliance. |
| Modern: PowerShell Constrained Language | Hardening | Adjacent. |
| AppLocker on scripts | Hardening | Standard. |
| Adjacent: GPO Abuse hub | Cross-ref | Adjacent. |
^ad-sysvol-logonmod

### Logon script audit

```powershell
# Find all SYSVOL scripts
$scripts = Get-ChildItem \\dom\SYSVOL -Recurse -Include *.bat,*.ps1,*.cmd,*.vbs

foreach ($s in $scripts) {
  $acl = Get-Acl $s.FullName
  $modifiers = $acl.Access | Where {
    $_.AccessControlType -eq "Allow" -and
    ($_.FileSystemRights -match "FullControl|Modify|Write") -and
    $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN"
  }
  
  if ($modifiers) {
    [PSCustomObject]@{
      Script = $s.FullName
      Modifiers = ($modifiers.IdentityReference | Sort -Unique) -join '; '
    }
  }
}
```

___

## NETLOGON Share

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `\\dom\NETLOGON` adjacent share | Standard | Standard. |
| `smbclient //DC/NETLOGON -U user` | Browse | Standard. |
| Per-domain script repository | Adjacent | Standard. |
| Same DFS-R mechanism | Replicated | Standard. |
| Common contents: logon scripts | Standard | Standard. |
| Cross-correlate with SYSVOL | Standard | Audit. |
| ACL similar to SYSVOL | Standard | Adjacent. |
| Authenticated read default | Standard | Standard. |
| Detection: NETLOGON modify | Defender | Adjacent. |
| Modern: minimal NETLOGON | Best practice | Standard. |
| Audit: NETLOGON content | Standard | Compliance. |
| Stale scripts | Audit | Standard. |
| Cleanup: hygiene | Standard | Standard. |
| Per-quarter NETLOGON audit | Standard | Compliance. |
| Adjacent: SYSVOL hub | Cross-ref | Adjacent. |
| Modern: signed scripts | Best practice | Standard. |
^ad-sysvol-netlogon

### NETLOGON discovery

```bash
# NETLOGON share
smbclient //DC/NETLOGON -U user -W dom

# Linux mount
sudo mount -t cifs //DC/NETLOGON /mnt/netlogon -o user=user,pass=pass

# Find scripts + creds
find /mnt/netlogon -type f -exec grep -l "password\|secret" {} \;
```

___

## Modern SYSVOL Best Practices

| **Practice** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Patch MS14-025 | GPP cpassword removed | Standard. |
| Audit existing GPP files | Pre-patch leftover | Standard. |
| Remove cpassword from XMLs | Cleanup | Standard. |
| Modern: avoid GPP for credentials | Best practice | Standard. |
| Use gMSA for service accounts | Modern | Hardening. |
| Use LAPS for local admin | Modern | Hardening. |
| Signed scripts (AuthentiCode) | Hardening | Standard. |
| AppLocker on scripts | Hardening | Standard. |
| PowerShell Constrained Language | Hardening | Adjacent. |
| Per-quarter SYSVOL audit | Standard | Compliance. |
| Detection: SYSVOL modify events | Defender | Adjacent. |
| Microsoft Defender for Identity SYSVOL alerts | Modern | Defender. |
| BloodHound SYSVOL adjacent edges | Modern | Tool. |
| Compliance: documented baseline | Standard | Adjacent. |
| Audit log retention | Standard | Adjacent. |
| Modern: continuous monitoring | Defender | Standard. |
^ad-sysvol-bestpractice

### Audit checklist

```powershell
# 1. Find any remaining GPP cpassword
findstr /S /M "cpassword" \\dom\SYSVOL\dom\Policies\*.xml

# 2. Find scripts with embedded creds
Get-ChildItem \\dom\SYSVOL -Recurse -Include *.ps1,*.bat,*.cmd,*.vbs |
  Select-String -Pattern "password|secret"

# 3. Audit SYSVOL ACL
Get-ChildItem \\dom\SYSVOL\dom\Policies -Directory |
  ForEach-Object {
    $acl = Get-Acl $_.FullName
    $nonDefault = $acl.Access | Where {
      $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|SYSTEM|BUILTIN" -and
      $_.FileSystemRights -match "Modify|FullControl|Write"
    }
    if ($nonDefault) { 
      [PSCustomObject]@{ Path = $_.FullName; Modifiers = $nonDefault.IdentityReference -join '; ' }
    }
  }
```

***
