---
aliases:
tags:
  - type/cheatsheet
  - tool/tcpdump
  - meta/pcap
  - meta/filters
  - meta/examples
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Host & Network Enumeration]]"
type: CheatSheet
linked:
---
# TcpDump

***

## Cheatsheet

|**Acción**|**Descripción**|
|---|---|
|`sudo tcpdump -i tun0 host <me> and <target>`|Captura el tráfico **TCP** intercambiado entre la máquina atacante y la máquina objetivo.|
|`sudo tcpdump -i tun0 icmp`|Captura solo tráfico **ICMP**, útil para monitorear peticiones _ping_.|
**Nota:** Los ejemplos usan la interfaz `tun0`, pero eso puede variar según tu configuración de red.

## Overview

**Tcpdump es un analizador de paquetes de red que captura y muestra paquetes **TCP/IP** y otros paquetes de red enviados o recibidos por el sistema anfitrión.** Permite monitorear el tráfico de red en tiempo real y filtrar tipos de tráfico específicos (por ejemplo, **ICMP** o **TCP**).

Esta herramienta es especialmente útil para tareas como **sniffing** de tipos concretos de tráfico, analizar el comportamiento de la red o verificar si un sistema objetivo se está comunicando contigo —por ejemplo, obligándolo a hacer _ping_ durante una prueba de RCE ciega.