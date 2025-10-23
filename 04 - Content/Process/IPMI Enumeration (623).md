---
aliases:
tags:
  - type/cheatsheet
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
  - "[[Creds]]"
---
# IPMI Enumeration (623)

***

## Cheatsheet

|**Acción**|**Descripción**|
|---|---|
|`sudo nmap -sU --script ipmi-version -p 623 <target>`|Realiza un escaneo de versión IPMI con Nmap.|
|`msfconsole -x "use auxiliary/scanner/ipmi/ipmi_version; set RHOSTS <target>; run;"`|Escanea la versión de IPMI usando Metasploit.|
|`msfconsole -x "use auxiliary/scanner/ipmi/ipmi_dumphashes; set RHOSTS <target>; run;"`|Extrae hashes de contraseñas explotando un fallo en RAKP v2.0.|
|`root:calvin``ADMIN:ADMIN`|Probá las siguientes credenciales por defecto.|
**Nota:** Usar el modo **Hashcat 7300** para crackear hashes RAKP. #porhacer:enlazar a hashcat.

***

## Overview

***IPMI (Intelligent Platform Management Interface)** permite el **monitoreo y gestión remota del hardware**, incluso cuando el sistema no responde o está apagado.*

Ofrece funcionalidades como control de energía, monitoreo de sensores (por ejemplo, temperatura) y acceso remoto a la consola del sistema. Operando de forma independiente del BIOS, CPU y sistema operativo del host, IPMI solo requiere alimentación y conexión LAN, funcionando como un **control remoto para servidores**.

Los administradores pueden modificar ajustes del BIOS, encender servidores de forma remota y diagnosticar fallos de sistema eficientemente. Los sistemas que usan IPMI, conocidos como **BMCs (Baseboard Management Controllers)**, son sistemas embebidos (normalmente corriendo Linux) conectados directamente a la placa madre.

Los BMCs suelen exponer consolas web y protocolos de acceso remoto como **SSH** o **Telnet**. Dado que el acceso al BMC otorga control cercano al físico sobre el servidor, es una **preocupación crítica de seguridad**.

El puerto por defecto para IPMI es **UDP 623**. Cuando IPMI soporta cifrado, normalmente se emplean mecanismos adicionales (ver nota de autenticación abajo).

## Autenticación

IPMI soporta varios métodos de autenticación, típicamente mediante pares **usuario:contraseña** y protocolos de desafío-respuesta. Algunas implementaciones también incluyen características de seguridad avanzadas como **certificados digitales** para proteger las interfaces de gestión.

*No obstante, un fallo en **RAKP (Remote Authentication Key Protocol)** en IPMI **v2.0** permite que el servidor divulgue hashes de contraseñas (MD5 o SHA-1) cuando se proporciona un nombre de usuario válido.*

Además, muchos **BMCs** vienen con acceso “anónimo” habilitado por defecto, lo que incrementa la superficie de ataque.

## Credenciales por defecto (ejemplos)

- **Dell iDRAC**
    - Usuario: **root**
    - Contraseña: **calvin**
        
- **HP iLO**
    - Usuario: **Administrator**
    - Contraseña: **(cadena aleatoria de 8 caracteres: números y mayúsculas)**
        
- **Supermicro IPMI**
    - Usuario: **ADMIN**
    - Contraseña: **ADMIN**

Comprobar las herramientas de [[Creds]] para más credenciales por defecto.

## Nota técnica

- El puerto DNS por defecto mencionado en algunas referencias es **UDP 623**; este puerto frecuentemente soporta opciones de cifrado para comunicación segura (dependiendo de la implementación).