---
aliases:
tags:
  - type/concept
type: Concept
linked:
---
# Bypass de Espacios en Command Injection
Técnicas para ejecutar comandos cuando el carácter "espacio" está bloqueado (WAF/Filtros).

___

## 1. Redirección de entrada (`<`)

Sustituye el espacio usando el operador de redirección de entrada. Es la técnica más fiable para leer archivos.
* **Sintaxis:** `comando<archivo`
* **Ejemplo:** `cat<flag.txt`

## 2. Variable de Entorno `$IFS`

`$IFS` (Internal Field Separator) es una variable del sistema que por defecto contiene espacio, tabulador y nueva línea.
* **Sintaxis:** `comando${IFS}argumento`
* **Ejemplo:** `cat${IFS}flag.txt`
* **Variante:** `cat$IFS$9flag.txt` (usando `$9` como separador vacío si no se pueden usar llaves).

## 3. Expansión de Llaves (Brace Expansion)

En consolas tipo Bash, los elementos dentro de llaves separados por comas se expanden automáticamente con espacios entre ellos.
* **Sintaxis:** `{comando,argumento}`
* **Ejemplo:** `{cat,flag.txt}`

## 4. Tabuladores

A veces el filtro bloquea el carácter de espacio pero permite el tabulador.
* **Ejemplo:** `cat%09flag.txt` (si es vía URL) o insertando un tab literal.