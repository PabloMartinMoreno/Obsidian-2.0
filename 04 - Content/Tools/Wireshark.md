---
aliases:
  - Wireshark
  - tshark
  - PCAP Analysis
tags:
  - tool/wireshark
  - tool/tshark
  - topic/network
  - topic/forensics
  - estado/completo
primary categories:
  - '[[Red Team]]'
  - '[[Blue Team]]'
secondary categories:
  - '[[Information Gathering]]'
  - '[[Digital Forensics]]'
tertiary categories:
  - '[[Host & Network Enumeration]]'
  - '[[Packet Capture & Analysis]]'
kind: CheatSheet
linked: null
---

# Wireshark

> [!abstract] TL;DR
> Analizador de protocolos. GUI (`wireshark`) para inspección interactiva, CLI (`tshark`) para automatización, `dumpcap` para captura pura. Dos lenguajes de filtro distintos: **capture filters** (BPF, kernel-level) y **display filters** (post-captura, mucho más expresivos).

***

## Overview

Wireshark disecciona ~3000 protocolos. Trabaja sobre interfaces vivas o archivos `.pcap` / `.pcapng`. Tiene tres usos típicos:

1. **Sniffing activo** durante pentests (credenciales en claro, MITM, ARP/DNS spoofing, lateral movement).
2. **Forensics / DFIR** sobre PCAPs entregados (CTFs, sherlocks, post-incident triage).
3. **Troubleshooting** (handshakes incompletos, retransmits, RSTs, MTU, TLS errors).

***

## Captura — Lanzar Wireshark / tshark / dumpcap

| Comando | Qué obtenés | Cuándo usarlo |
|---|---|---|
| `wireshark -i eth0 -k` | GUI iniciando captura inmediata en `eth0` | Sesión interactiva manual. |
| `wireshark -i eth0 -k -f "tcp port 80"` | GUI con capture filter aplicado al arranque | Cuando ya sabés qué tráfico interesa y querés reducir ruido. |
| `wireshark -r capture.pcap` | Abre PCAP existente en GUI | Análisis forense / writeups. |
| `tshark -D` | Lista interfaces disponibles con índice | Identificar `eth0`/`tun0`/`wlan0`/`any` antes de capturar. |
| `tshark -i eth0 -w out.pcapng` | Captura silenciosa a archivo | Captura larga sin GUI, no consume RAM. |
| `tshark -i any -w out.pcapng -b filesize:102400 -b files:10` | Ring buffer de 10 archivos × 100 MB | Captura continua con rotación, evita llenar disco. |
| `tshark -i eth0 -a duration:300 -w out.pcapng` | Captura limitada a 300 s | Snapshots controlados durante incident response. |
| `dumpcap -i eth0 -w raw.pcapng` | Solo captura, sin disección | Mayor performance, menor pérdida de paquetes en links saturados. |
| `sudo setcap cap_net_raw,cap_net_admin=eip $(which dumpcap)` | Captura sin root | Setup post-instalación en Arch/Debian. |
| `sudo usermod -aG wireshark $USER` | Membresía de grupo para sniff | Necesario tras instalar; relogear sesión. |

> [!tip] Interfaz `any` (Linux)
> `tshark -i any` agrega todas las interfaces. Útil cuando no sabés por dónde sale el tráfico; combinar con filtros de display para reducir.

***

## Capture Filters (BPF) — pre-captura

Sintaxis BPF estilo `tcpdump`. Se aplican en kernel **antes** de la captura, por lo que descartan paquetes irreversiblemente. Más limitados que display filters.

