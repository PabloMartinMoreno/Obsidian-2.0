---
aliases:
  - Custom SSP
  - Malicious SSP
  - memssp
tags:
  - technique/persistence
  - technique/credential-access
  - asset/active-directory
  - env/windows
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: CheatSheet
linked:
  - "[[Custom SSP - Inyección]]"
  - "[[Custom SSP - Recolección]]"
  - "[[Skeleton Key]]"
  - "[[Credential Guard Bypass]]"
---
# Custom SSP

Un **Security Support Provider** (SSP) es un DLL que Windows carga en LSASS para manejar autenticación. Registrar un **SSP malicioso** hace que LSASS le pase **cada credencial en texto plano** al loguearse → captura persistente de passwords, incluso de cuentas que nunca dumpeás. Funciona en cualquier host (DC, server, workstation).

---

## Cheatsheet

### 1. Inyección

````tabs
tab: **En Memoria (memssp)**
![[Custom SSP - Inyección#^cssp-inject-mem]]

tab: **En Disco (mimilib)**
![[Custom SSP - Inyección#^cssp-inject-disk]]
````

### 2. Recolección

````tabs
tab: **Leer Credenciales**
![[Custom SSP - Recolección#^cssp-collect-read]]
````

---

## Overview

A diferencia de dumpear LSASS (snapshot de lo que hay *ahora*), un Custom SSP **captura credenciales a medida que llegan** — cuentas que se loguean después de instalarlo, passwords de servicios al reiniciar, admins que pasan por el host. En un DC, cosecha casi toda autenticación interactiva.

**Ventaja vs Credential Guard:** CredGuard protege los secretos *en reposo* en LSAIso, pero el SSP intercepta la credencial **antes** de ese aislamiento (en el flujo de autenticación) → sigue capturando texto plano → [[Credential Guard Bypass]].

> [!tip] memssp vs mimilib
> `memssp` = en memoria, se pierde al reiniciar (captura puntual). `mimilib.dll` + registro = persistente entre reboots (backdoor real). Ambos escriben log local en texto plano.

> [!warning] Requiere admin/SYSTEM
> Inyectar un SSP necesita privilegios altos en el host. Persistencia/credential-harvesting post-compromiso, no escalada.

---

## Recursos

- [adsecurity.org — Custom SSP persistence](https://adsecurity.org/?p=1760) — Sean Metcalf.
- [The Hacker Recipes — SSP](https://www.thehacker.recipes/ad/persistence/ssp)
