---
aliases:
  - AD Security Controls Enumeration
  - Defensive Controls Discovery
  - AD Hardening Recon
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Active Directory Enumeración]]"
kind: CheatSheet
linked:
  - "[[AD - LAPS Enumeration]]"
  - "[[AD - gMSA Enumeration]]"
  - "[[AMSI Bypasses]]"
  - "[[Credential Guard Bypass]]"
---
# AD - Security Controls Enumeration

> Variables: `DC=dc01.corp.local`, `DOM=corp.local`, `U=user`, `P=pass`. Mapear las defensas **antes** de atacar evita quemar credenciales y disparar herramientas detectables.

---

## Cheatsheet

### 1. Recon Rápido (Probes)

```bash
# Census defensivo remoto con netexec
nxc smb $DC -u $U -p $P --signing                # SMB signing (relay viable?)
nxc ldap $DC -u $U -p $P -M maq                  # ms-DS-MachineAccountQuota
nxc ldap $DC -u $U -p $P -M ldap-signing         # LDAP signing / channel binding
nxc ldap $DC -u $U -p $P -M laps                 # LAPS desplegado + lectura
nxc smb TARGETS -u $U -p $P -M enum_av           # AV/EDR por host
nxc ldap $DC -u $U -p $P -M adcs                 # AD CS presente (superficie ESCx)
```

### 2. Enumeración

#### 🛡️ Endpoint Protection (Defender / AMSI / EDR)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `Get-MpComputerStatus \| select AMSIEnabled,RealTimeProtectionEnabled,IsTamperProtected` | Estado de Defender + AMSI + Tamper Protection | Desde host dominado. |
| `Get-MpPreference \| select DisableRealtimeMonitoring,ExclusionPath,ExclusionProcess` | Exclusiones de Defender (carpetas/procesos donde dropear) | Buscar dónde ejecutar sin detección. |
| `[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils')` | Confirma AMSI cargado en la sesión PS | Pre-bypass AMSI → [[AMSI Bypasses]]. |
| `reg query "HKLM\SOFTWARE\Policies\Microsoft\Windows Defender" /s` | Política de Defender vía GPO | Defender deshabilitado por política. |
| `nxc smb TARGETS -u $U -p $P -M enum_av` | Producto AV/EDR instalado por host | Recon masivo antes de ejecutar payloads. |
| `Get-Service \| ? {$_.DisplayName -match 'defender\|crowdstrike\|sentinel\|carbon\|cylance\|cortex'}` | Servicios EDR corriendo | Fingerprint del EDR concreto. |
| `Get-CimInstance -Namespace root/SecurityCenter2 -Class AntiVirusProduct` | AV registrado en Security Center | Workstations no-server. |

#### 🔒 LSASS Protection (Credential Guard / RunAsPPL)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `reg query HKLM\SYSTEM\CurrentControlSet\Control\LSA /v RunAsPPL` | `1` → LSASS corre como PPL (mimikatz directo bloqueado) | Antes de dumpear LSASS. |
| `reg query "HKLM\SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity" /v Enabled` | HVCI activo (base de Credential Guard) | Detecta virtualization-based security. |
| `reg query "HKLM\SYSTEM\CurrentControlSet\Control\LSA" /v LsaCfgFlags` | `1`/`2` → Credential Guard ON | Sin creds en texto plano en LSASS → [[Credential Guard Bypass]]. |
| `Get-CimInstance -ClassName Win32_DeviceGuard -Namespace root\Microsoft\Windows\DeviceGuard` | Estado completo DeviceGuard/CredGuard | Confirmación detallada. |
| `bcdedit /enum \| findstr -i hypervisor` | Hypervisor presente (VBS) | Workstation con CredGuard. |