| Filtro | Qué captura | Cuándo |
|---|---|---|
| `host 10.10.14.5` | Todo tráfico hacia/desde IP | Aislar tráfico de un endpoint. |
| `net 10.10.14.0/24` | Toda la subred | Captura intra-LAN. |
| `port 443` | Solo puerto 443 (TCP+UDP) | Reducir noise cuando solo interesa HTTPS. |
| `tcp port 22` | Solo TCP/22 | Específico para SSH. |
| `not arp and not stp` | Excluye broadcast ruido | Limpiar capturas en switches. |
| `host 10.0.0.5 and not port 22` | Endpoint sin tu SSH session | Evitar grabarte a vos mismo desde una shell remota. |
| `vlan and host 10.0.0.5` | Tráfico VLAN-taggeado | Trunks 802.1Q. |
| `ether host aa:bb:cc:dd:ee:ff` | Por MAC | Cuando IP cambia (DHCP) pero el host no. |
| `icmp[icmptype] == icmp-echo` | Solo echo requests | Detectar pings sin replies. |

> [!warning] Capture vs display
> Si capturás con `-f "tcp port 443"`, **perdés** el handshake TCP de otros puertos para siempre. Para análisis exploratorio: capturar todo y filtrar después con display filters.

***

## Display Filters — post-captura

Lenguaje propio de Wireshark, mucho más expresivo. Aplican sobre la disección, no descartan paquetes (toggleable).

### Operadores

| Operador          | Equivalente       | Ejemplo                                     |
| ----------------- | ----------------- | ------------------------------------------- |
| == / `eq`         | igual             | `ip.src == 10.10.10.1`                      |
| `!=` / `ne`       | distinto          | `tcp.port != 80`                            |
| `>` `<` `>=` `<=` | comparación       | `tcp.len > 1000`                            |
| `&&` / `and`      | AND               | `ip.src == 1.1.1.1 && tcp.dstport == 80`    |
| `\|\|` / `or`     | OR                | `dns or http`                               |
| `!` / `not`       | NOT               | `not arp`                                   |
| `contains`        | substring binario | `http.user_agent contains "sqlmap"`         |
| `matches`         | regex (PCRE)      | `http.request.uri matches "(?i)admin"`      |
| `in`              | set membership    | `tcp.port in {80 443 8080}`                 |
| `[n:m]`           | slice de bytes    | `tcp.payload[0:4] == 47:45:54:20` (=`GET `) |

### Por protocolo

| Filtro | Qué muestra | Cuándo |
|---|---|---|
| `ip.addr == 10.10.10.5` | Cualquier dirección coincide (src u dst) | Aislar conversaciones de un host. |
| `ip.src == 10.10.10.5 and ip.dst == 8.8.8.8` | Flujo dirigido | Validar exfil hacia destino conocido. |
| `tcp.flags.syn == 1 and tcp.flags.ack == 0` | SYN sin ACK | Detección de port scans. |
| `tcp.flags.reset == 1` | RSTs | Conexiones cortadas, firewall drops. |
| `tcp.analysis.retransmission` | Retransmits | Diagnóstico de pérdida / congestión. |
| `tcp.analysis.zero_window` | Zero windows | Receptor saturado. |
| `tcp.stream eq 12` | Todos los paquetes de un stream | Tras `Follow TCP Stream`, focalizar. |
| `frame.time >= "2026-05-27 14:00:00"` | Por timestamp | Recorte temporal en incidentes. |
| `frame.len > 1400` | Paquetes grandes | Posible tunneling / exfil. |
| `eth.addr == aa:bb:cc:dd:ee:ff` | Por MAC | Identificar dispositivo. |
| `!(arp or dns or icmp)` | Quitar ruido común | Limpiar vista exploratoria. |

***

## Statistics & Navegación

| Menú / atajo | Qué obtenés | Cuándo |
|---|---|---|
| `Statistics → Conversations` | Pares src↔dst con bytes/paquetes | Top talkers, ordenar por bytes → exfil candidates. |
| `Statistics → Endpoints` | Lista de hosts vistos | Inventario rápido del PCAP. |
| `Statistics → Protocol Hierarchy` | Árbol % por protocolo | "¿Hay tráfico raro?" en un vistazo. |
| `Statistics → I/O Graph` | Throughput vs tiempo | Detectar bursts, beacons periódicos. |
| `Statistics → Flow Graph` | Diagrama secuencia src/dst | Visualizar handshakes y orden de mensajes. |
| `Statistics → HTTP → Requests` | URIs solicitadas agrupadas | Recon de qué se accedió. |
| `Statistics → DNS` | Queries y respuestas agregadas | Detectar DGA, dominios sospechosos. |
| `Ctrl+F` | Buscar (string/hex/regex/display filter) | Find en payload. |
| `Ctrl+G` | Ir a paquete N | Saltar a número exacto. |
| `Ctrl+M` | Marcar paquete | Bookmark durante triage. |

