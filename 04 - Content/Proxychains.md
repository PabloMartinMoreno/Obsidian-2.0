---
aliases:
tags:
  - type/command
primary categories:
secondary categories:
tertiary categories:
type: Command
linked:
---
# Proxychains

***

Para utilizar `proxychains`, primero hay que editar `/etc/proxychains.conf`, comentar la última línea y añadir la siguiente línea al final:
```bash
#socks4         127.0.0.1 9050
http 127.0.0.1 8080
```

## Ejemplos

### Con `curl`
```bash
proxychains -q curl http://SERVER_IP:PORT
```

### Con `Metasploit`:
```bash
set PROXIES HTTP:127.0.0.1:8080
# luego run
```
