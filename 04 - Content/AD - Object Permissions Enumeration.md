---
aliases:
  - Enumeración de Permisos de Objetos (AD)
tags:
  - type/cheatsheet
  - asset/active-directory
  - technique/recon/active
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Enumeration]]"
type: CheatSheet
linked:
  - "[[BloodHound & SharpHound]]"
  - "[[ACL Abuse]]"
---
# Enumeración de Permisos de Objetos

***

## Cheatsheet

| **Comando**                                                                                                                                               | **Descripción**                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Find-LocalAdminAccess`                                                                                                                                   | **(FIND-LOCALADMINACCESS)** Busca equipos donde un usuario especificado tiene derechos de administrador local dentro del dominio. <br><br>                                                                                              |
| `$sid = Convert-NameToSid <user>` <br><br>`Get-DomainObjectACL -ResolveGUIDs -Identity * \| ? {$_.SecurityIdentifier -eq $sid}`<br><br>                   | <br>**(POWERVIEW)** Busca objetos AD en los que el usuario especificado (convertido a SID) tiene permisos explícitos establecidos en sus ACL.<br><br>                                                                                   |
| <br>`Find-DomainShare` <br><br>`Add `-CheckShareAccess` for only readable shares`<br><br>A continuación, se puede:<br>`dir \\<dns-hostname>\<share-name>` | <br>**(POWERVIEW)** Encuentra objetos de AD donde el usuario especificado (convertido a SID) tiene permisos explícitos en las ACLs.<br><br>**(FIND-DOMAINSHARE)** Enumera los shares del dominio; puede filtrar por accesibilidad. <br> |
**Nota:** La mayoría de estos comandos son de [PowerView](https://github.com/PowerShellMafia/PowerSploit/blob/master/Recon/PowerView.ps1)

---

## Overview

La Enumeración de Permisos de Objetos es un paso crítico para identificar oportunidades de escalada de privilegios dentro de entornos Active Directory.

Identificar dónde un usuario tiene acceso de administrador local ayuda a localizar sistemas que pueden ser objetivo para escalada de privilegios o recolección de credenciales. Esta información es especialmente útil cuando se combina con otras relaciones de acceso o confianza.

Consultar las ACLs de objetos en Active Directory permite descubrir qué usuarios o grupos tienen control delegado o permisos específicos sobre objetos del dominio (usuarios, grupos, OUs, GPOs, etc.). Estos permisos frecuentemente pueden ser abusados para escalar privilegios o moverse lateralmente.

Enumerar los shares del dominio revela dónde pueden estar almacenados archivos valiosos y qué recursos son accesibles. Filtrar por shares legibles ayuda a acotar objetivos viables, sobre todo en entornos donde pueden quedar expuestos datos sensibles o scripts.

Combinadas, estas técnicas forman la base para una enumeración efectiva de AD y estrategias de escalada de privilegios durante evaluaciones internas.

***

## Artículos relacionados

- [[BloodHound & SharpHound]]: Enumerar toda la red AD y mapear relaciones, incluyendo ACLs. 
- [[ACL Abuse]]: Abusar de ACLs existentes sobre objetos clave para escalar privilegios.

---
