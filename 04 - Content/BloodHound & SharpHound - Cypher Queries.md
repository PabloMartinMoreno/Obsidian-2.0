---
aliases:
  - Cypher Queries
  - BloodHound Cypher
  - Custom Queries
  - Cypher Cheatsheet
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

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `MATCH (n)` | Match all nodes | Standard. |
| `MATCH (n:User)` | Match users only | Filter type. |
| `MATCH (n:Computer)` | Computers | Filter. |
| `MATCH (n:Group)` | Groups | Filter. |
| `MATCH (n:Domain)` | Domains | Filter. |
| `MATCH (n:OU)` | OUs | Filter. |
| `MATCH (n:GPO)` | GPOs | Filter. |
| `MATCH (n:CertTemplate)` | Cert templates | ADCS. |
| `MATCH (n:CA)` | Cert authorities | ADCS. |
| `WHERE n.property = "value"` | Filter property | Standard. |
| `WHERE n.adminCount = true` | Privileged | Common. |
| `WHERE n.owned = true` | Compromised | Common. |
| `WHERE n.highvalue = true` | Tier 0 | Common. |
| `RETURN n` | Output | Standard. |
| `RETURN n.name` | Specific property | Standard. |
| `LIMIT N` | Limit results | Performance. |
| `ORDER BY n.property` | Sort | Standard. |
^ad-cypher-basics

### Basic queries

```cypher
// All users
MATCH (u:User) RETURN u.name LIMIT 100

// All Domain Admins
MATCH (u:User)-[:MemberOf*1..]->(g:Group {name: "DOMAIN ADMINS@DOM.LOCAL"})
RETURN u.name

// All highvalue principals
MATCH (n) WHERE n.highvalue = true
RETURN n.name, labels(n)
```

___

## Path Queries

| **Cypher** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `MATCH p=(a)-[r]->(b)` | Single hop | Standard. |
| `MATCH p=(a)-[*1..N]->(b)` | Multi-hop variable | Standard. |
| `shortestPath((a)-[*1..]->(b))` | Shortest | Standard. |
| `allShortestPaths((a)-[*1..]->(b))` | All shortest | Standard. |
| `RETURN p` | Return path | Standard. |
| `WHERE length(p) <= 5` | Limit length | Performance. |
| `WHERE NONE(rel IN r WHERE type(rel) = "X")` | Exclude edge type | Filter. |
| `WHERE ANY(rel IN relationships(p) WHERE type(rel) IN [...])` | Include edge types | Filter. |
| `WITH ... MATCH p=...` | Multi-step | Advanced. |
| `UNWIND` for arrays | Adjacent | Edge. |
| Path direction: `<-[]-` reverse | Standard | Standard. |
| Path bidirectional: `-[]-` | Standard | Edge. |
| Modern BHCE 6.x performance | Improved | Tool. |
| Per-domain ingest required | Standard | Adjacent. |
| Cross-domain paths | Forest-wide | Adjacent. |
| Custom analytics | Tool | Standard. |
^ad-cypher-paths

### Path queries

```cypher
// Shortest path from owned to DA
MATCH (u {owned: true}), (g:Group {name: "DOMAIN ADMINS@DOM.LOCAL"})
MATCH p=shortestPath((u)-[*1..]->(g))
RETURN p

// All shortest paths
MATCH (u {owned: true}), (g:Group {name: "DOMAIN ADMINS@DOM.LOCAL"})
MATCH p=allShortestPaths((u)-[*1..15]->(g))
RETURN p LIMIT 10

// Filter to ACL edges only
MATCH p=shortestPath(
  (u {owned: true})
  -[:GenericAll|GenericWrite|WriteDacl|WriteOwner|MemberOf|AddMember|ForceChangePassword*1..15]->
  (g:Group {name: "DOMAIN ADMINS@DOM.LOCAL"})
)
RETURN p
```

___

## Common Edge Filters

