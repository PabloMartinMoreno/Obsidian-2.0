---
aliases:
tags:
  - type/concept
type: Concept
linked:
  - "[[SSRF - Explotación]]"
---
# El Protocolo Gopher en SSRF

***

El protocolo **Gopher** es un sistema de distribución de documentos anterior a la World Wide Web (HTTP). Aunque hoy en día está prácticamente obsoleto para navegar, es una herramienta crítica en la explotación de [[SSRF]] debido a su capacidad para **enviar bytes arbitrarios** a una conexión TCP.

## ¿Qué es Gopher?

Es un protocolo de capa de aplicación (TCP/IP) diseñado para distribuir, buscar y recuperar documentos.
- **RFC:** 1436
- **Puerto por defecto:** 70
- **Característica Clave:** Permite enviar datos estructurados de forma muy flexible, sin las cabeceras obligatorias que impone HTTP.

## ¿Por qué se usa en SSRF?

La mayoría de las librerías modernas (como `libcurl` en PHP, Python, etc.) soportan Gopher. Cuando encontramos un SSRF, generalmente estamos limitados al protocolo `http://` o `https://`, lo que nos restringe a enviar peticiones **GET**.

**La Limitación del HTTP:**

Si intentas usar `http://` para atacar un servicio interno (como Redis o un formulario POST):
1. El cliente añade cabeceras HTTP (`GET / HTTP/1.1`, `Host: ...`).
2. Esto "ensucia" la petición y rompe la sintaxis que esperan servicios como Redis o MySQL.
3. No puedes forzar fácilmente un método **POST** con cuerpo.

**La Solución Gopher:**
Gopher permite construir un **paquete TCP a medida**. Podemos escribir exactamente los bytes que queremos que lleguen al servidor destino, simulando ser otro protocolo.

Esto se conoce como **Protocol Smuggling** (Contrabando de Protocolos).

## Anatomía de un Payload Gopher

La estructura de una URL Gopher para explotación es la siguiente:
`gopher://<IP>:<PUERTO>/_<DATOS>`
1. **`gopher://`**: El esquema que le dice a `curl` (o la librería usada) que use este protocolo.
2. **`<IP>:<PUERTO>`**: El destino del ataque (ej. `127.0.0.1:25` para SMTP o `127.0.0.1:80` para HTTP).
3. **`/_` (El Guion Bajo):**
    - En Gopher, el primer carácter indica el "Tipo de Recurso" (1 = directorio, 0 = texto, etc.).
    - Al enviar la petición, este primer carácter **se elimina** (no se envía al servidor).
    - Por eso ponemos un carácter "basura" (usualmente `_`) para que sea eliminado y el resto del payload llegue intacto.
4. **`<DATOS>`**: El payload real, codificado en URL (URL Encoded).

## Ejemplo Práctico: Falsificar un POST

Si se quiere enviar esto al servidor interno:
```HTTP
POST /admin.php HTTP/1.1
Host: dateserver.htb
Content-Length: 10

user=admin
```

No se puede hacerlo con `http://` en un SSRF básico. Con Gopher:

1. **Codificar el payload:**
    - Espacios $\rightarrow$ `%20`
    - Saltos de línea (CRLF) $\rightarrow$ `%0D%0A`
2. **Construir la URL Gopher:**
    ```Plaintext
gopher://dateserver.htb:80/_POST%20/admin.php%20HTTP/1.1%0D%0AHost:%20dateserver.htb%0D%0AContent-Length:%2010%0D%0A%0D%0Auser=admin
    ```
3. **El servidor recibe:**
    Cuando el servidor vulnerable procesa esa URL, se conecta al puerto 80 y envía exactamente lo que pusiste después del `_`. El servidor destino cree que recibió una petición HTTP POST legítima.
    

## Servicios Vulnerables a Gopher

Gracias a esta capacidad de enviar texto crudo, Gopher es la "navaja suiza" para atacar servicios internos que usan protocolos basados en texto:

