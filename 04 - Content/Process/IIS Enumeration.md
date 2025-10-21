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
# IIS Enumeration

***

## CheatSheet

| Acción                                                              | Descripción                                                                           |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `sudo nmap -p 80,8080,443 -sV --open <target>`                      | Empezá verificando si el servidor web es **Microsoft IIS** y, de ser así, su versión. |
| Verificar si es vulnerable:<br>`shortscan --isvuln http://<target>` | Comprueba si la versión de IIS es vulnerable a la enumeración por tilde.              |
| Enumerar:<br>`shortscan http://<target>`                            | Realiza la enumeración para encontrar nombres cortos/recursos ocultos.                |

**Artículos relacionados:**

- IIS Exploitation: #estado/incompleto 

## Descripción general

Internet Information Services (IIS) es un servidor web desarrollado por Microsoft para alojar y gestionar sitios web, aplicaciones web y otros servicios online en servidores Windows.

La **enumeración por directorios con tilde** en IIS es una técnica que permite descubrir ficheros, directorios y nombres cortos (formato 8.3) que a veces quedan “ocultos” en ciertas versiones de IIS. Aprovecha cómo IIS/Windows genera y maneja nombres cortos automáticamente (ocho caracteres, punto y tres caracteres de extensión). En URLs, la tilde (`~`) seguida de un número puede representar un nombre corto; si se determina ese nombre, podría permitir el acceso a recursos no pretendidos.

Esta vulnerabilidad afecta a versiones de IIS desde la `1.0` hasta la `7.5` inclusive, y está relacionada también con ciertos marcos .NET (1.0 a 4.0). La técnica normalmente usa fuzzing para identificar nombres cortos válidos y así explotar la falla.

Puertos donde suele encontrarse IIS: `80`, `8080` (HTTP) y `443` (HTTPS).

---
