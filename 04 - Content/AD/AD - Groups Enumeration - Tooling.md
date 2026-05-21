---
aliases:
  - Group Enum Tooling
  - Get-ADGroup
  - Get-DomainGroup
  - BloodHound Groups
tags:
  - type/tool
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[AD - Groups Enumeration]]'
  - '[[netexec]]'
  - '[[BloodHound & SharpHound]]'
---
# AD - Groups Enumeration - Tooling

***

## netexec

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc ldap <DC> -u u -p p --groups` | Lista groups via LDAP | Standard. |
| `nxc smb <DC> -u u -p p --groups` | Lista via SAMR | Alt path. |
| `nxc smb <DC> -u u -p p --groups "Domain Admins"` | Members específicos | Per-group. |
| `nxc smb <DC> -u '' -p '' --groups` | Anonymous attempt | Misconfig hunt. |
| `nxc ldap <DC> -u u -p p --query "(objectCategory=group)" "*"` | Custom LDAP query | Targeted. |
| `nxc smb <hosts> -u u -p p --local-groups` | Local groups per-host | Lateral. |
| `nxc smb <hosts> -u u -p p --local-auth -u <local-admin> -p <pass>` | Local admin enum | Lateral prep. |
| `nxc ldap <DC> -u u -p p --bloodhound -c All --dns-server <DC>` | Auto BloodHound collect | Quick. |
| `nxc ldap <DC> -p 3268 -u u -p p --groups` | Forest-wide GC | Cross-domain. |
^ad-grouptool-netexec

```bash
DC=10.10.10.10
nxc ldap $DC -u user -p pass --groups > groups.txt

for g in "Domain Admins" "Enterprise Admins" "Schema Admins" "Backup Operators" "Server Operators"; do
  echo "=== $g ==="
  nxc smb $DC -u user -p pass --groups "$g"
done
```

___

## RSAT / PowerShell

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADGroup -Filter * -Properties *` | Groups con todos atributos | Detail. |
| `Get-ADGroup -Filter {GroupScope -eq "Universal"}` | Universal scope | Forest-wide enum. |
| `Get-ADGroup -Filter {AdminCount -eq 1}` | adminCount=1 marker | Tier 0/1 list. |
| `Get-ADGroupMember <group>` | Direct members | Standard. |
| `Get-ADGroupMember <group> -Recursive` | Effective (nested expanded) | Privilege. |
| `Get-ADPrincipalGroupMembership <user>` | Groups donde user es member directo | Per-user inverse. |
| `Get-ADUser <user> -Pr tokenGroups` | Transitive computed | Per-user effective. |
| `Add-ADGroupMember <group> -Members <user>` | Modify (priv) | Persistence. |
| `Get-ADGroup -Filter * -Server <other-dom>` | Cross-domain | Forest scope. |
^ad-grouptool-rsat

```powershell
# Tier 0 audit con CSV export
$T0 = "Domain Admins","Enterprise Admins","Schema Admins"
$T0 | % {
  $g = $_
  Get-ADGroupMember $g -Recursive -EA SilentlyContinue |
    Get-ADUser -Properties Description,LastLogonDate,Enabled |
    Select @{n='Group';e={$g}},Name,SamAccountName,Description,LastLogonDate,Enabled
} | Export-Csv tier0_audit.csv -NoTypeInformation
```

___

