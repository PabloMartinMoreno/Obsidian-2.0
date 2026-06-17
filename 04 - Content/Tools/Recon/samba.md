---
aliases:
  - "EternalBlue (SMB Vulnerability)"
  - "PrintNightmare (SMB Vulnerability)"
  - "Zerologon (SMB Vulnerability)"
tags:
  - env/linux
  - technique/recon/active
  - asset/file-share
  - tool/samba
  - service/smb
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
kind: Concept
linked:
  - "[[smbclient]]"
  - "[[smbmap]]"
  - "[[SMB (139, 445) - Enumeración]]"
---
# samba

> [!info]
> Suite SMB/CIFS open-source. En pentest: cliente (`smbclient`, `smbmap`) + server-side enum (RID brute, anonymous null sessions). En Linux PrivEsc: misconfigurations de shares server-side.

---

## Componentes

| Tool | Propósito |
|---|---|
| `smbclient` | Cliente FTP-style | [[smbclient]] |
| `smbmap` | Cliente más rico | [[smbmap]] |
| `smbd` | Daemon SMB |
| `nmbd` | NetBIOS naming daemon |
| `winbindd` | Integración AD (NSS) |
| `rpcclient` | Cliente MSRPC | [[RpcClient]] |
| `samba-tool` | Admin Samba AD DC |
| `pdbedit` | Manage local SAM database |

---

## Recon server-side

```bash
# Version + capabilities
smbclient -L //<target> -N
nmap -p 445 --script smb-protocols,smb-security-mode,smb-os-discovery <target>

# RID brute (enum users via SID)
nmap --script smb-brute,smb-enum-users <target>

# Null session enum
rpcclient -U "" <target>
# Within rpcclient:
> enumdomusers
> querydominfo
> netshareenumall
```

---

## CVEs históricos

| CVE | Impacto |
|---|---|
| **EternalBlue** (MS17-010, CVE-2017-0144) | SMBv1 RCE — Win7/2008 |
| **SambaCry** (CVE-2017-7494) | Linux Samba 3.5-4.6 — RCE |
| **CVE-2021-44142** | Samba 4.0-4.13 — VFS module heap overflow |
| **CVE-2022-32744** | Kerberos password change auth bypass |

---

## Server-side misconfigs (Linux Samba PrivEsc)

```ini
# /etc/samba/smb.conf

[homes]
   writable = yes
   browseable = yes
   guest ok = yes      # ← null session escritura
```

Si guest tiene write a `[homes]` con tu user → upload SSH keys, etc.

---

## Notas Relacionadas

- [[smbclient]]
- [[smbmap]]
- [[SMB (139, 445) - Enumeración]]
- [[RpcClient]]
- [[netexec]]
