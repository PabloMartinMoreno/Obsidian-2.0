---
aliases:
  - "BloodHound Enumeration"
  - BloodHound
  - SharpHound
  - bloodhound-python
  - RustHound
  - BloodHound CE
tags:
  - type/vulnerability
  - vuln/ad-enumeration
  - technique/discovery
  - asset/active-directory
primary categories:
  - "[[Red Team]]"
secondary categories:
  - "[[Active Directory]]"
  - "[[Information Gathering]]"
tertiary categories:
  - "[[Active Directory Enumeración]]"
kind: CheatSheet
linked:
  - "[[BloodHound & SharpHound - Collectors]]"
  - "[[BloodHound & SharpHound - BloodHound CE]]"
  - "[[BloodHound & SharpHound - Cypher Queries]]"
  - "[[BloodHound & SharpHound - Edges y Analytics]]"
  - "[[BloodHound & SharpHound - Multi-Domain y Forest]]"
  - "[[BloodHound & SharpHound - Tooling Ecosystem]]"
  - "[[AD - ACL Enumeration]]"
  - "[[AD - Hosts Enumeration]]"
  - "[[netexec]]"
---
# BloodHound & SharpHound

***

## Cheatsheet

### 🔍 Collectors

````tabs
tab: **SharpHound (Default Windows)**
![[BloodHound & SharpHound - Collectors#^ad-bh-sharphound]]

tab: **SharpHound Collection Methods**
![[BloodHound & SharpHound - Collectors#^ad-bh-methods]]

tab: **RustHound (Cross-Platform)**
![[BloodHound & SharpHound - Collectors#^ad-bh-rusthound]]

tab: **BloodHound.py (Linux)**
![[BloodHound & SharpHound - Collectors#^ad-bh-python]]

tab: **AzureHound (Cloud)**
![[BloodHound & SharpHound - Collectors#^ad-bh-azurehound]]

tab: **Comparison**
![[BloodHound & SharpHound - Collectors#^ad-bh-comparison]]

tab: **Collection OPSEC**
![[BloodHound & SharpHound - Collectors#^ad-bh-opsec]]

tab: **Cross-Domain Collection**
![[BloodHound & SharpHound - Collectors#^ad-bh-multidomain]]

tab: **Continuous Loop Mode**
![[BloodHound & SharpHound - Collectors#^ad-bh-loop]]
````

### 📊 BloodHound CE

````tabs
tab: **Installation**
![[BloodHound & SharpHound - BloodHound CE#^ad-bhce-install]]

tab: **Ingest Collection ZIPs**
![[BloodHound & SharpHound - BloodHound CE#^ad-bhce-ingest]]

tab: **Web UI Navigation**
![[BloodHound & SharpHound - BloodHound CE#^ad-bhce-ui]]

tab: **Mark Owned + Highvalue**
![[BloodHound & SharpHound - BloodHound CE#^ad-bhce-marking]]

tab: **Pre-Built Queries**
![[BloodHound & SharpHound - BloodHound CE#^ad-bhce-prebuilt]]

tab: **API Access**
![[BloodHound & SharpHound - BloodHound CE#^ad-bhce-api]]

tab: **Multi-User / Team Setup**
![[BloodHound & SharpHound - BloodHound CE#^ad-bhce-multiuser]]

tab: **Backup + Restore**
![[BloodHound & SharpHound - BloodHound CE#^ad-bhce-backup]]

tab: **BHCE 6.x New Features**
![[BloodHound & SharpHound - BloodHound CE#^ad-bhce-6x]]
````

### 🎯 Cypher Queries

````tabs
tab: **Cypher Syntax Basics**
![[BloodHound & SharpHound - Cypher Queries#^ad-cypher-basics]]

tab: **Path Queries**
![[BloodHound & SharpHound - Cypher Queries#^ad-cypher-paths]]

tab: **Common Edge Filters**
![[BloodHound & SharpHound - Cypher Queries#^ad-cypher-edges]]

tab: **Privesc Path Queries**
![[BloodHound & SharpHound - Cypher Queries#^ad-cypher-privesc]]

tab: **Lateral Movement Queries**
![[BloodHound & SharpHound - Cypher Queries#^ad-cypher-lateral]]

tab: **Kerberoast / AS-REP**
![[BloodHound & SharpHound - Cypher Queries#^ad-cypher-kerberoast]]

tab: **DCSync Queries**
![[BloodHound & SharpHound - Cypher Queries#^ad-cypher-dcsync]]

tab: **Delegation Queries**
![[BloodHound & SharpHound - Cypher Queries#^ad-cypher-deleg]]

tab: **ADCS Queries (BHCE 5.x+)**
![[BloodHound & SharpHound - Cypher Queries#^ad-cypher-adcs]]

tab: **Custom Reporting**
![[BloodHound & SharpHound - Cypher Queries#^ad-cypher-reporting]]

tab: **Cypher Performance Tips**
![[BloodHound & SharpHound - Cypher Queries#^ad-cypher-perf]]
````

### 📋 Edges & Analytics

````tabs
tab: **ACL Edges**
![[BloodHound & SharpHound - Edges y Analytics#^ad-edges-acl]]

tab: **DCSync Edges**
![[BloodHound & SharpHound - Edges y Analytics#^ad-edges-dcsync]]

tab: **Lateral Movement Edges**
![[BloodHound & SharpHound - Edges y Analytics#^ad-edges-lateral]]

tab: **Delegation Edges**
![[BloodHound & SharpHound - Edges y Analytics#^ad-edges-deleg]]

tab: **ADCS Edges**
![[BloodHound & SharpHound - Edges y Analytics#^ad-edges-adcs]]

tab: **Trust Edges**
![[BloodHound & SharpHound - Edges y Analytics#^ad-edges-trust]]

tab: **GPO Edges**
![[BloodHound & SharpHound - Edges y Analytics#^ad-edges-gpo]]

tab: **Container Edges**
![[BloodHound & SharpHound - Edges y Analytics#^ad-edges-container]]

tab: **Common Analytics Patterns**
![[BloodHound & SharpHound - Edges y Analytics#^ad-edges-patterns]]

tab: **BHCE 6.x Performance**
![[BloodHound & SharpHound - Edges y Analytics#^ad-edges-bhce6]]
````

### 🔄 Multi-Domain & Forest

````tabs
tab: **Multi-Domain Workflow**
![[BloodHound & SharpHound - Multi-Domain y Forest#^ad-multidom-workflow]]

tab: **Cross-Domain Cypher**
![[BloodHound & SharpHound - Multi-Domain y Forest#^ad-multidom-cypher]]

tab: **Cross-Trust Authentication**
![[BloodHound & SharpHound - Multi-Domain y Forest#^ad-multidom-auth]]

tab: **SID Filtering Considerations**
![[BloodHound & SharpHound - Multi-Domain y Forest#^ad-multidom-sidfilter]]

tab: **BHCE 6.x Forest Support**
![[BloodHound & SharpHound - Multi-Domain y Forest#^ad-multidom-bhce6]]

tab: **OPSEC Multi-Domain**
![[BloodHound & SharpHound - Multi-Domain y Forest#^ad-multidom-opsec]]
````

### 🛠️ Tooling Ecosystem

````tabs
tab: **Custom Query Repos**
![[BloodHound & SharpHound - Tooling Ecosystem#^ad-bhtool-customqueries]]

tab: **bloodhound-cli (Modern)**
![[BloodHound & SharpHound - Tooling Ecosystem#^ad-bhtool-cli]]

tab: **SOAPHound (Stealth)**
![[BloodHound & SharpHound - Tooling Ecosystem#^ad-bhtool-soaphound]]

tab: **ldeep (Linux LDAP Dump)**
![[BloodHound & SharpHound - Tooling Ecosystem#^ad-bhtool-ldeep]]

tab: **ADRecon Bulk Reports**
![[BloodHound & SharpHound - Tooling Ecosystem#^ad-bhtool-adrecon]]

tab: **OpenGraph (BHCE 6.x)**
![[BloodHound & SharpHound - Tooling Ecosystem#^ad-bhtool-opengraph]]

tab: **BHCE Integrations**
![[BloodHound & SharpHound - Tooling Ecosystem#^ad-bhtool-integrations]]

tab: **Specter Ops Tools**
![[BloodHound & SharpHound - Tooling Ecosystem#^ad-bhtool-specterops]]

tab: **Wordlists & Recursos**
![[BloodHound & SharpHound - Tooling Ecosystem#^ad-bhtool-resources]]
````

___

## Overview

**BloodHound & SharpHound** = standard de facto para AD attack path analysis. SharpHound (collector) recolecta datos de AD vía LDAP + SMB queries. BloodHound CE (analyzer) ingesta datos + provee Cypher queries + visual graph. Foundation crítica para todo recon AD moderno.

Pre-BloodHound: red team manual ACL audit + correlate. Post-BloodHound: automated graph + pre-built queries + Cypher custom analytics. Modern: BHCE 6.x con ADCS + LAPSv2 + gMSA + improved cross-domain support.

### Cuándo es alto impacto

| BloodHound enum (info) | BloodHound como input |
|---|---|
| Comprehensive AD inventory | Identify all attack paths (input) |
| Visual privesc paths | Strategic planning (input) |
| ACL chain analysis | Direct privesc target identification |
| Cross-domain trust paths | Forest takeover planning (CVSS Critical) |
| ADCS ESC paths | Cert-based privesc (CVSS Critical) |
| Delegation paths | UD/CD/RBCD chains (CVSS Critical) |
| Foreign principals analysis | Cross-trust risks (CVSS Critical) |
| Custom Cypher analytics | Per-engagement strategy |

### Diferencia con otros enum hubs

| | **BloodHound** | **Manual Enum** |
|---|---|---|
| Foco | Visual graph + automated paths | Per-attribute manual queries |
| Output | Graph + Cypher analytics | Ad-hoc results |
| Speed | Fast post-collection | Slow manual |
| Comprehensiveness | All ACL/relationships | Partial |
| Tooling | SharpHound, RustHound, BHCE | netexec, ldapsearch, dsacls |
| Combine con | All AD attacks | Per-attack specific |
| Modern: industry standard | Standard | Adjacent |

___

## Workflow

```
1. Install BHCE:
   - git clone github.com/SpecterOps/BloodHound
   - docker compose up -d
   - http://localhost:8080

2. Choose collector + auth:
   - SharpHound (Windows)
   - RustHound (Linux/Cross)
   - BloodHound.py (Linux)
   - AzureHound (Cloud)

3. Run collection:
   - SharpHound -c All (or DCOnly for stealth)
   - bloodhound-python -d dom -u u -p p -ns DC -c All --zip
   - Per-domain for forest

4. Ingest ZIPs:
   - Drag-and-drop in BHCE Web UI
   - Auto-correlate cross-domain

5. Mark owned + highvalue:
   - Right-click compromised principals → Mark Owned
   - Verify Tier 0 highvalue auto-detection

6. Run pre-built queries:
   - Find Domain Admins
   - Shortest paths to DA
   - Find Kerberoastable
   - Find unconstrained delegation
   - Find ESC1 vulnerable templates
   - Find LAPS readers

7. Custom Cypher analytics:
   - ACL chain analysis
   - Cross-domain paths
   - Foreign principal analysis
   - Stale priv users
   - Compliance baseline diff

8. Plan exploitation:
   - Per-path strategic decision
   - Per-engagement scope
   - OPSEC: targeted exploitation

9. Cleanup post-engagement:
   - BHCE collection ZIPs cleanup
   - Document findings
   - Per-engagement reports
```

___

## Detección rápida

### Probes mínimos

```bash
DC="dc01.dom.local"
USER="user"; PASS="pass"

# 1. BloodHound.py default collection (Linux)
bloodhound-python -d dom.local -u $USER -p $PASS -ns $DC -c All --zip

# 2. RustHound (faster)
rusthound -d dom.local -u $USER -p $PASS --zip

# 3. SharpHound (Windows)
SharpHound.exe -c Default

# 4. Ingest in BHCE
# http://localhost:8080 → Settings → File Ingest → drag-and-drop ZIP

# 5. Pre-built queries:
# - Find all Domain Admins
# - Find shortest paths to Domain Admins
# - Find Kerberoastable
# - Find unconstrained delegation
# - Find LAPS readers
# - Find ESC1 vulnerable templates
```

___

## Impacto

- **Visual privesc paths** — strategic planning.
- **ACL chain analysis** — automated discovery vs manual.
- **Cross-domain trust paths** — forest takeover planning.
- **ADCS ESC paths** — automated cert-based privesc identification.
- **Delegation paths** — UD/CD/RBCD chains.
- **Foreign principals analysis** — cross-trust risks.
- **Tier 0 mapping** — privileged target identification.
- **Stale priv users** — audit candidates.
- **Service account analysis** — common misconfig discovery.
- **Custom Cypher analytics** — per-engagement strategy.
- **Compliance baseline** — defender side audit.
- **BHCE 6.x: ADCS + LAPSv2 + gMSA** — modern coverage.
- **OpenGraph custom data** — hybrid identity.

___

## Mitigación (defender)

- **Detection: BloodHound collection events**:
  ```
  Event ID 1644 (LDAP query — bulk)
  Event ID 4662 (object access — ACL queries)
  Event ID 4624 (logon — for sessions)
  ```
- **Microsoft Defender for Identity** — BloodHound activity detection.
- **PingCastle / Purple Knight** — defender-side audit (similar coverage).
- **BloodHound Enterprise** — continuous defender monitoring.
- **Detection rules**:
  - SharpHound binary signatures
  - bloodhound-python network signatures
  - SOAPHound SOAP signatures
- **Honeypot accounts** — alert on enumeration.
- **Per-OU restricted LDAP queries** — limit Authenticated Users read.
- **LDAP signing required** — modern hardening.
- **Modern: continuous monitoring** — defender side.
- **Compliance: documented BHCE baseline** — defender side.
- **Per-quarter ACL audit using BHCE** — proactive.
- **Audit log retention** — standard.
- **Modern: extreme alerting BloodHound activity** — critical.
- **Cross-correlate with engagement** — known scope.
- **Adjacent: All enum hubs** — cross-ref.

___

## Para entender BloodHound

**Por qué BloodHound transformative:**

Pre-2017 (BloodHound launch): manual ACL queries, spreadsheet correlation, time-consuming. Post-2017: automated graph + pre-built Cypher queries. Path-finding to DA = single query, instant. Modern industry standard for both red team + defender side.

**Por qué SharpHound default collector:**

Mature, comprehensive, Windows-native. Multiple collection methods. Loop mode for sessions. Stealth flag. EDR-aware. Modern alternatives (RustHound, BloodHound.py) emerging but SharpHound still standard.

**Por qué Cypher matters:**

Graph database queries. Learn syntax → arbitrary analytics. Pre-built queries cover 80% of use cases. Custom Cypher for per-engagement strategy. Compliance baseline via documented Cypher baselines.

**Por qué BHCE 6.x advances:**

Improved ADCS ESC1-ESC15 native support. LAPSv2 + gMSA edges. Cross-domain auto-correlation. Modern Cypher engine performance. OpenGraph custom data ingest. Integrations (Slack, SIEM, etc.).

**Por qué multiple collectors:**

Different platforms (Windows / Linux / Cloud). Different stealth profiles. Different feature sets. SharpHound mature on Windows. RustHound modern + cross-platform. BloodHound.py Linux mature. AzureHound for cloud. Choose per-engagement.

**Por qué cross-domain ingest critical:**

Forest = multiple domains. Cross-domain paths = forest-wide privesc. BHCE auto-correlates cross-domain after multi-ingest. Trust attribute analysis. Foreign principal cross-trust risks.

**Por qué OpenGraph is modern:**

Custom node/edge ingest beyond AD. Hybrid identity (Azure AD), custom integrations, per-org context. BHCE 6.x feature. Standard format JSON. Extensible.

___

## Recursos

- [BloodHound CE docs](https://bloodhound.specterops.io/) — tool docs.
- [BloodHound CE GitHub](https://github.com/SpecterOps/BloodHound) — source.
- [BloodHound Enterprise docs](https://support.bloodhoundenterprise.io/) — commercial.
- [Specter Ops blog](https://posts.specterops.io/) — research.
- [BloodHound Slack](https://bloodhound.slack.com) — community.
- [SharpHound GitHub](https://github.com/SpecterOps/SharpHound) — collector.
- [RustHound](https://github.com/OPENCYBER-FR/RustHound) — modern collector.
- [BloodHound.py](https://github.com/dirkjanm/BloodHound.py) — Linux collector.
- [AzureHound](https://github.com/BloodHoundAD/AzureHound) — cloud collector.
- [Compass Security queries](https://github.com/CompassSecurity/BloodHoundQueries) — custom queries.
- [haus3c queries](https://github.com/haus3c/bloodhound-Custom-Queries) — adjacent.
- [SOAPHound](https://github.com/FalconForceTeam/SOAPHound) — stealth alternative.
- [ldeep](https://github.com/franc-pentest/ldeep) — Linux LDAP dump.
- [HackTricks BloodHound](https://book.hacktricks.xyz/) — reference.
- [The Hacker Recipes](https://www.thehacker.recipes/ad/recon) — reference.
- [`awesome-active-directory`](https://github.com/Orange-Cyberdefense/awesome-active-directory) — curated.

***
