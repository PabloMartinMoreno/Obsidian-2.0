---
aliases:
tags:
  - type/cheatsheet
  - service/wordpress
  - protocol/rdp
  - port/3389
  - tool/nmap
  - tool/freerdp
  - tool/rdpscan
  - meta/ciphers
  - meta/credentials
  - meta/rdp-policy
  - technique/recon/active
  - technique/credential-access
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
  - "[[RDP Exploitation (3389)]]"
---
# RDP Enumeration (3389)

***

## Cheatsheet

| **Acción**                                                                                                                 | **Descripción**                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `sudo nmap -sV -sC -p3389 --script rdp* <target>`                                                                          | Huella mediante escaneo Nmap. Revela estándares de cifrado, hostname, etc. Bastante ruidoso.                                                   |
| `rdp-sec-check.pl <target>`                                                                                                | Comprueba la configuración de seguridad del servicio RDP.                                                                                      |
| `xfreerdp /u:<user> /p:'<password>' /v:<target> /dynamic-resolution`                                                       | Conectarse al servidor RDP desde Linux con alta fidelidad.                                                                                     |
| `xfreerdp ... /bpp:8 /network:modem /compression -themes -wallpaper /clipboard /audio-mode:1 /auto-reconnect -glyph-cache` | Conectarse al servidor RDP desde Linux con baja fidelidad. Usar si RDP está lento.                                                             |
| `xfreerdp ... /drive:linux,<local-directory>`                                                                              | Conectarse al RDP montando un directorio local (útil para exfiltración). En el host Windows, usar `net use` para ver dónde se montó la unidad. |
| `mstsc.exe`                                                                                                                | Cliente RDP nativo de Windows.                                                                                                                 |

---

## Overview

**Remote Desktop Protocol (RDP)** es un protocolo propietario desarrollado por Microsoft para **acceso remoto a sistemas Windows**.  

Permite a los usuarios interactuar con un escritorio Windows de forma remota mediante una conexión cifrada (SSL/TLS) sobre redes IP. El servicio Remote Desktop viene preinstalado en servidores Windows, con ajustes por defecto que suelen requerir **Network Level Authentication (NLA)** para permitir conexiones.

**NLA** exige que los usuarios se autentiquen con usuario y contraseña **antes de** establecer la sesión, lo que **aumenta la seguridad**. Esto implica que técnicas como **Pass-the-Hash** no funcionan en escenarios con NLA habilitado.

El puerto por defecto para RDP es **3389**. Las versiones antiguas de RDP usan solo **TCP**, mientras que RDP 8.0 y posteriores soportan **TCP y UDP**.

****Consejo:**** al realizar pruebas, empezar por identificar si **NLA** está activo y qué versión de RDP corre el servicio antes de intentar conexiones interactivas.

***

## Artículos relacionados

- **[[RDP Exploitation (3389)]]:** Para explotación de RDP.


---