| **Edge Filter** | **Use** | **Notas** |
|:---:|:---:|:---:|
| `[:MemberOf*1..]` | Group nesting | Standard. |
| `[:GenericAll]` | Direct full control | Standard. |
| `[:GenericWrite]` | Modify | Standard. |
| `[:WriteDacl]` | Modify ACL | Standard. |
| `[:WriteOwner]` | Take ownership | Standard. |
| `[:ForceChangePassword]` | Reset pwd | Standard. |
| `[:AddMember]` | Add to group | Standard. |
| `[:AddSelf]` | Self-add | Adjacent. |
| `[:GetChanges]` + `[:GetChangesAll]` | DCSync | Standard. |
| `[:HasSession]` | Active session | Lateral. |
| `[:CanRDP]` | RDP access | Lateral. |
| `[:CanPSRemote]` | WinRM | Lateral. |
| `[:ExecuteDCOM]` | DCOM lateral | Lateral. |
| `[:AdminTo]` | Local admin | Lateral. |
| `[:Owns]` | Implicit ownership | Standard. |
| `[:AllExtendedRights]` | All ext rights | Standard. |
| `[:AllowedToDelegate]` | CD | Standard. |
| `[:AllowedToAct]` + `[:AddAllowedToAct]` | RBCD | Standard. |
| `[:AddKeyCredentialLink]` | Shadow Cred | Standard. |
| `[:Enroll]` + `[:AutoEnroll]` | ADCS | Standard. |
| `[:ManageCA]` + `[:ManageCertificates]` | ADCS ESC7 | Standard. |
| `[:WritePKINameFlag]` + `[:WritePKIEnrollmentFlag]` | ADCS ESC4 | Standard. |
| `[:GpLink]` | GPO link | Standard. |
| `[:Contains]` | OU contents | Standard. |
| `[:Trusts]` | Domain trust | Adjacent. |
^ad-cypher-edges

___

## Privesc Path Queries

| **Cypher** | **Use** | **Notas** |
|:---:|:---:|:---:|
| Shortest path to DA | Standard | Standard. |
| Shortest path to EA | Forest-level | Standard. |
| Shortest path to Schema Admins | Forest-level | Standard. |
| Filter ACL-only paths | Reduce noise | Standard. |
| Cross-domain paths | Forest-wide | Adjacent. |
| Foreign principal paths | Cross-trust | Critical. |
| Path with specific length | Performance | Adjacent. |
| Per-tier paths | Tiered model | Strategy. |
| Stale principal exclude | Filter `enabled: true` | Adjacent. |
| Modern: BHCE 6.x improved | Standard | Tool. |
| Custom analytics | Tool. |
| Compliance baseline | Standard | Adjacent. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Detection: query patterns | Defender | Adjacent. |
| OPSEC: targeted vs bulk | Trade-off | OPSEC. |
| Audit log retention | Standard | Adjacent. |
^ad-cypher-privesc

### Privesc paths

```cypher
// 1. All paths from any owned to DA
MATCH (u {owned: true}), (g:Group {name: "DOMAIN ADMINS@DOM.LOCAL"})
MATCH p=shortestPath((u)-[*1..]->(g))
RETURN p

// 2. Filter ACL edges only (reduce HasSession noise)
MATCH p=shortestPath(
  (u {owned: true})
  -[:GenericAll|GenericWrite|WriteDacl|WriteOwner|MemberOf|AddMember|AddSelf|ForceChangePassword|AllExtendedRights|GenericRead*1..15]->
  (g:Group {name: "DOMAIN ADMINS@DOM.LOCAL"})
)
RETURN p

// 3. Cross-domain paths
MATCH (u:User {owned: true}), (g:Group {name: "DOMAIN ADMINS@OTHERDOM.LOCAL"})
MATCH p=shortestPath((u)-[*1..]->(g))
RETURN p

// 4. Path lengths overview (which users have shortest paths to DA)
MATCH (u:User {enabled: true}), (g:Group {name: "DOMAIN ADMINS@DOM.LOCAL"})
MATCH p=shortestPath((u)-[*1..15]->(g))
RETURN u.name, length(p)
ORDER BY length(p)
LIMIT 20
```

___

## Lateral Movement Queries

| **Cypher** | **Use** | **Notas** |
|:---:|:---:|:---:|
| `MATCH (u {owned: true})-[:CanRDP]->(c:Computer)` | RDP access | Standard. |
| `MATCH (u {owned: true})-[:CanPSRemote]->(c:Computer)` | WinRM | Standard. |
| `MATCH (u {owned: true})-[:AdminTo]->(c:Computer)` | Local admin | Standard. |
| `MATCH (u {owned: true})-[:HasSession]->(c:Computer)` | Active session | Lateral. |
| `MATCH (u {owned: true})-[:ExecuteDCOM]->(c:Computer)` | DCOM | Lateral. |
| Combine: lateral chain | Multi-step | Standard. |
| Per-host enumeration | Standard | Standard. |
| Cross-correlate with priv | Standard | Audit. |
| BHCE 5.x+ improved sessions | Modern | Tool. |
| Per-domain lateral paths | Standard | Adjacent. |
| Adjacent: Lateral Movement hub | Cross-ref | Adjacent. |
| OPSEC: lateral path planning | Standard | OPSEC. |
| Modern: continuous BHCE | Defender side | Adjacent. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Custom analytics scripts | Tool. |
| Audit baseline | Standard | Compliance. |
^ad-cypher-lateral

