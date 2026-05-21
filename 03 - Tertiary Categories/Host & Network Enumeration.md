---
aliases:
  - Enumeración de Hosts y Redes
tags:
  - type/moc/tertiary
  - technique/recon/active
  - asset/network
  - meta/index
  - meta/checklist
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
kind: Tertiary Category
---
# Enumeración de Hosts y Redes

***

 ## 🌐 Network Scanning & Discovery
 Identificación de hosts activos, puertos abiertos y servicios básicos en la red.

- [[Port Scanning & Service Discovery]] (nmap, masscan)
- [[Windows LOTL Port Scanning]] (Técnicas de escaneo de puertos utilizando herramientas nativas de Windows.)
- [[NetBIOS Enumeration (137, 138, 139)]] (Descubrimiento de nombres de equipos, grupos de trabajo y adaptadores de red.)
- [[IPv6 Enumeration]] (Técnicas para enumerar hosts y servicios en redes IPv6.)
- [[Network Device Fingerprinting]] (Identificación de routers, switches, firewalls, etc.)


 ## 🚥 Network Traffic Analysis
 Captura y análisis de paquetes para identificar información y comunicaciones sensibles.

- [[Packet Capture & Analysis]] (tcpdump, wireshark)
- [[Packet Capture for Credentials]] (Técnicas para extraer credenciales en texto plano de capturas de tráfico.)


 ## 📞 Service-Specific Enumeration
 Técnicas detalladas para extraer información de servicios específicos, organizadas por protocolo/función.

 ### File & Remote Access Services
- [[FTP (21) - Enumeración]]
- [[SMB (139, 445) - Enumeración]]
- [[NFS (111, 2049) - Enumeración]]
- [[TFTP (69) - Enumeración]]

### Remote Access & Shell Services
- [[SSH (22) - Enumeración]]
- [[RDP (3389) - Enumeración]]
- [[Telnet (23) - Enumeración]] 
- [[Rsync (873) - Enumeración]]

 ### Messaging & Directory Services
- [[SMTP (25,465,587) - Enumeración]]
- [[POP3 (110, 995) - Enumeración]]
- [[IMAP (143, 993) - Enumeración]]
- [[LDAP (389, 636, 3268, 3269) - Enumeración]]
- [[Kerberos (88) - Enumeración]]

  ### Database Services
- [[MSSQL (1433, 1434, 2433) - Enumeración]]
- [[Oracle TNS (1521) - Enumeración]]
- [[MySQL (3306) - Enumeración]]
- [[PostgreSQL (5432) - Enumeración]]
- [[MongoDB (27017) - Enumeración]] (Base de datos NoSQL popular.)

  ### Infrastructure & Other Services
- [[DNS (53) - Enumeración]]
- [[SNMP (161,162,10161,10162) - Enumeración]]
- [[IPMI (623) - Enumeración]]
- [[Finger (79) - Enumeración]]
- [[VPN - Enumeración]] (Identificación de tipos de VPN y sus puntos de acceso.)
- [[ICS - Enumeración]] (Técnicas para descubrir sistemas de control industrial.)


***