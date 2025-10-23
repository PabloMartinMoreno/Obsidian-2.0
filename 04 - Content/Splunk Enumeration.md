---
aliases:
tags:
  - type/cheatsheet
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeration]]"
type: CheatSheet
linked:
---
# Splunk Enumeration

***

## Cheatsheet

| **Acción**       | **Descripción**                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| `admin:changeme` | **(CRED)** Credenciales por defecto en versiones antiguas de Splunk (aparecen en la página de login). |
| N/D              | Las versiones nuevas piden credenciales en la instalación; si se desconoce, considerar fuerza bruta.  |
| `Help > About`   | **(UI)** Verificar la versión de Splunk una vez autenticado.                                          |

## Overview

[Splunk](https://www.splunk.com/) es una herramienta de análisis de registros que se utiliza para la recopilación, el análisis y la visualización de datos. Aunque en un principio no era un SIEM, se utiliza ampliamente para la supervisión de la seguridad y el análisis empresarial.

Los entornos Splunk a menudo almacenan datos sensibles, lo que los convierte en objetivos valiosos. Se encuentran con frecuencia en redes corporativas durante pruebas de penetración internas y, aunque con menos frecuencia, expuestos externamente.

Splunk tiene pocas vulnerabilidades conocidas, destacando:
- [ CVE-2018-11409](https://nvd.nist.gov/vuln/detail/cve-2018-11409) (divulgación de información)
- [CVE-2011-4642](https://nvd.nist.gov/vuln/detail/CVE-2011-4642) (RCE autenticado en versiones desactualizadas) TODO: Esto debería estar en la nota de ataque en su lugar

*Lo que se busca al enumerar es una autenticación débil o nula.* Si se obtiene acceso de administrador se puede desplegar aplicaciones personalizadas, comprometiendo potencialmente el servidor y la red.

*Después de 60 días, una prueba de Splunk Enterprise se convierte en una versión gratuita que carece de autenticación. Las instalaciones de prueba olvidadas pueden crear brechas de seguridad.*

Splunk a menudo se ejecuta con altos privilegios (root en Linux o SYSTEM en Windows), lo que amplifica el impacto de un compromiso.

Splunk se encuentra más comúnmente en los siguientes puertos:
- **8000**: Interfaz web (Splunk Web)
- **8089**: Puerto de administración (Splunkd, usado para API y CLI)
- **9997**: Puerto de reenvío de datos (usado por los forwarders de Splunk)
- **514**: Syslog (si está configurado para ingestión)
- **8088**: HTTP Event Collector (HEC)