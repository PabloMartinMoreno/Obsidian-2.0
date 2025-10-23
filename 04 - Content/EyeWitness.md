---
aliases:
tags:
  - type/cheatsheet
  - pentesting/reconnaissance/web
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeration]]"
type: CheatSheet
linked:
---
# EyeWitness

***

## Cheatsheet

|**Acción**|**Descripción**|
|---|---|
|`EyeWitness -f urls.txt -d <directorio-a-crear>`|Toma capturas de pantalla a partir de un archivo que contiene una lista de URLs y guarda los resultados en el directorio especificado.|
|`EyeWitness -x nmap.xml -d <directorio-a-crear>`|Procesa la salida XML de un escaneo de Nmap para tomar capturas de pantalla de los hosts descubiertos y guarda los resultados en el directorio especificado.|
|`EyeWitness --web --proxy-ip 127.0.0.1 --proxy-port 8080 --proxy-type socks5 ...`|Captura pantallas de sitios web enrutando el tráfico a través de un proxy, soportando varios tipos de proxy (por ejemplo, SOCKS5).|
|`EyeWitness ... --delay <segundos>`|Añade un retardo antes de tomar las capturas de pantalla, útil para cargar páginas web lentas o pesadas.|

## Overview

[EyeWitness](https://github.com/RedSiege/EyeWitness) es una herramienta diseñada para automatizar el proceso de tomar capturas de pantalla de sitios web, recolectar información de las cabeceras del servidor e identificar credenciales por defecto cuando sea aplicable.

Esta herramienta es particularmente útil al manejar grandes listas de objetivos, como después de un escaneo con [[Nmap]] o al trabajar con grandes volúmenes de datos de dominios. El informe HTML generado, que incluye las capturas de pantalla, proporciona una representación visual de los objetivos, facilitando la identificación de servicios interesantes, configuraciones incorrectas o vulnerabilidades que merezcan una investigación más profunda.