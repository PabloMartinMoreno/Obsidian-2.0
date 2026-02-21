---
aliases:
tags:
  - type/concept
primary categories:
secondary categories:
tertiary categories:
type: Concept
linked:
  - "[[OS Command Injection]]"
---
# Command Injection - Prevención

## Cheatsheet

Estrategias para mitigar la vulnerabilidad en el ciclo de desarrollo y despliegue.

### 1. Secure Coding (Nivel Aplicación)

La prioridad es **NO usar comandos del sistema**. Si es obligatorio, se debe validar y sanear.

| **Objetivo**                                            | **Estrategia Preferida**       | **Implementación (Ejemplos)**                                                                                     | **Nota**                                                       |
| ------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Alternativa Segura**                                  | **Usar Built-in Functions**    | **PHP:** `fsockopen()` (para ping/conexión).<br><br>  <br><br>**Node:** Librerías nativas.                        | Evita usar `system()`, `exec()`, `passthru` por completo.      |
| **Validación**<br><br>  <br><br>_(Input Validation)_    | **Filtros Nativos**            | **PHP:** `filter_var($ip, FILTER_VALIDATE_IP)`<br><br>  <br><br>**Node:** Librería `is-ip`.                       | Verifica el formato. Si falla, se descarta el request.         |
| **Validación**<br><br>  <br><br>_(Input Validation)_    | **Regex Estricto (Whitelist)** | **JS/PHP:** `/^(25[0-5]...)$/`                                                                                    | Solo acepta patrones exactos (ej. estructura de IP).           |
| **Saneamiento**<br><br>  <br><br>_(Input Sanitization)_ | **Eliminación de Caracteres**  | **PHP:** `preg_replace('/[^A-Za-z0-9.]/', '', $var)`<br><br>  <br><br>**JS:** `var.replace(/[^A-Za-z0-9.]/g, '')` | **Crucial:** Elimina todo lo que NO sea alfanumérico o puntos. |
| **Saneamiento**<br><br>  <br><br>_(Input Sanitization)_ | **Librerías de Limpieza**      | **Node:** `DOMPurify.sanitize(input)`                                                                             | Más seguro que escribir tus propios Regex.                     |

### 2. Server Hardening (Configuración del Servidor)

Medidas para contener el daño si el código falla y un atacante logra inyectar comandos.

|**Configuración**|**Implementación Típica (PHP/Apache)**|**Propósito**|
|---|---|---|
|**Least Privilege**|User: `www-data`|Ejecutar el servicio web con un usuario de privilegios mínimos (nunca root) para limitar el acceso al sistema de archivos.|
|**Disable Functions**|`disable_functions = system, exec, shell_exec, passthru`|Bloquea la ejecución de funciones peligrosas a nivel de `php.ini`.|
|**Limit Scope**|`open_basedir = /var/www/html`|Enjaula al script para que no pueda leer archivos fuera de su directorio (ej. evita leer `/etc/passwd`).|
|**WAF**|ModSecurity, Cloudflare|Detecta y bloquea patrones de ataque comunes en las peticiones HTTP.|
|**URL Rules**|Reject Double-Encoding / Non-ASCII|Rechazar peticiones con codificación extraña suele bloquear intentos de bypass de filtros.|

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