---
aliases:
  - BloodHound Edges
  - Edge Reference
  - BloodHound Analytics
  - BHCE Edge Types
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
# BloodHound & SharpHound - Edges & Analytics

***

## ACL Edges

| **Edge** | **Significado** | **Abuse** |
|:---:|:---:|:---:|
| `GenericAll` | Full control | Reset pwd, add member, etc. |
| `GenericWrite` | Modify non-protected attrs | SPN inject, KeyCred, etc. |
| `WriteDacl` | Modify ACL | Self-grant GenericAll. |
| `WriteOwner` | Take ownership | 2-step privesc. |
| `Owns` | Implicit ownership | Same as WriteDacl effective. |
| `ForceChangePassword` | Reset pwd | Direct impersonation. |
| `AddSelf` | Self-add to group | Direct privesc. |
| `AddMember` | Add to group | Same. |
| `WriteSpn` | Modify servicePrincipalName | Targeted Kerberoast. |
| `WritePKINameFlag` | Modify cert template name flag | ESC4. |
| `WritePKIEnrollmentFlag` | Modify enrollment flag | ESC4. |
| `WriteAccountRestrictions` | Modify UAC | UAC manipulation. |
| `AllExtendedRights` | All ext rights | Includes DCSync, Reset, etc. |
| `ReadLAPSPassword` | LAPS read | Local admin. |
| `ReadGMSAPassword` | gMSA read | Service identity. |
| `AddKeyCredentialLink` | Shadow Cred | Stealth impersonation. |
| Cypher filter: `[:GenericAll\|...]` | Multi-edge | Standard. |
| Modern BHCE 5.x+ comprehensive | Standard | Tool. |
^ad-edges-acl

___

## DCSync Edges

| **Edge** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| `GetChanges` | Required for DCSync | Standard. |
| `GetChangesAll` | Required for DCSync | Standard. |
| `GetChangesInFilteredSet` | RODC scope | Edge. |
| Combined = full DCSync capability | Standard | Critical. |
| Direct edge to Domain object | Per-domain | Standard. |
| Cypher filter: `[:GetChanges\|GetChangesAll]` | Standard | Standard. |
| Cross-correlate priv | Standard | Audit. |
| Recursive group expansion | `*1..` | Standard. |
| Modern BHCE 6.x improved | Standard | Tool. |
| Adjacent: DCSync hub | Cross-ref | Adjacent. |
| Adjacent: DCSync Rights Discovery hub | Cross-ref | Adjacent. |
| Detection: DRSUAPI events | Defender | Adjacent. |
| Modern: continuous BHCE | Defender side | Adjacent. |
| Compliance: documented baseline | Standard | Adjacent. |
| Cross-correlate with priv tier | Standard | Audit. |
| Audit log retention | Standard | Adjacent. |
^ad-edges-dcsync

___

## Lateral Movement Edges

| **Edge** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| `AdminTo` | Local admin on host | Lateral. |
| `CanRDP` | RDP access | Lateral. |
| `CanPSRemote` | WinRM access | Lateral. |
| `ExecuteDCOM` | DCOM activation | Lateral. |
| `HasSession` | Active logon session | Lateral (TGT capture). |
| `LoggedOn` | Logged on user | Adjacent. |
| Cypher: `[:AdminTo\|CanRDP\|CanPSRemote\|ExecuteDCOM]` | Lateral filter | Standard. |
| BHCE 5.x+ session edges | Modern | Tool. |
| Per-host enumeration | Standard | Standard. |
| Cross-correlate with priv | Standard | Audit. |
| Adjacent: Lateral Movement hub | Cross-ref | Adjacent. |
| Detection: lateral movement events | Defender | Adjacent. |
| Modern: continuous BHCE | Defender side | Adjacent. |
| Per-domain queries | Standard | Adjacent. |
| Custom analytics | Tool. |
| OPSEC: lateral path planning | Standard | OPSEC. |
^ad-edges-lateral

___

## Delegation Edges

| **Edge** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Computer node `unconstraineddelegation: true` | UD flag | Standard. |
| `AllowedToDelegate` | CD configured | Standard. |
| `AllowedToAct` | RBCD configured | Standard. |
| `AddAllowedToAct` | Atacante can configure RBCD | Modern. |
| `AddKeyCredentialLink` | Shadow Cred capability | Modern. |
| `WriteSPN` | Targeted Kerberoast | Modern. |
| Cypher: filter delegation | `[:AllowedToDelegate\|AllowedToAct\|AddAllowedToAct]` | Standard. |
| BHCE 5.x+ delegation support | Modern | Tool. |
| Per-domain queries | Standard | Adjacent. |
| Cross-domain delegation | Edge | Adjacent. |
| Adjacent: Delegation Enumeration hub | Cross-ref | Adjacent. |
| Detection: delegation events | Defender | Adjacent. |
| Modern: continuous BHCE | Defender side | Adjacent. |
| Cross-correlate priv tier | Standard | Audit. |
| Custom analytics | Tool. |
| Compliance: documented baseline | Standard | Adjacent. |
^ad-edges-deleg

___

## ADCS Edges (BHCE 5.x+)

