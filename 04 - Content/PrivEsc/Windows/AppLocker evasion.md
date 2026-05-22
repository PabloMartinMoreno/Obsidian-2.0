---
aliases:
  - AppLocker Bypass
tags:
  - estado/completo
  - env/windows
  - technique/defense-evasion
kind: Technique
linked:
  - "[[AMSI Bypasses]]"
---
# AppLocker evasion

> [!info]
> AppLocker = Windows feature que restringe ejecución de binarios a allowlist (path/publisher/hash). Bypass: ejecutar desde directorios permitidos, abuse de LOLBins firmados por MS, DLL hijacking en path allowed.

***

## Enum reglas

```powershell
Get-AppLockerPolicy -Effective -Xml
Get-AppLockerPolicy -Effective | Format-List

# Identificar binarios bloqueados vs allowed
$rules = Get-AppLockerPolicy -Effective
$rules.RuleCollections | ForEach-Object { $_.Conditions }
```

***

## Path bypass

Default rules dejan ejecutar desde:
- `C:\Windows\*`
- `C:\Program Files\*`
- `C:\Program Files (x86)\*`

**Subdirs writable** en `C:\Windows\`:
- `C:\Windows\Tasks` (writable por Users)
- `C:\Windows\Temp` (a veces writable)
- `C:\Windows\System32\spool\drivers\color`
- `C:\Windows\Tracing`

```cmd
copy attacker.exe C:\Windows\Tasks\
C:\Windows\Tasks\attacker.exe
```

***

## LOLBins (Living Off The Land Binaries)

Binarios firmados por MS que ejecutan código:

- `MSBuild.exe` — XML con C# inline → RCE
- `InstallUtil.exe` — .NET binary
- `regsvr32.exe` — SCT script over HTTP
- `mshta.exe` — HTA execution
- `rundll32.exe` — DLL functions
- `powershell.exe` — si no bloqueado por CLM/Constrained
- `cmstp.exe` — INF execution
- `wmic.exe` — XSL transform

Lista completa: https://lolbas-project.github.io/

***

## PowerShell ConstrainedLanguage Mode bypass

```powershell
$ExecutionContext.SessionState.LanguageMode  # check

# Bypasses:
# 1. PowerShell 2 (sin CLM)
powershell -version 2

# 2. AMSI bypass + reflection
# Ver [[AMSI Bypasses]]
```

***

## DLL Hijacking en path allowed

Encontrar app que carga DLL sin path completo y replace con malicious DLL en current dir / PATH.

```cmd
:: ProcMon para detectar DLL load attempts en NAME NOT FOUND
:: Plantar DLL malicioso firmado (si publisher rule) o en path allowed
```

***

## Notas Relacionadas

- [[AMSI Bypasses]]
- [[Windows Privilege Escalation]]
- [[Reflective PowerShell Shellcode Runner]]
