---
aliases:
  - Group List Dump
  - LDAP Group Filter
  - enumdomgroups
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[AD - Groups Enumeration]]"
  - "[[netexec]]"
---
# AD - Groups Enumeration - Group List Extraction

---

## Bulk Group Listing

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc ldap <DC> -u u -p p --groups` | Lista groups via LDAP | Standard. |
| `nxc smb <DC> -u u -p p --groups` | Lista via SAMR | Alt path. |
| `Get-ADGroup -Filter * -Properties Description,GroupCategory,GroupScope` | Groups + atributos útiles | RSAT detail. |
| `Get-DomainGroup` (PowerView) | Sin RSAT | Adversary. |
| `rpcclient -U 'corp\u%pass' <DC> -c 'enumdomgroups;enumalsgroups builtin'` | Groups + built-in aliases | Sin LDAP tools. |
| `ldapsearch ... "(objectCategory=group)" cn description groupType objectSid` | LDAP raw | Linux. |
| `windapsearch -d corp.local -u u -p p --dc-ip <DC> --groups` | Wrapper | Helper. |
^ad-grouplist-bulk

```bash
DC=10.10.10.10
nxc ldap $DC -u user -p pass --groups > groups.txt
rpcclient -U 'corp\user%pass' $DC -c 'enumdomgroups' > groups_rpc.txt
```

```powershell
Get-ADGroup -Filter * -Properties Description,GroupCategory,GroupScope,Members |
  Select Name,GroupCategory,GroupScope,Description,@{n='MemberCount';e={$_.Members.Count}} |
  Export-Csv groups.csv -NoTypeInformation
```

---

## Group Properties & Attributes

| **Atributo** | **Significado** | **Cuándo importa** |
|:---:|:---:|:---:|
| `cn` / `samAccountName` | Group name | ID. |
| `description` | Free-text | Cred leaks ocasionales. |
| `groupType` | Bitfield: scope + security/distribution | Filter scope. |
| `objectSid` | Group SID | Cross-trust + RID. |
| `member` | Members (DNs directos) | Direct membership. |
| `memberOf` | Parent groups (nested) | Recursive analysis. |
| `managedBy` | Manager DN | Owner discovery. |
| `adminCount` | =1 si protected | Tier 0/1 marker. |
| `nTSecurityDescriptor` | DACL | ACL audit. |
^ad-grouplist-attrs

**`groupType` bitfield:**
- `0x80000000` — `SECURITY_ENABLED` (security group)
- `0x00000002` — `GLOBAL` scope
- `0x00000004` — `DOMAIN_LOCAL` scope
- `0x00000008` — `UNIVERSAL` scope

**Combinaciones comunes:**
- `-2147483646` → Security Global (más común).
- `-2147483644` → Security Domain Local (built-in).
- `-2147483640` → Security Universal (forest scope).
- `2` → Distribution Global (mailing list).

```bash
# Solo security groups (bit 0x80000000)
ldapsearch ... "(&(objectCategory=group)(groupType:1.2.840.113556.1.4.803:=2147483648))" cn description

# Universal scope (forest-wide)
ldapsearch ... "(&(objectCategory=group)(groupType:1.2.840.113556.1.4.803:=8))" cn
```

---

## Direct Members Query

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADGroupMember "<group>"` | Members directos | Standard. |
| `Get-ADGroupMember "<group>" -Recursive` | Members transitivos (nested) | Effective members. |
| `Get-ADGroup -Identity "<group>" -Pr Members \| Select -Expand Members` | Member DNs | Direct LDAP-style. |
| `nxc smb <DC> -u u -p p --groups "<group>"` | Members via netexec | Quick targeted. |
| `rpcclient -U 'corp\u%pass' <DC> -c 'querygroupmem 0x200'` | Members por RID (512=DA) | Direct RPC. |
| `rpcclient -U 'corp\u%pass' <DC> -c 'queryaliasmem builtin 0x220'` | Built-in alias Administrators | Alias. |
| `ldapsearch -b "CN=<group>,CN=Users,DC=corp,DC=local" -s base "(objectClass=*)" member` | Members via member attr | LDAP raw. |
| `ldapsearch -b "DC=corp,DC=local" "(memberOf=CN=<group>,...)" samAccountName` | Reverse query (users con group en memberOf) | Direct only. |
^ad-grouplist-members

