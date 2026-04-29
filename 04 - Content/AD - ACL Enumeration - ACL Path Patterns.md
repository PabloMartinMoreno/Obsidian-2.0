---
aliases:
  - ACL Chains
  - BloodHound Paths
  - Privesc Path Patterns
  - Cypher ACL Queries
tags:
  - type/cheatsheet
  - vuln/ad-enumeration
  - technique/privilege-escalation
  - asset/active-directory
primary categories: null
secondary categories: null
tertiary categories: null
type: CheatSheet
linked:
  - "[[AD - ACL Enumeration]]"
  - "[[BloodHound & SharpHound]]"
---
# AD - ACL Enumeration - ACL Path Patterns

***

## Direct Path: User → ACE → Privileged Target

| **Pattern** | **Steps** | **Notas** |
|:---:|:---:|:---:|
| User → GenericAll → DA member | Reset pwd → impersonate | Direct. |
| User → ForceChangePassword → DA member | Reset only | Stealthier. |
| User → AddMember → DA group | Add self | Standard. |
| User → AddSelf → DA group | Self-add | Standard. |
| User → WriteDACL → object → grant self GenericAll | 2-step | Standard. |
| User → WriteOwner → object → take owner → grant self GenericAll | 3-step | Stealthier. |
| User → WriteProperty Member → DA group | Add member | Standard. |
| User → WriteProperty SPN → user → Targeted Kerberoast | Standard | SPN injection. |
| User → WriteProperty KeyCredentialLink → user → Shadow Cred | Modern | Standard. |
| User → AllExtendedRights → user → Reset pwd | Catch-all | Standard. |
| User → GetChanges + GetChangesAll → domain | DCSync | Critical. |
| BloodHound `shortestPath` queries | Visual | Tool. |
| Cypher: 1-hop direct | Standard | Standard. |
| Cypher: multi-hop chain | Recursive | Standard. |
| Detection: chain-style privesc events | Defender | Adjacent. |
| Cleanup: per-step | Standard | OPSEC. |
^ad-aclpath-direct

### Direct path examples

```cypher
// 1-hop: User has GenericAll on DA member
MATCH (u:User)-[:GenericAll]->(target:User)
WHERE target.adminCount = true
RETURN u.name, target.name

// 2-hop: User → group → DA
MATCH p=(u {owned: true})-[:MemberOf*1..2]->(g:Group {name: "DOMAIN ADMINS@DOM.LOCAL"})
RETURN p

// Multi-hop ACL chain
MATCH p=shortestPath((u {owned: true})-[:GenericAll|GenericWrite|WriteDacl|WriteOwner|AddMember|ForceChangePassword|MemberOf*1..]->(g:Group {name: "DOMAIN ADMINS@DOM.LOCAL"}))
RETURN p
```

___

## Group Membership Chains

| **Pattern** | **Steps** | **Notas** |
|:---:|:---:|:---:|
| User → MemberOf → DA | Already DA | Standard. |
| User → MemberOf → Helpdesk → AddMember → IT-Admins → MemberOf → DA | 4-step nested | Common. |
| User → MemberOf → Group → GenericAll → user → MemberOf → DA | Indirect | Common. |
| User → AddSelf → Helpdesk → MemberOf → DA | Self-add chain | Common. |
| User → WriteOwner → Helpdesk → AddMember self → DA | 3-step | Stealthier. |
| Recursive group expansion | Cypher | Standard. |
| Foreign principal in helpdesk → DA | Cross-trust | Critical. |
| Service account in DA | Direct | Standard. |
| Stale member in priv group | Audit | Standard. |
| Per-tier group nesting | Tiered model | Standard. |
| Cross-OU group references | Indirect | Standard. |
| BloodHound nested edges | Visual | Tool. |
| Cypher: recursive MemberOf | `*1..` | Standard. |
| Detection: bulk group adds | Defender | Adjacent. |
| Cleanup: remove from groups | Standard | OPSEC. |
| Stealth: minimal group adds | OPSEC | Standard. |
^ad-aclpath-groups

### Group chain queries

```cypher
// All paths to DA via group memberships
MATCH p=shortestPath((u:User {owned: true})-[:MemberOf|AddMember|AddSelf|GenericAll*1..]->(g:Group {name: "DOMAIN ADMINS@DOM.LOCAL"}))
RETURN p

// Groups containing privileged group recursively
MATCH (g:Group {name: "DOMAIN ADMINS@DOM.LOCAL"})
MATCH p=(g)<-[:MemberOf*1..]-(parent:Group)
RETURN p
```

