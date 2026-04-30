---
aliases:
  - BloodHound CE
  - BHCE Install
  - BloodHound Ingest
  - bloodhound-cli
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
# BloodHound & SharpHound - BloodHound CE

***

## Installation

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `git clone https://github.com/SpecterOps/BloodHound` | Clone repo | Standard. |
| `cd BloodHound && docker compose up` | Docker compose start | Standard. |
| `docker compose pull && docker compose up -d` | Update + background | Standard. |
| Default URL: `http://localhost:8080` | Web UI | Standard. |
| Default credentials | `admin` / printed initial password | Standard. |
| Reset password via CLI | `docker exec ...` | Adjacent. |
| Persistent volume: `bloodhound-data-volume` | Standard | Standard. |
| Modern: BHCE 6.x | Latest | Tool. |
| Legacy: BHCE 4.x (Python) | Standard | Standard. |
| Modern: BHCE supports OpenGraph | New format | Modern. |
| Postgres + Neo4j backend | Internal | Standard. |
| Modern Docker compose v2 | Standard | Standard. |
| Multi-architecture support | x86, arm64 | Modern. |
| Memory requirement: 4-8GB | Standard | Adjacent. |
| Disk: ~10GB minimum | Adjacent | Standard. |
^ad-bhce-install

### Quick start

```bash
# Install BloodHound CE via Docker
git clone https://github.com/SpecterOps/BloodHound
cd BloodHound

# Start
docker compose up -d

# Default URL
# http://localhost:8080

# Initial password printed in logs
docker compose logs | grep "Initial Password"

# Default user: admin
```

___

## Ingest Collection ZIPs

| **Step** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| 1. Navigate to `http://localhost:8080` | Web UI | Standard. |
| 2. Settings → File Ingest | Upload area | Standard. |
| 3. Drag-and-drop ZIP files | Multi-file supported | Standard. |
| 4. Wait for ingest progress | Per-file | Standard. |
| 5. Verify domain stats | Confirm | Adjacent. |
| Multiple domains supported | Forest-wide | Standard. |
| Ingest history visible | Audit trail | Adjacent. |
| Re-ingest replaces data | Standard | Adjacent. |
| Modern: BHCE 6.x improved ingest | Faster | Tool. |
| Per-collection: separate ZIPs | Recommended | Standard. |
| Bulk ingest: many ZIPs | Standard | Standard. |
| Cross-domain correlation auto | Standard | Tool. |
| BHCE OpenGraph custom data | Modern | Tool. |
| Custom edge ingest | Modern | Tool. |
| Detection: bulk LDAP collection events | Defender | Adjacent. |
| Compliance: red team scoped | Standard | OPSEC. |
^ad-bhce-ingest

### Ingest workflow

```bash
# After collection
ls *.zip
# 20240101_dom_local.zip
# 20240101_child_dom_local.zip

# Upload via Web UI:
# http://localhost:8080/ui/admin/file-ingest
# Drag + drop ZIPs

# Or via API (modern BHCE 6.x):
curl -X POST "http://localhost:8080/api/v2/file-upload/start" \
  -H "Authorization: Bearer $TOKEN"

# Verify ingest
curl "http://localhost:8080/api/v2/datapipe/status" \
  -H "Authorization: Bearer $TOKEN"
```

___

## Web UI Navigation

| **Section** | **Use** | **Notas** |
|:---:|:---:|:---:|
| Search bar | Find any node | Standard. |
| Pre-built queries | Pre-defined | Standard. |
| Custom Cypher | Advanced | Tool. |
| Path Finder | Source → Destination | Standard. |
| Node info pane | Per-node details | Standard. |
| Graph view | Visual exploration | Standard. |
| Highvalue tag | Tier 0 nodes | Standard. |
| Owned tag | Compromised nodes | Standard. |
| Per-node details | Inbound/outbound rels | Standard. |
| Edge details | Per-edge type explained | Standard. |
| Layout: hierarchical, force-directed | Visualization | Standard. |
| Filter by edge type | Adjacent | Standard. |
| Save query bookmarks | Reuse | Adjacent. |
| Export PNG / JSON | Reportable | Adjacent. |
| Help panel | Tool docs | Standard. |
| Settings: ingest, users, etc. | Admin | Standard. |
^ad-bhce-ui

### UI navigation tips

```
1. Search bar: type name to find user/computer/group/OU
2. Right-click node → "Mark as Owned" / "Mark as High Value"
3. Pre-built queries: Analysis tab → many useful canned queries
4. Custom Cypher: Search bar → toggle to Cypher mode
5. Path Finder: select source + target → finds shortest path
6. Node details: click node → side panel shows attributes + relationships
7. Edge details: click edge → explanation + abuse info
```

___

## Mark Owned + Highvalue

