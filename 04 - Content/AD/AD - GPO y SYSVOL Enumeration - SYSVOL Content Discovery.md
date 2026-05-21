---
aliases:
  - SYSVOL Spider
  - SYSVOL Scripts
  - SYSVOL Search
  - NETLOGON
tags:
  - type/technique
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[AD - GPO y SYSVOL Enumeration]]'
---
# AD - GPO y SYSVOL Enumeration - SYSVOL Content Discovery

***

## SYSVOL Mount + Browse

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dir \\<DC>\sysvol\corp.local` | Contenido SYSVOL desde Windows | Standard. |
| `mount -t cifs //<DC>/SYSVOL /mnt/sysvol -o user=u,pass=pass,dom=corp` | Linux mount | Linux. |
| `smbclient //<DC>/SYSVOL -U 'corp/u%pass'` | Linux interactive | Sin mount. |
| `smbmap -H <DC> -u u -p pass -R --depth 5 SYSVOL` | Recursive listing | Bulk. |
| `nxc smb <DC> -u u -p p --shares` | Confirma SYSVOL accesible | Pre-spider. |
^ad-sysvol-mount

```bash
# Linux mount + browse
sudo mount -t cifs //<DC>/SYSVOL /mnt/sysvol -o user=auditor,pass='Pass!',dom=corp
ls -la /mnt/sysvol/corp.local/

# Standard structure:
# corp.local/
# ├── Policies/
# │   └── {<GPO-GUID>}/
# │       ├── Machine/
# │       └── User/
# └── scripts/    (NETLOGON)
```

___

## GPP Files

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `find /mnt/sysvol -name "*.xml" -path "*Preferences*"` | Linux GPP XML files | Cred hunt. |
| `dir /s /b \\<DC>\sysvol\corp.local\Policies\*.xml \| findstr /i "Preferences"` | Windows | Native. |
| `nxc smb <DC> -u u -p p -M gpp_password` | Auto-detect + decrypt cpassword | Quick. |
| `Get-ChildItem -Path "\\<DC>\sysvol\corp.local\Policies" -Filter *.xml -Recurse` | RSAT bulk | Standard. |
^ad-sysvol-gppfiles

**GPP file types comunes** (con cpassword):
- `Groups.xml` (local users + passwords)
- `ScheduledTasks.xml` (run-as credentials)
- `Services.xml` (service credentials)
- `DataSources.xml` (DB connection strings)
- `Drives.xml` (mapped drive credentials)
- `Printers.xml` (printer install creds)

```bash
# Hunt cpassword en SYSVOL
grep -r "cpassword" /mnt/sysvol --include="*.xml"
```

___

## SYSVOL Scripts Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `find /mnt/sysvol -path "*Scripts*"` | Logon/startup scripts | Cred hunt. |
| `find /mnt/sysvol -name "*.ps1" -o -name "*.bat" -o -name "*.vbs" -o -name "*.cmd"` | Script files | Bulk. |
| `dir \\<DC>\NETLOGON\*.bat /b /s` | NETLOGON scripts (replicated SYSVOL) | Standard. |
| `nxc smb <DC> -u u -p p -M spider_plus -o INTERESTING_EXTENSIONS=ps1,bat,vbs,cmd` | Auto spider | Quick. |
^ad-sysvol-scripts

___

## Embedded Credentials Hunt

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `grep -ri "password\|secret\|pwd\|cred" /mnt/sysvol --include="*.{ps1,bat,vbs,cmd,xml,ini,reg,txt}"` | Cred keywords en files | Standard hunt. |
| `Snaffler.exe -s -u -t \\<DC>\sysvol` (en Windows) | High-fidelity hunt | Comprehensive. |
| `manspider /mnt/sysvol --search "password|secret|key" --content` | Linux Snaffler-like | Linux. |
| `nxc smb <DC> -u u -p p -M spider_plus -o INTERESTING_EXTENSIONS=ini,xml,ps1,bat,vbs,reg,config,kdbx,pfx` | Bulk spider patterns | Quick. |
^ad-sysvol-creds

```bash
# Comprehensive cred hunt
grep -rEi "(password|pwd|secret|cred)\s*[=:]\s*['\"]" /mnt/sysvol \
  --include="*.ps1" --include="*.bat" --include="*.vbs" \
  --include="*.cmd" --include="*.xml" --include="*.ini"
```

___

## Logon Script Modification

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-Acl "\\<DC>\sysvol\corp.local\scripts\<script>.bat").Access` | DACL del script | Pre-modify check. |
| `Set-Content "\\<DC>\sysvol\corp.local\scripts\<script>.bat" -Value "<malicious>"` | Modify script (priv) | Persistence. |
| `Find-DomainShare -CheckShareAccess -ResolveGUIDs` (PowerView) | Writable shares | Audit surface. |
| `nxc smb <DC> -u u -p p --shares \| grep -i "WRITE"` | Bulk writable detection | Quick. |
^ad-sysvol-logonmod

**Por qué importa:** logon scripts en SYSVOL ejecutan en cada user logon. Modify script malicioso = persistencia. ACE `WRITE` sobre script = privesc directo.

___

## NETLOGON Share

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dir \\<DC>\NETLOGON` | Contenido (replica de SYSVOL\corp.local\scripts) | Standard. |
| `(Get-Acl "\\<DC>\NETLOGON").Access` | DACL del share | Audit. |
| `Get-ChildItem "\\<DC>\NETLOGON" -Recurse -File \| Select FullName,Length,LastWriteTime` | Inventory | Standard. |
^ad-sysvol-netlogon

**NETLOGON = subset of SYSVOL.** Replica `\\<DC>\sysvol\corp.local\scripts\` como share separado. Common location para org-wide login scripts. Audit junto con SYSVOL.

___

## Modern Best Practices

| **Práctica** | **Implementación** | **Cuándo** |
|:---:|:---:|:---:|
| MS14-025 patch (mayo 2014) | Block creation de GPP cpassword | Critical fix. |
| Cleanup pre-2014 GPP XMLs con cpassword | Manual + `findstr` audit | Hardening. |
| Use gMSA/LAPS en lugar de GPP credentials | Modern alt | Replace. |
| Restrict SYSVOL share write a Tier 0 | DACL hardening | Defense. |
| AppLocker en logon scripts | Script execution control | Adjacent. |
| PowerShell Constrained Language Mode | Block malicious scripts | Hardening. |
| Quarterly audit `findstr /S cpassword` | Compliance | Standard. |
^ad-sysvol-bestpractice

```cmd
:: Quarterly cleanup audit
findstr /S /I "cpassword" \\<DC>\sysvol\*.xml
:: Cualquier match = legacy cpassword XML que debe eliminarse
```

***
