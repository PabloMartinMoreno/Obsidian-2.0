---
aliases:
  - "openssl"
  - SSL/TLS
  - TLS
tags:
  - service/http
kind: Concept
linked:
---
# SSL - TLS

> [!info]
> **Transport Layer Security** — protocolo de cifrado para comunicaciones. SSL (deprecated). Pentest: weak ciphers, expired/invalid certs, info leak via SNI, downgrade attacks, cert misconfigs.

---

## Recon TLS

```bash
# Info básica
openssl s_client -connect <target>:443 -showcerts

# SNI específico
openssl s_client -connect <target>:443 -servername <vhost>

# Probar versión TLS específica
openssl s_client -connect <target>:443 -tls1_2

# Listar ciphers soportados
nmap --script ssl-enum-ciphers -p 443 <target>

# testssl.sh (comprehensive)
testssl.sh https://<target>/

# sslyze (rápido + JSON)
sslyze --regular <target>:443
```

---

## Findings comunes

| Hallazgo | Severidad | Notas |
|---|---|---|
| **TLS 1.0 / 1.1 enabled** | Medium | Deprecated por PCI/IETF |
| **SSLv2 / SSLv3** | High | POODLE, DROWN |
| **Weak ciphers** (RC4, DES, 3DES, EXPORT) | Medium-High | Sweet32, FREAK |
| **No HSTS** | Low | Falta `Strict-Transport-Security` |
| **Cert expirado** | Info-High | Cert mgmt issue |
| **Self-signed cert** | Info | Posible MITM target |
| **Wildcard cert** | Info | Reuse cross-subdomain |
| **CN mismatch** | Medium | MITM vector |
| **Heartbleed** (CVE-2014-0160) | Critical | OpenSSL < 1.0.1g |
| **CRIME / BREACH** | Medium | Compression-based info leak |
| **Logjam** | Medium | Weak DH params |
| **ROBOT** | High | RSA padding oracle |

---

## Info recon via cert

```bash
# Subject Alternative Names → subdomains
openssl s_client -connect <target>:443 -showcerts </dev/null 2>/dev/null | \
  openssl x509 -text -noout | grep -A1 "Subject Alternative"

# Cert Transparency logs (alternativa, OSINT)
curl -s "https://crt.sh/?q=<domain>&output=json" | jq -r '.[].name_value'
```

---

## Notas Relacionadas

- [[Certificate Transparency Logs]]
- [[Subdomains Passive Enumeration]]
- [[Fingerprinting Web Technologies]]
