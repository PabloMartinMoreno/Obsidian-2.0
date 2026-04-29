---
aliases:
  - Group Enum Tooling
  - Get-ADGroup
  - Get-DomainGroup
  - BloodHound Groups
tags:
  - type/cheatsheet
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[AD - Groups Enumeration]]"
  - "[[netexec]]"
  - "[[BloodHound & SharpHound]]"
---
# AD - Groups Enumeration - Tooling

***

## netexec / crackmapexec

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| LDAP groups | `nxc ldap DC -u u -p p --groups` | Quick. |
| SMB SAMR groups | `nxc smb DC -u u -p p --groups` | Adjacent. |
| Specific group members | `nxc smb DC -u u -p p --groups "Domain Admins"` | Per-group. |
| Privileged group enum | `nxc smb DC -u u -p p --groups "Enterprise Admins"` | Tier 0. |
| Anonymous attempt | `nxc smb DC -u '' -p '' --groups` | Null check. |
| Custom LDAP filter | `nxc ldap DC --query "(objectCategory=group)" "*"` | Flexible. |
| Local groups (per-host) | `nxc smb hosts --local-groups` | Per-host enum. |
| Local admin members | `nxc smb hosts --local-auth -u u -p p` | Lateral prep. |
| BloodHound integration | `nxc ldap DC -u u -p p --bloodhound -c All` | Auto-collect. |
| Bulk subnet | `nxc smb 10.0.0.0/24` | Sweep. |
| Output to file | Standard | Reportable. |
| Per-group user list | Combined query | Workflow. |
| Forest-wide via GC | `nxc ldap DC -u u -p p -p 3268 --groups` | Cross-domain. |
| `--continue-on-success` | Per-host | Standard. |
| crackmapexec older name | Same flags | Compat. |
| Detection adjacent | Defender | Adjacent. |
^ad-grouptool-netexec

### netexec recipes

```bash
DC="dc01.dom.local"
USER="user"; PASS="pass"

# Bulk groups
nxc ldap $DC -u $USER -p $PASS --groups > groups_all.txt
nxc smb $DC -u $USER -p $PASS --groups > groups_samr.txt

# Per privileged group
for g in "Domain Admins" "Enterprise Admins" "Schema Admins" "Backup Operators" "Server Operators"; do
  echo "=== $g ==="
  nxc smb $DC -u $USER -p $PASS --groups "$g"
done

# BloodHound auto-collect
nxc ldap $DC -u $USER -p $PASS --bloodhound -c All --dns-server $DC
```

___

## RSAT / PowerShell

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-ADGroup -Filter *` | All groups | Standard. |
| `Get-ADGroup -Filter * -Properties *` | All attrs | Detail. |
| `Get-ADGroup -Filter {GroupScope -eq "Universal"}` | Universal scope | Filter. |
| `Get-ADGroup -Filter {AdminCount -eq 1}` | adminCount marker | Privileged. |
| `Get-ADGroupMember "Domain Admins"` | Direct members | Standard. |
| `Get-ADGroupMember "Domain Admins" -Recursive` | Transitive | Nested. |
| `Get-ADGroupMember -Identity X -PartitionType` | Edge | Adjacent. |
| `Add-ADGroupMember "Group" -Members user` | Modify | Privileged. |
| `Remove-ADGroupMember` | Modify | Privileged. |
| `New-ADGroup` | Create | Privileged. |
| `Set-ADGroup` | Modify attrs | Privileged. |
| `Get-ADPrincipalGroupMembership user` | Per-user direct groups | Inverse. |
| `Get-ADUser user -Properties tokenGroups` | Transitive groups | Computed. |
| `Get-ADUser user -Properties memberOf` | Direct groups | Standard. |
| Cross-domain `-Server` | Specific DC | Forest. |
| Forest-wide queries | `(Get-ADForest).Domains` iterate | Standard. |
^ad-grouptool-rsat

### RSAT recipes

```powershell
# All groups categorized
Get-ADGroup -Filter * -Properties GroupScope,GroupCategory,Description |
  Group-Object GroupScope,GroupCategory |
  Select Count,Name

