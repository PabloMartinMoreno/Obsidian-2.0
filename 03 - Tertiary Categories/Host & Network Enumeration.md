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
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
type: Tertiary Category
---
# Enumeración de Hosts y Redes

***

 ## 🌐 Network Scanning & Discovery
 Identificación de hosts activos, puertos abiertos y servicios básicos en la red.

- [[nmap]] (Herramienta principal para escaneo de puertos y descubrimiento de servicios.)
- [[dig]]
- [[Windows LOTL Port Scanning]] (Técnicas de escaneo de puertos utilizando herramientas nativas de Windows.)
- [[Masscan]] (Escaneo de puertos ultra-rápido para grandes rangos de IP.)
- [[NetBIOS Enumeration (137, 138, 139)]] (Descubrimiento de nombres de equipos, grupos de trabajo y adaptadores de red.)
- [[IPv6 Enumeration]] (Técnicas para enumerar hosts y servicios en redes IPv6.)
- [[Network Device Fingerprinting]] (Identificación de routers, switches, firewalls, etc.)



 ## 🚥 Network Traffic Analysis
 Captura y análisis de paquetes para identificar información y comunicaciones sensibles.

- [[TcpDump]] (Herramienta de línea de comandos para la captura de paquetes.)
- [[Wireshark]] (Analizador de protocolo de red gráfico para análisis detallado.)
- [[Packet Capture for Credentials]] (Técnicas para extraer credenciales en texto plano de capturas de tráfico.)


 ## 📞 Service-Specific Enumeration
 Técnicas detalladas para extraer información de servicios específicos, organizadas por protocolo/función.

 ### File & Remote Access Services
- [[FTP Enumeration (21)]]
- [[SSH Enumeration (22)]]
- [[SMB Enumeration (139, 445)]]
      - [[Interacting with SMB from Windows]] (Uso de herramientas nativas de Windows para interactuar con SMB.)
      - [[RpcClient]] (Herramienta para enumerar información de sistemas Windows vía RPC.)
      - [[Spidering SMB Shares]] (Técnicas para explorar recursos compartidos SMB.)
- [[NFS Enumeration (111, 2049)]]
- [[RDP Enumeration (3389)]]
- [[Rsync Enumeration (873)]]
- [[TFTP Enumeration (69)]]
- [[Telnet Enumeration (23)]] 


 ### Messaging & Directory Services
- [[SMTP Enumeration (25,465,587)]]
       - [[Common SMTP Commands]]
- [[POP3 Enumeration (110, 995)]]
       - [[Common POP3 Commands]]
- [[IMAP Enumeration (143, 993)]]
       - [[Common IMAP Commands]]
- [[LDAP Enumeration (389, 636, 3268, 3269)]]
- [[Kerberos Enumeration (88)]]

  ### Database Services
- [[MSSQL Enumeration (1433, 1434, 2433)]]
       - [[T-SQL Commands Cheatsheet]]
- [[Oracle TNS Enumeration (1521)]]
       - [[SQL*Plus Commands]]
- [[MySQL Enumeration (3306)]]
       - [[SQL Commands]]
- [[PostgreSQL Enumeration (5432)]]
- [[MongoDB Enumeration (27017)]] (Base de datos NoSQL popular.)

  ### Infrastructure & Other Services
- [[DNS Enumeration (53)]]
	- [[dig]]
- [[SNMP Enumeration (161,162,10161,10162)]]
- [[IPMI Enumeration (623)]]
- [[Finger Enumeration (79)]]
  - [[VPN Enumeration]] (Identificación de tipos de VPN y sus puntos de acceso.)
  - [[SCADA/ICS Enumeration]] (Técnicas para descubrir sistemas de control industrial.)


  ## 🛠 General Tools & Concepts
  Herramientas y conceptos auxiliares para la enumeración de red y hosts.

- [[Creds Overview & Management]] (Nota genérica sobre la gestión y el uso de credenciales.)
- [[Enum4linux]] (Herramienta para enumerar información de Windows/Samba desde Linux.)
- [[PowerShell Empire/Csharp Enum Tools]] (Herramientas de enumeración de red para entornos Windows post-compromiso.)

***