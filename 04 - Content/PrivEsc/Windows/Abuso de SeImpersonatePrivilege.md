---
aliases:
  - "Abuso de SeImpersonatePrivilege (Ataques \"Potato\")"
  - Potato Attacks
  - SeImpersonatePrivilege
tags:
  - estado/completo
  - asset/active-directory
  - env/windows
  - technique/privilege-escalation
kind: Technique
linked:
  - "[[Windows Privilege Escalation]]"
---
# Abuso de SeImpersonatePrivilege (Ataques "Potato")

> [!info]
> User con `SeImpersonatePrivilege` (típico en service accounts: IIS AppPool, SQL Server, etc.) puede escalar a SYSTEM via la familia de exploits "Potato" que abusan NTLM relay local.

***

## Detección del privilegio

```cmd
whoami /priv | findstr SeImpersonate
```

Si presente y enabled → potato candidates.

Common service accounts con SeImpersonate:
- `IIS APPPOOL\<pool>`
- `NT SERVICE\MSSQL$<inst>`
- `NT AUTHORITY\NETWORK SERVICE`
- `NT AUTHORITY\LOCAL SERVICE`

***

## Familia "Potato"

| Variant | Año | Mecanismo | Aplicable |
|---|---|---|---|
| **Hot Potato** | 2016 | WPAD + NBT-NS + HTTP→SMB relay | Win7-2012R2 |
| **Rotten Potato** | 2016 | DCOM + COM-to-NTLM relay local | Win 7-10 (early) |
| **Lonely Potato** | 2017 | Variante de Rotten sin SeAssign | Mismo |
| **Juicy Potato** | 2018 | COM CLSID iteration + Print Service | Win 7-Server 2019 (pre-Defender block) |
| **Rogue Potato** | 2020 | Fake OXID resolver via local socket | Win 10 1809+ |
| **Generic Potato** | 2020 | Relay NTLM cualquier protocolo | Genérico |
| **Sweet Potato** | 2020 | Combina BITS + COM | Modern |
| **God Potato** | 2022 | COM + RPC mejorado | Win 8.1-11 / 2012-2022 |
| **Print Spoofer** | 2020 | Print Spooler + OXID | Win 10 1809+, Server 2019/2022 |
| **EFS Potato (PetitPotam local)** | 2021 | EFSRPC | Modern |

***

## Ejecución típica

```cmd
:: PrintSpoofer (más confiable en Win10/Server 2019+)
PrintSpoofer.exe -i -c "cmd"

:: GodPotato (multi-version)
GodPotato.exe -cmd "cmd /c whoami"

:: JuicyPotato (legacy, requiere CLSID válido per OS)
JuicyPotato.exe -l 1337 -p c:\windows\system32\cmd.exe -t * -c <CLSID>
```

CLSIDs útiles JuicyPotato: https://ohpe.it/juicy-potato/CLSID/

***

## Mitigación

- Microsoft mitigó parcialmente con Windows 10 1809+ (DCOM hardening).
- PrintSpoofer requiere Print Spooler enabled.
- Modern variants siguen funcionando en Server 2022 sin parches específicos.

***

## Notas Relacionadas

- [[Windows Privilege Escalation]]
- [[NTLM Relay]]
- [[Authentication Coercion]]
