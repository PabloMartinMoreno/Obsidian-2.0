---
aliases:
tags:
  - type/cheatsheet
primary categories:
secondary categories:
tertiary categories:
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
  - "[[LFI To RCE - Session File Poisoning ]]"
  - "[[LFI To RCE - File Upload + LFI]]"
  - "[[LFI To RCE - PHP Filter Chains ]]"
  - "[[LFI To RCE - Phar Deserialization]]"
---
# File Inclusion 

***

## Cheatsheet


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
