---
aliases:
  - Nmap
  - Network Mapper
tags:
  - tool/nmap
  - technique/recon/active
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
kind: Command
linked:
  - "[[Port Enumeration]]"
  - "[[Windows LOTL Port Scanning]]"
  - "[[Metasploit Framework]]"
---
# Nmap

***

## Cheatsheet

|**Acción**|**Descripción**|
|---|---|
|`sudo nmap -sS <target> -T4 -v -p-`|Escaneo **TCP SYN** full-port. Requiere root (raw sockets).|
|`sudo nmap -sV <target> -T4 -v -p <ports>`|**Version detection** sobre puertos abiertos.|
|`sudo nmap -sC ...`|**Default NSE scripts** — enumeración por servicio.|
|`sudo nmap -A ...`|**Aggressive**: -sC + -sV + -O + traceroute. Ruidoso.|
|`sudo nmap ... -oA <name>`|Output en **3 formatos**: normal, XML, grepable.|
|`sudo nmap <range> -sn \| grep for \| cut -d" " -f5`|**Ping scan** + extrae IPs vivas.|

**Notas:**
- Sin root → `-sT` (full TCP handshake) en lugar de `-sS`.
- UDP scan → `-sU` o `-sUV` para version.

---

## Overview

**Nmap** — open source network discovery + auditing. Envía raw packets para identificar hosts, puertos, servicios/versiones y SO. Herramienta base del **reconocimiento activo**.

Flags `-sS`, `-sY`, `-sO`, `-O` requieren root/sudo (raw sockets).

---

## Selección de targets

```bash
nmap 10.10.10.10                     # IP única
nmap 10.10.10.0/24                   # CIDR
nmap 10.10.10.1-254                  # rango
nmap target.com                      # DNS
nmap -iL targets.txt                 # desde archivo
nmap 10.10.10.0/24 --exclude 10.10.10.1,10.10.10.254
nmap -iR 100                         # 100 IPs random
```

---

## Host discovery

```bash
nmap -sn 10.10.10.0/24               # ping sweep (no port scan)
nmap -Pn target                       # skip discovery — assume alive
nmap -PS22,80,443 target              # TCP SYN ping a puertos
nmap -PA80 target                     # TCP ACK ping
nmap -PU53 target                     # UDP ping
nmap -PE target                       # ICMP echo
nmap -PR 10.10.10.0/24                # ARP ping (LAN)
nmap --traceroute target
```

En LAN usar ARP (`-PR`) — más rápido + no bloqueable por firewall.

---

## Scan techniques

| Flag | Técnica | Root | Notas |
|---|---|---|---|
| `-sS` | TCP SYN (stealth) | sí | Default privilegiado. Half-open. |
| `-sT` | TCP Connect | no | Full 3WHS. Deja log en víctima. |
| `-sU` | UDP | sí | Lento. Combinar con `-sV` o `--top-ports`. |
| `-sA` | TCP ACK | sí | Firewall mapping (stateful vs stateless). |
| `-sW` | TCP Window | sí | Diferencia filtered/open por WSIZE. |
| `-sM` | TCP Maimon | sí | FIN/ACK — bypass de filtros simples. |
| `-sN` | TCP Null | sí | No flags — bypass *nix stacks. |
| `-sF` | TCP FIN | sí | solo FIN. |
| `-sX` | TCP Xmas | sí | FIN+PSH+URG. |
| `-sY` | SCTP INIT | sí | SCTP services (telco). |
| `-sO` | IP protocol scan | sí | Qué protocolos IP responde. |
| `--scanflags` | Custom TCP flags | sí | `--scanflags SYNFIN`. |

---

## Puertos

```bash
nmap -p 80,443 target
nmap -p 1-1000 target
nmap -p- target                      # full 65535
nmap --top-ports 1000 target
nmap -p T:80,443,U:53,161 target     # TCP+UDP mixto
nmap -p http,https,ssh target        # by service name
nmap --port-ratio 0.1 target         # top X% por probabilidad
nmap -F target                       # fast (top 100)
nmap -r target                       # orden secuencial (no random)
```

---

## Service / version detection

```bash
nmap -sV target
nmap -sV --version-intensity 9 target         # 0=light ... 9=full
nmap -sV --version-all target                 # = intensity 9
nmap -sV --version-light target               # = intensity 2
nmap --version-trace target                   # debug probes
```

---

## OS detection

```bash
nmap -O target
nmap -O --osscan-guess target
nmap -O --osscan-limit target                 # solo si puerto abierto + cerrado
```

