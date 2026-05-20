---
aliases:
  - LSASS
  - LSASS Dump
  - Local Security Authority Subsystem
tags:
  - type/vulnerability
  - technique/credential-access
  - env/windows
  - asset/active-directory
  - cred/ntlm
  - cred/kerberos
  - service/lsass
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
type: CheatSheet
linked:
  - "[[LSASS Dumping - Mimikatz Methods]]"
  - "[[LSASS Dumping - Native LOLBins]]"
  - "[[LSASS Dumping - Modern EDR Evasion]]"
  - "[[LSASS Dumping - Offline Parsing]]"
  - "[[LSASS Dumping - Detection y Mitigations]]"
  - "[[LSASS Dumping - Tooling]]"
  - "[[Pass-the-Hash]]"
  - "[[Pass-the-Ticket]]"
  - "[[netexec]]"
---
# LSASS Dumping

***

## Cheatsheet

### 💉 Mimikatz Methods

````tabs
tab: **Pre-Requirements**
![[LSASS Dumping - Mimikatz Methods#^lsass-mimi-prereq]]

tab: **sekurlsa::logonpasswords**
![[LSASS Dumping - Mimikatz Methods#^lsass-mimi-logonpasswords]]

tab: **sekurlsa::msv (NTLM only)**
![[LSASS Dumping - Mimikatz Methods#^lsass-mimi-msv]]

tab: **sekurlsa::tickets (Kerberos)**
![[LSASS Dumping - Mimikatz Methods#^lsass-mimi-tickets]]

tab: **sekurlsa::ekeys (AES Keys)**
![[LSASS Dumping - Mimikatz Methods#^lsass-mimi-ekeys]]

tab: **sekurlsa::credman**
![[LSASS Dumping - Mimikatz Methods#^lsass-mimi-credman]]

tab: **sekurlsa::wdigest (Legacy)**
![[LSASS Dumping - Mimikatz Methods#^lsass-mimi-wdigest]]

tab: **lsadump::sam (Local SAM)**
![[LSASS Dumping - Mimikatz Methods#^lsass-mimi-lsadump]]

tab: **Process Memory Read (offline)**
![[LSASS Dumping - Mimikatz Methods#^lsass-mimi-minidump]]

tab: **Common Errors**
![[LSASS Dumping - Mimikatz Methods#^lsass-mimi-errors]]
````

### 🔧 Native LOLBins

````tabs
tab: **comsvcs.dll MiniDump**
![[LSASS Dumping - Native LOLBins#^lsass-lol-comsvcs]]

tab: **ProcDump (Sysinternals)**
![[LSASS Dumping - Native LOLBins#^lsass-lol-procdump]]

tab: **Task Manager (GUI)**
![[LSASS Dumping - Native LOLBins#^lsass-lol-taskmgr]]

tab: **SQLDumper / WerFault**
![[LSASS Dumping - Native LOLBins#^lsass-lol-sqldumper]]

tab: **VSS Snapshot**
![[LSASS Dumping - Native LOLBins#^lsass-lol-vss]]

tab: **OPSEC Comparison**
![[LSASS Dumping - Native LOLBins#^lsass-lol-comparison]]

tab: **Common Errors**
![[LSASS Dumping - Native LOLBins#^lsass-lol-errors]]

tab: **Exfil Strategy**
![[LSASS Dumping - Native LOLBins#^lsass-lol-exfil]]
````

### 🥷 Modern EDR Evasion

````tabs
tab: **nanodump**
![[LSASS Dumping - Modern EDR Evasion#^lsass-evasion-nanodump]]

tab: **Cobalt Strike BOFs**
![[LSASS Dumping - Modern EDR Evasion#^lsass-evasion-bof]]

tab: **SafetyKatz / Custom .NET**
![[LSASS Dumping - Modern EDR Evasion#^lsass-evasion-custom]]

tab: **DInjector / Direct Syscalls**
![[LSASS Dumping - Modern EDR Evasion#^lsass-evasion-dinjector]]

tab: **RunAsPPL Bypass**
![[LSASS Dumping - Modern EDR Evasion#^lsass-evasion-pplbypass]]

tab: **Credential Guard Bypass**
![[LSASS Dumping - Modern EDR Evasion#^lsass-evasion-credguard]]

tab: **In-Process MimiSpray**
![[LSASS Dumping - Modern EDR Evasion#^lsass-evasion-psreflective]]

tab: **OPSEC Comparison Modern**
![[LSASS Dumping - Modern EDR Evasion#^lsass-evasion-comparison]]

tab: **Common Errors**
![[LSASS Dumping - Modern EDR Evasion#^lsass-evasion-errors]]
````

### 🔬 Offline Parsing

````tabs
tab: **pypykatz (Linux/Mac)**
![[LSASS Dumping - Offline Parsing#^lsass-offline-pypykatz]]

tab: **Mimikatz Offline Mode**
![[LSASS Dumping - Offline Parsing#^lsass-offline-mimikatz]]

tab: **Output Inspection**
![[LSASS Dumping - Offline Parsing#^lsass-offline-output]]

tab: **Per-Session Filtering**
![[LSASS Dumping - Offline Parsing#^lsass-offline-filter]]

tab: **Per-Package Extraction**
![[LSASS Dumping - Offline Parsing#^lsass-offline-package]]

tab: **DPAPI Master Key Extraction**
![[LSASS Dumping - Offline Parsing#^lsass-offline-dpapi]]

tab: **Common Errors**
![[LSASS Dumping - Offline Parsing#^lsass-offline-errors]]
````

### 🛡️ Detection & Mitigations

````tabs
tab: **Detection Events**
![[LSASS Dumping - Detection y Mitigations#^lsass-detect-events]]

tab: **RunAsPPL (LSA Protection)**
![[LSASS Dumping - Detection y Mitigations#^lsass-detect-pplrunas]]

tab: **Credential Guard (VBS)**
![[LSASS Dumping - Detection y Mitigations#^lsass-detect-credguard]]

tab: **WDigest Disable**
![[LSASS Dumping - Detection y Mitigations#^lsass-detect-wdigest]]

tab: **Defender for Endpoint (MDE)**
![[LSASS Dumping - Detection y Mitigations#^lsass-detect-mde]]

tab: **Honeytokens / Fake Triggers**
![[LSASS Dumping - Detection y Mitigations#^lsass-detect-honey]]

tab: **Hardening Checklist**
![[LSASS Dumping - Detection y Mitigations#^lsass-detect-checklist]]

tab: **Bypass Comparison**
![[LSASS Dumping - Detection y Mitigations#^lsass-detect-bypass]]

tab: **Common Errors (Defender)**
![[LSASS Dumping - Detection y Mitigations#^lsass-detect-errors]]
````

### 🛠️ Tooling

````tabs
tab: **mimikatz**
![[LSASS Dumping - Tooling#^lsass-tool-mimi]]

tab: **pypykatz**
![[LSASS Dumping - Tooling#^lsass-tool-pypykatz]]

tab: **nanodump**
![[LSASS Dumping - Tooling#^lsass-tool-nanodump]]

tab: **Native LOLBins**
![[LSASS Dumping - Tooling#^lsass-tool-lolbin]]

tab: **netexec Modules**
![[LSASS Dumping - Tooling#^lsass-tool-nxc]]

tab: **Cobalt Strike BOFs**
![[LSASS Dumping - Tooling#^lsass-tool-bof]]

tab: **SafetyKatz / Custom**
![[LSASS Dumping - Tooling#^lsass-tool-custom]]

tab: **DPAPI Adjacent**
![[LSASS Dumping - Tooling#^lsass-tool-dpapi]]

tab: **Recursos**
![[LSASS Dumping - Tooling#^lsass-tool-resources]]
````

___

## Overview

**LSASS Dumping** = extraer credenciales (NTLM hashes, Kerberos tickets, AES keys, cleartext si WDigest) desde el proceso `lsass.exe` (Local Security Authority Subsystem Service). Foundational credential access technique. Required: local admin (`SeDebugPrivilege`).

**Outputs:** NTLM hashes (PtH), Kerberos TGT/TGS (PtT), AES256 keys (Overpass + Silver/Golden Ticket), DPAPI master keys (browser passwords), Credential Manager entries, cached cleartext (WDigest legacy).

### Cuándo es alto impacto

| **Source** | **Cred extraído** | **Privesc** |
|---|---|---|
| Workstation con Tier 0 RDP session | DA hashes/tickets en LSASS | Direct DA (CVSS Critical) |
| Server con service account session | Service account creds | Lateral + targeted (CVSS High) |
| DC LSASS (priv required) | krbtgt + all DA hashes | Forest takeover (CVSS Critical) |
| Workstation con Backup Operators session | NTDS dump path adjacent | Privesc to DA (CVSS High) |
| Hybrid env con AzureAD primary refresh tokens | Cloud creds | Cloud lateral (CVSS High) |

### Diferencia con técnicas adyacentes

| | **LSASS Dump** | **NTDS Dump** | **DCSync** |
|---|---|---|---|
| Source | Memory `lsass.exe` | NTDS.dit DB file | DRSUAPI replication call |
| Location | Per-host (running sessions) | DC only | Network — any reach to DC |
| Required | Local admin | DA / Backup Operators / file access | DCSync rights ACE |
| Output | Active session creds | Full domain hashes | Full domain hashes |
| Detection | Sysmon Event 10 (LSASS read) | File access events | Event 4662 (DCSync GUIDs) |

___

## Workflow

```
1. Privesc to local admin (SeDebugPrivilege required).

2. Method selection:
   a. mimikatz on-host (loud, EDR signature)
   b. comsvcs.dll MiniDump (native, stealth)
   c. ProcDump signed (medium stealth)
   d. nanodump (modern EDR-evasion)
   e. BOF (Cobalt Strike — minimal IOCs)
   f. Task Manager GUI (interactive)

3. Capture:
   - Direct: mimikatz sekurlsa::logonpasswords
   - Offline: dump file → exfil → pypykatz/mimikatz

4. EDR / Protection bypass:
   - RunAsPPL → mimidrv.sys driver load
   - Credential Guard → BYOVD / UEFI exploit
   - WDigest → force enable (registry) + wait logon

5. Offline parse:
   - pypykatz lsa minidump lsass.dmp
   - mimikatz # sekurlsa::minidump <file>

6. Privesc chain:
   - NTLM hash → Pass-the-Hash
   - Kerberos TGT → Pass-the-Ticket
   - AES256 → Overpass-the-Hash
   - krbtgt hash → Golden Ticket
   - DPAPI master keys → browser passwords

7. Cleanup:
   - Delete dump files
   - Clear PowerShell history
   - Mimikatz/procdump file removal
```

___

## Detección rápida

```cmd
:: Method 1: comsvcs.dll (stealth)
tasklist /FI "IMAGENAME eq lsass.exe"
rundll32.exe C:\Windows\System32\comsvcs.dll, MiniDump <PID> C:\temp\lsass.dmp full

:: Method 2: mimikatz on-host
mimikatz # privilege::debug
mimikatz # sekurlsa::logonpasswords > creds.txt

:: Method 3: ProcDump
procdump.exe -accepteula -ma lsass.exe C:\temp\lsass.dmp
```

```bash
# Method 4: nxc remote dump (lateral)
nxc smb <target> -u admin -H <NT> --local-auth -M lsassy

# Offline parse
pypykatz lsa minidump lsass.dmp
```

___

## Impacto

- **Tier 0 admin sessions cached** = direct DA via PtH/PtT.
- **Service account creds en LSASS** = lateral movement chains.
- **Kerberos AES keys** = Silver/Golden Ticket forge prep.
- **DPAPI master keys** = browser password exfil + WiFi creds + VPN.
- **Domain user en host con priv access** = privesc via cred chain.
- **Hybrid env: PRT (Primary Refresh Token)** = Azure AD cloud lateral.
- **Workstation con cached Tier 0** = critical privesc from low-priv host.

___

## Mitigación (defender)

- **RunAsPPL (LSA Protection)** — `HKLM\SYSTEM\CurrentControlSet\Control\Lsa\RunAsPPL = 1`. LSASS marked Protected Process Light. Blocks user-mode access.
- **Credential Guard (VBS)** — VSM-isolated `LsaIso.exe` containing secrets. Hardware-rooted (UEFI Secure Boot + Hyper-V).
- **WDigest disable** — `UseLogonCredential = 0` (default Win 8.1+). No cleartext en LSASS.
- **Defender ASR rule `9e6c4e1f-7d60-472f-ba1a-a39ef669e4b2`** — block credential stealing from LSASS.
- **Tier 0 admins en `Protected Users`** — NTLM disabled + AES + 4h TGT.
- **Restricted Admin RDP** — no creds en target post-RDP.
- **Detection events**:
  - Sysmon Event 10 con `GrantedAccess: 0x1010|0x1410|0x143A` y `TargetImage: lsass.exe`.
  - Event 4663 (file access) on dump output paths.
  - MDE alert `Suspicious access to LSASS service`.
  - MDI alert `Suspected credential theft`.
- **Honey-token sessions** en host — trip atacante.
- **Sysmon SACL** custom en `lsass.exe` — granular logging.

___

## Para entender LSASS

**Por qué LSASS contiene creds:** Windows authentication subsystem. LSA (Local Security Authority) handles login, generates access tokens, manages auth packages (Kerberos, NTLM, NTLMv2, WDigest legacy). Every active user session = creds cached en memoria para SSO.

**Por qué SSO requiere creds en memoria:** Windows SSO design — user logueado en console + accede a `\\server\share` SMB. Sin SSO = re-prompt password every share. Solución: cache hash en LSASS, auto-auth contra share. Desventaja seguridad: hash dump = SSO vector compromise.

**Por qué WDigest cleartext disabled default modern:** WDigest era HTTP Digest auth (legacy). Required cleartext password en LSASS para HMAC challenge-response. Mimikatz `sekurlsa::wdigest` extraía cleartext. Microsoft disabled default Win 8.1+ via `UseLogonCredential = 0`. Atacante puede force enable + wait next logon.

**Por qué RunAsPPL bypass via driver:** Protected Process Light enforced kernel-side. User-mode (admin) cannot access protected process memory. Driver (KMD) opera kernel-mode = bypass. Mimikatz `mimidrv.sys` exploits this. Modern Windows = driver signature enforced (HVCI), driver load más restringido.

**Por qué Credential Guard es harder bypass:** VBS uses Hyper-V para VSM. LSASS secrets en VSM-isolated process (`LsaIso.exe`). Standard kernel access ≠ VSM access. Bypass requires UEFI exploit / kernel-VSM exploit. Hardware-rooted protection.

**Por qué pypykatz preferred for offline:** mimikatz Windows-only. pypykatz Linux/Mac/Windows portable. Same capability (parse dump). OPSEC: dump on target → exfil → parse offline en attacker box. No mimikatz binary on target.

**Por qué nanodump exists:** standard `MiniDumpWriteDump` API hooked by EDRs. nanodump implements custom MiniDump from scratch — bypasses API hooks. Multiple methods (fork, snapshot, duplicate handle) = different syscall patterns = harder universal detection.

___

## Recursos

- [Mimikatz](https://github.com/gentilkiwi/mimikatz) — credential toolkit.
- [pypykatz](https://github.com/skelsec/pypykatz) — Python offline parser.
- [nanodump](https://github.com/fortra/nanodump) — modern EDR-evasion dumper.
- [HackTricks - LSASS Dumping](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/lsass-secrets-dumping) — comprehensive.
- [The Hacker Recipes - LSASS](https://www.thehacker.recipes/ad/movement/credentials/dumping/lsass) — reference.
- [Microsoft - LSA Protection](https://learn.microsoft.com/windows-server/security/credentials-protection-and-management/configuring-additional-lsa-protection) — vendor.
- [Microsoft - Credential Guard](https://learn.microsoft.com/windows/security/identity-protection/credential-guard/credential-guard) — vendor.
- [SpecterOps - Mimikatz Internals](https://posts.specterops.io/credential-extraction-from-lsass-the-modern-way) — research.
- [MITRE ATT&CK T1003.001](https://attack.mitre.org/techniques/T1003/001/) — LSASS Memory.

***