***

## Follow Stream & Export Objects

| Acción | Qué obtenés | Cuándo |
|---|---|---|
| Click derecho → `Follow → TCP Stream` | Reconstrucción ASCII bidireccional del stream | Leer chats HTTP/SMTP/IRC/FTP completos. |
| `Follow → HTTP Stream` | Reensamblado con decompresión gzip/deflate | Ver bodies HTTP legibles. |
| `Follow → TLS Stream` | Stream descifrado (si tenés keys) | Tras configurar SSLKEYLOGFILE. |
| `File → Export Objects → HTTP` | Saca archivos descargados vía HTTP | Recuperar payloads / docs exfiltrados. |
| `File → Export Objects → SMB` | Archivos transferidos por SMB | Lateral movement / exfil interno. |
| `File → Export Objects → DICOM/FTP/TFTP` | Otros protocolos | Depende del PCAP. |
| `File → Export Packet Bytes` (`Ctrl+Shift+X`) | Dump binario del payload seleccionado | Extraer un blob específico (shellcode, archivo). |

***

## TLS Decryption

### Opción A — SSLKEYLOGFILE (cliente cooperante)

Firefox / Chrome / curl exportan claves de sesión si la env var está seteada:

```bash
export SSLKEYLOGFILE=$HOME/.ssl-keys.log
firefox &
```

Luego en Wireshark: `Edit → Preferences → Protocols → TLS → (Pre)-Master-Secret log filename` apuntando a `~/.ssl-keys.log`. Funciona para TLS 1.2 y 1.3.

### Opción B — Clave privada RSA (solo TLS ≤ 1.2 sin PFS)

`Edit → Preferences → Protocols → TLS → RSA Keys List` y agregar `IP,puerto,protocolo,/ruta/key.pem`. **No** funciona con suites ECDHE (la mayoría hoy).

| Caso | Solución |
|---|---|
| TLS 1.3 con cifras modernas | Solo SSLKEYLOGFILE. |
| Captura de cliente que controlás | SSLKEYLOGFILE setup pre-captura. |
| Captura legacy con RSA key estática | Importar `.pem`, suite debe ser RSA (sin ECDHE). |
| Captura de tráfico ajeno con PFS | Indescifrable sin las keys de sesión. |

***

## Patrones por protocolo

### HTTP

| Filtro | Qué obtenés | Cuándo |
|---|---|---|
| `http.request` | Todas las requests | Listar URIs accedidas. |
| `http.response.code >= 400` | Errores 4xx/5xx | Brute force, fuzzing detectado. |
| `http.request.method == "POST"` | Solo POSTs | Login attempts, uploads. |
| `http.user_agent` (columna) | UAs presentes | Detectar `sqlmap`, `nikto`, `python-requests`. |
| `http.host == "evil.com"` | Solo requests a host | Aislar tráfico a C2. |
| `http contains "password="` | Credenciales en form-encoded | Cleartext creds. |
| `http.authorization` | Header Authorization presente | Basic Auth = `base64 -d` el valor. |
| `http.cookie contains "PHPSESSID"` | Cookies de sesión | Session hijacking. |

### DNS

| Filtro | Qué obtenés | Cuándo |
|---|---|---|
| `dns` | Todas queries+responses | Listado general. |
| `dns.flags.response == 0` | Solo queries | Hosts consultando. |
| `dns.qry.name contains "xyz"` | Queries con substring | Encontrar dominios C2 conocidos. |
| `dns.qry.type == 16` | Queries TXT | Posible DNS tunneling. |
| `dns.resp.len > 200` | Respuestas grandes | TXT exfil / DNS amplification. |
| `dns and udp.length > 100` | Queries anormalmente largas | DNS exfil (label length abuse). |

