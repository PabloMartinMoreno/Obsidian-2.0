---
aliases:
tags:
  - type/cheatsheet
  - tool/powershell
  - "#porhacer"
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
---
# Windows LOTL Port Scanning

***

## Cheatsheet

| **Acción**                                                                                                                          | **Descripción**                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `Test-NetConnection -Port <port> <target>`                                                                                          | Función de **PowerShell** para probar si un host remoto responde a una petición ICMP y si un puerto dado está abierto. |
| `<start-range>..<end-range> \| % {echo ((New-Object Net.Sockets.TcpClient).Connect("<target>", $_)) "TCP port $_ is open"} 2>$null` | Comando de Powershell de una sola línea para escanear un rango de puertos de un host remoto.                           |

**Nota:** Estas técnicas de escaneo son **muy lentas**.

## Overview

**Nmap** tiene una versión específica para **Windows**, pero requiere instalación, lo cual puede no ser factible en un objetivo Windows comprometido.

Por lo tanto, puede ser necesario **vivir off the land** (aprovechar binarios nativos) utilizando herramientas integradas del sistema para realizar el escaneo.