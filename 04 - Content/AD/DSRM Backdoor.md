---
aliases:
  - DSRM Backdoor
  - Directory Services Restore Mode
  - DSRM Abuse
tags:
  - technique/persistence
  - asset/active-directory
  - env/windows
  - cred/ntlm
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: CheatSheet
linked:
  - "[[DSRM Backdoor - Lectura del Hash]]"
  - "[[DSRM Backdoor - Backdoor y Re-entry]]"
  - "[[Pass-the-Hash]]"
  - "[[Skeleton Key]]"
---
# DSRM Backdoor

**DSRM** (Directory Services Restore Mode) es el modo de recuperación de un DC; su cuenta de administrador es **local al DC** (vive en el SAM, independiente de AD) y su password casi nunca rota. El backdoor: leer/setear ese hash y habilitar `DsrmAdminLogonBehavior=2` para **login remoto** → acceso persistente al DC vía Pass-the-Hash, sobreviviendo a resets de cuentas de dominio.

---

## Cheatsheet

### 1. Lectura del Hash

````tabs
tab: **Leer Hash DSRM**
![[DSRM Backdoor - Lectura del Hash#^dsrm-read-hash]]
````

### 2. Backdoor y Re-entry

````tabs
tab: **Habilitar Backdoor**
![[DSRM Backdoor - Backdoor y Re-entry#^dsrm-backdoor-enable]]

tab: **Re-entry (PtH local)**
![[DSRM Backdoor - Backdoor y Re-entry#^dsrm-backdoor-reentry]]
````

---

## Overview

La cuenta DSRM es un **administrador local del DC** que los resets masivos post-incidente suelen **olvidar** (no es cuenta de dominio). Con `DsrmAdminLogonBehavior=2` puede autenticarse por red.

**Persistencia robusta:** sobrevive a reset de krbtgt, cambios de password de dominio y limpieza de cuentas AD. La defensa tiene que acordarse específicamente de rotar la password DSRM (`ntdsutil`).

> [!tip] Diferencia con [[Skeleton Key]]
> Skeleton Key parchea LSASS en memoria (se pierde al reiniciar el DC). DSRM es **persistente en disco** (registro + SAM) → sobrevive reboots.

> [!warning] Requiere DA + acceso al DC
> Leer el SAM local del DC y escribir el registro LSA necesitan admin en el DC. Es persistencia post-compromiso, no escalada.

---

## Recursos

- [adsecurity.org — DSRM persistence](https://adsecurity.org/?p=1714) — Sean Metcalf.
- [The Hacker Recipes — DSRM](https://www.thehacker.recipes/ad/persistence/dsrm)
