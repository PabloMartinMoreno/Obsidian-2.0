---
aliases:
  - OAuth Tooling
  - EsPReSSO
  - jwt_tool
  - Keycloak Test
tags:
  - type/cheatsheet
  - vuln/oauth
  - technique/discovery
  - asset/web-app
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[OAuth 2.0 Misconfigurations]]"
  - "[[Burp Suite]]"
  - "[[JWT Attacks]]"
---
# OAuth 2.0 - Tooling

***

## Burp Suite + Extensions

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| EsPReSSO (BApp Store) | Extensions → BApp Store → EsPReSSO | Auto-detect OAuth/SAML, parse tokens, scan vulns. |
| JSON Web Tokens (BApp Store) | Extensions → BApp Store → JSON Web Tokens | Decode/edit JWTs in-place. |
| Param Miner | Extensions → BApp Store → Param Miner | Discover hidden params en authorize/token. |
| Active Scanner Pro | Built-in Pro | Detecta open redirects en redirect_uri. |
| Repeater + macros | Built-in | Replay flow steps, mod state/code/redirect_uri. |
| Logger++ | Extensions → BApp Store | Filter requests por endpoint OAuth. |
| Match & Replace | Settings → Sessions | Mod redirect_uri auto en todos los requests. |
| Comparer | Built-in | Diff de responses con/sin params. |
| Intruder fuzz | Built-in | Fuzz redirect_uri con bypasses. |
| Scope-aware Proxy filter | `https://target/oauth/*` | Capture only OAuth flow. |
| HTTP/2 support | Pro v2024+ | Modern OAuth servers. |
| Save Item to Project | Built-in | Save token captures for later. |
| Authentication Recorder | Pro | Record full OAuth flow as macro. |
| Burp BCheck | Pro v2023+ | Custom OAuth checks. |
| `Authz` extension (Authorization plugin) | BApp Store | Test scope/role escalations. |
| HTTP Request Smuggler combo | BApp Store | Flow desync abuse. |
^oauth-tool-burp

### Workflow Burp típico

```
1. Proxy → loggear flow desde click "Sign in with X"
2. EsPReSSO → identifica flow type, params, scope
3. Repeater → modificar redirect_uri, state, response_type, scope
4. Send to Intruder → fuzz redirect_uri con bypasses (parser confusion list)
5. Comparer → diff de responses con/sin state
6. Save flow as macro → replay con cambios
```

___

## CLI y Discovery

| **Tool** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| oauth-toolkit (dafthack) | `git clone https://github.com/dafthack/oauth-toolkit && python oauth-toolkit.py -u target` | Bulk OAuth testing. |
| oauthscan (maraisr) | `oauthscan https://target` | Misconfig scanner. |
| openid-cli | `openid-cli probe https://target` | OIDC test. |
| curl + jq manual | `curl -s URL/.well-known/openid-configuration \| jq .` | Discovery base. |
| HTTPie | `http https://target/.well-known/openid-configuration` | Pretty CLI. |
| postman OAuth collection | `postman.com/templates/oauth-2-0` | GUI flow runner. |
| Insomnia OAuth | Built-in OAuth flow runner | Adjacent. |
| `httpx` bulk discovery | `subfinder -d X \| httpx -path /.well-known/openid-configuration -mc 200` | Bulk recon. |
| `nuclei oauth-templates` | `nuclei -u target -t http/exposures/oauth*` | Templates dedicados. |
| `katana` crawl + grep | Crawl JS bundles, grep `client_id` | Frontend recon. |
| `getJS` extract endpoints | Extract OAuth URLs from bundles | Recon. |
| `gau` archive endpoints | URLs históricas via Wayback | Historical client_ids. |
| `waybackurls` | `waybackurls target.com \| grep oauth` | Same. |
| `subjack` takeover | Subdomain enum + takeover check | redirect_uri bypass combo. |
| `interactsh` OOB | Detect OOB callbacks | SSRF combo. |
^oauth-tool-cli

### Bulk discovery pipeline

```bash
# Subdomains + OAuth discovery + JWKS
subfinder -d known.com -silent | \
  httpx -silent -path /.well-known/openid-configuration -mc 200 | \
  while read url; do
    echo "=== $url ==="
    curl -s "$url" | jq '{
      issuer, 
      authorization_endpoint, 
      token_endpoint,
      registration_endpoint,
      response_types_supported,
      grant_types_supported,
      code_challenge_methods_supported,
      token_endpoint_auth_methods_supported
    }'
  done
```

___

## JWT-specific Tools

