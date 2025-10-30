# Vulnerabilidades web comunes

## General

Si al hacer un pentest interno no hay exploits públicos, se pueden identificar vulnerabilidades manualmente y descubrir problemas por **mala configuración**. A continuación están los tipos más comunes (parte del OWASP Top 10) y ejemplos citados.

## Broken Authentication / Broken Access Control

* **Broken Authentication:** permite a un atacante eludir funciones de autenticación (p. ej. loguearse sin credenciales válidas).
  * Ejemplo: *College Management System 1.2* — Auth Bypass usando en el campo email:
    `' or 0=0 #` y cualquier contraseña.
* **Broken Access Control:** permite a usuarios acceder a páginas/funciones que no deberían (p. ej. un usuario normal accediendo al panel admin).

## Malicious File Upload

* Subir scripts maliciosos (p. ej. PHP) si el sistema de subida no valida correctamente el archivo; esto permite ejecutar comandos en el servidor remoto.
* Ejemplo: *WordPress Plugin Responsive Thumbnail Slider 1.0* — permite subir cualquier archivo con doble extensión (ej. `shell.php.jpg`). Existe un módulo de Metasploit para explotarlo.

## Command Injection

* Ocurre cuando la app ejecuta comandos del SO usando datos del usuario sin sanitizar; el atacante inyecta comandos adicionales que se ejecutan en el servidor.
* Ejemplo: *WordPress Plugin Plainview Activity Monitor 20161228* — se puede inyectar un comando añadiendo `| COMMAND...` después del valor `ip`.

## SQL Injection (SQLi)

* Ocurre cuando una consulta SQL incorpora directamente input del usuario. Permite ejecutar consultas adicionales, exfiltrar datos o tomar control del servidor.
* Ejemplo de código PHP dado:
```php
$query = "select * from users where name like '%$searchInput%'";
```
* Ejemplo práctico: *College Management System 1.2* — SQLi que siempre devuelve true para autenticarse, permitiendo login sin credenciales y extracción de datos.