___

## OU + GPO Chains

| **Pattern** | **Steps** | **Notas** |
|:---:|:---:|:---:|
| User → GenericAll → OU → containing privileged | Indirect | Standard. |
| User → WriteProperty gPLink → OU → modify GPO | GPO Abuse | Standard. |
| User → GenericAll → GPO → linked OUs | Mass compromise | Critical. |
| User → WriteDACL → OU → grant self privesc | 2-step | Standard. |
| User → CreateChild → OU → create user object | Edge | Edge. |
| User → DeleteChild → OU → remove user | Edge | Edge. |
| User → WriteProperty gpcFileSysPath → SYSVOL modification | Edge | Edge. |
| GPO Creator Owners → create new GPO → link to OU | Multi-step | Standard. |
| BloodHound `WriteGPLink` edge | Modern | Tool. |
| BloodHound `GenericAll` on GPO | Standard | Tool. |
| Detection: GPO modification events (5136) | Defender | Adjacent. |
| Adjacent: GPO Abuse hub | Cross-ref | Adjacent. |
| Modern: per-OU strict ACL | Hardening | Standard. |
| Cleanup: revert GPO changes | Standard | OPSEC. |
| Stealth: minimal GPO modification | OPSEC | Standard. |
| Per-OU permission audit | Standard | Compliance. |
^ad-aclpath-ougpo

### OU/GPO chain queries

```cypher
// User can modify GPO linked to high-value OU
MATCH (u:User {owned: true})-[:GenericAll|GenericWrite|WriteDacl]->(g:GPO)
MATCH (g)-[:GpLink]->(ou:OU)
MATCH (ou)-[:Contains*1..]->(c:Computer)
WHERE c.highvalue = true
RETURN u.name, g.name, ou.name, c.name
```

___

## Computer ACL → Lateral

| **Pattern** | **Steps** | **Notas** |
|:---:|:---:|:---:|
| User → GenericAll → Computer → RBCD or Shadow Cred | Lateral | Standard. |
| User → WriteProperty msDS-AllowedToActOnBehalfOfOtherIdentity → RBCD | RBCD attack | Standard. |
| User → AddKeyCredentialLink → Computer → cert auth | Shadow Cred | Modern. |
| User → ForceChangePassword → Computer → reset pwd → DC privesc | Edge | Edge. |
| User → GenericAll → DC → owner of host | Tier 0 | Critical. |
| User → ReadLAPSPassword → Computer → local admin | LAPS | Standard. |
| User → ReadGMSAPassword → gMSA → service identity | gMSA | Standard. |
| Computer → MemberOf → DA | Edge | Edge. |
| Server Operators on DC → service binPath swap | Standard | Privesc. |
| Backup Operators on DC → NTDS dump | Standard | Privesc. |
| BloodHound computer-related edges | Modern | Tool. |
| Adjacent: Delegation Abuse hub | Cross-ref | Adjacent. |
| Adjacent: ACL Abuse hub | Cross-ref | Adjacent. |
| Adjacent: LAPS Enumeration hub | Cross-ref | Adjacent. |
| Adjacent: gMSA Enumeration hub | Cross-ref | Adjacent. |
| Detection: bulk computer ACL changes | Defender | Adjacent. |
^ad-aclpath-computer

### Computer ACL chain queries

```cypher
// Computer-side ACL paths
MATCH (u:User {owned: true})-[:GenericAll|AddKeyCredentialLink|AllowedToAct]->(c:Computer)
WHERE c.highvalue = true
RETURN u.name, c.name

// LAPS read paths to high-value
MATCH p=(u {owned: true})-[:ReadLAPSPassword|MemberOf*1..]->(c:Computer)
WHERE c.highvalue = true
RETURN p
```

___

## DCSync Path

