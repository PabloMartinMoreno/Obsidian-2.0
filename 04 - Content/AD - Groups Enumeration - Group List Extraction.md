---
aliases:
  - Group List Dump
  - LDAP Group Filter
  - enumdomgroups
  - Get-ADGroup
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
---
# AD - Groups Enumeration - Group List Extraction

***

## Bulk Group Listing

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `nxc ldap DC -u u -p p --groups` | All groups | netexec quick. |
| `nxc smb DC -u u -p p --groups` | SAMR-based | Adjacent. |
| `Get-ADGroup -Filter *` | RSAT minimal | Standard. |
| `Get-ADGroup -Filter * -Properties *` | Full attrs | Detailed. |
| `Get-NetGroup` (PowerView) | Adversary tool | Same. |
| `Get-DomainGroup` (PowerView v3) | Newer | Adjacent. |
| `rpcclient -U u DC -c "enumdomgroups"` | RPC enum | Standard. |
| `rpcclient -U "" DC -N -c "enumdomgroups"` | Anonymous | Edge. |
| `rpcclient -U u DC -c "enumalsgroups domain"` | Alias groups | Edge. |
| `rpcclient -U u DC -c "enumalsgroups builtin"` | Built-in alias | Edge. |
| `dsquery group -limit 0` | Legacy | Old. |
| `ldapsearch ... "(objectCategory=group)"` | LDAP raw | Linux. |
| `windapsearch -d <dom> -u u -p p --groups` | Wrapper | Helper. |
| `nxc ldap DC --query "(objectCategory=group)" "*"` | Custom | Flexible. |
| Group object class | `group` | LDAP. |
| Group sAMAccountType | 268435456 (security global), 268435457 (security local), 536870912 (distribution) | Filter. |
^ad-grouplist-bulk

### Bulk dump

```bash
DC="dc01.dom.local"
USER="user"; PASS="pass"

# netexec (quickest)
nxc ldap $DC -u $USER -p $PASS --groups > groups.txt

# RPC variant
rpcclient -U "$USER%$PASS" $DC -c 'enumdomgroups' > groups_rpc.txt

# RSAT detailed
Get-ADGroup -Filter * -Properties Description,GroupCategory,GroupScope |
  Select Name,GroupCategory,GroupScope,Description |
  Export-Csv groups.csv -NoTypeInformation
```

```bash
# LDAP direct
ldapsearch -h $DC -D "dom\\$USER" -w $PASS -b "DC=dom,DC=local" \
  "(objectCategory=group)" \
  cn description groupType objectSid memberOf
```

___

## Group Properties & Attributes

| **Atributo** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `cn` / `name` | Group name | Standard ID. |
| `samAccountName` | Login name (legacy) | Standard. |
| `description` | Free-text | Always check. |
| `groupType` | Bitfield: scope + type | Critical. |
| `objectSid` | Group SID | Standard. |
| `member` | Members (DNs) | Direct membership. |
| `memberOf` | Parent groups | Nested. |
| `managedBy` | Manager DN | Owner indicator. |
| `whenCreated` / `whenChanged` | Lifecycle | Audit. |
| `info` | Notes field | Edge. |
| `gidNumber` | POSIX gid (Unix integration) | Edge. |
| `mail` | Mailing list | Distribution. |
| `displayName` | UI display | Adjacent. |
| `objectGUID` | Unique ID | Persistent. |
| `tokenGroups` | (Computed) Transitive members | Read-only. |
| `primaryGroupID` | RID of users with this primary | Edge. |
| `nTSecurityDescriptor` | DACL | ACL audit. |
| `adminCount` | Was protected group | SDProp marker. |
^ad-grouplist-attrs

### groupType bitfield decoded

```
0x80000000 (-2147483648)  SECURITY_ENABLED  (security group)
0x00000001 (1)            SYSTEM (built-in, can't delete)
0x00000002 (2)            GLOBAL scope
0x00000004 (4)            DOMAIN_LOCAL scope
0x00000008 (8)            UNIVERSAL scope
0x00000010 (16)           APP_BASIC
0x00000020 (32)           APP_QUERY

# Common combinations:
-2147483646  Security Global       (most common)
-2147483644  Security Domain Local
-2147483640  Security Universal
2            Distribution Global   (non-security)
8            Distribution Universal
```

