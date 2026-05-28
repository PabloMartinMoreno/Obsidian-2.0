---
aliases:
  - LFI2RCE
  - LFI to RCE
tags:
  - vuln/lfi
  - technique/execution
  - asset/web-app
primary categories:
  - '[[Red Team]]'
secondary categories:
  - '[[Explotación]]'
tertiary categories:
  - '[[Web Explotación]]'
kind: CheatSheet
linked:
  - '[[LFI - Básico]]'
  - '[[LFI - Path Traversal y Bypass de Filtros]]'
  - '[[LFI - Null Byte Injection]]'
  - '[[LFI - PHP Wrappers]]'
  - '[[LFI To RCE - Log Poisoning]]'
  - '[[LFI To RCE - proc self environ]]'
  - '[[LFI To RCE - Session File Poisoning]]'
  - '[[LFI To RCE - File Upload + LFI]]'
  - '[[LFI To RCE - PHP Filter Chains]]'
  - '[[LFI To RCE - Phar Deserialization]]'
  - '[[Remote File Inclusion (RFI)]]'
---
# File Inclusion

***

## Cheatsheet

### 1. Lectura básica (LFI)

````tabs
tab: **Path Traversal básico**
![[LFI - Básico#^lfi-basico]]

tab: **Bypass de filtros (encoding, traversal alt)**
![[LFI - Path Traversal y Bypass de Filtros#^lfi-traversal]]

tab: **Null Byte (legacy <PHP 5.3)**
![[LFI - Null Byte Injection#^lfi-nullbyte]]
````

### 2. PHP Wrappers (lectura + ejecución)

````tabs
tab: **Wrappers estándar (php://filter, data, input, expect)**
![[LFI - PHP Wrappers#^lfi-wrappers]]

tab: **PHP Filter Chains (RCE sin upload)**
![[LFI To RCE - PHP Filter Chains#^lfi-phpfilter]]
````

### 3. LFI to RCE — Poisoning

````tabs
tab: **Log Poisoning**
![[LFI To RCE - Log Poisoning#^lfi-logpoisoning]]

tab: **Session File Poisoning**
![[LFI To RCE - Session File Poisoning#^lfi-sessionpoisoning]]

tab: **/proc/self/environ**
![[LFI To RCE - proc self environ#^lfi-environ]]
````

### 4. LFI to RCE — Upload combos

````tabs
tab: **File Upload + LFI**
![[LFI To RCE - File Upload + LFI#^lfi-fileupload]]

tab: **Phar Deserialization**
![[LFI To RCE - Phar Deserialization#^lfi-deserialization]]
````

***

## Overview

**File Inclusion** = la app pasa un parámetro user-controlled a una función que abre/incluye un archivo. Dos variantes:

- **LFI (Local File Inclusion)** — leer archivos del filesystem del backend.
- **RFI (Remote File Inclusion)** — incluir archivo desde URL controlada por el atacante → RCE directo. Ver [[Remote File Inclusion (RFI)]].

### Funciones vulnerables por lenguaje

| Lenguaje | Función | Lee | Ejecuta | URL Remota |
| -------- | ------- | --- | ------- | ---------- |
| PHP | `include()` / `include_once()` | ✅ | ✅ | ✅ (con `allow_url_include`) |
| PHP | `require()` / `require_once()` | ✅ | ✅ | ✅ |
| PHP | `file_get_contents()` | ✅ | ❌ | ✅ |
| PHP | `fopen()` / `file()` / `readfile()` | ✅ | ❌ | ❌ |
| Node.js | `fs.readFile()` / `fs.sendFile()` | ✅ | ❌ | ❌ |
| Node.js | `res.render()` | ✅ | ✅ | ❌ |
| Java | `<jsp:include>` / `import` | ✅ | ✅ | ✅ (import) |
| .NET | `@Html.Partial()` / `Response.WriteFile()` | ✅ | ❌ | ❌ |
| .NET | `<!--#include file-->` (SSI) | ✅ | ✅ | ✅ |

### Patrones típicos

```php
// PHP vulnerable
include($_GET['language']);
include($_GET['page'] . '.php');  // append .php — usar %00 (PHP <5.3) o ?
```

```javascript
// Node.js vulnerable
fs.readFile(path.join(__dirname, req.query.file), (err, data) => res.write(data));
```

```jsp
<!-- Java JSP -->
<jsp:include file="<%= request.getParameter('language') %>" />
```

```csharp
// .NET
Response.WriteFile(HttpContext.Request.Query['file']);
```

### Dónde buscar

Parámetros sospechosos: `page`, `file`, `language`, `lang`, `view`, `template`, `include`, `path`, `doc`, `folder`, `pg`, `style`, `pdf`, `document`, `name`.

### Read vs Execute

- **Solo lee** → source code, credentials, configs (`.env`, `wp-config.php`), claves SSH.
- **Ejecuta + lee local** → LFI to RCE via wrappers/log poisoning/upload chains.
- **Ejecuta + URL remota** → RFI puro = RCE directo.

### Recursos

- [PortSwigger - Directory Traversal](https://portswigger.net/web-security/file-path-traversal)
- [PayloadsAllTheThings - File Inclusion](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/File%20Inclusion)
- [HackTricks - LFI / RFI](https://book.hacktricks.xyz/pentesting-web/file-inclusion)

***
