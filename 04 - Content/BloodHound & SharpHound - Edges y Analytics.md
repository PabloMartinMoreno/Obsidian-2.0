---
aliases:
  - BloodHound Edges
  - Edge Reference
  - BloodHound Analytics
tags:
  - type/concept
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: Concept
linked:
  - '[[BloodHound & SharpHound]]'
---
# BloodHound & SharpHound - Edges & Analytics

***

## ACL Edges

| **Edge** | **Significa** | **Abuse típico** |
|:---:|:---:|:---:|
| `GenericAll` | Full control object | Reset pwd / add member / set KeyCred. |
| `GenericWrite` | Modify any attribute | Set SPN (Targeted Kerberoast), KeyCred (Shadow Cred), RBCD. |
| `WriteDacl` | Modify DACL | Grant self GenericAll. |
| `WriteOwner` | Take ownership | Owner = implicit Modify Permissions. |
| `ForceChangePassword` | Reset pwd sin saber actual | Direct privesc. |
| `AddMember` | Add member to group | Standard. |
| `AddSelf` | Self-add to group | AddMember variant. |
| `AllExtendedRights` | Includes ForceChangePassword + DCSync + LAPS read | Critical wide right. |
| `ReadLAPSPassword` | LAPS read access | Local admin pwd. |
| `ReadGMSAPassword` | gMSA pwd read | Service hash. |
^ad-edges-acl

___

## DCSync Edges

| **Edge** | **Significa** | **Cuándo** |
|:---:|:---:|:---:|
| `GetChanges` | DS-Replication-Get-Changes ACE | Standard. |
| `GetChangesAll` | DS-Replication-Get-Changes-All ACE | Full DCSync (incluye creds). |
| `DCSync` (synthetic, BHCE 4.x+) | Combo `GetChanges` + `GetChangesAll` | Direct edge. |
| `GetChangesInFilteredSet` | RODC scope | Edge. |
^ad-edges-dcsync

___

## Lateral Movement Edges

| **Edge** | **Significa** | **Abuse** |
|:---:|:---:|:---:|
| `AdminTo` | Local admin en host | RCE direct. |
| `CanRDP` | RDP access | Remote desktop. |
| `CanPSRemote` | WinRM access (5985/5986) | PowerShell remoting. |
| `HasSession` | User logged in en host | TGT capture (UD chain). |
| `CanLogon` | Logon rights (no admin) | Limited access. |
| `ExecuteDCOM` | DCOM activation | Lateral via COM. |
| `SQLAdmin` | SQL Server sysadmin | xp_cmdshell. |
^ad-edges-lateral

___

## Delegation Edges

| **Edge** | **Significa** | **Abuse** |
|:---:|:---:|:---:|
| `AllowedToDelegate` | Constrained Delegation (`msDS-AllowedToDelegateTo`) | S4U2Self/S4U2Proxy. |
| `AllowedToAct` | RBCD (`msDS-AllowedToActOnBehalfOfOtherIdentity`) | RBCD chain. |
| `AddKeyCredentialLink` | Shadow Credentials write capability | Add cert → PKINIT auth. |
| Computer node con `unconstraineddelegation:true` | UD flag | TGT capture chain. |
^ad-edges-deleg

___

## ADCS Edges

| **Edge** | **Significa** | **Cuándo** |
|:---:|:---:|:---:|
| `Enroll` | Enroll capability template | ESC1-ESC3 base. |
| `AutoEnroll` | Auto-enroll (no UI) | Edge. |
| `ManageCA` | Manage CA settings | ESC7. |
| `ManageCertificates` | Approve/deny cert requests | ESC7. |
| `WritePKIEnrollmentFlag` | Modify enrollment flag | ESC4 variant. |
| `WritePKINameFlag` | Modify name flag | ESC4 variant. |
| Template nodes con `enrolleeSuppliesSubject:true` | ESC1 marker | Standard. |
| Template con `hasAuthenticationEKU:true` | Auth-capable | Pre-attack filter. |
^ad-edges-adcs

___

## Trust Edges

| **Edge** | **Significa** | **Cuándo** |
|:---:|:---:|:---:|
| `Trusts` | Domain trust relationship | Standard. |
| `Trusts` con property `direction` | Inbound/Outbound/BiDirectional | Filter dir. |
| `Trusts` con `istransitive` | Transitive flag | Cascading. |
| Cross-trust ACL edges (cross-domain) | Foreign principals | Audit. |
^ad-edges-trust

___

## GPO Edges

| **Edge** | **Significa** | **Cuándo** |
|:---:|:---:|:---:|
| `GpLink` | GPO → OU link | Standard. |
| `Contains` | OU → User/Computer/OU | Hierarchy. |
| Modify GPO (vía ACL edges) | Privesc surface mass-compromise | Standard. |
^ad-edges-gpo

___

## Container Edges

| **Edge** | **Significa** | **Cuándo** |
|:---:|:---:|:---:|
| `Contains` | OU/Container hierarchy | Tree navigation. |
| `MemberOf` (recursive `*1..`) | Group membership transitive | Effective members. |
| `Owns` | Object ownership | Implicit modify. |
^ad-edges-container

___

## Common Analytics Patterns

```cypher
// 1. Top 10 owned users con más exposure (paths a high-value)
MATCH (u {owned:true})-[*1..6]->(t {highvalue:true})
WITH u, COUNT(DISTINCT t) AS exposure
RETURN u.name,exposure ORDER BY exposure DESC LIMIT 10

// 2. Detect "shadow admins" (usuarios con priv via ACL chain pero NOT en priv group)
MATCH (u:User {enabled:true})
WHERE NOT u.adminCount = true
MATCH p=shortestPath((u)-[:GenericAll|GenericWrite|WriteDacl|WriteOwner|ForceChangePassword|AddMember|AllExtendedRights*1..]->(g:Group {name:"DOMAIN ADMINS@CORP.LOCAL"}))
RETURN u.name,length(p) AS hops ORDER BY hops

// 3. Stale priv users con paths
MATCH (u:User {enabled:true, adminCount:true})
WHERE u.lastlogon < timestamp() / 1000 - 15552000
RETURN u.name,u.lastlogon

// 4. Service accounts en Tier 0
MATCH (u:User {hasspn:true})-[:MemberOf*1..]->(g:Group {highvalue:true})
RETURN u.name,u.serviceprincipalnames,g.name

// 5. Foreign cross-trust paths
MATCH (u {owned:true})-[*1..]->(t {highvalue:true})
WHERE u.domain <> t.domain
RETURN p LIMIT 20
```
^ad-edges-patterns

___

## BHCE 6.x Performance

| **Mejora** | **Detalle** | **Cuándo** |
|:---:|:---:|:---:|
| PostgreSQL backend | Reemplaza Neo4j embedded para metadata | Speed boost. |
| Cypher optimizer mejorado | Path queries más rápidos | Standard. |
| Memory tuning | Configurable via env vars | Large envs. |
| Forest-wide ingestion | Auto-correlate cross-domain | Multi-domain. |
| OpenGraph (hybrid) | Cross-correlation AD + Entra ID | Modern hybrid. |
| ADCS edges expandidos | ESC9-ESC15 native | Modern. |
^ad-edges-bhce6

***
