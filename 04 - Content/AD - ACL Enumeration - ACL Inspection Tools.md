---
aliases:
  - ACL Inspection
  - dsacls
  - Get-Acl AD
  - Get-ObjectAcl PowerView
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
  - "[[AD - ACL Enumeration]]"
---
# AD - ACL Enumeration - ACL Inspection Tools

***

## RSAT / PowerShell Native

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-Acl "AD:CN=user,..."` | DACL of object | Standard. |
| `Get-Acl "AD:$dn" | Select -ExpandProperty Access` | Access list | Standard. |
| `(Get-Acl "AD:$dn").Access` | Direct access | Adjacent. |
| AD: PSDrive | Maps AD as filesystem | Standard. |
| Filter `AccessControlType -eq "Allow"` | Allow ACEs only | Standard. |
| Filter `ActiveDirectoryRights` | Specific rights | Standard. |
| `IdentityReference` | Principal granted right | Standard. |
| `InheritanceType` | Inherited or explicit | Adjacent. |
| `ObjectType` GUID | Specific attribute/extended right | Standard. |
| `InheritedObjectType` GUID | Child object class | Edge. |
| `Get-Acl "AD:OU=X,..."` | OU DACL | Standard. |
| `Set-Acl` | Modify (privileged) | Privileged. |
| `Get-ADObject -Properties nTSecurityDescriptor` | Direct attribute read | Standard. |
| `dsacls "CN=user,..."` | Native CLI | Standard. |
| `dsacls /S` | Show inherited | Adjacent. |
| `icacls` for filesystem | Adjacent (NTFS) | Adjacent. |
^ad-acl-tools-rsat

### RSAT ACL inspection

```powershell
# Per-object DACL
$dn = "CN=Administrator,CN=Users,DC=dom,DC=local"
Get-Acl "AD:$dn" | Select -ExpandProperty Access |
  Where AccessControlType -eq "Allow" |
  Select IdentityReference,ActiveDirectoryRights,InheritanceType,ObjectType

# All inherited + explicit
Get-Acl "AD:$dn" | Select -ExpandProperty Access |
  Format-Table IdentityReference,ActiveDirectoryRights,InheritanceType -AutoSize

# Native dsacls
dsacls "CN=Administrator,CN=Users,DC=dom,DC=local"
```

___

## PowerView (Adversary)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-DomainObjectAcl -SamAccountName user` | User ACL | Adversary. |
| `Get-DomainObjectAcl -SearchBase "DC=..." -ResolveGUIDs` | All objects | Bulk. |
| `Get-DomainObjectAcl -ResolveGUIDs` | Resolve right GUIDs | Standard. |
| `Find-InterestingDomainAcl` | Filter dangerous ACEs | Standard. |
| `Find-InterestingDomainAcl -ResolveGUIDs` | Resolved | Standard. |
| `Get-DomainObjectAcl -Identity user` | Per-user | Standard. |
| `Get-DomainObjectAcl -Identity user -RightsFilter All` | Filter | Standard. |
| `Get-ObjectAcl` (PowerView v2) | Older syntax | Legacy. |
| `Add-DomainObjectAcl` | Modify (privileged) | Privileged. |
| `Remove-DomainObjectAcl` | Modify (privileged) | Privileged. |
| `Set-DomainObjectAcl` | Modify (privileged) | Privileged. |
| `Get-DomainObject -Properties nTSecurityDescriptor` | Raw SD | Adjacent. |
| `Get-DomainOU -Properties nTSecurityDescriptor` | OU SD | Adjacent. |
| `Get-DomainGroup -Properties nTSecurityDescriptor` | Group SD | Adjacent. |
| `Get-DomainComputer -Properties nTSecurityDescriptor` | Computer SD | Adjacent. |
| pywerview equivalent | Linux | Adjacent. |
^ad-acl-tools-powerview

### PowerView ACL queries

```powershell
Import-Module .\PowerView.ps1

# Per-user ACL (resolved)
Get-DomainObjectAcl -SamAccountName administrator -ResolveGUIDs |
  Select ObjectDN,IdentityReferenceName,ActiveDirectoryRights,ObjectAceType

# Find all interesting (dangerous) ACEs
Find-InterestingDomainAcl -ResolveGUIDs |
  Where IdentityReferenceClass -ne "computer" |
  Select ObjectDN,IdentityReferenceName,ActiveDirectoryRights

# Specific search base
Get-DomainObjectAcl -SearchBase "OU=Workstations,DC=dom,DC=local" -ResolveGUIDs |
  Where {$_.ActiveDirectoryRights -match "GenericAll|WriteDACL|WriteOwner"}
```