`-A` = `-sC -sV -O --traceroute`.

---

## NSE (Nmap Scripting Engine)

### Ejecución

```bash
nmap --script default target           # == -sC
nmap --script safe target
nmap --script vuln target
nmap --script="smb-*" -p 445 target
nmap --script "not intrusive" target
nmap --script "default or safe" target
nmap --script "http-* and not http-brute" target
nmap --script-help <script>
nmap --script-updatedb                  # refrescar DB
```

### Categorías NSE

| Categoría | Uso |
|---|---|
| `auth` | Auth bypass / enum |
| `broadcast` | Descubrimiento LAN |
| `brute` | Brute force |
| `default` | Alias para `-sC` |
| `discovery` | Topology + hosts |
| `dos` | Denial of Service (cuidado) |
| `exploit` | Exploits activos (cuidado) |
| `external` | Consulta APIs externas (leak target) |
| `fuzzer` | Fuzz services |
| `intrusive` | Ruidoso / peligroso |
| `malware` | Backdoors known |
| `safe` | No debería romper nada |
| `version` | Cross con `-sV` |
| `vuln` | Vulnerability check |

### Scripts high-value

**SMB:**
```bash
nmap -p 445 --script "smb-enum-*,smb-os-discovery,smb-security-mode,smb2-security-mode,smb-vuln-*" target
nmap -p 445 --script smb-vuln-ms17-010 target             # EternalBlue
nmap -p 445 --script smb2-vuln-uptime target              # días sin patch
```

**HTTP:**
```bash
nmap -p 80,443 --script "http-title,http-headers,http-methods,http-enum,http-robots.txt,http-favicon"
nmap -p 80,443 --script http-sql-injection target
nmap -p 443 --script ssl-enum-ciphers,ssl-cert,ssl-heartbleed,ssl-poodle target
```

**DNS:**
```bash
nmap -p 53 --script "dns-zone-transfer,dns-recursion,dns-service-discovery" target
nmap --script dns-brute --script-args dns-brute.domain=target.com
```

**FTP / SSH / Telnet:**
```bash
nmap -p 21 --script ftp-anon,ftp-bounce,ftp-syst,ftp-vsftpd-backdoor target
nmap -p 22 --script ssh-auth-methods,ssh-hostkey,ssh2-enum-algos target
nmap -p 23 --script telnet-brute,telnet-encryption,telnet-ntlm-info target
```

**SMTP / POP / IMAP:**
```bash
nmap -p 25,465,587 --script smtp-commands,smtp-enum-users,smtp-open-relay,smtp-vuln-* target
nmap -p 110,995,143,993 --script pop3-capabilities,imap-capabilities,imap-ntlm-info target
```

**SNMP:**
```bash
nmap -sU -p 161 --script snmp-info,snmp-interfaces,snmp-processes,snmp-win32-software,snmp-brute target
```

**LDAP:**
```bash
nmap -p 389,636 --script ldap-search,ldap-rootdse,ldap-novell-getpass target
```

**MSSQL / MySQL / PostgreSQL:**
```bash
nmap -p 1433 --script ms-sql-info,ms-sql-ntlm-info,ms-sql-empty-password,ms-sql-xp-cmdshell target
nmap -p 3306 --script mysql-empty-password,mysql-users,mysql-databases,mysql-info target
nmap -p 5432 --script pgsql-brute target
```

**RDP:**
```bash
nmap -p 3389 --script rdp-enum-encryption,rdp-ntlm-info,rdp-vuln-ms12-020 target
```

**Kerberos:**
```bash
nmap -p 88 --script krb5-enum-users --script-args krb5-enum-users.realm='domain.local',userdb=users.txt target
```

**NFS:**
```bash
nmap -p 111,2049 --script nfs-ls,nfs-showmount,nfs-statfs target
```

**IPMI (CVE-2013-4786):**
```bash
nmap -sU -p 623 --script ipmi-version,ipmi-cipher-zero,ipmi-brute target
```

### Script args

```bash
nmap --script http-brute --script-args userdb=u.txt,passdb=p.txt -p 80 target
nmap --script smb-brute --script-args smbdomain=domain.local,smbuser=u,smbpass=p -p 445 target
```

---

## Timing / performance