| **Tool** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| jwt.io decoder | `jwt.io` (browser) | NO usar producción tokens — logs. |
| jwt-cli (mike-engel) | `jwt decode TOKEN` | Local decode/encode. |
| jwt_tool (ticarpi) | `python3 jwt_tool.py TOKEN` | Attack suite. |
| jwt_tool alg none | `python3 jwt_tool.py TOKEN -X a` | Test alg=none. |
| jwt_tool HMAC confusion | `python3 jwt_tool.py TOKEN -X k` | RS→HS confusion. |
| jwt_tool HMAC crack | `python3 jwt_tool.py TOKEN -C -d wordlist.txt` | Brute weak HMAC. |
| jwt_tool kid injection | `python3 jwt_tool.py TOKEN -X i -I -hc kid -hv "../../tmp/x"` | kid path traversal. |
| hashcat HMAC | `hashcat -m 16500 jwt.txt rockyou.txt` | GPU brute. |
| jwks-rotated analysis | Public key pinning analysis | Adjacent. |
| Burp JSON Web Tokens | In-place edit | Manual. |
| `jwt_resign.py` script | Re-sign con leaked key | Custom. |
| `python-jose` lib | Programmatic | For automation. |
| `pyjwt` lib | Decode/encode | Standard Python. |
| `jose-jwt` (Node) | Encode/decode | JS. |
| `jwx` (Go) | Robust impl | Server-side test. |
| OpenSSL key manipulation | `openssl ec -pubin -in key.pem` | Cert/key inspection. |
^oauth-tool-jwt

### JWT attack quick checks

```bash
# Decode local
echo "$JWT" | jwt-cli decode

# alg=none test
python3 jwt_tool.py "$JWT" -X a

# HMAC crack
python3 jwt_tool.py "$JWT" -C -d /usr/share/wordlists/rockyou.txt

# RS256 → HS256 confusion (need server's RSA pub key)
python3 jwt_tool.py "$JWT" -X k -pk pubkey.pem
```

___

## Test Servers / Sandboxes

| **Server** | **Setup** | **Notas** |
|:---:|:---:|:---:|
| Auth0 dev tenant | `auth0.com` free signup | Full OAuth/OIDC playground. |
| Keycloak | `docker run -p 8080:8080 quay.io/keycloak/keycloak start-dev` | Self-host total control. |
| ory/hydra | `docker run oryd/hydra:latest` | Lightweight OAuth2. |
| oauth.tools | `oauth.tools` browser | Online flow inspector. |
| oidc-playground | `openidconnect.net` | OIDC interactive. |
| WebGoat | `docker run webgoat/webgoat-8.0` | OWASP labs. |
| OWASP Juice Shop | `docker run bkimminich/juice-shop` | Modern app vulns. |
| PortSwigger Web Security Academy | `portswigger.net/web-security/oauth` | 5 free OAuth labs. |
| HackTheBox / TryHackMe | OAuth-themed boxes | Practice. |
| CTF Time OAuth challenges | `ctftime.org` search OAuth | Real challenges. |
| Local IdP simulator | Custom Express/Flask mock | DIY testing. |
| Spring Authorization Server | Java reference impl | Production-grade. |
| Okta dev | `developer.okta.com` | Free dev tenant. |
| Curity Dev | `curity.io` | Free dev license. |
| AWS Cognito free tier | Cloud-managed | AWS edge. |
| Microsoft Entra ID dev | Azure dev tenant | Microsoft stack. |
^oauth-tool-sandbox

### Keycloak quick-start

```bash
# Run
docker run --rm -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:latest start-dev

# Console: http://localhost:8080
# Create realm → create client → enable PKCE → test bypass attempts
```

___

## Wordlists & Payload Repos

| **Repo** | **Contenido** | **Notas** |
|:---:|:---:|:---:|
| [PayloadsAllTheThings - OAuth](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/OAuth%20Misconfiguration) | Bypass payloads, redirect_uri tricks | Foundation. |
| [SecLists Discovery/oauth.txt](https://github.com/danielmiessler/SecLists) | Common OAuth endpoints | Recon list. |
| [HackTricks - OAuth to Account Takeover](https://book.hacktricks.xyz/pentesting-web/oauth-to-account-takeover) | Reference completo | Comprehensive. |
| HackerOne disclosed reports OAuth | `hackerone.com/hacktivity?querystring=oauth` | Real chains. |
| Bugcrowd VRT OAuth section | Severity scoring | Reference. |
| [OWASP OAuth Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html) | Defense | Defender side. |
| RFC 6819 Threat Model | `datatracker.ietf.org/doc/html/rfc6819` | Spec threat catalog. |
| RFC 9700 Best Practices | `datatracker.ietf.org/doc/html/rfc9700` | Modern (2025). |
| RFC 9207 iss parameter | Mix-up defense | Per-IdP. |
| RFC 7636 PKCE | Proof Key Code Exchange | Spec base. |
| OAuth 2.1 Draft | `datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1` | Consolidated security. |
| Aaron Parecki blog | `aaronparecki.com/oauth-2-simplified` | Practical writeups. |
| Daniel Fett papers | `danielfett.de` | Academic deep dives. |
| Orange Tsai SSRF paper | URL parser tricks | redirect_uri parser bypass. |
| OAuth 2.0 Threat Model book | "OAuth 2 in Action" | Comprehensive. |
| Web Security Academy OAuth | PortSwigger content + labs | Hands-on. |
^oauth-tool-wordlists

***
