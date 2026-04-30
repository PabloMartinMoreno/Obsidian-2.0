---
aliases:
  - BloodHound DCSync
  - GetChanges Edge
  - GetChangesAll Edge
  - DCSync Cypher
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
  - "[[AD - DCSync Rights Discovery]]"
  - "[[BloodHound & SharpHound]]"
---
# AD - DCSync Rights Discovery - BloodHound DCSync Edges

***

## DCSync-Related Edges

| **Edge** | **Significado** | **Notas** |
|:---:|:---:|:---:|
| `GetChanges` | DS-Replication-Get-Changes | Standard. |
| `GetChangesAll` | DS-Replication-Get-Changes-All | Standard. |
| `GetChangesInFilteredSet` | RODC scope | Edge. |
| Both required for DCSync | Combined | Standard. |
| Direct edge to Domain object | Per-domain | Standard. |
| BloodHound CE 5.x+ support | Modern | Tool. |
| Visual: edges in graph | Helpful | Tool. |
| Cypher query analysis | Standard | Tool. |
| Per-domain ingest | Multi-domain | Adjacent. |
| BHCE 6.x improved | Modern | Tool. |
| Custom analytics | Cypher | Tool. |
| Cross-correlate priv | Standard | Tool. |
| Path filtering | `WHERE NONE` | Standard. |
| Edge type filtering | `type(r) IN [...]` | Standard. |
| Detection: BloodHound collection events | Defender | Adjacent. |
| Modern: continuous BH | Defender | Standard. |
^ad-dcsyncbh-edges

### Edge inspection

```cypher
// All DCSync-edge holders
MATCH (n)-[r:GetChanges|GetChangesAll]->(d:Domain)
RETURN n.name, type(r), d.name

// Direct DCSync (both edges)
MATCH (u)-[:GetChanges]->(d:Domain)
MATCH (u)-[:GetChangesAll]->(d)
RETURN u.name, d.name
```

___

## Shortest Path Queries

| **Query** | **Use** | **Notas** |
|:---:|:---:|:---:|
| ShortestPath to DCSync | Standard | Tool. |
| AllShortestPaths to DCSync | All paths | Tool. |
| Filter ACL edges only | `WHERE type(r) IN [...]` | Standard. |
| Per-principal exposure | "Who can DCSync?" | Strategy. |
| Per-target inbound | "Who can compromise domain?" | Strategy. |
| Foreign principal paths | Cross-trust | Critical. |
| Cypher path length filter | `length(p) <= N` | Performance. |
| BHCE built-in DCSync queries | Pre-defined | Tool. |
| Custom Cypher | Advanced | Tool. |
| Per-domain analysis | Standard | Adjacent. |
| Cross-domain paths | Forest-wide | Adjacent. |
| Compliance baseline queries | Standard | Adjacent. |
| Modern BHCE 6.x queries | Updated | Tool. |
| Visualization | Useful | Standard. |
| Detection: query patterns | Defender | Adjacent. |
| Stealth: targeted Cypher | OPSEC | Standard. |
^ad-dcsyncbh-paths

### Shortest path queries

```cypher
// Shortest path from any owned to DCSync
MATCH (u {owned: true}), (d:Domain)
MATCH p=shortestPath((u)-[*1..]->(d))
WHERE EXISTS((u)-[:GetChanges|GetChangesAll]->(d)) OR
      ANY(node IN nodes(p) WHERE EXISTS((node)-[:GetChanges|GetChangesAll]->(d)))
RETURN p

// Path filtered to ACL edges only
MATCH p=shortestPath((u {owned: true})-[r:MemberOf|GenericAll|GenericWrite|WriteDacl|WriteOwner|GetChanges|GetChangesAll*1..]->(d:Domain))
RETURN p

// All paths length 1-5 to DCSync
MATCH p=(u {owned: true})-[*1..5]->(d:Domain)
WHERE ANY(rel IN relationships(p) WHERE type(rel) IN ["GetChanges","GetChangesAll"])
RETURN p LIMIT 50
```

___

## Cross-Correlate Priv

| **Pattern** | **Cypher** | **Notas** |
|:---:|:---:|:---:|
| Non-default DCSync principals | Filter by name | Standard. |
| Service accounts with DCSync | `WHERE n.spn` filter | Standard. |
| Foreign DCSync (cross-trust) | `WHERE u.domain <> d.name` | Critical. |
| Disabled accounts with DCSync | `WHERE n.enabled = false` | Stale. |
| Stale ACE (whenChanged) | Edge — custom property | Edge. |
| Tier 0 vs non-Tier 0 DCSync | `WHERE n.adminCount = false` | Audit. |
| Recursive group expansion | `*1..` | Standard. |
| Per-quarter compliance review | Standard | Compliance. |
| Custom analytics scripts | DIY Cypher | Tool. |
| BHCE custom queries import | Standard | Tool. |
| Cross-correlate with engagement scope | Per-engagement | OPSEC. |
| Modern BHCE 6.x analytics | Updated | Tool. |
| Defender: continuous monitoring | Modern | Standard. |
| Audit baseline | Standard | Compliance. |
| Detection: anomalous DCSync paths | Defender ML | Modern. |
| Cross-correlate with replication events | Defender | Adjacent. |
^ad-dcsyncbh-correlate

### Cross-correlated queries

