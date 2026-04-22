---
aliases:
  - Service Enumeration
  - Port Enum MOC
tags:
  - type/moc
  - technique/recon/active
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Enumeration]]"
type: MOC
linked:
  - "[[DNS (53) - Enumeración]]"
  - "[[FTP (21) - Enumeración]]"
  - "[[Finger (79) - Enumeración]]"
  - "[[IMAP (143, 993) - Enumeración]]"
  - "[[IPMI (623) - Enumeración]]"
  - "[[LDAP (389, 636, 3268, 3269) - Enumeración]]"
  - "[[MSSQL (1433, 1434, 2433) - Enumeración]]"
  - "[[MySQL (3306) - Enumeración]]"
  - "[[NFS (111, 2049) - Enumeración]]"
  - "[[Oracle TNS (1521) - Enumeración]]"
  - "[[POP3 (110, 995) - Enumeración]]"
  - "[[Kerberos (88) - Enumeración]]"
  - "[[MongoDB (27017) - Enumeración]]"
  - "[[PostgreSQL (5432) - Enumeración]]"
  - "[[Telnet (23) - Enumeración]]"
  - "[[RDP (3389) - Enumeración]]"
  - "[[Rsync (873) - Enumeración]]"
  - "[[SMB (139, 445) - Enumeración]]"
  - "[[SMTP (25,465,587) - Enumeración]]"
  - "[[SNMP (161,162,10161,10162) - Enumeración]]"
  - "[[SSH (22) - Enumeración]]"
  - "[[TFTP (69) - Enumeración]]"
  - "[[nmap]]"
  - "[[rustscan]]"
---
# Port Enumeration

***

## Overview

Índice de técnicas de enumeración por servicio/puerto. Agrupado por familia funcional. Workflow: **`nmap` → identificar puertos abiertos → saltar a la atómica correspondiente**.

Cada atómica cubre banner grabbing, enum activa, default creds, CVEs históricos y rutas de escalada.

***

## Web Adjacent

- [[FTP (21) - Enumeración]] — anon login, bounce attack, `mget *`.
- [[SSH (22) - Enumeración]] — version enum, algoritmos débiles, username enum.
- [[Telnet (23) - Enumeración]] — banner, sniffing cleartext.
- [[RDP (3389) - Enumeración]] — NLA, BlueKeep, cert inspection.

## Mail

- [[SMTP (25,465,587) - Enumeración]] — `VRFY`, `EXPN`, open relay.
- [[POP3 (110, 995) - Enumeración]] — brute force, interceptar tráfico.
- [[IMAP (143, 993) - Enumeración]] — enum de usuarios por respuestas.

## Name Services

- [[DNS (53) - Enumeración]] — AXFR, subdomain brute, reverse lookup.
- [[Finger (79) - Enumeración]] — user enum clásico Unix.

## Databases

- [[MSSQL (1433, 1434, 2433) - Enumeración]] — `xp_cmdshell`, impersonation chains.
- [[MySQL (3306) - Enumeración]] — UDF exploit, credentials en `user` table.
- [[PostgreSQL (5432) - Enumeración]] — `COPY FROM PROGRAM`, superuser commands.
- [[Oracle TNS (1521) - Enumeración]] — TNS poisoning, SID enum.
- [[MongoDB (27017) - Enumeración]] — no-auth default, enum de colecciones.

## File Shares

- [[SMB (139, 445) - Enumeración]] — null session, shares listing, EternalBlue-family.
- [[NFS (111, 2049) - Enumeración]] — showmount, no_root_squash abuse.
- [[Rsync (873) - Enumeración]] — módulos anónimos.
- [[TFTP (69) - Enumeración]] — lectura/escritura sin auth.

## Directory Services

- [[LDAP (389, 636, 3268, 3269) - Enumeración]] — null bind, `ldapsearch`.
- [[Kerberos (88) - Enumeración]] — user enum, AS-REP roasting.

## Management / Monitoring

- [[SNMP (161,162,10161,10162) - Enumeración]] — `snmpwalk`, community strings.
- [[IPMI (623) - Enumeración]] — hash dump pre-auth (CVE-2013-4786).

***

## Flujo típico

1. `nmap -sC -sV -p- -oA scan target` (o `rustscan` si hay prisa).
2. Clasificar puertos abiertos por familia (arriba).
3. Saltar a la atómica del servicio relevante.
4. Anotar versiones para búsqueda de CVEs.
5. Default creds primero, enum activa después.

## Herramientas transversales

- [[nmap]] — scripts NSE cubren gran parte de enum inicial.
- [[Metasploit Framework]] — módulos `auxiliary/scanner/*`.
- [[netexec]] — SMB/LDAP/WinRM/SSH brute + enum unificada.

***
