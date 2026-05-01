---
aliases:
  - Cypher Queries
  - BloodHound Cypher
  - Custom Queries
  - Neo4j Cypher
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
  - "[[BloodHound & SharpHound]]"
---
# BloodHound & SharpHound - Cypher Queries

***

## Cypher Syntax Basics

| **Syntax** | **Significa** | **Ejemplo** |
|:---:|:---:|:---:|
| `MATCH (n:Label)` | Match nodes con label | `MATCH (u:User)`. |
| `MATCH (a)-[r:REL]->(b)` | Match relationship dirigida | `MATCH (u)-[:MemberOf]->(g:Group)`. |
| `WHERE` | Filter | `WHERE u.enabled = true`. |
| `RETURN` | Output | `RETURN u.name,u.objectid`. |
| `SET` | Modify property | `SET u.owned = true`. |
| `*1..N` | Variable-length path | `[*1..3]` = 1 a 3 hops. |
| `shortestPath(...)` | Shortest path function | `MATCH p=shortestPath((a)-[*1..]->(b))`. |
| `COUNT { ... }` | Subquery count (Cypher 5+) | `COUNT { (u)-[*1..]->(t) }`. |
^ad-cypher-basics

```cypher
// Basic structure example
MATCH (u:User {enabled:true, hasspn:true})
WHERE u.adminCount = true
RETURN u.name,u.serviceprincipalnames
```

___

## Path Queries

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH p=shortestPath((u {owned:true})-[*1..]->(g:Group {name:"DOMAIN ADMINS@CORP.LOCAL"})) RETURN p` | Shortest path owned → DA | Standard privesc. |
| `MATCH p=shortestPath((u {owned:true})-[*1..]->(t {highvalue:true})) RETURN p` | Owned → high-value | Generic. |
| `MATCH p=allShortestPaths((u {owned:true})-[*1..6]->(t {highvalue:true})) RETURN p` | All shortest paths (max depth 6) | Comprehensive. |
| `MATCH p=(u {owned:true})-[*1..3]->(t {highvalue:true}) RETURN p` | All paths up to 3 hops | Detail. |
^ad-cypher-paths

___

## Common Edge Filters

| **Edge type group** | **Cypher filter** | **Cuándo** |
|:---:|:---:|:---:|
| ACL edges | `[:GenericAll\|GenericWrite\|WriteDacl\|WriteOwner\|ForceChangePassword\|AddMember\|AddSelf\|AllExtendedRights]` | Privesc. |
| Lateral movement | `[:AdminTo\|CanRDP\|CanPSRemote\|HasSession\|CanLogon]` | Lateral. |
| Delegation | `[:AllowedToDelegate\|AllowedToAct\|AddKeyCredentialLink]` | Delegation abuse. |
| DCSync | `[:GetChanges\|GetChangesAll\|DCSync]` | Hash dump. |
| Group membership | `[:MemberOf*1..]` | Recursive. |
| GPO | `[:GpLink]` | GPO abuse. |
| Trust | `[:Trusts]` | Cross-domain. |
^ad-cypher-edges

___

## Privesc Path Queries

```cypher
// 1. Shortest path desde owned a Domain Admins (any domain)
MATCH (u {owned:true})
MATCH (g:Group) WHERE g.name CONTAINS "DOMAIN ADMINS"
MATCH p=shortestPath((u)-[*1..]->(g))
RETURN p

// 2. ACL paths a high-value (excluyendo defaults)
MATCH p=(u)-[:GenericAll|GenericWrite|WriteDacl|WriteOwner|ForceChangePassword|AddMember|AllExtendedRights]->(t {highvalue:true})
WHERE NOT u.objectid ENDS WITH '-512'
  AND NOT u.objectid ENDS WITH '-519'
  AND NOT u.objectid ENDS WITH '-518'
RETURN p

// 3. Recursive group ACL chains
MATCH p=(u {owned:true})-[:MemberOf*1..]->(g:Group)-[:GenericAll|GenericWrite|WriteDacl]->(t)
RETURN p LIMIT 50
```
^ad-cypher-privesc

___

## Lateral Movement Queries

```cypher
// 1. Owned → AdminTo (where am I local admin)
MATCH (u {owned:true})-[:AdminTo|MemberOf*1..]->(c:Computer)
RETURN u.name,c.name

// 2. CanRDP / CanPSRemote
MATCH (u {owned:true})-[:CanRDP|CanPSRemote*1..]->(c:Computer)
RETURN u.name,c.name

// 3. HasSession (where users are logged in — pivot prep)
MATCH (c:Computer)-[:HasSession]->(u:User {adminCount:true})
RETURN c.name,u.name
```
^ad-cypher-lateral

___

## Kerberoast / AS-REP Queries

```cypher
// 1. Kerberoastable users (con SPN)
MATCH (u:User {hasspn:true, enabled:true})
RETURN u.name,u.serviceprincipalnames,u.adminCount