### TLS / SSL

| Filtro | Qué obtenés | Cuándo |
|---|---|---|
| `tls.handshake.type == 1` | Client Hello | Ver SNI (`tls.handshake.extensions_server_name`). |
| `tls.handshake.type == 11` | Certificate | Inspeccionar CN/SAN del cert servidor. |
| `tls.alert_message` | Alerts TLS | Errores handshake. |
| `tls.handshake.extensions_server_name contains "evil"` | SNI matching | Detectar conexiones a dominio. |

### SMB / NTLM

| Filtro | Qué obtenés | Cuándo |
|---|---|---|
| `smb2` / `smb` | Todo SMB | Lateral movement, file access. |
| `smb2.cmd == 5` | Tree Connect | Shares accedidos. |
| `smb2.filename` | Archivos referenciados | Qué tocó el atacante. |
| `ntlmssp` | Mensajes NTLMSSP | Capturar Type1/2/3 para crackear NetNTLMv2. |
| `ntlmssp.ntlmv2_response` | Response NTLMv2 | Extraer hash → John/Hashcat. |
| `smb2.cmd == 11` | IOCTL | Operaciones DCE/RPC, PsExec-style. |

### Kerberos

| Filtro | Qué obtenés | Cuándo |
|---|---|---|
| `kerberos` | Tráfico Kerberos | AS-REQ/REP, TGS-REQ/REP. |
| `kerberos.msg_type == 10` | AS-REQ | Pre-auth (Kerberoasting source). |
| `kerberos.msg_type == 12` | TGS-REQ | Service ticket requests. |
| `kerberos.CNameString` | Nombre del cliente | Identificar usuarios. |
| `kerberos.SNameString` | Nombre del servicio | Identificar SPNs solicitados. |
| `kerberos.cipher` | Ticket cifrado | Extraer para Kerberoast/AS-REP roast. |

### FTP / Telnet / SMTP / POP3 / IMAP — cleartext

| Filtro | Qué obtenés | Cuándo |
|---|---|---|
| `ftp.request.command == "USER"` | Usuarios FTP | Cleartext creds. |
| `ftp.request.command == "PASS"` | Passwords FTP | Cleartext. |
| `telnet` | Sesión Telnet completa | `Follow TCP Stream` para ver todo. |
| `smtp.req.command in {"AUTH","MAIL","RCPT"}` | Auth y envíos SMTP | Cred capture, exfil por email. |
| `pop.request.command in {"USER","PASS"}` | Creds POP3 | Cleartext. |
| `imap.request contains "LOGIN"` | Login IMAP | Cleartext. |

### ICMP

| Filtro | Qué obtenés | Cuándo |
|---|---|---|
| `icmp.type == 8` | Echo requests | Pings outbound. |
| `icmp.type == 0` | Echo replies | Confirmar reachability. |
| `data.len > 50 and icmp` | Pings grandes | ICMP tunneling / exfil. |
| `icmp.type == 3` | Destination unreachable | Firewall / routing issues. |

***

## tshark — One-liners CLI

