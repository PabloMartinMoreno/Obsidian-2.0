---
aliases: null
tags:
  - type/concept
  - vuln/command-injection
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[OS Command Injection]]'
---
# Command Injection - Prevención

## Cheatsheet

Estrategias para mitigar la vulnerabilidad en el ciclo de desarrollo y despliegue.

### 1. Secure Coding (Nivel Aplicación)

La prioridad es **NO usar comandos del sistema**. Si es obligatorio, se debe validar y sanear.

|                   **Objetivo**                    |       **Estrategia Preferida**        |                                            **Implementación (Ejemplos)**                                            |                              **Nota**                              |
|:-------------------------------------------------:|:-------------------------------------:|:-------------------------------------------------------------------------------------------------------------------:|:------------------------------------------------------------------:|
|            <br>**Alternativa Segura**             |    <br>**Usar Built-in Functions**    |              <br>**PHP:** `fsockopen()` (para ping/conexión).<br>**Node:** Librerías nativas.<br><br>               |   <br>Evita usar `system()`, `exec()`, `passthru` por completo.    |
|    <br>**Validación**<br>_(Input Validation)_     |      <br><br>**Filtros Nativos**      |            <br>**PHP:** `filter_var($ip, FILTER_VALIDATE_IP)`<br><br>**Node:** Librería `is-ip`.<br><br>            |     <br>Verifica el formato. Si falla, se descarta el request.     |
|    <br>**Validación**<br>_(Input Validation)_     |  <br>**Regex Estricto (Whitelist)**   |                                         <br>**JS/PHP:** `/^(25[0-5]...)$/`                                          |  <br>Solo acepta patrones exactos (ej. estructura de IP).<br><br>  |
| <br><br>**Saneamiento**<br>_(Input Sanitization)_ | <br><br>**Eliminación de Caracteres** | <br>**PHP:** `preg_replace('/[^A-Za-z0-9.]/', '', $var)`<br><br>**JS:** `var.replace(/[^A-Za-z0-9.]/g, '')`<br><br> | <br>**Crucial:** Elimina todo lo que NO sea alfanumérico o puntos. |
|   <br>**Saneamiento**<br>_(Input Sanitization)_   |     <br>**Librerías de Limpieza**     |                                      <br>**Node:** `DOMPurify.sanitize(input)`                                      |           <br>Más seguro que escribir tus propios Regex.           |

### 2. Server Hardening (Configuración del Servidor)

Medidas para contener el daño si el código falla y un atacante logra inyectar comandos.

|      **Configuración**      |            **Implementación Típica (PHP/Apache)**            |                                                             **Propósito**                                                              |
| :-------------------------: | :----------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------: |
| <br><br>**Least Privilege** |                   <br><br>User: `www-data`                   | <br>Ejecutar el servicio web con un usuario de privilegios mínimos (nunca root) para limitar el acceso al sistema de archivos.<br><br> |
|  <br>**Disable Functions**  | <br>`disable_functions = system, exec, shell_exec, passthru` |                             <br>Bloquea la ejecución de funciones peligrosas a nivel de `php.ini`.<br><br>                             |
|     <br>**Limit Scope**     |              <br>`open_basedir = /var/www/html`              |          <br>Enjaula al script para que no pueda leer archivos fuera de su directorio (ej. evita leer `/etc/passwd`).<br><br>          |
|         <br>**WAF**         |                 <br>ModSecurity, Cloudflare                  |                            <br>Detecta y bloquea patrones de ataque comunes en las peticiones HTTP.<br><br>                            |
|      <br>**URL Rules**      |            <br>Reject Double-Encoding / Non-ASCII            |                 <br>Rechazar peticiones con codificación extraña suele bloquear intentos de bypass de filtros.<br><br>                 |

> [!IMPORTANT] Orden de Factores
> 
> El orden correcto en el código es:
> 
> 1. **Validar** (¿Es una IP?).
>     
> 2. **Sanear** (Quitar caracteres malos por si acaso).
>     
> 3. **Ejecutar** (Usando función nativa, no `system`).
>
