---
aliases:
tags:
  - env/linux
  - tool/xargs
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Operational Tasks]]"
tertiary categories:
  - "[[Procedures & Methodologies]]"
kind: Tool
linked:
  - "[[sed]]"
  - "[[Common Linux Utilities]]"
  - "[[grep]]"
  - "[[find]]"
  - "[[awk]]"
---
# Comando `xargs`

> [!info] xargs (e**x**tended **arg**uments)
> Construye y ejecuta comandos a partir de stdin: toma la salida de un comando y la pasa como **argumentos** a otro. Resuelve el caso de comandos que no leen de stdin. Sintaxis: `comando | xargs [opciones] comando`.
^definicion

---

## Cheatsheet

| **Comando** | **Qué obtenés** | **Cuándo** |
|---|---|---|
| `find . -name '*.log' \| xargs grep 'error'` | Grep en muchos archivos | Chain básico |
| `find . -name '*.log' -print0 \| xargs -0 grep 'error'` | Idem con null delim | Filenames con espacios |
| `cat ips.txt \| xargs -I{} curl http://{}/` | Sustituir token por cada item | Comando per-item |
| `cat ips.txt \| xargs -P 10 -I{} nmap -sV {}` | 10 jobs en paralelo | Recon masivo |
| `cat hashes.txt \| xargs -L 1 hashid` | Una arg por ejecución | Tools sin stdin |
| `echo 'one two three' \| xargs -n 1` | Un arg por línea | Split de args |
| `find . -name '*.tmp' -print0 \| xargs -0 rm -v` | Borrado seguro | Nombres con espacios |
^xargs-cheatsheet

---

## Opciones

| **Flag** | **Qué hace** |
|---|---|
| `-I {}` | Marcador de posición: `{}` se reemplaza por cada item |
| `-n N` | N argumentos por invocación |
| `-L N` | N **líneas** por invocación |
| `-d C` | Delimitador custom (default: espacios/newline) |
| `-0` | Delimitador **null** (`\0`) — combinar con `find -print0` |
| `-P N` | Ejecuta N procesos en **paralelo** |

---

## Patterns en Pentest

```bash
# Port scan paralelo
cat ips.txt | xargs -P 20 -I{} nmap -p- --open {}

# Mass curl con status code
cat urls.txt | xargs -P 10 -I{} curl -s -o /dev/null -w "%{http_code} {}\n" {}

# Spray SMB sobre lista de IPs
cat ips.txt | xargs -P 10 -I{} netexec smb {} -u admin -p 'Spring2024!'

# Encodear lista de strings a base64
cat list.txt | xargs -I{} sh -c 'echo -n "{}" | base64'
```

---

## Notas Relacionadas

- [[grep]]
- [[find]]
- [[awk]]