|**Servicio**|**Puerto**|**Uso de Gopher**|
|---|---|---|
|**[[MySQL]]**|3306|Se puede interactuar con la DB si no requiere autenticación compleja (paquetes raw).|
|**[[Redis]]**|6379|Enviar comandos como `FLUSHALL`, escribir claves SSH o cronjobs maliciosos.|
|**[[SMTP]]**|25|Enviar correos falsificados desde `localhost` (Spam, Phishing interno).|
|**FastCGI**|9000|Ejecutar código PHP arbitrario (`RCE`).|
|**Memcached**|11211|Extraer o envenenar datos de caché.|

Gopher funciona como un **túnel**. Se meten datos (HTTP, SQL, Redis) dentro de la URL de Gopher, y el servidor vulnerable "vomita" esos datos tal cual en el puerto interno que se elija.

___


# Anatomía de la Construcción de un Payload Gopher

El proceso consta de 3 fases: **Diseño de la Petición**, **Codificación (Encoding)** y **Ensamblaje**.

## Fase 1: La Petición HTTP Original (Lo que queremos enviar)

Primero, escribimos la petición HTTP tal cual la enviaríamos si estuviéramos dentro del servidor.
```HTTP
POST /admin.php HTTP/1.1
Host: dateserver.htb
Content-Length: 13
Content-Type: application/x-www-form-urlencoded

adminpw=admin
```

> **Nota:** Es vital calcular bien el `Content-Length` (13 caracteres en `adminpw=admin`). Si se falla aquí, la petición se quedará colgada.

## Fase 2: Traducción a Formato URL (Encoding)

Gopher no entiende de espacios ni de saltos de línea de texto. Tenemos que convertir todo a caracteres URL (`%XX`).

1. **Espacios:** Se cambian por `%20`.
2. **Saltos de Línea:** En HTTP, una línea nueva es `\r\n` (Carriage Return + Line Feed). Esto se traduce como `%0D%0A`.

**Transformación:**

|**Texto Original**|**Codificación Gopher**|
|---|---|
|`POST /admin.php HTTP/1.1`|`POST%20/admin.php%20HTTP/1.1`|
|_(Salto de línea)_|`%0D%0A`|
|`Host: dateserver.htb`|`Host:%20dateserver.htb`|
|_(Salto de línea)_|`%0D%0A`|
|...|...|
|_(Doble Salto para separar cabeceras del cuerpo)_|`%0D%0A%0D%0A`|
|`adminpw=admin`|`adminpw=admin`|

**Resultado Intermedio:**

`POST%20/admin.php%20HTTP%2F1.1%0D%0AHost:%20dateserver.htb%0D%0AContent-Length:%2013%0D%0AContent-Type:%20application/x-www-form-urlencoded%0D%0A%0D%0Aadminpw%3Dadmin`

## Fase 3: El Prefijo Gopher y el Carácter "Basura"

Ahora debemos decirle al navegador/curl que use el protocolo Gopher.

1. **Esquema:** `gopher://`
    
2. **Destino:** `dateserver.htb:80`
    
3. **El Selector (El truco):** Gopher requiere un carácter inicial para saber el tipo de archivo. Como estamos enviando datos brutos, usamos un guion bajo `_` que el servidor Gopher eliminará antes de enviar los datos.
    

**Estructura:**

`gopher://host:puerto/` + `_` + `PAYLOAD_CODIFICADO`

## Fase 4: La Doble Codificación (El paso final en el ejemplo)

El texto menciona un paso extra crucial:

> "Since we are sending our URL within the HTTP POST parameter dateserver... we need to URL-encode the entire URL again."

Como vamos a meter esta URL de Gopher **dentro** de una petición web (`dateserver=...`), si enviamos un `%20`, el servidor web externo lo decodificará como un espacio _antes_ de procesar el SSRF, rompiendo el payload.

Por eso, codificamos los `%` de nuevo (`%` se convierte en `%25`).

- `%20` -> `%2520`
    
- `%0D%0A` -> `%250D%250A`
    

**Resultado Final (La "invención"):**

`gopher://dateserver.htb:80/_POST%2520/admin.php%2520HTTP...`

---

## Resumen Visual

No tienes que memorizar esto ni hacerlo a mano siempre. Para eso existen herramientas como:

1. **Gopherus:** Genera payloads automáticamente.
    
2. **CyberChef:** Puedes usar la receta "To Gopher" o hacer URL Encode manual.
    

La "magia" es simplemente que estás escribiendo los bytes TCP uno por uno usando `%XX`.