### Lateral queries

```cypher
// Lateral path: owned → admin on host → next host
MATCH (u {owned: true})
MATCH (c1:Computer)
WHERE EXISTS((u)-[:AdminTo|CanRDP|CanPSRemote*1..]->(c1))
MATCH (c2:Computer)
WHERE EXISTS((c1)-[:HasSession]->(:User)-[:AdminTo|CanRDP|CanPSRemote*1..]->(c2))
RETURN u.name, c1.name, c2.name LIMIT 50

// Find computers where many privileged users have sessions
MATCH (c:Computer)-[:HasSession]->(u:User {adminCount: true})
WITH c, COUNT(u) AS privSessions
WHERE privSessions > 0
RETURN c.name, privSessions ORDER BY privSessions DESC
```

___

## Kerberoast / AS-REP Queries

| **Cypher** | **Use** | **Notas** |
|:---:|:---:|:---:|
| `MATCH (u:User {hasspn: true})` | Kerberoastable | Standard. |
| `MATCH (u:User {dontreqpreauth: true})` | AS-REP roastable | Standard. |
| Cross-correlate priv | Standard | Audit. |
| Filter enabled accounts | `WHERE u.enabled = true` | Standard. |
| Filter privileged | `WHERE u.adminCount = true` | Targeted. |
| Modern BHCE 6.x improved | Standard | Tool. |
| Per-domain queries | Standard | Adjacent. |
| Cross-domain Kerberoast | Edge | Adjacent. |
| BloodHound built-in queries | Pre-built | Tool. |
| Adjacent: Kerberoasting hub | Cross-ref | Adjacent. |
| Adjacent: AS-REP Roasting hub | Cross-ref | Adjacent. |
| Compliance: documented baseline | Standard | Adjacent. |
| Detection: bulk Kerberoast | Defender | Adjacent. |
| Custom analytics | Tool. |
| OPSEC: targeted vs bulk | Trade-off | OPSEC. |
| Audit log retention | Standard | Adjacent. |
^ad-cypher-kerberoast

### Kerberoast queries

```cypher
// All Kerberoastable users
MATCH (u:User {hasspn: true, enabled: true})
RETURN u.name, u.serviceprincipalnames

// Privileged Kerberoastable (CRITICAL)
MATCH (u:User {hasspn: true, adminCount: true, enabled: true})
RETURN u.name

// AS-REP roastable
MATCH (u:User {dontreqpreauth: true, enabled: true})
RETURN u.name

// AS-REP + privileged (CRITICAL)
MATCH (u:User {dontreqpreauth: true, adminCount: true})
RETURN u.name
```

___

## DCSync Queries

| **Cypher** | **Use** | **Notas** |
|:---:|:---:|:---:|
| `MATCH (u)-[:GetChanges|GetChangesAll]->(d:Domain)` | DCSync holders | Standard. |
| Filter non-default | Custom | Audit. |
| Recursive group expansion | `*1..` | Standard. |
| Cross-trust DCSync | Critical | Critical. |
| Owned → DCSync paths | Standard | Tool. |
| Modern BHCE 6.x | Standard | Tool. |
| Per-domain queries | Standard | Adjacent. |
| Cross-correlate with priv | Standard | Audit. |
| Detection: DCSync events | Defender | Adjacent. |
| OPSEC: bulk DCSync = loud | Defender | OPSEC. |
| Adjacent: DCSync hub | Cross-ref | Adjacent. |
| Adjacent: DCSync Rights Discovery hub | Cross-ref | Adjacent. |
| Compliance: documented baseline | Standard | Adjacent. |
| Modern: continuous BHCE | Defender side | Adjacent. |
| Custom analytics | Tool. |
| Audit log retention | Standard | Adjacent. |
^ad-cypher-dcsync

### DCSync queries

