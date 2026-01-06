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
type: Tertiary Category
---
# Enumeración de Hosts y Redes

***

 ## 🌐 Network Scanning & Discovery
 Identificación de hosts activos, puertos abiertos y servicios básicos en la red.

- [[nmap]] (Herramienta principal para escaneo de puertos y descubrimiento de servicios.)
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
- [[FTP (21) - Enumeración]]
- [[SSH (22) - Enumeración]]
- [[SMB (139, 445) - Enumeración]]
      - [[Interacting with SMB from Windows]] (Uso de herramientas nativas de Windows para interactuar con SMB.)
      - [[RpcClient]] (Herramienta para enumerar información de sistemas Windows vía RPC.)
      - [[Spidering SMB Shares]] (Técnicas para explorar recursos compartidos SMB.)
- [[NFS (111, 2049) - Enumeración]]
- [[RDP (3389) - Enumeración]]
- [[Rsync (873) - Enumeración]]
- [[TFTP (69) - Enumeración]]
- [[Telnet (23) - Enumeración]] 


 ### Messaging & Directory Services
- [[SMTP (25,465,587) - Enumeración]]
       - [[Common SMTP Commands]]
- [[POP3 (110, 995) - Enumeración]]
       - [[Common POP3 Commands]]
- [[IMAP (143, 993) - Enumeración]]
       - [[Common IMAP Commands]]
- [[LDAP (389, 636, 3268, 3269) - Enumeración]]
- [[Kerberos (88) - Enumeración]]

  ### Database Services
- [[MSSQL (1433, 1434, 2433) - Enumeración]]
       - [[T-SQL Commands Cheatsheet]]
- [[Oracle TNS (1521) - Enumeración]]
       - [[SQL*Plus Commands]]
- [[MySQL (3306) - Enumeración]]
       - [[SQL Commands]]
- [[PostgreSQL (5432) - Enumeración]]
- [[MongoDB (27017) - Enumeración]] (Base de datos NoSQL popular.)

  ### Infrastructure & Other Services
- [[DNS (53) - Enumeración]]
	- [[dig]]
	- [[dnsenum]]
- [[SNMP (161,162,10161,10162) - Enumeración]]
- [[IPMI (623) - Enumeración]]
- [[Finger (79) - Enumeración]]
  - [[VPN - Enumeración]] (Identificación de tipos de VPN y sus puntos de acceso.)
  - [[ICS - Enumeración]] (Técnicas para descubrir sistemas de control industrial.)


  ## 🛠 General Tools & Concepts
  Herramientas y conceptos auxiliares para la enumeración de red y hosts.

- [[Creds Overview & Management]] (Nota genérica sobre la gestión y el uso de credenciales.)
- [[Enum4linux]] (Herramienta para enumerar información de Windows/Samba desde Linux.)
- [[PowerShell Empire/Csharp Enum Tools]] (Herramientas de enumeración de red para entornos Windows post-compromiso.)

***