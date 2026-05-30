---
aliases:
  - "API Gateway"
  - "Zero Trust"
  - "Control de Acceso"
  - "Control de Acceso Basado en Roles"
  - "Defensa en Profundidad"
  - "UUID"
  - "API authentication token"
  - "Token-based Login"
  - "API Abuse for User Creation"
  - "CORS Misconfiguration Enumeration"
  - "API Enumeration"
  - API REST
  - REST API Security
tags:
  - estado/completo
  - asset/api
  - asset/web-app
kind: Concept
linked:
  - "[[GraphQL Injection]]"
  - "[[JWT Attacks]]"
  - "[[BOLA - IDOR]]"
  - "[[OAuth 2.0 Misconfigurations]]"
  - "[[Mass Assignment]]"
---
# API Security

> [!info]
> Pentest de APIs (REST/GraphQL/SOAP). Surface attack incluye auth/authz, BOLA, injection, mass assignment, rate limit. OWASP API Top 10.

***

## OWASP API Top 10 (2023)

| ID | Riesgo | Notas |
|---|---|---|
| API1 | **Broken Object Level Auth (BOLA)** | [[BOLA - IDOR]] |
| API2 | **Broken Authentication** | [[Auth Bypass - Bypass de Autenticacion]] |
| API3 | **Broken Object Property Auth** | Hidden fields modificables |
| API4 | **Unrestricted Resource Consumption** | Sin rate limit → DoS/cost |
| API5 | **Broken Function Level Auth** | Vertical priv escalation |
| API6 | **Unrestricted Access to Sensitive Business Flows** | Logic abuse |
| API7 | **Server Side Request Forgery** | [[Server-Side Request Forgery (SSRF)]] |
| API8 | **Security Misconfiguration** | CORS, headers, default endpoints |
| API9 | **Improper Inventory Management** | Old API versions con vulns |
| API10 | **Unsafe Consumption of APIs** | Trust third-party API responses |

***

## Discovery

```bash
# Swagger/OpenAPI standard paths
/swagger.json
/swagger-ui.html
/api-docs
/openapi.json
/v1/api-docs
/docs

# GraphQL
/graphql
/v1/graphql
/api/graphql

# Wordlists
ffuf -w SecLists/Discovery/Web-Content/api/api-endpoints.txt -u https://target/FUZZ
```

***

## Auth analysis

| Check | Cómo |
|---|---|
| **JWT** algorithm | Ver `alg: HS256/RS256/none` en header |
| **API Key** location | Header (`X-API-Key`), query param, body |
| **OAuth flow** | `redirect_uri` validation, scope, state |
| **Session token** | Predictable? Long-lived? Revocable? |

Ver [[JWT Attacks]], [[OAuth 2.0 Misconfigurations]].

***

## BOLA / IDOR

```http
GET /api/users/123/profile
GET /api/users/124/profile   # ← tu user es 123, intentás 124
```

Si responde sin error → BOLA.

Ver [[BOLA - IDOR]].

***

## Mass Assignment

```http
PATCH /api/users/me
{"email":"new@x.com","role":"admin"}    ← role no debería ser settable
```

Ver [[Mass Assignment]].

***

## Tools

- **Postman / Insomnia** — explore APIs manually
- **Burp Suite** — proxy + Repeater
- **Kiterunner** — content discovery API-specific
- **arjun** — HTTP param discovery
- **GraphQL specific**: GraphCrawler, InQL, graphql-cop
- **OWASP ZAP** — scanner

***

## Notas Relacionadas

- [[GraphQL Injection]]
- [[BOLA - IDOR]]
- [[JWT Attacks]]
- [[OAuth 2.0 Misconfigurations]]
- [[Mass Assignment]]
- [[HTTP Parameter Pollution]]
