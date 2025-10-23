---
aliases:
tags:
  - type/cheatsheet
  - meta/scripts
  - meta/scan-profiles
  - technique/recon/active
  - tool/nmap
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
---
# Nmap

***

## Cheatsheet

|**Acción**|**Descripción**|
|---|---|
|`sudo nmap -sS <target> -T4 -v -p-`|Realiza un **escaneo TCP SYN** en todos los puertos para identificar rápidamente puertos abiertos. Requiere privilegios de **root**.|
|`sudo nmap -sV <target> -T4 -v -p <comma-separated-ports>`|Realiza un escaneo más detallado sobre puertos abiertos, identificando la **versión del servicio**.|
|`sudo nmap -sC ...`|Ejecuta los **scripts por defecto** para un descubrimiento más detallado (p. ej. detección de servicios, versiones).|
|`sudo nmap -A ...`|Ejecuta un escaneo **agresivo** con muchos scripts. Bastante ruidoso.|
|`sudo nmap ... -oA <file-name>`|Guarda los resultados del escaneo en **tres formatos**: normal, XML y grepable, con el nombre de archivo especificado.|
|`sudo nmap <target-ip-range> -sn \| grep for \| cut -d" " -f5`|Realiza un **ping scan** en un rango de IPs y extrae las direcciones IP de hosts vivos.|

**Notas:**
- **Sin privilegios root**, usar la opción de **handshake TCP completo** (`-sT`) en lugar de `-sS`.
- Para escanear puertos UDP, usar la opción `-sU` o `-sUV` para un escaneo de versión UDP.

---

## Overview

**Nmap (Network Mapper)** es una herramienta de código abierto para **descubrimiento de redes** y auditoría de seguridad.

Envía paquetes crudos para identificar **hosts activos**, **puertos abiertos** y los **servicios/aplicaciones** que corren en esos hosts, incluyendo sus nombres y versiones cuando es posible.

Nmap también proporciona **detección de sistema operativo**, ayudando a identificar el sistema operativo y su versión en los dispositivos objetivo.

Esto lo convierte en una herramienta esencial para profesionales de seguridad ofensiva durante la fase de **reconocimiento**.

Algunas opciones de escaneo de Nmap (por ejemplo `-sS`, `-sY`, etc.) requieren usar `sudo` o estar logueado como **root**, porque dependen de **raw sockets**, que necesitan privilegios elevados.

---

**Consejo:** planificá los escaneos según el ruido que se puede generar y las políticas del entorno —`-A` y `-sS` son efectivos pero llamativos; `-sV` y `-sC` suelen dar buen balance entre información y ruido.

***

## Notas Relacionadas

- **[[Windows LOTL Port Scanning]]:** Instalar Nmap en una máquina Windows comprometida puede no ser viable; en ese caso, el escaneo de puertos debe realizarse aprovechando herramientas ya presentes en el sistema (_living off the land_).

---
