---
aliases: null
tags:
  - type/technique
  - vuln/command-injection
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[OS Command Injection]]'
---
# Operadores Especificos

***

## Cheatsheet

|    **Tipo de Inyección**     |                   **Operadores Comunes**                    |
|:----------------------------:|:-----------------------------------------------------------:|
|    <br>**SQL Injection**     |           <pre><code>' , ; -- /* */</code></pre>            |
|  <br>**Command Injection**   |                 <pre><code>;&&</code></pre>                 |
| <br>**OS Command Injection** |                <pre><code>;&\|</code></pre>                 |
|    <br>**LDAP Injection**    |             <pre><code>* ( ) & \|</code></pre>              |
|   <br>**XPath Injection**    | <pre><code>' or and not substring concat count</code></pre> |
|    <br>**Code Injection**    |   <pre><code>' ; -- /* */ $() ${} #{} %{} ^</code></pre>    |
| <br>**Directory Traversal**  |            <pre><code>../ ..\\ %00</code></pre>             |
|   <br>**Object Injection**   |               <pre><code>; & \|</code></pre>                |
|   <br>**XQuery Injection**   |        <pre><code>`'` `;` `--` `/* */`</code></pre>         |
| <br>**Shellcode Injection**  |             <pre><code>\x \u %u %n</code></pre>             |
|   <br>**Header Injection**   |       <pre><code>\n \r\n \t %0d %0a %09</code></pre>        |
^ci-operadores-especificos

***

## Overview


***

## Notas Relacionadas


***
