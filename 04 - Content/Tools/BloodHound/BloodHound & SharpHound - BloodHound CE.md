---
aliases:
  - BloodHound CE
  - BHCE Install
  - BloodHound Ingest
tags:
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
kind: SubCheatSheet
linked:
  - "[[BloodHound & SharpHound]]"
---
# BloodHound & SharpHound - BloodHound CE

---

## Installation

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -L https://ghst.ly/getbhce \| docker compose -f - up` | Quickstart Docker Compose | Fast install. |
| `git clone https://github.com/SpecterOps/BloodHound.git && cd BloodHound && docker compose up -d` | Manual Docker | Custom config. |
| `bloodhound-cli install` | Helper CLI install | Automated. |
| `http://localhost:8080` | Default URL | UI access. |
| `admin / <generated-on-first-run>` (check container logs) | Default creds | Initial login. |
^ad-bhce-install

```bash
# Quickstart
mkdir bloodhound && cd bloodhound
curl -L https://ghst.ly/getbhce | docker compose -f - up -d

# Get initial admin password
docker compose logs bloodhound 2>&1 | grep "Initial Password Set"

# Access
xdg-open http://localhost:8080
```

---

## Ingest Collection ZIPs

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| Drag-drop ZIP en UI → Settings → Manage Collections | Standard ingest | Web UI. |
| `bloodhound-cli ingest <zip-file>` | CLI ingest | Automation. |
| Multi-domain: drop multiple ZIPs sequentially | Auto-correlate cross-domain | Multi-domain. |
| Reset DB pre-ingest | Settings → Database Management → Reset DB | Fresh start. |
^ad-bhce-ingest

---

## Web UI Navigation

| **Section** | **Qué obtenés** | **Cuándo** |
|:---:|:---:|:---:|
| **Search** | Find principals/objects by name | Quick lookup. |
| **Pathfinding** | Source → Target shortest path | Privesc. |
| **Cypher** | Custom queries panel | Advanced. |
| **Pre-Built Queries** | Built-in saved queries | Standard hunts. |
| **Group Management** | Mark Tier 0 / High Value | Customization. |
| **Settings → Collectors** | Download SharpHound binary actualizado | Setup. |
| **Settings → Manage Collections** | Ingest history + reset | Management. |
^ad-bhce-ui

---

## Mark Owned + High Value

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| Click node → Mark Owned | Marca como compromised (`owned:true`) | Para Cypher `WHERE u.owned`. |
| Click node → Mark High Value | Marca high-value target | Para `WHERE t.highvalue`. |
| Bulk mark via Cypher: `MATCH (u:User) WHERE u.name IN ["A@CORP.LOCAL","B@CORP.LOCAL"] SET u.owned = true` | Bulk script | Multi-user. |
^ad-bhce-marking

```cypher
// Bulk mark owned
MATCH (u) WHERE u.name IN ["JSMITH@CORP.LOCAL","SVC-WEB@CORP.LOCAL"]
SET u.owned = true
RETURN u.name

// Bulk mark high value (custom)
MATCH (g:Group) WHERE g.name CONTAINS "TIER0_ADMINS"
SET g.highvalue = true
RETURN g.name
```

---

## Pre-Built Queries

| **Categoría** | **Queries útiles** |
|:---:|:---:|
| **Domain Information** | List all domain users / computers / GPOs / OUs. |
| **Dangerous Privileges** | Find Domain Admins, Members of priv groups, Computers with UD. |
| **Kerberos Interaction** | Find Kerberoastable, AS-REP Roastable, Constrained Delegation. |
| **Cross-Domain** | Trust relationships, Foreign Group Members. |
| **Active Directory Certificate Services** | ESC1-ESC15 detection (BHCE 5.x+). |
| **Shortest Paths** | From Owned to Domain Admins, To High Value. |
^ad-bhce-prebuilt

---

## API Access

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `curl -X POST http://localhost:8080/api/v2/login -d '{"login_method":"secret","username":"admin","secret":"<pass>"}'` | Login → JWT token | API auth. |
| `curl -H "Authorization: Bearer <jwt>" http://localhost:8080/api/v2/cypher -X POST -d '{"query":"MATCH (n) RETURN COUNT(n)"}'` | Cypher via API | Automation. |
| `curl -H "Authorization: Bearer <jwt>" http://localhost:8080/api/v2/saved-queries` | Listar saved queries | Standard. |
| `bloodhound-cli` | CLI wrapper para API | Easier. |
^ad-bhce-api

```bash
# Get JWT
JWT=$(curl -s -X POST http://localhost:8080/api/v2/login \
  -H "Content-Type: application/json" \
  -d '{"login_method":"secret","username":"admin","secret":"<pass>"}' | jq -r .data.session_token)

# Run Cypher
curl -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
  http://localhost:8080/api/v2/graphs/cypher \
  -X POST -d '{"query":"MATCH (u:User {owned:true}) RETURN u.name"}'
```

---

## Multi-User / Team Setup

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| Settings → Users → Create User | Add team member | Multi-user team. |
| Roles: `Read-Only`, `User`, `PowerUser`, `Admin` | RBAC | Team-based access. |
| Single shared instance + multiple operators | Standard team setup | Engagement. |
^ad-bhce-multiuser

---

## Backup + Restore

| **Comando** | **Qué hace** | **Cuándo** |
|:---:|:---:|:---:|
| `docker compose exec graph-db neo4j-admin database dump --to-path=/tmp neo4j` | Dump Neo4j | Pre-engagement save. |
| `docker compose exec graph-db neo4j-admin database load --from-path=/tmp neo4j` | Restore | Post-reset. |
| Settings → Database Management → Reset DB | Wipe Neo4j | Fresh start. |
^ad-bhce-backup

```bash
# Backup neo4j antes de reset
docker compose exec graph-db neo4j-admin database dump --to-path=/tmp neo4j
docker cp $(docker compose ps -q graph-db):/tmp/neo4j.dump ./bhce-backup-$(date +%F).dump
```

---

## BHCE 6.x New Features

| **Feature** | **Detalle** | **Cuándo** |
|:---:|:---:|:---:|
| OpenGraph (hybrid identity) | Cross-correlation AD + Entra ID nativo | Modern hybrid envs. |
| Forest-wide auto-correlation improved | Cross-domain queries más rápidos | Multi-domain. |
| ADCS edges expandidos (ESC9-15) | Modern ADCS detection | Pre-attack. |
| Kerberoasting prebuilt expanded | New variants | Modern. |
| Performance improvements (PostgreSQL backend) | Modern Neo4j replacement | Speed. |
| API v2 maduro | Automation-friendly | Pipeline. |
^ad-bhce-6x

---
