---
aliases:
  - OAuth Tooling
tags:
  - vuln/oauth
  - technique/tooling
primary: "[[OAuth 2.0 Misconfigurations]]"
---

# OAuth 2.0 - Tooling

Herramientas para reconnaissance, exploit, y testing de OAuth flows.

## Burp Suite + Extensions

Burp es el centro de operaciones para OAuth pentesting. Proxy captura todo el flow, extensions automatizan análisis.

| Tool | Tipo | Uso |
|------|------|-----|
| **EsPReSSO** (BApp Store) | Extension | Auto-detecta flows OAuth/SAML, parsea tokens, scan vulnerabilidades comunes |
| **JSON Web Tokens** (BApp Store) | Extension | Decode/edit JWTs en lugar (id_token tampering) |
| **Param Miner** | Extension | Discover hidden params en `/authorize` y `/token` |
| **Active Scanner** | Built-in Pro | Detecta open redirects en redirect_uri (low confidence) |
| **Repeater + macros** | Manual | Replay flow steps, modify state/code/redirect_uri |
| **Logger++** | Extension | Filter requests por endpoint OAuth para ver flow completo |
| **Match & Replace** | Built-in | Mod `redirect_uri` automático para todos los requests |

```
# Workflow Burp típico
1. Proxy → loggear flow completo desde click en "Sign in with Google"
2. EsPReSSO → identificar flow type, scope, params
3. Repeater → modificar redirect_uri, state, response_type, scope
4. Send to Intruder → fuzz redirect_uri con bypasses
5. Comparer → diff de responses con/sin params
```

^oauth-tool-burp

## OAuth-specific CLI

Tools dedicadas para automation y discovery.

| Tool | Foco | Comando ejemplo |
|------|------|----------------|
| [**oauthtoolkit**](https://github.com/dafthack/oauth-toolkit) | Bulk OAuth testing | `oauth-toolkit -u https://target -e enum` |
| [**SSOScan**](https://www.ssoscan.org/) (paper / arch only) | Academic scanner | Reference implementation |
| [**oauthscan**](https://github.com/maraisr/oauthscan) | Misconfig scanner | `oauthscan https://target` |
| **curl + jq** | Manual | Discovery via `.well-known` |
| [**HTTPie**](https://httpie.io/) | Pretty CLI | `http https://target/.well-known/openid-configuration` |
| [**postman-oauth-collection**](https://learning.postman.com/docs/sending-requests/authorization/oauth-20/) | Test runs | GUI flow test |
| [**openid-cli**](https://github.com/identity-provider-cli) | OIDC test | Validate id_token |

```bash
# Discovery rápido
curl -s https://target/.well-known/openid-configuration | jq .

# Bulk subdomain discovery + OAuth check
subfinder -d known.com | \
  httpx -path /.well-known/openid-configuration -mc 200 \
  -title -web-server
```

^oauth-tool-cli

## JWT-specific Tools

`id_token` (OIDC) es JWT. Validar/atacar requiere herramientas JWT.

| Tool | Uso |
|------|-----|
| [**jwt.io**](https://jwt.io/) | Decoder online (no usar con production tokens — they get logged) |
| [**jwt-cli**](https://github.com/mike-engel/jwt-cli) | Decode/encode local: `jwt decode TOKEN` |
| [**JWT Tool**](https://github.com/ticarpi/jwt_tool) | Attack suite: `python3 jwt_tool.py TOKEN -X a` (alg none), `-X k` (HMAC confusion), `-C -d wordlist.txt` (HMAC crack) |
| [**hashcat**](https://hashcat.net/) | HMAC crack: `hashcat -m 16500 jwt.txt wordlist.txt` |
| [**jwks-rotated**](https://github.com/CICADA8-Research/jwks-rotated) | JWKS endpoint analysis |
| **Burp JSON Web Tokens** | In-place edit |

```bash
# Decode local
echo "$JWT" | jwt-cli decode

# Test alg=none
python3 jwt_tool.py "$JWT" -X a

# HMAC crack
python3 jwt_tool.py "$JWT" -C -d /usr/share/wordlists/rockyou.txt
```

^oauth-tool-jwt

## OAuth Test Servers / Sandboxes

Para reproducir/test sin riesgo en producción.

| Server | Uso |
|--------|-----|
| [**Auth0 dev tenant**](https://auth0.com/) | Free tier, full OAuth/OIDC playground |
| [**Keycloak**](https://www.keycloak.org/) | Self-host, control total | `docker run -p 8080:8080 quay.io/keycloak/keycloak start-dev` |
| [**ory/hydra**](https://www.ory.sh/hydra/) | Lightweight OAuth2 server | `docker run oryd/hydra:latest` |
| [**oauth.tools**](https://oauth.tools/) | Online flow inspector |
| [**oidc-playground**](https://openidconnect.net/) | OIDC interactive |
| [**WebGoat / OWASP Juice Shop**](https://owasp.org/www-project-juice-shop/) | Vuln OAuth labs |
| **PortSwigger Web Security Academy** | OAuth labs gratuitos con writeups |

PortSwigger tiene 5 labs OAuth gratis (authentication bypass, redirect_uri, openid scope, etc) — excellent training ground.

^oauth-tool-sandbox

## Wordlists & Payload Repos

| Repo | Contenido |
|------|-----------|
| [**PayloadsAllTheThings/OAuth**](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/OAuth%20Misconfiguration) | Bypass payloads, redirect_uri tricks |
| [**SecLists - Discovery/Web-Content/oauth.txt**](https://github.com/danielmiessler/SecLists) | Common OAuth endpoints |
| [**HackTricks - OAuth**](https://book.hacktricks.xyz/pentesting-web/oauth-to-account-takeover) | Reference completo |
| [**Bug bounty disclosed reports**](https://hackerone.com/hacktivity?querystring=oauth) | Real-world chains |
| [**OWASP Cheat Sheet - OAuth**](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html) | Defense |
| [**RFC 6819**](https://datatracker.ietf.org/doc/html/rfc6819) | Threat model spec |
| [**Aaron Parecki blog**](https://aaronparecki.com/) | OAuth practical writeups |

^oauth-tool-wordlists