| Comando | Qué obtenés | Cuándo |
|---|---|---|
| `tshark -r f.pcap -Y "http.request" -T fields -e ip.src -e http.host -e http.request.uri` | CSV: src, host, URI | Resumir todas las URLs accedidas. |
| `tshark -r f.pcap -Y "dns.flags.response == 0" -T fields -e dns.qry.name \| sort -u` | Dominios consultados únicos | Inventario DNS para IOC matching. |
| `tshark -r f.pcap -q -z conv,tcp` | Tabla conversations TCP | Top talkers desde CLI. |
| `tshark -r f.pcap -q -z io,phs` | Protocol hierarchy stats | Vista panorámica de un PCAP. |
| `tshark -r f.pcap -q -z http,tree` | Stats HTTP métodos+responses | Triage rápido HTTP. |
| `tshark -r f.pcap --export-objects http,./out/` | Exporta objetos HTTP a directorio | Recuperar archivos sin GUI. |
| `tshark -r f.pcap -Y "ntlmssp.ntlmv2_response" -T fields -e ntlmssp.auth.username -e ntlmssp.ntlmv2_response` | User + NTLMv2 hash | Pipeline a John/Hashcat. |
| `tshark -r f.pcap -Y "tls.handshake.type == 1" -T fields -e tls.handshake.extensions_server_name \| sort -u` | SNIs únicos | Dominios HTTPS contactados. |
| `tshark -r f.pcap -Y "http.authorization" -T fields -e http.authorization \| sort -u` | Headers Authorization | Basic Auth tokens → base64 decode. |
| `tshark -r f.pcap -Y "tcp.flags.syn==1 && tcp.flags.ack==0" -T fields -e ip.src -e tcp.dstport \| sort \| uniq -c \| sort -rn \| head` | Top scanners | Detectar port scans. |
| `tshark -r f.pcap -z follow,tcp,ascii,42` | Dump del stream 42 | Reconstruir conversación específica. |
| `editcap -A "2026-05-27 14:00:00" -B "2026-05-27 15:00:00" in.pcap out.pcap` | Recorte temporal | Aislar ventana de incidente. |
| `mergecap -w merged.pcap a.pcap b.pcap` | Merge PCAPs preservando timestamps | Combinar capturas de varios nodos. |
| `capinfos f.pcap` | Resumen: duración, paquetes, bytes, encap | Metadata rápida pre-análisis. |

***

## Workflows

### Workflow 1 — Triage de PCAP desconocido

```text
1. capinfos pcap.pcapng                       → metadata (tiempo, tamaño)
2. Statistics → Protocol Hierarchy            → qué hay
3. Statistics → Conversations (TCP, ordenar bytes desc) → top talkers
4. Statistics → Endpoints                     → inventario hosts
5. Statistics → I/O Graph                     → patrones temporales (beacons?)
6. Display filter: !(arp or stp or icmp) for cleanup
7. Foco en protocolos sospechosos: TLS a IPs raras, DNS TXT, HTTP a no-80/443
```

### Workflow 2 — Recuperar credenciales en cleartext

```text
1. tshark -r f.pcap -Y "http.authorization" → Basic Auth (b64)
2. http contains "password=" or "passwd=" → form logins
3. ftp.request.command in {"USER","PASS"}
4. telnet → Follow TCP Stream
5. ntlmssp.ntlmv2_response → extraer hashes
6. smtp.req.parameter contains "AUTH" → cred SMTP
```

### Workflow 3 — Detectar C2 / beaconing

```text
1. Statistics → I/O Graph con intervalos 1s → buscar pulso regular
2. Statistics → Conversations ordenar por "Bits/s" asc + Duration desc
   → conexiones largas con poco tráfico = beacons clásicos
3. tls.handshake.extensions_server_name → SNIs anómalos
4. dns.qry.name → DGA patterns (entropía alta, longitud uniforme)
5. http.user_agent → UAs raros / vacíos / muy cortos
6. Filtrar IP sospechosa → ip.addr == X.X.X.X y Follow Stream
```

### Workflow 4 — Análisis Kerberoasting / AS-REP Roasting

```text
1. kerberos.msg_type == 10 and kerberos.padata contains pa-enc-timestamp  → AS-REQ con pre-auth
2. kerberos.msg_type == 11 with no pa-enc-timestamp → AS-REP roastable (DONT_REQUIRE_PREAUTH)
3. kerberos.msg_type == 12 with kerberos.SNameString != "krbtgt" → TGS-REQ (Kerberoast)
4. Export el ticket cifrado (Export Packet Bytes) → formatear para hashcat -m 13100 / -m 18200
```

