---
aliases:
  - LSASS Detection
  - RunAsPPL
  - Credential Guard
  - WDigest Disable
tags:
  - type/concept
  - technique/credential-access
  - technique/defense-evasion
  - env/windows
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[LSASS Dumping]]"
---
# LSASS Dumping - Detection & Mitigations

***

## Detection Events

| **Event ID** | **Significa** | **Cuándo** |
|:---:|:---:|:---:|
| Sysmon `Event 10` | OpenProcess con access mask `0x1010` o `0x1410` (LSASS read) | Standard detection. |
| `Event 4663` | Object access (file system) on LSASS dump output | Forensic. |
| `Event 4688` | Process creation (procdump.exe, mimikatz.exe) | Process lineage. |
| `Event 4624 logon type 9` | NewCredentials logon | Adjacent post-PtH. |
| MDI alert `Suspected credential theft` | LSASS access pattern | Real-time. |
| MDI alert `Suspected DCSync attack` | Adjacent (DCSync vs local LSASS) | Discrimination. |
^lsass-detect-events

```powershell
# Sysmon SACL audit en LSASS
Get-WinEvent -LogName Microsoft-Windows-Sysmon/Operational |
  Where {
    $_.Id -eq 10 -and
    $_.Message -match "TargetImage:.*lsass.exe" -and
    $_.Message -match "GrantedAccess: (0x1010|0x1410|0x143A)"
  }
```

___

## RunAsPPL (LSA Protection)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `reg add "HKLM\SYSTEM\CurrentControlSet\Control\Lsa" /v RunAsPPL /t REG_DWORD /d 1 /f` | Enable LSA Protection (priv) | Hardening. |
| `Get-CimInstance -Namespace root\cimv2 -ClassName Win32_Service \| ? Name -eq "LSA"` | Verify LSA process protection | Audit. |
| `tasklist /v /fi "imagename eq lsass.exe"` | Check LSASS Protected status | Standard. |
^lsass-detect-pplrunas

**Cómo funciona:** RunAsPPL marca LSASS como **Protected Process Light (PPL)**. OpenProcess con READ access desde non-PPL = `STATUS_ACCESS_DENIED`. Mimikatz/procdump fallan.

**Bypass attacker side:**
- Mimikatz `mimidrv.sys` driver load (requires admin + signed driver) — patch protection.
- BYOVD (Bring Your Own Vulnerable Driver) — exploit kernel-level.
- UEFI bootkit (advanced).

```cmd
:: Defender: enable RunAsPPL
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Lsa" /v RunAsPPL /t REG_DWORD /d 1 /f
:: Reboot required
shutdown /r /t 0
```

___

## Credential Guard (VBS)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-CimInstance -ClassName Win32_DeviceGuard -Namespace root\Microsoft\Windows\DeviceGuard \| Select SecurityServicesRunning` | Verify VBS running | Audit. |
| Value `1` en SecurityServicesRunning = Credential Guard active | Confirm | Standard. |
| GPO: `Computer Configuration > Admin Templates > System > Device Guard > Turn On Virtualization Based Security` | Enable VBS | Hardening. |
^lsass-detect-credguard

**Cómo funciona:** VBS (Virtualization-Based Security) usa Hyper-V para crear **VSM (Virtual Secure Mode)**. LSASS secrets se mueven a VSM-isolated process (`LsaIso.exe`). LSASS regular no contiene hashes/Kerberos keys.

**Requirements:**
- UEFI Secure Boot.
- Hyper-V capability (VT-x/AMD-V).
- TPM 2.0 (recommended).
- Windows Enterprise / Education / Server 2016+.

**Bypass:**
- BYOVD para disable VBS via kernel exploit.
- UEFI bootkit (very advanced).
- Disable VBS via registry post-DA + reboot (loud).

___

## WDigest Disable

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `reg query "HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest" /v UseLogonCredential` | Check current state | Audit. |
| `reg add "HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest" /v UseLogonCredential /t REG_DWORD /d 0 /f` | Disable cleartext storage | Hardening. |
^lsass-detect-wdigest