```bash
# Filter security groups only
ldapsearch ... "(&(objectCategory=group)(groupType:1.2.840.113556.1.4.803:=2147483648))" cn

# Filter universal scope (forest-wide)
ldapsearch ... "(&(objectCategory=group)(groupType:1.2.840.113556.1.4.803:=8))" cn
```

___

## Direct Members Query

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `Get-ADGroupMember "Domain Admins"` | Direct members (RSAT) | Standard. |
| `Get-ADGroupMember "Domain Admins" -Recursive` | Transitive | Nested. |
| `Get-NetGroupMember` (PowerView) | Adversary | Same. |
| `Get-DomainGroupMember -Identity DA -Recurse` | PowerView v3 | Adjacent. |
| `nxc smb DC -u u -p p --groups "Domain Admins"` | netexec | Quick. |
| `rpcclient -U u DC -c "querygroupmem 0x200"` | RPC by RID | Direct. |
| `rpcclient -U u DC -c "queryaliasmem builtin 0x220"` | Alias built-in | Adjacent. |
| `ldapsearch ... "(memberOf=CN=Domain Admins,CN=Users,DC=...)"` | Members via reverse query | Indirect. |
| `ldapsearch ... -b "CN=Domain Admins,CN=Users,DC=..."` | Direct member attr | Standard. |
| LDAP `member` attribute | Array of DNs | Direct. |
| LDAP `member;range=0-1499` | Paged for large groups | Standard. |
| `Get-ADGroup -Identity X -Properties Members` | RSAT direct | Standard. |
| `Get-ADGroup -Identity X | Select -ExpandProperty Members` | Member DNs | Concise. |
| Resolve member SAM | Per-DN `Get-ADUser` | Adjacent. |
| Distribution group members | Same query | Adjacent. |
| Empty groups | `members.count = 0` | Audit. |
^ad-grouplist-members

### Members enumeration

```powershell
# Direct + recursive
Get-ADGroupMember "Domain Admins" | Select Name,SamAccountName,ObjectClass
Get-ADGroupMember "Domain Admins" -Recursive | Select Name,SamAccountName

# Per-group manager + members
Get-ADGroup -Filter * -Properties Members,ManagedBy |
  Where {$_.Members.Count -gt 0} |
  Select Name,@{n='MemberCount';e={$_.Members.Count}},ManagedBy
```

```bash
# netexec for specific group
nxc smb DC -u user -p pass --groups "Domain Admins"

# LDAP raw
ldapsearch -h DC -D 'dom\u' -w pass -b "CN=Domain Admins,CN=Users,DC=dom,DC=local" \
  -s base "(objectClass=*)" member

# Reverse: who's member of group X
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(memberOf=CN=Domain Admins,CN=Users,DC=dom,DC=local)" \
  samAccountName
```

___

## Groups by Scope

| **Scope** | **Filter** | **Notas** |
|:---:|:---:|:---:|
| Global groups | `groupType bit 2` | Most common. |
| Domain Local groups | `groupType bit 4` | Built-in mostly. |
| Universal groups | `groupType bit 8` | Forest-wide. |
| `(samAccountType=268435456)` | Global Security | Direct. |
| `(samAccountType=268435457)` | Domain Local Security | Direct. |
| `(samAccountType=536870912)` | Distribution | Adjacent. |
| Cross-domain membership | Universal only | Forest design. |
| Domain Local restrict | Same domain only | Standard. |
| Global accept members from same domain | Standard | Standard. |
| Universal members forest-wide | Standard | Standard. |
| GC stores Universal membership | Forest queries | Standard. |
| Built-in always Domain Local | Per-domain | Standard. |
| `Domain Admins` is Global Security | Standard | Standard. |
| `Enterprise Admins` is Universal | Forest scope | Standard. |
| `Administrators` is Domain Local | Built-in | Standard. |
| `Schema Admins` is Universal | Forest scope | Standard. |
^ad-grouplist-scope

### Scope filters

```bash
# Global security groups
ldapsearch -h DC -D 'dom\u' -w pass -b "DC=dom,DC=local" \
  "(samAccountType=268435456)" \
  cn description

# Universal groups (forest-wide)
ldapsearch ... "(&(objectCategory=group)(groupType:1.2.840.113556.1.4.803:=8))" \
  cn description

# Domain local groups
ldapsearch ... "(&(objectCategory=group)(groupType:1.2.840.113556.1.4.803:=4))" \
  cn description
```