```cypher
// Non-Tier 0 principals with DCSync (audit)
MATCH (u)-[:MemberOf*0..]->(g)-[:GetChanges|GetChangesAll]->(d:Domain)
WHERE u.adminCount = false AND u.enabled = true
RETURN u.name, g.name, d.name

// Service accounts (SPN-bound) with DCSync
MATCH (u:User {hasspn: true})
MATCH p=(u)-[:MemberOf|GetChanges|GetChangesAll*1..]->(d:Domain)
RETURN u.name, p

// Foreign principals with DCSync (cross-trust CRITICAL)
MATCH (u)-[:MemberOf*0..]->(g)-[:GetChanges|GetChangesAll]->(d:Domain)
WHERE u.domain <> d.name
RETURN u.name, u.domain, g.name, d.name

// Stale (disabled) accounts with DCSync
MATCH (u {enabled: false})
MATCH p=(u)-[:MemberOf|GetChanges|GetChangesAll*1..]->(d:Domain)
RETURN u.name, p
```

___

## Pre-Built BHCE Queries

| **Query** | **Function** | **Notas** |
|:---:|:---:|:---:|
| "Find DCSync principals" | Standard | Pre-built. |
| "Shortest path to DA" | Standard | Pre-built. |
| "AdminSDHolder analysis" | Standard | Pre-built. |
| "Find non-default DCSync holders" | Custom | Standard. |
| "Foreign principals with priv" | Custom | Adjacent. |
| BHCE 6.x improved analytics | Updated | Tool. |
| Per-domain canned queries | Standard | Tool. |
| Forest-wide queries | Multi-domain | Adjacent. |
| Custom Cypher import | Standard | Tool. |
| `BloodHoundQueries` repo | Community | Adjacent. |
| Compass Security queries | Reference | Standard. |
| Compliance baseline queries | Standard | Compliance. |
| Audit log: BHCE query usage | Defender | Adjacent. |
| Modern: continuous Cypher | Defender | Standard. |
| Documentation: documented queries | Standard | Adjacent. |
| Cross-correlate with priv tier | Standard | Audit. |
^ad-dcsyncbh-prebuilt

### Pre-built BHCE queries

```
BloodHound CE 6.x → Analysis tab → Pre-built queries

Useful for DCSync:
1. "Find DCSync principals" (BHCE)
2. "Shortest paths to Domain Admins"
3. "Find Tier 0 escalation paths"
4. Custom: "Non-default DCSync principals"
5. Custom: "Foreign DCSync via cross-trust"
```

___

## BloodHound Collection Considerations

| **Aspect** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| SharpHound `-c All` includes ACL | Standard | Standard. |
| RustHound supports DCSync edges | Modern | Tool. |
| BloodHound.py Linux | `-c All` | Linux. |
| Per-domain ingest | Multi-domain | Adjacent. |
| Stealth collection: `-c DCOnly` | DC-side only | OPSEC. |
| Detection: SharpHound execution | Defender | Adjacent. |
| Modern obfuscated SharpHound | EDR evasion | Adjacent. |
| AzureHound (cloud) | Hybrid | Adjacent. |
| Time-of-day pacing | Stealth | OPSEC. |
| OPSEC: targeted vs bulk | Trade-off | OPSEC. |
| Network: SMB + LDAP traffic | Standard | Adjacent. |
| Defender: BloodHound signatures | EDR | Defender. |
| Modern: stealth collectors | EDR evasion | Standard. |
| Compliance: red team scoped | Standard | OPSEC. |
| Cross-domain collection per-DC | Multi-domain | Standard. |
| Modern BHCE 6.x continuous | Standard | Tool. |
^ad-dcsyncbh-collection

### Collection commands

```bash
# Linux full collection (incl. ACL/DCSync)
bloodhound-python -d dom.local -u user -p pass -ns DC -c All --zip

# RustHound (faster + cross-platform)
rusthound -d dom.local -u user -p pass --zip

# SharpHound default (Windows)
.\SharpHound.exe -c Default

# Stealth: DCOnly (less network noise)
.\SharpHound.exe -c DCOnly,Trusts,LocalGroup
```

___

## Custom Cypher for Compliance

| **Use Case** | **Query** | **Notas** |
|:---:|:---:|:---:|
| Documented baseline check | Custom | Compliance. |
| Per-quarter audit | Custom | Standard. |
| Anomaly detection | Custom | Defender. |
| Stale ACE detection (whenChanged) | Edge property | Edge. |
| New DCSync ACE alert | Defender | Modern. |
| Cross-trust monitoring | Custom | Critical. |
| Per-tier compliance | Custom | Tier model. |
| Forest-wide DCSync map | Custom | Adjacent. |
| Compliance reports | Custom | Adjacent. |
| BHCE 6.x continuous | Modern | Tool. |
| GitHub `BloodHoundQueries` | Community | Adjacent. |
| Compass Security queries | Reference | Standard. |
| Custom edge metadata | Edge | Edge. |
| Detection: query usage logs | Defender | Adjacent. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Modern: extreme automation | Defender | Standard. |
^ad-dcsyncbh-compliance

### Compliance audit query

```cypher
// Comprehensive DCSync audit (one-shot)
MATCH (u)-[:GetChanges|GetChangesAll]->(d:Domain)
OPTIONAL MATCH (u)-[:MemberOf*1..]->(parent:Group)
RETURN u.name AS DirectHolder,
       collect(DISTINCT parent.name) AS InheritedFromGroups,
       u.adminCount AS AdminCount,
       u.enabled AS Enabled,
       u.domain AS Domain,
       d.name AS TargetDomain
ORDER BY u.adminCount DESC

// Foreign DCSync (cross-trust audit)
MATCH (u)-[:MemberOf*0..]->(g)-[:GetChanges|GetChangesAll]->(d:Domain)
WHERE u.domain <> d.name
WITH u, g, d
RETURN DISTINCT u.name, u.domain, g.name, d.name
```

***