**Default Win 8.1+ / Server 2012R2+:** `UseLogonCredential = 0` (cleartext disabled).

**Atacante force enable:**
```cmd
reg add "HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest" /v UseLogonCredential /t REG_DWORD /d 1 /f
:: Wait for next user logon → cleartext en LSASS
:: Then dump
```

**Defender hardening:** force `UseLogonCredential = 0` via GPO + audit cualquier modify event 4657 (registry change).

___

## Defender for Endpoint (MDE)

| **Detection** | **Qué detecta** | **Cuándo** |
|:---:|:---:|:---:|
| ASR rule `Block credential stealing from Windows local security authority subsystem` | Block process accessing LSASS | Default modern. |
| Audit mode: log only (no block) | Pre-deployment | Test. |
| Block mode: deny + alert | Production | Hardening. |
| MDE alert `Suspicious access to LSASS service` | Behavioral | Real-time. |
^lsass-detect-mde

```cmd
:: Enable ASR rule (PowerShell)
Set-MpPreference -AttackSurfaceReductionRules_Ids 9e6c4e1f-7d60-472f-ba1a-a39ef669e4b2 -AttackSurfaceReductionRules_Actions Enabled
```

___

## Honeytokens / Fake LSASS Triggers

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| Honey-token user (cuenta nunca usada) sesión cached en host | Trigger alert si dumped | Defender side. |
| Custom Sysmon SACL en `\Device\HarddiskVolume1\Windows\System32\lsass.exe` | Granular LSASS access logs | Hardening. |
| Defender for Identity honeypots | LSASS-derived auth attempts alerta | MDI integration. |
^lsass-detect-honey

___

## Hardening Checklist

| **Setting** | **Valor recomendado** | **Detalle** |
|:---:|:---:|:---:|
| `RunAsPPL` | `1` | LSA Protection. |
| `LsaCfgFlags` | `1` (Enabled with UEFI lock) | Credential Guard. |
| `WDigest UseLogonCredential` | `0` | No cleartext. |
| `RestrictedAdmin` (RDP) | Enabled | No cred theft via RDP. |
| ASR rules `9e6c4e1f-7d60-472f-ba1a-a39ef669e4b2` | Block | LSASS access rule. |
| Sysmon SACL on LSASS | Enabled | Granular logging. |
| Tier 0 admins en Protected Users | Members | NTLM disabled + AES + 4h TGT. |
^lsass-detect-checklist

___

## Bypass Comparison

| **Method** | **Bypass effectiveness** | **Effort / Risk** |
|:---:|:---:|:---:|
| Standard mimikatz | Defeated by RunAsPPL | Low effort, blocked. |
| comsvcs.dll MiniDump | Defeated by RunAsPPL | Low effort, blocked. |
| nanodump | Bypasses some EDRs | Medium effort. |
| BOF in-beacon | Bypasses signature-based | Medium-high. |
| `mimidrv.sys` driver load | Bypasses RunAsPPL (BYOVD) | High (driver detect). |
| Custom direct syscalls | Bypasses userland hooks | Very high effort. |
| UEFI bootkit | Bypasses VBS | Very high (advanced). |
| Disable VBS post-DA + reboot | Bypasses VBS | Aggressive (audit). |
^lsass-detect-bypass

___

## Common Errors (Defender Side)

| **Issue** | **Causa** | **Fix** |
|:---:|:---:|:---:|
| RunAsPPL no enabled post-reg | Pendiente reboot | `shutdown /r /t 0`. |
| VBS no running pese a config | Hardware no soporta (no VT-x) | Verify CPU + UEFI. |
| ASR rule no blocking | Audit mode (no block) | Set Action=Enabled. |
| WDigest cleartext aún visible | UseLogonCredential override post-set | Audit Event 4657. |
| MDI alerts noise | False positives legacy auth | Tune filters. |
^lsass-detect-errors

***