| **Edge** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| `Enroll` | Template enrollment right | Standard. |
| `AutoEnroll` | Auto-enrollment | Adjacent. |
| `EnrollOnTemplate` | Direct enroll edge | Modern. |
| `EnrollOnNTAuthCertStore` | NTAuth modify | Adjacent. |
| `Owns` on Template/CA | Implicit modify | Standard. |
| `WritePKINameFlag` | ESC4 modify | Modern. |
| `WritePKIEnrollmentFlag` | ESC4 modify | Modern. |
| `ManageCA` | ESC7 right | Modern. |
| `ManageCertificates` | ESC7 right | Modern. |
| Cert Template properties | Multiple flags | Standard. |
| `enrolleesuppliessubject` property | ESC1 indicator | Standard. |
| `requiresmanagerapproval` property | ESC1 indicator | Standard. |
| `authenticationenabled` property | ESC1 indicator | Standard. |
| `authorizedsignatures` property | ESC1 indicator | Standard. |
| BHCE 6.x improved ADCS | Modern | Tool. |
| Adjacent: ADCS Enumeration hub | Cross-ref | Adjacent. |
| Adjacent: ADCS Abuse hub | Cross-ref | Adjacent. |
^ad-edges-adcs

___

## Trust Edges

| **Edge** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| `Trusts` | Domain → Domain | Standard. |
| Edge property: `direction` (Inbound/Outbound/Bidirectional) | Standard | Standard. |
| Edge property: `istransitive` | Bool | Standard. |
| Edge property: `trusttype` | (External/Forest/ParentChild/etc.) | Standard. |
| `TrustedBy` (inverse) | Edge | Standard. |
| Cypher: cross-domain queries | Custom | Tool. |
| BHCE 6.x improved trusts | Modern | Tool. |
| Per-domain ingest required | Standard | Adjacent. |
| Cross-correlate trust attributes | Standard | Audit. |
| Adjacent: Trust hub | Cross-ref | Adjacent. |
| Detection: trust modify events | Defender | Adjacent. |
| Modern: continuous BHCE | Defender side | Adjacent. |
| Foreign principal cross-trust | Critical | Audit. |
| Custom analytics | Tool. |
| Compliance: documented per-trust | Standard | Adjacent. |
| Audit log retention | Standard | Adjacent. |
^ad-edges-trust

___

## GPO Edges

| **Edge** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| `GpLink` | OU → GPO link | Standard. |
| Edge property: `enforced` | Bool | Standard. |
| Edge property: `enabled` | Bool | Standard. |
| Modify GPO + GpLink to highvalue OU = mass compromise | Standard chain | Critical. |
| ACL on GPO via GenericAll/etc | ACL combo | Standard. |
| BHCE 5.x+ GPO support | Standard | Tool. |
| Per-domain queries | Standard | Adjacent. |
| Cross-correlate with linked OUs | Standard | Audit. |
| Adjacent: GPO Enumeration hub | Cross-ref | Adjacent. |
| Adjacent: GPO Abuse hub | Cross-ref | Adjacent. |
| Detection: GPO modify events | Defender | Adjacent. |
| Modern: continuous BHCE | Defender side | Adjacent. |
| Cypher: paths via GPO | Custom | Tool. |
| Custom analytics | Tool. |
| Compliance: documented baseline | Standard | Adjacent. |
| BHCE 6.x improved GPO | Modern | Tool. |
^ad-edges-gpo

___

## Container Edges

| **Edge** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| `Contains` | Parent → Child | Standard. |
| OU → Computer / User / Group | Standard | Standard. |
| Domain → OU | Standard | Standard. |
| `MemberOf` | User/Group → Group | Standard. |
| `MemberOf*1..` | Recursive | Standard. |
| `tokenGroups` (computed) | Adjacent | Adjacent. |
| Cypher: hierarchy queries | Custom | Tool. |
| Cross-correlate per-OU | Standard | Audit. |
| Per-domain ingest | Standard | Adjacent. |
| BHCE 6.x improved | Modern | Tool. |
| Adjacent: Hosts Enumeration hub | Cross-ref | Adjacent. |
| Adjacent: Groups Enumeration hub | Cross-ref | Adjacent. |
| Detection: bulk container queries | Defender | Adjacent. |
| Custom analytics | Tool. |
| Compliance: documented baseline | Standard | Adjacent. |
| OPSEC: targeted queries | Standard | OPSEC. |
^ad-edges-container

___

## Edge Filter Cheatsheet

```cypher
// Filter by edge type
MATCH p=(a)-[r:GenericAll|GenericWrite|WriteDacl|WriteOwner]->(b) RETURN p

// Multiple edge types in path
MATCH p=(a)-[r:GenericAll|GenericWrite|WriteDacl|WriteOwner|MemberOf|AddMember|ForceChangePassword*1..15]->(b) RETURN p

// Exclude edge types
MATCH p=(a)-[*1..]->(b)
WHERE NONE(rel IN relationships(p) WHERE type(rel) IN ["HasSession", "LoggedOn"])
RETURN p

// Specific edge property filter
MATCH (a)-[r:Trusts]->(b)
WHERE r.istransitive = true
RETURN a.name, b.name

// Filter by node properties
MATCH (u:User {adminCount: true, enabled: true})
MATCH p=(u)-[*1..]->(:Domain)
RETURN p

// Bidirectional path
MATCH p=(a)-[*1..]-(b) RETURN p

// Reverse path
MATCH p=(a)<-[*1..]-(b) RETURN p
```

