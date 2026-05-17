---
aliases:
  - BloodHound DCSync
  - GetChanges Edge
  - GetChangesAll Edge
tags:
  - type/technique
  - vuln/ad-enumeration
  - technique/credential-access
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: SubCheatSheet
linked:
  - '[[AD - DCSync Rights Discovery]]'
  - '[[BloodHound & SharpHound]]'
---
# AD - DCSync Rights Discovery - BloodHound DCSync Edges

***

## DCSync-Related Edges

| **Edge** | **Significa** | **Cuándo** |
|:---:|:---:|:---:|
| `GetChanges` | `DS-Replication-Get-Changes` ACE | Standard. |
| `GetChangesAll` | `DS-Replication-Get-Changes-All` ACE | Standard. |
| `GetChangesInFilteredSet` | RODC scope | Edge. |
| `DCSync` (post-BHCE 4.x derived) | Synthetic edge cuando user tiene ambos GetChanges + GetChangesAll | Critical. |
^ad-dcsyncbh-edges

**BHCE 4.x+** crea edge sintético `DCSync` cuando un principal tiene ambos rights. Pre-4.x: query manual con dos MATCH.

___

## Shortest Path Queries

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH p=shortestPath((u {owned:true})-[*1..]->(d:Domain)) WHERE any(r IN relationships(p) WHERE type(r) IN ["GetChanges","GetChangesAll","DCSync"]) RETURN p` | Path owned → DCSync | Privesc. |
| `MATCH (u {owned:true})-[:DCSync]->(d:Domain) RETURN u.name,d.name` | Direct DCSync (BHCE 4.x+) | Quick. |
| `MATCH (u {owned:true})-[r1:GetChanges]->(d:Domain) MATCH (u)-[r2:GetChangesAll]->(d) RETURN u.name,d.name` | Combo manual | Pre-BHCE 4.x. |
^ad-dcsyncbh-paths

___

## Cross-Correlate Priv

| **Cypher** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `MATCH (u)-[:DCSync\|GetChanges\|GetChangesAll]->(d:Domain) WHERE u.adminCount = false RETURN u.name` | DCSync NO en Tier 0 (anomaly) | Audit. |
| `MATCH (u:User)-[:MemberOf*1..]->(g:Group)-[:GetChanges\|GetChangesAll\|DCSync]->(d:Domain) RETURN u.name,g.name,d.name` | Path user → group → DCSync | Recursive. |
| `MATCH (u)-[:DCSync]->(d:Domain) WHERE u.domain <> d.name RETURN u.name,u.domain,d.name` | Cross-domain DCSync | Cross-trust. |
^ad-dcsyncbh-correlate

___

## Pre-Built BHCE Queries

| **Query (Custom Queries panel)** | **Cypher** | **Cuándo** |
|:---:|:---:|:---:|
| "Find principals with DCSync rights" | `MATCH (u)-[r:GetChanges\|GetChangesAll\|DCSync]->(d:Domain) RETURN u.name,d.name,type(r)` | Standard. |
| "Find shortest paths to DCSync" | `MATCH p=shortestPath((u {owned:true})-[*1..]->(d:Domain)) WHERE any(r IN relationships(p) WHERE type(r) IN ["GetChanges","GetChangesAll","DCSync"]) RETURN p` | Privesc. |
| "Find non-default DCSync principals" | `MATCH (u)-[r:GetChanges\|GetChangesAll\|DCSync]->(d) WHERE NOT u.objectid ENDS WITH "-512" AND NOT u.objectid ENDS WITH "-519" AND NOT u.objectid ENDS WITH "-516" RETURN u.name` | Audit. |
^ad-dcsyncbh-prebuilt

___

## Collection Considerations

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `SharpHound.exe -c ACL,Container,Group,ObjectProps` | Captures DCSync ACEs (ACL collection) | Targeted. |
| `SharpHound.exe -c All` | Comprehensive | Standard. |
| `bloodhound-python -d corp.local -u u -p p -ns <DC> -c ACL,Default --zip` | Linux | Linux. |
| `SharpHound.exe -c DCOnly` | Solo DC-side data (DCSync ACEs incluidos) | Stealth — sin per-host queries. |
^ad-dcsyncbh-collection

**Stealth tip:** `DCOnly` collection captura DCSync ACEs sin queries per-host = mucho menos noisy en SIEM.

___

## Custom Cypher (Compliance)

```cypher
// 1. List all DCSync principals con metadata
MATCH (u)-[r:GetChanges|GetChangesAll|DCSync]->(d:Domain)
RETURN u.name,u.domain,u.adminCount,u.enabled,type(r),d.name

// 2. Stale DCSync principals (last logon >180d)
MATCH (u:User)-[r:GetChanges|GetChangesAll|DCSync]->(d:Domain)
WHERE u.lastlogon < timestamp() / 1000 - 15552000
RETURN u.name,u.lastlogon

// 3. Service accounts con DCSync
MATCH (u:User {hasspn:true})-[r:GetChanges|GetChangesAll|DCSync]->(d:Domain)
RETURN u.name,u.serviceprincipalnames,type(r)

// 4. Foreign principals con DCSync (cross-trust)
MATCH (u)-[r:GetChanges|GetChangesAll|DCSync]->(d:Domain)
WHERE u.domain <> d.name
RETURN u.name,u.domain,d.name,type(r)

// 5. Disabled accounts con DCSync (cleanup)
MATCH (u:User {enabled:false})-[r:GetChanges|GetChangesAll|DCSync]->(d:Domain)
RETURN u.name,type(r)

// 6. Recursive group members con DCSync (effective)
MATCH (u:User)-[:MemberOf*1..]->(g:Group)-[r:GetChanges|GetChangesAll|DCSync]->(d:Domain)
RETURN DISTINCT u.name,g.name
```
^ad-dcsyncbh-compliance

***