## PowerView / pywerview

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-DomainGroup` | All groups (sin RSAT) | Adversary. |
| `Get-DomainGroup -AdminCount` | Privileged | Tier 0/1 filter. |
| `Get-DomainGroup -GroupScope Universal` | Forest scope | Cross-domain. |
| `Get-DomainGroupMember -Identity "Domain Admins" -Recurse` | Recursive members | Privilege. |
| `Find-ForeignUser` | Foreign users en groups locales | Cross-trust. |
| `Find-ForeignGroup` | Foreign groups nested | Cross-trust. |
| `Get-NetLocalGroup -ComputerName <host>` | Local groups per-host | Lateral. |
| `Get-NetLocalGroupMember -ComputerName <host> -GroupName Administrators` | Local admins | Lateral target. |
| `Find-LocalAdminAccess` | Hosts donde sos local admin | Path discovery. |
| `Get-DomainObjectAcl -SamAccountName <group> -ResolveGUIDs` | DACL del group | ACL audit. |
| `Find-InterestingDomainAcl` | ACEs peligrosas globales | Privesc. |
| `pywerview get-netgroup -u u -p pass -d corp.local --dc-ip <DC>` | Linux equivalent | Sin Windows. |
| `pywerview get-netgroupmember -u u -p pass -d corp.local --dc-ip <DC> --groupname "Domain Admins"` | Linux members | Linux. |
^ad-grouptool-powerview

___

## BloodHound / SharpHound

| **Comando / Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `SharpHound.exe -c Group,LocalAdmin,Session` | Lateral focus collection | Targeted. |
| `SharpHound.exe -c All` | Collection completa | Full audit. |
| `bloodhound-python -d corp.local -u u -p p -ns <DC> -c All --zip` | Linux collector | Sin Windows. |
| `MATCH (g:Group {highvalue:true}) MATCH (n)-[:MemberOf*1..]->(g) RETURN g.name,n.name,n.objectid` | Tier 0 + members recursivos | Audit. |
| `MATCH (g:Group {highvalue:true}) MATCH (n)-[:MemberOf*1..]->(g) WHERE n.domain <> g.domain RETURN g.name,n.name,n.domain` | Foreign en Tier 0 | Cross-trust audit. |
| `MATCH (u {owned:true}) MATCH (g:Group {name:"DOMAIN ADMINS@CORP.LOCAL"}) MATCH p=shortestPath((u)-[*1..]->(g)) RETURN p` | Path desde owned a DA | Attack planning. |
| `MATCH p=(g:Group)-[:GenericAll\|GenericWrite\|WriteOwner\|WriteDacl*1..]->(da:Group {name:"DOMAIN ADMINS@CORP.LOCAL"}) RETURN p` | Groups con ACL paths a DA | Privesc paths. |
^ad-grouptool-bh

```bash
# Multi-domain ingest pipeline
for d in corp.local partner.com; do
  DC=$(dig +short SRV "_ldap._tcp.dc._msdcs.$d" | awk '{print $4}' | head -1 | sed 's/\.$//')
  bloodhound-python -d "$d" -u "auditor@$d" -p 'Pass!' -ns "$DC" -c All --zip -o "./loot/$d/"
done
```

___

## Impacket / Linux LDAP

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `impacket-samrdump corp.local/u:p@<DC>` | Groups + members via SAMR | Detail. |
| `impacket-samrdump 'corp.local/'@<DC>` | Anonymous SAMR | Null. |
| `impacket-lookupsid 'corp.local/u:p'@<DC>` | RID brute SAMR | Group RIDs. |
| `windapsearch.py -d corp.local -u u -p p --dc <DC> --groups` | Wrapper amigable | Sin filters. |
| `ldapdomaindump 'corp\u:p'@<DC>` | HTML/JSON/GREP report con groups | Auditor-friendly. |
| `enum4linux-ng -G <DC>` | Bulk groups (anonymous + auth) | Comprehensive. |
| `rpcclient -U 'corp\u%pass' <DC> -c 'enumdomgroups;enumalsgroups domain;enumalsgroups builtin'` | RPC enum batch | Sin LDAP tools. |
| `bloodyAD --host <DC> -d corp -u u -p pass get group <group>` | Group query/modify | LDAP modify. |
^ad-grouptool-impacket

```bash
# Pipeline Linux completo
DC=10.10.10.10; USER=auditor; PASS='Pass!'

impacket-samrdump "corp.local/$USER:$PASS"@$DC > samr.txt
bloodhound-python -d corp.local -u $USER -p $PASS -ns $DC -c All --zip
ldapdomaindump "corp\\$USER:$PASS"@$DC -o report/
enum4linux-ng -G -A $DC -u $USER -p $PASS -oJ enum.json
```

___

## Recursos

| **Recurso** | **URL** |
|:---:|:---:|
| HackTricks AD Methodology | `https://book.hacktricks.xyz/windows-hardening/active-directory-methodology` |
| The Hacker Recipes — Recon | `https://www.thehacker.recipes/ad/recon` |
| BloodHound docs | `https://bloodhound.specterops.io` |
| ADSecurity Sean Metcalf | `https://adsecurity.org` |
| Microsoft Built-in Groups reference | `https://learn.microsoft.com/windows-server/identity/ad-ds/manage/understand-default-user-accounts` |
| MITRE ATT&CK T1069.002 | `https://attack.mitre.org/techniques/T1069/002/` |
| `awesome-active-directory` | `https://github.com/Orange-Cyberdefense/awesome-activedirectory` |
| PowerView Cheat Sheet | `https://github.com/HarmJ0y/CheatSheets/blob/master/PowerView.pdf` |
^ad-grouptool-resources

***
