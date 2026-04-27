---
aliases:
  - tplmap
  - SSTI Burp Extensions
  - SSTI Wordlists
tags:
  - type/cheatsheet
  - vuln/ssti
  - technique/discovery
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Server-Side Template Injection (SSTI)]]'
  - '[[Burp Suite]]'
---
# SSTI - Tooling

***

## tplmap

| **Objetivo** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Instalación | `git clone https://github.com/epinna/tplmap && cd tplmap && pip install -r requirements.txt` | Python — único auto-exploit dedicado. |
| Probe URL GET param | `python tplmap.py -u "https://target/page?name=test"` | Detecta engine + RCE auto. |
| Probe POST param | `python tplmap.py -u "https://target/page" -X POST -D "name=test"` | Form data. |
| Header injection | `python tplmap.py -u "https://target/" -H "User-Agent: test"` | Header como vector. |
| Cookie injection | `python tplmap.py -u "https://target/" --cookie "session=test"` | Cookie. |
| Especificar param | `python tplmap.py -u "https://target/page?a=x&b=y" --param b` | Tarjet param específico. |
| OS shell mode | `python tplmap.py -u "..." --os-shell` | Shell interactiva remota. |
| Read file | `python tplmap.py -u "..." --upload local.txt remote.txt` | File transfer. |
| Engine específico | `python tplmap.py -u "..." --engine jinja2` | Skip detection. |
| Attack level | `python tplmap.py -u "..." --level 5` | Profundidad de probes (1-5). |
| Verbose | `python tplmap.py -u "..." -v 5` | Debug full. |
| Bypass auth | Combinar con `--cookie` o `--auth` | Authenticated SSTI. |
| Output evidence | tplmap reporta engine + payload exitoso | Para reporte / replicar manual. |
| Limitaciones | No soporta todos los engines (Mako parcial, Razor no) | Manual fallback necesario. |
^ssti-tool-tplmap

___

## Burp Extensions

| **Extension** | **Función** | **Uso** |
|:---:|:---:|:---:|
| **Tplmap** (Burp wrapper) | Wrapper de tplmap dentro de Burp | Right-click request → "Send to tplmap". |
| **Backslash Powered Scanner** | Scanner activo + heurístico | Detecta SSTI entre otros — PortSwigger. |
| **Hackvertor** | Tags para encoding payloads | `<@base64><@quote>{{7*7}}<@/quote><@/base64>` — útil para bypass. |
| **HTTP Request Smuggler** | Smuggle a endpoints de SSTI | Combo. |
| **Param Miner** | Discover hidden params + headers | Encuentra inputs no obvios para SSTI. |
| **Active Scan++** | Mejora active scanner default | SSTI checks adicionales. |
| **Reflection** | Detecta dónde se reflejan inputs | Pre-screening rápido. |
| **JS Link Finder** | Endpoints JS | A veces revela templates client-side. |
| **Logger++** | Filtros avanzados de historial | Buscar `7*7` reflejado en logs. |
| **Turbo Intruder** | Volume + race | Para fuzzing payloads grandes. |
| **Collaborator Everywhere** | Inyecta Collaborator URLs en headers | OOB SSTI confirm si template hace SSRF. |
| **AuthMatrix** | Test SSTI bajo distintos roles | Privesc testing. |
^ssti-tool-burp

___

## Wordlists de Payloads

| **Wordlist** | **Path / Repo** | **Uso** |
|:---:|:---:|:---:|
| **PayloadsAllTheThings - SSTI** | `PayloadsAllTheThings/Server Side Template Injection/Intruder/` | Listas por engine. |
| **SecLists - SSTI** | `SecLists/Fuzzing/template-engines-special-vars.txt` | Vars contextuales. |
| **SSTI Polyglot** | `${{<%[%'"}}%\\` y variantes | Single-shot detection. |
| **PayloadsAllTheThings - Polyglots** | `Polyglots/SSTI/` | Multi-engine. |
| **HackTricks payloads** | https://book.hacktricks.xyz/pentesting-web/ssti-server-side-template-injection | Compilation. |
| **Awesome SSTI** | https://github.com/topics/ssti repos | Various researchers. |
| **Burp Intruder default** | "Server Side Template Injection (Polyglot)" payload set | Built-in. |
| **fuzzdb** | https://github.com/fuzzdb-project/fuzzdb | `attack/server-side-include/` |
| **wordlist Jinja2 bypasses** | Compilation en gist público | Listas de bypasses específicos `_class_*`. |
| **wordlist Twig filters** | Lista de filters disponibles Twig 1.x/2.x/3.x | Para filter abuse fuzzing. |
^ssti-tool-wordlists

### Setup intruder + polyglot

```bash
# 1. Identificar request reflejado
# 2. Burp → Intruder → Position: payload field
# 3. Payload set:
#    - PayloadsAllTheThings/SSTI/Intruder/SSTI.fuzz
#    - O custom polyglots
# 4. Grep extract: regex `49|7777777|49\.0`
# 5. Sort responses por length (anomalies)
```

### Manual fuzzing rápido

```bash
# One-liner detección rápida con curl
for p in '{{7*7}}' '${7*7}' '<%= 7*7 %>' '#{7*7}' '@(7*7)' '{7*7}' '*{7*7}'; do
  echo "Testing: $p"
  curl -s "https://target/page?q=$(echo $p | jq -sRr @uri)" | grep -E '49|7777777' && echo "VULN: $p"
done
```

***
