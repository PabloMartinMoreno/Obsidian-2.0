---
aliases:
  - Password Policy Tooling
  - polenum
  - samba-tool passwordsettings
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
  - "[[AD - Password Policy Enumeration]]"
  - "[[netexec]]"
---
# AD - Password Policy Enumeration - Tooling

***

## netexec / crackmapexec

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <DC> -u u -p p --pass-pol` | Policy via SMB | Standard. |
| `nxc ldap <DC> -u u -p p --pass-pol` | Policy via LDAP | SMB blocked. |
| `nxc smb <DC> -u '' -p '' --pass-pol` | Anonymous attempt | Test misconfig. |
| `nxc ldap <DC> -u u -p p --query "(objectClass=msDS-PasswordSettings)" "*"` | PSOs via LDAP | Detail. |
| `nxc ldap <DC> -u u -p p --query "(samAccountName=krbtgt)" "PasswordLastSet,msDS-KeyVersionNumber"` | krbtgt age | Audit. |
^ad-pwdpol-tool-netexec

___

## RSAT / PowerShell

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADDefaultDomainPasswordPolicy` | DDP completo | Standard. |
| `Get-ADFineGrainedPasswordPolicy -Filter *` | PSOs | Standard. |
| `Get-ADFineGrainedPasswordPolicySubject <pso>` | Subjects del PSO | Scope. |
| `Get-ADUserResultantPasswordPolicy <user>` | Policy efectivo del user | Per-user. |
| `Get-ADUser <user> -Pr msDS-ResultantPSO,badPwdCount,lockoutTime` | Estado per-user | Pre-spray. |
| `Search-ADAccount -LockedOut` | Lockeados ahora | Triage. |
| `Search-ADAccount -PasswordExpired` | Pwds expirados | Audit. |
| `Search-ADAccount -PasswordNeverExpires -UsersOnly` | Pwd never expires | Audit. |
| `(Get-ADForest).Domains \| % { Get-ADDefaultDomainPasswordPolicy -Server $_ }` | Forest-wide DDP | Multi-domain. |
^ad-pwdpol-tool-rsat

___

## rpcclient / Native Linux

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `rpcclient -U "" <DC> -N -c 'getdompwinfo'` | Anonymous policy | Test null. |
| `rpcclient -U 'corp\u%pass' <DC> -c 'getdompwinfo'` | Authenticated | Standard. |
| `rpcclient -U 'corp\u%pass' <DC> -c 'querydominfo'` | Domain info detallado | Alt. |
| `polenum -d corp.local -u user -p pass <DC>` | Policy via Python | Sin rpcclient. |
| `samba-tool domain passwordsettings show -U u%pass -H ldap://<DC>` | Samba native | Linux con Samba. |
^ad-pwdpol-tool-rpc

```bash
# polenum (legacy pero útil)
pip install polenum-ng  # o git clone
polenum -d corp.local -u auditor -p 'Pass!' <DC>

# Output:
# Minimum password Length: 8
# Password History Length: 24
# Maximum password age: 90 days
# Account Lockout Threshold: 5
```

___

## enum4linux / enum4linux-ng

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `enum4linux-ng -P <DC>` | Solo password policy | Targeted. |
| `enum4linux-ng -A <DC> -oJ enum.json` | Comprehensive + JSON | Audit. |
| `enum4linux-ng -A -u u -p pass <DC>` | Authenticated comprehensive | Standard. |
| `enum4linux -P <DC>` | Legacy fallback | Sin -ng. |
^ad-pwdpol-tool-enum4linux

___

## PingCastle / Purple Knight / ADRecon

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `PingCastle.exe --healthcheck --server <DC>` | Audit completo (incluye policy + krbtgt) | Quarterly. |
| `PingCastle.exe --hcrules \| grep -i "pwd\|password\|lockout"` | Reglas password policy | Reference. |
| Purple Knight GUI → Indicators → Password category | IoEs password | Cross-tool. |
| `.\ADRecon.ps1 -DomainController <DC> -OutputType Excel` | Excel multi-sheet (incluye `PasswordAttributes`, `FineGrainedPasswordPolicy`) | Auditor-friendly. |
^ad-pwdpol-tool-pingcastle

```powershell
# ADRecon password sections
.\ADRecon.ps1 -DomainController <DC> -OutputType CSV -OutputDir .\report

# Inspeccionar:
# report\CSV-Files\PasswordAttributes.csv
# report\CSV-Files\FineGrainedPasswordPolicy.csv
```

___

## Custom Audit Scripts

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Test-PasswordQuality` (DSInternals) | Audit passwords offline desde NTDS.dit (pwned hashes, weak, reuse) | IR + audit profundo. |
| `Get-ADDBAccount -All -DBPath <ntds.dit> -BootKey ...` | Parse NTDS.dit offline | Forensics. |
| Custom PowerShell pipeline pre-spray | Filter safe targets | Spray prep. |
^ad-pwdpol-tool-custom

```powershell
# DSInternals pipeline (offline NTDS audit)
Install-Module DSInternals
$bk = Get-BootKey -SystemHivePath 'C:\IFM\registry\SYSTEM'
$accts = Get-ADDBAccount -All -DBPath 'C:\IFM\Active Directory\ntds.dit' -BootKey $bk

# Test contra HIBP pwned hashes
$accts | Test-PasswordQuality `
  -WeakPasswordHashesSortedFile pwned-passwords-ntlm-sorted.txt
```

___

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| Microsoft Default Domain Policy docs | `https://learn.microsoft.com/windows/security/threat-protection/security-policy-settings/password-policy` |
| Microsoft FGPP docs | `https://learn.microsoft.com/windows-server/identity/ad-ds/manage/configure-fine-grained-password-policies` |
| New-KrbtgtKeys.ps1 | `https://github.com/microsoft/New-KrbtgtKeys.ps1` |
| DSInternals | `https://github.com/MichaelGrafnetter/DSInternals` |
| HIBP Pwned Passwords NTLM | `https://haveibeenpwned.com/Passwords` |
| NIST 800-63B Digital Identity | `https://pages.nist.gov/800-63-3/sp800-63b.html` |
| CIS Benchmarks | `https://www.cisecurity.org/cis-benchmarks` |
| polenum | `https://github.com/eDarkness/polenum` |
| HackTricks Password Policy | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/password-spraying` |
^ad-pwdpol-tool-resources

***
