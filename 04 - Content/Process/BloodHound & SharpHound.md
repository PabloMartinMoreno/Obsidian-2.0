---
aliases:
tags:
  - type/cheatsheet
  - tools/ad/enumeration
  - pentesting/reconnaissance/ad
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
  - "[[Active Directory]]"
tertiary categories:
  - "[[Active Directory Enumeration]]"
type: CheatSheet
linked:
---
# BloodHound & SharpHound

***

## Cheatsheet

| **Comando**                                                                                                                                                                                                                               | **Descripción**                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Colector de PowerShell:<br>`Import-Module .\Sharphound.ps1` / `Invoke-BloodHound -CollectionMethod All -OutputDirectory .`<br><br>Colector ejecutable:<br>`BloodHound.exe -CollectionMethod All -OutputDirectory .` <br>                  | <br>**(SHARPHOUND)** Carga SharpHound y lanza la recolección de **toda** la información AD, dejando los JSON en el directorio actual.<br><br><br>**(BLOODHOUND)** versión .exe de SharpHound que recoge datos AD desde un host Windows.<br><br> |
| Colector en Python:<br>`bloodhound-python -u '<user>' -p '<password>' -ns <nameserver> -d <domain> -c all`<br><br>Comprime los archivos JSON creados para poder introducirlos en BloodHound:<br>`zip -r <output-file>.zip *.json`<br><br> | **(BLOODHOUND-PY)** Recoge datos AD desde un host Linux.<br><br>Normalmente el controlador de dominio también actúa como nameserver.<br><br>Tiene limitaciones; recolectar desde un host Windows unido al dominio suele ser más fiable.<br>     |
| Inicia/Detiene el servicio Neo4j:<br>`sudo neo4j start` / `sudo neo4j stop`<br>                                                                                                                                                           | **(NEO4J)** Inicia la base de datos gráfica Neo4j, necesaria para ejecutar BloodHound.                                                                                                                                                          |

---

## Uso / notas rápidas

- Usar el collector más apropiado según entorno (PowerShell/ejecutable en Windows, `bloodhound-python` en Linux).  
- Comprimir (`zip`) los JSON generados para importarlos en la interfaz de BloodHound.  
- Normalmente el Domain Controller también responde como nameserver (`-ns <nameserver>`).  
- Recolectar desde un host Windows unido al dominio es más confiable que hacerlo desde Linux.

---

## Overview

BloodHound es una herramienta open-source diseñada para analizar y visualizar relaciones y permisos en entornos Active Directory.  

Mapea cómo están conectados usuarios, grupos y equipos, ayudando a descubrir caminos de ataque ocultos y oportunidades de escalada de privilegios que no son evidentes a simple vista.  

BloodHound tiene dos componentes principales: un **collector** que recoge datos detallados del dominio (membresías, delegaciones, permisos de objetos, sesiones activas, ACLs, etc.) y una **interfaz gráfica** que carga esos datos en una base de grafos (Neo4j) y los visualiza como un grafo interactivo que facilita la identificación de debilidades y malas configuraciones.
