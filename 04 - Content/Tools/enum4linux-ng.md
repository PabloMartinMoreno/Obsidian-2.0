---
aliases:
  - enum4linux-ng
  - enum4linux
  - e4lng
tags:
  - tool/enum4linux
  - technique/recon/active
  - technique/enumeration
  - service/smb
  - service/rpc
  - env/windows
  - env/active-directory
primary categories:
  - '[[Red Team]]'
secondary categories:
  - '[[Information Gathering]]'
tertiary categories:
  - '[[Host & Network Enumeration]]'
kind: Tool
linked:
  - '[[SMB (139, 445) - Enumeración]]'
  - '[[smbclient]]'
  - '[[smbmap]]'
  - '[[RpcClient]]'
  - '[[netexec]]'
---

# enum4linux-ng

***

## Overview

Reescritura Python de **enum4linux** (Mark Lowe, 2002) por **CD-Soft**. Wrapper sobre **Samba tools** (`smbclient`, `rpcclient`, `nmblookup`, `ldapsearch`, `polenum`) + libs Impacket. Enum SMB/RPC/LDAP/NetBIOS centralizado.

Install: `pipx install enum4linux-ng` / `git clone https://github.com/cddmp/enum4linux-ng && pip install -r requirements.txt`.

> Regla: enum4linux-ng es el **primer command** post-port scan en cualquier host Windows/AD con SMB abierto. Rápido para baseline. Cubre null session, guest, y auth.

***

## Sintaxis base

```bash
enum4linux-ng [-A | -As] [opciones] <target>
enum4linux-ng -u <user> -p <pass> <target>
enum4linux-ng -u <user> -p <pass> -d <domain> <target>
enum4linux-ng -u <user> -H <NThash> <target>      # Pass-the-Hash
```

`-A` = all enum standard. `-As` = all + share check (más lento, más completo).

***

## Flags principales

| Flag | Qué hace |
|---|---|
| `-A` | All checks (default recommended). |
| `-As` | All + share access detallado. |
| `-U` | User enumeration. |
| `-G` | Group enumeration. |
| `-S` | Share enumeration. |
| `-P` | Password policy. |
| `-O` | OS info. |
| `-L` | LDAP info (BaseDN, naming contexts). |
| `-I` | Printer info (server). |
| `-R [range]` | RID cycling (default 500-550, 1000-1050; specify range). |
| `-N` | Null session checks only. |
| `-u <user>` | Username. |
| `-p <pass>` | Password. |
| `-d <domain>` | Dominio (sino, auto-detect). |
| `-H <hash>` | NT hash (Pass-the-Hash). |
| `-K <ticket>` | Kerberos ccache. |
| `-w <workgroup>` | Workgroup override. |
| `-oA <prefix>` | Output JSON + YAML con prefix. |
| `-v` | Verbose. |
| `--shares-file <list>` | Shares específicos para test (override autodetect). |
| `--users-file <list>` | Users para enum / brute. |
| `-t <sec>` | Timeout per check. |
| `-r N` | Retries. |

***

## Null session (pre-creds)

Windows 2003 era → null sessions enabled. Windows 2008+ → casi siempre disabled, pero IPC$ a veces accessible.

```bash
enum4linux-ng -A 10.10.10.10
enum4linux-ng -N 10.10.10.10                    # solo null checks
```

Si null funciona: enum users, groups, shares, password policy **sin** creds. Win win.

***

## Auth (post-creds)

```bash
enum4linux-ng -A -u alice -p 'Passw0rd' 10.10.10.10
enum4linux-ng -A -u alice -p 'Passw0rd' -d domain.local <DC>
enum4linux-ng -A -u alice -H ':<NThash>' 10.10.10.10        # PtH
```

Con creds: full enum incluso si null disabled.

***

## RID cycling

Bypassea `RestrictAnonymous` para enum de SIDs → resolve users/groups via RID brute.

```bash
enum4linux-ng -R 10.10.10.10                       # rangos default
enum4linux-ng -R 500-20000 10.10.10.10             # rango ampliado
enum4linux-ng -R 1000-50000 -u alice -p p 10.10.10.10
```