#### 🚫 Application Control (AppLocker / WDAC)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `Get-AppLockerPolicy -Effective -Xml` | Política AppLocker efectiva (reglas Exe/Script/MSI/DLL) | Buscar paths permitidos para LOLBins. |
| `reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\SrpV2 /s` | Reglas AppLocker en el registro | Si falla el cmdlet. |
| `[xml]$p = Get-AppLockerPolicy -Effective -Xml; $p.AppLockerPolicy.RuleCollection` | Reglas parseadas → directorios escribibles permitidos | Bypass por path writable (`C:\Windows\Tasks`, etc.). |
| `Get-CimInstance -Namespace root\Microsoft\Windows\DeviceGuard -ClassName Win32_DeviceGuard \| select CodeIntegrityPolicyEnforcementStatus` | WDAC en enforce (2) vs audit (1) | WDAC más estricto que AppLocker. |
| `Get-WinEvent -LogName 'Microsoft-Windows-AppLocker/EXE and DLL' -MaxEvents 20` | Qué bloqueó AppLocker (8004) vs auditó (8003) | Distinguir enforce de audit-only. |

#### 📡 Protocolos y Relay (SMB / LDAP Signing, MAQ)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `nxc smb $DC -u $U -p $P --signing` | SMB signing required? | `False` → NTLM relay SMB viable. |
| `nxc ldap $DC -u $U -p $P -M ldap-signing` | LDAP signing / channel binding | Sin enforce → relay a LDAP (RBCD, Shadow Creds). |
| `nxc ldap $DC -u $U -p $P -M maq` | `ms-DS-MachineAccountQuota` (default 10) | `>0` → crear máquina para RBCD / Shadow Credentials. |
| `Get-DomainObject -Identity $DOM -Properties ms-DS-MachineAccountQuota` | MAQ vía PowerView | Confirmación desde host dominado. |
| `Get-DomainPolicyData \| select -Expand SystemAccess` | Política de contraseñas/lockout del dominio | Calcular ritmo de password spray seguro. |

#### 🔑 Credenciales Gestionadas (LAPS / gMSA)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `nxc ldap $DC -u $U -p $P -M laps` | LAPS desplegado + quién puede leerlo | Detalle completo: [[AD - LAPS Enumeration]]. |
| `Get-DomainComputer -LDAPFilter '(ms-Mcs-AdmPwd=*)' -Properties name` | Hosts con LAPS y password legible por vos | Lectura: [[AD - LAPS Enumeration]]. |
| `Get-DomainObject -LDAPFilter '(objectClass=msDS-GroupManagedServiceAccount)'` | gMSA en el dominio | Dump de password: [[AD - gMSA Enumeration]]. |
| `nxc ldap $DC -u $U -p $P -M adcs` | AD CS / plantillas de certificado | Superficie ESC1-ESC15. |

---

## Overview

Antes de ejecutar herramientas ruidosas (SharpHound, mimikatz, payloads) conviene **mapear qué defensas tiene el entorno** para elegir TTPs que no se quemen. Esta enumeración cubre las protecciones que más condicionan un ataque AD:

- **Endpoint (Defender/AMSI/EDR):** determina si podés ejecutar tooling en memoria o necesitás bypass/obfuscación. Las **exclusiones** de Defender son oro (dónde dropear sin escaneo).
- **LSASS Protection (RunAsPPL / Credential Guard):** decide si el dump de credenciales clásico funciona o requiere bypass de PPL / no hay creds en texto plano.
- **Application Control (AppLocker/WDAC):** define qué binarios/scripts podés ejecutar; las reglas por path writable habilitan bypass con LOLBins.
- **Protocolos (SMB/LDAP signing, MAQ):** habilitan o cierran relay (NTLM→SMB/LDAP) y la creación de cuentas máquina para RBCD/Shadow Credentials.
- **Credenciales gestionadas (LAPS/gMSA) y AD CS:** superficie de lectura de secretos y de abuso de certificados.

> [!tip] Orden recomendado
> Probes rápidos remotos (netexec) → si caés en un host, census local (Defender/PPL/AppLocker) → recién ahí elegir el vector. Cada control encontrado redirige a su nota: [[AD - LAPS Enumeration]], [[AD - gMSA Enumeration]], [[AMSI Bypasses]], [[Credential Guard Bypass]].

---

## Recursos

- [The Hacker Recipes — AD](https://www.thehacker.recipes/ad/) — referencia de TTPs y defensas.
- [HackTricks — AD Methodology](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology) — checklist de enum.
- [Microsoft — Credential Guard](https://learn.microsoft.com/windows/security/identity-protection/credential-guard/) — cómo funciona la protección de LSASS.
- [LOLBAS Project](https://lolbas-project.github.io/) — binarios para bypass de AppLocker.