| **Pattern** | **Steps** | **Notas** |
|:---:|:---:|:---:|
| User → MemberOf → group → GetChanges + GetChangesAll → Domain | DCSync via group | Standard. |
| User → GetChanges + GetChangesAll → Domain (direct) | DCSync direct | Standard. |
| User → GenericAll → Domain root | DCSync (also other) | Critical. |
| User → WriteDACL → Domain root → grant DCSync rights | 2-step | Standard. |
| User → WriteOwner → Domain root → take owner → grant DCSync | 3-step | Stealthier. |
| User → WriteDACL → AdminSDHolder → propagate to Tier 0 | Indirect Tier 0 | Critical. |
| Exchange Trusted Subsystem (legacy pre-2019) → DCSync | Patched | Edge legacy. |
| Service account in priv group → DCSync inherited | Common misconfig | Audit. |
| BloodHound `GetChanges` + `GetChangesAll` edges | Standard | Tool. |
| Cypher: DCSync paths | Standard | Tool. |
| Detection: DCSync events (4662 with rep GUID) | Defender | Adjacent. |
| Adjacent: DCSync hub | Cross-ref | Adjacent. |
| Adjacent: DCSync Rights Discovery hub | Cross-ref | Adjacent. |
| Modern: minimal DCSync grants | Hardening | Standard. |
| Audit: non-default DCSync holders | Compliance | Standard. |
| Cleanup: revert ACL changes | Standard | OPSEC. |
^ad-aclpath-dcsync

### DCSync path query

```cypher
// All paths to DCSync
MATCH p=(u:User {owned: true})-[:MemberOf|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(d:Domain)
WHERE EXISTS((u)-[:GetChanges|GetChangesAll]->(d)) OR
      EXISTS((u)-[:MemberOf*1..]->()-[:GetChanges|GetChangesAll]->(d))
RETURN p
```

___

## ADCS ESC1-ESC15 Paths

| **ESC** | **Pattern** | **Notas** |
|:---:|:---:|:---:|
| ESC1 | Vulnerable cert template (SAN + Client Auth) | Standard. |
| ESC2 | Vulnerable cert template (Any Purpose) | Standard. |
| ESC3 | Enrollment Agent template | Standard. |
| ESC4 | Vulnerable template ACL | Standard. |
| ESC5 | Vulnerable PKI obj ACL (CA, AIA, etc.) | Standard. |
| ESC6 | EDITF_ATTRIBUTESUBJECTALTNAME2 | Critical. |
| ESC7 | Vulnerable CA ACL (Manage CA / Manage Certs) | Standard. |
| ESC8 | Web Enrollment NTLM Relay | Critical. |
| ESC9 | No Security Extension (UPN spoofing) | Modern. |
| ESC10 | Weak cert mappings | Modern. |
| ESC11 | LDAP signing relay (no IF_FLAG_NO_PROTECTION_POLICY) | Modern. |
| ESC12 | Smart card via TPM | Edge modern. |
| ESC13 | OID Group Link | Modern. |
| ESC14 | LDAP IF_FLAG_NO_REVOCATION_CHECK | Modern. |
| ESC15 | EKUwu (cert request manipulation) | Modern. |
| Adjacent: ADCS Enumeration hub | Cross-ref | Adjacent. |
^ad-aclpath-adcs

### ADCS ESC paths

```cypher
// ADCS ESC paths (BHCE 5.x+ supports)
MATCH p=(u:User {owned: true})-[:Enroll|Owns|GenericAll|GenericWrite|WriteDacl|ManageCA|ManageCertificates*1..]->(t:CertTemplate)
WHERE t.enabled = true AND t.vulnerableESC1 = true
RETURN p
```

___

## Common Anti-Patterns

| **Anti-Pattern** | **Risk** | **Notas** |
|:---:|:---:|:---:|
| Authenticated Users with GenericWrite on user | Critical | Audit. |
| Domain Users with WriteDACL anywhere | Critical | Audit. |
| Helpdesk with ForceChangePassword on Tier 0 | Cross-tier | Critical. |
| Service account with DCSync rights | Common misconfig | Audit. |
| Backup Operators with broad permissions | Tier conflation | Audit. |
| Per-host explicit ACE for non-tier user | Edge | Edge. |
| Stale ACL members from migrations | Audit | Standard. |
| Foreign principals with priv ACE | Cross-trust | Critical. |
| Modify Default Domain Policy GPO ACL | Tier 0 | Critical. |
| Modify Domain Controllers Policy GPO ACL | Tier 0 | Critical. |
| Modify AdminSDHolder ACL | Persistence | Critical. |
| BloodHound highvalue + ACL paths | Modern | Tool. |
| Detection: bulk ACL modify | Defender | Adjacent. |
| Cleanup: revert post-engagement | Standard | OPSEC. |
| Audit: minimal ACL modify rights | Best practice | Standard. |
| Compliance: documented baseline | Standard | Adjacent. |
^ad-aclpath-antipatterns

