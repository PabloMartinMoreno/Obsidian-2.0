---
aliases:
  - Insecure Direct Object References (IDOR)
  - BOLA
  - Broken Object Level Authorization
tags:
  - type/vulnerability
  - vuln/idor
  - technique/discovery
  - asset/api
  - asset/web-app
primary categories:
  - '[[Red Team]]'
secondary categories:
  - '[[Explotación]]'
tertiary categories:
  - '[[Web Explotación]]'
kind: CheatSheet
linked:
  - '[[IDOR - Manipulación de Parámetros y Rutas]]'
  - '[[IDOR - Manipulación del Cuerpo de la Petición]]'
  - '[[IDOR - Manipulación de Cabeceras HTTP y Protocolo]]'
  - '[[IDOR - Técnicas de Evasión y Bypass de Filtros]]'
  - '[[IDOR - Explotación Indirecta y Lógica de Negocio]]'
---
# BOLA - IDOR

***

## Cheatsheet

### 1. Manipulación directa del request

````tabs
tab: **Parámetros y Rutas**
![[IDOR - Manipulación de Parámetros y Rutas#^idor-parametros]]

tab: **Cuerpo de la Petición (JSON/XML/multipart)**
![[IDOR - Manipulación del Cuerpo de la Petición#^idor-cuerpo]]

tab: **Cabeceras HTTP y Protocolo**
![[IDOR - Manipulación de Cabeceras HTTP y Protocolo#^idor-http]]
````

### 2. Bypass de filtros

````tabs
tab: **Evasión y Bypass (encoding, type juggling, HPP)**
![[IDOR - Técnicas de Evasión y Bypass de Filtros#^idor-filtros]]
````

### 3. Lógica de negocio

````tabs
tab: **Blind, Stored, Multi-step, Async**
![[IDOR - Explotación Indirecta y Lógica de Negocio#^idor-indirecta]]
````

___

## Overview

**IDOR / BOLA (Broken Object Level Authorization)** = la app referencia un objeto interno (registro DB, archivo, account) directamente con un identificador controlado por el cliente (`id=106`, `/users/106/...`, JSON `{"doc_id":106}`) sin verificar que el usuario autenticado tenga permiso sobre ese objeto.

**OWASP API #1 (2019, 2023)** — el más común y con mayor impacto en APIs modernas.

### Vectores típicos

- **IDs predecibles**: enteros secuenciales, UUIDs débiles (UUIDv1 timestamp-based), nombres de archivo `report_2024_USERID.pdf`.
- **Referencias indirectas a otros usuarios**: campos `user_id`, `account_id`, `tenant_id`, `org_id` en URL/body/header.
- **Endpoints administrativos**: paths como `/admin/user/106/edit` accesibles a no-admin si no se valida.
- **Funciones que envían data afuera**: `send_receipt`, `export`, `download`, `share`, `forward`.

### Identificación rápida

1. Loguearse como Usuario A. Capturar IDs propios en Burp.
2. Loguearse como Usuario B (otro browser/private). Capturar sus IDs.
3. En sesión A, hacer swap del ID al de B en cada request → si responde data de B = IDOR.
4. Probar acciones state-changing (PUT/PATCH/DELETE) con ID ajeno.
5. Probar enumeración secuencial (IDs adyacentes) para confirmar predictibilidad.

### Impacto

- **Lectura no autorizada** — leer perfil/docs/messages ajenos.
- **Modificación no autorizada** — cambiar password/email/role de otro usuario (chain con account takeover).
- **Borrado** — DELETE de recursos ajenos (DoS targeted).
- **Privilege escalation horizontal** — atacante = otro usuario.
- **Privilege escalation vertical** — atacante = admin (combo con role manipulation).
- **Data leak masivo** — enumeración secuencial expone toda la base.

### Mitigación

Validación de autorización a nivel **modelo/controller**, NO a nivel ruta o WAF. Identidad del actor extraída del JWT verificado server-side, nunca del request. RBAC/ABAC con verificación explícita de relación `usuario ↔ objeto` en cada query/mutation.

***

## Recursos

- [OWASP API Top 10 - BOLA](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/)
- [PortSwigger - Access Control](https://portswigger.net/web-security/access-control)
- [HackTricks - IDOR](https://book.hacktricks.xyz/pentesting-web/idor)

***
