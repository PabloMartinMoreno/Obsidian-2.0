---
aliases:
tags:
  - tool/awk
kind: Tool
---
# awk

> [!info]
> Procesador de texto basado en patterns + acciones por línea. En pentest: parsing de output (nmap, logs), extracción de campos específicos, transformación de listas.

---

## Cheatsheet

| Comando | Qué obtenés | Cuándo |
|---|---|---|
| `awk '{print $1}' file` | Primera columna | Default separator = whitespace |
| `awk -F',' '{print $2}' file` | Columna por separator (CSV) | Parseo CSV |
| `awk '/pattern/{print}' file` | Líneas que matchean regex | Filtro |
| `awk 'NR==5' file` | Línea específica | Pinpoint |
| `awk 'NR>1' file` | Skip header | Cleanup |
| `awk '!seen[$0]++' file` | Dedup preservando orden | Unique (sin sort) |
| `awk '{sum+=$1} END {print sum}' file` | Suma de columna | Stats |
| `awk -F: '{print $1}' /etc/passwd` | Users del sistema | Linux enum |
| `awk '{print $NF}' file` | Última columna | Variable |

---

## Patterns útiles en pentest

```bash
# Extract IPs from output
awk '/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/ {print $0}' file

# nmap: extract open ports
nmap -p- <target> | awk '/open/ {print $1}' | cut -d/ -f1

# Parse /etc/passwd con UID > 1000 (real users)
awk -F: '$3 > 1000 {print $1}' /etc/passwd

# Mostrar archivos > 10MB en find output
find / -type f -size +10M | xargs ls -lh 2>/dev/null | awk '{print $5, $9}'

# Filter SUID list output
find / -perm -4000 2>/dev/null | awk -F/ '{print $NF}'
```

---

## Notas Relacionadas

- [[grep]]
- [[find]]