| **Action** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| Mark node as Owned | Compromised principals | Standard. |
| Mark node as Highvalue | Critical targets | Standard. |
| Right-click node | Context menu | Standard. |
| `MATCH (n) WHERE n.name = "USER@DOM" SET n.owned = true` | Cypher direct | Adjacent. |
| Owned propagates analysis | Pre-built queries use | Standard. |
| Highvalue auto-set on Tier 0 groups | Default | Standard. |
| Custom Highvalue tag per-org | Manual | Standard. |
| Bulk owned mark via Cypher | Standard | Tool. |
| Detection: ownership marking | N/A (in BHCE only) | Adjacent. |
| Modern: BHCE 6.x improved tags | Modern | Tool. |
| Per-engagement scope | Standard | OPSEC. |
| Cross-correlate with priv tier | Standard | Audit. |
| Compliance: documented baseline | Standard | Adjacent. |
| Custom analytics scripts | Tool. |
| Audit baseline | Standard | Compliance. |
| Adjacent: BHCE 6.x changelog | Tool docs | Reference. |
^ad-bhce-marking

### Marking nodes

```cypher
// Bulk mark owned
MATCH (u:User) WHERE u.name IN ["USER1@DOM", "USER2@DOM"]
SET u.owned = true

// Custom highvalue tag
MATCH (g:Group) WHERE g.name = "TIER0-ADMINS@DOM"
SET g.highvalue = true

// View all owned
MATCH (n) WHERE n.owned = true RETURN n.name
```

___

## Pre-Built Queries

| **Query** | **Use** | **Notas** |
|:---:|:---:|:---:|
| Find all Domain Admins | Standard | Pre-built. |
| Shortest paths to Domain Admins | Standard | Pre-built. |
| Find Kerberoastable accounts | Standard | Pre-built. |
| Find AS-REP roastable accounts | Standard | Pre-built. |
| Find computers with unconstrained delegation | Standard | Pre-built. |
| Map domain trusts | Standard | Pre-built. |
| Find principals with DCSync rights | Standard | Pre-built. |
| Find AdminSDHolder modify rights | Standard | Pre-built. |
| Find LAPS readers | Modern | Pre-built. |
| Find ESC1 vulnerable templates | ADCS | Pre-built. |
| Find shortest paths from Domain Users to high value | Critical | Pre-built. |
| Find foreign principals | Cross-trust | Pre-built. |
| Find computers with shared local admin | Lateral | Pre-built. |
| Modern BHCE 6.x improved queries | Updated | Tool. |
| Custom queries via UI | Adjacent | Standard. |
| Adjacent: Cypher cheatsheet | Reference | Standard. |
^ad-bhce-prebuilt

### Pre-built query examples

```
BHCE 6.x → Analysis tab → Pre-built queries

Useful first runs:
1. "Find all Domain Admins"
2. "Find shortest paths to Domain Admins from Domain Users"
3. "Find Kerberoastable accounts"
4. "Find all unconstrained delegation"
5. "Find principals with DCSync rights"
6. "Find LAPS readers"
7. "Find ESC1 vulnerable certificate templates"
8. "Map domain trusts"
```

___

## API Access

| **Endpoint** | **Use** | **Notas** |
|:---:|:---:|:---:|
| `POST /api/v2/login` | Authenticate | Standard. |
| `GET /api/v2/domains` | List domains | Standard. |
| `GET /api/v2/users` | List users | Standard. |
| `POST /api/v2/graphs/cypher` | Run Cypher | Standard. |
| `POST /api/v2/file-upload/start` | Start ingest | Standard. |
| Authentication: Bearer token | Standard | Standard. |
| API docs: `/api/v2/docs` | Built-in | Standard. |
| Modern BHCE 6.x improved API | Updated | Tool. |
| Programmatic queries | Automation | Adjacent. |
| Custom integrations | Per-org | Edge. |
| Detection: API access logs | Defender | Adjacent. |
| Compliance: red team scoped | Standard | OPSEC. |
| Modern: continuous monitoring | Defender side | Adjacent. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Audit log retention | Standard | Adjacent. |
| Modern: extreme alerting | Best practice | Standard. |
^ad-bhce-api

### API usage

```bash
# Login + token
TOKEN=$(curl -s -X POST "http://localhost:8080/api/v2/login" \
  -H "Content-Type: application/json" \
  -d '{"login_method":"secret","secret":"password","username":"admin"}' | \
  jq -r '.data.session_token')

# List domains
curl -s "http://localhost:8080/api/v2/domains" \
  -H "Authorization: Bearer $TOKEN" | jq

# Run Cypher
curl -X POST "http://localhost:8080/api/v2/graphs/cypher" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"MATCH (n) RETURN count(n)"}'
```

___

## Multi-User / Team Setup

