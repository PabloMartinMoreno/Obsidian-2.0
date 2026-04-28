---
aliases:
  - HPP Detection
  - Parameter Pollution Recon
tags:
  - type/cheatsheet
  - vuln/hpp
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - '[[HTTP Parameter Pollution]]'
---
# HPP - Detección y Reconocimiento

***

## Identificar Endpoints con Multiple Params

| **Pattern** | **Endpoint type** | **Notas** |
|:---:|:---:|:---:|
| Multi-input forms | Login, search, profile updates | Standard. |
| API con many params | REST endpoints con N query params | Common. |
| Filter/sort endpoints | `?filter=X&sort=Y&page=Z` | Search patterns. |
| Multi-step forms | Wizard steps con accumulated params | Edge. |
| Upload endpoints | Multipart con file + metadata fields | Mixed inputs. |
| OAuth / federation | Multiple state, code, redirect_uri | Auth flow. |
| Booking / e-commerce | Cart, payment, shipping params | Business logic. |
| GraphQL variables | JSON variables (different vector) | Adjacent. |
| WebSocket params | Frame-based params | Real-time. |
| Mobile APIs | Often multi-param | Mobile chain. |
| Hidden params | Use Param Miner to discover | Recon. |
| Internal admin endpoints | More params typically | High value. |
| Rate limit / pagination | `?limit=X&offset=Y` | Common. |
| State-changing endpoints | POST con multi-field body | High impact. |
| Configuration endpoints | `?key=X&value=Y` | Edge. |
^hpp-detect-endpoints

___

## Probes con Duplicate Params

| **Probe** | **Behavior to observe** | **Notas** |
|:---:|:---:|:---:|
| Basic duplicate | `?a=1&a=2` → app uses what? | Standard. |
| First wins | Backend uses `1` | Java common. |
| Last wins | Backend uses `2` | PHP / Python / Ruby common. |
| Concatenation | Backend uses `1,2` | ASP.NET. |
| Array | Backend uses `[1, 2]` | Some PHP / Express qs. |
| Error | Backend rejects 400 | Strict apps. |
| Mixed source | Query `?a=1` + body `a=2` → which wins? | Multi-source. |
| Encoded duplicate | `?a=1&%61=2` (`%61`=`a`) | Encoding trick. |
| Case difference | `?a=1&A=2` | Case sensitivity. |
| With array notation | `?a=1&a[]=2` | Mixed types. |
| With dot notation | `?a=1&a.b=2` | Edge framework. |
| Parameter count limit | Some apps limit N params | DoS edge. |
| HTTP body parsing | POST con `a=1&a=2` | Same params. |
| JSON body | `{"a":1, "a":2}` (legal en RFC) | Edge per-parser. |
| Cookie collision | Multi cookie con same name | Cookie tossing. |
^hpp-detect-probes

### Probe matrix

```bash
TARGET="https://target/search"

# Test 1: Duplicate query param
curl -s "$TARGET?q=A&q=B" | grep -oE 'A|B' | head -3
# Inspect: which value reflected?

# Test 2: Different sources
curl -s -X POST -d "q=BODY_VAL" "$TARGET?q=QUERY_VAL"
# Which wins?

# Test 3: Encoding bypass
curl -s "$TARGET?q=A&%71=B"  # %71 = q
# Stack-dependent

# Test 4: Array notation
curl -s "$TARGET?q[]=A&q[]=B"

# Test 5: Multiple HTTP headers same name (Burp Repeater easier)
# Edit headers en Burp Repeater
```

___

## Detectar Parser Behavior por Stack

| **Stack** | **Default behavior** | **Test method** |
|:---:|:---:|:---:|
| PHP `$_GET` | Last value wins | `?a=1&a=2` → `$_GET['a']` is `2`. |
| PHP `$_POST` | Last value wins | Same. |
| PHP `$_REQUEST` | Order: `EGPCS` (Env, Get, Post, Cookie, Server) — last source wins | Per-config. |
| ASP.NET `Request.QueryString["a"]` | Comma-separated concatenation | `?a=1&a=2` → `"1,2"`. |
| Java `request.getParameter("a")` | First wins | `?a=1&a=2` → `"1"`. |
| Java `request.getParameterValues("a")` | Array `["1", "2"]` | Explicit multi. |
| Python Flask `request.args.get('a')` | First wins (Werkzeug default) | `?a=1&a=2` → `"1"`. |
| Python Flask `request.args.getlist('a')` | List `["1", "2"]` | Explicit. |
| Python Django | First wins | `?a=1&a=2` → `"1"`. |
| Node.js Express + `qs` | Array `["1", "2"]` (default) | `?a=1&a=2` → `["1", "2"]`. |
| Node.js Express + `querystring` (legacy) | Array always | Same. |
| Node.js with `parseQueryString:false` | Manual handling | Edge. |
| Ruby on Rails | Last wins | `?a=1&a=2` → `"2"`. |
| ASP.NET MVC con FormCollection | Concatenation comma-separated | Default. |
| Go `r.URL.Query().Get("a")` | First wins | Standard. |
| Go `r.URL.Query()["a"]` | Array | Explicit. |
| WAF behavior | May normalize differently | Per-WAF. |
| Reverse proxy | May concat / dedupe | Per-proxy. |
^hpp-detect-stack

### Quick stack test

```bash
# Test PHP / Python / Java / Node.js / Ruby differential
TARGET="https://target/echo"

# Send duplicate, see which value backend uses
RESPONSE=$(curl -s "$TARGET?param=FIRST&param=LAST")
echo "$RESPONSE" | head

# Likely behaviors:
# - Returns "FIRST"  → Java / Python / Go (first wins)
# - Returns "LAST"   → PHP / Python (Flask alt) / Ruby / Node.js single-string mode
# - Returns "FIRST,LAST" → ASP.NET
# - Returns ["FIRST", "LAST"] → Node.js qs / explicit array
# - Error 400        → strict app
```

***
