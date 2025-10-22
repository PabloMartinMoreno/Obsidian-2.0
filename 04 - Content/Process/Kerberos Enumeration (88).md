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
---
# Kerberos Enumeration (88)

***

## Cheatsheet

|Acción|Descripción|
|---|---|
|`sudo nmap <target> -sV -v -p 88`|Escanea el servicio Kerberos con Nmap. Si se detecta, es muy probable que se trate de un Domain Controller.|

---

## Overview

***Kerberos* es un protocolo de autenticación sin estado que actúa como el mecanismo de autenticación principal en entornos *Microsoft Active Directory*.**

Garantiza comunicaciones seguras entre clientes y servicios mediante un **Key Distribution Center (KDC)** de confianza, ubicado en los Domain Controllers. Usando _tickets_, Kerberos separa las credenciales del usuario de las solicitudes de recursos, evitando la transmisión de contraseñas por la red.

El KDC emite dos credenciales criptográficas principales:
- **Ticket Granting Ticket (TGT):**  
    Permite a los usuarios solicitar tickets de servicio adicionales sin volver a introducir sus credenciales.
- **Ticket Granting Service (TGS):**  
    Autoriza el acceso a servicios de red específicos; se presenta el ticket correspondiente al servicio para obtener acceso.

**Puertos por defecto:** TCP/UDP `88`.

**Al enumerar un entorno Active Directory, los Domain Controllers suelen identificarse mediante escaneos que detectan el puerto 88 abierto.**

---