### Anti-pattern detection

```powershell
# Find Authenticated Users with dangerous rights
Get-DomainObjectAcl -SearchBase "DC=dom,DC=local" -ResolveGUIDs |
  Where {
    $_.IdentityReferenceName -match "Authenticated Users|Domain Users" -and
    $_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDACL|WriteOwner"
  } |
  Select ObjectDN,IdentityReferenceName,ActiveDirectoryRights
```

___

## Owns Edge (Implicit Ownership)

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Object owner | nTSecurityDescriptor.Owner | Standard. |
| Owner has implicit modify rights | Standard | Standard. |
| BloodHound `Owns` edge | Visual | Tool. |
| Common: Domain Admins owns most | Default | Standard. |
| Service account owns objects = audit | Common misconfig | Audit. |
| Atacante: take ownership via WriteOwner | Standard | Standard. |
| Owner can modify ACL implicitly | Standard | Standard. |
| `Owns` edge in BloodHound = grants implicit GenericAll-equivalent | Tool | Standard. |
| Audit: ownership of priv objects | Standard | Compliance. |
| Stale ownership (old admin) | Audit | Standard. |
| Per-OU ownership | Granular | Standard. |
| Cross-OU ownership | Edge | Edge. |
| Detection: ownership change events | Defender | Adjacent. |
| Modern: ownership by SYSTEM standard | Hardening | Standard. |
| Adjacent: WriteOwner ACE | Cross-ref | Standard. |
| Compliance: documented ownership baseline | Standard | Adjacent. |
^ad-aclpath-owns

### Ownership audit

```powershell
# Find objects owned by non-tier-0 principals
Get-ADObject -Filter * -Properties nTSecurityDescriptor |
  ForEach-Object {
    $owner = $_.nTSecurityDescriptor.Owner
    if ($owner -and $owner -notmatch "Domain Admins|Enterprise Admins|SYSTEM|BUILTIN|Administrators") {
      [PSCustomObject]@{
        Object = $_.DistinguishedName
        Owner = $owner
      }
    }
  }
```

___

## Cypher Workhorse Queries

| **Query** | **Purpose** | **Notas** |
|:---:|:---:|:---:|
| `shortestPath` to DA | Standard | Tool. |
| `allShortestPaths` to DA | All paths | Tool. |
| `MATCH p=...` filter dangerous | Custom | Tool. |
| Recursive `*1..` | Multi-hop | Standard. |
| Filter by owned, highvalue tags | Standard | Tool. |
| Cross-domain queries | Forest-wide | Adjacent. |
| BloodHound built-in queries | Pre-defined | Tool. |
| Custom Cypher in BHCE | Tool. |
| Per-domain ingest required | Standard | Adjacent. |
| Modern BHCE 6.x improved | Modern | Tool. |
| Adjacent: BloodHound hub | Cross-ref | Adjacent. |
| Edge filtering: type(r) IN [...] | Specific edges | Standard. |
| `WHERE NONE` to exclude | Path filter | Standard. |
| `LIMIT` for large queries | Performance | Standard. |
| Cypher cheatsheet | Reference | Standard. |
| Modern: GUI queries in BHCE | Standard | Tool. |
^ad-aclpath-cypher

### Workhorse queries

```cypher
// Shortest path to DA from any owned principal
MATCH (u {owned: true}), (g:Group {name: "DOMAIN ADMINS@DOM.LOCAL"})
MATCH p=shortestPath((u)-[*1..]->(g))
RETURN p

// All ACL paths to high-value (filtered to ACL edges)
MATCH (u {owned: true}), (target {highvalue: true})
MATCH p=shortestPath((u)-[r*1..15]->(target))
WHERE NONE(rel IN r WHERE type(rel) IN ["GetChanges","GetChangesAll","HasSession"])
RETURN p

// Pre-pwn analysis: find weakest privesc path
MATCH (target:Group {highvalue: true})
MATCH (u:User)
MATCH p=shortestPath((u)-[*1..]->(target))
RETURN u.name, length(p), p ORDER BY length(p) LIMIT 10
```

***