| **Concepto** | **Detalle** | **Notas** |
|:---:|:---:|:---:|
| Per-user accounts | Multi-tenant | Standard. |
| Role-based permissions | Standard | Standard. |
| Admin role | Full access | Standard. |
| User role | Read-only typically | Standard. |
| Per-engagement workspace | Isolation | Adjacent. |
| Modern: BHCE 6.x improved RBAC | Modern | Tool. |
| API tokens per-user | Programmatic access | Standard. |
| Audit log per-user actions | Adjacent | Standard. |
| Backup + restore | Standard | Adjacent. |
| Cross-engagement data isolation | Per-instance | Adjacent. |
| Compliance: documented users | Standard | Adjacent. |
| Detection: BHCE access logs | Adjacent | Standard. |
| Modern: continuous monitoring | Defender side | Adjacent. |
| Cross-correlate with engagements | Per-engagement | Standard. |
| Audit baseline | Standard | Compliance. |
| Modern: extreme audit | Best practice | Standard. |
^ad-bhce-multiuser

### User management

```bash
# Add user (privileged admin)
docker exec -it bloodhound-app /bin/sh

# Inside container:
# /opt/bloodhound/bhapi user create --name "user1" --role "user"
```

___

## Backup + Restore

| **Comando** | **Función** | **Notas** |
|:---:|:---:|:---:|
| `docker compose down` | Stop services | Standard. |
| Backup volume `bloodhound-data-volume` | Standard | Standard. |
| `docker run --rm -v bloodhound-data-volume:/source -v $(pwd):/backup ubuntu tar czf /backup/bh_backup.tar.gz /source` | Tar volume | Standard. |
| Restore: `docker run --rm -v bloodhound-data-volume:/dest -v $(pwd):/backup ubuntu tar xzf /backup/bh_backup.tar.gz -C /dest` | Restore | Standard. |
| `docker compose up -d` | Start | Standard. |
| Modern: BHCE 6.x export/import features | Tool | Standard. |
| Per-engagement export | Adjacent | Adjacent. |
| Cross-platform restore | Standard | Standard. |
| Compliance: documented backups | Standard | Adjacent. |
| Audit log retention | Standard | Adjacent. |
| Modern: continuous backup | Defender | Adjacent. |
| Cross-correlate with engagement | Per-engagement | Standard. |
| Cleanup post-engagement | Standard | OPSEC. |
| Modern: extreme audit | Best practice | Standard. |
| Adjacent: BHCE 6.x docs | Reference | Tool. |
| Per-engagement isolation | Standard | Adjacent. |
^ad-bhce-backup

### Backup script

```bash
# Stop BHCE
docker compose down

# Backup data volume
docker run --rm \
  -v bloodhound-data-volume:/source \
  -v $(pwd):/backup \
  ubuntu tar czf /backup/bhce_backup_$(date +%Y%m%d).tar.gz -C /source .

# Restart
docker compose up -d
```

___

## BHCE 6.x New Features

| **Feature** | **Detail** | **Notas** |
|:---:|:---:|:---:|
| OpenGraph custom data ingest | New format | Modern. |
| Improved ADCS support | ESC1-ESC15 paths | Modern. |
| Enhanced delegation edges | RBCD + ShadowCred | Modern. |
| Improved cross-domain | Forest-wide queries | Modern. |
| Better LAPS support | LAPSv2 paths | Modern. |
| Better gMSA support | Modern | Tool. |
| Modern Cypher engine | Performance | Modern. |
| Improved Web UI | UX | Modern. |
| Custom analytics scripts | Tool. |
| Compliance baseline queries | Standard | Adjacent. |
| Audit log retention | Standard | Adjacent. |
| Modern: extreme alerting | Critical | Standard. |
| Detection: BHCE 6.x signatures | Defender | Adjacent. |
| Cross-correlate with priv tier | Standard | Audit. |
| Modern: continuous BHCE | Defender side | Adjacent. |
| Adjacent: ADCS Enumeration hub | Cross-ref | Adjacent. |
^ad-bhce-6x

### BHCE 6.x highlights

- ADCS ESC paths automated
- LAPSv2 + gMSA edges native
- Cross-domain queries improved
- OpenGraph for custom integrations
- Cypher performance optimization
- Modern Web UI with bookmarks

___

## Wordlists & Recursos

| **Recurso** | **URL / Path** | **Notas** |
|:---:|:---:|:---:|
| BloodHound CE docs | `bloodhound.specterops.io` | Tool docs. |
| BHCE GitHub | `github.com/SpecterOps/BloodHound` | Source. |
| BHCE 6.x changelog | Per-release | Tool. |
| Specter Ops blog | `posts.specterops.io` | Research. |
| BloodHound Slack | Community | Discussion. |
| Compass Security queries | `github.com/CompassSecurity/BloodHoundQueries` | Custom queries. |
| HackTricks BloodHound | `book.hacktricks.xyz` | Reference. |
| The Hacker Recipes | `thehacker.recipes/ad/recon` | Reference. |
| Modern: continuous BHCE | Defender side | Standard. |
| `awesome-active-directory` | GitHub | Foundation. |
| Will Schroeder research | Specter Ops | Adversary. |
| Adjacent: AzureHound docs | Cloud | Modern. |
| Per-engagement scoping | Standard | OPSEC. |
| Compliance: red team standard | Standard | Industry. |
| Modern: continuous defender side | Standard | Defender. |
| Cross-correlate with engagement | Per-engagement | Standard. |
^ad-bhce-resources

***
