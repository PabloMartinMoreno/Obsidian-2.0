---
aliases:
  - NTLM Relay Bypasses
tags:
  - technique/defense-evasion
  - asset/active-directory
  - env/windows
  - cred/ntlm
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Active Directory]]"
kind: SubCheatSheet
linked:
  - "[[NTLM Relay]]"
---
# NTLM Relay - Bypasses y OpSec

> Qué hacer cuando el target tiene protecciones, y cómo no quemarse.

---

## Bypass de Protecciones

| **Protección** | **Bypass** | **Cuándo** |
|:---|:---|:---|
| SMB signing required | No relayeable a SMB → relayar a **LDAP / HTTP / MSSQL** | Target SMB protegido. |
| LDAP signing + channel binding | Cross-protocol (SMB→LDAPS) o EPA bypass | LDAPS con channel binding. |
| EPA (Extended Protection) | Cross-protocol relay (SMB→HTTP, HTTP→LDAPS) si el origen no setea token binding | HTTP endpoints con EPA. |
| MIC enforcement | `ntlmrelayx --remove-mic` (CVE-2019-1040, DCs legacy) | Sin parche de junio 2019. |
| Drop-the-MIC 2 (CVE-2019-1166) | Relay con SPN distinto al original | DCs sin parche. |
^ntlmrelay-bypass

## OpSec y Detección

| **Aspecto** | **Detalle** | **Cuándo** |
|:---|:---|:---|
| Responder es ruidoso | Usar `Analyze` mode primero, luego envenenar selectivo | Recon previo. |
| Coerción deja `4624` + `5145` en el DC | Targeted > mass relay | Reducir huella. |
| Relay a `DC$` genera `4768/4776` anómalos | Evitar relay masivo al DC | OPSEC. |
| EDR detecta `ntlmrelayx` por patrones SMB2 | Preferir relay dirigido | Evasión. |
^ntlmrelay-opsec

## Mitigación (Blue)

- **SMB signing = required** en todos los hosts.
- **LDAP signing + channel binding** obligatorios (KB4520412).
- **EPA** en HTTP endpoints (CertSrv, WSUS, OWA, WinRM).
- **Disable LLMNR/NBT-NS/mDNS** (GPO) y **WPAD**.
- Honeypot SMB shares con auditoría `5140`.