Output: `S-1-5-21-...-500 = Administrator (User)`, `S-1-5-21-...-1104 = j.smith (User)`, etc.

***

## Workflow típico

### Fase 1 — Pre-creds, target desconocido

```bash
# Triage rápido — guarda JSON para reusar
enum4linux-ng -As 10.10.10.10 -oA e4lng_target

# Si null sessions: revisar enum_users, enum_shares en output
cat e4lng_target.json | jq '.users'
cat e4lng_target.json | jq '.shares'

# Si users obtenidos sin creds → kerbrute spray
jq -r '.users | keys[]' e4lng_target.json > users.txt
kerbrute passwordspray -d domain.local --dc <DC> users.txt 'Spring2026!' --safe
```

### Fase 2 — Con creds low-priv

```bash
enum4linux-ng -As -u alice -p p -d domain.local <DC> -oA e4lng_authed

# Output exhaustive: users, groups, shares + R/W permissions, GPP, etc.
```

### Fase 3 — Targeted

```bash
# Solo users
enum4linux-ng -U -u alice -p p <DC>

# Solo shares (rápido check)
enum4linux-ng -S -u alice -p p <target>

# Solo password policy (importante PRE-spray)
enum4linux-ng -P -u alice -p p <DC>
```

***

## Output

JSON estructurado (recomendado para parsing):

```bash
enum4linux-ng -A target -oA scan
# Output: scan.json + scan.yaml
```

Sections típicas en JSON:

```
.target
.nbtstat             (NetBIOS names)
.smb_dialects        (SMB1/2/3 support)
.smb_signing
.sessions            (null/guest/userpass success/fail)
.ldap_info           (BaseDN, naming contexts)
.os_info             (OS version, build)
.users               (key=username, value={rid, info})
.groups
.shares              (share name → {access, comment})
.password_policy     (min len, complexity, lockout threshold)
.printers
.rid_cycling
```

Parse con `jq` o Python para integrar a otros tools.

***

## Comparación con alternativas

| Tool | Pros | Cons |
|---|---|---|
| **enum4linux-ng** | One-shot, JSON output, RID cycling default, mantenido | Sobrelapamiento con nxc |
| `enum4linux` (original Perl) | Histórico | Sin mantenimiento, output desordenado |
| `nxc smb --users --groups --shares --pass-pol` | Mismo info + execution | Menos detail en RID cycling |
| `rpcclient` manual | Más control fino | Requiere muchos comandos sucesivos |
| `smbmap` | Mejor para spider shares | No enum users/groups |
| `ldapsearch` | LDAP nativo, queries custom | Solo LDAP, requiere syntax |

Default: **enum4linux-ng -As** primero → si necesitás profundizar en algo específico → tool dedicada (`smbmap` para spider, `bloodhound-python` para AD graph, `ldapsearch` para queries custom).

***

## Tips

- **Cuidado con `-R` masivo**: rango 500-50000 = 50k AS-REQ-style queries. Lento + detectable.
- **`-S` solo (sin `-A`)**: en hosts con muchos shares listables, baseline rápido sin RID brute.
- **JSON parsing**: invertir tiempo en `jq` selectors → reutilizar JSONs en pipelines de spray/exploit.
- **Falsos negativos en shares**: enum4linux a veces marca "ACCESS DENIED" cuando el user igual puede acceder vía path completo. Confirmar con `smbclient` directo.
- **Combinar con nxc**: enum4linux-ng para deep + nxc para múltiples targets en paralelo (`-tf hosts.txt`).

***

## OPSEC

- Genera tráfico SMB/RPC/LDAP variado — fingerprint claro de enum tool.
- RID cycling = burst SAMR queries → SIEM patterns típicos.
- Null session checks → 4624 Anonymous Logon events.
- LDAP queries con base completa → 4662 LDAP search events.
- Para stealth: usar nxc con `--continue-on-success` y solo módulos específicos, en vez de `-A` masivo.

***

## Referencias

- Repo: https://github.com/cddmp/enum4linux-ng
- enum4linux original: https://github.com/CiscoCXSecurity/enum4linux
- Polenum (password policy): https://github.com/Wh1t3Fox/polenum
