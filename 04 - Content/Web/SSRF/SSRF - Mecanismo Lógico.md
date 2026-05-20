---
aliases:
tags:
  - type/concept
  - vuln/ssrf
  - technique/lateral-movement
  - asset/web-app
type: Concept
linked:
  - "[[SSRF - Explotación]]"
  - "[[SSRF - CWES]]"
  - "[[Server-Side Request Forgery (SSRF)]]"
---
# SSRF - Mecanismo Lógico

***

## Cheatsheet

| **Aspecto** | **Detalle** |
|:---:|---|
| **Modelo** | Server recibe URL de user input → hace fetch server-side → devuelve body al atacante. |
| **Funciones PHP típicas** | `file_get_contents`, `curl_exec`, `fopen`, `fsockopen`. |
| **Parámetros sospechosos** | `url`, `link`, `uri`, `src`, `target`, `dest`, `source`, `webhook`, `callback`, `api_url`, `image_url`, `avatar`, `proxy`, `fetch`, `page`. |
| **Uso legítimo** | Weather APIs, avatar loaders, webhooks, PDF generators, link previews. |
| **Ataque base** | Reemplazar URL externa por `http://127.0.0.1/admin` → server trae panel interno. |
| **Escenarios reales** | Avatar URL → banner grab SSH interno. Webhook → DB interna. PDF → SSRF+LFI con `file:///etc/passwd`. |
^ssrf-mecanismo-logico

___

## Mecanismo Lógico del SSRF

### El Código Vulnerable (Lo que no se ve)

Suponiendo que el código PHP detrás de `index.php` es algo así:
```PHP
<?php
    // 1. Recibe el valor que enviaste en el POST
    // En el ejercicio, el nombre es 'dateserver', pero podría ser cualquiera.
    $url_destino = $_POST['dateserver']; 

    // 2. El servidor hace una petición a esa URL
    // Funciones comunes: file_get_contents(), curl_exec(), fopen()
    $contenido = file_get_contents($url_destino);

    // 3. Te muestra el resultado
    echo $contenido;
?>
```

#### El Flujo de la Trampa

1. **Uso Normal:** El usuario envía `dateserver=http://api.clima.com`. El servidor va a `api.clima.com`, trae el clima y lo muestra.
2. **Ataque SSRF:** El atacante envía `dateserver=http://127.0.0.1/admin`. El servidor obedece, va a `127.0.0.1/admin`, trae el panel de administración y lo muestra.

El servidor actúa como un **navegador web** que tú controlas remotamente.

### Patrones Comunes de Identificación

No siempre se llamará `dateserver`. Debes buscar cualquier funcionalidad donde la aplicación **tenga que conectarse a otro sitio** para funcionar.

#### Diccionario de Parámetros Sospechosos

Estos son los nombres más comunes que los desarrolladores usan para variables que aceptan URLs:

|**Categoría**|**Parámetros Comunes**|**Funcionalidad Típica**|
|---|---|---|
|**Genéricos**|`url`, `link`, `uri`, `src`, `target`, `dest`, `source`|Redirecciones, cargas de recursos, iframes.|
|**Webhooks/APIs**|`webhook`, `callback`, `api_url`, `endpoint`, `feed`|Integraciones con Slack/Discord, notificaciones de pago (Paypal/Stripe).|
|**Archivos/Imágenes**|`image_url`, `avatar`, `file`, `document`, `profile_pic`|"Cargar imagen desde URL", importación de documentos.|
|**Proxy/Fetch**|`proxy`, `fetch`, `load`, `site`, `view`|Visualizadores de sitios web, validadores de SEO, traductores.|

### Ejemplos de Escenarios Reales

Aquí tienes tres casos distintos donde ocurre lo mismo que con `dateserver`:

#### Caso A: Carga de Imagen de Perfil

- **Funcionalidad:** "Pega la URL de tu foto de perfil".
- **Petición:** `POST /upload_avatar` con `img_url=http://google.com/logo.png`.
- **Ataque:** Cambias a `img_url=http://127.0.0.1:22` para ver si el servidor tiene SSH abierto (Banner Grabbing).

#### Caso B: Webhook de Notificaciones

- **Funcionalidad:** "Danos una URL para avisarte cuando termine el proceso".
- **Petición:** `POST /settings` con `callback=http://mi-servidor.com/ping`.
- **Ataque:** Cambias a `callback=http://internal-database:5432` para intentar interactuar con la base de datos interna.

#### Caso C: Generador de PDF

- **Funcionalidad:** "Convierte esta página web a PDF".
- **Petición:** `GET /make-pdf?page=http://wiki.empresa.com`.
- **Ataque:** Cambias a `page=file:///etc/passwd` para que el PDF generado contenga las contraseñas del sistema (SSRF + LFI).
