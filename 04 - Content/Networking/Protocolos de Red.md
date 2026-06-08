---
aliases:
  - Network Protocols
  - UDP
  - TCP/IP
tags:
  - asset/network
primary categories:
  - "[[Red Team]]"
secondary categories:
tertiary categories:
kind: Concept
linked:
---
# Protocolos de Red

> [!info]
> Resumen de protocolos comunes en pentest, por capa OSI/TCP-IP. Cada uno con puertos + uso típico + atacks.

---

## Capa 7 (Application)

| Protocolo | Puertos | Uso | Ataques comunes |
|---|---|---|---|
| HTTP | 80, 8080, 8000 | Web | XSS, SQLi, SSRF, etc. (todo Web) |
| HTTPS | 443, 8443 | Web cifrado | SSL/TLS misconfig, HSTS missing |
| FTP | 21 (ctrl), 20 (data) | File transfer | Anonymous, cleartext sniffing |
| SSH | 22 | Remote shell + tunneling | Brute force, key theft, agent forwarding |
| Telnet | 23 | Remote (cleartext) | Sniffing, default creds |
| SMTP | 25, 465, 587 | Email outgoing | Relay open, user enum (VRFY/RCPT) |
| DNS | 53 (UDP/TCP) | Name resolution | Zone transfer (AXFR), DNS spoofing |
| DHCP | 67/68 (UDP) | IP assignment | Rogue DHCP, DHCPv6 spoofing |
| TFTP | 69 (UDP) | Trivial FTP | Anonymous read/write configs |
| HTTP Proxy | 3128, 8080 | Web proxy | Open proxy, SSRF chain |
| POP3 | 110, 995 | Email retrieve | Brute force |
| IMAP | 143, 993 | Email folder access | Idem |
| LDAP | 389, 636, 3268 | Directory service | LDAP injection, anon bind, null session |
| Kerberos | 88 | AD auth | Roasting, Golden/Silver Ticket |
| SMB | 139, 445 | Windows file share | EternalBlue, null session, PtH |
| RDP | 3389 | Windows remote desktop | BlueKeep, brute, PtH |
| WinRM | 5985 (HTTP), 5986 (HTTPS) | Windows remote mgmt | PSRemoting, PtH |
| MSSQL | 1433 | DB | SQLi, xp_cmdshell |
| MySQL | 3306 | DB | SQLi, INTO OUTFILE |
| PostgreSQL | 5432 | DB | SQLi, COPY FROM PROGRAM |
| Oracle TNS | 1521 | DB | TNS poisoning, brute |
| Redis | 6379 | Cache | Sin auth → CONFIG SET dir → SSH key |
| MongoDB | 27017 | NoSQL | Sin auth → dump |
| Elasticsearch | 9200, 9300 | Search engine | Direct query/dump |
| NFS | 111, 2049 | Network FS | Anonymous mount, no_root_squash |
| SNMP | 161, 162 (UDP) | Network mgmt | Community strings (public/private) |
| RPC | 111, 135 | Remote procedure call | Null session enum |
| IPMI | 623 (UDP) | Out-of-band mgmt | RAKP hash leak, default ADMIN |
| Finger | 79 | Legacy user enum | User existence |
| VNC | 5900 | Remote desktop | Brute, no auth, weak DES |

---

## Capa 4 (Transport)

| Protocolo | Característica |
|---|---|
| TCP | Connection-oriented, handshake 3-way |
| UDP | Connectionless, fire-and-forget |

---

## Capa 3 (Network)

| Protocolo | Uso pentest |
|---|---|
| ICMP | Ping, traceroute, ICMP tunnel exfil |
| IPv4 | Default network |
| IPv6 | Windows prioriza — mitm6 spoofing |
| ARP | LAN MAC↔IP — ARP spoofing/poisoning |

---

## Capa 2 (Data Link)

| Protocolo | Uso |
|---|---|
| Ethernet | LAN |
| VLAN (802.1Q) | Segmentación → VLAN hopping |
| STP | Spanning tree → STP attack |
| LLDP / CDP | Discovery — info leak |
| WPA2/WPA3 | Wireless |

---

## Notas Relacionadas

- [[FTP (21) - Enumeración]]
- [[SSH (22) - Enumeración]]
- [[SMB (139, 445) - Enumeración]]
- [[Port Enumeration]]
- [[Pivoting & Port Forwarding]]
