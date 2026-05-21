---
aliases:
  - masscan
  - MASSCAN
tags:
  - type/tool
  - tool/masscan
  - technique/recon/active
  - technique/enumeration
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Recon]]"
tertiary categories:
  - "[[Information Gathering]]"
kind: Tool
linked:
  - "[[nmap]]"
  - "[[rustscan]]"
  - "[[Port Enumeration]]"
---
# masscan

***

## Cheatsheet

| Uso | Comando |
| --- | --- |
| **Single host full** | `masscan -p1-65535 10.10.10.10 --rate 1000` |
| **/24 top ports** | `sudo masscan -p80,443,22,3389,445 10.10.10.0/24 --rate 10000` |
| **Internet-scale** | `sudo masscan 0.0.0.0/0 -p443 --rate 100000 --exclude 255.255.255.255` |
| **Output nmap XML** | `masscan -p- 10.10.10.10 --rate 1000 -oX scan.xml` |
| **Banner** | `masscan -p80,443 10.10.10.0/24 --banners --source-ip X.X.X.X` |
| **Resume** | `masscan --resume paused.conf` |
| **Excluir rangos** | `masscan -p443 10.0.0.0/8 --excludefile exclude.txt` |

***

## Concepto

Port scanner **SYN-based async** ultra-rápido — escanea Internet completo (0.0.0.0/0) en minutos con rate alto. A diferencia de [[nmap]] que mantiene state por target, masscan trabaja stateless (como zmap) — manda SYN, escucha SYN/ACK, mueve siguiente.

**Uso típico**: triage de rangos grandes → lista puertos abiertos → feed a [[nmap]] para service detection.

## Requisitos

- **Root** (raw sockets). `sudo` o `setcap cap_net_raw+ep`.
- **libpcap** (o PF_RING en Linux para rates >1M pps).
- Interfaz correctamente configurada (`--adapter`, `--router-mac` si no-ethernet directo).

## 1. Básico

```bash
# Single host, full range
sudo masscan -p1-65535 10.10.10.10 --rate 1000

# /24, top 10 ports
sudo masscan -p22,80,443,445,3389,3306,5432,8080,8443,21 10.10.10.0/24 --rate 10000

# UDP
sudo masscan -pU:53,161,500,1900,5060 10.10.10.0/24 --rate 5000
```

## 2. Flags críticos

| Flag | Uso |
| --- | --- |
| `-p` | Puertos. CSV, ranges: `-p22,80-443,445`. `UDP` con `-pU:53,161`. `-p-` = 1-65535. |
| `--rate` | Packets/sec. 1000 → lab. 100000 → Internet (necesita bandwidth). |
| `--source-ip X` | IP origen spoof (requiere permission y return path). |
| `--source-port N` | Puerto origen fijo. |
| `--adapter eth0` | Interface específica. |
| `--router-mac AA:BB:..` | MAC gateway (necesario con `--source-ip` spoofed). |
| `--banners` | Grab banners (agrega TCP connect + read post SYN/ACK). |
| `--excludefile exclude.txt` | Rangos excluidos. |
| `--include 10.10.10.0/24` | Whitelist. |
| `--http-user-agent "X"` | UA para banner grab HTTP. |
| `--wait N` | Wait N segundos post-scan antes de exit (default 10). |
| `--ping` | ICMP echo (rarely usado en masscan). |

## 3. Banner grabbing

```bash
sudo masscan -p80,443,22,21,25,110,143 10.10.10.0/24 \
  --rate 10000 \
  --banners \
  --source-ip 192.168.1.100   # REQUIRED — masscan needs dedicated IP for stateful TCP
```

Limitaciones: requiere `--source-ip` no usado por kernel (masscan maneja su propia TCP stack). Si kernel responde primero con RST → banner fail.

Workaround:
```bash
# Block kernel RST al source-ip dedicado
sudo iptables -A OUTPUT -p tcp --source 192.168.1.100 --tcp-flags RST RST -j DROP
```

## 4. Output