// 2. Priv kerberoastable (Tier 0)
MATCH (u:User {hasspn:true})
WHERE u.adminCount = true
RETURN u.name,u.serviceprincipalnames

// 3. AS-REP roastable
MATCH (u:User {dontreqpreauth:true, enabled:true})
RETURN u.name

// 4. AS-REP + Tier 0
MATCH (u:User {dontreqpreauth:true})
WHERE u.adminCount = true
RETURN u.name
```
^ad-cypher-kerberoast

___

## DCSync Queries

```cypher
// 1. All DCSync principals (con combo)
MATCH (u)-[:DCSync]->(d:Domain)
RETURN u.name,u.domain,d.name

// 2. Manual combo (pre-BHCE 4.x)
MATCH (u)-[:GetChanges]->(d:Domain)
MATCH (u)-[:GetChangesAll]->(d)
RETURN u.name

// 3. Non-default DCSync principals (audit)
MATCH (u)-[:DCSync|GetChanges|GetChangesAll]->(d:Domain)
WHERE NOT u.objectid ENDS WITH '-512'  // Domain Admins
  AND NOT u.objectid ENDS WITH '-519'  // Enterprise Admins
  AND NOT u.objectid ENDS WITH '-516'  // Domain Controllers
RETURN u.name,u.domain
```
^ad-cypher-dcsync

___

## Delegation Queries

```cypher
// 1. Unconstrained Delegation hosts
MATCH (c:Computer {unconstraineddelegation:true})
RETURN c.name,c.domain

// 2. Constrained Delegation
MATCH (u)-[:AllowedToDelegate]->(t)
RETURN u.name,t.name

// 3. RBCD configured
MATCH (u)-[:AllowedToAct]->(t)
RETURN u.name,t.name

// 4. Shadow Credentials (AddKeyCredentialLink)
MATCH (u)-[:AddKeyCredentialLink]->(t)
RETURN u.name,t.name

// 5. Path owned → cualquier delegation type
MATCH p=shortestPath((u {owned:true})-[*1..]->(t {highvalue:true}))
WHERE any(r IN relationships(p) WHERE type(r) IN ["AllowedToDelegate","AllowedToAct","AddKeyCredentialLink"])
RETURN p
```
^ad-cypher-deleg

___

## ADCS Queries (BHCE 5.x+)

```cypher
// 1. ESC1 templates
MATCH (t:CertTemplate {enrolleeSuppliesSubject:true, hasAuthenticationEKU:true})
RETURN t.name

// 2. ESC1 paths owned → cert
MATCH (u {owned:true})-[:Enroll|MemberOf*1..]->(t:CertTemplate {enrolleeSuppliesSubject:true})
RETURN u.name,t.name

// 3. ESC7 (ManageCA)
MATCH (u)-[:ManageCA|ManageCertificates]->(c:EnterpriseCA)
RETURN u.name,c.name

// 4. All ADCS paths to high-value
MATCH p=shortestPath((u {owned:true})-[*1..]->(t {highvalue:true}))
WHERE any(n IN nodes(p) WHERE n:CertTemplate OR n:EnterpriseCA)
RETURN p
```
^ad-cypher-adcs

___

## Custom Reporting

```cypher
// 1. Stale priv users (last logon >180d)
MATCH (u:User {enabled:true, adminCount:true})
WHERE u.lastlogon < timestamp() / 1000 - 15552000
RETURN u.name,u.lastlogon

// 2. Service accounts en priv groups
MATCH (u:User {hasspn:true})-[:MemberOf*1..]->(g:Group {highvalue:true})
RETURN u.name,g.name

// 3. Foreign principals en priv groups (cross-trust)
MATCH (u)-[:MemberOf*1..]->(g:Group {highvalue:true})
WHERE u.domain <> g.domain
RETURN u.name,u.domain,g.name,g.domain

// 4. Top exposed users (most paths to)
MATCH (u:User {enabled:true, adminCount:true})
WITH u, COUNT { (other)-[*1..10]->(u) } AS exposure
RETURN u.name,exposure ORDER BY exposure DESC LIMIT 20
```
^ad-cypher-reporting

___

## Cypher Performance Tips

| **Tip** | **Detalle** |
|:---:|:---:|
| Limit depth `*1..N` (no `*..`) | Path depth >7 = exponential blowup. |
| Use `shortestPath(...)` cuando sea posible | Optimizado vs full path. |
| Filter early (`WHERE` post `MATCH`) | Reduce intermediate sets. |
| Add `LIMIT N` para queries exploratorios | Avoid massive returns. |
| Use indexes (BHCE auto-creates en `name`, `objectid`) | Implícito. |
| Avoid `MATCH (n)` sin label | Full DB scan. |
| Use `EXPLAIN`/`PROFILE` para debug | Neo4j tools. |
^ad-cypher-perf

***