```bash
# Linux pywerview
pywerview get-objectacl -u user -p pass -d dom.local --dc-ip DC --samaccountname administrator
```

___

## BloodHound (Visual)

| **Edge** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `GenericAll` | Full control | Standard. |
| `GenericWrite` | Modify any non-protected attr | Standard. |
| `WriteDacl` | Modify ACL | Standard. |
| `WriteOwner` | Change owner | Standard. |
| `ForceChangePassword` | Reset pwd | Standard. |
| `AddMember` | Add to group | Standard. |
| `AddSelf` | Self-add | Standard. |
| `AllExtendedRights` | All ext rights | Standard. |
| `WriteSPN` | Write servicePrincipalName | Modern. |
| `AddKeyCredentialLink` | Shadow Credentials | Modern. |
| `WriteAccountRestrictions` | Modify UAC | Modern. |
| `GetChanges` / `GetChangesAll` | DCSync | Standard. |
| `Owns` | Object ownership | Standard. |
| BloodHound CE 5.x+ improved ACL | Modern | Tool. |
| Cypher: dangerous ACL paths | Custom | Standard. |
| Visual: ACL graph per object | Helpful | Standard. |
| Per-domain collection required | Standard | Adjacent. |
| Sharphound `-c ACL` | Targeted | Standard. |
^ad-acl-tools-bh

### BloodHound ACL queries

```cypher
// Dangerous ACEs leading to privileged
MATCH p=(u)-[:GenericAll|GenericWrite|WriteDacl|WriteOwner|AddMember|ForceChangePassword*1..]->(target {highvalue: true})
RETURN p

// Per-object inbound ACL
MATCH (target {name: "ADMINISTRATOR@DOM.LOCAL"})
MATCH (u)-[r]->(target)
WHERE type(r) IN ["GenericAll","GenericWrite","WriteDacl","WriteOwner","AddMember","ForceChangePassword","AllExtendedRights"]
RETURN u.name, type(r)

// Custom ACL chain to DA
MATCH p=shortestPath((u {owned: true})-[*1..]->(g:Group {name: "DOMAIN ADMINS@DOM.LOCAL"}))
RETURN p
```

___

## dsacls (Native Windows)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `dsacls "DN"` | Per-object ACL | Standard. |
| `dsacls "DN" /S` | Include inherited | Standard. |
| `dsacls "DN" /T` | Include children | Adjacent. |
| `dsacls /G principal:rights` | Grant (privileged) | Privileged. |
| `dsacls /R principal` | Remove (privileged) | Privileged. |
| `dsacls /P:Y` | Disable inheritance | Edge. |
| `dsacls "OU=X,DC=..."` | OU ACL | Standard. |
| Native ResKit utility | Always available | Standard. |
| Output: per-line ACE | Readable format | Standard. |
| Filter via findstr | Standard | Standard. |
| `dsquery * | dsacls` pipeline | Combinable | Edge. |
| Adjacent: `icacls` for files | NTFS | Adjacent. |
| Modern: PowerShell preferred | Standard | Adjacent. |
| Compatibility legacy | Standard | Standard. |
| Detection: dsacls events | Edge | Adjacent. |
| Audit: per-object dsacls output | Standard | Standard. |
^ad-acl-tools-dsacls

### dsacls usage

```cmd
:: Per-object ACL with inheritance
dsacls "CN=Administrator,CN=Users,DC=dom,DC=local" /S

:: Filter for specific rights
dsacls "CN=Administrator,CN=Users,DC=dom,DC=local" | findstr /i "GenericAll\|WriteDACL\|WriteOwner"

:: OU ACL
dsacls "OU=Workstations,DC=dom,DC=local" /S /T
```

___

