---
aliases:
tags:
  - type/cheatsheet
  - pentesting/reconnaissance/services
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
  - "[[SQL*Plus Commands]]"
---
# Oracle TNS Enumeration (1521)

***

## Cheatsheet

| **Acción**                                                                                                           | **Descripción**                                                                                    |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `sudo nmap --script "oracle-tns-version" -p 1521 -sV -v <target>` (NMAP)                                             | Realizar un escaneo de versión usando Nmap.                                                        |
| `msfconsole -x "use auxiliary/scanner/oracle/sid_enum; set RHOSTS <target>; run;"` (MSFCONSOLE)                      | Enumeración de SID vía Metasploit (funciona en versiones < 9.2.0.8).                               |
| `odat sidguesser -s <target>` (ODAT)                                                                                 | Fuerza bruta de SID con odat.                                                                      |
| `sudo odat passwordguesser -s <target> -d <sid>` (ODAT)                                                              | Fuerza bruta de credenciales con odat.                                                             |
| `odat all -s <target>` (ODAT)                                                                                        | Realizar varios escaneos para recopilar información sobre servicios de base de datos Oracle.       |
| `sqlplus <user>/<pass>@<target>/<sid>` (SQLPLUS)                                                                     | Iniciar sesión en la base de datos Oracle.                                                         |
| `sqlplus <user>/<pass>@<target>/<sid> as sysdba` (SQLPLUS)                                                           | Iniciar sesión en la base de datos Oracle como sysdba (admin).                                     |
| `SYS:CHANGE_ON_INSTALL` `DBSNMP:DBSNMP` `SCOTT:TIGER` `OUTLN:OUTLN` `WMSYS:WMSYS` `PCMS_SYS:PCMS_SYS` (CREDENCIALES) | Probar las siguientes credenciales por defecto. <br><br>Más información sobre estas cuentas abajo. |

## Artículos relacionados

- [[SQL*Plus Commands]]: La CLI para Oracle Database que permite a los usuarios interactuar con bases de datos Oracle usando comandos SQL.

## Overview

*El Oracle Transparent Network Substrate (TNS) es un protocolo de comunicación propietario que permite que las bases de datos y aplicaciones Oracle se comuniquen a través de redes.* Es ampliamente usado en industrias como salud, finanzas y retail.

El listener TNS soporta protocolos como TCP/IP, UDP, IPX/SPX y AppleTalk y permite conexiones sólo desde hosts en la whitelist, utilizando autenticación básica con nombres de host, direcciones IP y usuarios/contraseñas. La comunicación puede cifrarse vía SSL/TLS.

*En Oracle RDBMS, un System Identifier (SID) es un identificador único para cada instancia de base de datos.* Un servidor puede tener múltiples instancias, cada una con su propio SID. Los clientes deben especificar el SID en su cadena de conexión para interactuar con una instancia de base de datos particular.

Para Oracle 9, la contraseña por defecto es `CHANGE_ON_INSTALL`, mientras que Oracle 10 no tiene contraseña por defecto. El servicio DBSNMP usa la contraseña por defecto `dbsnmp`.

Las credenciales por defecto para algunas cuentas asociadas con Oracle:
- Cuenta sysdba por defecto (antes e incluyendo Oracle v9)  
    `SYS:CHANGE_ON_INSTALL`
- Usuario Intelligent Agent  
    `DBSNMP:DBSNMP`
- Cuenta x por defecto (usuario interno preconfigurado para funcionalidad)  
    `SCOTT:TIGER`  
    `OUTLN:OUTLN`  
    `WMSYS:WMSYS`  
    `PCMS_SYS:PCMS_SYS`  
    Revisar las herramientas de credenciales para más credenciales por defecto.

El puerto por defecto para TNS es **TCP 1521**.