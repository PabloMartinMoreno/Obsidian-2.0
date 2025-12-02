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
  - [[Windows LOTL Port Scanning]] (Técnicas de escaneo de puertos utilizando herramientas nativas de Windows.)

 ## 🚥 Network Traffic Analysis
 Captura y análisis de paquetes para identificar información y comunicaciones sensibles.

  - [[TcpDump]] (Herramienta de línea de comandos para la captura de paquetes.)
  - [[Wireshark]] (Analizador de protocolo de red gráfico para análisis detallado.)

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

  ### Infrastructure & Other Services
   - [[DNS Enumeration (53)]]
   - [[SNMP Enumeration (161,162,10161,10162)]]
   - [[IPMI Enumeration (623)]]
   - [[Finger Enumeration (79)]]

  ## 🛠 General Tools & Concepts
  Herramientas y conceptos auxiliares para la enumeración de red y hosts.

   - [[Creds Overview & Management]] (Nota genérica sobre la gestión y el uso de credenciales.)

***