---
aliases:
  - Fuzzing de Parámetros y Valores
tags:
  - type/cheatsheet
  - technique/recon/active
  - asset/web-app
  - protocol/http
  - tool/ffuf
  - tool/curl
  - meta/wordlists
  - meta/poc
primary categories:
  - "[[Penetration Test]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Web Enumeration]]"
type: CheatSheet
linked:
  - "[[curl]]"
  - "[[ffuf]]"
  - "[[gobuster]]"
  - "[[Seclists]]"
---
# Fuzzing de Parámetros y Valores

***

## Cheatsheet

````tabs
tab: **Curl**
![[Curl - Fuzzing Parámetros y Valores#^curl-fuzzing-parametros]]

tab: **Ffuf**
![[Ffuf#^ffuf-fuzzing-parametros]]

tab: **Gobuster**
![[GoBuster#^gobuster-fuzzing-parametros]]

tab: **Wordlists**
![[Seclists#^wordlists-fuzzing-parametros]]

````


## Overview

**El fuzzing de parámetros se utiliza para identificar vulnerabilidades en aplicaciones web mediante la manipulación de parámetros de entrada en URL (GET) o cuerpos de solicitud (POST).**

Mediante el uso de herramientas como [[ffuf]] para automatizar el fuzzing con listas de palabras personalizadas, se pueden identificar parámetros inesperados u ocultos, rutas de archivos u otros problemas de la aplicación.

**Es fundamental establecer primero la respuesta de referencia con parámetros no válidos conocidos para filtrar los resultados irrelevantes.**