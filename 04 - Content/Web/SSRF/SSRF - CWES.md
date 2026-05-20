---
aliases:
  - CWES SSRF
  - SSRF HTB CWES
  - SSRF para CWES
tags:
  - type/technique
  - vuln/ssrf
  - technique/lateral-movement
  - asset/web-app
  - cert/cbbh
primary categories:
  - '[[Red Team]]'
secondary categories:
  - '[[Explotación|Explotación]]'
tertiary categories:
  - '[[Web Explotación]]'
type: SubCheatSheet
linked:
  - '[[Server-Side Request Forgery (SSRF)]]'
  - '[[SSRF - Mecanismo Lógico]]'
  - '[[SSRF - Reconocimiento]]'
  - '[[SSRF - Explotación]]'
  - '[[SSRF - Gopher]]'
  - '[[Anatomía de la Construcción de un Payload Gopher]]'
---
# SSRF - CWES

***

> Nota principal orientada a **HTB CWES / CBBH**. Agrupa el flujo de SSRF tal como se pide en el examen: identificar → reconocer → explotar (incluyendo Gopher smuggling). Para coverage general y casos modernos (cloud metadata, IMDSv2, DNS rebinding), ver [[Server-Side Request Forgery (SSRF)]].

## Cheatsheet

### 1. Descubrimiento

````tabs
tab: **Mecanismo Lógico (código vulnerable + patrones)**
![[SSRF - Mecanismo Lógico#^ssrf-mecanismo-logico]]

tab: **Reconocimiento (etapas + FFUF port enum)**
![[SSRF - Reconocimiento#^ssrf-reconocimiento]]
````

### 2. Explotación

````tabs
tab: **Técnicas (HTTP, file://, gopher://, SMTP)**
![[SSRF - Explotación#^ssrf-explotacion]]

tab: **Protocolo Gopher (smuggling)**
![[SSRF - Gopher#^ssrf-gopher]]
````

___

## Workflow CWES

```
1. Identificar parámetro sospechoso (dateserver, url, callback, src, …)
2. Confirmar OOB con netcat listener + http://<atacante>:<port>/ssrf
3. Probar loopback → http://127.0.0.1/index.php
4. FFUF de puertos internos (filtrar "Failed to connect")
5. Escalar con protocolos:
   - file:// → LFI
   - gopher:// → POST/RCE contra Redis/MySQL/SMTP/FastCGI
6. Construir payload Gopher con gopherus.py cuando aplique
```

## Checklist rápido

- [ ] Burp Suite abierto — detectar parámetro con URL.
- [ ] Listener `nc -lvnp 8000` o Collaborator listo.
- [ ] Wordlist de puertos (`seq 1 10000 > ports.txt`).
- [ ] FFUF con `-fr "Failed to connect"` para filtrar ruido.
- [ ] Validar si `file://` funciona (LFI via SSRF).
- [ ] Si hay Redis/MySQL interno → gopherus → RCE.

## Apéndice: Servicios Gopher-explotables

| Servicio | Puerto | Uso |
| --- | --- | --- |
| Redis | 6379 | `FLUSHALL` + SSH key / cronjob write → RCE |
| MySQL | 3306 | Paquetes raw si auth permisiva |
| SMTP | 25 | Spoofed mail desde loopback |
| FastCGI | 9000 | Ejecución PHP arbitraria |
| Memcached | 11211 | Cache poison / data dump |

___

## Notas

Esta nota es el **índice operativo para el examen CWES/CBBH**, donde el SSRF se evalúa en laboratorios HTB con flujo lineal: un parámetro web → fuerza a cargar URL → loopback → pivot interno → Gopher si aplica.

El hub general [[Server-Side Request Forgery (SSRF)]] amplía este flujo con vectores modernos (cloud metadata endpoints, IMDSv2 bypass, DNS rebinding, blind OOB via interactsh) que no entran típicamente en CWES pero son críticos en pentest real.

## Recursos

- [HTB CBBH - Web Attacks Module](https://academy.hackthebox.com/module/details/145)
- [PortSwigger - SSRF](https://portswigger.net/web-security/ssrf)
- [gopherus GitHub](https://github.com/tarunkant/Gopherus)

***