___

## Common Analytics Patterns

| **Pattern** | **Use** | **Notas** |
|:---:|:---:|:---:|
| Shortest path to DA | Standard | Standard. |
| All shortest paths to DA | Comprehensive | Standard. |
| Most-exposed users | `WITH ... COUNT` | Strategy. |
| Stale priv users | Filter `lastlogon` | Audit. |
| Foreign principals | Domain comparison | Cross-trust. |
| Tier conflation | Cross-tier ACL paths | Critical. |
| Service account in priv | Filter SPN + adminCount | Common. |
| LAPS read paths to priv | Standard | Lateral. |
| gMSA password paths | Standard | Service compromise. |
| Delegation chains | UD/CD/RBCD | Privesc. |
| Shadow Cred capability | Standard | Modern. |
| ADCS ESC paths | ESC1-ESC15 | Standard. |
| GPO modify chains | GpLink + ACL | Critical. |
| Cross-domain priv paths | Forest-wide | Adjacent. |
| Compliance baseline diff | Pre/post | Standard. |
| Modern BHCE 6.x analytics | Improved | Tool. |
^ad-edges-patterns

___

## Custom Analytics Scripts

```cypher
// 1. Path length distribution to DA
MATCH (u:User {enabled: true}), (g:Group {name: "DOMAIN ADMINS@DOM.LOCAL"})
MATCH p=shortestPath((u)-[*1..15]->(g))
RETURN length(p) AS PathLength, COUNT(*) AS UserCount
ORDER BY PathLength

// 2. Top 20 most-exposed Tier 0 (most paths to them)
MATCH (target {highvalue: true})
MATCH (u)
WHERE EXISTS((u)-[*1..10]->(target))
WITH target, COUNT(DISTINCT u) AS exposure
RETURN target.name, exposure ORDER BY exposure DESC LIMIT 20

// 3. Service accounts (SPN-bound) with high privilege
MATCH (u:User {hasspn: true, enabled: true})
MATCH p=(u)-[:MemberOf*1..]->(g:Group {adminCount: true})
RETURN u.name, COLLECT(g.name) AS PrivGroups

// 4. Compromise impact: from owned, what can be reached?
MATCH (u {owned: true})
MATCH (target {highvalue: true})
WHERE EXISTS((u)-[*1..15]->(target))
RETURN u.name AS Owned, COLLECT(DISTINCT target.name) AS ReachableHighvalue

// 5. Stale Tier 0 users
MATCH (u:User {adminCount: true, enabled: true})
WHERE u.lastlogon < (timestamp() - 15552000000)  // 180 days
RETURN u.name, datetime({epochmillis: u.lastlogon * 1000}) AS LastLogon
ORDER BY u.lastlogon
```

___

## BHCE 6.x Performance Improvements

| **Feature** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Modern Cypher engine | Faster queries | Performance. |
| Improved indexing | Standard | Performance. |
| Per-query cost analysis | Adjacent | Edge. |
| Modern Web UI | UX | Standard. |
| OpenGraph custom data | Modern | Tool. |
| ADCS native support | Modern | Tool. |
| LAPSv2 native edges | Modern | Tool. |
| gMSA native edges | Modern | Tool. |
| Cross-domain auto-correlation | Modern | Tool. |
| Continuous BHCE deployment | Defender side | Modern. |
| Real-time data ingest | Modern | Tool. |
| API improvements | Modern | Tool. |
| Compliance: BHCE 6.x baseline | Standard | Adjacent. |
| Detection: BHCE 6.x events | Defender | Adjacent. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Modern: extreme alerting | Critical | Standard. |
^ad-edges-bhce6

___

## Wordlists & Recursos

| **Recurso** | **URL / Path** | **Notas** |
|:---:|:---:|:---:|
| BloodHound CE Cypher reference | `bloodhound.specterops.io` | Tool docs. |
| Specter Ops blog | `posts.specterops.io` | Research. |
| Compass Security queries | `github.com/CompassSecurity/BloodHoundQueries` | Custom. |
| Cypher official docs | `neo4j.com/docs/cypher-manual` | Foundation. |
| BHCE 6.x changelog | Per-release | Tool. |
| Will Schroeder research | Specter Ops | Adversary. |
| Adjacent: AzureHound docs | Cloud | Modern. |
| `awesome-active-directory` | GitHub | Foundation. |
| HackTricks BloodHound | `book.hacktricks.xyz` | Reference. |
| The Hacker Recipes | `thehacker.recipes` | Reference. |
| Modern: continuous BHCE | Defender side | Standard. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Compliance: red team standard | Standard | Industry. |
| Custom analytics scripts | Tool | Standard. |
| Audit baseline | Standard | Compliance. |
| Modern: extreme defender alerting | Critical | Standard. |
^ad-edges-resources

***
