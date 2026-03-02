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
![[Bypassing Injection - Lista Negra de Comandos#^ci-blacklist-comandos]]
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

## Notas Relacionadas


***


### 1. La entrada: `<<<[`

Esto se conoce como un _Here-string_ en bash. Lo que hace es tomar la cadena que está a la derecha (en este caso, solo el corchete de apertura `[`) y pasarlo como entrada estándar (stdin) al comando que está a la izquierda.

### 2. La transformación: `tr '!-}' '"-~'`

El comando `tr` sirve para traducir o reemplazar caracteres. Funciona tomando rangos de caracteres.
- **Primer rango `!-}`:** Representa todos los caracteres en la tabla ASCII desde el signo de exclamación `!` (ASCII 33) hasta la llave de cierre `}` (ASCII 125).
- **Segundo rango `"-~`:** Representa todos los caracteres desde las comillas dobles `"` (ASCII 34) hasta la tilde `~` (ASCII 126).

**¿Qué hace esto en la práctica?** Suma +1 al valor ASCII de cualquier carácter que se le pase. Toma el carácter de entrada y lo cambia por el siguiente en el código ASCII.
- Como nuestra entrada es `[` (cuyo valor ASCII es 91), `tr` lo convierte en el siguiente carácter de la tabla, que es **`\`** (cuyo valor ASCII es 92).

### 3. La ejecución: `$(...)` y `echo`

- **`$(...)`:** Esto es una _sustitución de comando_. Le dice a la terminal que ejecute primero lo que está dentro de los paréntesis (el comando `tr` con su entrada) y devuelva el resultado para usarlo en el comando principal.
- **`echo`:** Finalmente, toma ese resultado devuelto (la barra invertida `\`) y lo imprime en la pantalla.

---

**¿Por qué alguien usaría esto?**

Generalmente se usa en _shell code golf_ (intentar escribir scripts con la menor cantidad de caracteres posibles), como técnica de ofuscación de código, o a veces como un truco desesperado para escribir una barra invertida `\` si esa tecla de tu teclado está rota y no puedes copiarla y pegarla de otro lado.