```bash
# Nmap XML (feedable a parsers nmap)
masscan -p- 10.10.10.10 --rate 1000 -oX scan.xml

# Grepable
masscan -p- target --rate 1000 -oG scan.gnmap

# JSON (cada line JSON event)
masscan -p- target --rate 1000 -oJ scan.json

# List
masscan -p- target --rate 1000 -oL scan.list

# Binary (más compacto, masscan read-back)
masscan -p- target --rate 1000 -oB scan.bin
masscan --readscan scan.bin -oX scan.xml   # convert after
```

## 5. Resume

Si Ctrl+C → `paused.conf` escrito. Resume:
```bash
masscan --resume paused.conf
```

## 6. Workflow masscan → nmap

```bash
# Paso 1 — masscan rápido
sudo masscan -p1-65535 10.10.10.0/24 --rate 10000 -oG masscan.gnmap

# Paso 2 — extraer pairs IP:port
awk '/Ports:/{ip=$2; for(i=5;i<=NF;i++) if($i ~ /\/open\//) {split($i,a,"/"); print ip":"a[1]}}' masscan.gnmap > targets.txt

# Paso 3 — nmap sobre ports descubiertos (service detect + NSE)
sudo nmap -sV -sC -iL <(cut -d: -f1 targets.txt | sort -u) -p $(cut -d: -f2 targets.txt | sort -un | paste -sd,) -oA nmap-scan
```

Script equivalent más limpio:
```bash
# Top ports masscan → nmap pipeline
sudo masscan -p- 10.10.10.0/24 --rate 10000 -oJ ms.json && \
  jq -r '.[] | "\(.ip) \(.ports[0].port)"' ms.json | \
  awk '{print $1 > "/tmp/hosts"; print $2 > "/tmp/ports"}' && \
  sudo nmap -sV -sC -iL /tmp/hosts -p $(sort -un /tmp/ports | paste -sd,) -oA nmap-scan
```

## 7. Rate tuning

| Rate | Uso | Bandwidth aprox |
| --- | --- | --- |
| 100 | Stealth lab | ~40 kbps |
| 1000 | Lab/VPN | ~400 kbps |
| 10000 | /24 rápido | ~4 Mbps |
| 100000 | /16 rápido | ~40 Mbps |
| 1000000 | Internet-scale | ~400 Mbps (requires PF_RING) |
| 10000000 | Internet <1h | ~4 Gbps (requires multi-NIC) |

Cada SYN = ~60 bytes * 8bits. Rate 100k → 48Mbps outbound.

Rate alto en internet: usa `--exclude` con RFC1918 + multicast + reserved.

## 8. Exclusion files

```conf
# exclude.conf
127.0.0.0/8
10.0.0.0/8
172.16.0.0/12
192.168.0.0/16
224.0.0.0/4
255.255.255.255
```

```bash
masscan -p443 0.0.0.0/0 --rate 100000 --excludefile exclude.conf
```

## Opsec

- **Noisy**: rate alto = SYN flood pattern. IDS/IPS flagean inmediato.
- `--source-ip` con IP no-propia = spoof detectable (requiere return path viable).
- Para stealth → usar [[nmap]] con `-T2` + fragmentation + decoys. masscan NO es stealth.
- Engagements internos: rate >10k puede saturar switches/routers legacy → rate 5k safe.

## Comparativa

| | masscan | [[nmap]] | [[rustscan]] | zmap |
| --- | --- | --- | --- | --- |
| Velocidad | **Extrema** (Internet) | Baja-media | Alta (65k~3s) | **Extrema** (Internet) |
| Service detect | Banner básico | **Nativo + NSE** | Via nmap wrapper | Banner básico |
| Stateful | No (async) | Sí | Sí | No |
| UDP decent | Parcial | Sí | Via nmap | No |
| Stealth | No | **Sí (`-T2`)** | No | No |
| Scripts | No | **NSE avanzado** | Básico | No |

Regla: **masscan** para discover ports en escala; **nmap** para profundidad en hosts específicos.

## Recursos

- [masscan GitHub](https://github.com/robertdavidgraham/masscan)
- [Masscan paper (Robert Graham)](https://github.com/robertdavidgraham/masscan/blob/master/doc/masscan.8.markdown)

***
