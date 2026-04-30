---
aliases:
  - Multi-Domain BloodHound
  - Forest BloodHound
  - Cross-Trust BHCE
  - BHCE Forest Workflow
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
# BloodHound & SharpHound - Multi-Domain & Forest

***

## Multi-Domain Collection Workflow

| **Step** | **Comando** | **Notas** |
|:---:|:---:|:---:|
| 1. Identify forest topology | `Get-ADForest` | Standard. |
| 2. Per-domain SharpHound | `SharpHound -d childdom -c All --OutputDirectory loot/childdom` | Standard. |
| 3. Per-domain BloodHound.py | `bloodhound-python -d childdom -u user@childdom -p pass -ns DC -c All --zip` | Linux. |
| 4. Per-domain RustHound | `rusthound -d childdom -u user@childdom -p pass --zip -o loot/childdom/` | Modern. |
| 5. Multi-domain ingest | Drag all ZIPs into BHCE | Standard. |
| 6. Auto-correlate cross-domain | BHCE 6.x | Tool. |
| 7. Cypher cross-domain queries | Custom | Standard. |
| Per-domain auth required | Standard | Standard. |
| Trust account auth (cross-domain) | Edge | Adjacent. |
| Modern: BHCE 6.x improved cross-domain | Standard | Tool. |
| Detection: multi-domain queries | Defender | Adjacent. |
| OPSEC: per-domain pacing | Stealth | OPSEC. |
| Compliance: documented per-domain | Standard | Adjacent. |
| Cross-correlate trust attributes | Standard | Audit. |
| Adjacent: Trust hub | Cross-ref | Adjacent. |
| Audit baseline | Standard | Compliance. |
^ad-multidom-workflow

### Multi-domain collection

```bash
# Bash forest collection
forest_domains="domA.local domB.local domC.local"

for dom in $forest_domains; do
  echo "=== Collecting $dom ==="
  
  # Find DC
  dc=$(dig +short SRV _ldap._tcp.dc._msdcs.$dom | awk '{print $4}' | head -1 | sed 's/\.$//')
  
  # BloodHound.py
  bloodhound-python -d $dom -u user@$dom -p pass -ns $dc -c All --zip -o ./loot/$dom/
done

# Ingest all in BHCE Web UI
```

___

## Cross-Domain Cypher Queries

| **Query** | **Use** | **Notas** |
|:---:|:---:|:---:|
| `MATCH (u:User), (g:Group {name: "...@FOREIGN"})` | Cross-domain target | Standard. |
| `WHERE u.domain <> g.domain` | Filter cross-domain | Standard. |
| `MATCH (a:Domain)-[:Trusts]->(b:Domain)` | Trust relationships | Standard. |
| `WHERE r.istransitive = true` | Transitive trusts | Standard. |
| `WHERE r.direction = "Outbound"` | Direction filter | Standard. |
| Cross-trust foreign principals | Critical | Audit. |
| Cross-domain DCSync paths | Forest takeover | Critical. |
| Cross-trust ACL chains | Cross-forest privesc | Critical. |
| Modern BHCE 6.x improved | Standard | Tool. |
| Per-trust attribute filter | Standard | Standard. |
| Cross-correlate trust direction | Standard | Audit. |
| Detection: cross-domain queries | Defender | Adjacent. |
| Adjacent: Trust hub | Cross-ref | Adjacent. |
| Custom analytics | Tool. |
| OPSEC: targeted vs bulk | Trade-off | OPSEC. |
| Modern: continuous BHCE | Defender side | Adjacent. |
^ad-multidom-cypher

### Cross-domain queries

```cypher
// All trusts visualization
MATCH (a:Domain)-[r:Trusts]->(b:Domain) RETURN a, r, b

// Foreign principals in priv groups (cross-trust)
MATCH (u)-[:MemberOf*1..]->(g:Group {adminCount: true})
WHERE u.domain <> g.domain
RETURN u.name, u.domain, g.name, g.domain

// Cross-trust DCSync
MATCH (u)-[:GetChanges|GetChangesAll]->(d:Domain)
WHERE u.domain <> d.name
RETURN u.name, u.domain, d.name

// Path from owned in dom-A → DA in dom-B
MATCH (u {owned: true}), (g:Group {name: "DOMAIN ADMINS@DOM-B.LOCAL"})
MATCH p=shortestPath((u)-[*1..]->(g))
RETURN p

// Forest-wide most-exposed users
MATCH (u:User {enabled: true})
WHERE u.adminCount = true
WITH u, COUNT { (other)-[*1..10]->(u) } AS exposure
RETURN u.name, u.domain, exposure ORDER BY exposure DESC LIMIT 20
```

