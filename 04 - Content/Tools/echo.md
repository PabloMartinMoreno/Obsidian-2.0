---
aliases:
  - echo
tags:
  - tool/echo
  - env/linux
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
  - "[[Common Linux Utilities]]"
---
# Comando `echo`

> [!info] echo
> Imprime texto/variables en stdout. Base de scripts, generación de archivos y expansión de variables. Sintaxis: `echo [opciones] cadena`.
^definicion

---

## Cheatsheet

| **Comando** | **Qué hace** |
|---|---|
| `echo "Hola, $USER"` | Expande variables |
| `echo -n "txt"` | Sin salto de línea final |
| `echo -e "L1\nL2"` | Interpreta escapes (`\n`, `\t`) |
| `echo "txt" > file` | Crea/sobrescribe archivo |
| `echo "txt" >> file` | Agrega al final |
| `echo $?` | Código de salida del último comando |
^echo-cheatsheet

---

## Opciones

| **Flag** | **Qué hace** |
|---|---|
| `-n` | No imprime el salto de línea final |
| `-e` | Habilita escapes (`\n` nueva línea, `\t` tab) |
| `-E` | Deshabilita escapes (default) |

---

## Variables de Entorno Útiles

| **Comando** | **Muestra** |
|---|---|
| `echo $?` | Exit code del último comando (`0` = éxito) |
| `echo $PATH` | Directorios donde el shell busca ejecutables (relevante para **PATH hijacking**) |
| `echo $SHELL` | Shell actual (`/bin/bash`) |
| `echo $HOME` | Home del usuario |
| `echo $USER` | Usuario actual |
| `echo $HOSTNAME` | Nombre de la máquina |
| `echo $LANG` | Idioma/codificación (`en_US.UTF-8`) |
^echo-env