```powershell
# RSAT
Get-ADGroup -Filter {GroupScope -eq "Global"}
Get-ADGroup -Filter {GroupScope -eq "DomainLocal"}
Get-ADGroup -Filter {GroupScope -eq "Universal"}
```

___

## Anonymous Group Enumeration

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| `nxc smb DC -u '' -p '' --groups` | Null SAMR | Quick. |
| `rpcclient -U "" DC -N -c 'enumdomgroups'` | Anonymous RPC | Standard. |
| `rpcclient -U "" DC -N -c 'enumalsgroups builtin'` | Built-in alias | Adjacent. |
| `enum4linux-ng -G DC` | Bulk anonymous | Comprehensive. |
| `enum4linux -G DC` | Legacy | Old. |
| `impacket-samrdump 'dom/'@DC` | Anonymous SAMR | Standard. |
| Modern Server 2019+ | Often blocks anonymous | Hardened. |
| Legacy 2008-2012 | Often allows | Audit. |
| `RestrictAnonymous=2` blocks | Registry hardening | Defense. |
| `RestrictAnonymousSAM=1` blocks | Adjacent | Defense. |
| Pre-Windows 2000 group | Allows anonymous SAMR | Edge legacy. |
| Modern: anonymous LDAP also blocked | Default | Standard. |
| Test always at start of engagement | Quick win check | OPSEC. |
| Bulk subnet test | All DCs | Sweep. |
| Detection: Event 4661 (Object access) | Defender | Adjacent. |
| Combine with RID brute | Map users + groups | Strategy. |
^ad-grouplist-anon

### Null group enum

```bash
# Test domain-wide
DCS=$(dig +short SRV "_ldap._tcp.dc._msdcs.dom.local" | awk '{print $4}' | sed 's/\.$//')

for dc in $DCS; do
  echo "=== $dc ==="
  nxc smb $dc -u '' -p '' --groups 2>&1 | head -10
done

# Comprehensive null check
enum4linux-ng -G -A DC -oJ enum_anon.json

# RPC anonymous
rpcclient -U "" DC -N -c '
enumdomgroups;
enumalsgroups domain;
enumalsgroups builtin
'
```

___

## Cross-Domain Group Discovery (Forest-Wide)

| **Comando** | **Output** | **Notas** |
|:---:|:---:|:---:|
| GC port 3268 query | Forest-wide groups | Standard. |
| `ldapsearch -h DC -p 3268 -b ""` | Generic GC bind | Forest. |
| `Get-ADGroup -Filter * -Server DC:3268` | RSAT GC | Adjacent. |
| Universal groups in GC only | Forest scope | Standard. |
| Cross-domain membership via referrals | LDAP | Standard. |
| Foreign Security Principals (FSP) | Cross-trust members | LDAP container. |
| `CN=ForeignSecurityPrincipals,DC=...` | FSP container | Standard. |
| Resolve FSP SIDs | Cross-domain LDAP | Adjacent. |
| Multi-domain SharpHound | Per-domain | Sequential. |
| Cross-trust group membership | BloodHound | Visual. |
| Cypher: cross-domain group queries | Custom | Tool. |
| Cross-forest universal groups | Edge | Adjacent. |
| Schema Admins forest-wide | Critical | Standard. |
| Per-trust membership | Audit cross-trust | Standard. |
| Hidden cross-trust groups | Edge | Investigate. |
| Forest root critical groups | Top tier | Strategy. |
^ad-grouplist-forest

### Forest-wide groups

```bash
# Cross-domain via GC port
ldapsearch -h DC -p 3268 -D 'dom\user' -w pass -b "" \
  "(objectCategory=group)" \
  cn distinguishedName

# Forest-wide BloodHound
bloodhound-python -d dom-A.local -u user -p pass -ns DC-A -c All
bloodhound-python -d dom-B.local -u user -p pass -ns DC-B -c All
# Ingest both ZIPs
```

```powershell
# Forest-wide RSAT
Get-ADForest | Select -ExpandProperty Domains | ForEach-Object {
  Get-ADGroup -Filter * -Server $_ |
    Select Name,GroupScope,@{n='Domain';e={$_.DistinguishedName -replace '.*DC=([^,]+),DC=([^,]+).*','$1.$2'}}
}
```

***