___

## Cross-Trust Authentication

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Forest trust auth | Forest-wide | Standard. |
| External trust auth | Limited scope | Adjacent. |
| Realm trust (MIT KDC) | Edge | Edge. |
| `runas /netonly /user:OTHERDOM\user` | Cross-trust auth | Standard. |
| `bloodhound-python -d FOREIGN -u user@FOREIGN -p pass` | Cross-trust collection | Adjacent. |
| Trust password discovery via DCSync | Adjacent | Adjacent. |
| Inter-realm TGT forge | Edge | Adjacent. |
| Cross-trust Kerberoast | Edge | Adjacent. |
| Detection: cross-trust auth | Defender | Adjacent. |
| Modern: extreme alerting cross-trust | Critical | Standard. |
| Adjacent: Trust hub | Cross-ref | Adjacent. |
| Compliance: documented per-trust | Standard | Adjacent. |
| Cross-correlate trust attributes | Standard | Audit. |
| Modern: continuous BHCE | Defender side | Adjacent. |
| OPSEC: cross-trust loud | Defender | OPSEC. |
| Audit log retention | Standard | Adjacent. |
^ad-multidom-auth

___

## SID Filtering Considerations

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| SID Filtering enabled cross-trust | Default forest trust | Hardening. |
| Disabled cross-trust = forest takeover | Critical | Critical. |
| Detection via trust attributes | Standard | Audit. |
| `Get-ADTrust -Properties SIDFilteringForestAware,SIDFilteringQuarantined` | RSAT | Standard. |
| Cross-correlate with priv | Standard | Audit. |
| Modern: extreme audit cross-trust | Best practice | Standard. |
| Adjacent: Trust hub | Cross-ref | Adjacent. |
| Adjacent: Authentication & SID Filtering | Cross-ref | Adjacent. |
| Detection: SID Filtering modify events | Defender | Adjacent. |
| BloodHound trust attribute analysis | Modern | Tool. |
| Compliance: documented baseline | Standard | Adjacent. |
| Audit: per-quarter cross-trust | Standard | Compliance. |
| Cleanup: post-engagement | Standard | OPSEC. |
| Modern: continuous BHCE | Defender side | Adjacent. |
| Cross-correlate trust direction | Standard | Audit. |
| Audit log retention | Standard | Adjacent. |
^ad-multidom-sidfilter

___

## Modern BHCE 6.x Forest Support

| **Feature** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Auto cross-domain correlation | Standard | Tool. |
| Forest-wide pre-built queries | Standard | Tool. |
| OpenGraph for hybrid identity | Modern | Tool. |
| Improved trust analysis | Standard | Tool. |
| Per-domain ingest | Standard | Adjacent. |
| Modern Cypher engine | Performance | Modern. |
| Forest trust visualization | Standard | Tool. |
| Cross-correlate Azure AD | Hybrid | Modern. |
| Cross-correlate AzureHound | Cloud | Modern. |
| Custom analytics scripts | Tool. |
| Compliance: BHCE 6.x baseline | Standard | Adjacent. |
| Audit log retention | Standard | Adjacent. |
| Detection: BHCE 6.x events | Defender | Adjacent. |
| Modern: continuous BHCE | Defender side | Adjacent. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Adjacent: BloodHound CE hub | Cross-ref | Adjacent. |
^ad-multidom-bhce6

___

## OPSEC Multi-Domain

| **Aspect** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Per-domain pacing | Stealth | OPSEC. |
| Time-of-day pacing | Match legit | Stealth. |
| Per-domain credentials | Different per-domain | Adjacent. |
| OPSEC: targeted vs bulk | Trade-off | OPSEC. |
| Detection: cross-domain bulk | Defender ML | Modern. |
| Modern: BHCE 6.x continuous | Defender side | Adjacent. |
| Compliance: red team scoped | Standard | OPSEC. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Modern: extreme alerting | Critical | Standard. |
| Cleanup post-engagement | Standard | OPSEC. |
| Per-domain ingest separate | Isolation | Adjacent. |
| Audit log retention | Standard | Adjacent. |
| Cross-correlate trust direction | Standard | Audit. |
| OPSEC: stealth flags per collector | Standard | Standard. |
| Detection: per-domain alerts | Defender | Adjacent. |
| Modern: continuous monitoring | Defender side | Adjacent. |
^ad-multidom-opsec

***