```bash
-T0   # paranoid  (5 min entre probes)
-T1   # sneaky    (15s)
-T2   # polite    (0.4s)
-T3   # normal    (default)
-T4   # aggressive  — estándar para CTF/lab
-T5   # insane     — solo en LAN confiable

--min-rate 1000                  # paquetes/seg mínimo
--max-rate 500                   # techo
--min-parallelism 10
--max-parallelism 100
--max-retries 2
--host-timeout 30m
--scan-delay 1s                  # entre probes
--max-scan-delay 10s
```

---

## Evasión de firewall / IDS

```bash
-f                               # fragmenta paquetes
-f -f                            # fragmentos más pequeños
--mtu 16                         # MTU custom (múltiplo de 8)
-D RND:10                        # 10 IPs decoy random
-D 1.1.1.1,8.8.8.8,ME            # decoys específicos
-S <spoof_ip>                    # spoof source (requiere ruta de retorno)
--source-port 53 / -g 53         # spoof source port (bypass firewalls)
--data-length 200                # padding random
--randomize-hosts
--spoof-mac Apple                # MAC fingerprint spoof
--spoof-mac 0                    # MAC random
--badsum                         # checksum inválido (detecta IDS vs host)
--proxies http://proxy:8080      # proxy TCP (limitado)
--ttl 100
```

---

## Output

```bash
-oN normal.txt                   # normal
-oX xml.xml                      # XML (feed a herramientas)
-oG grep.gnmap                   # grepable (awk-friendly)
-oS screamer.txt                 # scriptkiddie
-oA prefix                       # los 3 con el mismo prefix
--stylesheet nmap.xsl            # HTML via XSL
-v / -vv / -vvv                  # verbose
-d / -dd                         # debug
--reason                         # por qué puerto marcado así
--open                           # solo puertos abiertos
--packet-trace                   # cada paquete
--append-output                  # no sobreescribir
```

### Conversión XML

```bash
xsltproc scan.xml -o scan.html
# O con nmap-parse
ruby /opt/tools/nmap-parse-output/nmap-parse-output scan.xml web
searchsploit --nmap scan.xml       # auto-search exploits
```

---

## Paralelizado / rápido

```bash
# Fase 1: descubrir puertos rápido
nmap -p- --min-rate 5000 -T4 -Pn -n --open -oG fast.gnmap target
# Fase 2: profundizar en los abiertos
ports=$(grep -oP '\d+/open' fast.gnmap | cut -d/ -f1 | sort -u | tr '\n' ,)
nmap -sC -sV -p $ports -oA deep target
```

Alternativa para velocidad extrema: **rustscan** → pipe a nmap.

```bash
rustscan -a target -- -sC -sV
```

---

## Scripting / programmatic

### XML parse con Python

```python
from libnmap.parser import NmapParser
rep = NmapParser.parse_fromfile('scan.xml')
for h in rep.hosts:
    for s in h.services:
        if s.open(): print(h.address, s.port, s.service, s.banner)
```

### Feed a otras tools

```bash
impacket-psexec user:pass@$(grep -oP '\d+/open/tcp//microsoft-ds' scan.gnmap | ...)
msfconsole -qx "db_import scan.xml; services; exit"
```

Ver [[Metasploit Framework]] DB import.

---

## Living-off-the-land alternatives

Si en host comprometido no hay nmap:

- **Windows**: `Test-NetConnection -Port N`, `PortQry`, `powercat`, [[Windows LOTL Port Scanning]].
- **Linux**: `/dev/tcp` bash built-in, `ncat`, `curl`, `python -c "import socket..."`.

```bash
# Bash TCP scan LOTL
for p in 22 80 443 445; do (echo >/dev/tcp/10.10.10.10/$p) 2>/dev/null && echo "open: $p"; done
```

---

## Opsec

- `-sS` deja conn a medio-abrir en stateful firewalls → logea.
- `--reason --packet-trace --badsum` útiles para fingerprint del defensor.
- Evitar `-T4/-T5` en engagements con IDS moderno.
- NSE con categoría `intrusive` / `exploit` = autorización explícita.
- `-Pn` (skip discovery) si ICMP bloqueado — pero mucho scan en "host down" → wasted.

---

## Notas Relacionadas

- **[[Windows LOTL Port Scanning]]**: Instalar Nmap en una máquina Windows comprometida puede no ser viable; en ese caso, el escaneo de puertos debe realizarse aprovechando herramientas ya presentes en el sistema (_living off the land_).

---

## Referencias

- Docs oficiales: https://nmap.org/book/
- NSE docs: https://nmap.org/nsedoc/
- nmap-parse-output: https://github.com/ernw/nmap-parse-output