### Workflow 5 — Reconstruir archivos exfiltrados

```text
1. File → Export Objects → HTTP/SMB/FTP-DATA según protocolo
2. Si está fragmentado en muchos paquetes raw: tcp.stream eq N → Follow → Save As (Raw)
3. Si está en ICMP/DNS tunneling: extraer payloads con tshark -T fields, concatenar, decodificar
4. file <output> + strings + binwalk → identificar tipo
```

***

## Detección de patrones ofensivos

| Patrón | Filtro Wireshark | Indicador |
|---|---|---|
| Nmap SYN scan | `tcp.flags.syn==1 && tcp.flags.ack==0` (muchas dst diferentes desde 1 src) | Un host probando múltiples puertos. |
| Nmap FIN/Xmas scan | `tcp.flags == 0x01` / `tcp.flags == 0x29` | Flags anómalas. |
| ARP spoofing | `arp.duplicate-address-detected` o IPs con varias MACs | MITM activo en LAN. |
| LLMNR/NBT-NS poisoning (Responder) | `llmnr` o `nbns` con replies desde IP no-DC | Ataque interno típico. |
| DNS exfiltration | `dns.qry.name` con longitud >50 o entropía alta, queries `TXT` masivas | Tunneling. |
| ICMP tunneling | `icmp and data.len > 64` continuos | C2 vía ping. |
| HTTP brute force | `http.request.method == "POST"` repetidos a `/login` con `http.response.code == 401` | Credential stuffing. |
| SQLi / XSS scanning | `http.request.uri contains "'" or "<script"` o UA `sqlmap`/`nikto` | Scanner activo. |
| SMB enumeration | `smb2.cmd == 3` (Tree Connect) masivos | Lateral recon. |
| Mimikatz over WMI/RPC | `dcerpc and dcerpc.cn_call_id` con `epm` + `lsarpc` + `samr` | Credential dumping remoto. |

***

## Tips operacionales

> [!tip] Columnas custom útiles
> `Edit → Preferences → Columns`, agregar:
> - `http.host` y `http.request.uri` para inspeccionar URLs sin abrir cada paquete.
> - `dns.qry.name` para vista DNS rápida.
> - `tcp.stream` para identificar streams a simple vista.

> [!tip] Profiles
> `Edit → Configuration Profiles` permite guardar columnas/filtros/coloring por escenario (HTTP analysis, Kerberos analysis, etc.). Cambiar con dropdown en barra inferior.

> [!tip] Coloring rules
> `View → Coloring Rules` para resaltar visualmente: errores HTTP, RSTs, retransmits, paquetes de un host. Útil con PCAPs grandes.

> [!warning] Pérdida de paquetes
> En links >1 Gbps con `tshark -i`, podés perder paquetes (logueado al final). Para captura forense, usar `dumpcap` directo y solo abrir el `.pcapng` después.

> [!info] PCAPNG vs PCAP
> `.pcapng` permite múltiples interfaces, comentarios por paquete, metadatos enriquecidos. Default desde Wireshark 1.8. Convertir a `.pcap` con `editcap -F pcap in.pcapng out.pcap` si una herramienta vieja no lo soporta.

***

## Relacionados

- [[TcpDump]] — captura CLI equivalente, mismo lenguaje BPF.
- [[Session Hijacking - Vectores de Robo]] — uso de Wireshark para robo de cookies en LAN.
- [[Session Hijacking - Tooling]] — combinación con mitmproxy.
- [[Packet Capture & Analysis]] — categoría terciaria.
- [[Host & Network Enumeration]] — contexto de uso.
- [[Kerberos (88) - Enumeración]] — captura de tickets.
- [[airmon-ng]] — captura wireless previa.

## Referencias externas

- [Wireshark Display Filter Reference](https://www.wireshark.org/docs/dfref/)
- [tshark man page](https://www.wireshark.org/docs/man-pages/tshark.html)
- [SampleCaptures wiki](https://wiki.wireshark.org/SampleCaptures) — PCAPs de práctica.