**Caveat:** LDAP `member` attribute trunca a 1500 entradas. Para groups grandes usar paged: `member;range=0-1499`, `member;range=1500-2999`, etc. RSAT `Get-ADGroupMember` maneja paging automático.

```powershell
# Snapshot completo (direct + recursive)
$g = "Domain Admins"
@{
  Direct    = (Get-ADGroupMember $g | Measure).Count
  Recursive = (Get-ADGroupMember $g -Recursive | Measure).Count
  Members   = Get-ADGroupMember $g -Recursive | Select Name,SamAccountName,objectClass
}
```

---

## Groups by Scope

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADGroup -Filter {GroupScope -eq "Global"}` | Global groups (most common) | Per-scope audit. |
| `Get-ADGroup -Filter {GroupScope -eq "DomainLocal"}` | Domain Local (built-ins típicamente) | Built-in audit. |
| `Get-ADGroup -Filter {GroupScope -eq "Universal"}` | Universal (forest scope, almacenado en GC) | Forest queries. |
| `Get-ADGroup -Filter {GroupCategory -eq "Distribution"}` | Distribution (no security) | Mailing lists. |
| `ldapsearch ... "(samAccountType=268435456)"` | Security Global numérico | Linux. |
| `ldapsearch ... "(samAccountType=268435457)"` | Security Domain Local | Linux. |
^ad-grouplist-scope

**Scope rules:**
- **Global** → miembros del mismo domain. Visible cross-domain.
- **Domain Local** → miembros de cualquier domain del forest. Solo visible local.
- **Universal** → miembros de cualquier domain. Visible forest-wide (almacenado en GC).
- Tier 0 forest-wide (Schema Admins, Enterprise Admins) son **Universal**.

---

## Anonymous Group Enumeration

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `nxc smb <DC> -u '' -p '' --groups` | Null SAMR groups | Test misconfig. |
| `rpcclient -U "" <DC> -N -c 'enumdomgroups;enumalsgroups builtin;enumalsgroups domain'` | Anonymous RPC groups + aliases | Direct. |
| `enum4linux-ng -G <DC>` | Bulk anonymous | Sin tools individual. |
| `impacket-samrdump 'corp.local/'@<DC>` | Anonymous SAMR | Linux. |
^ad-grouplist-anon

```bash
# Sweep anonymous en subnet
nxc smb 10.0.0.0/24 -u '' -p '' --groups

# Comprehensive
enum4linux-ng -G -A <DC> -oJ enum_anon.json
```

---

## Cross-Domain (Forest-Wide)

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `ldapsearch -h <DC> -p 3268 -D 'corp\u' -w pass -b "" "(objectCategory=group)" cn distinguishedName` | Groups forest-wide via GC | Cross-domain. |
| `Get-ADGroup -Filter * -Server <DC>:3268` | RSAT GC | Cross-domain RSAT. |
| `Get-ADObject -SearchBase "CN=ForeignSecurityPrincipals,DC=corp,DC=local" -Filter *` | FSPs (cross-trust SIDs) | Cross-trust members. |
| `bloodhound-python -d corp.local -u u -p p -ns <DC> -c All --zip` | Ingest multi-domain (run per domain) | Forest-wide graph. |
^ad-grouplist-forest

```bash
# Multi-domain BloodHound
for d in corp.local partner.com; do
  DC=$(dig +short SRV "_ldap._tcp.dc._msdcs.$d" | awk '{print $4}' | head -1 | sed 's/\.$//')
  bloodhound-python -d "$d" -u "auditor@$d" -p 'Pass!' -ns "$DC" -c All --zip -o "./loot/$d/"
done
```

---