```cypher
// All DCSync holders
MATCH (u)-[:GetChanges|GetChangesAll]->(d:Domain)
RETURN u.name, type(r)

// Both edges (full DCSync)
MATCH (u)-[:GetChanges]->(d:Domain), (u)-[:GetChangesAll]->(d)
RETURN u.name

// Non-default DCSync (audit)
MATCH (u)-[:GetChanges|GetChangesAll]->(d:Domain)
WHERE NOT u.name IN [
  "DOMAIN ADMINS@DOM.LOCAL",
  "ENTERPRISE ADMINS@DOM.LOCAL",
  "ADMINISTRATORS@DOM.LOCAL",
  "DOMAIN CONTROLLERS@DOM.LOCAL"
]
RETURN u.name

// Owned → DCSync paths
MATCH (u {owned: true}), (d:Domain)
WHERE EXISTS((u)-[:MemberOf*0..]->(:Group)-[:GetChanges|GetChangesAll]->(d))
   OR EXISTS((u)-[:GetChanges|GetChangesAll]->(d))
RETURN u.name
```

___

## Delegation Queries

| **Cypher** | **Use** | **Notas** |
|:---:|:---:|:---:|
| `MATCH (c:Computer {unconstraineddelegation: true})` | UD computers | Standard. |
| Exclude DCs | `WHERE NOT c.distinguishedname CONTAINS "OU=Domain Controllers"` | Audit. |
| `MATCH (src)-[:AllowedToDelegate]->(target)` | CD | Standard. |
| `MATCH (src)-[:AllowedToAct\|AddAllowedToAct]->(target)` | RBCD | Standard. |
| `MATCH (src)-[:AddKeyCredentialLink]->(target)` | Shadow Cred | Modern. |
| Cross-correlate priv target | Standard | Audit. |
| Modern BHCE 5.x+ delegation | Standard | Tool. |
| Per-domain queries | Standard | Adjacent. |
| Cross-domain delegation | Edge | Adjacent. |
| Detection: delegation events | Defender | Adjacent. |
| Adjacent: Delegation Enumeration hub | Cross-ref | Adjacent. |
| Compliance: documented baseline | Standard | Adjacent. |
| Custom analytics | Tool. |
| OPSEC: targeted vs bulk | Trade-off | OPSEC. |
| Audit log retention | Standard | Adjacent. |
| Modern: continuous BHCE | Defender side | Adjacent. |
^ad-cypher-deleg

### Delegation queries

```cypher
// UD non-DC computers
MATCH (c:Computer {unconstraineddelegation: true})
WHERE NOT c.distinguishedname CONTAINS "OU=Domain Controllers"
RETURN c.name

// CD relationships
MATCH (src)-[:AllowedToDelegate]->(target)
RETURN src.name, target.name

// RBCD configured
MATCH (src)-[:AllowedToAct]->(target:Computer)
RETURN src.name, target.name

// Atacante can configure RBCD
MATCH (u {owned: true})-[:AddAllowedToAct|GenericAll|GenericWrite|MemberOf*1..]->(target:Computer)
WHERE target.adminCount = true OR target.highvalue = true
RETURN u.name, target.name

// Shadow Credentials capability
MATCH (src)-[:AddKeyCredentialLink]->(target:User {adminCount: true})
RETURN src.name, target.name
```

___

## ADCS Queries (BHCE 5.x+)

| **Cypher** | **Use** | **Notas** |
|:---:|:---:|:---:|
| `MATCH (t:CertTemplate)` | All cert templates | Standard. |
| `WHERE t.enabled = true` | Enabled only | Standard. |
| ESC1 conditions | Multiple flags | Standard. |
| ESC4 conditions | Modify ACL | Standard. |
| ESC7 conditions | Manage CA | Standard. |
| Cross-correlate priv | Standard | Audit. |
| Modern BHCE 5.x+ ADCS | Required | Tool. |
| Per-domain queries | Standard | Adjacent. |
| Adjacent: ADCS Enumeration hub | Cross-ref | Adjacent. |
| Compliance: documented baseline | Standard | Adjacent. |
| Detection: cert request events | Defender | Adjacent. |
| OPSEC: targeted vs bulk | Trade-off | OPSEC. |
| Modern: continuous BHCE | Defender side | Adjacent. |
| Custom analytics | Tool. |
| Audit log retention | Standard | Adjacent. |
| BHCE 6.x improved ADCS | Modern | Tool. |
^ad-cypher-adcs

### ADCS queries

