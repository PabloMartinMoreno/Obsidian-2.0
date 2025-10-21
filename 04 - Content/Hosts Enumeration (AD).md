---
aliases:
  - Enumeración de Hosts (AD)
tags:
  - type/cheatsheet
  - "#pentesting/recon/ad"
  - ad/enumeration
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Active Directory]]"
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Active Directory Enumeration]]"
type: CheatSheet
linked:
  - "[[Pivoting Reconnaissance]]"
  - "[[BloodHound & SharpHound]]"
  - "[[Nmap]]"
---
# Enumeración de Hosts

***

## Cheatsheet

````tabs
tab: Linux

| Comando | Descripción |
|--------|-------------|
| `nxc smb <network-range>`                  | Escanea el rango de red especificado en busca de servicios SMB, ayudando a identificar hosts Windows activos.                                                                      |
| `sudo responder -I <network-interface> -A` | Captura tráfico LLMNR, NBT-NS y MDNS en la interfaz especificada para identificar hosts de forma pasiva.<br><br>**Nota:** El modo *Analyze* (`-A`) evita el envenenamiento activo. |
| [[Pivoting Reconnaissance]]                    | Técnicas y herramientas usadas para el reconocimiento interno después de obtener un punto de apoyo en la red. |

tab: Windows
| Comando | Descripción |
|--------|-------------|
| `BloodHound & SharpHound` | BloodHound puede usarse para enumerar toda la red AD y visualizar las relaciones. |
| `Get-NetComputer`         | Comando de PowerView para obtener información sobre los equipos del dominio. |
| ``Get-NetComputer \| select cn,operatingsystem,dnshostname`` | Comando de PowerView para listar equipos del dominio y filtrar solo la información crucial (nombre común, sistema operativo y nombre DNS). |
| `nslookup <dnshostname>`  | Resuelve un nombre de host a una dirección IP mediante DNS. |

````

---

### Notas relacionadas

- **[[Pivoting Reconnaissance]]:** Para técnicas adicionales para descubrir hosts activos en una red.  
- **[[BloodHound & SharpHound]]:** Enumeran toda la red AD y mapean las relaciones.  
- **[[Nmap]]:** Asegúrate de realizar una enumeración de servicios exhaustiva en cualquier host descubierto.


---

## Overview

Una de las primeras etapas de la enumeración en Active Directory es **identificar los hosts activos en la red**.  
Este paso es esencial porque revela qué sistemas están activos y accesibles, formando la base para una enumeración más profunda.

Desde un **host Linux externo**, a menudo sin autenticación, esto se puede hacer sondeando la red en busca de sistemas que respondan.  
Desde un **host Windows unido al dominio**, los hosts activos se pueden descubrir más fácilmente usando herramientas integradas o utilidades con conocimiento de dominio como **PowerView** o **BloodHound**, que aprovechan el acceso existente dentro del dominio.