## ldapsearch / Linux (Raw nTSecurityDescriptor)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `ldapsearch ... nTSecurityDescriptor` | Raw SD | Standard. |
| Binary blob | Need decoder | Standard. |
| `bloodyAD --resolve-sd` | Decoded SDDL | Linux. |
| `ldapsearch -E '!1.2.840.113556.1.4.801=::MAMCAQc='` | LDAP Server SD Flags Control | Standard. |
| LDAP_SERVER_SD_FLAGS_OID control | Get full SD | Standard. |
| Owner + group + DACL + SACL | Full SD | Adjacent. |
| Default returns DACL only | Standard | Standard. |
| Need privilege for SACL | Audit log permissions | Edge. |
| `pywerview get-objectacl` | Linux equivalent | Adjacent. |
| `bloodyAD get object DN --resolve-sd` | Bulk audit | Standard. |
| Custom Python + ldap3 + sec descriptor decoder | DIY | Edge. |
| `ldapsearch -h DC -E '!1.2...'` | Use control | Edge. |
| Modern Linux: bloodyAD preferred | Standard | Standard. |
| Detection: bulk SD reads | Defender | Adjacent. |
| Cross-platform: Python | Standard | Standard. |
| Compliance: red team scoped | Standard | OPSEC. |
^ad-acl-tools-linux

### Linux ACL inspection

```bash
# bloodyAD (recommended for Linux)
bloodyAD --host DC -d dom -u user -p pass \
  get object "CN=Administrator,CN=Users,DC=dom,DC=local" --resolve-sd

# Output: decoded SDDL with principal names

# Raw ldapsearch
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "CN=Administrator,CN=Users,DC=dom,DC=local" \
  -s base "(objectClass=*)" nTSecurityDescriptor

# With SD Flags Control (more detail)
ldapsearch -h DC -D 'dom\u' -w pass \
  -E '!1.2.840.113556.1.4.801=::MAMCAQc=' \
  -b "DC=dom,DC=local" \
  "(objectClass=user)" nTSecurityDescriptor
```

___

## ADRecon / Bulk ACL Reports

| **Tool** | **Output** | **Notas** |
|:---:|:---:|:---:|
| ADRecon ACL section | XLSX sheet | Comprehensive. |
| ADRecon -Collect ACLs | Specific category | Standard. |
| ADCollector .NET | Faster | Standard. |
| windapsearch --custom | Adjacent | Edge. |
| ldapdomaindump | HTML report | Standard. |
| BloodyAD audit scripts | LDAP modify + audit | Adjacent. |
| `Get-ADAclAuditing` (custom) | Per-org | Edge. |
| PingCastle ACL section | Defender | Standard. |
| Purple Knight ACL | Defender | Standard. |
| Microsoft Defender for Identity | ACL anomaly | Defender. |
| Custom Python audit | DIY | Standard. |
| Cross-correlate with priv | Standard | Adjacent. |
| Per-OU ACL audit | Granular | Standard. |
| Compliance: documented baseline | Standard | Adjacent. |
| Stale ACL detection | Audit | Adjacent. |
| Forest-wide ACL scan | Multi-domain | Adjacent. |
^ad-acl-tools-bulk

### Bulk ACL audit

```powershell
# Find all dangerous ACLs in domain (CSV export)
$dangerousRights = "GenericAll","GenericWrite","WriteDACL","WriteOwner",
                    "ExtendedRight","AllExtendedRights"

Get-ADObject -Filter * -SearchBase "DC=dom,DC=local" |
  ForEach-Object {
    $dn = $_.DistinguishedName
    Get-Acl "AD:$dn" | Select -ExpandProperty Access |
      Where {
        $_.AccessControlType -eq "Allow" -and
        ($_.ActiveDirectoryRights -match ($dangerousRights -join "|")) -and
        $_.IdentityReference -notmatch "BUILTIN|NT AUTHORITY|Domain Admins|Enterprise Admins|SYSTEM"
      } |
      Select @{n='ObjectDN';e={$dn}},IdentityReference,ActiveDirectoryRights,ObjectType
  } |
  Export-Csv dangerous_acls.csv -NoTypeInformation
```

```bash
# Linux equivalent via bloodyAD + scripting
bloodyAD --host DC -d dom -u user -p pass \
  search "(objectClass=user)" --resolve-sd > all_user_acls.txt

# Filter for dangerous rights
grep -E "GenericAll|GenericWrite|WriteDACL|WriteOwner" all_user_acls.txt
```

***
