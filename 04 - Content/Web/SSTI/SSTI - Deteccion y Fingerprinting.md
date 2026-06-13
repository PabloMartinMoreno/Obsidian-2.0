---
aliases:
  - SSTI Detection
  - SSTI Fingerprint
  - Template Injection Detection
tags:
  - vuln/ssti
  - technique/discovery
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[Server-Side Template Injection (SSTI)]]"
---
# SSTI - Detección y Fingerprinting

---

## Probes Polyglot

| **Payload** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `${{<%[%'"}}%\` | Polyglot canónico | Cada delimitador rompe alguno de los engines comunes — error revela cuál. |
| `${{<%[%'"}}%\}}{{` | Polyglot extendido | Más caracteres → más probabilidad de error parser. |
| `{{1}}{%print(1)%}` | Polyglot Twig/Jinja2 | Si refleja `1` o ejecuta `print` → confirma engine. |
| `${1}#{1}*{1}@{1}` | Polyglot Java engines | FreeMarker/Velocity/Thymeleaf/Razor — cada delimitador. |
| `<%= 1 %><%- 1 %>` | Polyglot ERB/EJS | Ruby ERB y Node EJS. |
| `{{badname.invalid}}` o `${broken[}` | Trigger error verbose | Stack trace con engine/lib name. |
| Trigger en input reflejado | Cualquier campo que vuelva visible (search, profile, error msg) | Frequent vector. |
| Trigger en email/PDF | Emails con templates renderizados server-side | SSTI silencioso — feedback indirecto. |
| Trigger en filename | Upload con nombre `{{7*7}}.txt` | Algunos backends procesan filename como template. |
| `User-Agent: {{7*7}}` | Trigger en User-Agent | Logging dashboards renderizan UA. |
^ssti-detect-polyglot

---

## Identificación por Delimitador

| **Delimitador** | **Engines candidatos** | **Test específico** |
|:---:|:---:|:---:|
| `{{ }}` | Jinja2, Twig, Handlebars, Mustache, Liquid, Nunjucks | `{{7*7}}` → `49` |
| `${ }` | FreeMarker, Velocity, Thymeleaf, Mako, JSTL EL, JSP EL | `${7*7}` → `49` |
| `${{ }}` | GitHub Actions expressions, JSP EL inverso | Específico CI/CD. |
| `<%= %>` | ERB (Ruby), EJS (Node), JSP scriptlets | `<%= 7*7 %>` → `49` |
| `<% %>` | ERB silent, JSP, ASP classic | Sin output pero ejecuta. |
| `{% %}` | Jinja2 block tag, Twig block tag, Django | `{% if 1==1 %}YES{% endif %}` |
| `{ }` | Smarty (PHP) | `{7*7}` → `49` (en Smarty solo). |
| `#{ }` | Ruby string interpolation, Pug, Razor | Más raro. |
| `@{ } / @( )` | Razor (.NET) | `@(7*7)` → `49` |
| `*{ }` | Thymeleaf selection expression | Spring específico. |
| `[[ ]]` | Thymeleaf inline expression | Spring específico. |
| `{{= }}` | Underscore.js templates | JS specific. |
| `<?= ?>` | PHP short tag | Rarely template syntax — usually direct PHP. |
^ssti-detect-delimiters

### Diferenciación rápida

| Delimitador común | Para distinguir |
|---|---|
| `{{7*7}}` → `49` | Jinja2 / Twig |
| `{{7*'7'}}` → `7777777` (Twig) o `49` (Jinja2) | String multiplication = Twig |
| `{{config}}` → object dump (Jinja2/Flask) o nada (Twig) | Engine context |
| `${7*7}` → `49` | FreeMarker / Velocity / Mako / Thymeleaf |
| `${T(java.lang).getRuntime}` → string raw (Thymeleaf) o resolves (FreeMarker) | Spring Thymeleaf vs FreeMarker |

---

## Confirmación con Expresión Aritmética

| **Engine probable** | **Payload mínimo** | **Output esperado si vulnerable** |
|:---:|:---:|:---:|
| Jinja2 / Flask | `{{7*7}}` | `49` |
| Twig (Symfony) | `{{7*'7'}}` | `7777777` (string mult) |
| Smarty (PHP) | `{7*7}` | `49` (solo si delimitador `{`) |
| FreeMarker (Java) | `${7*7}` | `49` |
| Velocity (Java) | `#set($x=7*7)$x` | `49` |
| Thymeleaf (Spring) | `${7*7}` en `th:text` o `[[${7*7}]]` | `49` |
| ERB (Rails) | `<%= 7*7 %>` | `49` |
| Mako (Python) | `${7*7}` | `49` |
| Handlebars (Node) | `{{7*7}}` | NO ejecuta — Handlebars es logic-less. Probar `{{#with}}` trick. |
| Razor (.NET) | `@(7*7)` | `49` |
| Liquid (Shopify) | `{{ 7 \| times: 7 }}` | `49` (filter syntax) |
| Pug / Jade | `#{7*7}` | `49` |
| Nunjucks | `{{7*7}}` | `49` (clone de Jinja2 en JS) |
| Django | `{{7*7}}` | NO ejecuta — Django no permite expr. Probar `{% debug %}`. |
| Errores que confirman engine | Stack trace con nombre del lib en backend | Lookup CVE/exploits. |
^ssti-detect-confirmacion

### Workflow tras detección

```
1. Probe polyglot → recibir error verbose o reflexión.
2. Identificar delimitador funcional con test aritmético.
3. Confirmar engine exacto con test diferenciador (ej: 7*'7').
4. Mapear contexto:
   - ¿Hay sandbox?
   - ¿Qué objetos están en context (config, request, etc)?
   - ¿Filtros XSS-style aplicados antes del template?
5. Escalar a RCE según engine (ver SSTI - Ejecución por Engine).
```

---
