---
aliases:
  - "Fingerprinting Web Technologies"
  - Detección de Tecnologías Web
tags:
  - technique/recon/active
  - technique/recon/passive
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Enumeración]]"
kind: CheatSheet
linked:
  - "[[WAF]]"
  - "[[Web Technology Enumeration]]"
  - "[[Certificate Transparency Logs]]"
---
# Web Fingerprinting

Identificar el **stack** (webserver, lenguaje, framework, CMS, WAF y versiones) antes de atacar. Combina señales **pasivas** (headers, cookies, favicon, certificado) y **activas** (probes, herramientas). El objetivo: mapear la superficie y buscar CVEs de versiones conocidas.

---

## 🧰 Herramientas Automáticas

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `whatweb <target>` | Stack: server, CMS, framework, JS libs, versión | Primer paso, rápido y pasivo |
| `whatweb -a4 -v <target>` | Escaneo agresivo + detalle por plugin | Más profundidad (más ruidoso) |
| `nmap -sV -p80,443 <IP>` | Server + versión por banner | Confirmar versión exacta |
| `nmap --script http-headers,http-title,http-server-header <IP>` | Headers, título y server vía NSE | Recon scriptado |
| `nuclei -u <URL> -t http/technologies/` | Detección de tecnologías (templates) | Bulk / pipeline |
| `webanalyze -host <URL>` | Wappalyzer en Go (rápido, bulk) | Muchos hosts |
| Wappalyzer (extensión / online) | CMS, frameworks, analytics, CDN del front-end | Análisis manual del front |

^wfp-tools

---

## 📋 HTTP Headers (pasivo)

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `curl -sI <URL>` | Todos los response headers | Base del fingerprint pasivo |
| `curl -sI <URL> \| grep -i ^server` | `Server: Apache/2.4.x` → software + versión | Identificar el webserver |
| `curl -sI <URL> \| grep -i x-powered-by` | `X-Powered-By: PHP/8.1` → lenguaje backend | Backend lang |
| `curl -sI <URL> \| grep -i x-aspnet` | `X-AspNet-Version` / `X-AspNetMvc-Version` → .NET | Stack Microsoft |
| `curl -sI <URL> \| grep -i x-generator` | Generador (Drupal, etc.) → CMS | CMS |
| `curl -sI <URL> \| grep -i 'via\|x-cache\|cf-ray'` | Proxy/CDN (Varnish, Cloudflare) | Infra intermedia |

^wfp-headers

---

## 🍪 Cookies → Tecnología

Ver con `curl -sI <URL> | grep -i set-cookie`.

| **Cookie** | **Tecnología** |
|---|---|
| `PHPSESSID` | PHP |
| `JSESSIONID` | Java (Tomcat / JBoss) |
| `ASP.NET_SessionId`, `ASPSESSIONID...` | ASP.NET / IIS |
| `connect.sid` | Node.js (Express) |
| `_session_id` | Ruby on Rails |
| `laravel_session`, `XSRF-TOKEN` | Laravel (PHP) |
| `csrftoken` + `sessionid` | Django (Python) |
| `wordpress_*`, `wp-settings-*` | WordPress |

^wfp-cookies

---

## 🎯 Favicon Hashing

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `curl -s <URL>/favicon.ico \| md5sum` | Hash del favicon | Identificar tech por favicon conocido |
| `python3 -c "import mmh3,requests,codecs; r=requests.get('<URL>/favicon.ico'); print(mmh3.hash(codecs.encode(r.content,'base64')))"` | Hash **mmh3** (formato Shodan) | Generar el hash para buscar |
| Shodan: `http.favicon.hash:<mmh3>` | Otros hosts con el mismo favicon | Pivot / atribución / mismo stack |

^wfp-favicon

---

## 💥 Error Pages & Version Disclosure

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `curl -s <URL>/noexiste-$RANDOM` | 404 default → server/framework | Provocar error |
| `curl -s "<URL>/?id='"` | Stack trace / error de DB → lenguaje + DB | Forzar excepción |
| `curl -s <URL>/readme.html` · `/license.txt` · `/CHANGELOG.txt` | Versión del CMS | CMS version (WordPress/Drupal) |
| `curl -sI <URL>/<archivo>.php` vs `.aspx` vs `.jsp` | Qué extensión responde 200 | Inferir el lenguaje |

^wfp-errors

---

## 🛡️ WAF Detection

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `wafw00f -v <URL>` | ¿Hay WAF? cuál (Cloudflare, Akamai, etc.) | Antes de tirar payloads |
| `nmap --script http-waf-detect,http-waf-fingerprint -p80,443 <IP>` | Detección de WAF vía NSE | Alternativa scriptada |

Detalle y bypass → [[WAF]].

^wfp-waf

---

## 🌐 Servicios Pasivos (sin tocar el target)

| **Servicio** | **Qué obtenés** |
|---|---|
| Shodan / Censys | Banners, tech, puertos, favicon hash, CVEs |
| Netcraft (`sitereport.netcraft.com`) | Hosting, tech, historial |
| BuiltWith | Stack tecnológico + analytics |
| Wappalyzer (online) | CMS/frameworks sin instalar nada |
| crt.sh / [[Certificate Transparency Logs]] | SANs del cert → subdominios + org |

^wfp-passive

---

## Notas relacionadas

- [[Web Enumeración]] (área padre) · [[Web Technology Enumeration]] (enum por-tecnología) · [[WAF]]
