---
aliases:
  - RustScan
tags:
  - type/tool
  - tool/rustscan
  - technique/recon/active
  - technique/enumeration
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Recon]]"
tertiary categories:
  - "[[Web Explotación]]"
kind: Tool
linked:
  - "[[nmap]]"
  - "[[masscan]]"
  - "[[Port Enumeration]]"
---
# rustscan

***

## Cheatsheet

| Uso | Comando |
| --- | --- |
| **Full scan + nmap** | `rustscan -a 10.10.10.10 -- -sV -sC -oA scan` |
| **Top ports** | `rustscan -a target --top` |
| **Puertos custom** | `rustscan -a target -p 22,80,443,8080` |
| **Range** | `rustscan -a target -r 1-65535` |
| **Batch + timing** | `rustscan -a target -b 4500 -t 2000` |
| **Sin nmap** | `rustscan -a target --no-nmap -g` |
| **CIDR** | `rustscan -a 10.10.10.0/24 --ulimit 5000` |

***

## Concepto

Port scanner Rust ultra-rápido (~3s para 65k ports con `ulimit` alto) que delega service detection a [[nmap]] via `--`. Ideal para shortcut al descubrir puertos antes de enum profunda.

Flujo default: rustscan enumera ports abiertos → pasa lista a nmap para `-sV -sC` → output formato nmap.

## 1. Setup inicial

```bash
# Subir ulimit (file descriptors) — rustscan lo necesita
ulimit -n 5000

# O permanente /etc/security/limits.conf
echo "* soft nofile 10000" | sudo tee -a /etc/security/limits.conf
```

Sin ulimit alto → rustscan pierde velocidad, usa batch size bajo.

## 2. Comandos comunes

```bash
# Full scan con follow-up nmap default (-sV -sC)
rustscan -a 10.10.10.10

# Con flags nmap custom post `--`
rustscan -a 10.10.10.10 -- -sV -sC -O -oA scan

# Top 1000 ports solo
rustscan -a target --top

# Range específico
rustscan -a target -r 1-10000

# Lista de puertos
rustscan -a target -p 22,80,443,8080,8443

# Solo ports — skip nmap
rustscan -a target --no-nmap -g    # greppable
```

## 3. Flags críticos

| Flag | Uso |
| --- | --- |
| `-a` | Address (IP, CIDR, hostname, o file). |
| `-p` | Lista puertos csv. |
| `-r` | Range `1-65535`. |
| `--top` | Top 1000 (IANA). |
| `-b` | Batch size (default 4500) — paralelismo. |
| `-t` | Timeout ms por port (default 1500). |
| `--ulimit` | Override ulimit runtime. |
| `--tries` | Retries por port (default 1). |
| `--scripts` | `none` / `default` / `custom` (ver §4). |
| `-g` | Greppable output. |
| `--no-nmap` | No correr nmap post-scan. |
| `--accessible` | Output amigable screen-reader. |
| `-v` | Verbose. |

## 4. Scripting engine (`~/.rustscan_scripts/`)

`--scripts custom` carga scripts de `~/.rustscan_scripts/` ejecutados post-scan por puerto.

```toml
# ~/.rustscan/config.toml
tags = ["core", "http"]
developer = ["me"]
```

Script ejemplo (`http.rustscan`):
```toml
tags = ["http"]
developer = ["me"]
ports_separator = ","
call_format = "curl -sI http://{{ip}}:{{port}}"
```

## 5. Integración nmap

Todo lo que va después de `--` son flags nmap:

```bash
# Con scripts específicos
rustscan -a target -- -sV -sC --script=vuln,http-enum -oA scan

# Aggressive
rustscan -a target -- -A -T4 -oA agg

# UDP follow-up (nmap -sU sobre ports rustscan-detected)
rustscan -a target --top -- -sU -sV
```

## 6. CIDR / múltiples hosts

```bash
# Subnet
rustscan -a 10.10.10.0/24 --ulimit 5000

# Lista desde file
rustscan -a hosts.txt
# hosts.txt: una IP por línea

# Varios targets inline
rustscan -a 10.10.10.1,10.10.10.2,10.10.10.5
```

## 7. Workflow pentest típico

```bash
# Fase 1 — descubrir hosts + ports rápido
rustscan -a 10.10.10.0/24 --no-nmap -g > ports.txt

# Fase 2 — full scan dirigido
for target in $(cat ports.txt | cut -d':' -f1 | sort -u); do
  rustscan -a "$target" -- -sV -sC -oA "nmap_$target"
done
```

## Comparativa

| | rustscan | [[nmap]] | [[masscan]] |
| --- | --- | --- | --- |
| Velocidad | **Muy alta** (~3s 65k) | Media | Extrema (Internet-scale) |
| Service detection | Via nmap | **Nativo** | No |
| Script engine | Mínimo | **NSE avanzado** | No |
| Stealth | Media | **Alta (`-T2`)** | Baja (SYN-flood-like) |
| OSS-friendly | Sí | Sí | Sí |

Regla: rustscan para **TTP inicial** (ports), nmap para **profundidad** (servicios + NSE), masscan para **scale**.

## Opsec

- `-b` alto = noisy; rate-limiters / IDS detectan SYN burst.
- Usar `-t` alto y `-b` bajo (ej `-b 100 -t 5000`) en engagements que requieren stealth → mejor usar nmap `-T2` directo.
- rustscan no soporta TCP connect-only, evasión fragmentación, decoys — usar nmap para eso.

## Recursos

- [rustscan GitHub](https://github.com/RustScan/RustScan)

***