```cypher
// ESC1: enrollee supplies subject + Client Auth + no manager approval + Auth Users enroll
MATCH (u)-[:Enroll|AutoEnroll|MemberOf*1..]->(t:CertTemplate)
WHERE t.enrolleesuppliessubject = true
  AND t.authenticationenabled = true
  AND t.requiresmanagerapproval = false
  AND t.authorizedsignatures = 0
  AND t.enabled = true
RETURN u.name, t.name

// ESC4: template ACL paths
MATCH (u {owned: true})-[:Owns|WriteOwner|WriteDacl|GenericAll|GenericWrite|WritePKINameFlag|WritePKIEnrollmentFlag*1..]->(t:CertTemplate)
RETURN u.name, t.name

// ESC7: Manage CA paths
MATCH (u {owned: true})-[:ManageCA|ManageCertificates|MemberOf*1..]->(c:CA)
RETURN u.name, c.name
```

___

## Custom Reporting Queries

| **Cypher** | **Use** | **Notas** |
|:---:|:---:|:---:|
| Top 10 most-exposed users | `WITH u, COUNT...` | Strategy. |
| Tier 0 user inventory | `WHERE u.adminCount = true` | Audit. |
| Stale users in priv groups | `WHERE u.lastlogon < ...` | Audit. |
| Foreign principals analysis | `WHERE u.domain <> g.domain` | Cross-trust. |
| Compliance baseline diff | Pre/post comparison | Standard. |
| Per-engagement report | Standard | Reporting. |
| Modern BHCE 6.x improved | Standard | Tool. |
| Custom analytics scripts | Tool. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Audit baseline | Standard | Compliance. |
| Detection: anomalous queries | Defender | Adjacent. |
| OPSEC: targeted reports | Stealth | OPSEC. |
| Modern: continuous BHCE | Defender side | Adjacent. |
| Compliance: documented Cypher | Standard | Adjacent. |
| Cross-engagement comparison | Standard | Audit. |
| Per-quarter Cypher review | Standard | Compliance. |
^ad-cypher-reporting

### Reporting queries

```cypher
// Top 10 most exposed users (most paths to them)
MATCH (target)
MATCH p=(u {owned: true})-[*1..15]->(target)
WITH target, COUNT(DISTINCT u) AS exposure
WHERE exposure > 0
RETURN target.name, labels(target), exposure
ORDER BY exposure DESC LIMIT 20

// Tier 0 user activity
MATCH (u:User {adminCount: true, enabled: true})
RETURN u.name, u.lastlogon, u.passwordlastset
ORDER BY u.lastlogon DESC

// Stale Tier 0 (>180 days)
MATCH (u:User {adminCount: true, enabled: true})
WHERE u.lastlogon < (timestamp() - 15552000000)
RETURN u.name, u.lastlogon

// Foreign principals in priv groups
MATCH (u)-[:MemberOf*1..]->(g:Group {adminCount: true})
WHERE u.domain <> g.domain
RETURN u.name, u.domain, g.name, g.domain
```

___

## Cypher Performance Tips

| **Tip** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Limit path length | `*1..15` not `*1..` | Performance. |
| Filter early | `WHERE` near `MATCH` | Performance. |
| Specific node types | `(u:User)` not `(u)` | Performance. |
| LIMIT results | `LIMIT 100` | Performance. |
| Use `EXISTS` for path check | More efficient | Standard. |
| Avoid `WITH` chains unless needed | Performance | Standard. |
| Index on common properties | DB-level | Adjacent. |
| Modern BHCE 6.x performance | Improved | Tool. |
| Per-query cost analysis | Adjacent | Edge. |
| Compliance: efficient queries | Standard | Adjacent. |
| Detection: heavy queries | Defender | Adjacent. |
| OPSEC: targeted queries | Stealth | OPSEC. |
| Modern: continuous BHCE | Defender side | Adjacent. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Audit baseline | Standard | Compliance. |
| Custom analytics scripts | Tool. |
^ad-cypher-perf

### Performance examples

```cypher
// SLOW: unbounded path
MATCH p=(u {owned: true})-[*1..]->(g:Group)
RETURN p

// FAST: bounded
MATCH p=(u {owned: true})-[*1..10]->(g:Group)
RETURN p LIMIT 50

// SLOW: filter at end
MATCH (u)-[:MemberOf*1..]->(g:Group)
WHERE u.adminCount = true
RETURN u.name

// FAST: filter early
MATCH (u:User {adminCount: true})-[:MemberOf*1..]->(g:Group)
RETURN u.name
```

***
