---
aliases:
  - "Abusing Account Operators Group - Creating a new user"
  - "Abusing Account Operators Group - Assigning a group to the newly created user"
  - Computer Objects Enumeration
  - LDAP Computer Filter
  - Servers Enumeration
  - High-Value Computer Targets
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - Hosts Enumeration]]"
  - "[[netexec]]"
---
# AD - Hosts Enumeration - Computer Objects via LDAP

---

## Bulk Computer Listing

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc ldap <DC> -u u -p p --computers` | Lista hostname rápida | Quick inventory. |
| `nxc ldap <DC> -u u -p p --query "(objectCategory=computer)" "cn,dNSHostName,operatingSystem,operatingSystemVersion,lastLogonTimestamp"` | Detalle custom via LDAP filter | Atributos específicos. |
| `Get-ADComputer -Filter * -Properties OperatingSystem,LastLogonDate,Description` | Computers + atributos útiles | RSAT estándar. |
| `Get-NetComputer -FullData` (PowerView) | Computers desde adversary tool | Sin RSAT. |
| `bloodhound-python -d <dom> -u u -p p -ns <DC> -c Computers --zip` | Computers para BloodHound | Graph analysis. |
| `SharpHound.exe -c Computers` | Igual desde Windows | Sin Linux. |
| `ldapsearch -h <DC> -D u -w p -b "DC=corp,DC=local" "(objectCategory=computer)" cn dNSHostName operatingSystem` | LDAP raw | Linux sin nxc. |
| `adfind -f "(objectCategory=computer)" -bit -c` | Joeware adfind | Windows portable. |
^ad-computers-bulk

```bash
# Pipeline típico — bulk + parseo
nxc ldap <DC> -u user -p pass --computers > computers.txt

nxc ldap <DC> -u user -p pass --query \
  "(objectCategory=computer)" \
  "cn,dNSHostName,operatingSystem,operatingSystemVersion,lastLogonTimestamp,servicePrincipalName" \
  > computers_detail.txt
```

```powershell
# RSAT — CSV con atributos accionables
Get-ADComputer -Filter * -Properties OperatingSystem,OperatingSystemVersion,LastLogonDate,Description |
  Select Name,DNSHostName,OperatingSystem,OperatingSystemVersion,LastLogonDate,Description |
  Sort LastLogonDate -Descending |
  Export-Csv computers.csv -NoTypeInformation
```

---

## Critical Computer Attributes

| **Atributo** | **Significado** | **Para qué sirve** |
|:---:|:---:|:---:|
| `cn` / `samAccountName` | Hostname (con `$` final) | ID en logs/queries. |
| `dNSHostName` | FQDN | Resolución DNS. |
| `operatingSystem` + `operatingSystemVersion` | OS + build | Vuln matching (CVE per build). |
| `lastLogonTimestamp` | Last logon (replicated, ~14d delay) | Live vs stale. |
| `lastLogon` | Last logon real (per-DC) | Activity exacta (consultar todos DCs). |
| `pwdLastSet` | Computer account password rotation | Stale check (default 30d). |
| `userAccountControl` | Bitfield flags | Detect delegation flags. |
| `servicePrincipalName` | SPNs (host/HOST/MSSQLSvc/HTTP/etc) | Identificar rol del host. |
| `msDS-AllowedToDelegateTo` | Constrained delegation targets | Privesc path. |
| `msDS-AllowedToActOnBehalfOfOtherIdentity` | RBCD config | Lateral target. |
| `ms-Mcs-AdmPwd` / `msLAPS-Password` | LAPS password (si readable) | Direct local admin. |
| `description` | Free-text — passwords leak comunes | Always grep. |
| `managedBy` | Owner DN | Path indicator. |
| `objectSid` | SID (RID extraction) | Cross-correlate. |
^ad-computers-attrs

**UAC flags relevantes para computers:**
- `0x00080000` TRUSTED_FOR_DELEGATION — **Unconstrained**
- `0x01000000` TRUSTED_TO_AUTH_FOR_DELEGATION — **Constrained con protocol transition**
- `0x00100000` NOT_DELEGATED — explicitly excluded
- `0x00002000` SERVER_TRUST_ACCOUNT — DC

```bash
# Unconstrained delegation (CRITICAL)
nxc ldap <DC> -u u -p p --trusted-for-delegation

# LDAP raw — UAC bit 524288
ldapsearch -h <DC> -D u -w p -b "DC=corp,DC=local" \
  "(&(objectCategory=computer)(userAccountControl:1.2.840.113556.1.4.803:=524288))" \
  cn dNSHostName

# Constrained delegation
ldapsearch -h <DC> -D u -w p -b "DC=corp,DC=local" \
  "(&(objectCategory=computer)(msDS-AllowedToDelegateTo=*))" \
  cn dNSHostName msDS-AllowedToDelegateTo
