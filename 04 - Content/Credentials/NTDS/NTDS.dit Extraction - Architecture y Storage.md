---
aliases:
  - NTDS.dit Architecture
  - ESE Database
  - JET Engine
tags:
  - type/concept
  - technique/credential-access
  - env/windows
  - asset/active-directory
  - cred/ntlm
  - cred/kerberos
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[NTDS.dit Extraction]]"
---
# NTDS.dit Extraction - Architecture & Storage

***

## NTDS.dit Architecture

| **Aspecto** | **Detalle** |
|:---:|:---:|
| Format | Extensible Storage Engine (ESE / JET Blue) DB |
| Location | `C:\Windows\NTDS\ntds.dit` (default) |
| Engine | Same que Exchange / Windows Search / WINS |
| Locked when AD service running | Cannot copy directo (file lock) |
| Tables clave | `datatable` (objects), `link_table` (memberships), `sd_table` (security descriptors) |
| Encryption | PEK (Password Encryption Key) — encrypted con boot key del SYSTEM hive |
| Replication granularity | Full domain partition (per-DC) |
^ntds-arch-overview

___

## File Locations on DC

| **Path** | **Contenido** | **Cuándo** |
|:---:|:---:|:---:|
| `C:\Windows\NTDS\ntds.dit` | Main database | Primary target. |
| `C:\Windows\NTDS\edb.log` | Transaction log (uncommitted writes) | Companion. |
| `C:\Windows\NTDS\edbtmp.log` | Temporary log | Edge. |
| `C:\Windows\NTDS\edb*.jrs` | Reserved log files | ESE compat. |
| `C:\Windows\System32\config\SYSTEM` | SYSTEM hive (contains BootKey for PEK decrypt) | **Required** para parse. |
| `C:\Windows\NTDS\Active Directory\` | ifm backup directory (post-`ntdsutil`) | Standard backup. |
^ntds-arch-paths

**Key fact:** NTDS.dit es **inútil sin SYSTEM hive**. PEK encrypted con BootKey del SYSTEM. Must dump both.

___

## What's Inside (Object Types)

| **Object class** | **Cred extracted** |
|:---:|:---:|
| User accounts | NT hash, LM hash (legacy), AES128/256 keys, DES key, password history (default 24 entries) |
| Computer accounts | Computer NT hash + Kerberos keys (128 chars random) |
| Trust accounts (`<NETBIOS>$`) | Trust password hash → forge inter-realm TGT |
| Service accounts (sMSA / gMSA) | NT hash + AES keys |
| `krbtgt` | Master Kerberos KDC key → Golden Ticket |
| `Administrator` (built-in) | Local DC admin hash |
| Cleartext passwords | Solo si `ENCRYPTED_TEXT_PWD_ALLOWED` UAC bit set (reversible encryption) |
^ntds-arch-objects

___

## Password Encryption Layers

| **Layer** | **Detalle** |
|:---:|:---:|
| 1. NT hash (RC4-MD5 of UTF-16 password) | Standard hash. |
| 2. PEK encryption | Hashes encrypted con PEK (Password Encryption Key). |
| 3. PEK encrypted con BootKey | BootKey en SYSTEM hive registry. |
| 4. BootKey scattered en 4 registry keys | `JD`, `Skew1`, `GBG`, `Data` keys en `HKLM\SYSTEM\CurrentControlSet\Control\Lsa`. |
^ntds-arch-encryption

**Decryption chain:**
```
SYSTEM hive → BootKey (4 scattered keys) → PEK → NT hashes en NTDS.dit
```

Sin SYSTEM hive = NTDS.dit data encrypted = no recovery.

___

## Replication vs File Access

| **Method** | **Acceso requerido** | **Output** |
|:---:|:---:|:---:|
| **DCSync (DRSUAPI)** | Replication rights ACE en domain root | Live network call → hashes |
| **NTDS.dit file** | DC local admin / Backup Operators / file system access | Static file → offline parse |
| **VSS Snapshot** | Local admin DC | Bypass file lock → file copy |
| **ntdsutil ifm** | DA / Domain Controllers group | Built-in backup mechanism |
^ntds-arch-methods

___

## Why Both DCSync AND File Methods Exist

| **Scenario** | **DCSync** | **File extraction** |
|:---:|:---:|:---:|
| Network access only (no DC shell) | Yes | No |
| DC compromised (local admin) | Yes (overhead) | Yes (faster) |
| Defender for Identity active | Detected | Bypasses MDI replication monitoring |
| Backup Operators (no DA) | No | Yes (via `ntdsutil ifm`) |
| Forest with restricted DCSync ACEs | Limited | Yes (if file access) |
| OPSEC sensitive | Audit Event 4662 + MDI alert | File access events (less granular) |
^ntds-arch-comparison

___

## NTDS Database Schema (Selected)

| **Attribute** | **Significa** | **Cuándo** |
|:---:|:---:|:---:|
| `unicodePwd` | NT hash (encrypted) | Standard hash. |
| `dBCSPwd` | LM hash (legacy) | Disabled default. |
| `supplementalCredentials` | AES128/256 keys + cleartext si reversible | Modern Kerberos. |
| `lmPwdHistory` / `ntPwdHistory` | Password history (default 24 entries) | Crack offline. |
| `pekList` | PEK key (encrypted con BootKey) | Decryption pivot. |
| `objectSid` | SID | RID extract. |
| `samAccountName` | Login name | ID. |
| `userAccountControl` | UAC bitfield | Flags. |
^ntds-arch-schema

___

## Pre-Attack Recon

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADDomainController -Filter *` | DCs disponibles | Pre-attack. |
| `Get-ADDomain \| Select PDCEmulator` | PDC (FSMO) | Targeted DC. |
| `(Get-Acl "AD:$((Get-ADDomain).DistinguishedName)").Access \| ? ObjectType -in (DCSync GUIDs)` | Quien puede DCSync | DCSync path validation. |
| `nxc smb <DC> -u u -H <NT>` | DC reachable + auth | Pre-extraction. |
| `Get-ADUser krbtgt -Pr PasswordLastSet` | krbtgt age (Golden Ticket viability) | Privesc planning. |
^ntds-arch-recon

___

## File Size Estimation

| **Domain size** | **NTDS.dit típica** |
|:---:|:---:|
| Small (<1000 users) | 50-200 MB |
| Medium (1000-10k users) | 200 MB - 2 GB |
| Large (10k-100k users) | 2-20 GB |
| Enterprise (>100k users) | 20+ GB |
^ntds-arch-size

**Implicación exfil:** large domains = compress + chunked exfil (split). Standard zstd / 7z compression ~10-20x reduction on NTDS.dit.

```bash
# Compression antes de exfil
zstd -19 ntds.dit -o ntds.dit.zst   # max compression
# o
7z a -
