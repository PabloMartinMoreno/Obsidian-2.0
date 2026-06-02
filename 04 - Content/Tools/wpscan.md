---
aliases:
tags:
  - tool/wpscan
  - service/wordpress
kind: Tool
linked:
  - "[[WordPress Enumeration]]"
---
# wpscan

> [!info]
> Scanner especializado WordPress. Enum users, plugins, themes, vuln plugins/themes/versions con base de datos WPScan (API key gratuita para usar).

---

## Cheatsheet

| Comando | Qué obtenés | Cuándo |
|---|---|---|
| `wpscan --url http://<target>` | Default enum (version, headers) | Recon inicial |
| `wpscan --url http://<target> -e u` | Enum users (via author archive, REST API) | User list |
| `wpscan --url http://<target> -e vp` | Vulnerable plugins | Buscar exploit |
| `wpscan --url http://<target> -e vt` | Vulnerable themes | Idem themes |
| `wpscan --url http://<target> -e ap` | All plugins | Inventory completo |
| `wpscan --url http://<target> -e at` | All themes | Idem |
| `wpscan --url http://<target> -e cb` | Config backups | Buscar `.bak`, `.old` |
| `wpscan --url http://<target> --api-token <KEY>` | Vuln DB lookup | Recomendado |
| `wpscan --url http://<target> -U admin -P rockyou.txt` | Brute force /wp-login.php | Auth attack |

---

## Workflow típico

```bash
# 1. Recon completo + vuln scan
wpscan --url http://target/ --api-token <KEY> -e ap,at,u

# 2. Si encontrás version + plugin vuln → searchsploit
searchsploit wordpress <plugin> <version>

# 3. Si encontrás user válido → brute force
wpscan --url http://target/ -U <user> -P /usr/share/wordlists/rockyou.txt --max-threads 5

# 4. Post-auth: shell via theme/plugin editor (manual)
```

---

## API token

Free tier en https://wpscan.com — 25 req/día. Sin token, plugin DB no se consulta.

```bash
wpscan --url http://target/ --api-token <YOUR_KEY>
```

---

## Notas Relacionadas

- [[WordPress Enumeration]]
- [[searchsploit]]
- [[HTTP Brute Forcing]]