```

---

## High-Value Targets Identification

| **Filtro / Comando** | **Qué identifica** | **Riesgo** |
|:---:|:---:|:---:|
| `Get-ADComputer -Filter {OperatingSystem -like "*Server*"}` | Servers solamente | Tier 1+ targets. |
| `Get-ADComputer -Filter {TrustedForDelegation -eq $true -and PrimaryGroupID -ne 516}` | Unconstrained no-DC | Critical (TGT capture). |
| `Get-ADComputer -Filter * -Pr msDS-AllowedToDelegateTo \| ? msDS-AllowedToDelegateTo` | Constrained delegation | Privesc S4U. |
| `Get-ADComputer -Filter * -Pr msDS-AllowedToActOnBehalfOfOtherIdentity \| ? msDS-AllowedToActOnBehalfOfOtherIdentity` | RBCD configurado | Lateral target. |
| `Get-ADComputer -SearchBase "OU=Domain Controllers,..."` | Solo DCs | Tier 0. |
| `Get-ADComputer -Filter {Enabled -eq $true -and LastLogonDate -gt (Get-Date).AddDays(-7)}` | Hosts activos última semana | Sessions cached probable. |
| `Get-ADComputer -Filter {ServicePrincipalName -like "*MSSQLSvc*"}` | SQL servers | DB target. |
| `Get-ADComputer -Filter {OperatingSystem -like "*2008*" -or OperatingSystem -like "*2003*"}` | OS legacy | Easy compromise. |
| `Get-ADComputer -Filter * \| ? Name -match "DB\|SQL\|DC\|HV\|VC"` | Naming convention | Quick ID por rol. |
^ad-computers-hvtargets

```powershell
# HVTs en una pasada
Get-ADComputer -Filter {Enabled -eq $true} `
  -Properties OperatingSystem,LastLogonDate,TrustedForDelegation,msDS-AllowedToDelegateTo,msDS-AllowedToActOnBehalfOfOtherIdentity,ServicePrincipalName |
  Where { $_.TrustedForDelegation -or $_.'msDS-AllowedToDelegateTo' -or $_.'msDS-AllowedToActOnBehalfOfOtherIdentity' } |
  Select Name,DNSHostName,OperatingSystem,
    @{n='Unconstrained';e={$_.TrustedForDelegation}},
    @{n='Constrained';e={$_.'msDS-AllowedToDelegateTo' -join ','}},
    @{n='RBCD';e={[bool]$_.'msDS-AllowedToActOnBehalfOfOtherIdentity'}}
```

---

## Stale Computer Accounts

| **Filtro** | **Qué encuentra** | **Por qué importa** |
|:---:|:---:|:---:|
| `Get-ADComputer -Filter {LastLogonDate -lt (Get-Date).AddDays(-180)}` | Hosts inactivos >180d | Probable rogue / olvidado. |
| `Get-ADComputer -Filter * -Pr PasswordLastSet \| ? {$_.PasswordLastSet -lt (Get-Date).AddDays(-90)}` | Computer pwd >90d (default 30d) | Stuck rotation = likely stale. |
| `Get-ADComputer -Filter {Enabled -eq $true -and LastLogonDate -lt (Get-Date).AddDays(-365)}` | Enabled + 1 año sin logon | Cleanup target / risk. |
| `Get-ADComputer -Filter * -Pr Description \| ? {$_.Description -match "(?i)pass\|pwd\|temp"}` | Description con keywords | Common cred leak. |
| `Get-ADComputer -Filter * -Pr SIDHistory \| ? SIDHistory` | Computers con SID History | Migration leftover. |
| `Get-ADComputer -Filter {whenCreated -gt (Get-Date).AddDays(-7)}` | Recientemente creados | Posible attacker (MachineAccountQuota=10 default). |
| `(Get-ADDomain).ms-DS-MachineAccountQuota` | Quota de MSA per user (default 10) | Permite atacante crear computers. |
^ad-computers-stale

```powershell
# Audit completo stale
$Stale = (Get-Date).AddDays(-180)
Get-ADComputer -Filter {LastLogonDate -lt $Stale -and Enabled -eq $true} `
  -Properties LastLogonDate,OperatingSystem,PasswordLastSet,Description |
  Select Name,DNSHostName,OperatingSystem,LastLogonDate,PasswordLastSet,Description |
  Export-Csv stale-computers.csv -NoTypeInformation
```

---

## Bulk Profile Live Targets

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb hosts.txt -u u -p p` | Live + admin (`Pwn3d!`) + signing + OS | Profile estándar. |
| `nxc smb hosts.txt -u u -p p --gen-relay-list relay.txt` | Hosts sin signing → relay list | NTLM Relay prep. |
| `nxc smb hosts.txt -u u -p p --laps` | Hosts con LAPS readable | Cred path local admin. |
| `nxc smb hosts.txt -u u -p p --sessions` | Sessions activas (RID > 1000) | Pivot prep. |
| `nxc smb hosts.txt -u u -p p --loggedon-users` | Users actualmente logueados | Tier-X discovery. |
| `nxc smb hosts.txt -u u -p p --shares` | Shares + perms per host | Spider prep. |
| `nxc smb hosts.txt -u u -p p --rid-brute` | Local accounts via RID | Lateral candidates. |
| `nxc smb hosts.txt -u u -p p -x "whoami"` | Code exec verify | Confirm priv. |
| `nxc winrm hosts.txt -u u -p p` | WinRM access (5985/5986) | Lateral path. |
| `nxc rdp hosts.txt -u u -p p` | RDP NLA check | Adjacent lateral. |
| `nxc mssql hosts.txt -u u -p p` | MSSQL Integrated Auth | DB lateral. |
| `nxc ssh hosts.txt -u u -p p` | Linux AD-joined SSH | Hybrid lateral. |
^ad-computers-bulk-profile

```bash
# Pipeline completo desde computer list
nxc ldap <DC> -u user -p pass --computers > servers.txt

# Profile multi-protocolo
nxc smb servers.txt -u user -p pass
nxc smb servers.txt -u user -p pass --gen-relay-list relay.txt
nxc smb servers.txt -u user -p pass --laps

# Output flags clave:
#   (Pwn3d!)         = local admin
#   Signing: False   = NTLM Relay candidate
#   LAPS readable    = direct local admin password
```

---