# Per Tier 0 group recursive
$tier0 = "Domain Admins","Enterprise Admins","Schema Admins"
$tier0 | ForEach-Object {
  $g = $_
  Get-ADGroupMember $g -Recursive -ErrorAction SilentlyContinue |
    Get-ADUser -Properties Description,LastLogonDate,Enabled |
    Select @{n='Group';e={$g}},Name,SamAccountName,Description,LastLogonDate,Enabled
} | Export-Csv tier0_audit.csv -NoTypeInformation

# Per-user effective groups (transitive)
Get-ADUser jsmith -Properties tokenGroups |
  Select -ExpandProperty tokenGroups |
  ForEach-Object {(New-Object System.Security.Principal.SecurityIdentifier($_)).Translate([System.Security.Principal.NTAccount])}
```

___

## PowerView / pywerview

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-DomainGroup` | All groups | Adversary tool. |
| `Get-DomainGroup -AdminCount` | Privileged | Filter. |
| `Get-DomainGroup -GroupScope Universal` | Universal | Filter. |
| `Get-DomainGroupMember -Identity DA` | Direct | Standard. |
| `Get-DomainGroupMember -Identity DA -Recurse` | Transitive | Nested. |
| `Get-NetGroup` (older) | Adjacent | Legacy. |
| `Get-NetGroupMember -Recurse` (older) | Adjacent | Legacy. |
| `Find-ForeignUser` | Foreign users in local groups | Cross-trust. |
| `Find-ForeignGroup` | Foreign groups nested | Cross-trust. |
| `Get-NetLocalGroup -ComputerName host` | Local groups per-host | Lateral. |
| `Get-NetLocalGroupMember -ComputerName host -GroupName Administrators` | Local admins | Lateral. |
| `Find-LocalAdminAccess` | Local admin where I have access | Path. |
| `Get-DomainObjectAcl -SamAccountName GroupName` | Per-group ACL | ACL. |
| `Find-InterestingDomainAcl` | Dangerous ACEs | Privesc. |
| pywerview equivalents | Linux | Adjacent. |
| `Convert-SidToName` | SID resolution | Helper. |
^ad-grouptool-powerview

### PowerView group analysis

```powershell
# Import
Import-Module .\PowerView.ps1

# Comprehensive
Get-DomainGroup | Select Name,GroupScope,@{n='AdminCount';e={$_.AdminCount}}

# Privileged
Get-DomainGroup -AdminCount

# Direct + recursive
Get-DomainGroupMember -Identity "Domain Admins" -Recurse

# Foreign analysis
Find-ForeignUser
Find-ForeignGroup

# Per-group ACL
Get-DomainObjectAcl -SamAccountName "Domain Admins" -ResolveGUIDs

# Linux pywerview
pywerview get-netgroup -u user -p pass -d dom.local --dc-ip DC
pywerview get-netgroupmember -u user -p pass -d dom.local --dc-ip DC --groupname "Domain Admins"
```

___

## BloodHound / SharpHound

| **Función** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Group collection | `SharpHound -c Group` | Targeted. |
| Default collection | `SharpHound -c Default` (includes groups) | Comprehensive. |
| All collection | `SharpHound -c All` | Slow but complete. |
| Memberships | `SharpHound -c Group,LocalAdmin,Session` | Lateral focus. |
| RustHound (Linux) | `rusthound -d dom.local -u u -p p --zip` | Cross-platform. |
| BloodHound.py | `bloodhound-python -c Group -d dom -u u -p p` | Linux. |
| AzureHound | Azure AD groups | Cloud. |
| Visual graph | Group nodes + edges | Standard. |
| HighValue tag | Auto on Tier 0 groups | Built-in. |
| Cypher: priv group recursive | `MATCH (n)-[:MemberOf*1..]->(g {highvalue:true})` | Custom. |
| Cypher: foreign membership | `WHERE n.domain <> g.domain` | Cross-trust. |
| Cypher: shortest path to DA | `MATCH p=shortestPath(...)` | Path analysis. |
| Cross-domain ingest | Multi-domain SharpHound | Sequential. |
| BHCE 6.x improvements | Modern automation | Standard. |
| Custom analytics scripts | Cypher | Tool. |
| ACL analysis on groups | Privesc paths | Standard. |
^ad-grouptool-bh

### BloodHound queries

```cypher
// All Tier 0 groups + members recursive
MATCH (g:Group {highvalue: true})
MATCH (n)-[:MemberOf*1..]->(g)
RETURN g.name,n.name,n.objectid

// Foreign principals in Tier 0
MATCH (g:Group {highvalue: true})
MATCH (n)-[:MemberOf*1..]->(g)
WHERE n.domain <> g.domain
RETURN g.name,n.name,n.domain

// Shortest path to Domain Admins from owned principals
MATCH (u {owned: true}), (g:Group {name: "DOMAIN ADMINS@DOM.LOCAL"})
MATCH p=shortestPath((u)-[*1..]->(g))
RETURN p

// Groups with dangerous ACL paths to DA
MATCH p=(g:Group)-[:GenericAll|GenericWrite|WriteOwner|WriteDacl*1..]->(da:Group {name:"DOMAIN ADMINS@DOM.LOCAL"})
RETURN p
```

___

## Impacket / Linux LDAP

| **Tool** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| `samrdump` groups | `impacket-samrdump dom/u:p@DC` | SAMR detail. |
| `samrdump` anonymous | `impacket-samrdump 'dom/'@DC` | Null. |
| `lookupsid` for SID-to-name | `impacket-lookupsid 'dom/u:p'@DC` | RID brute. |
| `secretsdump` (privileged) | `impacket-secretsdump dom/admin:pass@DC -just-dc` | Adjacent. |
| `bloodhound-python` | `bloodhound-python -d dom -u u -p p -c All` | BH collector. |
| `windapsearch -G` | `python windapsearch.py --groups` | Wrapper. |
| `ldapdomaindump` | `ldd dom\u:p@DC` | HTML report. |
| `pywerview get-netgroup` | Linux PowerView port | Adjacent. |
| `bloodyAD --groups` | LDAP modify | Privileged. |
| `nxc ldap DC --groups` | Standard | Quick. |
| `enum4linux-ng -G` | Comprehensive | Legacy. |
| `rpcclient enumdomgroups` | RPC | Standard. |
| `kerbrute groupenum` (no such option) | N/A | None. |
| `getDomainAdmins.py` (custom) | Per-script | Edge. |
| ldap-monitor | Defender adjacent | Adjacent. |
| Custom Python LDAP (ldap3 lib) | DIY | Flexible. |
^ad-grouptool-impacket

### Impacket / Linux pipeline

```bash
DC="dc01.dom.local"
USER="user"; PASS="pass"
DOM="dom.local"

# samrdump comprehensive
impacket-samrdump "$DOM/$USER:$PASS"@$DC > samr_dump.txt

# bloodhound-python (groups + members + ACLs)
bloodhound-python -d $DOM -u $USER -p $PASS -ns $DC -c All --zip

# windapsearch
python3 windapsearch.py -d $DOM -u $USER -p $PASS --dc $DC --groups

# enum4linux-ng (anonymous + auth)
enum4linux-ng -G -A $DC -u $USER -p $PASS -oJ enum.json
```

___

## Wordlists & Recursos

| **Recurso** | **URL / Path** | **Notas** |
|:---:|:---:|:---:|
| HackTricks Group Enum | `book.hacktricks.xyz/windows-hardening/active-directory-methodology` | Reference. |
| The Hacker Recipes | `thehacker.recipes/ad/recon/groups` | Comprehensive. |
| ADSecurity (Sean Metcalf) | `adsecurity.org` | Defender intel. |
| BloodHound docs | `bloodhound.specterops.io` | Tool. |
| PowerView Cheat Sheet | HarmJ0y/CheatSheets | Reference. |
| Microsoft Built-in Groups | `learn.microsoft.com` | Vendor. |
| MITRE ATT&CK T1069.002 (Domain Group Discovery) | Framework | Standard. |
| `awesome-active-directory` | GitHub | Foundation. |
| Will Schroeder blog | Specter Ops | Research. |
| Sean Metcalf "Sneaky AD Persistence" | Talks | Reference. |
| BloodHound Cypher cheatsheet | Specter Ops | Reference. |
| LDAP Filter Syntax | Microsoft docs | Spec. |
| RFC 4515 LDAP Filter | IETF | Spec. |
| `groupType` reference | Microsoft KB | Bitfield. |
| `userAccountControl` reference | Microsoft KB | Adjacent. |
| Privileged Access Management | Microsoft Tier model | Hardening. |
^ad-grouptool-resources

***
